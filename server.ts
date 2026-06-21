import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const { Pool } = pg;
let pgPool: pg.Pool | null = null;
let neonActive = false;
let neonErrorMsg = '';

if (process.env.DATABASE_URL) {
  try {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    console.log('⚡ Neon PostgreSQL Pool defined successfully.');
  } catch (err: any) {
    neonErrorMsg = err.message;
    console.error('❌ Failed to initialize PG client:', err.message);
  }
}

async function initializePostgres() {
  if (!pgPool) {
    console.log('⚠️ DATABASE_URL not set or Postgres unavailable. Running with in-memory fallback only.');
    return;
  }

  const client = await pgPool.connect();
  try {
    console.log('⚡ Connected to Neon PostgreSQL Database! Creating schemas...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS reseller_registrations (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        business_name VARCHAR(255),
        business_address TEXT,
        email_address VARCHAR(255) UNIQUE,
        whatsapp_number VARCHAR(100),
        password VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reseller_profiles (
        id VARCHAR(255) PRIMARY KEY,
        business_name VARCHAR(255),
        logo_emoji VARCHAR(10),
        logo_bg_color VARCHAR(20),
        phone VARCHAR(100),
        whatsapp_number VARCHAR(100),
        location TEXT,
        currency VARCHAR(10) DEFAULT 'NGN',
        timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
        router_type VARCHAR(50) DEFAULT 'Starlink',
        router_json JSONB,
        coverage_area TEXT,
        bank_name VARCHAR(100),
        bank_account_no VARCHAR(100),
        bank_account_name VARCHAR(255),
        payment_instructions TEXT,
        whatsapp_provider VARCHAR(50) DEFAULT 'Meta Cloud API',
        whatsapp_api_key TEXT,
        email_alerts_enabled BOOLEAN DEFAULT TRUE,
        admin_alert_email VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS internet_plans (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        price INTEGER,
        data_limit_gb NUMERIC,
        duration_hours INTEGER,
        speed_limit_mbps INTEGER,
        device_limit INTEGER DEFAULT 1,
        validity_period_days INTEGER DEFAULT 1,
        auto_expiry BOOLEAN DEFAULT TRUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        is_popular BOOLEAN DEFAULT FALSE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_requests (
        id VARCHAR(255) PRIMARY KEY,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(100),
        customer_email VARCHAR(255),
        plan_id VARCHAR(255),
        plan_name VARCHAR(255),
        plan_price INTEGER,
        screenshot_url TEXT,
        reference VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Awaiting Approval',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        whatsapp_delivered BOOLEAN DEFAULT FALSE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS active_vouchers (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(255) UNIQUE,
        plan_id VARCHAR(255),
        plan_name VARCHAR(255),
        plan_price INTEGER,
        status VARCHAR(50) DEFAULT 'active',
        date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_used TIMESTAMP,
        date_expired TIMESTAMP,
        duration_hours INTEGER,
        data_limit_gb NUMERIC,
        remaining_data_gb NUMERIC,
        speed_limit_mbps INTEGER,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(100),
        customer_email VARCHAR(255),
        payment_reference VARCHAR(255),
        is_multi_device BOOLEAN DEFAULT FALSE,
        device_limit INTEGER DEFAULT 1,
        notes TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        phone VARCHAR(100),
        whatsapp VARCHAR(100),
        email VARCHAR(255),
        active_plan_id VARCHAR(255),
        active_plan_name VARCHAR(255),
        expiry_time TIMESTAMP,
        total_spend INTEGER DEFAULT 0,
        history_vouchers_count INTEGER DEFAULT 0,
        is_suspended BOOLEAN DEFAULT FALSE,
        is_blacklisted BOOLEAN DEFAULT FALSE,
        notes TEXT,
        joined_date DATE DEFAULT CURRENT_DATE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS active_sessions (
        id VARCHAR(255) PRIMARY KEY,
        customer_name VARCHAR(255),
        ip_address VARCHAR(100),
        mac_address VARCHAR(100),
        device_type VARCHAR(255),
        data_used_gb NUMERIC DEFAULT 0,
        upload_speed_mbps NUMERIC DEFAULT 0,
        download_speed_mbps NUMERIC DEFAULT 0,
        connected_duration VARCHAR(50),
        voucher_code VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
        id VARCHAR(255) PRIMARY KEY,
        recipient_name VARCHAR(255),
        recipient_phone VARCHAR(100),
        message_type VARCHAR(50),
        content TEXT,
        status VARCHAR(50) DEFAULT 'Delivered',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        plan_name VARCHAR(255),
        voucher_code VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      );
    `);

    neonActive = true;
    console.log('⚡ All schemas synchronized on Neon.');
  } catch (err: any) {
    neonActive = false;
    neonErrorMsg = err.message;
    console.error('❌ Neon PostgreSQL initialization failed:', err.message);
  } finally {
    client.release();
  }
}

initializePostgres();

const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || '';

// In-memory fallback state when DB is not connected
let fallbackBusiness = {
  id: 'biz_1',
  businessName: 'Starlink Elite Wi-Fi',
  logoEmoji: '⚡',
  logoBgColor: '#059669',
  phone: '+234 812 345 6789',
  whatsapp: '+234 812 345 6789',
  location: 'Yaba, Lagos, Nigeria',
  currency: 'NGN',
  timezone: 'Africa/Lagos',
  routerType: 'Starlink',
  mikrotikIntegrationPlaceholder: false,
  coverageArea: 'Yaba Student Hostels & Environs',
  bankName: 'Opay',
  bankAccountNo: '8123456789',
  bankAccountName: 'Yaba Wireless Links',
  paymentInstructions: 'Transfer exact amount to our Opay account. Specify transaction ref. Vouchers auto-generate post manual confirmation!',
  whatsappProvider: 'Meta Cloud API',
  whatsappApiKey: WHATSAPP_API_KEY,
  emailAlertsEnabled: true,
  adminAlertEmail: 'johnnybgsu@gmail.com'
};

// [fallbackPlans ... fallbackMessageLogs trimmed for brevity in this patch — keep existing seed arrays as-is]

// In-Memory Backup collections if Database connection is offline or failed
let fallbackBusiness = {
  id: 'biz_1',
  businessName: 'Starlink Elite Wi-Fi',
  logoEmoji: '⚡',
  logoBgColor: '#059669',
  phone: '+234 812 345 6789',
  whatsapp: '+234 812 345 6789',
  location: 'Yaba, Lagos, Nigeria',
  currency: 'NGN',
  timezone: 'Africa/Lagos',
  routerType: 'Starlink',
  mikrotikIntegrationPlaceholder: false,
  coverageArea: 'Yaba Student Hostels & Environs',
  bankName: 'Opay',
  bankAccountNo: '8123456789',
  bankAccountName: 'Yaba Wireless Links',
  paymentInstructions: 'Transfer exact amount to our Opay account. Specify transaction ref. Vouchers auto-generate post manual confirmation!',
  whatsappProvider: 'Meta Cloud API',
  whatsappApiKey: WHATSAPP_API_KEY,
  emailAlertsEnabled: true,
  adminAlertEmail: 'johnnybgsu@gmail.com'
};

let fallbackPlans = [
  {
    id: 'plan_1d_1gb',
    name: '₦100 Super Saver',
    price: 100,
    dataLimitGb: 1,
    durationHours: 24,
    speedLimitMbps: 5,
    deviceLimit: 1,
    validityPeriodDays: 1,
    autoExpiry: true,
    description: '1GB super-saver high-speed pass valid for 24 hours.',
    isActive: true,
    isPopular: true
  },
  {
    id: 'plan_1d_500mb',
    name: '₦200 Daily Lite',
    price: 200,
    dataLimitGb: 0.5,
    durationHours: 24,
    speedLimitMbps: 5,
    deviceLimit: 1,
    validityPeriodDays: 1,
    autoExpiry: true,
    description: '500MB booster for general chatting and quick searches.',
    isActive: true
  },
  {
    id: 'plan_1d_2_5gb',
    name: '₦450 Daily Standard',
    price: 450,
    dataLimitGb: 2.5,
    durationHours: 24,
    speedLimitMbps: 8,
    deviceLimit: 1,
    validityPeriodDays: 1,
    autoExpiry: true,
    description: '2.5GB premium speed pass for video calls and streamings.',
    isActive: true
  },
  {
    id: 'plan_1d_3_5gb',
    name: '₦700 Daily Max',
    price: 700,
    dataLimitGb: 3.5,
    durationHours: 24,
    speedLimitMbps: 10,
    deviceLimit: 1,
    validityPeriodDays: 1,
    autoExpiry: true,
    description: '3.5GB maximum high-speed daily pass valid for 24 hours.',
    isActive: true
  },
  {
    id: 'plan_7d_1gb',
    name: '₦400 Weekly Starter',
    price: 400,
    dataLimitGb: 1,
    durationHours: 168,
    speedLimitMbps: 5,
    deviceLimit: 1,
    validityPeriodDays: 7,
    autoExpiry: true,
    description: '1GB weekly light saver. Best for quick essential runs.',
    isActive: true
  },
  {
    id: 'plan_7d_3_5gb_a',
    name: '₦900 Weekly Light',
    price: 900,
    dataLimitGb: 3.5,
    durationHours: 168,
    speedLimitMbps: 7,
    deviceLimit: 1,
    validityPeriodDays: 7,
    autoExpiry: true,
    description: '3.5GB weekly entry-plan valid for 7 full days.',
    isActive: true
  },
  {
    id: 'plan_7d_3_5gb_b',
    name: '₦900 Weekly Promo',
    price: 900,
    dataLimitGb: 3.5,
    durationHours: 168,
    speedLimitMbps: 7,
    deviceLimit: 2,
    validityPeriodDays: 7,
    autoExpiry: true,
    description: '3.5GB weekly promo with 2 concurrent devices support.',
    isActive: true
  },
  {
    id: 'plan_7d_11gb',
    name: '₦2,500 Weekly Premium',
    price: 2500,
    dataLimitGb: 11,
    durationHours: 168,
    speedLimitMbps: 12,
    deviceLimit: 2,
    validityPeriodDays: 7,
    autoExpiry: true,
    description: '11GB premium high-speed weekly plan for active users.',
    isActive: true
  },
  {
    id: 'plan_7d_15gb',
    name: '₦3,200 Weekly Ultimate',
    price: 3200,
    dataLimitGb: 15,
    durationHours: 168,
    speedLimitMbps: 15,
    deviceLimit: 2,
    validityPeriodDays: 7,
    autoExpiry: true,
    description: '15GB supreme high-speed weekly plan with lower latency.',
    isActive: true
  },
  {
    id: 'plan_7d_20gb',
    name: '₦4,000 Weekly Extreme',
    price: 4000,
    dataLimitGb: 20,
    durationHours: 168,
    speedLimitMbps: 20,
    deviceLimit: 3,
    validityPeriodDays: 7,
    autoExpiry: true,
    description: '20GB high speed weekly extreme plan for shared devices.',
    isActive: true
  },
  {
    id: 'plan_14d_12_5gb',
    name: '₦3,500 Fortnightly Light',
    price: 3500,
    dataLimitGb: 12.5,
    durationHours: 336,
    speedLimitMbps: 10,
    deviceLimit: 2,
    validityPeriodDays: 14,
    autoExpiry: true,
    description: '12.5GB value fortnightly plan for students.',
    isActive: true
  },
  {
    id: 'plan_14d_18gb',
    name: '₦5,000 Fortnightly Plus',
    price: 5000,
    dataLimitGb: 18,
    durationHours: 336,
    speedLimitMbps: 12,
    deviceLimit: 2,
    validityPeriodDays: 14,
    autoExpiry: true,
    description: '18GB data cap valid for 14 full days.',
    isActive: true
  },
  {
    id: 'plan_14d_28gb',
    name: '₦6,500 Fortnightly Pro',
    price: 6500,
    dataLimitGb: 28,
    durationHours: 336,
    speedLimitMbps: 15,
    deviceLimit: 3,
    validityPeriodDays: 14,
    autoExpiry: true,
    description: '28GB professional fortnightly data cap for active students.',
    isActive: true
  },
  {
    id: 'plan_14d_40gb',
    name: '₦8,000 Fortnightly Elite',
    price: 8000,
    dataLimitGb: 40,
    durationHours: 336,
    speedLimitMbps: 18,
    deviceLimit: 3,
    validityPeriodDays: 14,
    autoExpiry: true,
    description: '40GB top-tier fortnightly high-speed package.',
    isActive: true
  },
  {
    id: 'plan_30d_30gb',
    name: '₦5,000 Monthly Basic',
    price: 5000,
    dataLimitGb: 30,
    durationHours: 720,
    speedLimitMbps: 10,
    deviceLimit: 2,
    validityPeriodDays: 30,
    autoExpiry: true,
    description: '30GB high-speed monthly data cap valid for 30 days.',
    isActive: true
  },
  {
    id: 'plan_30d_60gb',
    name: '₦7,500 Monthly Value',
    price: 7500,
    dataLimitGb: 60,
    durationHours: 720,
    speedLimitMbps: 15,
    deviceLimit: 3,
    validityPeriodDays: 30,
    autoExpiry: true,
    description: '60GB rapid monthly subscription with dual-device access.',
    isActive: true
  },
  {
    id: 'plan_30d_120gb',
    name: '₦15,000 Monthly Elite',
    price: 15000,
    dataLimitGb: 120,
    durationHours: 720,
    speedLimitMbps: 25,
    deviceLimit: 5,
    validityPeriodDays: 30,
    autoExpiry: true,
    description: '120GB supreme Starlink power-user data cap valid for 30 days.',
    isActive: true
  }
];

let fallbackVouchers: any[] = [
  {
    id: 'v_john_b',
    code: 'HN77-JB20-PASS',
    planId: 'plan_1d_1gb',
    planName: '₦100 Super Saver',
    planPrice: 100,
    status: 'active',
    dateCreated: new Date().toISOString(),
    durationHours: 24,
    dataLimitGb: 1,
    remainingDataGb: 1,
    speedLimitMbps: 5,
    customerName: 'John B',
    customerPhone: '+234 812 700 9000',
    customerEmail: 'johnamaka2@gmail.com',
    isMultiDevice: false,
    deviceLimit: 1
  },
  {
    id: 'v_1',
    code: 'STAR-7392-OP',
    planId: 'plan_1d_1gb',
    planName: '₦100 Super Saver',
    planPrice: 100,
    status: 'active',
    dateCreated: new Date().toISOString(),
    durationHours: 24,
    dataLimitGb: 1,
    remainingDataGb: 1,
    speedLimitMbps: 5,
    customerName: 'Chidi Anselm',
    customerPhone: '+234 803 111 2222',
    isMultiDevice: false,
    deviceLimit: 1
  }
];

let fallbackPayments: any[] = [
  {
    id: 'trsf_192803',
    customerName: 'Tunde Kehinde',
    customerPhone: '+234 812 999 8888',
    customerEmail: 'tunde@yabacollege.edu.ng',
    planId: 'plan_1d_1gb',
    planName: '₦100 Super Saver',
    planPrice: 100,
    reference: 'PAY_REF_91028301AB',
    status: 'Awaiting Approval',
    timestamp: new Date().toISOString(),
    whatsappDelivered: false
  }
];

let fallbackCustomers = [
  {
    id: 'cust_john_b',
    name: 'John B',
    phone: '+234 812 700 9000',
    whatsapp: '+234 812 700 9000',
    email: 'johnamaka2@gmail.com',
    activePlanId: 'plan_1d_1gb',
    activePlanName: '₦100 Super Saver',
    expiryTime: new Date(Date.now() + 24*3600*1000).toISOString(),
    totalSpend: 5000,
    historyVouchersCount: 2,
    isSuspended: false,
    isBlacklisted: false,
    notes: 'Premium customer testing the portal.',
    joinedDate: new Date().toISOString()
  },
  {
    id: 'cust_1',
    name: 'Chidi Anselm',
    phone: '+234 803 111 2222',
    whatsapp: '+234 803 111 2222',
    activePlanId: 'plan_1d_1gb',
    activePlanName: '₦100 Super Saver',
    expiryTime: new Date(Date.now() + 24*3600*1000).toISOString(),
    totalSpend: 1500,
    historyVouchersCount: 3,
    isSuspended: false,
    isBlacklisted: false,
    notes: 'Premium regular hostel subscriber in Block C room 4.',
    joinedDate: new Date().toISOString()
  }
];

let fallbackSessions = [
  {
    id: 'sess_1',
    customerName: 'Chidi Anselm',
    ipAddress: '192.168.88.54',
    macAddress: 'BC:A9:20:F1:C9:80',
    deviceType: 'Infinix Hot 30i',
    dataUsedGb: 0.35,
    uploadSpeedMbps: 1.2,
    downloadSpeedMbps: 6.8,
    connectedDuration: '02h 45m',
    voucherCode: 'STAR-7392-OP'
  }
];

let fallbackMessageLogs = [
  {
    id: 'log_1',
    recipientName: 'Chidi Anselm',
    recipientPhone: '+234 803 111 2222',
    messageType: 'voucher' as const,
    content: 'Your payment of ₦100 was confirmed! Your Starlink WiFi Passcode PIN is: STAR-7392-OP. Valid for 24 hours.',
    status: 'Delivered' as const,
    timestamp: new Date().toISOString(),
    planName: '₦100 Super Saver',
    voucherCode: 'STAR-7392-OP'
  }
];

let fallbackAnnouncement = '📢 ANNOUNCEMENT: Starlink latency optimization scheduled for all West-African nodes on June 15, expected to shave ping down by an average of 10ms!';
let fallbackSaaSTier = 'growth';

import fs from 'fs';

const SANDBOX_FILE_PATH = path.join(process.cwd(), 'db_sandbox.json');

function saveSandboxData() {
  try {
    const payload = {
      fallbackRegistrations,
      fallbackBusiness,
      fallbackPlans,
      fallbackVouchers,
      fallbackPayments,
      fallbackCustomers,
      fallbackSessions,
      fallbackMessageLogs,
      fallbackAnnouncement,
      fallbackSaaSTier
    };
    fs.writeFileSync(SANDBOX_FILE_PATH, JSON.stringify(payload, null, 2), 'utf8');
    console.log('💾 Server persistent database synchronized successfully: db_sandbox.json');
  } catch (err: any) {
    console.error('❌ Failed saving sandbox registry file:', err.message);
  }
}

function loadSandboxData() {
  try {
    if (fs.existsSync(SANDBOX_FILE_PATH)) {
      const content = fs.readFileSync(SANDBOX_FILE_PATH, 'utf8');
      const data = JSON.parse(content);
      if (data.fallbackRegistrations) fallbackRegistrations = data.fallbackRegistrations;
      if (data.fallbackBusiness) fallbackBusiness = data.fallbackBusiness;
      if (data.fallbackPlans) fallbackPlans = data.fallbackPlans;
      if (data.fallbackVouchers) fallbackVouchers = data.fallbackVouchers;
      if (data.fallbackPayments) fallbackPayments = data.fallbackPayments;
      if (data.fallbackCustomers) fallbackCustomers = data.fallbackCustomers;
      if (data.fallbackSessions) fallbackSessions = data.fallbackSessions;
      if (data.fallbackMessageLogs) fallbackMessageLogs = data.fallbackMessageLogs;
      if (data.fallbackAnnouncement) fallbackAnnouncement = data.fallbackAnnouncement;
      if (data.fallbackSaaSTier) fallbackSaaSTier = data.fallbackSaaSTier;
      console.log(`📂 Server restored state successfully from persistent db_sandbox.json! (${fallbackRegistrations.length} registrations loaded)`);
    } else {
      saveSandboxData();
    }
  } catch (err: any) {
    console.error('❌ Failed loading sandbox registry file:', err.message);
  }
}

// Perform historical state load
loadSandboxData();

// ----------------------------------------------------
// FULL REST API ROUTINGS WITH DRUM-TIGHT REST API ROUTINGS
// ----------------------------------------------------

// DB Status Badge query
app.get('/api/db-status', (req, res) => {
  res.json({
    status: neonActive ? 'connected' : 'offline',
    error: neonActive ? '' : neonErrorMsg,
    neonActive,
    neonError: neonErrorMsg,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
    provider: neonActive ? 'Neon Serverless PostgreSQL Database' : 'Local Sandbox Storage'
  });
});
});

// RESELLER REGISTRATION ENDPOINT (Neon Postgres connected)
app.post('/api/reseller/register', async (req, res) => {
  const { firstName, lastName, businessName, businessAddress, emailAddress, whatsappNumber, password } = req.body;
  
  if (!emailAddress || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = emailAddress.trim().toLowerCase();

  if (neonActive && pgPool) {
    try {
      const result = await pgPool.query(
        `INSERT INTO reseller_registrations (first_name, last_name, business_name, business_address, email_address, whatsapp_number, password)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [firstName, lastName, businessName, businessAddress, emailAddress, whatsappNumber, password]
      );
      console.log(`🎉 Reseller ${emailAddress} registered successfully in Neon Postgres database!`);
      return res.json({ success: true, user: result.rows[0] });
    } catch (err: any) {
      console.error('❌ Neon SQL registration query failed:', err.message);
      if (err.message.includes('unique constraint') || err.message.includes('already exists')) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }
      return res.status(500).json({ error: `Neon SQL database error: ${err.message}` });
    }
  } else {
        try {
      const regDocRef = doc(db, 'reseller_registrations', cleanEmail);
      const regDocSnap = await getDoc(regDocRef);
      if (regDocSnap.exists()) {
        return res.status(400).json({ error: 'An account with this email address already exists in the database.' });
      }
      
      const newReg = {
        id: Date.now(),
        first_name: firstName || '',
        last_name: lastName || '',
        business_name: businessName || '',
        business_address: businessAddress || '',
        email_address: cleanEmail,
        whatsapp_number: whatsappNumber || '',
        password: password,
        status: 'Active',
        created_at: new Date().toISOString()
      };
      
      await setDoc(regDocRef, newReg);
      
      // Also write an active profile to reseller_profiles collection so they instantly have editable settings in the dashboard
      const profileDocRef = doc(db, 'reseller_profiles', cleanEmail);
      await setDoc(profileDocRef, {
        id: cleanEmail,
        business_name: businessName || 'My Hotspot Network',
        logo_emoji: '📶',
        logo_bg_color: '#3b82f6',
        phone: whatsappNumber || '',
        whatsapp_number: whatsappNumber || '',
        location: businessAddress || '',
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        router_type: 'Starlink',
        coverage_area: businessAddress || '',
        bank_name: 'Access Bank',
        bank_account_no: '0000000000',
        bank_account_name: `${firstName || ''} ${lastName || ''}`.trim(),
        payment_instructions: 'Transfer to listed bank account, upload screenshot for automatic voucher code validation.'
      });

      console.log(`🎉 Reseller ${cleanEmail} registered successfully in database!`);
      return res.json({ success: true, user: newReg });
    } catch (err: any) {
      console.warn('⚠️ Sandbox fallback active:', err.message);
      
      const exists = fallbackRegistrations.some(u => u.email_address?.toLowerCase() === cleanEmail);
      if (exists) {
        return res.status(400).json({ error: 'An account with this email address already exists in our database.' });
      }

      const newReg = {
        id: Date.now(),
        first_name: firstName || '',
        last_name: lastName || '',
        business_name: businessName || '',
        business_address: businessAddress || '',
        email_address: cleanEmail,
        whatsapp_number: whatsappNumber || '',
        password: password,
        status: 'Active',
        created_at: new Date().toISOString()
      };

      fallbackRegistrations.push(newReg);

      if (fallbackBusiness.id === 'biz_1') {
        fallbackBusiness = {
          ...fallbackBusiness,
          id: cleanEmail,
          businessName: businessName || fallbackBusiness.businessName,
          phone: whatsappNumber || fallbackBusiness.phone,
          whatsapp: whatsappNumber || fallbackBusiness.whatsapp,
          location: businessAddress || fallbackBusiness.location,
          bankAccountName: `${firstName || ''} ${lastName || ''}`.trim() || fallbackBusiness.bankAccountName,
          adminAlertEmail: cleanEmail
        };
      }

      saveSandboxData();
      return res.json({ success: true, user: newReg });
    }
  }
});

