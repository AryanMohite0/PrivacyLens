import React, { useEffect, useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Cookie,
  HardDrive,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { RealityGapFinding, RiskScore } from '../../../../packages/shared/src';

interface TabStatusResponse {
  active: boolean;
  domain?: string;
  url?: string;
  eventsCount?: number;
  trackersDetected?: number;
  highRiskTrackers?: string[];
  categoriesDetected?: Record<string, number>;
  cookiesCount?: number;
  thirdPartyCookiesCount?: number;
  storageKeysCount?: number;
  score?: RiskScore;
  findings?: RealityGapFinding[];
  blockingEnabled?: boolean;
}

export const Popup: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TabStatusResponse | null>(null);
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);
  const [blockerActive, setBlockerActive] = useState(false);

  const fetchStatus = () => {
    setLoading(true);
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      // Mock for browser preview / local dev testing
      setTimeout(() => {
        setData({
          active: true,
          domain: 'store.example.com',
          url: 'https://store.example.com/products',
          eventsCount: 34,
          trackersDetected: 5,
          highRiskTrackers: ['Microsoft Clarity'],
          categoriesDetected: { advertising: 3, analytics: 2, fingerprinting: 1 },
          cookiesCount: 14,
          thirdPartyCookiesCount: 8,
          storageKeysCount: 6,
          score: {
            overallPrivacyScore: 62,
            riskScore: 38,
            trackingExposure: 55,
            cookieExposure: 40,
            permissionExposure: 0,
            disclosureConcerns: 35,
            grade: 'C',
            weights: { T: 0.35, C: 0.25, P: 0.15, D: 0.25 },
            calculatedAt: new Date().toISOString(),
          },
          findings: [
            {
              id: 'f1',
              category: 'fingerprinting',
              title: 'Session Recording Script Detected (Clarity)',
              observedBehavior: 'Monitors DOM mouse activity and page heatmaps.',
              policyClaim: 'Requires clear explicit consent.',
              status: 'potentially_inconsistent',
              severity: 'high',
              evidenceReferences: ['clarity.ms'],
              explanation: 'Records user interaction without verifying explicit opt-in.',
            },
            {
              id: 'f2',
              category: 'reality_gap',
              title: 'Undisclosed Advertising Trackers Active',
              observedBehavior: 'Observed Meta Pixel and DoubleClick requests.',
              policyClaim: 'Policy does not disclose third-party retargeting.',
              status: 'potentially_inconsistent',
              severity: 'high',
              evidenceReferences: ['connect.facebook.net'],
              explanation: 'Discrepancy between stated data practices and real network transmissions.',
            },
            {
              id: 'f3',
              category: 'cookie_security',
              title: 'Insecure Third-Party Cookies',
              observedBehavior: '3 cookies lack the Secure SSL flag.',
              policyClaim: 'Transmission over secure channel required.',
              status: 'potentially_inconsistent',
              severity: 'medium',
              evidenceReferences: ['example.net'],
              explanation: 'Cookies may leak over unencrypted requests.',
            },
          ],
          blockingEnabled: false,
        });
        setLoading(false);
      }, 300);
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab || !activeTab.id) {
        setLoading(false);
        return;
      }
      setCurrentTabId(activeTab.id);

      chrome.runtime.sendMessage(
        { type: 'GET_CURRENT_TAB_STATUS', tabId: activeTab.id },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn(chrome.runtime.lastError);
          }
          if (response && response.active) {
            setData(response);
            setBlockerActive(response.blockingEnabled || false);
          }
          setLoading(false);
        }
      );
    });
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleBlocker = () => {
    const nextState = !blockerActive;
    setBlockerActive(nextState);
    if (currentTabId && typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'TOGGLE_BLOCKER',
        tabId: currentTabId,
        enabled: nextState,
      });
    }
  };

  const openDashboard = () => {
    const domain = data?.domain || 'overview';
    const url = `http://localhost:3000/website/${domain}`;
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/20';
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
      case 'high':
        return 'bg-rose-950/60 text-rose-300 border-rose-800/60';
      case 'medium':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col w-[380px] bg-[#090d16] border border-slate-800 text-slate-200 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d121f] border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider uppercase text-slate-100 flex items-center gap-1.5">
              PRIVACYLENS
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 truncate max-w-[190px]">
              {data?.domain || 'Waiting for page...'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          title="Refresh Inspection"
          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {loading && !data ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400">Inspecting network & trackers...</span>
        </div>
      ) : !data?.active ? (
        <div className="p-6 text-center text-xs text-slate-400">
          <ShieldAlert className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          Navigate to an active web page to start privacy inspection.
        </div>
      ) : (
        <div className="p-4 space-y-3.5 text-xs">
          {/* Main Privacy Score Card */}
          <div className="p-3.5 rounded-xl bg-[#0f1523] border border-slate-800 flex items-center justify-between shadow-lg">
            <div className="space-y-1">
              <span className="text-[11px] font-medium tracking-wide uppercase text-slate-400">
                Privacy Score
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {data.score?.overallPrivacyScore ?? '--'}
                </span>
                <span className="text-slate-500 font-semibold text-xs">/ 100</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Grade {data.score?.grade ?? 'C'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Formula: 100 - (0.35T + 0.25C + 0.15P + 0.25D)
              </p>
            </div>

            <div
              className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-bold text-sm shadow-inner ${getScoreColor(
                data.score?.overallPrivacyScore ?? 50
              )}`}
            >
              {data.score && data.score.overallPrivacyScore >= 70 ? (
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-7 h-7 text-amber-400" />
              )}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-[#0d121f] border border-slate-800/80">
              <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                <Eye className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-medium uppercase">Trackers</span>
              </div>
              <div className="text-base font-bold text-slate-100">
                {data.trackersDetected ?? 0}
              </div>
              <div className="text-[9px] text-slate-500 truncate">
                {data.highRiskTrackers && data.highRiskTrackers.length > 0
                  ? `${data.highRiskTrackers.length} high-risk`
                  : '0 high-risk'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0d121f] border border-slate-800/80">
              <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                <Cookie className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-medium uppercase">Cookies</span>
              </div>
              <div className="text-base font-bold text-slate-100">
                {data.cookiesCount ?? 0}
              </div>
              <div className="text-[9px] text-slate-500">
                {data.thirdPartyCookiesCount ?? 0} 3rd party
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0d121f] border border-slate-800/80">
              <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                <HardDrive className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-medium uppercase">Storage</span>
              </div>
              <div className="text-base font-bold text-slate-100">
                {data.storageKeysCount ?? 0}
              </div>
              <div className="text-[9px] text-slate-500">keys stored</div>
            </div>
          </div>

          {/* Top Privacy Findings */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span className="uppercase tracking-wide">Key Evidence Findings</span>
              <span className="text-[10px] text-slate-500">
                {data.findings?.length ?? 0} detected
              </span>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {data.findings && data.findings.length > 0 ? (
                data.findings.slice(0, 3).map((f) => (
                  <div
                    key={f.id}
                    className="p-2 rounded-lg bg-[#0f1523] border border-slate-800/90 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-medium text-slate-200 truncate">{f.title}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase border ${getSeverityBadge(
                          f.severity
                        )}`}
                      >
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{f.observedBehavior}</p>
                    <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
                      <span>Ref:</span>
                      <span className="truncate max-w-[200px] text-slate-400">
                        {f.evidenceReferences.join(', ')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-[10px] text-slate-500 rounded bg-[#0f1523] border border-slate-800/60">
                  No critical privacy hazards detected for this page.
                </div>
              )}
            </div>
          </div>

          {/* Tracker Blocker Quick Control */}
          <div className="p-2.5 rounded-lg bg-[#0d121f] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <span className="font-medium text-[11px] text-slate-200 block">
                  Enforce Tracker Guard
                </span>
                <span className="text-[9px] text-slate-500">
                  Block confirmed cross-site ad & analytics requests
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleBlocker}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                blockerActive ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                  blockerActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Button: Open Web Intelligence Dashboard */}
          <button
            onClick={openDashboard}
            className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-lg shadow-emerald-950/40"
          >
            <span>Open Intelligence Graph & Policy Audit</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-[#070a12] border-t border-slate-900 flex items-center justify-between text-[9px] text-slate-500">
        <span>PRIVACYLENS Core Engine v1.0</span>
        <span className="text-emerald-500/80">Local-First Sandbox</span>
      </div>
    </div>
  );
};
