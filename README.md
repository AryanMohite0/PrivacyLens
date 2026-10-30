# PRIVACYLENS

> **See what websites don't tell you.**
> Evidence-backed, open-source AI privacy inspector comparing actual browser behavior against published privacy policies.

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue.svg)](apps/extension)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](apps/api)
[![Next.js](https://img.shields.io/badge/Dashboard-Next.js%2014-black.svg)](apps/dashboard)

---

## 1. Product Vision & Architecture

Ordinary browser extensions merely summarize lengthy privacy policies without knowing if the website actually follows them. **PRIVACYLENS** is built differently: it observes a website's live client-side behavior, extracts structured disclosures from its privacy policy, and highlights the **Privacy Reality Gap** with verifiable evidence.

### The Three-Tier Intelligence Separation

To eliminate hallucination and guarantee technical accuracy, PRIVACYLENS enforces strict separation of responsibilities:

```
┌────────────────────────────────────────────────────────┐
│               1. DETERMINISTIC ENGINE                  │
│ • Passive chrome.webRequest metadata observation       │
│ • Disconnect & EasyPrivacy-style curated database      │
│ • eTLD+1 first vs. third-party domain resolution       │
│ • LocalStorage, SessionStorage & Cookie security flags │
└───────────────────────────┬────────────────────────────┘
                            │ Observed Telemetry Events
┌───────────────────────────▼────────────────────────────┐
│                    2. RISK ENGINE                      │
│ • R = 0.35T + 0.25C + 0.15P + 0.25D                    │
│ • Privacy Score = 100 - R                              │
│ • Evidence-grounded Reality Gap detection              │
│ • Strict categorization: Consistent / Inconsistent     │
└───────────────────────────┬────────────────────────────┘
                            │ Grounded Evidence Graph
┌───────────────────────────▼────────────────────────────┐
│                    3. AI ENGINE                        │
│ • Structured policy claim extraction (NLP / Ollama)    │
│ • Grounded Explanation Copilot with citations          │
│ • Refusal to speculate when evidence is insufficient   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Structure

```
PRIVACYLENS/
├── apps/
│   ├── extension/          # Chrome MV3 Extension (Vite, React, TypeScript, Tailwind)
│   ├── dashboard/          # Companion Dashboard (Next.js 14, React Flow, Recharts)
│   └── api/                # Backend API (FastAPI, SQLAlchemy, SQLite/PostgreSQL)
├── intelligence/
│   ├── tracker_database/   # Curated tracker registry with parent companies
│   ├── domain_classifier/  # eTLD+1 root domain classifier
│   └── risk_engine/        # Deterministic scoring engine
├── packages/
│   └── shared/             # Shared TypeScript schemas, types & URL sanitizer
├── datasets/
│   ├── sample_policies/    # Test privacy policy corpus
│   └── evaluation_cases/   # Synthetic & labeled benchmark test cases
├── infrastructure/
│   └── docker/             # Production Dockerfiles
├── docker-compose.yml
└── README.md
```

---

## 3. Mathematical Scoring Engine

The privacy assessment is calculated through a calibrated, deterministic formula:

$$\text{Risk Score } R = 0.35T + 0.25C + 0.15P + 0.25D$$
$$\text{Privacy Score} = 100 - R$$

Where:
* **$T$ (Tracking Exposure)**: Volume of third-party domains, presence of session replay / canvas fingerprinting (Microsoft Clarity, FullStory, FingerprintJS), and cross-site advertising networks.
* **$C$ (Cookie & Storage Exposure)**: Third-party cookies, persistent retention (>180 days), missing `Secure` / `HttpOnly` flags, and high-entropy unique identifiers in `localStorage`.
* **$P$ (Permission Exposure)**: High-risk browser permissions granted (Geolocation, Camera, Microphone, Notifications).
* **$D$ (Disclosure Concerns & Reality Gap)**: Missing policy disclosure, undisclosed advertising retargeting, or broad data sale provisions.

---

## 4. Getting Started

### Prerequisites
* **Node.js**: v20+ (tested on v24.19.0)
* **Python**: 3.11+ (tested on 3.12.10)
* **Chrome or Edge** browser

### Quick Install

```bash
# 1. Clone & install root workspace dependencies
git clone https://github.com/privacylens/privacylens.git
cd privacylens
npm install

# 2. Run deterministic intelligence unit tests
npm test
```

### Loading the Chrome MV3 Extension
1. Build the extension:
   ```bash
   npm --workspace=@privacylens/extension run build
   ```
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top right toggle).
4. Click **Load unpacked** and select the folder:
   `apps/extension/dist`
5. Click the PRIVACYLENS icon in your browser toolbar on any website.

### Running the FastAPI Backend
```bash
# Set up virtual environment & install requirements
python -m venv apps/api/.venv
apps/api/.venv/Scripts/pip install -r apps/api/requirements.txt

# Run backend server
apps/api/.venv/Scripts/uvicorn apps.api.app.main:app --reload --port 8000
```
API Documentation is available at: `http://localhost:8000/docs`

### Running the Web Intelligence Dashboard
```bash
npm --workspace=@privacylens/dashboard run dev
```
Open `http://localhost:3000` to view the Live Monitor, Tracker Intelligence Graph, Policy Analyzer, and Evidence Copilot.

---

## 5. Security & Privacy Non-Negotiables

* **Local-First by Default**: Raw network observations and cookie data remain in local memory/storage.
* **Data Minimization**: PRIVACYLENS records domain metadata and resource types only. It never captures request/response bodies or passwords.
* **Query Parameter Sanitization**: All URL query parameters matching tokens, auth secrets, email addresses, session IDs, or high-entropy hashes are scrubbed before storage.
* **No Unsanctioned Blocking**: Passive monitoring by default; tracker blocking requires explicit user toggle via `declarativeNetRequest`.
* **No Speculation**: The AI Copilot only cites verifiable telemetry IDs and extracted policy clauses.

---

## 6. License

Released under the [MIT License](LICENSE).
