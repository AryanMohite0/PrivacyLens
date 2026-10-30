"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Filter,
  CheckCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

interface RiskItem {
  id: string;
  domain: string;
  category: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  behavior: string;
  policyGap: string;
  references: string[];
  explanation: string;
}

const mockRisks: RiskItem[] = [
  {
    id: "r-1",
    domain: "store.nike.com",
    category: "fingerprinting",
    title: "Client-Side Session Replay & Keystroke Monitoring",
    severity: "high",
    behavior: "Active script clarity.ms transmitting continuous DOM mutation snapshots.",
    policyGap: "Requires prior affirmative consent under GDPR / ePrivacy Directive.",
    references: ["clarity.ms"],
    explanation: "Replay tools can inadvertently capture sensitive input data and correlate hardware signatures.",
  },
  {
    id: "r-2",
    domain: "store.nike.com",
    category: "reality_gap",
    title: "Undisclosed Cross-Site Ad Retargeting",
    severity: "high",
    behavior: "Meta Pixel firing product view beacons with visitor tracking tokens.",
    policyGap: "Current privacy disclosure claims zero third-party commercial marketing sharing.",
    references: ["connect.facebook.net"],
    explanation: "Empirical discrepancy between claimed data isolation and observable network transmissions.",
  },
  {
    id: "r-3",
    domain: "techcrunch.com",
    category: "tracker_density",
    title: "Excessive Ad-Exchange Auction Beaconing (22 Trackers)",
    severity: "high",
    behavior: "Triggered concurrent real-time bidding sync requests across Criteo, Taboola, The Trade Desk, and LiveRamp.",
    policyGap: "Exposes browser footprint across dozens of disparate data brokers.",
    references: ["criteo.com", "adsrvr.org", "rlcdn.com"],
    explanation: "Multiple concurrent DSP/SSP calls permit cross-domain behavioral aggregation.",
  },
  {
    id: "r-4",
    domain: "store.nike.com",
    category: "cookie_security",
    title: "Insecure Cookie Flag Missing",
    severity: "medium",
    behavior: "Cookie _fbp delivered without the 'Secure' attribute.",
    policyGap: "Security best practice requires HTTPS-only transmission.",
    references: ["_fbp"],
    explanation: "Cookie can be exposed in cleartext if unencrypted HTTP requests occur on subdomains.",
  },
];

export default function RiskCenterPage() {
  const [selectedSev, setSelectedSev] = useState<string>("all");

  const filtered = mockRisks.filter((r) => {
    if (selectedSev === "all") return true;
    return r.severity === selectedSev;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Privacy Risk Center</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono">
              EVIDENCE-GROUNDED FINDINGS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic violations, policy reality gaps, and browser security exposure identified across monitored domains.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2 bg-[#0c111e] p-1 rounded-lg border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setSelectedSev("all")}
            className={`px-3 py-1 rounded transition ${selectedSev === "all" ? "bg-slate-800 text-white" : "text-slate-400"}`}
          >
            All Severities
          </button>
          <button
            onClick={() => setSelectedSev("high")}
            className={`px-3 py-1 rounded transition ${selectedSev === "high" ? "bg-rose-950/80 text-rose-300" : "text-slate-400"}`}
          >
            High Risk
          </button>
          <button
            onClick={() => setSelectedSev("medium")}
            className={`px-3 py-1 rounded transition ${selectedSev === "medium" ? "bg-amber-950/80 text-amber-300" : "text-slate-400"}`}
          >
            Medium Risk
          </button>
        </div>
      </div>

      {/* Risk Findings Table */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-xl bg-[#0c111e] border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    item.severity === "high"
                      ? "bg-rose-500"
                      : item.severity === "medium"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />
                <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {item.domain}
                </span>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                  item.severity === "high"
                    ? "bg-rose-950/60 text-rose-300 border-rose-800"
                    : "bg-amber-950/60 text-amber-300 border-amber-800"
                }`}
              >
                {item.severity}
              </span>
            </div>

            <div className="text-xs text-slate-300 bg-[#080c16] p-3 rounded-lg border border-slate-800/80 space-y-2">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Observed Behavioral Evidence:</span>
                <p className="text-slate-200 mt-0.5">{item.behavior}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Privacy Regulatory / Policy Gap:</span>
                <p className="text-slate-400 mt-0.5 italic">{item.policyGap}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>{item.explanation}</span>
              <span className="text-emerald-400 font-mono text-[11px]">
                Evidence references: {item.references.join(", ")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

