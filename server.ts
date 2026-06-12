import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const DB_URL = process.env.DATABASE_URL;

// PostgreSQL Connection Pool Configuration
let pool: pg.Pool | null = null;
let dbStatus = 'disconnected';
let dbErrorMsg = '';

if (DB_URL) {
  try {
    pool = new pg.Pool({
      connectionString: DB_URL,
      // Neon & modern PostgreSQL hosts usually require secure SSL
      ssl: DB_URL.includes('sslmode=require') || DB_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    // Quick probe to test database connection
    pool.query('SELECT NOW()')
      .then(() => {
        dbStatus = 'connected';
        console.log('⚡ Connected securely to Neon PostgreSQL database.');
        initializeDatabaseTables();
      })
      .catch((err) => {
        dbStatus = 'error_fallback_mode';
        dbErrorMsg = err.message;
        console.error('❌ Failed probing Neon Postgres. Falling back to internal memory-state caches:', err.message);
      });
  } catch (err: any) {
    dbStatus = 'error_fallback_mode';
    dbErrorMsg = err.message;
    console.error('❌ Database pool configuration error:', err.message);
  }
} else {
  dbStatus = 'no_env_configured';
  console.log('💡 DATABASE_URL not set yet. Operating in local-memory simulation backup mode.');
}

// In-Memory Backup collections if Database pool is offline or failed
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
  whatsappApiKey: 'w_key_live_da984572h189ad98cf650b91e'
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
  }
];

