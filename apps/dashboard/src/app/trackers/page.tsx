"use client";

import React, { useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Share2, Shield, Eye, Info, Database } from "lucide-react";

const initialNodes: Node[] = [
  // Center Website
  {
    id: "site",
    position: { x: 50, y: 220 },
    data: { label: "store.nike.com\n(Target Origin)" },
    style: {
      background: "#0f172a",
      color: "#38bdf8",
      border: "2px solid #38bdf8",
      borderRadius: "10px",
      padding: "12px",
      fontSize: "12px",
      fontWeight: "bold",
      width: 170,
      textAlign: "center",
    },
  },
  // Trackers
  {
    id: "t-ga",
    position: { x: 320, y: 50 },
    data: { label: "Google Analytics 4\n[analytics]" },
    style: {
      background: "#1e1b4b",
      color: "#c084fc",
      border: "1px solid #c084fc",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "11px",
      width: 160,
    },
  },
  {
    id: "t-fb",
    position: { x: 320, y: 150 },
    data: { label: "Meta Pixel\n[advertising]" },
    style: {
      background: "#4c0519",
      color: "#fda4af",
      border: "1px solid #fda4af",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "11px",
      width: 160,
    },
  },
  {
    id: "t-clarity",
    position: { x: 320, y: 250 },
    data: { label: "Microsoft Clarity\n[fingerprinting]" },
    style: {
      background: "#451a03",
      color: "#fcd34d",
      border: "1px solid #fcd34d",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "11px",
      width: 160,
    },
  },
  {
    id: "t-criteo",
    position: { x: 320, y: 350 },
    data: { label: "Criteo Retargeting\n[advertising]" },
    style: {
      background: "#4c0519",
      color: "#fda4af",
      border: "1px solid #fda4af",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "11px",
      width: 160,
    },
  },
  // Parent Corporations
  {
    id: "c-alphabet",
    position: { x: 580, y: 70 },
    data: { label: "Alphabet Inc.\n(Google)" },
    style: {
      background: "#064e3b",
      color: "#6ee7b7",
      border: "2px solid #10b981",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "11px",
      fontWeight: "bold",
      width: 150,
      textAlign: "center",
    },
  },
  {
    id: "c-meta",
    position: { x: 580, y: 170 },
    data: { label: "Meta Platforms, Inc.\n(Facebook)" },
    style: {
      background: "#064e3b",
      color: "#6ee7b7",
      border: "2px solid #10b981",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "11px",
      fontWeight: "bold",
      width: 150,
      textAlign: "center",
    },
  },
  {
    id: "c-msft",
    position: { x: 580, y: 270 },
    data: { label: "Microsoft Corp." },
    style: {
      background: "#064e3b",
      color: "#6ee7b7",
      border: "2px solid #10b981",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "11px",
      fontWeight: "bold",
      width: 150,
      textAlign: "center",
    },
  },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "site", target: "t-ga", animated: true, style: { stroke: "#94a3b8" } },
  { id: "e2", source: "site", target: "t-fb", animated: true, style: { stroke: "#f43f5e" } },
  { id: "e3", source: "site", target: "t-clarity", animated: true, style: { stroke: "#f59e0b" } },
  { id: "e4", source: "site", target: "t-criteo", animated: true, style: { stroke: "#f43f5e" } },
  { id: "e5", source: "t-ga", target: "c-alphabet", markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: "#10b981" } },
  { id: "e6", source: "t-fb", target: "c-meta", markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: "#10b981" } },
  { id: "e7", source: "t-clarity", target: "c-msft", markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: "#10b981" } },
];

export default function TrackerIntelligenceGraphPage() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [selectedEntity, setSelectedEntity] = useState<string>("Meta Pixel");

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Tracker Intelligence Graph</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              RELATIONSHIP MAPPING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Interactive node-link graph mapping verified network telemetry from origin sites to tracker services and ultimate corporate parents.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-[#0f172a] border border-[#38bdf8] text-[#38bdf8]">Origin Website</span>
          <span className="px-2 py-1 rounded bg-[#4c0519] border border-[#fda4af] text-[#fda4af]">Tracker Service</span>
          <span className="px-2 py-1 rounded bg-[#064e3b] border border-[#10b981] text-[#6ee7b7]">Corporate Owner</span>
        </div>
      </div>

      {/* Main Flow Canvas & Details Sidebar */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* React Flow Container */}
        <div className="lg:col-span-3 rounded-xl bg-[#0c111e] border border-slate-800 relative overflow-hidden h-[540px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <Background color="#1e293b" gap={16} />
            <Controls className="bg-slate-900 border-slate-800 text-slate-300" />
          </ReactFlow>
        </div>

        {/* Entity Inspector Sidebar */}
        <div className="p-5 rounded-xl bg-[#0c111e] border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm uppercase tracking-wide border-b border-slate-800 pb-2">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>Entity Inspector</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Inspected Entity:</span>
                <span className="text-sm font-bold text-white">{selectedEntity}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Classification:</span>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase bg-rose-950/60 text-rose-300 border border-rose-900">
                  Targeted Advertising / Pixel
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Observed Endpoints:</span>
                <code className="text-[11px] font-mono text-emerald-400 block bg-[#080c16] p-2 rounded border border-slate-800 mt-1">
                  connect.facebook.net/en_US/fbevents.js
                </code>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Ultimate Corporate Parent:</span>
                <span className="text-slate-200 font-medium">Meta Platforms, Inc. (Menlo Park, CA)</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Technical Capability:</span>
                <p className="text-slate-400 text-[11px] leading-relaxed mt-1">
                  Synchronizes browser identities with user Facebook profiles, tracking page visits, additions to cart, and off-site purchase conversions.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#080c16] border border-slate-800 text-[10px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">Deterministic Source:</div>
            <div>Matched from Disconnect Tracking Protection + PRIVACYLENS Verified Intelligence Catalog.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

