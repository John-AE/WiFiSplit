# Modern Wi-Fi Hotspot Splitter: System Architecture & Database Reference

This reference manual documents the multi-tier database schemas, storage fail-overs, and runtime data flows for the Hotspot Splitter application. Use this document to understand exactly where records are saved, how data moves between services, and why different hosting configurations change the storage behavior.

---

## 1. Executive Summary: Where is My Data Stored?

Because of the necessity for maximum operational uptime in various deployment environments, the platform uses a **resilient hybrid-database model**:

1. **Relational Neon PostgreSQL database** (Primary online registrar database for administrative reseller accounts).
2. **Google Firebase Firestore database** (Primary online persistence layer for all real-time operational state collections: plans, vouchers, payment sheets, logs).
3. **Localized Sandboxed LocalStorage** (Silent client fallback layer when APIs are unreachable or when running on static hosts).

```
                      +---------------------------------------+
                      |       Hotspot Splitter App UI        |
                      +-------------------+-------------------+
                                          |
                        Is API Server reachable on Origin?
                                 /                 \
                             [ YES ]             [ NO ] (e.g. Static Vercel)
                               /                     \
         +--------------------+----+             +----+--------------------+
         | Node Express API Server|             | Browser Local Sandbox  |
         | (server.ts on Port 3000)|             | (Client localStorage)   |
         +---------+----------+----+             +----+----------+---------+
                   |          |                               |
        [Neon Postgres]  [Google Firestore]          [Sandbox Keys]
        - Reseller auth  - Active Vouchers           - fallback_registrations
                         - Billing Plans             - reseller_user
                         - Active Sessions           - local state storage
                         - Subscribers ("Customers")
```

---

## 2. The Vercel Explanation: Why Registrations Go to the Browser

When testing the application on custom domains or static hosting architectures (like Vercel under `810555.xyz`):

* **The Problem:** Vercel is hosting the application as a **Client-Side Single Page Application (SPA)**. It compiles the React source files in `/src` to static files inside the `dist/` directory and serves them over a CDN. It **does not run the custom server script (`server.ts`)** in the background on port `3000`.
* **The Result:** When the browser issues an administrative HTTP call (like `POST /api/reseller/register`), static hosts like Vercel return a default `404 Not Found` or a fallback static HTML text instead of processing backend server computations.
* **The Solution (Fail-Safe Fallback):** Rather than crashing with unhandled JSON parsing syntax errors, our client interception handler instantly catches the non-JSON content, console-logs a warning (`⚠️ API server unreachable`), and transparently redirects operations into your **Browser's Local Sandbox Storage**.
* **What this means for you:**
  * If you register while connected to the active container backend (like the AI Studio development environment), the data goes securely into the remote **Neon Postgres Database** tables.
  * If you register on static environments (like Vercel under `810555.xyz`), the registration is saved locally in that browser’s virtual database (`fallback_registrations` key under `localStorage`). You can still log in, test administrative panels, modify plans, and generate coupons, but **it will not hit the remote database tables because there is no server running to receive it.**

---

## 3. Database Layout & Schema Details

### A. Neon PostgreSQL (Identity & Authentication)
Contains administrative registers for hotspot owners. When connected to a live server instance, credentials are authenticated through these tables.

#### Table: `reseller_registrations`
* **Purpose:** Stores core records for signed-up hotspot networks. Wait-listed/approved profiles require accounts registered in this structure.
* **Schema Definition:**

| Column Name | Data Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Automatic serial record index. |
| `first_name` | `VARCHAR(100)` | `NULL` allowed | First name of the merchant. |
| `last_name` | `VARCHAR(100)` | `NULL` allowed | Family name of the merchant. |
| `business_name` | `VARCHAR(255)` | `NULL` allowed | Corporate trade name of the hotspot. |
| `business_address`| `TEXT` | `NULL` allowed | Physical billing location of the router site. |
| `email_address` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL` | Registered email used for logging in. |
| `whatsapp_number` | `VARCHAR(100)` | `NULL` allowed | WhatsApp gateway contact index. |
| `password` | `VARCHAR(255)` | `NOT NULL` | Secure credentials text tag. |
| `status` | `VARCHAR(50)` | `DEFAULT 'Pending'` | Registration approval status (`Approved`, `Pending`). |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP`| Audit record creation timestamp. |

