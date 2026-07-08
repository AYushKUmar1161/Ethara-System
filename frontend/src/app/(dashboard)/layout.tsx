"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutGrid, Users, Map, Briefcase, FileClock, 
  Settings, LogOut, Sun, Moon, Search, Bell, Menu, X, User as UserIcon
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AIAssistant from "@/components/AIAssistant";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, initialize, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lightMode, setLightMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Seat Allocated Successfully", description: "Your seat S-F5ZA-12 on Floor 5 is active.", time: "10 mins ago", read: false },
    { id: 2, title: "Project Mapping Update", description: "You have been mapped to Project Gemini.", time: "1 hour ago", read: false },
    { id: 3, title: "System Maintenance Schedule", description: "Zone B electrical audits scheduled for July 10th.", time: "4 hours ago", read: false }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // If not authenticated after store initialization, redirect to login
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Toggle Dark/Light Mode
  const toggleTheme = () => {
    setLightMode(!lightMode);
    if (typeof document !== "undefined") {
      if (lightMode) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light-mode");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light-mode");
      }
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutGrid },
    { name: "Floor Visualizer", href: "/visualizer", icon: Map },
    { name: "Employees", href: "/employees", icon: Users },
    { name: "Projects", href: "/projects", icon: Briefcase },
    { name: "Audit Logs", href: "/audit", icon: FileClock },
  ];

  if (!isAuthenticated && typeof window !== "undefined" && !localStorage.getItem("access_token")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Loading session...
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex bg-background text-foreground transition-colors duration-300 ${lightMode ? 'light-mode' : ''}`}>
      {/* Sidebar navigation */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-40 border-r border-border bg-card/85 backdrop-blur-xl transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Brand area */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <Link href="/" className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <LayoutGrid className="w-5 h-5" />
              </div>
              {sidebarOpen && (
                <span className="font-bold tracking-tight text-lg text-foreground">Ethara System</span>
              )}
            </Link>
          </div>

          {/* Nav List */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                    isActive
                      ? "bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/10"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User profile / logout footer */}
          <div className="p-4 border-t border-border space-y-2 bg-card/45">
            {sidebarOpen && user && (
              <div className="px-4 py-2 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-semibold uppercase">
                  {user.username.substring(0, 2)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold truncate text-foreground">{user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.role?.name || "Employee"}</p>
                </div>
              </div>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition"
            >
              {lightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition cursor-pointer"
                aria-label="Toggle notifications menu"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-card" />
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    {/* Click outside overlay */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setNotificationsOpen(false)}
                    />
                    
                    {/* Dropdown panel */}
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-border flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Notifications</span>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              setNotifications(notifications.map(n => ({ ...n, read: true })));
                            }}
                            className="text-[10px] text-blue-500 hover:text-blue-400 font-semibold transition"
                          >
                            Mark all read
                          </button>
                          <span className="text-slate-600 text-[10px]">•</span>
                          <button 
                            onClick={() => setNotifications([])}
                            className="text-[10px] text-rose-500 hover:text-rose-400 font-semibold transition"
                          >
                            Clear all
                          </button>
                        </div>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto divide-y divide-border/60">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-muted-foreground">
                            No notifications to display.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => {
                                setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
                              }}
                              className={`p-4 text-left transition hover:bg-muted/50 cursor-pointer ${
                                !notif.read ? "bg-blue-500/5" : ""
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <p className={`text-xs font-semibold ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                                  {notif.title}
                                </p>
                                {!notif.read && (
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 shrink-0" />
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                                {notif.description}
                              </p>
                              <span className="text-[9px] text-slate-500 mt-2 block">
                                {notif.time}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            {/* Divider */}
            <div className="w-px h-5 bg-border" />
            
            {/* Profile */}
            <div className="flex items-center space-x-2 text-foreground text-sm font-semibold">
              <UserIcon className="w-4 h-4 text-muted-foreground" />
              <span>{user?.username}</span>
            </div>
          </div>
        </header>

        {/* Dynamic page children rendering */}
        <main className="flex-1 p-8 overflow-y-auto relative">
          {children}
          <AIAssistant />
        </main>
      </div>
    </div>
  );
}
