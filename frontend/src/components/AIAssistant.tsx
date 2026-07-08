"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, Loader2, HelpCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I am your AI Seat Allocation Assistant. How can I help you manage the workspace today?",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickCommands = [
    "Where is Ayush seated?",
    "List available seats",
    "Zone A seat utilization",
    "Show active projects",
    "Who is in Project Apollo?"
  ];

  // Scroll to bottom when messages list updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setShowCommands(false);
    setLoading(true);

    try {
      const result = await apiFetch("/ai/query", {
        method: "POST",
        body: JSON.stringify({ query: userMessage.text }),
      });

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: result.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: `Error: ${err.message || "Failed to communicate with the assistant service."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCommandSelect = (cmd: string) => {
    setQuery(cmd);
    setShowCommands(false);
  };

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-full shadow-2xl transition cursor-pointer flex items-center justify-center border border-blue-400/20"
        aria-label="Open Workspace Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Slide-in Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-full max-w-md h-[550px] glass-panel rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border bg-card"
          >
            {/* Chat Panel Header */}
            <div className="p-4 bg-card border-b border-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Workspace Assistant</h4>
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                    Online fallback active
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div 
              ref={scrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-4 bg-card/25"
            >
              {messages.map((msg) => {
                const isBot = msg.sender === "bot";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isBot ? "justify-start" : "justify-end"} items-end space-x-2`}
                  >
                    {isBot && (
                      <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isBot
                          ? "bg-muted text-foreground rounded-bl-none border border-border"
                          : "bg-blue-600 text-white rounded-br-none"
                      }`}
                    >
                      {msg.text.split("\n").map((line, idx) => (
                        <p key={idx} className={idx > 0 ? "mt-1" : ""}>{line}</p>
                      ))}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 bg-muted rounded-2xl rounded-bl-none border border-border text-muted-foreground flex items-center space-x-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    <span className="text-[10px]">Processing query...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions Tray */}
            {showCommands && (
              <div className="px-3 py-2 bg-muted/40 border-t border-border flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {quickCommands.map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => handleQuickCommandSelect(cmd)}
                    className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-500 rounded-lg text-[10px] font-semibold transition text-left shrink-0 cursor-pointer"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            )}

            {/* Input Footer */}
            <form 
              onSubmit={handleSend}
              className="p-3 bg-card border-t border-border flex items-center space-x-2"
            >
              <button
                type="button"
                onClick={() => setShowCommands(!showCommands)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  showCommands ? "bg-blue-500/20 text-blue-500" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
                title="View suggestion commands"
              >
                <HelpCircle className="w-4.5 h-4.5" />
              </button>
              <input
                type="text"
                placeholder="Ask me: 'Where is Ayush seated?'..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-xs"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
