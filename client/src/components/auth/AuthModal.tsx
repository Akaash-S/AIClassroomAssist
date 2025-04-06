import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "signup";
}

const AuthModal = ({ isOpen, onClose, defaultTab = "signin" }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{activeTab === "signin" ? "Sign In" : "Create Account"}</DialogTitle>
        </DialogHeader>
        
        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            type="button"
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === "signin"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveTab("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === "signup"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveTab("signup")}
          >
            Sign Up
          </button>
        </div>
        
        {activeTab === "signin" ? (
          <LoginForm onSuccess={onClose} switchToSignUp={() => setActiveTab("signup")} />
        ) : (
          <RegisterForm onSuccess={onClose} switchToSignIn={() => setActiveTab("signin")} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
