import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import {
  Shield,
  Activity,
  Globe,
  Share2,
  FileText,
  AlertTriangle,
  Bot,
  Settings,
  Eye,
} from "lucide-react";

export const metadata: Metadata = {
  title: "PRIVACYLENS — Open-Source AI Privacy Inspector",
  description: "See what websites don't tell you. Evidence-backed privacy intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { name: "Overview", href: "/", icon: Activity },
    { name: "Live Monitor", href: "/monitor", icon: Globe },
    { name: "Website Analysis", href: "/website/nike.com", icon: Shield },
    { name: "Tracker Intelligence", href: "/trackers", icon: Share2 },
    { name: "Policy Analyzer", href: "/policy", icon: FileText },
    { name: "Risk Center", href: "/risk", icon: AlertTriangle },
    { name: "AI Copilot", href: "/copilot", icon: Bot },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <html lang="en" className="dark">
      <body className="bg-[#070a12] text-slate-100 min-h-screen flex antialiased">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-slate-800/80 bg-[#0a0e19] flex flex-col shrink-0 select-none">
          {/* Brand Header */}
          <div className="h-16 px-5 flex items-center border-b border-slate-800/80 gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-wider text-white flex items-center gap-1.5">
                PRIVACYLENS
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-tight font-medium">
                See what websites don&apos;t tell you
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="px-3 pb-2 text-[10px] font-mono tracking-wider text-slate-500 uppercase">
              Core Modules
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition group"
                >
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Engine Status */}
          <div className="p-4 border-t border-slate-800/80 bg-[#080b14]">
            <div className="p-3 rounded-lg bg-[#0e1424] border border-slate-800 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Deterministic Engine</span>
                <span className="text-emerald-400 font-mono text-[10px]">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Evidence Sanitizer</span>
                <span className="text-emerald-400 font-mono text-[10px]">ENFORCED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Local-First Sandbox</span>
                <span className="text-emerald-400 font-mono text-[10px]">100% LOCAL</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#070a12] overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}

