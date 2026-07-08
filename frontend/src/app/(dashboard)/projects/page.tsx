"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Loader2, Briefcase, Calendar, CheckCircle2, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

interface Project {
  id: number;
  name: string;
  code: string;
  description?: string;
  status: string;
  start_date: string;
  end_date?: string;
  department?: { name: string };
}

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState("Active");

  // Query projects
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ["projects", statusFilter],
    queryFn: () => {
      let url = "/projects";
      if (statusFilter) url += `?status=${statusFilter}`;
      return apiFetch(url);
    },
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Project Management</h1>
        <p className="text-sm text-slate-400 mt-1">Monitor operational projects, timelines, and seat allocation rules.</p>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {["Active", "Completed", "Inactive"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                statusFilter === status
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Projects */}
      {isLoading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading project registry...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-500 bg-rose-500/5 rounded-2xl border border-rose-500/10">
          Failed to fetch projects registry. Make sure backend service is active.
        </div>
      ) : projects?.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/10 rounded-2xl border border-slate-900">
          No projects matching this status filter found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((proj, idx) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    proj.status === "Active" ? "bg-emerald-500/10 text-emerald-400" :
                    proj.status === "Completed" ? "bg-blue-500/10 text-blue-400" :
                    "bg-slate-900 text-slate-500"
                  }`}>{proj.status}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">{proj.name}</h3>
                  <span className="text-xs font-semibold text-slate-500 tracking-wider font-mono uppercase">{proj.code}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed min-h-[40px] line-clamp-2">
                  {proj.description || "No project description provided."}
                </p>
              </div>

              <div className="border-t border-slate-900 pt-4 flex justify-between items-center text-xs text-slate-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Start: {proj.start_date}</span>
                </div>
                {proj.department && (
                  <span className="font-semibold text-slate-400 bg-slate-900 px-2 py-1 rounded">
                    {proj.department.name}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
