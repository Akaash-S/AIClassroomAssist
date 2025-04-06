import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  storeUserInFirestore,
  getUserFromFirestore,
  checkEmailExistsInFirestore
} from "./firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { apiRequest } from "./queryClient";

interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  id: number;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, displayName: string, role: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Don't use hooks like useToast at the component level for conditional usage
  // We'll use it directly in the methods where needed

  // Check if user exists in database by uid and create if new
  const syncUserWithDatabase = async (firebaseUser: FirebaseUser): Promise<AuthUser | null> => {
    try {
      // First check if the user exists in Firestore
      const firestoreUser = await getUserFromFirestore(firebaseUser.uid);
      
      if (!firestoreUser) {
        // If user is not in Firestore, sign them out and return null
        console.error("User not found in Firestore");
        return null;
      }
      
      // Now check if the user exists in our PostgreSQL database
      try {
        const userData = await apiRequest<any>(`/api/users/uid/${firebaseUser.uid}`);
        
        // Verify that the user's role matches between Firestore and PostgreSQL
        if (userData.role !== firestoreUser.role) {
          console.error("User role mismatch between Firestore and database");
          return null;
        }
        
        return {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          id: userData.id
        };
      } catch (error) {
        if ((error as Error).message.includes('404')) {
          // User doesn't exist in our database and needs to be created
          return null;
        } else {
          throw new Error("Failed to fetch user data");
        }
      }
    } catch (error) {
      console.error("Error syncing user with database:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if the user exists in our database
          const dbUser = await syncUserWithDatabase(firebaseUser);
          
          if (dbUser) {
            setUser(dbUser);
          } else {
            // If the user doesn't exist in our database, sign them out from Firebase
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error("Error handling auth state change:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    // We'll manually handle notifications since useToast can't be used directly here
    setLoading(true);
    try {
      // Check if email exists in Firestore
      const emailExists = await checkEmailExistsInFirestore(email);
      
      if (!emailExists) {
        console.error("No account found with this email");
        throw new Error("No account found with this email");
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const dbUser = await syncUserWithDatabase(firebaseUser);
      if (!dbUser) {
        throw new Error("User not found in database");
      }
      
      setUser(dbUser);
      return dbUser;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string, role: string): Promise<AuthUser> => {
    setLoading(true);
    try {
      // Check if email already exists in Firestore
      const emailExists = await checkEmailExistsInFirestore(email);
      
      if (emailExists) {
        console.error("Email is already in use");
        throw new Error("Email is already in use");
      }
      
      // Create the user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update profile in Firebase
      await updateProfile(firebaseUser, { displayName });
      
      // Store user in Firestore
      await storeUserInFirestore(firebaseUser.uid, {
        email,
        displayName,
        role
      });
      
      // Create the user in our PostgreSQL database
      try {
        const userData = await apiRequest<any>({
          url: "/api/users", 
          method: "POST", 
          data: {
            email,
            displayName,
            password: "firebase-auth", // We don't store the real password
            role,
            uid: firebaseUser.uid
          }
        });
        
        const newUser = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          id: userData.id
        };
        
        setUser(newUser);
        return newUser;
      } catch (error) {
        // If there's an error creating the user in our database, delete the Firebase user
        await firebaseUser.delete();
        throw error;
      }
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
