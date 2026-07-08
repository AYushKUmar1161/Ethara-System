"use client";

import React from "react";
import { motion } from "framer-motion";
import { Grid, MapPin, Bot, BarChart3, Users, Layout } from "lucide-react";

export default function AnimatedPreviewWidgets() {
  return (
    <div className="relative w-full h-[400px] flex items-center justify-center overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute w-72 h-72 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Widget 1: Seat Allocation */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-8 left-4 w-44 p-4 glass-panel rounded-2xl border border-slate-900/60 shadow-xl bg-slate-950/40"
      >
        <div className="flex items-center space-x-2 text-blue-400">
          <Grid className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Seat Engine</span>
        </div>
        <div className="mt-2.5 space-y-1.5">
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full w-4/5 bg-blue-500 rounded-full" />
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">92% allocated</span>
        </div>
      </motion.div>

      {/* Widget 2: Office Map */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-12 right-4 w-48 p-4 glass-panel rounded-2xl border border-slate-900/60 shadow-xl bg-slate-950/40"
      >
        <div className="flex items-center space-x-2 text-emerald-400">
          <MapPin className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Floor 5 Visualizer</span>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {Array.from({ length: 15 }).map((_, i) => {
            const occupied = i % 3 !== 0;
            return (
              <div
                key={i}
                className={`h-3.5 rounded-sm border ${
                  occupied
                    ? "bg-blue-500/10 border-blue-500/20"
                    : "bg-emerald-500/10 border-emerald-500/20"
                }`}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Widget 3: AI Assistant */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-12 left-10 w-52 p-4 glass-panel rounded-2xl border border-slate-900/60 shadow-xl bg-slate-950/40"
      >
        <div className="flex items-center space-x-2 text-purple-400">
          <Bot className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">AI Assistant</span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="px-2.5 py-1.5 bg-slate-900/60 rounded-xl rounded-bl-none border border-slate-900 text-[10px] text-slate-300 leading-relaxed">
            Where is Ayush seated?
          </div>
          <div className="px-2.5 py-1.5 bg-blue-600/10 rounded-xl rounded-br-none border border-blue-500/20 text-[10px] text-blue-400 leading-relaxed self-end">
            Ayush is seated at S-F5ZA-12.
          </div>
        </div>
      </motion.div>

      {/* Widget 4: Analytics Dashboard */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute bottom-6 right-8 w-44 p-4 glass-panel rounded-2xl border border-slate-900/60 shadow-xl bg-slate-950/40"
      >
        <div className="flex items-center space-x-2 text-amber-400">
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Metrics</span>
        </div>
        <div className="mt-3 flex items-end justify-between space-x-2 h-10">
          {[12, 24, 16, 32, 20].map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}px` }}
              className="w-4 bg-amber-500/20 border border-amber-500/30 rounded-t-sm"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