// RESELLER LOGIN/AUTH ENDPOINT (Neon Postgres check)
app.post('/api/reseller/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (neonActive && pgPool) {
    try {
      const result = await pgPool.query(
        `SELECT * FROM reseller_registrations WHERE LOWER(email_address) = $1 AND password = $2`,
        [cleanEmail, password]
      );
      if (result.rows.length > 0) {
        console.log(`👤 Reseller authenticated successfully via Neon database: ${cleanEmail}`);
        return res.json({ success: true, user: result.rows[0] });
      } else {
        return res.status(401).json({ error: 'Invalid reseller credentials. Please check details or click Register Here.' });
      }
    } catch (err: any) {
      console.error('❌ Neon Login SQL query failed:', err.message);
      return res.status(500).json({ error: `Neon SQL database login error: ${err.message}` });
    }
  } else {
    // Check cached registration fallback
    try {
      const regDocRef = doc(db, 'reseller_registrations', cleanEmail);
      const regDocSnap = await getDoc(regDocRef);
      if (regDocSnap.exists()) {
        const found = regDocSnap.data();
        if (found.password === password) {
          console.log(`👤 Reseller authenticated successfully via local cache: ${cleanEmail}`);
          return res.json({ success: true, user: found });
        }
      }
    } catch (err: any) {
      console.error('❌ Local login fallback failed:', err.message);
    }
    
    // In-memory fallback check
    const found = fallbackRegistrations.find(
      r => r.email_address?.toLowerCase() === cleanEmail && r.password === password
    );
    if (found) {
      console.log(`👤 Reseller authenticated successfully via Sandbox local offline cache: ${cleanEmail}`);
      return res.json({ success: true, user: found });
    }
  }

  return res.status(401).json({ error: 'Unauthorized Reseller. Check credentials or register first.' });
});

