"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Loader2, FileClock, ShieldAlert, Cpu } from "lucide-react";
import { motion } from "framer-motion";

interface AuditLog {
  id: number;
  action: string;
  details: string;
  ip_address?: string;
  created_at: string;
  user?: { username: string; role: { name: string } };
}

export default function AuditLogsPage() {
  const { data: logs, isLoading, error } = useQuery<AuditLog[]>({
    queryKey: ["audit-logs"],
    queryFn: () => apiFetch("/audit/logs"),
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">System Audit Logs</h1>
        <p className="text-sm text-slate-400 mt-1">Trace all seat engine allocations, security alerts, and administrative actions.</p>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Operator</th>
                <th className="py-4 px-6">Action</th>
                <th className="py-4 px-6">Details</th>
                <th className="py-4 px-6">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-sm text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-rose-500">
                    Failed to fetch audit log trace. Ensure backend service is online.
                  </td>
                </tr>
              ) : logs?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                logs?.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-slate-900/10 transition">
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-300">{log.user?.username || "System Engine"}</span>
                        <span className="text-[10px] text-slate-500">{log.user?.role.name || "Cron"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.action.includes("error") ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                        log.action.includes("allocate") ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        log.action.includes("release") ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-slate-900 text-slate-400"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">
                      {log.ip_address || "Internal"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
