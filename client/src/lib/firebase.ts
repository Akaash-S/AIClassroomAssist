import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
// import dotenv from 'dotenv';
// dotenv.config();

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || ""}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || ""}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Firestore helper functions
const usersCollection = collection(firestore, "users");

// Store user information in Firestore
async function storeUserInFirestore(uid: string, userData: {
  email: string;
  displayName: string;
  role: string;
}): Promise<void> {
  try {
    const userRef = doc(firestore, "users", uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error storing user in Firestore:", error);
    throw error;
  }
}

// Get user information from Firestore
async function getUserFromFirestore(uid: string) {
  try {
    const userRef = doc(firestore, "users", uid);
    const userSnapshot = await getDoc(userRef);
    
    if (userSnapshot.exists()) {
      return { id: userSnapshot.id, ...userSnapshot.data() };
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user from Firestore:", error);
    throw error;
  }
}

// Check if email already exists in Firestore
async function checkEmailExistsInFirestore(email: string): Promise<boolean> {
  try {
    const emailQuery = query(usersCollection, where("email", "==", email));
    const querySnapshot = await getDocs(emailQuery);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking email in Firestore:", error);
    throw error;
  }
}

// Firebase Storage helper functions
/**
 * Upload an audio file to Firebase Storage
 * @param file The audio file to upload
 * @param path The path in storage where the file should be saved
 * @returns URL to the uploaded file
 */
async function uploadAudioToStorage(file: Blob | File, path: string, metadata?: any): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Store metadata in Firestore
    if (metadata) {
      const lecturesCollection = collection(firestore, "lectures");
      await setDoc(doc(lecturesCollection), {
        ...metadata,
        audioUrl: downloadURL,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading audio to Firebase Storage:", error);
    throw error;
  }
}

/**
 * Delete a file from Firebase Storage
 * @param path The path of the file to delete
 */
async function deleteFileFromStorage(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting file from Firebase Storage:", error);
    throw error;
  }
}

export { 
  app, 
  auth, 
  firestore,
  storage,
  googleProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  storeUserInFirestore,
  getUserFromFirestore,
  checkEmailExistsInFirestore,
  uploadAudioToStorage,
  deleteFileFromStorage
};