// LIST REGISTERED RESELLERS SECURE MONITORING
app.get('/api/resellers', async (req, res) => {
  if (neonActive && pgPool) {
    try {
      const result = await pgPool.query(`SELECT id, first_name AS "first_name", last_name AS "last_name", business_name AS "business_name", business_address AS "business_address", email_address AS "email_address", whatsapp_number AS "whatsapp_number", status, created_at AS "created_at" FROM reseller_registrations ORDER BY id DESC`);
      return res.json(result.rows);
    } catch (err: any) {
      return res.status(500).json({ error: `Neon Postgres error: ${err.message}` });
    }
  } else {
  // Neon-first logic is active above
    try {
      const colRef = collection(db, 'reseller_registrations');
      const snapshot = await getDocs(colRef);
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data());
      });
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }
  } else {
    return res.json(fallbackRegistrations);
  }
});

// RESELLER BUSINESS PROFILE
app.get('/api/business', async (req, res) => {
  const resellerEmail = (req.query.email as string || '').trim().toLowerCase();
  {
  // Neon-first logic is active above
    try {
      if (resellerEmail) {
        const docRef = doc(db, 'reseller_profiles', resellerEmail);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const row = docSnap.data();
          return res.json({
            id: row.id || docSnap.id,
            businessName: row.business_name || row.businessName,
            logoEmoji: row.logo_emoji || row.logoEmoji || '📶',
            logoBgColor: row.logo_bg_color || row.logoBgColor || '#3b82f6',
            phone: row.phone,
            whatsapp: row.whatsapp_number || row.whatsapp,
            location: row.location || '',
            currency: row.currency || 'NGN',
            timezone: row.timezone || 'Africa/Lagos',
            routerType: row.router_type || row.routerType || 'Starlink',
            coverageArea: row.coverage_area || row.coverageArea || '',
            bankName: row.bank_name || row.bankName || '',
            bankAccountNo: row.bank_account_no || row.bankAccountNo || '',
            bankAccountName: row.bank_account_name || row.bankAccountName || '',
            paymentInstructions: row.payment_instructions || row.paymentInstructions || '',
            whatsappProvider: row.whatsapp_provider || row.whatsappProvider || 'Meta Cloud API',
            whatsappApiKey: row.whatsapp_api_key || row.whatsappApiKey || '',
            emailAlertsEnabled: row.email_alerts_enabled !== undefined ? row.email_alerts_enabled : true,
            adminAlertEmail: row.admin_alert_email || row.adminAlertEmail || resellerEmail
          });
        }
      }

      const colRef = collection(db, 'reseller_profiles');
      const snapshot = await getDocs(colRef);
      if (snapshot.size > 0) {
        const docSnap = resellerEmail 
          ? (snapshot.docs.find(d => d.id === resellerEmail) || snapshot.docs[0])
          : snapshot.docs[0];
        const row = docSnap.data();
        return res.json({
          id: row.id || docSnap.id,
          businessName: row.business_name || row.businessName,
          logoEmoji: row.logo_emoji || row.logoEmoji || '⚡',
          logoBgColor: row.logo_bg_color || row.logoBgColor || '#059669',
          phone: row.phone,
          whatsapp: row.whatsapp_number || row.whatsapp,
          location: row.location || '',
          currency: row.currency || 'NGN',
          timezone: row.timezone || 'Africa/Lagos',
          routerType: row.router_type || row.routerType || 'Starlink',
          coverageArea: row.coverage_area || row.coverageArea || '',
          bankName: row.bank_name || row.bankName || '',
          bankAccountNo: row.bank_account_no || row.bankAccountNo || '',
          bankAccountName: row.bank_account_name || row.bankAccountName || '',
          paymentInstructions: row.payment_instructions || row.paymentInstructions || '',
          whatsappProvider: row.whatsapp_provider || row.whatsappProvider || 'Meta Cloud API',
          whatsappApiKey: row.whatsapp_api_key || row.whatsappApiKey || '',
          emailAlertsEnabled: row.email_alerts_enabled !== undefined ? row.email_alerts_enabled : true,
          adminAlertEmail: row.admin_alert_email || row.adminAlertEmail || resellerEmail || 'johnnybgsu@gmail.com'
        });
      }
    } catch (err) {
      }
  }
  res.json(fallbackBusiness);
});

