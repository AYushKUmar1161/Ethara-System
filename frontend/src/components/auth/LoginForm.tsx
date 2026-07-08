"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PasswordInput from "./PasswordInput";

// Pydantic/FastAPI accepts username or email. We validate length and address.
const loginSchema = z.object({
  username: z.string().min(3, "Username or email must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (data: LoginFormValues) => Promise<void>;
  loading: boolean;
  error: string | null;
  onForgotPassword?: () => void;
  onToggleMode: () => void;
}

export default function LoginForm({ onSubmit, loading, error, onForgotPassword, onToggleMode }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email / Username */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Email Address or Username
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Mail className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="name@ethara.com"
            {...register("username")}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-900 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm"
          />
        </div>
        {errors.username && (
          <p className="text-xs text-rose-500 font-medium">{errors.username.message}</p>
        )}
      </div>

      {/* Password with Caps Lock warning */}
      <PasswordInput
        register={register("password")}
        error={errors.password?.message}
        placeholder="••••••••"
        label="Password"
      />

      {/* Checkbox Remember Me & Forgot Password */}
      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center space-x-2 text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register("rememberMe")}
            className="w-4 h-4 rounded border-slate-900 bg-slate-900/50 text-blue-600 focus:ring-blue-500/40 focus:ring-offset-slate-950 accent-blue-600 cursor-pointer"
          />
          <span>Remember me</span>
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-blue-500 hover:text-blue-400 font-semibold transition"
        >
          Forgot Password?
        </button>
      </div>

      {/* Error alert wrapper */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign In Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Signing In...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </button>

      {/* Toggle Sign Up options */}
      <div className="text-center">
        <p className="text-xs text-slate-500">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-blue-500 hover:text-blue-400 font-semibold cursor-pointer transition"
          >
            Register here
          </button>
        </p>
      </div>

      {/* Security Warning Notice */}
      <div className="pt-2 flex justify-center items-center space-x-1.5 text-[10px] text-slate-600 font-medium">
        <ShieldCheck className="w-4 h-4 text-slate-500" />
        <span>Protected by enterprise-grade encryption. Unauthorized access is prohibited.</span>
      </div>
    </form>
  );
}
