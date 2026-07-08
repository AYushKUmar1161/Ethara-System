"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PasswordInput from "./PasswordInput";

const signUpSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSubmit: (data: SignUpFormValues) => Promise<void>;
  loading: boolean;
  error: string | null;
  onToggleMode: () => void;
}

export default function SignUpForm({ onSubmit, loading, error, onToggleMode }: SignUpFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Username */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Username
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <UserIcon className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="e.g. johndoe"
            {...register("username")}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-900 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm"
          />
        </div>
        {errors.username && (
          <p className="text-xs text-rose-500 font-medium">{errors.username.message}</p>
        )}
      </div>

      {/* Email Address */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Email Address
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Mail className="w-4 h-4" />
          </span>
          <input
            type="email"
            placeholder="johndoe@company.com"
            {...register("email")}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-900 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm"
          />
        </div>
        {errors.email && (
          <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>
        )}
      </div>

      {/* Password with Caps Lock warning */}
      <PasswordInput
        register={register("password")}
        error={errors.password?.message}
        placeholder="••••••••"
        label="Password"
      />

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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating Account...</span>
          </>
        ) : (
          <span>Register Account</span>
        )}
      </button>

      {/* Toggle Sign In options */}
      <div className="text-center">
        <p className="text-xs text-slate-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-emerald-500 hover:text-emerald-400 font-semibold cursor-pointer transition"
          >
            Sign in here
          </button>
        </p>
      </div>
    </form>
  );
}
