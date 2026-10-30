"use client";

import React, { useState } from "react";
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface Claim {
  id: string;
  category: string;
  claim: string;
  excerpt: string;
  observedMatch: string;
  status: "consistent" | "potentially_inconsistent" | "unverifiable";
}

const sampleClaims: Claim[] = [
  {
    id: "c-1",
    category: "Advertising & Retargeting",
    claim: "We do not sell your personal data or share it with third parties for their independent commercial marketing.",
    excerpt: "...We will not sell, rent, or trade your personal information to third parties without your explicit prior consent...",
    observedMatch: "Detected active communication with Meta Pixel (connect.facebook.net) and DoubleClick (doubleclick.net) which build cross-site retargeting profiles.",
    status: "potentially_inconsistent",
  },
  {
    id: "c-2",
    category: "Analytics & Measurement",
    claim: "We utilize aggregate analytics to understand website traffic patterns and improve system performance.",
    excerpt: "...We use Google Analytics and server logs to analyze visitor flows in aggregated, anonymized formats...",
    observedMatch: "Google Analytics 4 (_ga, _gid) active. Request payloads sanitized without identifiable cleartext.",
    status: "consistent",
  },
  {
    id: "c-3",
    category: "Session Replay & Keystroke Monitoring",
    claim: "No disclosure found in policy regarding session recording, rage-click detection, or client DOM snapshots.",
    excerpt: "No mention of Microsoft Clarity or behavioral replay tools found in published document.",
    observedMatch: "Active script loaded: clarity.ms/s/0.7.20/clarity.js recording granular user viewport interactions.",
    status: "potentially_inconsistent",
  },
  {
    id: "c-4",
    category: "Retention Period",
    claim: "Customer transaction records are maintained for 7 years to satisfy regulatory accounting requirements.",
    excerpt: "...Transaction records and invoice metadata are retained for a minimum of 84 months...",
    observedMatch: "Cannot be verified from client-side network observations.",
    status: "unverifiable",
  },
];

export default function PolicyAnalyzerPage() {
  const [urlInput, setUrlInput] = useState("https://store.nike.com/privacy-policy");
  const [claims, setClaims] = useState<Claim[]>(sampleClaims);
  const [filter, setFilter] = useState<"all" | "inconsistent">("all");

  const filtered = claims.filter((c) => {
    if (filter === "inconsistent") return c.status === "potentially_inconsistent";
    return true;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">AI Privacy Policy Analyzer</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              REALITY GAP DETECTOR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Structures published legal claims and cross-references them against empirical network & cookie telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#0d121f] border border-slate-800 text-slate-200 w-72 focus:outline-none focus:border-emerald-500"
          />
          <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition">
            <Search className="w-3.5 h-3.5" />
            <span>Analyze Policy</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              filter === "all"
                ? "bg-slate-800 text-white border-slate-700"
                : "bg-[#0c111e] text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            All Policy Claims ({claims.length})
          </button>
          <button
            onClick={() => setFilter("inconsistent")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              filter === "inconsistent"
                ? "bg-rose-950/60 text-rose-300 border-rose-800"
                : "bg-[#0c111e] text-slate-400 border-slate-800 hover:text-rose-300"
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Potential Discrepancies Only (2)</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Strict Rule: Discrepancies do not prove legal guilt; they identify verifiable reality gaps.
        </div>
      </div>

      {/* Claims vs Behavior Cards */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-xl bg-[#0c111e] border border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Category: {item.category}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase border ${
                  item.status === "potentially_inconsistent"
                    ? "bg-rose-950/60 text-rose-300 border-rose-800"
                    : item.status === "consistent"
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {item.status.replace("_", " ")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Left: Published Policy Excerpt */}
              <div className="p-3.5 rounded-lg bg-[#080c16] border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px] uppercase">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>Stated Policy Claim</span>
                </div>
                <p className="font-semibold text-slate-200">{item.claim}</p>
                <div className="text-[11px] text-slate-400 italic bg-[#0d121f] p-2 rounded border border-slate-800">
                  {item.excerpt}
                </div>
              </div>

              {/* Right: Observed Behavior */}
              <div className="p-3.5 rounded-lg bg-[#080c16] border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px] uppercase">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Observed Network Telemetry</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{item.observedMatch}</p>
                <div className="text-[10px] font-mono text-emerald-400 pt-1">
                  Verified via Browser WebRequest & Script Inspection
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
