"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react";
import { UseFormRegisterReturn } from "react-hook-form";

interface PasswordInputProps {
  register: UseFormRegisterReturn;
  error?: string;
  placeholder?: string;
  label?: string;
}

export default function PasswordInput({ register, error, placeholder = "••••••••", label = "Password" }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState("CapsLock"));
    }
  };

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.getModifierState) {
        setCapsLockActive(e.getModifierState("CapsLock"));
      }
    };
    window.addEventListener("keyup", handleKeyUp);
    return () => window.removeEventListener("keyup", handleKeyUp);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
        {capsLockActive && (
          <span className="flex items-center space-x-1 text-[10px] text-amber-500 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Caps Lock is ON</span>
          </span>
        )}
      </div>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
          <Lock className="w-4 h-4" />
        </span>
        <input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          {...register}
          className="w-full pl-10 pr-10 py-3 bg-slate-900/50 border border-slate-900 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p className="text-xs text-rose-500 font-medium">{error}</p>
      )}
    </div>
  );
}
