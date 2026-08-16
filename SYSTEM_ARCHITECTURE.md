# Modern Wi-Fi Hotspot Splitter: System Architecture & Database Reference

This reference manual documents the multi-tier database schemas, storage fail-overs, and runtime data flows for the Hotspot Splitter application. Use this document to understand exactly where records are saved, how data moves between services, and why different hosting configurations change the storage behavior.

---

## 1. Executive Summary: Where is My Data Stored?

Because of the necessity for maximum operational uptime in various deployment environments, the platform uses a **resilient hybrid-database model**:

1. **Neon PostgreSQL database** (Primary online registrar and operational database for all entities: reseller auth, business profiles, plans, vouchers, payments, customers, sessions, logs, and system config).
2. **In-Memory Fallback Cache** (Silent runtime fallback when PostgreSQL is unreachable during a server session).
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
             [Neon Postgres]  [In-Memory Fallback]      [Sandbox Keys]
             - Reseller auth  - fallback_registrations   - fallback_registrations
             - Business       - fallbackBusiness         - reseller_user
             - Plans          - fallbackPlans            - starlink_business
             - Vouchers       - fallbackVouchers         - starlink_plans
             - Payments       - fallbackPayments         - starlink_vouchers
             - Customers      - fallbackCustomers        - starlink_customers
             - Sessions       - fallbackSessions         - starlink_payments
             - Logs           - fallbackMessageLogs
             - Config         - fallbackAnnouncement
```

---

## 2. The Vercel Explanation: Why Registrations Go to the Browser

When testing the application on custom domains or static hosting architectures (like Vercel under `wi-fi-split.vercel.app`):

* **The Problem:** Vercel is hosting the application as a **Client-Side Single Page Application (SPA)**. It compiles the React source files in `/src` to static files inside the `dist/` directory and serves them over a CDN. It **does not run the custom server script (`server.ts`)** in the background on port `3000` unless configured with serverless functions or a Node.js runtime.
* **The Result:** When the browser issues an administrative HTTP call (like `POST /api/reseller/register`), static hosts like Vercel return a default `404 Not Found` or a fallback static HTML text instead of processing backend server computations.
* **The Solution (Fail-Safe Fallback):** Rather than crashing with unhandled JSON parsing syntax errors, our client interception handler instantly catches the non-JSON content, console-logs a warning (`⚠️ API server unreachable`), and transparently redirects operations into your **Browser's Local Sandbox Storage**.
* **What this means for you:**
  * If you register while connected to the active container backend (like a Node.js server on Render, Railway, or local dev), the data goes securely into the remote **Neon PostgreSQL Database** tables.
  * If you register on static environments (like Vercel SPA mode), the registration is saved locally in that browser's virtual database (`fallback_registrations` key under `localStorage`). You can still log in, test administrative panels, modify plans, and generate coupons, but **it will not hit the remote database tables because there is no server running to receive it.**

---

## 3. Database Layout & Schema Details

### A. Neon PostgreSQL (Primary Database)

All persistent data is stored in a single Neon PostgreSQL database. The backend automatically creates all tables on startup via `initializePostgres()`.

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
| `password` | `VARCHAR(255)` | `NOT NULL` | Bcrypt-hashed credentials text tag. |
| `status` | `VARCHAR(50)` | `DEFAULT 'Pending'` | Registration approval status (`Approved`, `Pending`). |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP`| Audit record creation timestamp. |

#### Table: `reseller_profiles`
* **Purpose:** Manages global reseller brand visual presets and receipt parameters.
* **Schema Definition:**

