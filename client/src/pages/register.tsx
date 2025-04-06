import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import RegisterForm from "@/components/auth/RegisterForm";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Register = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  const handleSuccess = () => {
    navigate("/");
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center">
            <i className="fas fa-graduation-cap text-indigo-600 text-3xl mr-3"></i>
            EduAudio
          </h1>
          <p className="mt-2 text-gray-600">Create your account to get started</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <RegisterForm onSuccess={handleSuccess} switchToSignIn={() => navigate("/login")} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
