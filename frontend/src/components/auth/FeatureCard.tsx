"use client";

import React from "react";
import { Check } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
}

export default function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="flex items-start space-x-3 p-4 bg-slate-900/40 border border-slate-900 rounded-2xl backdrop-blur-md hover:bg-slate-900/60 transition">
      <div className="p-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg shrink-0 mt-0.5">
        <Check className="w-3.5 h-3.5" />
      </div>
      <div>
        <h4 className="text-xs font-bold text-slate-200">{title}</h4>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