let fallbackVouchers: any[] = [
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

// SQL Database Initialization Table Creator DDL
async function initializeDatabaseTables() {
  if (!pool) return;
  try {
    const client = await pool.connect();
    try {
      console.log('⚙️ Check/Build necessary relational database schemas...');
      
      // Reseller profiles table setup
      await client.query(`
        CREATE TABLE IF NOT EXISTS reseller_profiles (
          id VARCHAR(64) PRIMARY KEY,
          business_name VARCHAR(100) NOT NULL,
          logo_emoji VARCHAR(10) DEFAULT '⚡',
          logo_bg_color VARCHAR(20) DEFAULT '#059669',
          phone VARCHAR(50) NOT NULL,
          whatsapp_number VARCHAR(50) NOT NULL,
          location VARCHAR(100),
          currency VARCHAR(10) DEFAULT 'NGN',
          timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
          router_type VARCHAR(50) DEFAULT 'Starlink',
          coverage_area VARCHAR(100),
          bank_name VARCHAR(50),
          bank_account_no VARCHAR(20),
          bank_account_name VARCHAR(100),
          payment_instructions TEXT,
          whatsapp_provider VARCHAR(50) DEFAULT 'Meta Cloud API',
          whatsapp_api_key TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Internet hotspot plans table setup
      await client.query(`
        CREATE TABLE IF NOT EXISTS internet_plans (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          price NUMERIC(10,2) NOT NULL,
          data_limit_gb NUMERIC(6,2),
          duration_hours INT NOT NULL,
          speed_limit_mbps INT NOT NULL,
          device_limit INT DEFAULT 1,
          validity_period_days INT DEFAULT 1,
          auto_expiry BOOLEAN DEFAULT TRUE,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          is_popular BOOLEAN DEFAULT FALSE
        );
      `);

      // Payment verification requests table setup
      await client.query(`
        CREATE TABLE IF NOT EXISTS payment_requests (
          id VARCHAR(64) PRIMARY KEY,
          customer_name VARCHAR(100) NOT NULL,
          customer_phone VARCHAR(50) NOT NULL,
          customer_email VARCHAR(100),
          plan_id VARCHAR(64) NOT NULL,
          plan_name VARCHAR(100) NOT NULL,
          plan_price NUMERIC(10,2) NOT NULL,
          screenshot_url TEXT,
          reference VARCHAR(100) NOT NULL,
          status VARCHAR(30) DEFAULT 'Awaiting Approval',
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          whatsapp_delivered BOOLEAN DEFAULT FALSE
        );
      `);

      // Wi-Fi access vouchers table setup
      await client.query(`
        CREATE TABLE IF NOT EXISTS active_vouchers (
          id VARCHAR(64) PRIMARY KEY,
          code VARCHAR(32) UNIQUE NOT NULL,
          plan_id VARCHAR(64) NOT NULL,
          plan_name VARCHAR(100) NOT NULL,
          plan_price NUMERIC(10,2) NOT NULL,
          status VARCHAR(20) DEFAULT 'active',
          date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          duration_hours INT NOT NULL,
          data_limit_gb NUMERIC(6,2),
          remaining_data_gb NUMERIC(6,2),
          speed_limit_mbps INT NOT NULL,
          customer_name VARCHAR(100),
          customer_phone VARCHAR(50),
          customer_email VARCHAR(100),
          is_multi_device BOOLEAN DEFAULT FALSE,
          device_limit INT DEFAULT 1,
          notes TEXT
        );
      `);

      // Customers table setup
      await client.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          whatsapp VARCHAR(50),
          active_plan_id VARCHAR(64),
          active_plan_name VARCHAR(100),
          expiry_time TIMESTAMP,
          total_spend NUMERIC(12,2) DEFAULT 0,
          history_vouchers_count INT DEFAULT 0,
          is_suspended BOOLEAN DEFAULT FALSE,
          is_blacklisted BOOLEAN DEFAULT FALSE,
          notes TEXT,
          joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Mock sessions table setup
      await client.query(`
        CREATE TABLE IF NOT EXISTS active_sessions (
          id VARCHAR(64) PRIMARY KEY,
          customer_name VARCHAR(100) NOT NULL,
          ip_address VARCHAR(30) NOT NULL,
          mac_address VARCHAR(30) NOT NULL,
          device_type VARCHAR(50) NOT NULL,
          data_used_gb NUMERIC(6,2) DEFAULT 0,
          upload_speed_mbps NUMERIC(6,2) DEFAULT 0,
          download_speed_mbps NUMERIC(6,2) DEFAULT 0,
          connected_duration VARCHAR(20),
          voucher_code VARCHAR(32) NOT NULL
        );
      `);

      // WhatsApp logs table setup
      await client.query(`
        CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
          id VARCHAR(64) PRIMARY KEY,
          recipient_name VARCHAR(100) NOT NULL,
          recipient_phone VARCHAR(50) NOT NULL,
          message_type VARCHAR(30) NOT NULL,
          content TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'Delivered',
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          plan_name VARCHAR(100),
          voucher_code VARCHAR(32)
        );
      `);

      // Core system operational logs table setup
      await client.query(`
        CREATE TABLE IF NOT EXISTS system_config (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      // Populate Initial Seeds if completely empty
      const countRes = await client.query("SELECT COUNT(*) FROM reseller_profiles");
      if (parseInt(countRes.rows[0].count) === 0) {
        console.log('🌱 Databases are empty. Injecting seed defaults...');
        
        await client.query(`
          INSERT INTO reseller_profiles (
            id, business_name, logo_emoji, logo_bg_color, phone, whatsapp_number, location, currency, timezone, router_type, coverage_area, bank_name, bank_account_no, bank_account_name, payment_instructions, whatsapp_provider, whatsapp_api_key
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
          fallbackBusiness.id, fallbackBusiness.businessName, fallbackBusiness.logoEmoji, fallbackBusiness.logoBgColor,
          fallbackBusiness.phone, fallbackBusiness.whatsapp, fallbackBusiness.location, fallbackBusiness.currency,
          fallbackBusiness.timezone, fallbackBusiness.routerType, fallbackBusiness.coverageArea, fallbackBusiness.bankName,
          fallbackBusiness.bankAccountNo, fallbackBusiness.bankAccountName, fallbackBusiness.paymentInstructions,
          fallbackBusiness.whatsappProvider, fallbackBusiness.whatsappApiKey
        ]);

        for (const plan of fallbackPlans) {
          await client.query(`
            INSERT INTO internet_plans (
              id, name, price, data_limit_gb, duration_hours, speed_limit_mbps, device_limit, validity_period_days, auto_expiry, description, is_active, is_popular
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            plan.id, plan.name, plan.price, plan.dataLimitGb, plan.durationHours, plan.speedLimitMbps,
            plan.deviceLimit, plan.validityPeriodDays, plan.autoExpiry, plan.description, plan.isActive, plan.isPopular || false
          ]);
        }

        for (const trsf of fallbackPayments) {
          await client.query(`
            INSERT INTO payment_requests (
              id, customer_name, customer_phone, customer_email, plan_id, plan_name, plan_price, reference, status, timestamp, whatsapp_delivered
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            trsf.id, trsf.customerName, trsf.customerPhone, trsf.customerEmail, trsf.planId, trsf.planName,
            trsf.planPrice, trsf.reference, trsf.status, trsf.timestamp, trsf.whatsappDelivered
          ]);
        }

        for (const v of fallbackVouchers) {
          await client.query(`
            INSERT INTO active_vouchers (
              id, code, plan_id, plan_name, plan_price, status, date_created, duration_hours, data_limit_gb, remaining_data_gb, speed_limit_mbps, customer_name, customer_phone, customer_email, is_multi_device, device_limit
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          `, [
            v.id, v.code, v.planId, v.planName, v.planPrice, v.status, v.dateCreated, v.durationHours,
            v.dataLimitGb, v.remainingDataGb, v.speedLimitMbps, v.customerName, v.customerPhone, v.customerEmail,
            v.isMultiDevice, v.deviceLimit
          ]);
        }

        for (const cust of fallbackCustomers) {
          await client.query(`
            INSERT INTO customers (
              id, name, phone, whatsapp, active_plan_id, active_plan_name, expiry_time, total_spend, history_vouchers_count, is_suspended, is_blacklisted, notes, joined_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [
            cust.id, cust.name, cust.phone, cust.whatsapp, cust.activePlanId, cust.activePlanName,
            cust.expiryTime, cust.totalSpend, cust.historyVouchersCount, cust.isSuspended, cust.isBlacklisted,
            cust.notes, cust.joinedDate
          ]);
        }

        for (const sess of fallbackSessions) {
          await client.query(`
            INSERT INTO active_sessions (
              id, customer_name, ip_address, mac_address, device_type, data_used_gb, upload_speed_mbps, download_speed_mbps, connected_duration, voucher_code
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            sess.id, sess.customerName, sess.ipAddress, sess.macAddress, sess.deviceType, sess.dataUsedGb,
            sess.uploadSpeedMbps, sess.downloadSpeedMbps, sess.connectedDuration, sess.voucherCode
          ]);
        }

        for (const msg of fallbackMessageLogs) {
          await client.query(`
            INSERT INTO whatsapp_message_logs (
              id, recipient_name, recipient_phone, message_type, content, status, timestamp, plan_name, voucher_code
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            msg.id, msg.recipientName, msg.recipientPhone, msg.messageType, msg.content, msg.status,
            msg.timestamp, msg.planName, msg.voucherCode
          ]);
        }

        await client.query(`
          INSERT INTO system_config (key, value) VALUES ('saas_announcement', $1)
          ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value
        `, [fallbackAnnouncement]);

        await client.query(`
          INSERT INTO system_config (key, value) VALUES ('saas_tier', $1)
          ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value
        `, [fallbackSaaSTier]);

        console.log('🚀 Seed data successfully established in Neon tables!');
      } else {
        console.log('✅ Tables populated. Skipping seeding.');
      }
    } finally {
      client.release();
    }
  } catch (err: any) {
    dbStatus = 'error_fallback_mode';
    dbErrorMsg = err.message;
    console.error('❌ Failed initializing Neon database schemas:', err.message);
  }
}

// ----------------------------------------------------
// FULL REST API ROUTINGS WITH HYBRID PG / MEMORY MODES
// ----------------------------------------------------

// DB Status Badge query
app.get('/api/db-status', (req, res) => {
  res.json({
    status: dbStatus,
    error: dbErrorMsg,
    neonActive: pool !== null && dbStatus === 'connected',
    provider: 'Neon Cloud Serverless PostgreSQL (Pooler Mode)'
  });
});

// RESELLER BUSINESS PROFILE
app.get('/api/business', async (req, res) => {
  if (pool && dbStatus === 'connected') {
    try {
      const dbRes = await pool.query('SELECT * FROM reseller_profiles LIMIT 1');
      if (dbRes.rows.length > 0) {
        const row = dbRes.rows[0];
        return res.json({
          id: row.id,
          businessName: row.business_name,
          logoEmoji: row.logo_emoji || '⚡',
          logoBgColor: row.logo_bg_color || '#059669',
          phone: row.phone,
          whatsapp: row.whatsapp_number,
          location: row.location,
          currency: row.currency || 'NGN',
          timezone: row.timezone || 'Africa/Lagos',
          routerType: row.router_type || 'Starlink',
          coverageArea: row.coverage_area,
          bankName: row.bank_name,
          bankAccountNo: row.bank_account_no,
          bankAccountName: row.bank_account_name,
          paymentInstructions: row.payment_instructions,
          whatsappProvider: row.whatsapp_provider || 'Meta Cloud API',
          whatsappApiKey: row.whatsapp_api_key
        });
      }
    } catch (err) {
      console.error('DB business read failed. Falling back:', err);
    }
  }
  res.json(fallbackBusiness);
});

app.post('/api/business', async (req, res) => {
  const b = req.body;
  if (pool && dbStatus === 'connected') {
    try {
      await pool.query(`
        INSERT INTO reseller_profiles (
          id, business_name, logo_emoji, logo_bg_color, phone, whatsapp_number, location, currency, timezone, router_type, coverage_area, bank_name, bank_account_no, bank_account_name, payment_instructions, whatsapp_provider, whatsapp_api_key
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET
          business_name = EXCLUDED.business_name,
          logo_emoji = EXCLUDED.logo_emoji,
          logo_bg_color = EXCLUDED.logo_bg_color,
          phone = EXCLUDED.phone,
          whatsapp_number = EXCLUDED.whatsapp_number,
          location = EXCLUDED.location,
          currency = EXCLUDED.currency,
          timezone = EXCLUDED.timezone,
          router_type = EXCLUDED.router_type,
          coverage_area = EXCLUDED.coverage_area,
          bank_name = EXCLUDED.bank_name,
          bank_account_no = EXCLUDED.bank_account_no,
          bank_account_name = EXCLUDED.bank_account_name,
          payment_instructions = EXCLUDED.payment_instructions,
          whatsapp_provider = EXCLUDED.whatsapp_provider,
          whatsapp_api_key = EXCLUDED.whatsapp_api_key
      `, [
        b.id || 'biz_1', b.businessName, b.logoEmoji, b.logoBgColor, b.phone, b.whatsapp, b.location,
        b.currency || 'NGN', b.timezone || 'Africa/Lagos', b.routerType, b.coverageArea, b.bankName,
        b.bankAccountNo, b.bankAccountName, b.paymentInstructions, b.whatsappProvider, b.whatsappApiKey
      ]);
      return res.json({ success: true, updated: b });
    } catch (err) {
      console.error('DB business save failed. Falling back:', err);
    }
  }
  fallbackBusiness = { ...fallbackBusiness, ...b };
  res.json({ success: true, updated: fallbackBusiness });
});

// INTERNET PLANS ROUTINGS
app.get('/api/plans', async (req, res) => {
  if (pool && dbStatus === 'connected') {
    try {
      const dbRes = await pool.query('SELECT * FROM internet_plans ORDER BY price ASC');
      const transformed = dbRes.rows.map(row => ({
        id: row.id,
        name: row.name,
        price: parseFloat(row.price),
        dataLimitGb: parseFloat(row.data_limit_gb || '0'),
        durationHours: row.duration_hours,
        speedLimitMbps: row.speed_limit_mbps,
        deviceLimit: row.device_limit,
        validityPeriodDays: row.validity_period_days,
        autoExpiry: row.auto_expiry,
        description: row.description,
        isActive: row.is_active,
        isPopular: row.is_popular
      }));
      return res.json(transformed);
    } catch (err) {
      console.error('DB plans fetch failed. Returning fallback:', err);
    }
  }
  res.json(fallbackPlans);
});

app.post('/api/plans', async (req, res) => {
  const p = req.body;
  if (pool && dbStatus === 'connected') {
    try {
      await pool.query(`
        INSERT INTO internet_plans (
          id, name, price, data_limit_gb, duration_hours, speed_limit_mbps, device_limit, validity_period_days, auto_expiry, description, is_active, is_popular
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          data_limit_gb = EXCLUDED.data_limit_gb,
          duration_hours = EXCLUDED.duration_hours,
          speed_limit_mbps = EXCLUDED.speed_limit_mbps,
          device_limit = EXCLUDED.device_limit,
          validity_period_days = EXCLUDED.validity_period_days,
          auto_expiry = EXCLUDED.auto_expiry,
          description = EXCLUDED.description,
          is_active = EXCLUDED.is_active,
          is_popular = EXCLUDED.is_popular
      `, [
        p.id, p.name, p.price, p.dataLimitGb, p.durationHours, p.speedLimitMbps,
        p.deviceLimit, p.validityPeriodDays, p.autoExpiry, p.description, p.isActive, p.isPopular || false
      ]);
      return res.json({ success: true, plan: p });
    } catch (err) {
      console.error('DB plan save failed. Using local storage copy:', err);
    }
  }
  const idx = fallbackPlans.findIndex(x => x.id === p.id);
  if (idx > -1) {
    fallbackPlans[idx] = p;
  } else {
    fallbackPlans.unshift(p);
  }
  res.json({ success: true, plan: p });
});

app.delete('/api/plans/:id', async (req, res) => {
  const id = req.params.id;
  if (pool && dbStatus === 'connected') {
    try {
      await pool.query('DELETE FROM internet_plans WHERE id = $1', [id]);
      return res.json({ success: true });
    } catch (err) {
      console.error('DB plan delete error:', err);
    }
  }
  fallbackPlans = fallbackPlans.filter((p) => p.id !== id);
  res.json({ success: true });
});

// PAYMENTS VERIFICATION REQUESTS ROUTINGS
app.get('/api/payments', async (req, res) => {
  if (pool && dbStatus === 'connected') {
    try {
      const dbRes = await pool.query('SELECT * FROM payment_requests ORDER BY timestamp DESC');
      const transformed = dbRes.rows.map(row => ({
        id: row.id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        customerEmail: row.customer_email || undefined,
        planId: row.plan_id,
        planName: row.plan_name,
        planPrice: parseFloat(row.plan_price),
        screenshotUrl: row.screenshot_url || undefined,
        reference: row.reference,
        status: row.status,
        timestamp: row.timestamp,
        whatsappDelivered: row.whatsapp_delivered
      }));
      return res.json(transformed);
    } catch (err) {
      console.error('DB payments fetch error:', err);
    }
  }
  res.json(fallbackPayments);
});

app.post('/api/payments', async (req, res) => {
  const p = req.body;
  if (pool && dbStatus === 'connected') {
    try {
      await pool.query(`
        INSERT INTO payment_requests (
          id, customer_name, customer_phone, customer_email, plan_id, plan_name, plan_price, reference, status, timestamp, whatsapp_delivered
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        p.id, p.customerName, p.customerPhone, p.customerEmail || null, p.planId, p.planName,
        p.planPrice, p.reference, p.status, p.timestamp || new Date().toISOString(), p.whatsappDelivered || false
      ]);
      return res.json({ success: true, payment: p });
    } catch (err) {
      console.error('DB payment upload error:', err);
    }
  }
  fallbackPayments.unshift(p);
  res.json({ success: true, payment: p });
});

// APPROVAL CORE FLOW: GENERATES ACTIVE VOUCHERS IN NEON CORES
app.post('/api/payments/approve', async (req, res) => {
  const { id, spawnedVoucherCode, spawnedVoucherId } = req.body;
  
  if (pool && dbStatus === 'connected') {
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        
        // Find existing request
        const reqQuery = await client.query('SELECT * FROM payment_requests WHERE id = $1', [id]);
        if (reqQuery.rows.length === 0) {
          throw new Error('Payment request token not found in Neon SQL');
        }
        
        const payReq = reqQuery.rows[0];
        // Mark payment Request as Approved
        await client.query("UPDATE payment_requests SET status = 'Approved' WHERE id = $1", [id]);
        
        // Read plan specifications
        const planQuery = await client.query('SELECT * FROM internet_plans WHERE id = $1', [payReq.plan_id]);
        let speed = 8;
        let limitGb = 2.0;
        let hours = 24;
        
        if (planQuery.rows.length > 0) {
          const p = planQuery.rows[0];
          speed = p.speed_limit_mbps;
          limitGb = parseFloat(p.data_limit_gb || '0');
          hours = p.duration_hours;
        }

        // Spawn Voucher Passage PIN
        await client.query(`
          INSERT INTO active_vouchers (
            id, code, plan_id, plan_name, plan_price, status, date_created, duration_hours, data_limit_gb, remaining_data_gb, speed_limit_mbps, customer_name, customer_phone, customer_email, is_multi_device, device_limit
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, $10, $11, $12, $13, FALSE, 1)
        `, [
          spawnedVoucherId, spawnedVoucherCode, payReq.plan_id, payReq.plan_name, payReq.plan_price,
          'active', hours, limitGb, limitGb, speed, payReq.customer_name, payReq.customer_phone, payReq.customer_email
        ]);

        // Insert or updates Client records
        const custId = 'cust_' + Math.floor(Math.random()*10000);
        await client.query(`
          INSERT INTO customers (
            id, name, phone, whatsapp, active_plan_id, active_plan_name, expiry_time, total_spend, history_vouchers_count, is_suspended, notes, joined_date
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '1 hour' * $7, $8, 1, FALSE, 'Auto added upon bank transfer review', NOW())
          ON CONFLICT(id) DO UPDATE SET
            total_spend = customers.total_spend + EXCLUDED.total_spend,
            history_vouchers_count = customers.history_vouchers_count + 1,
            active_plan_id = EXCLUDED.active_plan_id,
            active_plan_name = EXCLUDED.active_plan_name,
            expiry_time = NOW() + INTERVAL '1 hour' * $7
        `, [custId, payReq.customer_name, payReq.customer_phone, payReq.customer_phone, payReq.plan_id, payReq.plan_name, hours, payReq.plan_price]);

        await client.query("COMMIT");
        return res.json({ success: true });
      } catch (innerErr: any) {
        await client.query("ROLLBACK");
        throw innerErr;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error('DB Approve transaction transaction error:', err);
    }
  }

  // Backup Manual In-Memory workflow
  const idx = fallbackPayments.findIndex((x) => x.id === id);
  if (idx > -1) {
    fallbackPayments[idx].status = 'Approved';
    const pay = fallbackPayments[idx];
    
    // Spawn Voucher in fallback
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

    // Increment Customer state
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
  if (pool && dbStatus === 'connected') {
    try {
      await pool.query("UPDATE payment_requests SET status = 'Rejected' WHERE id = $1", [id]);
      return res.json({ success: true });
    } catch (err) {
      console.error('DB reject error:', err);
    }
  }
  const idx = fallbackPayments.findIndex((x) => x.id === id);
  if (idx > -1) {
    fallbackPayments[idx].status = 'Rejected';
  }
  res.json({ success: true });
});

// ACTIVE VOUCHERS GENERAL
app.get('/api/vouchers', async (req, res) => {
  if (pool && dbStatus === 'connected') {
    try {
      const dbRes = await pool.query('SELECT * FROM active_vouchers ORDER BY date_created DESC');
      const transformed = dbRes.rows.map(row => ({
        id: row.id,
        code: row.code,
        planId: row.plan_id,
        planName: row.plan_name,
        planPrice: parseFloat(row.plan_price),
        status: row.status,
        dateCreated: row.date_created,
        durationHours: row.duration_hours,
        dataLimitGb: parseFloat(row.data_limit_gb || '0'),
        remainingDataGb: parseFloat(row.remaining_data_gb || '0'),
        speedLimitMbps: row.speed_limit_mbps,
        customerName: row.customer_name || undefined,
        customerPhone: row.customer_phone || undefined,
        customerEmail: row.customer_email || undefined,
        isMultiDevice: row.is_multi_device || false,
        deviceLimit: row.device_limit || 1,
        notes: row.notes || undefined
      }));
      return res.json(transformed);
    } catch (err) {
      console.error('DB vouchers fetch failed:', err);
    }
  }
  res.json(fallbackVouchers);
});

app.post('/api/vouchers', async (req, res) => {
  const v = req.body;
  if (pool && dbStatus === 'connected') {
    try {
      await pool.query(`
        INSERT INTO active_vouchers (
          id, code, plan_id, plan_name, plan_price, status, date_created, duration_hours, data_limit_gb, remaining_data_gb, speed_limit_mbps, customer_name, customer_phone, customer_email, is_multi_device, device_limit, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          status = EXCLUDED.status,
          remaining_data_gb = EXCLUDED.remaining_data_gb,
          customer_name = EXCLUDED.customer_name,
          customer_phone = EXCLUDED.customer_phone,
          customer_email = EXCLUDED.customer_email,
          notes = EXCLUDED.notes
      `, [
        v.id, v.code, v.planId, v.planName, v.planPrice, v.status, v.dateCreated || new Date().toISOString(),
        v.durationHours, v.dataLimitGb, v.remainingDataGb, v.speedLimitMbps, v.customerName || null, v.customerPhone || null,
        v.customerEmail || null, v.isMultiDevice || false, v.deviceLimit || 1, v.notes || null
      ]);
      return res.json({ success: true, voucher: v });
    } catch (err) {
      console.error('DB voucher save failed:', err);
    }
  }
  const idx = fallbackVouchers.findIndex(x => x.id === v.id);
  if (idx > -1) {
    fallbackVouchers[idx] = v;
  } else {
    fallbackVouchers.unshift(v);
  }
  res.json({ success: true, voucher: v });
});

// CUSTOMERS MANAGEMENT ROUTINGS
app.get('/api/customers', async (req, res) => {
  if (pool && dbStatus === 'connected') {
    try {
      const dbRes = await pool.query('SELECT * FROM customers ORDER BY joined_date DESC');
      const transformed = dbRes.rows.map(row => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        whatsapp: row.whatsapp,
        activePlanId: row.active_plan_id || undefined,
        activePlanName: row.active_plan_name || undefined,
        expiryTime: row.expiry_time || undefined,
        totalSpend: parseFloat(row.total_spend || '0'),
        historyVouchersCount: row.history_vouchers_count,
        isSuspended: row.is_suspended,
        isBlacklisted: row.is_blacklisted || false,
        notes: row.notes || '',
        joinedDate: row.joined_date
      }));
      return res.json(transformed);
    } catch (err) {
      console.error('DB fetch customers error. Falling back:', err);
    }
  }
  res.json(fallbackCustomers);
});

app.post('/api/customers', async (req, res) => {
  const c = req.body;
  if (pool && dbStatus === 'connected') {
    try {
      await pool.query(`
        INSERT INTO customers (
          id, name, phone, whatsapp, active_plan_id, active_plan_name, expiry_time, total_spend, history_vouchers_count, is_suspended, is_blacklisted, notes, joined_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          whatsapp = EXCLUDED.whatsapp,
          active_plan_id = EXCLUDED.active_plan_id,
          active_plan_name = EXCLUDED.active_plan_name,
          expiry_time = EXCLUDED.expiry_time,
          total_spend = EXCLUDED.total_spend,
          history_vouchers_count = EXCLUDED.history_vouchers_count,
          is_suspended = EXCLUDED.is_suspended,
          is_blacklisted = EXCLUDED.is_blacklisted,
          notes = EXCLUDED.notes
      `, [
        c.id, c.name, c.phone, c.whatsapp, c.activePlanId || null, c.activePlanName || null,
        c.expiryTime || null, c.totalSpend, c.historyVouchersCount, c.isSuspended, c.isBlacklisted || false,
        c.notes || '', c.joinedDate || new Date().toISOString()
      ]);
      return res.json({ success: true, customer: c });
    } catch (err) {
      console.error('DB save customer error:', err);
    }
  }
  const idx = fallbackCustomers.findIndex(x => x.id === c.id);
  if (idx > -1) {
    fallbackCustomers[idx] = c;
  } else {
    fallbackCustomers.unshift(c);
  }
  res.json({ success: true, customer: c });
});

// ACTIVE SESSIONS ROUTINGS
app.get('/api/sessions', async (req, res) => {
  if (pool && dbStatus === 'connected') {
    try {
      const dbRes = await pool.query('SELECT * FROM active_sessions');
      const transformed = dbRes.rows.map(row => ({
        id: row.id,
        customerName: row.customer_name,
        ipAddress: row.ip_address,
        macAddress: row.mac_address,
        deviceType: row.device_type,
        dataUsedGb: parseFloat(row.data_used_gb || '0'),
        uploadSpeedMbps: parseFloat(row.upload_speed_mbps || '0'),
        downloadSpeedMbps: parseFloat(row.download_speed_mbps || '0'),
        connectedDuration: row.connected_duration,
        voucherCode: row.voucher_code
      }));
      return res.json(transformed);
    } catch (err) {
      console.error('DB sessions load failed:', err);
    }
  }
  res.json(fallbackSessions);
});

app.post('/api/sessions/disconnect', async (req, res) => {
  const { id } = req.body;
  if (pool && dbStatus === 'connected') {
    try {
      await pool.query('DELETE FROM active_sessions WHERE id = $1', [id]);
      return res.json({ success: true });
    } catch (err) {
      console.error('DB session disconnect failed:', err);
    }
  }
  fallbackSessions = fallbackSessions.filter((s) => s.id !== id);
  res.json({ success: true });
});

// WHATSAPP OUTGOING MESSAGE LOGS
app.get('/api/message-logs', async (req, res) => {
  if (pool && dbStatus === 'connected') {
    try {
      const dbRes = await pool.query('SELECT * FROM whatsapp_message_logs ORDER BY timestamp DESC');
      const transformed = dbRes.rows.map(row => ({
        id: row.id,
        recipientName: row.recipient_name,
        recipientPhone: row.recipient_phone,
        messageType: row.message_type,
        content: row.content,
        status: row.status,
        timestamp: row.timestamp,
        planName: row.plan_name || undefined,
        voucherCode: row.voucher_code || undefined
      }));
      return res.json(transformed);
    } catch (err) {
      console.error('DB whatsapp trace fetch failed:', err);
    }
  }
  res.json(fallbackMessageLogs);
});

app.post('/api/message-logs', async (req, res) => {
  const m = req.body;
  if (pool && dbStatus === 'connected') {
    try {
      await pool.query(`
        INSERT INTO whatsapp_message_logs (
          id, recipient_name, recipient_phone, message_type, content, status, timestamp, plan_name, voucher_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        m.id, m.recipientName, m.recipientPhone, m.messageType, m.content, m.status,
        m.timestamp || new Date().toISOString(), m.planName || null, m.voucherCode || null
      ]);
      return res.json({ success: true, log: m });
    } catch (err) {
      console.error('DB trace logging failed:', err);
    }
  }
  fallbackMessageLogs.unshift(m);
  res.json({ success: true, log: m });
});

// OPERATOR CONFIGS (ANNOUNCEMENTS AND SAAS LEVEL TIERS)
app.get('/api/operator', async (req, res) => {
  let announcement = fallbackAnnouncement;
  let saasTier = fallbackSaaSTier;

  if (pool && dbStatus === 'connected') {
    try {
      const dbRes = await pool.query("SELECT * FROM system_config");
      dbRes.rows.forEach(row => {
        if (row.key === 'saas_announcement') announcement = row.value;
        if (row.key === 'saas_tier') saasTier = row.value;
      });
    } catch (err) {
      console.error('DB configs fetch error:', err);
    }
  }
  res.json({ announcement, saasTier });
});

app.post('/api/operator/announcement', async (req, res) => {
  const { announcement } = req.body;
  if (pool && dbStatus === 'connected') {
    try {
      await pool.query(`
        INSERT INTO system_config (key, value) VALUES ('saas_announcement', $1)
        ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value
      `, [announcement]);
      return res.json({ success: true });
    } catch (err) {
      console.error('DB config update announcement error:', err);
    }
  }
  fallbackAnnouncement = announcement;
  res.json({ success: true });
});

app.post('/api/operator/saas-tier', async (req, res) => {
  const { saasTier } = req.body;
  if (pool && dbStatus === 'connected') {
    try {
      await pool.query(`
        INSERT INTO system_config (key, value) VALUES ('saas_tier', $1)
        ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value
      `, [saasTier]);
      return res.json({ success: true });
    } catch (err) {
      console.error('DB config update saasTier error:', err);
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