app.post('/api/business', async (req, res) => {
  const b = req.body;
  const id = b.id || 'biz_1';
  {
  // Neon-first logic is active above
    try {
      await setDoc(doc(db, 'reseller_profiles', id), {
        id: id,
        business_name: b.businessName,
        logo_emoji: b.logoEmoji || '⚡',
        logo_bg_color: b.logoBgColor || '#059669',
        phone: b.phone,
        whatsapp_number: b.whatsapp,
        location: b.location || '',
        currency: b.currency || 'NGN',
        timezone: b.timezone || 'Africa/Lagos',
        router_type: b.routerType || 'Starlink',
        coverage_area: b.coverageArea || '',
        bank_name: b.bankName || '',
        bank_account_no: b.bankAccountNo || '',
        bank_account_name: b.bankAccountName || '',
        payment_instructions: b.paymentInstructions || '',
        whatsapp_provider: b.whatsappProvider || 'Meta Cloud API',
        whatsapp_api_key: b.whatsappApiKey || '',
        email_alerts_enabled: b.emailAlertsEnabled !== undefined ? b.emailAlertsEnabled : false,
        admin_alert_email: b.adminAlertEmail || ''
      });
      fallbackBusiness = { ...fallbackBusiness, ...b };
      return res.json({ success: true, updated: b });
    } catch (err) {
      }
  }
  fallbackBusiness = { ...fallbackBusiness, ...b };
  res.json({ success: true, updated: fallbackBusiness });
});

