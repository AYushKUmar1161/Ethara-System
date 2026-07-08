"use client";

import React from "react";
import { LayoutGrid, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import StatsCard from "./StatsCard";
import FeatureCard from "./FeatureCard";
import AnimatedPreviewWidgets from "./AnimatedPreviewWidgets";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-200 overflow-x-hidden">
      {/* Background Glowing Blur effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Left Section: Branding & Teaser Panel (55% width on desktop) */}
      <div className="hidden md:flex md:w-[55%] lg:w-[55%] flex-col justify-between p-12 border-r border-slate-900 bg-slate-950/20 relative">
        {/* Top Header Logo */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <LayoutGrid className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-sm font-extrabold tracking-tight text-slate-100 uppercase">Ethara System</span>
        </div>

        {/* Mid Section: Teaser Illustration and Features */}
        <div className="my-auto space-y-8 max-w-lg">
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 leading-tight">
              Intelligent Seat Allocation & Project Management Platform
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manage employees, projects, workspace allocation, and office analytics from one intelligent platform.
            </p>
          </div>

          {/* Animated visual widgets */}
          <AnimatedPreviewWidgets />

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4">
            <FeatureCard title="Smart Seat Allocation" description="Algorithm-driven priority matchmaking." />
            <FeatureCard title="AI Workspace Assistant" description="Natural language workspace querying." />
            <FeatureCard title="Live Seat Availability" description="Real-time occupied/vacant map updates." />
            <FeatureCard title="Workspace Analytics" description="Occupancy and project resource monitoring." />
          </div>
        </div>

        {/* Bottom Section: Workspace Stats */}
        <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-900">
          <StatsCard value="5000+" label="Employees" />
          <StatsCard value="5500+" label="Seats" />
          <StatsCard value="10+" label="Projects" />
          <StatsCard value="5" label="Floors" />
        </div>
      </div>

      {/* Right Section: Form Context Panel (45% width on desktop) */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-12 relative min-h-screen">
        {/* Render child form cards centered */}
        <div className="my-auto w-full max-w-md mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
