# WiFiSplit 📶

An enterprise management portal and sandbox simulation built for Starlink neighborhood hotspot resellers, mini-ISPs, cybercafes, hostel Wi-Fi business operators, and student subscribers in Sub-Saharan Africa.

WiFiSplit resolves the monetization, billing, and distribution complex in low-bandwidth, credit-constrained, or manual bank-transfer environments by integrating automated captive portal planning and simulated WhatsApp billing agents.

---

## 🎨 Visual Identity & Key Features

WiFiSplit is designed as an interactive, multi-tenant sandbox simulation featuring three distinct workspace roles accessible via the top **Role Switcher Toolbar**:

### 1. 🏢 Reseller Admin (WISP Owner)
*   **Dynamic Business Configuration**: Customize local reseller shop profile, location (Yaba, Benin City, Accra, etc.), router integration preference (Starlink, MikroTik, TP-Link), and active currency (NGN, USD, KES, etc.).
*   **Voucher Generation Suite**: Instant customized voucher codes (8-symbol standard codes matching MikroTik structures), bandwidth limits, device controls, and usage durations.
*   **Printable Slips Engine**: Download and style pre-formatted print-ready slips (grids of vouchers) complete with logo emoji, rate titles, and location boundaries for physical distribution.
*   **Manual Payments Queue**: Track manual bank transfer screenshots or references uploaded by customer subscriber portals. Approve the pending payment to automatically spawn a brand new secure Wi-Fi voucher PIN.
*   **Simulated WhatsApp MessagingLogs**: Inspect automated client notifications of delivered voucher codes, payment confirmations, and active subscription thresholds.

### 2. 👤 Pupil & Subscriber Portal
*   **Device Responsive Web and Native Mockup Modes**: View the subscriber landing in standard Web responsive layout, or switch into the **Companion Android App viewport mockup** (complete with device frames and native camera notches) to simulate a true mobile-first student journey.
*   **Direct Naira Manual Payment Flow**: Select local hourly/weekly/monthly Wi-Fi presets (₦500 daily savers, super-fast unlimited weekly plans), execute offline bank transfers to the displayed business bank accounts, and input transfer references or reference proof screenshots.
*   **Safe Voucher Storage**: Retain successfully purchased active vouchers offline via localized client-safe storage.

### 3. 👑 Platform Owner (SaaS Super Admin)
*   **Multi-Tenant Node Controller**: Monitor federated wireless resellers on the SaaS platform, track lifetime revenue figures, manage suspended/active subscriber volumes, and regulate subscription limits.
*   **Starlink Node LATENCY Optimizer**: Broadcast global network latency updates and schedule active server node maintenance announcements directly to all subscriber hubs in West Africa.

---

## 🛠️ Technology & Design System

WiFiSplit is engineered with modern high-performance full-stack paradigms:

*   **Frontend Engine**: React 19 with Vite 6 compiler
*   **Backend Runtime**: Express 4 with TypeScript 5.8 on Node.js
*   **Style Sheet**: Tailwind CSS 4 engine for responsive designs
*   **Design Accents**: Custom geometric cards, state indicators, and premium high-contrast responsive metrics panels
*   **Icon Library**: `lucide-react`
*   **Animation**: `motion` (Framer Motion successor) for native fade and spring interactions
*   **Validation**: `zod` for runtime schema validation
*   **Database**: Neon PostgreSQL (primary) with automatic schema initialization, in-memory fallback, and client-side LocalStorage sandbox mirroring
*   **Security**: `bcryptjs` for password hashing, `jsonwebtoken` for reseller sessions, `express-rate-limit` for brute-force protection

---

## 🚀 Getting Started & Test Workflows

### Prerequisites
- Node.js 18+ installed
- A Neon PostgreSQL database (free tier works) with `DATABASE_URL` configured

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
The app runs on `http://localhost:3000` with the Express backend and Vite dev server.

### Production Build
```bash
npm run build
npm start
```

### Test Workflows

To test the full-stack loop inside this offline sandbox environment:

1.  **Generate a Purchase Request**:
    *   Switch the **Role Switcher** to **👤 Student / Subscriber app**.
    *   Select the popular `₦500 Mini Saver` or `₦2,500 Starlink Fast Weekly` options.
    *   Input a subscriber name (e.g. `Oluwaseun`), attach a payment reference (`TXN-99882`), and submit.
2.  **Approve and Provision**:
    *   Switch back to the **🏢 Reseller Admin** role.
    *   Navigate to the **💳 Pending Approvals** widget or review queue.
    *   Click **Approve**.
    *   A random 8-digit captive portal code is instantly spawned for Oluwaseun and logged inside the reseller's **WhatsApp Log history**.
3.  **Redeem and Observe**:
    *   Switch to the **👑 Platform Owner** view to monitor global transaction volume and system performance adjustments!

---

## 📊 Current State, Challenges & Roadmap

### ✅ What Is Already Working
- **Full-stack TypeScript architecture** with React 19 frontend and Express 4 backend
- **Automatic Neon PostgreSQL schema initialization** on connection (reseller_registrations, reseller_profiles, internet_plans, payment_requests, active_vouchers, customers, active_sessions, whatsapp_message_logs, system_config, subscribers)
- **Zod-validated API routes** with rate limiting on auth and general endpoints
- **JWT-based reseller authentication** with bcrypt password hashing
- **Comprehensive CRUD endpoints** for all operational entities (plans, vouchers, customers, payments, sessions, business profiles)
- **LocalStorage sandbox fallback** — the entire app functions fully in the browser when the API is unreachable
- **Production build pipeline** (Vite static build + esbuild server bundle)
- **Vercel deployment configuration** (`vercel.json`) with API route mapping
- **Responsive UI** with role switcher, device mockup view, printable slips, and integrity guide

### ⚠️ Current Challenges
- **Neon PostgreSQL initialization intermittently failing**: The `initializePostgres()` function retries 3 times with backoff but leaves `neonActive = false` on failure. When this happens, auth and registration endpoints return `503 Service Unavailable` instead of falling back to local storage.
- **`/api/db-health` vs `/api/db-status` mismatch**: The health endpoint creates a fresh pool and succeeds, but the main app's persistent pool/schema initialization fails, causing the status badge to show "offline" even though the database credentials are valid.
- **Local development server not currently running**: The Node.js/Express backend needs to be started with `npm run dev` for full-stack testing.
- **Static-hosted deployment limitation**: When deployed to pure static hosts (Vercel SPA mode without a running Node server), the `/api/*` routes return 404 unless the host supports serverless functions or Edge runtime for the bundled `server.cjs`.

### 🔧 What Needs To Be Resolved
1. **Fix Neon initialization error logging**: Capture and surface the exact PostgreSQL connection error so it is visible in deployment logs (currently swallowed after retries).
2. **Align `db-health` and `db-status` behavior**: Ensure the main application pool initialization shares state with the health check so both endpoints agree on connectivity.
3. **Graceful frontend fallback on 503 JSON responses**: When the API returns a structured JSON error (not just non-JSON 404), the React frontend should transparently fall back to LocalStorage sandbox instead of displaying a hard error to the user.
4. **Production hosting strategy**: Decide between:
   - Deploying to a Node.js-aware host (Render, Railway, Fly.io, Cloud Run) that runs `server.ts` continuously, OR
   - Refactoring the backend into Vercel serverless functions / Edge middleware so the current `vercel.json` build actually executes API routes.

---

## 📄 License

Apache-2.0
