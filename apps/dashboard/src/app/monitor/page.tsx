"use client";

import React, { useState } from "react";
import {
  Activity,
  Filter,
  Pause,
  Play,
  ShieldAlert,
  ShieldCheck,
  Search,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface TelemetryEvent {
  id: string;
  time: string;
  site: string;
  destination: string;
  destinationDomain: string;
  resourceType: string;
  isThirdParty: boolean;
  trackerMatch: boolean;
  category: string;
  owner?: string;
  confidence: number;
}

const initialStream: TelemetryEvent[] = [
  {
    id: "evt-101",
    time: "12:15:02.140",
    site: "store.nike.com",
    destination: "https://connect.facebook.net/en_US/fbevents.js",
    destinationDomain: "connect.facebook.net",
    resourceType: "script",
    isThirdParty: true,
    trackerMatch: true,
    category: "advertising",
    owner: "Meta Platforms, Inc.",
    confidence: 0.99,
  },
  {
    id: "evt-102",
    time: "12:15:02.185",
    site: "store.nike.com",
    destination: "https://www.google-analytics.com/g/collect?v=2&tid=G-XXXXX",
    destinationDomain: "google-analytics.com",
    resourceType: "xmlhttprequest",
    isThirdParty: true,
    trackerMatch: true,
    category: "analytics",
    owner: "Alphabet Inc.",
    confidence: 0.98,
  },
  {
    id: "evt-103",
    time: "12:15:02.320",
    site: "store.nike.com",
    destination: "https://clarity.ms/s/0.7.20/clarity.js",
    destinationDomain: "clarity.ms",
    resourceType: "script",
    isThirdParty: true,
    trackerMatch: true,
    category: "fingerprinting",
    owner: "Microsoft Corp.",
    confidence: 0.95,
  },
  {
    id: "evt-104",
    time: "12:15:02.401",
    site: "store.nike.com",
    destination: "https://api.nike.com/product_feed/v1?token=[REDACTED]",
    destinationDomain: "api.nike.com",
    resourceType: "fetch",
    isThirdParty: false,
    trackerMatch: false,
    category: "first_party",
    confidence: 1.0,
  },
  {
    id: "evt-105",
    time: "12:15:02.580",
    site: "store.nike.com",
    destination: "https://adservice.google.com/adsid/integrator.sync",
    destinationDomain: "adservice.google.com",
    resourceType: "image",
    isThirdParty: true,
    trackerMatch: true,
    category: "advertising",
    owner: "Alphabet Inc.",
    confidence: 0.96,
  },
  {
    id: "evt-106",
    time: "12:15:02.710",
    site: "store.nike.com",
    destination: "https://c.bing.com/c.gif?redacted_id=[REDACTED_ENTROPY]",
    destinationDomain: "c.bing.com",
    resourceType: "image",
    isThirdParty: true,
    trackerMatch: true,
    category: "advertising",
    owner: "Microsoft Corp.",
    confidence: 0.92,
  },
];

export default function LiveMonitorPage() {
  const [stream, setStream] = useState<TelemetryEvent[]>(initialStream);
  const [isStreaming, setIsStreaming] = useState(true);
  const [filterThirdParty, setFilterThirdParty] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = stream.filter((e) => {
    if (filterThirdParty && !e.isThirdParty) return false;
    if (searchTerm && !e.destinationDomain.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Live Network Telemetry</h1>
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              STREAMING METADATA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time passive inspection of third-party domains, request types, and cryptographic parameter redactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              isStreaming
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                : "bg-emerald-600 hover:bg-emerald-500 text-slate-950 border-emerald-500"
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isStreaming ? "Pause Stream" : "Resume Stream"}</span>
          </button>

          <button
            onClick={() => setFilterThirdParty(!filterThirdParty)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              filterThirdParty
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : "bg-[#0d121f] text-slate-400 border-slate-800"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Third-Party Only</span>
          </button>
        </div>
      </div>

      {/* Telemetry Control Bar */}
      <div className="p-3.5 rounded-xl bg-[#0c111e] border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Data Minimization Guarantee: URL secrets, tokens, and credentials scrubbed before display</span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter destination domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1 text-xs rounded-lg bg-[#080c16] border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-56"
          />
        </div>
      </div>

      {/* Live Stream Table */}
      <div className="rounded-xl bg-[#0c111e] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Origin Site</th>
                <th className="py-3 px-4">Destination Host</th>
                <th className="py-3 px-4">Scope</th>
                <th className="py-3 px-4">Tracker Intelligence</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px] text-slate-300">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-800/20 transition">
                  <td className="py-3 px-4 text-slate-500">{evt.time}</td>
                  <td className="py-3 px-4 text-slate-300">{evt.site}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-100">{evt.destinationDomain}</span>
                  </td>
                  <td className="py-3 px-4">
                    {evt.isThirdParty ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950/60 text-rose-300 border border-rose-900/60">
                        3rd Party
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-900/60">
                        1st Party
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {evt.trackerMatch ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${
                            evt.category === "fingerprinting"
                              ? "bg-amber-950/70 text-amber-300 border-amber-800"
                              : evt.category === "advertising"
                              ? "bg-rose-950/70 text-rose-300 border-rose-800"
                              : "bg-sky-950/70 text-sky-300 border-sky-800"
                          }`}
                        >
                          {evt.category}
                        </span>
                        <span className="text-slate-400 truncate max-w-[140px]">{evt.owner}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Unmatched / Benign</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-300 border border-slate-700/80 text-[10px]">
                      {evt.resourceType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">
                    {(evt.confidence * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