| Column Name | Data Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(255)` | `PRIMARY KEY` | Unique identifier (matches reseller email or UUID). |
| `business_name` | `VARCHAR(255)` | `NULL` allowed | Brand header displayed to users. |
| `logo_emoji` | `VARCHAR(10)` | `NULL` allowed | Representative emoji. |
| `logo_bg_color` | `VARCHAR(20)` | `NULL` allowed | Brand hex tone. |
| `phone` / `whatsapp_number` | `VARCHAR(100)` | `NULL` allowed | Operational hotlines. |
| `location` / `coverage_area` | `TEXT` | `NULL` allowed | Site reach information. |
| `currency` | `VARCHAR(10)` | `DEFAULT 'NGN'` | Aesthetic default representation. |
| `timezone` | `VARCHAR(50)` | `DEFAULT 'Africa/Lagos'` | Business timezone. |
| `router_type` | `VARCHAR(50)` | `DEFAULT 'Starlink'` | Router integration preference. |
| `mikrotik_integration_enabled` | `BOOLEAN` | `DEFAULT FALSE` | MikroTik bridge toggle. |
| `mikrotik_host` | `VARCHAR(255)` | `NULL` allowed | MikroTik router IP. |
| `mikrotik_api_port` | `INTEGER` | `DEFAULT 8728` | MikroTik API port. |
| `mikrotik_username` / `mikrotik_password` | `VARCHAR(100)` / `VARCHAR(255)` | `NULL` allowed | MikroTik credentials. |
| `mikrotik_api_token` | `TEXT` | `NULL` allowed | MikroTik API token. |
| `mikrotik_hotspot_name` | `VARCHAR(100)` | `DEFAULT 'hotspot'` | Hotspot profile name. |
| `router_json` | `JSONB` | `NULL` allowed | Serialized router configuration. |
| `bank_name` / `bank_account_no` / `bank_account_name` | `VARCHAR(100)` / `VARCHAR(100)` / `VARCHAR(255)` | `NULL` allowed | Payout receipt account. |
| `payment_instructions` | `TEXT` | `NULL` allowed | Submitter transfer instructions. |
| `whatsapp_provider` | `VARCHAR(50)` | `DEFAULT 'Meta Cloud API'` | WhatsApp gateway provider. |
| `whatsapp_api_key` | `TEXT` | `NULL` allowed | WhatsApp API token. |
| `email_alerts_enabled` | `BOOLEAN` | `DEFAULT TRUE` | Email alert toggle. |
| `admin_alert_email` | `VARCHAR(255)` | `NULL` allowed | Admin notification email. |

#### Table: `internet_plans`
* **Purpose:** Contains configuration and billing definitions for hotspot access passes.
* **Schema Definition:**

| Column Name | Data Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(255)` | `PRIMARY KEY` | Plan ID. |
| `name` | `VARCHAR(255)` | `NOT NULL` | Core package name (e.g., `₦100 Super Saver`). |
| `price` | `INTEGER` | `NOT NULL` | Billing cost in kobo/cents. |
| `data_limit_gb` | `NUMERIC` | `NULL` allowed | Caps block thresholds. |
| `duration_hours` | `INTEGER` | `NULL` allowed | Validity countdown window. |
| `speed_limit_mbps` | `INTEGER` | `NULL` allowed | Profile internet maximum bandwidth. |
| `device_limit` | `INTEGER` | `DEFAULT 1` | Concurrent connections peak count. |
| `validity_period_days` | `INTEGER` | `DEFAULT 1` | Calendar days before expiry. |
| `auto_expiry` | `BOOLEAN` | `DEFAULT TRUE` | Disconnect trigger on completion. |
| `description` | `TEXT` | `NULL` allowed | Plan marketing copy. |
| `is_active` | `BOOLEAN` | `DEFAULT TRUE` | Visibility flag on customer portals. |
| `is_popular` | `BOOLEAN` | `DEFAULT FALSE` | Featured plan badge toggle. |

#### Table: `payment_requests`
* **Purpose:** Manual submission entries containing NGN bank transfers uploaded by subscribers.
* **Schema Definition:**

