"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  Database,
  Cpu,
  Trash2,
  Download,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const [localOnly, setLocalOnly] = useState(true);
  const [allowAiCloud, setAllowAiCloud] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [backendUrl, setBackendUrl] = useState("http://localhost:8000");

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-white tracking-tight">Privacy & Engine Settings</h1>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
            CONFIGURATION
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Control local storage boundaries, API endpoints, LLM inference modes, and data retention rules.
        </p>
      </div>

      <div className="space-y-6 text-xs">
        {/* Section 1: Privacy Sandbox Controls */}
        <div className="p-5 rounded-xl bg-[#0c111e] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Privacy & Local-First Processing Boundaries</span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#080c16] border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Local-First Sandbox Mode</span>
                <span className="text-[11px] text-slate-400">Keep all network observations and cookie data strictly on this device.</span>
              </div>
              <input
                type="checkbox"
                checked={localOnly}
                onChange={(e) => setLocalOnly(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#080c16] border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">External Cloud AI Consent</span>
                <span className="text-[11px] text-slate-400">Permit sending extracted policy text to hosted LLMs. Disabled by default.</span>
              </div>
              <input
                type="checkbox"
                checked={allowAiCloud}
                onChange={(e) => setAllowAiCloud(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#080c16] border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Automated Secret & Token Redaction</span>
                <span className="text-[11px] text-emerald-400 font-mono">ENFORCED (Non-negotiable core invariant)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-mono">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Endpoints & AI Inference */}
        <div className="p-5 rounded-xl bg-[#0c111e] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Engine & LLM Endpoints</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold text-[11px]">Backend API Base URL</label>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#080c16] border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold text-[11px]">Local Ollama Model URL</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#080c16] border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Data Management */}
        <div className="p-5 rounded-xl bg-[#0c111e] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Data Export & Management</span>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-2 transition border border-slate-700">
              <Download className="w-4 h-4" />
              <span>Export All Telemetry (JSON)</span>
            </button>

            <button className="px-4 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-semibold flex items-center gap-2 transition border border-rose-800">
              <Trash2 className="w-4 h-4" />
              <span>Clear Local Scan History</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