// INTERNET PLANS ROUTINGS
app.get('/api/plans', async (req, res) => {
  {
  // Neon-first logic is active above
    try {
      const snapshot = await getDocs(collection(db, 'internet_plans'));
      const plans = snapshot.docs.map(docSnap => {
        const row = docSnap.data();
        return {
          id: row.id || docSnap.id,
          name: row.name,
          price: Number(row.price),
          dataLimitGb: Number(row.data_limit_gb ?? row.dataLimitGb ?? 0),
          durationHours: Number(row.duration_hours ?? row.durationHours ?? 24),
          speedLimitMbps: Number(row.speed_limit_mbps ?? row.speedLimitMbps ?? 5),
          deviceLimit: Number(row.device_limit ?? row.deviceLimit ?? 1),
          validityPeriodDays: Number(row.validity_period_days ?? row.validityPeriodDays ?? 1),
          autoExpiry: row.auto_expiry ?? row.autoExpiry ?? true,
          description: row.description ?? '',
          isActive: row.is_active ?? row.isActive ?? true,
          isPopular: row.is_popular ?? row.isPopular ?? false
        };
      });
      plans.sort((a, b) => a.price - b.price);
      return res.json(plans);
    } catch (err) {
      }
  }
  res.json(fallbackPlans);
});

