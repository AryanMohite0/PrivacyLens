"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  Cookie,
  HardDrive,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Bot,
  CheckCircle2,
  Lock,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

export default function WebsiteAnalysisPage({
  params,
}: {
  params: { domain: string };
}) {
  const [activeTab, setActiveTab] = useState<"findings" | "trackers" | "cookies" | "storage">("findings");

  const domain = params.domain || "store.nike.com";

  // Score breakdown (T, C, P, D)
  const scoreData = [
    { subject: "Tracking Exposure (T)", value: 65, fullMark: 100 },
    { subject: "Cookie Exposure (C)", value: 50, fullMark: 100 },
    { subject: "Permission Exposure (P)", value: 0, fullMark: 100 },
    { subject: "Disclosure Concerns (D)", value: 45, fullMark: 100 },
  ];

  // R = 0.35*65 + 0.25*50 + 0.15*0 + 0.25*45 = 22.75 + 12.5 + 0 + 11.25 = 46.5
  // Overall Privacy Score = 100 - 46.5 = 53.5 (Grade D)
  const privacyScore = 54;
  const grade = "D";

  const findings = [
    {
      id: "f-1",
      category: "fingerprinting",
      title: "Session Recording & DOM Monitoring Script (Microsoft Clarity)",
      observed: "Loaded clarity.ms/s/0.7.20/clarity.js which captures continuous mouse movement, clicks, and page scroll replay.",
      claim: "Requires explicit user opt-in before initialization under GDPR Art 6.",
      status: "potentially_inconsistent",
      severity: "high",
      references: ["clarity.ms"],
      explanation: "Granular user behavioral monitoring active prior to verifying visitor consent choice.",
    },
    {
      id: "f-2",
      category: "reality_gap",
      title: "Active Third-Party Retargeting Pixel (Meta Facebook)",
      observed: "Observed network beacon to connect.facebook.net transmitting product catalog page views.",
      claim: "Policy claims personal information is only shared with essential order fulfillment contractors.",
      status: "potentially_inconsistent",
      severity: "high",
      references: ["connect.facebook.net"],
      explanation: "Discrepancy detected: commercial ad tracking pixel active despite narrow stated data sharing disclosures.",
    },
    {
      id: "f-3",
      category: "cookie_security",
      title: "Unencrypted Third-Party Cookie Flag",
      observed: "Cookie '_fbp' received without the 'Secure' attribute flag.",
      claim: "Sensitive authentication and session cookies must travel exclusively over TLS.",
      status: "potentially_inconsistent",
      severity: "medium",
      references: ["_fbp"],
      explanation: "Cleartext transmission risks interception on unencrypted network hops.",
    },
  ];

  const trackers = [
    { name: "Google Analytics 4", domain: "google-analytics.com", category: "analytics", owner: "Alphabet Inc.", risk: "medium" },
    { name: "Meta Pixel", domain: "connect.facebook.net", category: "advertising", owner: "Meta Platforms, Inc.", risk: "high" },
    { name: "Microsoft Clarity", domain: "clarity.ms", category: "fingerprinting", owner: "Microsoft Corp.", risk: "high" },
    { name: "DoubleClick AdServices", domain: "doubleclick.net", category: "advertising", owner: "Alphabet Inc.", risk: "high" },
    { name: "Criteo Dynamic Retargeting", domain: "criteo.com", category: "advertising", owner: "Criteo S.A.", risk: "high" },
  ];

  const cookies = [
    { name: "_fbp", domain: ".nike.com", secure: false, httpOnly: false, sameSite: "Lax", duration: "90 days", category: "advertising" },
    { name: "_ga", domain: ".nike.com", secure: true, httpOnly: false, sameSite: "Lax", duration: "730 days", category: "analytics" },
    { name: "_gid", domain: ".nike.com", secure: true, httpOnly: false, sameSite: "Lax", duration: "1 day", category: "analytics" },
    { name: "session_token", domain: "nike.com", secure: true, httpOnly: true, sameSite: "Strict", duration: "Session", category: "functional" },
  ];

  const storageItems = [
    { key: "_clarity_uid", type: "localStorage", size: "48 bytes", entropy: "High (UUID)" },
    { key: "cart_state", type: "localStorage", size: "2.4 KB", entropy: "Low" },
    { key: "fbp_event_queue", type: "localStorage", size: "310 bytes", entropy: "High (Hex Token)" },
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumb & Domain Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
            <Link href="/" className="hover:text-emerald-400 transition">Websites</Link>
            <span>/</span>
            <span className="text-slate-200">{domain}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Evidence Audit: {domain}
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono font-medium">
              MANIFEST V3 AUDIT
            </span>
          </h1>
        </div>

        <Link
          href={`/copilot?domain=${domain}`}
          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
        >
          <Bot className="w-4 h-4" />
          <span>Ask Copilot About This Site</span>
        </Link>
      </div>

      {/* Main Score & Radar Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Overview */}
        <div className="p-6 rounded-xl bg-[#0c111e] border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Composite Privacy Score
            </span>
            <div className="flex items-baseline space-x-3">
              <span className="text-5xl font-black text-white tracking-tight">{privacyScore}</span>
              <span className="text-slate-500 font-bold text-base">/ 100</span>
              <span className="px-2.5 py-1 rounded font-mono font-bold text-xs bg-rose-950/60 text-rose-300 border border-rose-800">
                Grade {grade}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Calculated using the deterministic formula: <br />
              <code className="text-[11px] text-emerald-400 font-mono">
                R = 0.35T + 0.25C + 0.15P + 0.25D
              </code>
            </p>
          </div>

          <div className="space-y-2 text-xs border-t border-slate-800/80 pt-4">
            <div className="flex justify-between text-slate-300">
              <span>Tracking Exposure (T)</span>
              <span className="font-mono text-rose-400 font-bold">65 / 100</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Cookie & Storage (C)</span>
              <span className="font-mono text-amber-400 font-bold">50 / 100</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Permission Exposure (P)</span>
              <span className="font-mono text-emerald-400 font-bold">0 / 100</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Disclosure Concerns (D)</span>
              <span className="font-mono text-amber-400 font-bold">45 / 100</span>
            </div>
          </div>
        </div>

        {/* Radar Exposure Chart */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#0c111e] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Multi-Dimensional Risk Vector
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Normalized Indicators</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={scoreData} outerRadius="75%">
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar name="Exposure" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 flex gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("findings")}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "findings"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Reality Gap Findings ({findings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("trackers")}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "trackers"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Trackers ({trackers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("cookies")}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "cookies"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Cookie className="w-3.5 h-3.5" />
          <span>Cookies ({cookies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("storage")}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "storage"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Storage Keys ({storageItems.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "findings" && (
        <div className="space-y-3">
          {findings.map((f) => (
            <div key={f.id} className="p-4 rounded-xl bg-[#0c111e] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <h3 className="text-sm font-bold text-slate-100">{f.title}</h3>
                </div>
                <span className="px-2 py-0.5 rounded font-mono uppercase text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-900/60">
                  {f.severity}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-[#090d16] p-3 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
                    Observed Behavioral Evidence:
                  </span>
                  <p className="text-slate-300">{f.observed}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
                    Stated Privacy Policy Claim:
                  </span>
                  <p className="text-slate-400 italic">&ldquo;{f.claim}&rdquo;</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span className="text-[11px]">{f.explanation}</span>
                <span className="text-emerald-400 font-mono text-[10px]">
                  Ref: {f.references.join(", ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "trackers" && (
        <div className="rounded-xl bg-[#0c111e] border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Tracker Entity</th>
                <th className="py-3 px-4">Observed Host</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Parent Corporation</th>
                <th className="py-3 px-4">Risk Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {trackers.map((t) => (
                <tr key={t.domain} className="hover:bg-slate-800/20 transition">
                  <td className="py-3 px-4 font-semibold text-slate-100">{t.name}</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">{t.domain}</td>
                  <td className="py-3 px-4 uppercase text-[10px] font-mono">{t.category}</td>
                  <td className="py-3 px-4">{t.owner}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      t.risk === "high" ? "bg-rose-950/60 text-rose-300 border border-rose-900/60" : "bg-sky-950/60 text-sky-300 border border-sky-900/60"
                    }`}>
                      {t.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "cookies" && (
        <div className="rounded-xl bg-[#0c111e] border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Cookie Identifier</th>
                <th className="py-3 px-4">Domain Scope</th>
                <th className="py-3 px-4">Secure (SSL)</th>
                <th className="py-3 px-4">HttpOnly</th>
                <th className="py-3 px-4">Retention</th>
                <th className="py-3 px-4">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs text-slate-300">
              {cookies.map((c) => (
                <tr key={c.name} className="hover:bg-slate-800/20 transition">
                  <td className="py-3 px-4 font-bold text-slate-100">{c.name}</td>
                  <td className="py-3 px-4 text-slate-400">{c.domain}</td>
                  <td className="py-3 px-4">
                    {c.secure ? (
                      <span className="text-emerald-400">Yes</span>
                    ) : (
                      <span className="text-rose-400 font-bold">No (Risk)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">{c.httpOnly ? "Yes" : "No"}</td>
                  <td className="py-3 px-4 text-slate-400">{c.duration}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] uppercase text-slate-300">
                      {c.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "storage" && (
        <div className="rounded-xl bg-[#0c111e] border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Storage Key</th>
                <th className="py-3 px-4">Store Mechanism</th>
                <th className="py-3 px-4">Payload Size Estimate</th>
                <th className="py-3 px-4">Entropy / Unique Identifier Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs text-slate-300">
              {storageItems.map((s) => (
                <tr key={s.key} className="hover:bg-slate-800/20 transition">
                  <td className="py-3 px-4 font-bold text-slate-100">{s.key}</td>
                  <td className="py-3 px-4 text-slate-400">{s.type}</td>
                  <td className="py-3 px-4">{s.size}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      s.entropy.includes("High") ? "bg-amber-950/60 text-amber-300 border border-amber-900/60" : "bg-slate-800 text-slate-400"
                    }`}>
                      {s.entropy}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

