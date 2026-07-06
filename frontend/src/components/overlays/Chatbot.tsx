"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/constants";
import { PANEL } from "@/lib/constants";

const CHIPS = [
  "Prediction at Jabalpur",
  "Fire risk at Kanha Tiger Reserve",
  "Risk forecast for Sundarbans",
  "Explain wildfire prediction model",
  "What causes high wildfire risk?",
];

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  confidence?: number;
  time: string;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function send(msg: string) {
    if (!msg.trim() || loading) return;
    const userMsg: Message = { role: "user", content: msg, time: new Date().toLocaleTimeString() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch(api("/api/v1/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, context: null }),
      });
      const data = await r.json();
      setMessages((p) => [
        ...p,
        { role: "assistant", content: data.answer, sources: data.sources, confidence: data.confidence, time: new Date().toLocaleTimeString() },
      ]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "Sorry, I couldn't process that. Please try again.", time: new Date().toLocaleTimeString() }]);
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold text-white shadow-lg transition-all hover:scale-105 ${
          open ? "bg-slate-700" : "bg-blue-600 shadow-blue-200"
        }`}
      >
        <MessageCircle className="h-4 w-4" />
        Try our chatbot!
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-200/50 ring-1 ring-slate-200/80"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold text-slate-800">Wildfire Assistant</p>
                <p className="text-[10px] text-slate-400">Knowledge retrieval system</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-slate-400 mb-3">Ask me about wildfire risk, weather, or forests</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {CHIPS.map((c) => (
                      <button key={c} onClick={() => send(c)} className="rounded-full bg-blue-50 px-3 py-1 text-[11px] text-blue-700 hover:bg-blue-100 transition-colors">
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                    m.role === "user" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700"
                  }`}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-800">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                    {m.sources && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.sources.map((s) => (
                          <span key={s} className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className={`mt-1 text-[10px] ${m.role === "user" ? "text-blue-200" : "text-slate-400"}`}>{m.time}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-3">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send(input)}
                  placeholder="Ask about wildfire risk..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
                />
                <button onClick={() => send(input)} disabled={loading} className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