| Column Name | Data Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(255)` | `PRIMARY KEY` | Ticket transaction identifier. |
| `customer_name` | `VARCHAR(255)` | `NULL` allowed | Buyer metadata identifier. |
| `customer_phone` | `VARCHAR(100)` | `NULL` allowed | Buyer contact number. |
| `customer_email` | `VARCHAR(255)` | `NULL` allowed | Buyer email address. |
| `plan_id` | `VARCHAR(255)` | `NULL` allowed | Purchased rate reference. |
| `plan_name` | `VARCHAR(255)` | `NULL` allowed | Purchased plan display name. |
| `plan_price` | `INTEGER` | `NULL` allowed | Purchased plan cost. |
| `screenshot_url` | `TEXT` | `NULL` allowed | Uploaded proof image URL. |
| `reference` | `VARCHAR(255)` | `NULL` allowed | Bank transfer reference. |
| `status` | `VARCHAR(50)` | `DEFAULT 'Awaiting Approval'` | Approval state (`Pending`, `Approved`, `Rejected`). |
| `timestamp` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Date submitted. |
| `whatsapp_delivered` | `BOOLEAN` | `DEFAULT FALSE` | Notification dispatch flag. |

#### Table: `active_vouchers`
* **Purpose:** Hotspot ticket access passcodes validating direct captive connections.
* **Schema Definition:**

| Column Name | Data Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(255)` | `PRIMARY KEY` | Voucher UUID tracking code. |
| `code` | `VARCHAR(255)` | `UNIQUE` | Captive portal PIN code typed by subscribers. |
| `plan_id` | `VARCHAR(255)` | `NULL` allowed | Source plan reference. |
| `plan_name` | `VARCHAR(255)` | `NULL` allowed | Source plan display name. |
| `plan_price` | `INTEGER` | `NULL` allowed | Source plan cost. |
| `status` | `VARCHAR(50)` | `DEFAULT 'active'` | Used, Active, Expired, or Suspended flags. |
| `date_created` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Ticket issuance time. |
| `date_used` | `TIMESTAMP` | `NULL` allowed | Redemption timestamp. |
| `date_expired` | `TIMESTAMP` | `NULL` allowed | Expiration timestamp. |
| `duration_hours` | `INTEGER` | `NULL` allowed | Session validity window. |
| `data_limit_gb` | `NUMERIC` | `NULL` allowed | Data cap threshold. |
| `remaining_data_gb` | `NUMERIC` | `NULL` allowed | Remaining data balance. |
| `speed_limit_mbps` | `INTEGER` | `NULL` allowed | Throttle ceiling. |
| `customer_name` | `VARCHAR(255)` | `NULL` allowed | Target holder name. |
| `customer_phone` | `VARCHAR(100)` | `NULL` allowed | Target holder number. |
| `customer_email` | `VARCHAR(255)` | `NULL` allowed | Target holder email. |
| `payment_reference` | `VARCHAR(255)` | `NULL` allowed | Linked payment reference. |
| `is_multi_device` | `BOOLEAN` | `DEFAULT FALSE` | Multi-device eligibility flag. |
| `device_limit` | `INTEGER` | `DEFAULT 1` | Concurrent device ceiling. |
| `notes` | `TEXT` | `NULL` allowed | Administrative annotations. |

#### Table: `customers`
* **Purpose:** Stores the details of users who connect to your Starlink or local router hub, tracking their usage metrics, joined timestamps, and cumulative payment summaries.
* **Schema Definition:**

| Column Name | Data Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(255)` | `PRIMARY KEY` | Subscriber tracking key. |
| `name` | `VARCHAR(255)` | `NULL` allowed | Hotspot registered user name. |
| `phone` | `VARCHAR(100)` | `NULL` allowed | Active subscriber route. |
| `whatsapp` | `VARCHAR(100)` | `NULL` allowed | WhatsApp contact route. |
| `email` | `VARCHAR(255)` | `NULL` allowed | Subscriber email address. |
| `active_plan_id` | `VARCHAR(255)` | `NULL` allowed | Active internet service reference. |
| `active_plan_name` | `VARCHAR(255)` | `NULL` allowed | Active plan display name. |
| `expiry_time` | `TIMESTAMP` | `NULL` allowed | Calculated date bounds. |
| `total_spend` | `INTEGER` | `DEFAULT 0` | Cumulative Naira payments. |
| `history_vouchers_count` | `INTEGER` | `DEFAULT 0` | Total access cards printed. |
| `is_suspended` | `BOOLEAN` | `DEFAULT FALSE` | Operational ban toggle. |
| `is_blacklisted` | `BOOLEAN` | `DEFAULT FALSE` | Permanent block toggle. |
| `notes` | `TEXT` | `NULL` allowed | Administrative annotations. |
| `joined_date` | `DATE` | `DEFAULT CURRENT_DATE` | Account creation date. |

#### Table: `active_sessions`
* **Purpose:** Tracks simulated live connected devices leased through the gateway router's DHCP pool.
* **Schema Definition:**

| Column Name | Data Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(255)` | `PRIMARY KEY` | Active lease ID. |
| `customer_name` | `VARCHAR(255)` | `NULL` allowed | Reference subscriber name. |
| `ip_address` | `VARCHAR(100)` | `NULL` allowed | Network hardware IP. |
| `mac_address` | `VARCHAR(100)` | `NULL` allowed | Network hardware MAC. |
| `device_type` | `VARCHAR(255)` | `NULL` allowed | Device model/type. |
| `data_used_gb` | `NUMERIC` | `DEFAULT 0` | Throughput consumed. |
| `upload_speed_mbps` | `NUMERIC` | `DEFAULT 0` | Upload throughput. |
| `download_speed_mbps` | `NUMERIC` | `DEFAULT 0` | Download throughput. |
| `connected_duration` | `VARCHAR(50)` | `NULL` allowed | Human-readable lease age. |
| `voucher_code` | `VARCHAR(255)` | `NULL` allowed | Voucher PIN assigned for lease. |

