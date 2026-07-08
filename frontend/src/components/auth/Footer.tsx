"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-medium space-y-2 sm:space-y-0 w-full">
      <div className="flex space-x-3">
        <a href="#" className="hover:text-slate-300 transition">Privacy Policy</a>
        <span>•</span>
        <a href="#" className="hover:text-slate-300 transition">Terms of Service</a>
        <span>•</span>
        <a href="#" className="hover:text-slate-300 transition">Support</a>
      </div>
      <div className="flex items-center space-x-2">
        <span>v1.0</span>
        <span>•</span>
        <span>© 2026 Ethara System</span>
      </div>
    </footer>
  );
}
