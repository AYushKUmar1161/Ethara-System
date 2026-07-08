"use client";

import React from "react";
import { LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import Footer from "./Footer";

interface LoginCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function LoginCard({ children, title = "Welcome Back", subtitle = "Sign in to access your workspace." }: LoginCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md bg-slate-950/20 border border-slate-900 p-8 rounded-3xl backdrop-blur-xl relative overflow-hidden"
    >
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Title logo and header (visible on mobile only since desktop has left branding) */}
      <div className="flex flex-col items-center mb-8 md:hidden">
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-3">
          <LayoutGrid className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Ethara System</h1>
        <p className="text-sm text-slate-400 text-center mt-1">
          Enterprise Seat Allocation & Project Mapping
        </p>
      </div>

      {/* Welcome Heading */}
      <div className="space-y-1 mb-8">
        <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center">
          {title}
        </h2>
        <p className="text-xs text-slate-500">
          {subtitle}
        </p>
      </div>

      {/* Children Form */}
      <div className="space-y-6">
        {children}
      </div>

      {/* Footer Mappings */}
      <Footer />
    </motion.div>
  );
}