#### Table: `whatsapp_message_logs`
* **Purpose:** Audits WhatsApp message dispatches containing PIN vouchers or receipt receipts.
* **Schema Definition:**

| Column Name | Data Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(255)` | `PRIMARY KEY` | Execution ID. |
| `recipient_name` | `VARCHAR(255)` | `NULL` allowed | Submitter metadata name. |
| `recipient_phone` | `VARCHAR(100)` | `NULL` allowed | Submitter metadata phone. |
| `message_type` | `VARCHAR(50)` | `NULL` allowed | `voucher`, `payment`, `alert`, etc. |
| `content` | `TEXT` | `NOT NULL` | Text message contents. |
| `status` | `VARCHAR(50)` | `DEFAULT 'Delivered'` | Delivery status. |
| `timestamp` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Operational dispatch date. |
| `plan_name` | `VARCHAR(255)` | `NULL` allowed | Associated plan name. |
| `voucher_code` | `VARCHAR(255)` | `NULL` allowed | Associated voucher PIN. |

#### Table: `system_config`
* **Purpose:** Key-value store for platform-wide operator settings.
* **Schema Definition:**

| Column Name | Data Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `key` | `VARCHAR(255)` | `PRIMARY KEY` | Configuration key (e.g., `saas_announcement`, `saas_tier`). |
| `value` | `TEXT` | `NOT NULL` | Configuration value. |

#### Table: `subscribers`
* **Purpose:** Generic subscriber accounts separate from reseller auth.
* **Schema Definition:**

| Column Name | Data Type | Modifiers / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Auto-increment subscriber ID. |
| `name` | `VARCHAR(255)` | `NULL` allowed | Subscriber full name. |
| `phone` | `VARCHAR(100)` | `NULL` allowed | Subscriber phone. |
| `email` | `VARCHAR(255)` | `UNIQUE` | Subscriber email. |
| `password` | `VARCHAR(255)` | `NULL` allowed | Bcrypt-hashed password. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp. |

---

## 4. Administrative Client-Side State Key Registry (LocalStorage Cache)

When running in offline/local fallback simulation modes, browser keys are automatically substituted for network server operations. Check these in your Developer Console under the `Application > Local Storage` tab:

| Key Name | Data Type | Component Location | Description |
| :--- | :--- | :--- | :--- |
| `fallback_registrations` | `JSON Array` | `ResellerAuthLogin` | Simulates the Postgres `reseller_registrations` table. All registrations made on static architectures (like Vercel) or when the API returns non-JSON errors are preserved in this browser storage string. |
| `reseller_user` | `JSON Object` | `App.tsx` | Stores the active session metadata of the logged-in administrator. Keeps the dashboard open when refreshing. |
| `is_reseller_authed` | `Boolean` | `App.tsx` | State indicating if administrative credentials correspond to an active session context. |
| `is_subscriber_authed` | `Boolean` | `App.tsx` | State indicating if a subscriber session is active. |
| `business_profile` | `JSON Object` | `App.tsx` | Offline local template caching for core brand and bank definitions. |
| `plans` | `JSON Array` | `App.tsx` | Offline local template caching for hotspot billing rate passes. |
| `vouchers` | `JSON Array` | `App.tsx` | Offline cache for active captive passcode vouchers. |
| `customers` | `JSON Array` | `App.tsx` | Offline tracking arrays for registered network subscribers. |
| `payment_requests` | `JSON Array` | `App.tsx` | Offline log index caching manual subscriber transfer uploads. |

---

## 5. Captive Portal & Splitter Operational Workflow Checklist

This highlights how the system works live for a subscriber trying to purchase bandwidth:

1. **Captive Portal Landing:** A customer connects to the Wi-Fi. The browser redirects to the landing page showing active pricing passes fetched from `internet_plans` (backed up locally to `starlink_plans`).
2. **Payment Selection:** The subscriber chooses a plan (e.g., `₦100 Super Saver`) and is presented with the reseller's bank account credentials (customized in `reseller_profiles`).
3. **Manual Bank Transfer:** The subscriber transfers the exact code payment, fills out their name/WhatsApp numbers, inputs a bank tx reference or screenshot, and clicks **Submit Payment**.
4. **Reseller Authorization:** A new entry appears in the administrator's **Payment Tickets** tab (stored under `payment_requests`).
5. **Voucher Generation & Delivery**:
   * When the administrator clicks **Approve**, the system generates an access PIN (saved in `active_vouchers`).
   * The platform activates a simulator to dispatch a receipt containing the PIN to the subscriber's WhatsApp (logging to `whatsapp_message_logs`).
   * The subscriber is registered under the customers collection (`customers`) and their telemetry is processed inside the live system.

---

## 6. Runtime Data Flow & Fallback Behavior

### Normal Operation (Node.js Server Running + Neon Connected)
```
Frontend (React)
    │
    ├── fetch('/api/...') ──► Express server.ts (port 3000)
    │                              │
    │                              ├── neonActive === true
    │                              │       │
    │                              │       └──► PostgreSQL (Neon)
    │                              │               ├── reseller_registrations
    │                              │               ├── reseller_profiles
    │                              │               ├── internet_plans
    │                              │               ├── payment_requests
    │                              │               ├── active_vouchers
    │                              │               ├── customers
    │                              │               ├── active_sessions
    │                              │               ├── whatsapp_message_logs
    │                              │               └── system_config
    │                              │
    │                              └── neonActive === false
    │                                      │
    │                                      └──► In-Memory Fallback
    │                                              ├── fallbackRegistrations[]
    │                                              ├── fallbackBusiness{}
    │                                              ├── fallbackPlans[]
    │                                              └── ...
    │
    └── Response JSON ──► Frontend updates state
                                │
                                └── saveLocalData() persists to localStorage
