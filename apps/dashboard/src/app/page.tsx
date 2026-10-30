"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Eye,
  Server,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const categoryData = [
  { name: "Advertising", count: 48, color: "#f43f5e" },
  { name: "Analytics", count: 35, color: "#38bdf8" },
  { name: "Fingerprinting", count: 18, color: "#f59e0b" },
  { name: "Social Media", count: 14, color: "#a855f7" },
  { name: "Customer Chat", count: 9, color: "#10b981" },
];

const recentScans = [
  {
    domain: "store.nike.com",
    url: "https://store.nike.com/us/en_us/",
    score: 54,
    grade: "D",
    tScore: 65,
    trackers: 12,
    highRisk: ["Microsoft Clarity", "Meta Pixel"],
    time: "2 mins ago",
  },
  {
    domain: "techcrunch.com",
    url: "https://techcrunch.com/",
    score: 38,
    grade: "F",
    tScore: 82,
    trackers: 22,
    highRisk: ["Criteo", "LiveRamp", "The Trade Desk"],
    time: "15 mins ago",
  },
  {
    domain: "wikipedia.org",
    url: "https://www.wikipedia.org/",
    score: 98,
    grade: "A",
    tScore: 0,
    trackers: 0,
    highRisk: [],
    time: "1 hour ago",
  },
  {
    domain: "github.com",
    url: "https://github.com/",
    score: 86,
    grade: "A",
    tScore: 10,
    trackers: 1,
    highRisk: [],
    time: "3 hours ago",
  },
];

export default function OverviewPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredScans = recentScans.filter((s) =>
    s.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Privacy Telemetry Overview
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-normal">
              EVIDENCE VERIFIED
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic surveillance monitoring comparing live browser behavior against disclosed privacy policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search domain or tracker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-1.5 text-xs rounded-lg bg-[#0d121f] border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-64"
            />
          </div>
          <Link
            href="/monitor"
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Open Live Stream</span>
          </Link>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0c111e] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Privacy Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">69.0 <span className="text-xs text-slate-500 font-semibold">/ 100</span></div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3 h-3" /> Formula: 100 - (0.35T + 0.25C + 0.15P + 0.25D)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c111e] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Observed Trackers</span>
            <Eye className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">124</div>
          <div className="text-[11px] text-rose-400 font-mono">
            18 Fingerprinting / Session Recorders
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c111e] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Verified Requests</span>
            <Server className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">1,482</div>
          <div className="text-[11px] text-slate-400 font-mono">
            100% URL parameters sanitized
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c111e] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Reality Gaps Found</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">27</div>
          <div className="text-[11px] text-amber-400 font-mono">
            Undisclosed ad/behavioral tracking
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tracker Category Breakdown */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0c111e] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Tracker Category Distribution
            </h2>
            <span className="text-xs text-slate-500 font-mono">Verified Deterministic Matches</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" stroke="#475569" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={11} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0b0f1a", borderColor: "#1e293b", fontSize: "12px", color: "#f8fafc" }}
                  formatter={(val) => [`${val} active tracker domains`, "Volume"]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intelligence Highlights */}
        <div className="p-5 rounded-xl bg-[#0c111e] border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide mb-3">
              Top Data Aggregators
            </h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#0e1424] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Alphabet Inc. (Google)</div>
                  <div className="text-[10px] text-slate-400">Analytics, Ads, DoubleClick, Tag Manager</div>
                </div>
                <span className="text-rose-400 font-mono font-bold">92% sites</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0e1424] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Meta Platforms, Inc.</div>
                  <div className="text-[10px] text-slate-400">Facebook Pixel, Graph API</div>
                </div>
                <span className="text-rose-400 font-mono font-bold">64% sites</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0e1424] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Microsoft Corp.</div>
                  <div className="text-[10px] text-slate-400">Clarity, Bing Ads, Xandr</div>
                </div>
                <span className="text-amber-400 font-mono font-bold">41% sites</span>
              </div>
            </div>
          </div>

          <Link
            href="/trackers"
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700"
          >
            <span>Explore Tracker Graph</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Monitored Websites Table */}
      <div className="rounded-xl bg-[#0c111e] border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
            Recent Monitored Websites
          </h2>
          <span className="text-xs text-slate-500 font-mono">Showing {filteredScans.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Target Website</th>
                <th className="py-3 px-4">Privacy Score</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Trackers Detected</th>
                <th className="py-3 px-4">High-Risk Entities</th>
                <th className="py-3 px-4">Last Inspected</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredScans.map((scan) => (
                <tr key={scan.domain} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>{scan.domain}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold font-mono text-white">
                    {scan.score}/100
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                        scan.grade === "A"
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                          : scan.grade === "B"
                          ? "bg-sky-950/60 text-sky-400 border-sky-800"
                          : scan.grade === "C"
                          ? "bg-amber-950/60 text-amber-400 border-amber-800"
                          : "bg-rose-950/60 text-rose-400 border-rose-800"
                      }`}
                    >
                      Grade {scan.grade}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono">{scan.trackers} services</td>
                  <td className="py-3.5 px-4">
                    {scan.highRisk.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {scan.highRisk.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-900/60 font-mono"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">None detected</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">{scan.time}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/website/${scan.domain}`}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium inline-flex items-center gap-1 transition"
                    >
                      <span>Audit</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
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

