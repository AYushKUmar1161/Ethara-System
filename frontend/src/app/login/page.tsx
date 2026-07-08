"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { apiFetch } from "@/lib/api";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginCard from "@/components/auth/LoginCard";
import LoginForm from "@/components/auth/LoginForm";
import SignUpForm from "@/components/auth/SignUpForm";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onLoginSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // 1. Authenticate user
      const response = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
        skipAuth: true,
      });

      // 2. Fetch profile info
      const userProfile = await apiFetch("/auth/me", {
        headers: {
          Authorization: `Bearer ${response.access_token}`,
        },
        skipAuth: true,
      });

      // 3. Complete authentication workflow in Zustand store
      login(response.access_token, response.refresh_token, userProfile);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Invalid username/email or password.");
    } finally {
      setLoading(false);
    }
  };

  const onSignUpSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
        }),
        skipAuth: true,
      });
      setSuccess("Account successfully created! You can now sign in.");
      setIsSignUp(false);
    } catch (err: any) {
      setError(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert("Please contact the Human Resources or IT administration department to reset your workspace password.");
  };

  const toggleMode = () => {
    setError(null);
    setSuccess(null);
    setIsSignUp(!isSignUp);
  };

  const welcomeTitle = isSignUp ? "Create Account 🚀" : "Welcome Back 👋";
  const welcomeSubtitle = isSignUp ? "Register to join the internal workspace." : "Sign in to access your workspace.";

  return (
    <AuthLayout>
      <LoginCard title={welcomeTitle} subtitle={welcomeSubtitle}>
        {success && (
          <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-medium">
            {success}
          </div>
        )}

        {!isSignUp ? (
          <LoginForm
            onSubmit={onLoginSubmit}
            loading={loading}
            error={error}
            onForgotPassword={handleForgotPassword}
            onToggleMode={toggleMode}
          />
        ) : (
          <SignUpForm
            onSubmit={onSignUpSubmit}
            loading={loading}
            error={error}
            onToggleMode={toggleMode}
          />
        )}
      </LoginCard>
    </AuthLayout>
  );
}