---

### B. Google Firestore Collections (Operational States)
All real-time operational indicators, plans, and subscriber records coordinate directly through Firestore when connected, matching the `firebase-blueprint.json` schemas.

```
📁 Root
 ├── 📄 reseller_profiles/{profileId}    --> Business settings & metadata
 ├── 📄 internet_plans/{planId}          --> Internet packages & prices 
 ├── 📄 payment_requests/{requestId}      --> Subscriber manual NGN receipts
 ├── 📄 active_vouchers/{voucherId}      --> Active/Used captive PIN codes
 ├── 📄 customers/{customerId}            --> Target internet Splitter Subscribers
 ├── 📄 active_sessions/{sessionId}      --> Real-time device gateway leases
 └── 📄 whatsapp_message_logs/{logId}    --> Dispatcher delivery metadata
```

#### Detailed Document Key Mapping:

#### 1. `reseller_profiles/{profileId}`
* **Purpose:** Manages global reseller brand visual presets and receipt parameters.
* **Fields:**
  * `id` (`string`): Unique identifier.
  * `business_name` (`string`): Brand header displayed to users.
  * `logo_emoji` (`string`): Representative emoji.
  * `logo_bg_color` (`string`): Brand hex tone.
  * `phone` / `whatsapp_number` (`string`): Operational hotlines.
  * `location` / `coverage_area` (`string`): Site reach information.
  * `currency` (`string`): Aesthetic default representation (e.g., `NGN`).
  * `bank_name` / `bank_account_no` / `bank_account_name` (`string`): Payout receipt account.
  * `payment_instructions` (`string`): Submitter transfer instructions.
  * `whatsapp_provider` / `whatsapp_api_key` (`string`): Twilio/Meta integration tokens.

#### 2. `internet_plans/{planId}`
* **Purpose:** Contains configuration and billing definitions for hotspot access passes.
* **Fields:**
  * `id` (`string`): Plan ID.
  * `name` (`string`): Core package name (e.g., `₦100 Super Saver`).
  * `price` (`number`): Billing cost.
  * `data_limit_gb` (`number`): Caps block thresholds.
  * `duration_hours` (`integer`): Validity countdown window.
  * `speed_limit_mbps` (`integer`): Profile internet maximum bandwidth.
  * `device_limit` (`integer`): Concurrent connections peak count.
  * `auto_expiry` (`boolean`): Disconnect trigger on completion.
  * `is_active` (`boolean`): Visibility flag on customer portals.

#### 3. `payment_requests/{requestId}`
* **Purpose:** Manual submission entries containing NGN bank transfers uploaded by subscribers.
* **Fields:**
  * `id` (`string`): Ticket transaction identifier.
  * `customer_name` / `customer_phone` / `customer_email` (`string`): Buyer metadata identifiers.
  * `plan_id` / `plan_name` / `plan_price` (`string`/`number`): Purchased rate metrics.
  * `screenshot_url` / `reference` (`string`): Validation evidence logs.
  * `status` (`string`): Approval state (`Pending`, `Approved`, `Rejected`).
  * `timestamp` (`string`): Date submitted.

#### 4. `active_vouchers/{voucherId}`
* **Purpose:** Hotspot ticket access passcodes validating direct captive connections.
* **Fields:**
  * `id` (`string`): Voucher UUID tracking code.
  * `code` (`string`): Captive portal PIN code typed by subscribers.
  * `status` (`string`): Used, Active, Expired, or Suspended flags.
  * `duration_hours` / `data_limit_gb` / `speed_limit_mbps` (`number`): Profile parameters.
  * `customer_name` / `customer_phone` / `customer_email` (`string`): Target holder indicators.

