# 🛡️ PRIVACYLENS: Comprehensive Project Dossier & Technical Specification

<div align="center">

[![Live Web Dashboard](https://img.shields.io/badge/Live%20Dashboard-Vercel-black?logo=vercel&logoColor=white)](https://privacylens-dashboard.vercel.app)
[![Download Chrome Extension](https://img.shields.io/badge/Extension%20Package-Download%20Ready%20(.zip)-success.svg)](https://github.com/AryanMohite0/PrivacyLens/raw/main/privacylens-extension.zip)
[![Source Code](https://img.shields.io/badge/GitHub-AryanMohite0%2FPrivacyLens-blue?logo=github)](https://github.com/AryanMohite0/PrivacyLens)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue.svg)](privacylens-extension)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](apps/api)
[![Gemma 4](https://img.shields.io/badge/Policy%20AI-Gemma%204-purple.svg)](infrastructure/docker/Modelfile.gemma4)
[![Zeek Protocol](https://img.shields.io/badge/Network%20Auditing-Zeek%20Wire%20Logs-orange.svg)](infrastructure/zeek/privacylens.zeek)
[![STGNN Engine](https://img.shields.io/badge/Evasive%20Tracking-STGNN%20Engine-red.svg)](apps/api/app/services/stgnn_engine.py)

**See what websites don't tell you.**  
*An evidence-backed, open-source AI privacy inspector and active defense companion comparing actual browser wire behavior against published privacy policies.*

</div>

---

## 📌 Executive Summary

Modern web privacy operates on a deceptive premise known as the **"Notice and Consent" illusion**. Websites coerce users into clicking *"Accept All"* on convoluted cookie banners, while legal teams draft 40-page privacy policies designed to obfuscate aggressive data harvesting. The fundamental flaw of the modern web is not merely the length of legal disclosures—**it is that no consumer-facing software verifies whether websites actually abide by what they write.**

Traditional privacy safeguards fail in two distinct ways:
1. **Static Domain Blocklists (e.g., EasyList, AdGuard)** rely on human-curated URL patterns. They are blind to modern evasive tactics: **CNAME cloaking** (hiding third-party trackers behind legitimate first-party subdomains), in-memory DOM session replays (Microsoft Clarity, FullStory, Hotjar), and browser fingerprinting.
2. **Generic LLM Summarizers** summarize privacy policy text in isolation, taking corporate claims at face value while remaining completely oblivious to the real-time network packets leaving the user's browser.

**PrivacyLens bridges this "Privacy Reality Gap."**

By uniting passive browser network telemetry, wire-level network auditing via **Zeek**, evasive tracking graph analysis via **Spatio-Temporal Graph Neural Networks (STGNN)**, and legal policy reasoning via **Gemma 4**, PrivacyLens compares a website's **actual technical behavior** against its **stated legal commitments**. It empowers everyday consumers and privacy researchers with calibrated mathematical safety scores, line-cited contradiction evidence, and instant 1-click active defense.

---

## 🌐 Quick Access & Public Deployment Links

* **Live Hosted Dashboard:** [https://privacylens-dashboard.vercel.app](https://privacylens-dashboard.vercel.app)
* **Official GitHub Repository:** [https://github.com/AryanMohite0/PrivacyLens](https://github.com/AryanMohite0/PrivacyLens)
* **Pre-packaged Extension (.zip):** [Direct Download `privacylens-extension.zip`](https://github.com/AryanMohite0/PrivacyLens/raw/main/privacylens-extension.zip)
* **Backend API Docs (Local):** `http://localhost:8000/docs`
* **Local Companion Dashboard:** `http://localhost:3001`

---

## 🔬 The Core Problem: The Privacy Reality Gap

```
┌────────────────────────────────────────────────────────┐       ┌────────────────────────────────────────────────────────┐
│               LEGAL DISCLOSURE (DE JURE)               │  VS   │               WIRE TELEMETRY (DE FACTO)                │
│ • "We do not sell personal data to third parties"      │       │ • Meta Pixel transmitting hashed user identifiers       │
│ • "Analytics are strictly anonymous & aggregated"      │       │ • Microsoft Clarity logging keystrokes & mouse movements│
│ • "Data is never shared without explicit consent"      │       │ • CNAME cloaked exfiltration to unlisted ad exchanges   │
└────────────────────────────────────────────────────────┘       └────────────────────────────────────────────────────────┘
                                             \                               /
                                              \                             /
                                               ▼                           ▼
                                     ┌───────────────────────────────────────────────┐
                                     │            THE PRIVACY REALITY GAP            │
                                     │  • Mathematical Contradiction Score           │
                                     │  • Line-Cited Legal Policy Citation           │
                                     │  • 1-Click Declarative Net Request Block      │
                                     └───────────────────────────────────────────────┘
```

1. **The Notice & Consent Illusion:** The average internet user encounters dozens of consent banners daily. Reading every policy would require over 250 hours per year.
2. **Evasive First-Party Masquerading:** Modern trackers disguise data exfiltration as first-party requests (e.g., `analytics.store.nike.com` resolving to an off-site ad server via CNAME DNS records), bypassing basic ad blockers.
3. **In-Memory DOM Keylogging:** Modern session replay engines record keystrokes, form submissions, and viewport scrolls before network requests are dispatched, evading traditional request-based filters.

---

## 🏗️ System Architecture & Five Technology Pillars

PrivacyLens implements a **dual-engine neuro-symbolic architecture** across five specialized components:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    1. DETERMINISTIC CLIENT ENGINE (CHROME MV3)               │
│ • Passive chrome.webRequest metadata interception (zero performance overhead)│
│ • DeclarativeNetRequest (DNR) dynamic rule sets for instant tracker disarming│
│ • Isolated World DOM Disarmer (disarm.js) neutralizing session recorders     │
│ • Canonical eTLD+1 root domain resolution & first vs. third-party taxonomy   │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ Real-time Telemetry Events
┌──────────────────────────────────────▼───────────────────────────────────────┐
│                 2. WIRE-LEVEL NETWORK AUDITOR (ZEEK MONITOR)                 │
│ • Deep packet wire inspection (dns.log, http.log, ssl.log, conn.log)         │
│ • Recursive DNS CNAME resolution unmasking cloaked tracking endpoints        │
│ • TLS handshake certificate inspection & uncloaked IP correlation            │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ Correlated Wire Artifacts
┌──────────────────────────────────────▼───────────────────────────────────────┐
│            3. EVASIVE GRAPH REASONING ENGINE (PYTORCH STGNN)                 │
│ • Spatio-Temporal Graph Neural Network (STGNN)                               │
│ • Dynamic directed graph: G_t = (V, E_t) tracking multi-hop exfiltration     │
│ • Graph temporal convolutions detecting coordinated ad network exfiltration  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ Graph Behavioral Signatures
┌──────────────────────────────────────▼───────────────────────────────────────┐
│                 4. LEGAL POLICY INTELLIGENCE (GEMMA 4 SLM)                   │
│ • Specialized Small Language Model (SLM) parsing privacy policy text         │
│ • Strict JSON Schema validation: data categories, retention, third parties   │
│ • Grounded Conversational Copilot with verbatim, line-numbered citations     │
│ • Reality Gap contradiction engine: Telemetry vs. Legal Schema               │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ Synchronized Assessment
┌──────────────────────────────────────▼───────────────────────────────────────┐
│            5. COMPANION WEB INTELLIGENCE DASHBOARD (NEXT.JS 14)              │
│ • Dark Obsidian Cyberpunk UI (#151716 obsidian / #d1fb58 cyber-lime)         │
│ • Interactive tracker graph canvas, live wire monitor, and policy auditor    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Technology Pillars Breakdown

| Pillar | Underlying Technology | Capability | Practical Consumer Impact |
| :--- | :--- | :--- | :--- |
| **1. Client Telemetry & Defense** | Chrome MV3 + `declarativeNetRequest` | Passive request metadata auditing & instant rule-based blocking | Disarms ad retargeting and beacons without breaking site layout |
| **2. In-Page DOM Disarmer** | Isolated World Script Execution (`disarm.js`) | Neutralizes in-memory session recorders (Clarity, Hotjar) | Stops keystroke logging, mouse tracking, and password scraping |
| **3. Wire Protocol Auditing** | Zeek Wire Log Parser (`privacylens.zeek`) | Deep network inspection of DNS, HTTP, and TLS handshakes | Unmasks CNAME cloaking and unlisted third-party exfiltration |
| **4. Evasive Graph AI** | Spatio-Temporal Graph Neural Network (STGNN) | Models multi-hop temporal data exfiltration chains | Catches sophisticated tracking networks that bypass static blocklists |
| **5. Policy AI & Copilot** | Fine-tuned Gemma 4 (SLM) | Structured JSON claim extraction & evidence-grounded chat | Provides instant, plain-English answers backed by verbatim policy citations |

---

## 📐 Deterministic Mathematical Risk Scoring Model

PrivacyLens avoids opaque or arbitrary scores. Web privacy risk is computed using an empirical, calibrated mathematical formula:

$$\text{Risk Score } R = 0.35T + 0.25C + 0.15P + 0.25D$$

$$\text{Privacy Safety Score} = \max(0, \min(100, 100 - R))$$

### Risk Dimensions

1. **$T$ — Tracking Exposure ($w_T = 0.35$):**
   Evaluates active third-party monitoring. Weighting reflects the severity of tracking technologies:
   * **Session Replay Keyloggers (Clarity, FullStory):** Heavy penalty (active keystroke/gesture logging).
   * **Behavioral Ad Pixels (Meta, TikTok, Criteo):** High penalty (cross-site profile building).
   * **Aggregated Web Analytics (Google Analytics):** Moderate penalty.
   * *Dynamic Feature:* When a user clicks **Guard +** / **Block**, the penalty is dynamically removed in real-time, restoring score points immediately.

2. **$C$ — Cookie & Storage Exposure ($w_C = 0.25$):**
   Assesses client-side persistence and tracking longevity:
   * Third-party tracking cookies.
   * Persistent retention lifespans exceeding 180 days.
   * Supercookies and cross-origin `localStorage` / `IndexedDB` identifiers designed to survive cookie clears.

3. **$P$ — Permission Exposure ($w_P = 0.15$):**
   Measures requests for high-privilege browser device APIs:
   * Geolocation (`navigator.geolocation`)
   * Audio Capture / Microphone (`navigator.mediaDevices.getUserMedia`)
   * Video Capture / Camera

4. **$D$ — Disclosure Concerns & Reality Gap ($w_D = 0.25$):**
   Evaluates legal transparency:
   * Missing, obfuscated, or expired privacy policy.
   * **Reality Gap Contradictions:** Observed tracking beacons operating without explicit disclosure in the published policy.

### Privacy Safety Score Grading Scale

| Score Range | Grade | Security Posture | Status Description |
| :---: | :---: | :---: | :--- |
| **90 – 100** | **Grade A** | **Excellent Protection** | Zero high-risk trackers, clean wire flow, full policy disclosure |
| **75 – 89** | **Grade B** | **Good Protection** | Standard analytics present; ad retargeting identified but controllable |
| **60 – 74** | **Grade C** | **Moderate Risk** | Persistent cross-site tracking or unlisted third-party beacons active |
| **40 – 59** | **Grade D** | **High Privacy Hazard** | Invasive session replays logging user input or CNAME cloaking detected |
| **0 – 39** | **Grade F** | **Severe Violation** | Undisclosed data sale, aggressive fingerprinting, direct policy contradiction |

---

## 📂 Monorepo Repository Structure

```
PRIVACYLENS/
├── privacylens-extension/            # Standalone zero-build Chrome MV3 Extension
│   ├── manifest.json                 # Manifest V3 (declarativeNetRequest, webRequest, storage)
│   ├── background.js                 # Event orchestrator & local scoring state manager
│   ├── content.js                    # In-page telemetry observer
│   ├── disarm.js                     # Isolated MAIN-world session recorder neutralizer
│   ├── popup.html                    # Dark Obsidian cyberpunk user interface
│   ├── popup.js                      # Reactive UI controller & dynamic score animator
│   ├── popup.css                     # Neon styling (#151716, #d1fb58, #ef4444)
│   └── icons/                        # Extension brand iconography (16, 48, 128 px)
│
├── privacylens-extension.zip         # Pre-packaged production extension archive
│
├── apps/
│   ├── api/                          # FastAPI Intelligence Backend
│   │   ├── app/
│   │   │   ├── main.py               # Application entry point & CORS configuration
│   │   │   ├── routes/               # API endpoints (scans, zeek, stgnn, copilot, health)
│   │   │   ├── services/
│   │   │   │   ├── gemma_service.py  # Gemma 4 SLM policy extractor & grounded copilot
│   │   │   │   ├── zeek_service.py   # Wire protocol log parser (DNS, HTTP, SSL)
│   │   │   │   ├── stgnn_engine.py   # PyTorch Spatio-Temporal Graph Neural Network
│   │   │   │   └── risk_engine.py    # Deterministic scoring calculation engine
│   │   │   └── schemas/              # Pydantic v2 data models & validation schemas
│   │   ├── tests/                    # 15 automated pytest suites (Zeek, STGNN, Gemma, API)
│   │   └── requirements.txt          # Python dependencies
│   │
│   ├── dashboard/                    # Companion Web Intelligence Dashboard
│   │   ├── src/app/                  # Next.js 14 App Router (Monitor, Trackers, Risk, Copilot)
│   │   ├── package.json              # Self-contained dependencies (Next 14, React 18, Recharts)
│   │   └── next.config.mjs           # Next.js deployment configuration
│   │
│   └── extension/                    # Vite + React development workspace for extension UI
│
├── intelligence/
│   ├── tracker_database/             # Registry of known trackers mapped to corporate parents
│   ├── domain_classifier/            # Canonical eTLD+1 domain root parser
│   └── risk_engine/                  # Standalone TypeScript scoring algorithm
│
├── infrastructure/
│   ├── docker/                       # Dockerfile.api, Dockerfile.zeek, Modelfile.gemma4
│   └── zeek/                         # privacylens.zeek wire sniffing script
│
├── packages/
│   └── shared/                       # Shared TypeScript types, data contracts & URL sanitizer
│
├── docs/
│   ├── architecture/                 # Full technical specification & KaTeX models
│   └── assets/                       # UI screenshots, SVG headings, and visual diagrams
│
├── tests/                            # Workspace TypeScript vitest integration suite
├── docker-compose.yml                # Multi-container orchestration (API, Zeek, Ollama)
├── ARCHITECTURE.md                   # Comprehensive system architectural document
├── SECURITY.md                       # Threat model and vulnerability disclosure policy
└── README.md                         # Public GitHub README with visual showcase
```

---

## 🧪 Empirical Verification & Test Evidence

The codebase is backed by rigorous test automation across TypeScript and Python:

### 1. Python Intelligence Backend (15/15 Passed)
```bash
$env:PYTHONPATH = "."; & apps/api/.venv/Scripts/pytest apps/api/tests
====================== 15 passed in 13.59s =======================
```
* `test_api.py`: Validates complete scan-to-copilot workflow, score calculations, and tracker inventory.
* `test_gemma_zeek.py`: Verifies clean compliance, undisclosed session recorder detection, and policy contradiction alerts.
* `test_stgnn.py`: Validates STGNN temporal graph neural network forward inference and API exfiltration path evaluation.
* `test_zeek_logs.py`: Audits raw Zeek DNS/HTTP log parsing, CNAME cloaking unmasking, and SSL handshake validation.

### 2. TypeScript Intelligence Core (8/8 Passed)
```bash
npm test
 Test Files  1 passed (1)
      Tests  8 passed (8)
```
* Canonical eTLD+1 domain classification (e.g. `sub.store.nike.com` -> `nike.com`).
* Third-party tracker detection and corporate parent entity resolution.
* Deterministic mathematical scoring assertions matching the calibrated formula.

### 3. Real-World Live Verification
* **Live Inspection on `lovable.dev`:** PrivacyLens actively audited **58 background network activities**, detected third-party ad retargeting, and calculated a dynamic score of **84 (Grade B)** with 1-click Guard capability.
* **Live Inspection on `store.nike.com`:** Detected in-page Microsoft Clarity session recording, successfully disarmed it via isolated-world script execution, and recovered the Privacy Safety Score to **100 (Grade A)**.

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js:** v20+ (tested on v24.19.0)
* **Python:** 3.11+ (tested on 3.12.10)
* **Google Chrome** or **Microsoft Edge** browser

---

### Step 1: Install & Test Monorepo
```bash
# Clone the repository
git clone https://github.com/AryanMohite0/PrivacyLens.git
cd PrivacyLens

# Install Node dependencies
npm install

# Run TypeScript intelligence test suite
npm test

# Run Python backend test suite
$env:PYTHONPATH = "."; & apps/api/.venv/Scripts/pytest apps/api/tests
```

---

### Step 2: Load the Chrome MV3 Extension
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** in the top right.
3. Click **Load unpacked** and select the folder:
   ```
   privacylens-extension
   ```
   *(Or download and extract `privacylens-extension.zip` directly).*
4. Pin **PrivacyLens** to your toolbar and visit any website (e.g., `https://lovable.dev` or `https://store.nike.com`).
5. Open the popup to observe real-time score calculation, background activities, and 1-click Guard buttons.

---

### Step 3: Run the FastAPI Backend Server
```bash
# Activate virtual environment
apps/api/.venv/Scripts/activate

# Start Uvicorn ASGI server
uvicorn apps.api.app.main:app --reload --port 8000
```
* Live OpenAPI Swagger Documentation: `http://localhost:8000/docs`

---

### Step 4: Run the Companion Web Dashboard
```bash
# Start local Next.js production server
npm --workspace=@privacylens/dashboard run start -- -p 3001
```
* Open: `http://localhost:3001` (or visit the public Vercel deployment at [https://privacylens-dashboard.vercel.app](https://privacylens-dashboard.vercel.app)).

---

## 🔒 Security & Privacy Non-Negotiables

* **Zero Telemetry Leakage:** All observed URLs and query strings are sanitized with a Shannon entropy token scrubber before evaluation. Passwords, session IDs, and OAuth tokens are permanently stripped.
* **Local-First Computation:** Real-time request monitoring and cookie assessments execute directly in local browser memory without transmitting browsing history to any remote server.
* **Layout-Preserving Declarative Blocking:** Tracker neutralization uses Chrome MV3 `declarativeNetRequest` dynamic rules, dropping unwanted network requests without causing DOM rendering collapses or site crashes.
* **Grounded AI Invariant:** Gemma 4's policy reasoning outputs strict JSON schema validated results. Every finding must include exact paragraph and sentence citations from the site's official privacy policy.

---

## 📄 License & Attribution

PrivacyLens is open-source software released under the **[MIT License](LICENSE)**.  
Designed, developed, and maintained by **Aryan Mohite** and contributors.