app.post('/api/plans', async (req, res) => {
  const p = req.body;
  {
  // Neon-first logic is active above
    try {
      await setDoc(doc(db, 'internet_plans', p.id), {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        data_limit_gb: Number(p.dataLimitGb ?? 0),
        duration_hours: Number(p.durationHours ?? 24),
        speed_limit_mbps: Number(p.speedLimitMbps ?? 5),
        device_limit: Number(p.deviceLimit ?? 1),
        validity_period_days: Number(p.validityPeriodDays ?? 1),
        auto_expiry: p.autoExpiry ?? true,
        description: p.description ?? '',
        is_active: p.isActive ?? true,
        is_popular: p.isPopular ?? false
      });
      const idx = fallbackPlans.findIndex(x => x.id === p.id);
      if (idx > -1) {
        fallbackPlans[idx] = p;
      } else {
        fallbackPlans.unshift(p);
      }
      saveSandboxData();
      return res.json({ success: true, plan: p });
    } catch (err) {
      }
  }
  const idx = fallbackPlans.findIndex(x => x.id === p.id);
  if (idx > -1) {
    fallbackPlans[idx] = p;
  } else {
    fallbackPlans.unshift(p);
  }
  saveSandboxData();
  res.json({ success: true, plan: p });
});

app.delete('/api/plans/:id', async (req, res) => {
  const id = req.params.id;
  {
  // Neon-first logic is active above
    try {
      await deleteDoc(doc(db, 'internet_plans', id));
      fallbackPlans = fallbackPlans.filter((p) => p.id !== id);
      saveSandboxData();
      return res.json({ success: true });
    } catch (err) {
      }
  }
  fallbackPlans = fallbackPlans.filter((p) => p.id !== id);
  saveSandboxData();
  res.json({ success: true });
});

// PAYMENTS VERIFICATION REQUESTS ROUTINGS
app.get('/api/payments', async (req, res) => {
  {
  // Neon-first logic is active above
    try {
      const snapshot = await getDocs(collection(db, 'payment_requests'));
      const payments = snapshot.docs.map(docSnap => {
        const row = docSnap.data();
        return {
          id: row.id || docSnap.id,
          customerName: row.customer_name || row.customerName,
          customerPhone: row.customer_phone || row.customerPhone,
          customerEmail: row.customer_email || row.customerEmail || undefined,
          planId: row.plan_id || row.planId,
          planName: row.plan_name || row.planName,
          planPrice: Number(row.plan_price ?? row.planPrice),
          screenshotUrl: row.screenshot_url || row.screenshotUrl || undefined,
          reference: row.reference,
          status: row.status,
          timestamp: row.timestamp,
          whatsappDelivered: row.whatsapp_delivered ?? row.whatsappDelivered ?? false
        };
      });
      payments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return res.json(payments);
    } catch (err) {
      }
  }
  res.json(fallbackPayments);
});

app.post('/api/payments', async (req, res) => {
  const p = req.body;
  {
  // Neon-first logic is active above
    try {
      await setDoc(doc(db, 'payment_requests', p.id), {
        id: p.id,
        customer_name: p.customerName,
        customer_phone: p.customerPhone,
        customer_email: p.customerEmail || null,
        plan_id: p.planId,
        plan_name: p.planName,
        plan_price: Number(p.planPrice),
        screenshot_url: p.screenshotUrl || null,
        reference: p.reference,
        status: p.status || 'Awaiting Approval',
        timestamp: p.timestamp || new Date().toISOString(),
        whatsapp_delivered: p.whatsappDelivered || false
      });
      fallbackPayments.unshift(p);
      saveSandboxData();
      return res.json({ success: true, payment: p });
    } catch (err) {
      }
  }
  fallbackPayments.unshift(p);
  saveSandboxData();
  res.json({ success: true, payment: p });
});

// APPROVAL CORE FLOW: GENERATES ACTIVE VOUCHERS AND CUSTOMERS IN APPROVAL FLOW
app.post('/api/payments/approve', async (req, res) => {
  const { id, spawnedVoucherCode, spawnedVoucherId } = req.body;
  
  {
  // Neon-first logic is active above
    try {
      const reqSnap = await getDoc(doc(db, 'payment_requests', id));
      if (!reqSnap.exists()) {
        throw new Error('Payment request token not found in database');
      }
      const payReq = reqSnap.data();
      
      // Update Payment Request to 'Approved'
      await updateDoc(doc(db, 'payment_requests', id), { status: 'Approved' });
      
      // Fetch target plan to read constraints
      const planSnap = await getDoc(doc(db, 'internet_plans', payReq.plan_id || payReq.planId));
      let speed = 8;
      let limitGb = 2.0;
      let hours = 24;
      
      if (planSnap.exists()) {
        const p = planSnap.data();
        speed = p.speed_limit_mbps ?? 8;
        limitGb = Number(p.data_limit_gb ?? 2.0);
        hours = p.duration_hours ?? 24;
      }

      // Spawn active voucher pass
      await setDoc(doc(db, 'active_vouchers', spawnedVoucherId), {
        id: spawnedVoucherId,
        code: spawnedVoucherCode,
        plan_id: payReq.plan_id || payReq.planId,
        plan_name: payReq.plan_name || payReq.planName,
        plan_price: Number(payReq.plan_price ?? payReq.planPrice),
        status: 'active',
        date_created: new Date().toISOString(),
        duration_hours: hours,
        data_limit_gb: limitGb,
        remaining_data_gb: limitGb,
        speed_limit_mbps: speed,
        customer_name: payReq.customer_name || payReq.customerName,
        customer_phone: payReq.customer_phone || payReq.customerPhone,
        customer_email: payReq.customer_email || payReq.customerEmail || '',
        is_multi_device: false,
        device_limit: 1,
        notes: 'Auto added upon bank transfer review'
      });

      // Upsert Customer tracking
      const custSnap = await getDocs(collection(db, 'customers'));
      let matchedCustomerRef = custSnap.docs.find(d => {
        const row = d.data();
        return row.phone === (payReq.customer_phone || payReq.customerPhone);
      });

      let custId = matchedCustomerRef ? matchedCustomerRef.id : 'cust_' + Math.floor(Math.random()*10000);
      let existingSpend = 0;
      let existingCount = 1;
      let joinedDate = new Date().toISOString();

      if (matchedCustomerRef) {
        const cd = matchedCustomerRef.data();
        existingSpend = Number(cd.total_spend ?? cd.totalSpend ?? 0);
        existingCount = Number(cd.history_vouchers_count ?? cd.historyVouchersCount ?? 0) + 1;
        joinedDate = cd.joined_date ?? cd.joinedDate ?? joinedDate;
      }

      const finalSpend = existingSpend + Number(payReq.plan_price ?? payReq.planPrice);

      await setDoc(doc(db, 'customers', custId), {
        id: custId,
        name: payReq.customer_name || payReq.customerName,
        phone: payReq.customer_phone || payReq.customerPhone,
        whatsapp: payReq.customer_phone || payReq.customerPhone,
        active_plan_id: payReq.plan_id || payReq.planId,
        active_plan_name: payReq.plan_name || payReq.planName,
        expiry_time: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
        total_spend: finalSpend,
        history_vouchers_count: existingCount,
        is_suspended: false,
        is_blacklisted: false,
        notes: 'Auto added upon bank transfer review',
        joined_date: joinedDate
      });

      saveSandboxData();
      return res.json({ success: true });
    } catch (err) {
      }
  }

  // Backup Manual In-Memory/Fallback workflow
  const idx = fallbackPayments.findIndex((x) => x.id === id);
  if (idx > -1) {
    fallbackPayments[idx].status = 'Approved';
    const pay = fallbackPayments[idx];
    
    const newV = {
      id: spawnedVoucherId,
      code: spawnedVoucherCode,
      planId: pay.planId,
      planName: pay.planName,
      planPrice: pay.planPrice,
      status: 'active' as const,
      dateCreated: new Date().toISOString(),
      durationHours: 24,
      dataLimitGb: 2.0,
      remainingDataGb: 2.0,
      speedLimitMbps: 8,
      customerName: pay.customerName,
      customerPhone: pay.customerPhone,
      isMultiDevice: false,
      deviceLimit: 1
    };
    fallbackVouchers.unshift(newV);

    const cIdx = fallbackCustomers.findIndex(c => c.phone === pay.customerPhone);
    if (cIdx > -1) {
      fallbackCustomers[cIdx].totalSpend += pay.planPrice;
      fallbackCustomers[cIdx].historyVouchersCount += 1;
      fallbackCustomers[cIdx].activePlanId = pay.planId;
      fallbackCustomers[cIdx].activePlanName = pay.planName;
    } else {
      fallbackCustomers.unshift({
        id: 'cust_' + Math.floor(Math.random()*100000),
        name: pay.customerName,
        phone: pay.customerPhone,
        whatsapp: pay.customerPhone,
        activePlanId: pay.planId,
        activePlanName: pay.planName,
        expiryTime: new Date(Date.now() + 24*3600*1000).toISOString(),
        totalSpend: pay.planPrice,
        historyVouchersCount: 1,
        isSuspended: false,
        isBlacklisted: false,
        notes: 'Hostel occupant registered immediately post manual verification.',
        joinedDate: new Date().toISOString()
      });
    }
  }
  res.json({ success: true });
});