#### 5. `customers/{customerId}` (The "Accounts" Database)
* **What is this?** This structure corresponds to what the user interfaces denote as **"Subscribers" or "Customer Accounts"**.
* **Purpose:** Stores the details of users who connect to your Starlink or local router hub, tracking their usage metrics, joined timestamps, and cumulative payment summaries.
* **Fields:**
  * `id` (`string`): Subscriber tracking key.
  * `name` (`string`): Hotspot registered user name.
  * `phone` / `whatsapp` (`string`): Active subscriber routes.
  * `active_plan_id` / `active_plan_name` (`string`): Active internet services references.
  * `expiry_time` (`string`): Calculated date bounds.
  * `total_spend` (`number`): Cumulative Naira payments.
  * `history_vouchers_count` (`integer`): Total access cards printed.
  * `is_suspended` / `is_blacklisted` (`boolean`): Operational ban toggles.

#### 6. `active_sessions/{sessionId}`
* **Purpose:** Tracks simulated live connected devices leased through the gateway router's DHCP pool.
* **Fields:**
  * `id` (`string`): Active lease ID.
  * `customer_name` (`string`): Reference subscriber name.
  * `ip_address` / `mac_address` / `device_type` (`string`): Network hardware values.
  * `data_used_gb` / `upload_speed_mbps` / `download_speed_mbps` (`number`): Throughput state monitors.
  * `voucher_code` (`string`): Voucher PIN assigned for current lease.

#### 7. `whatsapp_message_logs/{logId}`
* **Purpose:** Audits WhatsApp message dispatches containing PIN vouchers or receipt receipts.
* **Fields:**
  * `id` (`string`): Execution ID.
  * `recipient_name` / `recipient_phone` (`string`): Submitter metadata indices.
  * `content` / `status` (`string`): Text message contents alongside status details.
  * `timestamp` (`string`): Operational dispatch dates.

---

## 4. Administrative Client-Side State Key Registry (LocalStorage Cache)

When running in offline/local fallback simulation modes, browser keys are automatically substituted for network server operations. Check these in your Developer Console under the `Application > Local Storage` tab:

| Key Name | Data Type | Component Location | Description |
| :--- | :--- | :--- | :--- |
| `fallback_registrations` | `JSON Array` | `ResellerAuthLogin` | Simulates the Postgres `reseller_registrations` table. All registrations made on static architectures (like Vercel) are preserved in this browser storage string. |
| `reseller_user` | `JSON Object` | `App.tsx` | Stores the active session metadata of the logged-in administrator. Keeps the dashboard open when refreshing. |
| `is_reseller_authed` | `Boolean` | `App.tsx` | State indicating if administrative credentials correspond to an active session context. |
| `starlink_business` | `JSON Object` | `App.tsx` | Offline local template caching for core brand and bank definitions. |
| `starlink_plans` | `JSON Array` | `App.tsx` | Offline local template caching for hotspot billing rate passes. |
| `starlink_vouchers` | `JSON Array` | `App.tsx` | Offline cache for active captive passcode vouchers. |
| `starlink_customers` | `JSON Array` | `App.tsx` | Offline tracking arrays for registered network subscribers. |
| `starlink_payments` | `JSON Array` | `App.tsx` | Offline log index caching manual subscriber transfer uploads. |

---

## 5. Captive Portal & Splitter Operational Workflow Checklist

This highlights how the system works live for a subscriber trying to purchase bandwidth:

1. **Captive Portal Landing:** A customer connects to the Wi-Fi. The browser redirects to the landing page showing active pricing passes fetched from `internet_plans` (backed up locally to `starlink_plans`).
2. **Payment Selection:** The subscriber chooses a plan (e.g., `₦100 Super Saver`) and is presented with the reseller's bank account credentials (customized in `reseller_profiles`).
3. **Manual Bank Transfer:** The subscriber transfers the exact code payment, fills out their name/WhatsApp numbers, inputs a bank tx reference or screenshot, and clicks **Submit Payment**.
4. **Reseller Authorization:** A new entry appears in the administrator's **Payment Tickets** tab (stored under `payment_requests`). 
5. **Voucher Generation & Delivery:** 
   * When the administrator clicks **Approve**, the system generates an access PIN (saved in `active_vouchers`).
   * The platform activates a simulator to dispatch a receipt containing the PIN to the subscriber's WhatsApp (logging to `whatsapp_message_logs`).
   * The subscriber is registered under the subscribers collection (`customers`) and their telemetry is processed inside the live system.
