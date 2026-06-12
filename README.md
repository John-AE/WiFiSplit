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
*   **Direct Naira Manual Payment Flow**: Select local hourly/weekly/monthly Wi-Fi presets ($500 daily savers, super-fast unlimited weekly plans), execute offline bank transfers to the displayed business bank accounts, and input transfer references or reference proof screenshots.
*   **Safe Voucher Storage**: Retain successfully purchased active vouchers offline via localized client-safe storage.

### 3. 👑 Platform Owner (SaaS Super Admin)
*   **Multi-Tenant Node Controller**: Monitor federated wireless resellers on the SaaS platform, track lifetime revenue figures, manage suspended/active subscriber volumes, and regulate subscription limits.
*   **Starlink Node LATENCY Optimizer**: Broadcast global network latency updates and schedule active server node maintenance announcements directly to all subscriber hubs in West Africa.

---

## 🛠️ Technology & Design System

WiFiSplit is engineered with modern high-performance client-side paradigms:
*   **Engine**: React 18+ with Vite compiler
*   **Style Sheet**: Tailwind CSS engine for responsive designs
*   **Design Accents**: Custom geometric cards, state indicators, and premium high-contrast responsive metrics panels
*   **Icon Library**: `lucide-react`
*   **Animation**: Native fade and spring interactions
*   **Offline Data Resilience**: Auto-synchronizing localized states across active browser sessions using granular local storage mechanisms.

---

## 🚀 Getting Started & Test Workflows

To test the full full-stack loop inside this instant offline sandbox environment:

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
