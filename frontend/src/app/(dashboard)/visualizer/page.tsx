"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { 
  Loader2, Map, ShieldAlert, Monitor, CheckCircle, Flame, 
  UserPlus, XCircle, ArrowLeftRight, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Floor {
  id: number;
  name: string;
  number: number;
}

interface Seat {
  id: number;
  number: string;
  status: string;
  type: string;
  bay: {
    id: number;
    name: string;
    code: string;
    zone: {
      id: number;
      name: string;
      code: string;
    };
  };
}

interface Allocation {
  id: number;
  seat_id: number;
  employee_id: number;
  status: string;
  employee: {
    first_name: string;
    last_name: string;
    employee_id: string;
    email: string;
    department: { name: string };
    project?: { name: string };
  };
}

export default function FloorVisualizerPage() {
  const queryClient = useQueryClient();
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  
  // Search query to highlight matches on the floor grid
  const [highlightQuery, setHighlightQuery] = useState("");

  // Queries
  const { data: floors, isLoading: loadingFloors } = useQuery<Floor[]>({
    queryKey: ["floors"],
    queryFn: () => apiFetch("/facility/floors"),
  });

  const { data: seats, isLoading: loadingSeats } = useQuery<Seat[]>({
    queryKey: ["seats", selectedFloor],
    queryFn: () => apiFetch(`/facility/seats/floor/${selectedFloor}`),
  });

  // Query details of active allocation on selected seat
  const { data: activeAlloc, isLoading: loadingAlloc } = useQuery<Allocation | null>({
    queryKey: ["allocation", selectedSeat?.id],
    queryFn: () => 
      selectedSeat 
        ? apiFetch(`/allocations?seat_id=${selectedSeat.id}&status=Active`).then(res => res[0] || null)
        : Promise.resolve(null),
    enabled: !!selectedSeat,
  });

  // Mutations for seat engine operations
  const releaseMutation = useMutation({
    mutationFn: (allocId: number) => apiFetch(`/allocations/${allocId}/release`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seats"] });
      queryClient.invalidateQueries({ queryKey: ["allocation"] });
      setSelectedSeat(null);
    }
  });

  const autoAllocateMutation = useMutation({
    mutationFn: (empId: number) => apiFetch(`/allocations/auto/${empId}`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seats"] });
      queryClient.invalidateQueries({ queryKey: ["allocation"] });
      setSelectedSeat(null);
    }
  });

  const maintenanceMutation = useMutation({
    mutationFn: (seatId: number) => apiFetch(`/allocations/seats/${seatId}/maintenance`, {
      method: "POST",
      body: JSON.stringify({ reason: "Under maintenance block" })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seats"] });
      queryClient.invalidateQueries({ queryKey: ["allocation"] });
      setSelectedSeat(null);
    }
  });

  // Release Action handler
  const handleRelease = () => {
    if (activeAlloc) {
      releaseMutation.mutate(activeAlloc.id);
    }
  };

  // Block seat for Maintenance handler
  const handleMaintenance = () => {
    if (selectedSeat) {
      maintenanceMutation.mutate(selectedSeat.id);
    }
  };

  // Group seats by Zone and Bay for visual hierarchy rendering
  const getSeatsByZoneAndBay = () => {
    if (!seats) return {};
    const grouped: Record<string, Record<string, Seat[]>> = {};

    seats.forEach((seat) => {
      const zoneName = seat.bay.zone.name;
      const bayName = seat.bay.name;
      
      if (!grouped[zoneName]) {
        grouped[zoneName] = {};
      }
      if (!grouped[zoneName][bayName]) {
        grouped[zoneName][bayName] = [];
      }
      grouped[zoneName][bayName].push(seat);
    });

    return grouped;
  };

  const groupedLayout = getSeatsByZoneAndBay();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Floor Visualizer</h1>
        <p className="text-sm text-slate-400 mt-1">Select floors and interact with the physical seat mapping matrix.</p>
      </div>

      {/* Control panel */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-slate-900/30 p-4 border border-slate-900 rounded-2xl">
        {/* Floor selectors */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {loadingFloors ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : (
            floors?.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedFloor(f.number);
                  setSelectedSeat(null);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
                  selectedFloor === f.number
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                Floor {f.number}
              </button>
            ))
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-semibold text-slate-400 bg-slate-900/20 px-4 py-2 rounded-xl">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-blue-500 shrink-0" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-amber-500 shrink-0" />
            <span>Reserved</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-rose-500 shrink-0" />
            <span>Maintenance</span>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Seats Map Container */}
        <div className="xl:col-span-3 glass-panel p-6 rounded-2xl relative overflow-x-auto min-h-[50vh]">
          {loadingSeats ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading seat grid...</p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.keys(groupedLayout).map((zoneName) => (
                <div key={zoneName} className="space-y-6">
                  <h2 className="text-lg font-bold text-slate-300 border-b border-slate-900 pb-2">{zoneName}</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {Object.keys(groupedLayout[zoneName]).map((bayName) => (
                      <div key={bayName} className="bg-slate-950/40 p-4 border border-slate-900 rounded-xl space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{bayName}</h3>
                          <span className="text-[10px] text-slate-600 bg-slate-900 px-2 py-0.5 rounded">
                            {groupedLayout[zoneName][bayName].length} Seats
                          </span>
                        </div>

                        {/* Interactive Seat Cells Grid */}
                        <div className="grid grid-cols-10 gap-2">
                          {groupedLayout[zoneName][bayName].map((seat) => {
                            const isSelected = selectedSeat?.id === seat.id;
                            
                            // Map status color
                            let statusColor = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20";
                            if (seat.status === "Occupied") {
                              statusColor = "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20";
                            } else if (seat.status === "Reserved") {
                              statusColor = "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20";
                            } else if (seat.status === "Maintenance") {
                              statusColor = "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20";
                            }

                            if (isSelected) {
                              statusColor += " ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950";
                            }

                            return (
                              <button
                                key={seat.id}
                                onClick={() => setSelectedSeat(seat)}
                                className={`h-8 rounded border text-[10px] font-bold transition flex items-center justify-center cursor-pointer shrink-0 ${statusColor}`}
                                title={`${seat.number} (${seat.status})`}
                              >
                                {seat.number.split("-").pop()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side Detail & Actions Panel */}
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
            <h3 className="font-bold text-slate-200 border-b border-slate-900 pb-4 mb-4">Seat Detail Panel</h3>

            <AnimatePresence mode="wait">
              {selectedSeat ? (
                <motion.div
                  key={selectedSeat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Seat Number</span>
                      <p className="text-xl font-bold text-slate-100">{selectedSeat.number}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Zone</span>
                        <p className="text-sm font-semibold text-slate-300">{selectedSeat.bay.zone.name}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Bay</span>
                        <p className="text-sm font-semibold text-slate-300">{selectedSeat.bay.name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Status</span>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold mt-1 ${
                          selectedSeat.status === "Available" ? "bg-emerald-500/10 text-emerald-400" :
                          selectedSeat.status === "Occupied" ? "bg-blue-500/10 text-blue-400" :
                          selectedSeat.status === "Reserved" ? "bg-amber-500/10 text-amber-400" :
                          "bg-rose-500/10 text-rose-400"
                        }`}>{selectedSeat.status}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Type</span>
                        <p className="text-sm font-semibold text-slate-300">{selectedSeat.type}</p>
                      </div>
                    </div>

                    {/* Active Seated Employee Profile Info */}
                    {selectedSeat.status === "Occupied" && (
                      <div className="border-t border-slate-900 pt-4 mt-4 space-y-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Profile</h4>
                        {loadingAlloc ? (
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        ) : activeAlloc ? (
                          <div className="space-y-2">
                            <p className="text-sm font-bold text-slate-200">
                              {activeAlloc.employee.first_name} {activeAlloc.employee.last_name}
                            </p>
                            <p className="text-xs text-slate-400">ID: {activeAlloc.employee.employee_id}</p>
                            <p className="text-xs text-slate-400">Email: {activeAlloc.employee.email}</p>
                            <p className="text-xs text-slate-400">Department: {activeAlloc.employee.department.name}</p>
                            {activeAlloc.employee.project && (
                              <p className="text-xs text-slate-400">Project: {activeAlloc.employee.project.name}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No active assignment data found.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Grid */}
                  <div className="border-t border-slate-900 pt-6 mt-6 space-y-3">
                    {selectedSeat.status === "Occupied" && activeAlloc && (
                      <button
                        onClick={handleRelease}
                        disabled={releaseMutation.isPending}
                        className="w-full py-2.5 bg-rose-600/10 hover:bg-rose-600/20 active:scale-[0.98] border border-rose-600/30 text-rose-400 font-semibold rounded-xl text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Release Seat</span>
                      </button>
                    )}

                    {selectedSeat.status === "Available" && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 text-center mb-2">Use dashboard search/management tabs to run intelligent auto-allocations or manual transfers.</p>
                      </div>
                    )}

                    {selectedSeat.status !== "Maintenance" && (
                      <button
                        onClick={handleMaintenance}
                        disabled={maintenanceMutation.isPending}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] border border-slate-800 text-slate-400 font-semibold rounded-xl text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Block (Maintenance)</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-900/10 border border-dashed border-slate-900 rounded-xl">
                  <Map className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-xs text-slate-500">Select any seat on the floor map grid to view allocation profile and trigger administrative actions.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