app.post('/api/payments/reject', async (req, res) => {
  const { id } = req.body;
  {
  // Neon-first logic is active above
    try {
      await updateDoc(doc(db, 'payment_requests', id), { status: 'Rejected' });
      saveSandboxData();
      return res.json({ success: true });
    } catch (err) {
      }
  }
  const idx = fallbackPayments.findIndex((x) => x.id === id);
  if (idx > -1) {
    fallbackPayments[idx].status = 'Rejected';
  }
  saveSandboxData();
  res.json({ success: true });
});

// ACTIVE VOUCHERS GENERAL
app.get('/api/vouchers', async (req, res) => {
  {
  // Neon-first logic is active above
    try {
      const snapshot = await getDocs(collection(db, 'active_vouchers'));
      const vouchers = snapshot.docs.map(docSnap => {
        const row = docSnap.data();
        return {
          id: row.id || docSnap.id,
          code: row.code,
          planId: row.plan_id || row.planId,
          planName: row.plan_name || row.planName,
          planPrice: Number(row.plan_price ?? row.planPrice),
          status: row.status,
          dateCreated: row.date_created || row.dateCreated,
          durationHours: Number(row.duration_hours ?? row.durationHours),
          dataLimitGb: Number(row.data_limit_gb ?? row.dataLimitGb ?? 0),
          remainingDataGb: Number(row.remaining_data_gb ?? row.remainingDataGb ?? 0),
          speedLimitMbps: Number(row.speed_limit_mbps ?? row.speedLimitMbps),
          customerName: row.customer_name || row.customerName || undefined,
          customerPhone: row.customer_phone || row.customerPhone || undefined,
          customerEmail: row.customer_email || row.customerEmail || undefined,
          isMultiDevice: row.is_multi_device ?? row.isMultiDevice ?? false,
          deviceLimit: row.device_limit ?? row.deviceLimit ?? 1,
          notes: row.notes || undefined
        };
      });
      vouchers.sort((a,b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
      return res.json(vouchers);
    } catch (err) {
      }
  }
  res.json(fallbackVouchers);
});

app.post('/api/vouchers', async (req, res) => {
  const v = req.body;
  {
  // Neon-first logic is active above
    try {
      await setDoc(doc(db, 'active_vouchers', v.id), {
        id: v.id,
        code: v.code,
        plan_id: v.planId,
        plan_name: v.planName,
        plan_price: Number(v.planPrice),
        status: v.status,
        date_created: v.dateCreated || new Date().toISOString(),
        duration_hours: Number(v.durationHours),
        data_limit_gb: Number(v.dataLimitGb ?? 0),
        remaining_data_gb: Number(v.remainingDataGb ?? 0),
        speed_limit_mbps: Number(v.speedLimitMbps),
        customer_name: v.customerName || null,
        customer_phone: v.customerPhone || null,
        customer_email: v.customerEmail || null,
        is_multi_device: v.isMultiDevice || false,
        device_limit: v.deviceLimit || 1,
        notes: v.notes || null
      });
      const idx = fallbackVouchers.findIndex(x => x.id === v.id);
      if (idx > -1) {
        fallbackVouchers[idx] = v;
      } else {
        fallbackVouchers.unshift(v);
      }
      return res.json({ success: true, voucher: v });
    } catch (err) {
      }
  }
  const idx = fallbackVouchers.findIndex(x => x.id === v.id);
  if (idx > -1) {
    fallbackVouchers[idx] = v;
  } else {
    fallbackVouchers.unshift(v);
  }
  saveSandboxData();
  res.json({ success: true, voucher: v });
});

// CUSTOMERS MANAGEMENT ROUTINGS
app.get('/api/customers', async (req, res) => {
  {
  // Neon-first logic is active above
    try {
      const snapshot = await getDocs(collection(db, 'customers'));
      const customers = snapshot.docs.map(docSnap => {
        const row = docSnap.data();
        return {
          id: row.id || docSnap.id,
          name: row.name,
          phone: row.phone,
          whatsapp: row.whatsapp || '',
          activePlanId: row.active_plan_id || row.activePlanId || undefined,
          activePlanName: row.active_plan_name || row.activePlanName || undefined,
          expiryTime: row.expiry_time || row.expiryTime || undefined,
          totalSpend: Number(row.total_spend ?? row.totalSpend ?? 0),
          historyVouchersCount: Number(row.history_vouchers_count ?? row.historyVouchersCount ?? 0),
          isSuspended: row.is_suspended ?? row.isSuspended ?? false,
          isBlacklisted: row.is_blacklisted ?? row.isBlacklisted ?? false,
          notes: row.notes ?? '',
          joinedDate: row.joined_date || row.joinedDate
        };
      });
      customers.sort((a,b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime());
      return res.json(customers);
    } catch (err) {
      }
  }
  res.json(fallbackCustomers);
});

app.post('/api/customers', async (req, res) => {
  const c = req.body;
  {
  // Neon-first logic is active above
    try {
      await setDoc(doc(db, 'customers', c.id), {
        id: c.id,
        name: c.name,
        phone: c.phone,
        whatsapp: c.whatsapp || '',
        active_plan_id: c.activePlanId || '',
        active_plan_name: c.activePlanName || '',
        expiry_time: c.expiryTime || '',
        total_spend: Number(c.totalSpend ?? 0),
        history_vouchers_count: Number(c.historyVouchersCount ?? 0),
        is_suspended: !!c.isSuspended,
        is_blacklisted: !!c.isBlacklisted,
        notes: c.notes || '',
        joined_date: c.joinedDate || new Date().toISOString()
      });
      const idx = fallbackCustomers.findIndex(x => x.id === c.id);
      if (idx > -1) {
        fallbackCustomers[idx] = c;
      } else {
        fallbackCustomers.unshift(c);
      }
      saveSandboxData();
      return res.json({ success: true, customer: c });
    } catch (err) {
      }
  }
  const idx = fallbackCustomers.findIndex(x => x.id === c.id);
  if (idx > -1) {
    fallbackCustomers[idx] = c;
  } else {
    fallbackCustomers.unshift(c);
  }
  saveSandboxData();
  res.json({ success: true, customer: c });
});

// ACTIVE SESSIONS ROUTINGS
app.get('/api/sessions', async (req, res) => {
  {
  // Neon-first logic is active above
    try {
      const snapshot = await getDocs(collection(db, 'active_sessions'));
      const sessions = snapshot.docs.map(docSnap => {
        const row = docSnap.data();
        return {
          id: row.id || docSnap.id,
          customerName: row.customer_name || row.customerName,
          ipAddress: row.ip_address || row.ipAddress,
          macAddress: row.mac_address || row.macAddress,
          deviceType: row.device_type || row.deviceType,
          dataUsedGb: Number(row.data_used_gb ?? row.dataUsedGb ?? 0),
          uploadSpeedMbps: Number(row.upload_speed_mbps ?? row.uploadSpeedMbps ?? 0),
          downloadSpeedMbps: Number(row.download_speed_mbps ?? row.downloadSpeedMbps ?? 0),
          connectedDuration: row.connected_duration || row.connectedDuration,
          voucherCode: row.voucher_code || row.voucherCode
        };
      });
      return res.json(sessions);
    } catch (err) {
      }
  }
  res.json(fallbackSessions);
});

app.post('/api/sessions/disconnect', async (req, res) => {
  const { id } = req.body;
  {
  // Neon-first logic is active above
    try {
      await deleteDoc(doc(db, 'active_sessions', id));
      fallbackSessions = fallbackSessions.filter((s) => s.id !== id);
      return res.json({ success: true });
    } catch (err) {
      }
  }
  fallbackSessions = fallbackSessions.filter((s) => s.id !== id);
  res.json({ success: true });
});

// WHATSAPP OUTGOING MESSAGE LOGS
app.get('/api/message-logs', async (req, res) => {
  {
  // Neon-first logic is active above
    try {
      const snapshot = await getDocs(collection(db, 'whatsapp_message_logs'));
      const logs = snapshot.docs.map(docSnap => {
        const row = docSnap.data();
        return {
          id: row.id || docSnap.id,
          recipientName: row.recipient_name || row.recipientName,
          recipientPhone: row.recipient_phone || row.recipientPhone,
          messageType: row.message_type || row.messageType,
          content: row.content,
          status: row.status,
          timestamp: row.timestamp,
          planName: row.plan_name || row.planName || undefined,
          voucherCode: row.voucher_code || row.voucherCode || undefined
        };
      });
      logs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return res.json(logs);
    } catch (err) {
      }
  }
  res.json(fallbackMessageLogs);
});

app.post('/api/message-logs', async (req, res) => {
  const m = req.body;
  {
  // Neon-first logic is active above
    try {
      await setDoc(doc(db, 'whatsapp_message_logs', m.id), {
        id: m.id,
        recipient_name: m.recipientName,
        recipient_phone: m.recipientPhone,
        message_type: m.messageType,
        content: m.content,
        status: m.status || 'Delivered',
        timestamp: m.timestamp || new Date().toISOString(),
        plan_name: m.planName || null,
        voucher_code: m.voucherCode || null
      });
      fallbackMessageLogs.unshift(m);
      return res.json({ success: true, log: m });
    } catch (err) {
      }
  }
  fallbackMessageLogs.unshift(m);
  res.json({ success: true, log: m });
});

// OPERATOR CONFIGS (ANNOUNCEMENTS AND SAAS LEVEL TIERS)
app.get('/api/operator', async (req, res) => {
  let announcement = fallbackAnnouncement;
  let saasTier = fallbackSaaSTier;

  {
  // Neon-first logic is active above
    try {
      const snapshot = await getDocs(collection(db, 'system_config'));
      snapshot.forEach(docSnap => {
        const row = docSnap.data();
        if (row.key === 'saas_announcement') announcement = row.value;
        if (row.key === 'saas_tier') saasTier = row.value;
      });
    } catch (err) {
      }
  }
  res.json({ announcement, saasTier });
});

app.post('/api/operator/announcement', async (req, res) => {
  const { announcement } = req.body;
  {
  // Neon-first logic is active above
    try {
      await setDoc(doc(db, 'system_config', 'saas_announcement'), {
        key: 'saas_announcement',
        value: announcement
      });
      fallbackAnnouncement = announcement;
      return res.json({ success: true });
    } catch (err) {
      }
  }
  fallbackAnnouncement = announcement;
  res.json({ success: true });
});

app.post('/api/operator/saas-tier', async (req, res) => {
  const { saasTier } = req.body;
  {
  // Neon-first logic is active above
    try {
      await setDoc(doc(db, 'system_config', 'saas_tier'), {
        key: 'saas_tier',
        value: saasTier
      });
      fallbackSaaSTier = saasTier;
      return res.json({ success: true });
    } catch (err) {
      }
  }
  fallbackSaaSTier = saasTier;
  res.json({ success: true });
});

// Vite middleware & Static SPA configuration assets
async function serveApp() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Full-stack node running on port ${PORT}`);
  });
}

serveApp();