```

### Degraded Operation (API Unreachable / 404 / 503)
```
Frontend (React)
    │
    └── fetch('/api/...') ──► Network Error / Non-JSON Response
            │
            └── catch block in component
                    │
                    ├── Registration/Login ──► localStorage fallback_registrations
                    ├── Data mutations ──► Component state + localStorage
                    └── Console warning logged
```

---

## 7. Known Issues & Troubleshooting

### Issue: `/api/db-status` shows `offline` but `/api/db-health` shows `healthy: true`
**Root Cause:** The health endpoint creates a temporary `pg.Pool` and tests connectivity successfully. However, the main application pool (`pgPool`) initialization in `initializePostgres()` fails after 3 retry attempts, leaving `neonActive = false`. This can happen due to:
- Network transient errors during startup
- SSL/TLS handshake issues with Neon pooler
- Schema creation permission errors on the Neon database

**Workaround:** Restart the Node.js server. The initialization uses a fresh pool each time and will succeed on retry.

### Issue: Registration returns `503 Database not ready` on deployed app
**Root Cause:** The deployed server process started but `initializePostgres()` failed during cold start. The current auth endpoints do not gracefully fall back to in-memory storage; they return 503 immediately.

**Expected Behavior (Frontend):** The React frontend's `ResellerAuthLogin` component catches non-JSON or error responses and falls back to `localStorage` sandbox registration. However, when the API returns a structured JSON 503 response, the frontend currently displays the error instead of silently falling back.

### Issue: Vercel deployment shows empty data
**Root Cause:** The Vercel build serves the static SPA from `dist/`. Without a serverless function configuration for `server.ts`, `/api/*` routes return 404. The app falls back to LocalStorage, which is empty on first visit.

**Resolution:** Deploy to a Node.js-aware host (Render, Railway, Fly.io, Cloud Run) where `server.ts` runs as a long-lived process, OR configure Vercel serverless functions to execute the bundled `dist/server.cjs`.
