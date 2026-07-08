"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { 
  Loader2, Search, Filter, UserCheck, UserMinus, Plus, Edit, Trash2,
  ChevronLeft, ChevronRight, HelpCircle, Check, CircleDot, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  department_id: number;
  department: { id: number; name: string };
  project?: { id: number; name: string };
}

interface Department {
  id: number;
  name: string;
}

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedProj, setSelectedProj] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 15;

  const [triggerSearch, setTriggerSearch] = useState("");

  // CRUD modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [formFields, setFormFields] = useState({
    employee_id: "",
    first_name: "",
    last_name: "",
    email: "",
    department_id: 1,
    status: "Active"
  });

  // Queries
  const { data: employees, isLoading, error } = useQuery<Employee[]>({
    queryKey: ["employees", page, selectedDept, selectedProj, triggerSearch],
    queryFn: () => {
      let url = `/employees?skip=${page * limit}&limit=${limit}`;
      if (selectedDept) url += `&department_id=${selectedDept}`;
      if (selectedProj) url += `&project_id=${selectedProj}`;
      if (triggerSearch) url += `&query=${encodeURIComponent(triggerSearch)}`;
      return apiFetch(url);
    },
  });

  const departments: Department[] = [
    { id: 1, name: "Engineering" },
    { id: 2, name: "Product Management" },
    { id: 3, name: "Design" },
    { id: 4, name: "Sales" },
    { id: 5, name: "Marketing" },
    { id: 6, name: "Human Resources" },
    { id: 7, name: "Finance" },
    { id: 8, name: "Operations" },
  ];

  // Check seat allocations for current employees
  const { data: allocations } = useQuery<any[]>({
    queryKey: ["allocations-list"],
    queryFn: () => apiFetch("/allocations?limit=1000"),
  });

  // Role permissions checks
  const canWrite = user?.role?.name === "Admin" || user?.role?.name === "HR";

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: typeof formFields) => apiFetch("/employees", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsModalOpen(false);
      alert("Employee profile created successfully!");
    },
    onError: (err: any) => {
      alert(`Error creating employee: ${err.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<typeof formFields> }) => apiFetch(`/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsModalOpen(false);
      alert("Employee profile updated successfully!");
    },
    onError: (err: any) => {
      alert(`Error updating employee: ${err.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/employees/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      alert("Employee profile deleted successfully.");
    },
    onError: (err: any) => {
      alert(`Error deleting employee: ${err.message}`);
    }
  });

  const autoAllocateMutation = useMutation({
    mutationFn: (empId: number) => apiFetch(`/allocations/auto/${empId}`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["allocations-list"] });
      alert("Seat successfully auto-allocated for employee!");
    },
    onError: (err: any) => {
      alert(`Allocation Failed: ${err.message}`);
    }
  });

  const releaseMutation = useMutation({
    mutationFn: (allocId: number) => apiFetch(`/allocations/${allocId}/release`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["allocations-list"] });
      alert("Seat released successfully.");
    },
    onError: (err: any) => {
      alert(`Release Failed: ${err.message}`);
    }
  });

  const handleAutoAllocate = (empId: number) => {
    autoAllocateMutation.mutate(empId);
  };

  const handleRelease = (empId: number) => {
    const alloc = allocations?.find(a => a.employee_id === empId && a.status === "Active");
    if (alloc) {
      releaseMutation.mutate(alloc.id);
    } else {
      alert("No active seat allocation found for this employee.");
    }
  };

  const isEmployeeSeated = (empId: number) => {
    return !!allocations?.some(a => a.employee_id === empId && a.status === "Active");
  };

  const getSeatNumber = (empId: number) => {
    const alloc = allocations?.find(a => a.employee_id === empId && a.status === "Active");
    return alloc ? alloc.seat.number : "Unassigned";
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setTriggerSearch(searchQuery);
      setPage(0);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTriggerSearch("");
    setSelectedDept("");
    setSelectedProj("");
    setPage(0);
  };

  const openCreateModal = () => {
    setFormFields({
      employee_id: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
      first_name: "",
      last_name: "",
      email: "",
      department_id: 1,
      status: "Active"
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormFields({
      employee_id: emp.employee_id,
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      department_id: emp.department?.id || 1,
      status: emp.status || "Active"
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to permanently delete this employee?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "create") {
      createMutation.mutate(formFields);
    } else if (selectedEmployee) {
      updateMutation.mutate({ id: selectedEmployee.id, data: formFields });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Employee Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage onboarding, projects, and active seat allocation files.</p>
        </div>
        {canWrite && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition shadow-lg shadow-blue-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Employee</span>
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search ID, email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
            />
          </div>

          {/* Department filter */}
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(0);
            }}
            className="w-full sm:w-44 px-3 py-2 bg-muted/50 border border-border rounded-xl text-muted-foreground focus:outline-none text-sm cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table view */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Employee ID</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Current Seat</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-foreground">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                    Loading employee database records...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-rose-500">
                    Failed to fetch employees list. Ensure backend services are online.
                  </td>
                </tr>
              ) : employees?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No matching employees found.
                  </td>
                </tr>
              ) : (
                employees?.map((emp) => {
                  const seated = isEmployeeSeated(emp.id);
                  const seatNo = getSeatNumber(emp.id);
                  
                  return (
                    <tr key={emp.id} className="hover:bg-muted/10 transition">
                      <td className="py-4 px-6 font-mono text-xs font-bold text-muted-foreground">{emp.employee_id}</td>
                      <td className="py-4 px-6 font-semibold text-foreground">
                        {emp.first_name} {emp.last_name}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{emp.email}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-0.5 rounded text-xs bg-muted border border-border text-muted-foreground">
                          {emp.department?.name || "Unassigned"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                          seated ? "bg-blue-500/10 text-blue-400" : "bg-muted text-muted-foreground"
                        }`}>
                          {seatNo}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {canWrite && (
                          <>
                            <button
                              onClick={() => openEditModal(emp)}
                              className="p-2 bg-muted hover:bg-border text-muted-foreground hover:text-foreground rounded-lg text-xs transition inline-flex items-center cursor-pointer"
                              title="Edit Employee"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(emp.id)}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs transition inline-flex items-center cursor-pointer border border-rose-500/20"
                              title="Delete Employee"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {seated ? (
                          <button
                            onClick={() => handleRelease(emp.id)}
                            disabled={releaseMutation.isPending}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.98] border border-rose-500/30 text-rose-400 rounded-lg text-xs transition inline-flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                            title="Release Seat"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAutoAllocate(emp.id)}
                            disabled={autoAllocateMutation.isPending}
                            className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] border border-emerald-500/30 text-emerald-400 rounded-lg text-xs transition inline-flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                            title="Auto Allocate Seat"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 border-t border-border flex justify-between items-center bg-muted/20">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} (showing max {limit} entries per request)
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!employees || employees.length < limit}
              className="p-1.5 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CRUD Onboard/Edit Modal Dialog */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-2xl z-10 overflow-hidden"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-foreground mb-4">
                {modalMode === "create" ? "Onboard Employee" : "Edit Employee Profile"}
              </h2>

              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === "edit"}
                    value={formFields.employee_id}
                    onChange={(e) => setFormFields({ ...formFields, employee_id: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formFields.first_name}
                      onChange={(e) => setFormFields({ ...formFields, first_name: e.target.value })}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formFields.last_name}
                      onChange={(e) => setFormFields({ ...formFields, last_name: e.target.value })}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formFields.email}
                    onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Department
                  </label>
                  <select
                    value={formFields.department_id}
                    onChange={(e) => setFormFields({ ...formFields, department_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm cursor-pointer"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-blue-600/10 disabled:opacity-50"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>{modalMode === "create" ? "Onboard" : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
