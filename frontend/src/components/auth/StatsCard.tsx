"use client";

import React from "react";
import { motion } from "framer-motion";

interface StatsCardProps {
  value: string;
  label: string;
}

export default function StatsCard({ value, label }: StatsCardProps) {
  return (
    <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col justify-center text-center">
      <span className="text-lg font-extrabold text-blue-500 font-mono tracking-tight">{value}</span>
      <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5 tracking-wider">{label}</span>
    </div>
  );
}
