"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { 
  Users, MapPin, CheckCircle, AlertCircle, Bookmark, Briefcase, 
  Loader2, ArrowUpRight, TrendingUp
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { motion } from "framer-motion";

interface DashboardAnalyticsData {
  stats: {
    total_employees: number;
    occupied_seats: number;
    available_seats: number;
    reserved_seats: number;
    pending_allocations: number;
    total_projects: number;
  };
  floor_utilization: {
    floor_number: number;
    floor_name: string;
    total_seats: number;
    occupied_seats: number;
    utilization_rate: number;
  }[];
  project_utilization: {
    project_id: number;
    project_name: string;
    allocated_seats: number;
  }[];
  zone_utilization: {
    zone_code: string;
    total_seats: number;
    occupied_seats: number;
    utilization_rate: number;
  }[];
  department_distribution: {
    department_name: string;
    employee_count: number;
  }[];
  monthly_joining_trend: {
    month: string;
    joining_count: number;
  }[];
}

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#10b981", "#f59e0b", "#14b8a6"];

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardAnalyticsData>({
    queryKey: ["dashboard-analytics"],
    queryFn: () => apiFetch("/dashboard/analytics"),
    refetchInterval: 30000, // Autorefresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading enterprise analytics dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 bg-red-500/5 border border-red-500/10 rounded-2xl">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-100 mb-1">Failed to load analytics</h3>
        <p className="text-slate-400 text-sm text-center max-w-md">
          {error?.message || "There was a network error fetching dashboard metrics. Ensure the backend database services are online."}
        </p>
      </div>
    );
  }

  const { stats, floor_utilization, project_utilization, department_distribution, monthly_joining_trend } = data;

  const cardItems = [
    { name: "Total Employees", value: stats.total_employees, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Occupied Seats", value: stats.occupied_seats, icon: MapPin, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { name: "Available Seats", value: stats.available_seats, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "Reserved Seats", value: stats.reserved_seats, icon: Bookmark, color: "text-amber-500", bg: "bg-amber-500/10" },
    { name: "Pending Allocation", value: stats.pending_allocations, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
    { name: "Active Projects", value: stats.total_projects, icon: Briefcase, color: "text-sky-500", bg: "bg-sky-500/10" },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Analytics Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time indicators and spatial office utilization mapping.</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {cardItems.map((card, i) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-panel p-6 rounded-2xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.name}</span>
              <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-100 tracking-tight">{card.value.toLocaleString()}</h2>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Floor Seat Utilization Rate */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-200">Floor Seat Utilization (%)</h3>
            <span className="text-xs text-slate-400">Target limit: 85%</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={floor_utilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="floor_name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                  labelStyle={{ fontWeight: "bold", color: "#f1f5f9" }}
                />
                <Bar dataKey="utilization_rate" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {floor_utilization.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.utilization_rate > 85 ? "#f43f5e" : "#3b82f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Project Utilization weight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-200">Seat Distribution by Project</h3>
          </div>
          <div className="h-80 flex flex-col md:flex-row items-center justify-center">
            <div className="w-full md:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={project_utilization}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="allocated_seats"
                    nameKey="project_name"
                  >
                    {project_utilization.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom legends */}
            <div className="w-full md:w-1/2 overflow-y-auto max-h-64 space-y-2 px-4">
              {project_utilization.map((proj, idx) => (
                <div key={proj.project_name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-400 truncate">{proj.project_name}</span>
                  </div>
                  <span className="font-semibold text-slate-200 pl-2">{proj.allocated_seats} seats</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Monthly Joining trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-200">Monthly Onboarding Trend</h3>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly_joining_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                />
                <Line type="monotone" dataKey="joining_count" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Department Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-200">Department Distribution</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={department_distribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="department_name" type="category" stroke="#64748b" fontSize={12} width={120} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                />
                <Bar dataKey="employee_count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
