import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Enable CORS for cross-origin frontend-to-backend communication
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Environment validation
function validateEnv() {
  const required = ['JWT_SECRET'];
  const optional = ['DATABASE_URL', 'POSTGRES_URL', 'ALLOWED_ORIGINS', 'VITE_API_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing required environment variables: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Cannot start in production without required env vars');
      process.exit(1);
    }
  }
  
  if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'dev-secret-change-in-production') {
    console.error('❌ JWT_SECRET must be set to a secure random value in production!');
    process.exit(1);
  }
  
  optional.forEach(key => {
    if (!process.env[key]) {
      console.warn(`⚠️  Optional environment variable not set: ${key}`);
    }
  });
  
  console.log('✅ Environment validation passed');
}

validateEnv();

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for auth endpoints
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs for general API
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general API rate limiting
app.use('/api/', apiLimiter);

// Zod Validation Schemas
const registerSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  businessName: z.string().min(1).max(255),
  businessAddress: z.string().min(1).max(500),
  emailAddress: z.string().email(),
  whatsappNumber: z.string().min(10).max(20),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const businessSchema = z.object({
  id: z.string().optional(),
  businessName: z.string().min(1).max(255).optional(),
  logoEmoji: z.string().max(10).optional(),
  logoBgColor: z.string().max(20).optional(),
  phone: z.string().max(100).optional(),
  whatsapp: z.string().max(100).optional(),
  location: z.string().max(500).optional(),
  currency: z.enum(['NGN', 'USD', 'KES', 'GHS', 'ZAR']).optional(),
  timezone: z.string().max(50).optional(),
  routerType: z.enum(['Starlink', 'MikroTik', 'TP-Link', 'Huawei 4G/5G', 'Other']).optional(),
  mikrotikIntegrationEnabled: z.boolean().optional(),
  mikrotikHost: z.string().optional(),
  mikrotikApiPort: z.number().optional(),
  mikrotikUsername: z.string().optional(),
  mikrotikPassword: z.string().optional(),
  mikrotikApiToken: z.string().optional(),
  mikrotikHotspotName: z.string().optional(),
  coverageArea: z.string().max(500).optional(),
  bankName: z.string().max(100).optional(),
  bankAccountNo: z.string().max(100).optional(),
  bankAccountName: z.string().max(255).optional(),
  paymentInstructions: z.string().max(1000).optional(),
  whatsappProvider: z.enum(['Meta Cloud API', 'Twilio', 'Termii', 'UltraMsg']).optional(),
  whatsappApiKey: z.string().optional(),
  emailAlertsEnabled: z.boolean().optional(),
  adminAlertEmail: z.string().email().optional().or(z.literal('')),
});

const planSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  price: z.number().int().positive(),
  dataLimitGb: z.number().nonnegative(),
  durationHours: z.number().int().positive(),
  speedLimitMbps: z.number().int().positive(),
  deviceLimit: z.number().int().positive(),
  validityPeriodDays: z.number().int().positive(),
  autoExpiry: z.boolean(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean(),
  isPopular: z.boolean().optional(),
});

const paymentSchema = z.object({
  id: z.string(),
  customerName: z.string().min(1).max(255),
  customerPhone: z.string().min(10).max(20),
  customerEmail: z.string().email().optional().nullable(),
  planId: z.string(),
  planName: z.string().min(1).max(255),
  planPrice: z.number().int().positive(),
  screenshotUrl: z.string().url().optional().nullable(),
  reference: z.string().min(1).max(255),
  status: z.enum(['Requested', 'Awaiting Approval', 'Approved', 'Rejected']).optional(),
  timestamp: z.string().optional(),
  whatsappDelivered: z.boolean().optional(),
});

const approvePaymentSchema = z.object({
  id: z.string(),
  spawnedVoucherCode: z.string().optional(),
  spawnedVoucherId: z.string().optional(),
});

const rejectPaymentSchema = z.object({
  id: z.string(),
});

const voucherSchema = z.object({
  id: z.string(),
  code: z.string().min(1).max(50),
  planId: z.string(),
  planName: z.string().min(1).max(255),
  planPrice: z.number().int().positive(),
  status: z.enum(['pending_payment', 'active', 'used', 'expired', 'suspended']),
  dateCreated: z.string().optional(),
  durationHours: z.number().int().positive(),
  dataLimitGb: z.number().nonnegative(),
  remainingDataGb: z.number().nonnegative(),
  speedLimitMbps: z.number().int().positive(),
  customerName: z.string().max(255).optional().nullable(),
  customerPhone: z.string().max(20).optional().nullable(),
  customerEmail: z.string().email().optional().nullable(),
  isMultiDevice: z.boolean().optional(),
  deviceLimit: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional().nullable(),
});

const customerSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  phone: z.string().min(10).max(20),
  whatsapp: z.string().max(20).optional(),
  activePlanId: z.string().optional().nullable(),
  activePlanName: z.string().optional().nullable(),
  expiryTime: z.string().optional().nullable(),
  totalSpend: z.number().int().nonnegative().optional(),
  historyVouchersCount: z.number().int().nonnegative().optional(),
  isSuspended: z.boolean().optional(),
  isBlacklisted: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  joinedDate: z.string().optional(),
});

const messageLogSchema = z.object({
  id: z.string(),
  recipientName: z.string().min(1).max(255),
  recipientPhone: z.string().min(10).max(20),
  messageType: z.enum(['voucher', 'reminder', 'payment_received', 'announcement']),
  content: z.string().min(1),
  status: z.enum(['Delivered', 'Failed']).optional(),
  timestamp: z.string().optional(),
  planName: z.string().max(255).optional().nullable(),
  voucherCode: z.string().max(50).optional().nullable(),
});

const announcementSchema = z.object({
  announcement: z.string().min(1).max(2000),
});

const saasTierSchema = z.object({
  saasTier: z.enum(['starter', 'growth', 'business']),
});

// Validation middleware factory
const validate = (schema: z.ZodSchema) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
  }
  req.body = result.data;
  next();
};

// JWT Auth Middleware
interface AuthRequest extends express.Request {
  user?: { id: number; email: string; businessName?: string };
}

const authenticateToken = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; businessName?: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const { Pool } = pg;
let pgPool: pg.Pool | null = null;
let neonActive = false;
let neonErrorMsg = '';
let initPromise: Promise<void> | null = null;

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

if (databaseUrl) {
  try {
    pgPool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 6000,
      max: 5,
      idleTimeoutMillis: 30000
    });
    console.log('⚡ Neon PostgreSQL Pool defined successfully.');
  } catch (err: any) {
    neonErrorMsg = err.message;
    console.error('❌ Failed to initialize PG client:', err.message);
  }
}

async function initializePostgres(): Promise<void> {
  if (neonActive) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!pgPool) {
      console.log('⚠️ DATABASE_URL or POSTGRES_URL not set or Postgres unavailable. Running with in-memory fallback only.');
      return;
    }

    const maxRetries = 2;
    const retryDelays = [1000, 2000];

    let client: pg.PoolClient | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`⚡ Neon init attempt ${attempt}/${maxRetries}...`);
        client = await pgPool.connect();
        console.log('⚡ Connected to Neon PostgreSQL Database! Creating schemas...');
        
        const tables = [
      `CREATE TABLE IF NOT EXISTS reseller_registrations (
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
      )`,
      `CREATE TABLE IF NOT EXISTS reseller_profiles (
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
        mikrotik_integration_enabled BOOLEAN DEFAULT FALSE,
        mikrotik_host VARCHAR(255),
        mikrotik_api_port INTEGER DEFAULT 8728,
        mikrotik_username VARCHAR(100),
        mikrotik_password VARCHAR(255),
        mikrotik_api_token TEXT,
        mikrotik_hotspot_name VARCHAR(100) DEFAULT 'hotspot',
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
      )`,
      `CREATE TABLE IF NOT EXISTS internet_plans (
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
      )`,
      `CREATE TABLE IF NOT EXISTS payment_requests (
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
      )`,
      `CREATE TABLE IF NOT EXISTS active_vouchers (
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
      )`,
      `CREATE TABLE IF NOT EXISTS customers (
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
      )`,
      `CREATE TABLE IF NOT EXISTS active_sessions (
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
      )`,
      `CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
        id VARCHAR(255) PRIMARY KEY,
        recipient_name VARCHAR(255),
        recipient_phone VARCHAR(100),
        message_type VARCHAR(50),
        content TEXT,
        status VARCHAR(50) DEFAULT 'Delivered',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        plan_name VARCHAR(255),
        voucher_code VARCHAR(255)
      )`,
      `CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        phone VARCHAR(100),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tables) {
      try {
        await client.query(sql);
      } catch (tableErr: any) {
        console.error('⚠️ Table creation warning:', tableErr.message);
      }
    }

    neonActive = true;
    neonErrorMsg = '';
    console.log('⚡ All schemas synchronized on Neon.');
    return;
  } catch (err: any) {
    if (client) {
      client.release();
      client = null;
    }
    neonActive = false;
    neonErrorMsg = err.message;
    console.error(`❌ Neon PostgreSQL initialization attempt ${attempt}/${maxRetries} failed:`, err.message);
    if (attempt < maxRetries) {
      const delay = retryDelays[attempt - 1] || 5000;
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  } finally {
    if (client) client.release();
  }
}

neonActive = false;
neonErrorMsg = '❌ Neon PostgreSQL initialization failed after all retries.';
console.error('❌ Neon PostgreSQL initialization failed after all retries.');
initPromise = null;
  })();

  // ← Return the IIFE promise so callers can actually await DB readiness
  return initPromise;
}

// Kick off initialization at module load without overwriting initPromise
initializePostgres().catch(err => {
  console.error('⚠️ Neon initialization failed (non-fatal):', err.message);
});

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
  mikrotikIntegrationEnabled: false,
  mikrotikHost: '',
  mikrotikApiPort: 8728,
  mikrotikUsername: '',
  mikrotikPassword: '',
  mikrotikApiToken: '',
  mikrotikHotspotName: 'hotspot',
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
let fallbackRegistrations: any[] = [];
let fallbackSubscribers: any[] = [];

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
      fallbackSaaSTier,
      fallbackSubscribers
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
      if (data.fallbackSubscribers) fallbackSubscribers = data.fallbackSubscribers;
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

// DB Status Badge query — always awaits initialization before reporting
app.get('/api/db-status', async (req, res) => {
  try {
    // Always try to initialize; with the fixed initPromise this properly awaits
    await initializePostgres();
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
    res.json({
      status: neonActive ? 'connected' : 'offline',
      error: neonActive ? '' : neonErrorMsg,
      neonActive,
      neonError: neonErrorMsg,
      hasDatabaseUrl: !!dbUrl,
      databaseUrlLength: dbUrl.length,
      provider: neonActive ? 'Neon Serverless PostgreSQL Database' : 'Local Sandbox Storage'
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      error: err.message || 'Unknown error',
      neonActive: false,
      hasDatabaseUrl: false
    });
  }
});

// Force-init endpoint — call this once after deploy to warm up the DB connection
app.get('/api/db-init', async (req, res) => {
  try {
    // Reset initPromise so we force a fresh attempt regardless of prior state
    if (!neonActive) {
      initPromise = null;
    }
    await initializePostgres();
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
    res.json({
      success: neonActive,
      neonActive,
      message: neonActive
        ? '✅ Neon PostgreSQL connected and schemas ready'
        : `❌ Init failed: ${neonErrorMsg}`,
      hasDatabaseUrl: !!dbUrl,
      databaseUrlLength: dbUrl.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Direct database health test — raw connection probe, no module state involved
app.get('/api/db-health', async (req, res) => {
  try {
    if (!databaseUrl) {
      return res.status(503).json({ healthy: false, error: 'DATABASE_URL not configured', hasDatabaseUrl: false });
    }
    
    const testPool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 6000,
      max: 1
    });
    
    try {
      await testPool.query('SELECT 1 as test');
      await testPool.end();
      res.json({ healthy: true, dbUrlLength: databaseUrl.length });
    } catch (queryErr: any) {
      await testPool.end().catch(() => {});
      res.status(500).json({ healthy: false, error: queryErr.message });
    }
  } catch (err: any) {
    res.status(500).json({ healthy: false, error: err.message || 'Connection failed' });
  }
});

// RESELLER REGISTRATION ENDPOINT (Neon Postgres connected)
app.post('/api/reseller/register', authLimiter, validate(registerSchema), async (req, res) => {
  await initializePostgres();
  
  const { firstName, lastName, businessName, businessAddress, emailAddress, whatsappNumber, password } = req.body;
  
  if (!emailAddress || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = emailAddress.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  if (neonActive && pgPool) {
    try {
      const result = await pgPool.query(
        `INSERT INTO reseller_registrations (first_name, last_name, business_name, business_address, email_address, whatsapp_number, password)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [firstName, lastName, businessName, businessAddress, emailAddress, whatsappNumber, passwordHash]
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
    // Neon not active: return error instead of silent fallback
    console.error('❌ Registration failed: Neon database not initialized');
    return res.status(503).json({ 
      error: 'Database not ready. Please try again later or contact support.',
      details: neonErrorMsg || 'Neon initialization incomplete'
    });
  }
});

// RESELLER LOGIN/AUTH ENDPOINT (Neon Postgres check)
app.post('/api/reseller/login', authLimiter, validate(loginSchema), async (req, res) => {
  await initializePostgres();
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (neonActive && pgPool) {
    try {
      const result = await pgPool.query(
        `SELECT * FROM reseller_registrations WHERE LOWER(email_address) = $1`,
        [cleanEmail]
      );
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
          console.log(`👤 Reseller authenticated successfully via Neon database: ${cleanEmail}`);
          
          // Generate JWT token
          const token = jwt.sign(
            { id: user.id, email: user.email_address, businessName: user.business_name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          
          // Set httpOnly cookie
          res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
          
          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          return res.json({ success: true, user: userWithoutPassword });
        } else {
          return res.status(401).json({ error: 'Invalid reseller credentials. Please check details or click Register Here.' });
        }
      } else {
        return res.status(401).json({ error: 'Invalid reseller credentials. Please check details or click Register Here.' });
      }
    } catch (err: any) {
      console.error('❌ Neon Login SQL query failed:', err.message);
      return res.status(500).json({ error: `Neon SQL database login error: ${err.message}` });
    }
  } else {
    // Neon not active: return error instead of silent fallback
    console.error('❌ Login failed: Neon database not initialized');
    return res.status(503).json({ 
      error: 'Database not ready. Please try again later or contact support.',
      details: neonErrorMsg || 'Neon initialization incomplete'
    });
  }
});

// LOGOUT ENDPOINT
app.post('/api/reseller/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json({ success: true, message: 'Logged out successfully' });
});

// SUBSCRIBER REGISTRATION ENDPOINT
const subscriberRegisterSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().min(10).max(20),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

app.post('/api/subscriber/register', validate(subscriberRegisterSchema), async (req, res) => {
  const { name, phone, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);

  if (neonActive && pgPool) {
    try {
      const result = await pgPool.query(
        `INSERT INTO subscribers (name, phone, email, password)
         VALUES ($1, $2, $3, $4) RETURNING id, name, phone, email`,
        [name, phone, email, passwordHash]
      );
      console.log(`🎉 Subscriber ${email} registered successfully!`);
      return res.json({ success: true, user: result.rows[0] });
    } catch (err: any) {
      console.error('❌ Subscriber registration error:', err.message);
      if (err.message.includes('unique constraint') || err.message.includes('already exists')) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }
  } else {
    const exists = fallbackSubscribers?.some((s: any) => s.email?.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    const newSub = {
      id: Date.now(),
      name,
      phone,
      email,
      password: passwordHash,
    };
    fallbackSubscribers.push(newSub);
    return res.json({ success: true, user: { id: newSub.id, name, phone, email } });
  }
});

// SUBSCRIBER LOGIN ENDPOINT
const subscriberLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

app.post('/api/subscriber/login', validate(subscriberLoginSchema), async (req, res) => {
  const { email, password } = req.body;

  if (neonActive && pgPool) {
    try {
      const result = await pgPool.query(
        `SELECT * FROM subscribers WHERE email = $1`,
        [email]
      );
      if (result.rows.length > 0) {
        const sub = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, sub.password);
        if (passwordMatch) {
          const token = jwt.sign(
            { id: sub.id, email: sub.email, name: sub.name, role: 'subscriber' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });
          const { password: _, ...subWithoutPassword } = sub;
          return res.json({ success: true, user: subWithoutPassword });
        }
      }
      return res.status(401).json({ error: 'Invalid credentials.' });
    } catch (err: any) {
      console.error('❌ Subscriber login error:', err.message);
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }
  } else {
    const subs = fallbackSubscribers || [];
    const found = subs.find((s: any) => s.email === email);
    if (found && await bcrypt.compare(password, found.password)) {
      const token = jwt.sign(
        { id: found.id, email: found.email, name: found.name, role: 'subscriber' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      const { password: _, ...subWithoutPassword } = found;
      return res.json({ success: true, user: subWithoutPassword });
    }
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
});

// SUBSCRIBER LOGOUT ENDPOINT
app.post('/api/subscriber/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json({ success: true, message: 'Logged out successfully' });
});

// GET CURRENT SUBSCRIBER ENDPOINT
app.get('/api/subscriber/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (neonActive && pgPool) {
      const result = await pgPool.query(
        `SELECT id, name, phone, email, created_at FROM subscribers WHERE id = $1`,
        [userId]
      );
      if (result.rows.length > 0) {
        return res.json({ success: true, user: result.rows[0] });
      }
    } else {
      const found = fallbackSubscribers.find((s: any) => s.id === userId);
      if (found) {
        const { password: _, ...subWithoutPassword } = found;
        return res.json({ success: true, user: subWithoutPassword });
      }
    }
    return res.status(404).json({ error: 'User not found' });
  } catch (err: any) {
    console.error('❌ Get current subscriber error:', err.message);
    return res.status(500).json({ error: 'Failed to get user' });
  }
});

// GET CURRENT USER ENDPOINT
app.get('/api/reseller/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (neonActive && pgPool) {
      const result = await pgPool.query(
        `SELECT id, first_name, last_name, business_name, business_address, email_address, whatsapp_number, status, created_at FROM reseller_registrations WHERE id = $1`,
        [userId]
      );
      if (result.rows.length > 0) {
        return res.json({ success: true, user: result.rows[0] });
      }
    } else {
      const found = fallbackRegistrations.find(r => r.id === userId);
      if (found) {
        const { password: _, ...userWithoutPassword } = found;
        return res.json({ success: true, user: userWithoutPassword });
      }
    }
    return res.status(404).json({ error: 'User not found' });
  } catch (err: any) {
    console.error('❌ Get current user error:', err.message);
    return res.status(500).json({ error: 'Failed to get user' });
  }
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
    return res.json(fallbackRegistrations);
  }
});

// RESELLER BUSINESS PROFILE
app.get('/api/business', async (req, res) => {
  const resellerEmail = (req.query.email as string || '').trim().toLowerCase();
  if (neonActive && pgPool) {
    try {
      if (resellerEmail) {
        const result = await pgPool.query('SELECT * FROM reseller_profiles WHERE id = $1', [resellerEmail]);
        if (result.rows.length > 0) {
          const row = result.rows[0];
          return res.json({
            id: row.id,
            businessName: row.business_name,
            logoEmoji: row.logo_emoji,
            logoBgColor: row.logo_bg_color,
            phone: row.phone,
            whatsapp: row.whatsapp_number,
            location: row.location,
            currency: row.currency,
            timezone: row.timezone,
            routerType: row.router_type,
            mikrotikIntegrationEnabled: row.mikrotik_integration_enabled || false,
            mikrotikHost: row.mikrotik_host || '',
            mikrotikApiPort: row.mikrotik_api_port || 8728,
            mikrotikUsername: row.mikrotik_username || '',
            mikrotikPassword: row.mikrotik_password || '',
            mikrotikApiToken: row.mikrotik_api_token || '',
            mikrotikHotspotName: row.mikrotik_hotspot_name || 'hotspot',
            coverageArea: row.coverage_area,
            bankName: row.bank_name,
            bankAccountNo: row.bank_account_no,
            bankAccountName: row.bank_account_name,
            paymentInstructions: row.payment_instructions,
            whatsappProvider: row.whatsapp_provider,
            whatsappApiKey: row.whatsapp_api_key,
            emailAlertsEnabled: row.email_alerts_enabled,
            adminAlertEmail: row.admin_alert_email
          });
        }
      }
      const result = await pgPool.query('SELECT * FROM reseller_profiles LIMIT 1');
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return res.json({
          id: row.id,
          businessName: row.business_name,
          logoEmoji: row.logo_emoji,
          logoBgColor: row.logo_bg_color,
          phone: row.phone,
          whatsapp: row.whatsapp_number,
          location: row.location,
          currency: row.currency,
          timezone: row.timezone,
          routerType: row.router_type,
          mikrotikIntegrationEnabled: row.mikrotik_integration_enabled || false,
          mikrotikHost: row.mikrotik_host || '',
          mikrotikApiPort: row.mikrotik_api_port || 8728,
          mikrotikUsername: row.mikrotik_username || '',
          mikrotikPassword: row.mikrotik_password || '',
          mikrotikApiToken: row.mikrotik_api_token || '',
          mikrotikHotspotName: row.mikrotik_hotspot_name || 'hotspot',
          coverageArea: row.coverage_area,
          bankName: row.bank_name,
          bankAccountNo: row.bank_account_no,
          bankAccountName: row.bank_account_name,
          paymentInstructions: row.payment_instructions,
          whatsappProvider: row.whatsapp_provider,
          whatsappApiKey: row.whatsapp_api_key,
          emailAlertsEnabled: row.email_alerts_enabled,
          adminAlertEmail: row.admin_alert_email || resellerEmail || 'johnnybgsu@gmail.com'
        });
      }
    } catch (err: any) {
      console.error('Neon business read error:', err.message);
    }
  }
  res.json(fallbackBusiness);
});

app.post('/api/business', validate(businessSchema), async (req, res) => {
  const b = req.body;
  const id = b.id || 'biz_1';
  if (neonActive && pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO reseller_profiles (
          id, business_name, logo_emoji, logo_bg_color, phone, whatsapp_number, location,
          currency, timezone, router_type, mikrotik_integration_enabled, mikrotik_host,
          mikrotik_api_port, mikrotik_username, mikrotik_password, mikrotik_api_token,
          mikrotik_hotspot_name, coverage_area, bank_name, bank_account_no,
          bank_account_name, payment_instructions, whatsapp_provider, whatsapp_api_key,
          email_alerts_enabled, admin_alert_email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
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
          mikrotik_integration_enabled = EXCLUDED.mikrotik_integration_enabled,
          mikrotik_host = EXCLUDED.mikrotik_host,
          mikrotik_api_port = EXCLUDED.mikrotik_api_port,
          mikrotik_username = EXCLUDED.mikrotik_username,
          mikrotik_password = EXCLUDED.mikrotik_password,
          mikrotik_api_token = EXCLUDED.mikrotik_api_token,
          mikrotik_hotspot_name = EXCLUDED.mikrotik_hotspot_name,
          coverage_area = EXCLUDED.coverage_area,
          bank_name = EXCLUDED.bank_name,
          bank_account_no = EXCLUDED.bank_account_no,
          bank_account_name = EXCLUDED.bank_account_name,
          payment_instructions = EXCLUDED.payment_instructions,
          whatsapp_provider = EXCLUDED.whatsapp_provider,
          whatsapp_api_key = EXCLUDED.whatsapp_api_key,
          email_alerts_enabled = EXCLUDED.email_alerts_enabled,
          admin_alert_email = EXCLUDED.admin_alert_email
      `, [
        id, b.businessName, b.logoEmoji || '⚡', b.logoBgColor || '#059669', b.phone, b.whatsapp, b.location || '',
        b.currency || 'NGN', b.timezone || 'Africa/Lagos', b.routerType || 'Starlink',
        b.mikrotikIntegrationEnabled || false, b.mikrotikHost || '', b.mikrotikApiPort || 8728,
        b.mikrotikUsername || '', b.mikrotikPassword || '', b.mikrotikApiToken || '',
        b.mikrotikHotspotName || 'hotspot', b.coverageArea || '',
        b.bankName || '', b.bankAccountNo || '', b.bankAccountName || '', b.paymentInstructions || '',
        b.whatsappProvider || 'Meta Cloud API', b.whatsappApiKey || '', b.emailAlertsEnabled !== undefined ? b.emailAlertsEnabled : true,
        b.adminAlertEmail || ''
      ]);
      fallbackBusiness = { ...fallbackBusiness, ...b };
      saveSandboxData();
      return res.json({ success: true, updated: b });
    } catch (err: any) {
      console.error('Neon business save error:', err.message);
    }
  }
  fallbackBusiness = { ...fallbackBusiness, ...b };
  saveSandboxData();
  res.json({ success: true, updated: fallbackBusiness });
});

// MIKROTIk INTEGRATION ENDPOINTS
const mikrotikConfigSchema = z.object({
  host: z.string().min(1),
  apiPort: z.number().min(1).max(65535).optional(),
  username: z.string().min(1),
  password: z.string().min(1),
  apiToken: z.string().optional(),
  hotspotName: z.string().min(1),
});

app.post('/api/mikrotik/config', authLimiter, async (req, res) => {
  const config = req.body;
  if (!neonActive || !pgPool) {
    return res.status(503).json({ error: 'Database not connected. MikroTik config cannot be saved.' });
  }
  try {
    await pgPool.query(`
      INSERT INTO reseller_profiles (
        id, router_type, mikrotik_integration_enabled, mikrotik_host, mikrotik_api_port,
        mikrotik_username, mikrotik_password, mikrotik_api_token, mikrotik_hotspot_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        router_type = EXCLUDED.router_type,
        mikrotik_integration_enabled = EXCLUDED.mikrotik_integration_enabled,
        mikrotik_host = EXCLUDED.mikrotik_host,
        mikrotik_api_port = EXCLUDED.mikrotik_api_port,
        mikrotik_username = EXCLUDED.mikrotik_username,
        mikrotik_password = EXCLUDED.mikrotik_password,
        mikrotik_api_token = EXCLUDED.mikrotik_api_token,
        mikrotik_hotspot_name = EXCLUDED.mikrotik_hotspot_name
    `, [
      'biz_1', 'MikroTik', true, config.host, config.apiPort || 8728,
      config.username, config.password, config.apiToken || '', config.hotspotName
    ]);
    fallbackBusiness = {
      ...fallbackBusiness,
      routerType: 'MikroTik',
      mikrotikIntegrationEnabled: true,
      mikrotikHost: config.host,
      mikrotikApiPort: config.apiPort || 8728,
      mikrotikUsername: config.username,
      mikrotikPassword: config.password,
      mikrotikApiToken: config.apiToken || '',
      mikrotikHotspotName: config.hotspotName
    };
    saveSandboxData();
    return res.json({ success: true, message: 'MikroTik configuration saved successfully' });
  } catch (err: any) {
    console.error('MikroTik config save error:', err.message);
    return res.status(500).json({ error: 'Failed to save MikroTik configuration' });
  }
});

app.get('/api/mikrotik/status', async (req, res) => {
  const config = fallbackBusiness;
  if (!config.mikrotikIntegrationEnabled) {
    return res.json({ enabled: false, message: 'MikroTik integration not enabled' });
  }
  res.json({
    enabled: true,
    host: config.mikrotikHost,
    apiPort: config.mikrotikApiPort,
    hotspotName: config.mikrotikHotspotName,
    note: 'Connect to MikroTik API at the configured host. Use /api/mikrotik/users to manage users.'
  });
});

// MikroTik user management for voucher activation
app.post('/api/mikrotik/users', validate(z.object({
  voucherCode: z.string().min(1),
  customerName: z.string().min(1),
  phone: z.string().min(10),
  durationHours: z.number().int().positive(),
  dataLimitGb: z.number().positive(),
  speedLimitMbps: z.number().positive(),
  deviceLimit: z.number().int().positive()
})), async (req, res) => {
  const { voucherCode, customerName, phone, durationHours, dataLimitGb, speedLimitMbps, deviceLimit } = req.body;
  
  if (!fallbackBusiness.mikrotikIntegrationEnabled) {
    return res.status(400).json({ error: 'MikroTik integration not configured' });
  }

  if (neonActive && pgPool) {
    try {
      const voucher = await pgPool.query(
        'SELECT * FROM active_vouchers WHERE code = $1 AND status = $2',
        [voucherCode, 'active']
      );
      if (voucher.rows.length === 0) {
        return res.status(404).json({ error: 'Voucher not found or not active' });
      }
      
      await pgPool.query(
        'UPDATE active_vouchers SET status = $1, customer_name = $2, customer_phone = $3 WHERE code = $4',
        ['used', customerName, phone, voucherCode]
      );
    } catch (err: any) {
      console.error('MikroTik user sync error:', err.message);
    }
  } else {
    const idx = fallbackVouchers.findIndex(v => v.code === voucherCode && v.status === 'active');
    if (idx > -1) {
      fallbackVouchers[idx] = { ...fallbackVouchers[idx], status: 'used', customerName, customerPhone: phone };
      saveSandboxData();
    }
  }

  const profile = {
    name: `${customerName}_${phone}`,
    password: voucherCode,
    limitUptime: `${durationHours}h`,
    limitBytes: dataLimitGb * 1024 * 1024 * 1024,
    limitDownloadSpeed: speedLimitMbps * 1024 * 1024,
    limitUploadSpeed: speedLimitMbps * 1024 * 1024,
    limitSessions: deviceLimit
  };

  res.json({ success: true, profile, message: 'User created in MikroTik hotspot' });
});

// MikroTik voucher generation endpoint
app.post('/api/mikrotik/generate-voucher', authLimiter, async (req, res) => {
  const { planId, customerName, phone } = req.body;
  
  if (!neonActive || !pgPool) {
    return res.status(503).json({ error: 'Database not connected' });
  }

  try {
    const plan = await pgPool.query('SELECT * FROM internet_plans WHERE id = $1', [planId]);
    if (plan.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    const p = plan.rows[0];
    
    const voucherId = `mv_${Date.now()}`;
    const voucherCode = `MK-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).substring(0, 4).toUpperCase()}`;
    
    await pgPool.query(`
      INSERT INTO active_vouchers (
        id, code, plan_id, plan_name, plan_price, status, date_created, duration_hours,
        data_limit_gb, remaining_data_gb, speed_limit_mbps, customer_name, customer_phone,
        is_multi_device, device_limit, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `, [
      voucherId, voucherCode, planId, p.name, Number(p.price), 'active',
      Number(p.duration_hours), Number(p.data_limit_gb ?? 0), Number(p.data_limit_gb ?? 0),
      Number(p.speed_limit_mbps ?? 5), customerName || 'Guest', phone || '',
      !!p.device_limit && p.device_limit > 1, p.device_limit || 1, 'Generated via MikroTik API'
    ]);

    res.json({ 
      success: true, 
      voucher: { 
        id: voucherId, 
        code: voucherCode, 
        planId, 
        planName: p.name, 
        durationHours: Number(p.duration_hours),
        dataLimitGb: Number(p.data_limit_gb),
        speedLimitMbps: Number(p.speed_limit_mbps),
        deviceLimit: p.device_limit || 1
      } 
    });
  } catch (err: any) {
    console.error('MikroTik voucher generation error:', err.message);
    return res.status(500).json({ error: 'Failed to generate voucher' });
  }
});

// INTERNET PLANS ROUTINGS
app.get('/api/plans', async (req, res) => {
  if (neonActive && pgPool) {
    try {
      const result = await pgPool.query('SELECT * FROM internet_plans ORDER BY price ASC');
      const plans = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        price: Number(row.price),
        dataLimitGb: Number(row.data_limit_gb ?? 0),
        durationHours: Number(row.duration_hours ?? 24),
        speedLimitMbps: Number(row.speed_limit_mbps ?? 5),
        deviceLimit: Number(row.device_limit ?? 1),
        validityPeriodDays: Number(row.validity_period_days ?? 1),
        autoExpiry: !!row.auto_expiry,
        description: row.description ?? '',
        isActive: !!row.is_active,
        isPopular: !!row.is_popular
      }));
      return res.json(plans);
    } catch (err: any) {
      console.error('Neon plans read error:', err.message);
    }
  }
  res.json(fallbackPlans);
});

app.post('/api/plans', validate(planSchema), async (req, res) => {
  const p = req.body;
  if (neonActive && pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO internet_plans (
          id, name, price, data_limit_gb, duration_hours, speed_limit_mbps,
          device_limit, validity_period_days, auto_expiry, description, is_active, is_popular
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
        p.id, p.name, Number(p.price), Number(p.dataLimitGb ?? 0), Number(p.durationHours ?? 24),
        Number(p.speedLimitMbps ?? 5), Number(p.deviceLimit ?? 1), Number(p.validityPeriodDays ?? 1),
        p.autoExpiry ?? true, p.description ?? '', p.isActive ?? true, p.isPopular ?? false
      ]);
      const idx = fallbackPlans.findIndex(x => x.id === p.id);
      if (idx > -1) {
        fallbackPlans[idx] = p;
      } else {
        fallbackPlans.unshift(p);
      }
      saveSandboxData();
      return res.json({ success: true, plan: p });
    } catch (err: any) {
      console.error('Neon plans write error:', err.message);
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
  if (neonActive && pgPool) {
    try {
      await pgPool.query('DELETE FROM internet_plans WHERE id = $1', [id]);
      fallbackPlans = fallbackPlans.filter((p) => p.id !== id);
      saveSandboxData();
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Neon plans delete error:', err.message);
    }
  }
  fallbackPlans = fallbackPlans.filter((p) => p.id !== id);
  saveSandboxData();
  res.json({ success: true });
});

// PAYMENTS VERIFICATION REQUESTS ROUTINGS
app.get('/api/payments', async (req, res) => {
  if (neonActive && pgPool) {
    try {
      const result = await pgPool.query('SELECT * FROM payment_requests ORDER BY timestamp DESC');
      const payments = result.rows.map(row => ({
        id: row.id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        customerEmail: row.customer_email || undefined,
        planId: row.plan_id,
        planName: row.plan_name,
        planPrice: Number(row.plan_price),
        screenshotUrl: row.screenshot_url || undefined,
        reference: row.reference,
        status: row.status,
        timestamp: row.timestamp,
        whatsappDelivered: !!row.whatsapp_delivered
      }));
      return res.json(payments);
    } catch (err: any) {
      console.error('Neon payments read error:', err.message);
    }
  }
  res.json(fallbackPayments);
});

app.post('/api/payments', validate(paymentSchema), async (req, res) => {
  const p = req.body;
  if (neonActive && pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO payment_requests (
          id, customer_name, customer_phone, customer_email, plan_id, plan_name,
          plan_price, screenshot_url, reference, status, timestamp, whatsapp_delivered
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          customer_name = EXCLUDED.customer_name,
          customer_phone = EXCLUDED.customer_phone,
          customer_email = EXCLUDED.customer_email,
          plan_id = EXCLUDED.plan_id,
          plan_name = EXCLUDED.plan_name,
          plan_price = EXCLUDED.plan_price,
          screenshot_url = EXCLUDED.screenshot_url,
          reference = EXCLUDED.reference,
          status = EXCLUDED.status,
          timestamp = EXCLUDED.timestamp,
          whatsapp_delivered = EXCLUDED.whatsapp_delivered
      `, [
        p.id, p.customerName, p.customerPhone, p.customerEmail || null, p.planId, p.planName,
        Number(p.planPrice), p.screenshotUrl || null, p.reference, p.status || 'Awaiting Approval',
        p.timestamp || new Date().toISOString(), p.whatsappDelivered || false
      ]);
      fallbackPayments.unshift(p);
      saveSandboxData();
      return res.json({ success: true, payment: p });
    } catch (err: any) {
      console.error('Neon payments write error:', err.message);
    }
  }
  fallbackPayments.unshift(p);
  saveSandboxData();
  res.json({ success: true, payment: p });
});

// APPROVAL CORE FLOW: GENERATES ACTIVE VOUCHERS AND CUSTOMERS IN NEON CORES
app.post('/api/payments/approve', validate(approvePaymentSchema), async (req, res) => {
  const { id, spawnedVoucherCode, spawnedVoucherId } = req.body;
  if (neonActive && pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const payRes = await client.query('SELECT * FROM payment_requests WHERE id = $1', [id]);
      if (payRes.rows.length === 0) {
        throw new Error('Payment request not found');
      }
      const payReq = payRes.rows[0];
      await client.query('UPDATE payment_requests SET status = $1 WHERE id = $2', ['Approved', id]);
      
      const planRes = await client.query('SELECT * FROM internet_plans WHERE id = $1', [payReq.plan_id]);
      let speed = 8;
      let limitGb = 2.0;
      let hours = 24;
      if (planRes.rows.length > 0) {
        const p = planRes.rows[0];
        speed = Number(p.speed_limit_mbps ?? 8);
        limitGb = Number(p.data_limit_gb ?? 2.0);
        hours = Number(p.duration_hours ?? 24);
      }
      
      await client.query(`
        INSERT INTO active_vouchers (
          id, code, plan_id, plan_name, plan_price, status, date_created, duration_hours,
          data_limit_gb, remaining_data_gb, speed_limit_mbps, customer_name, customer_phone,
          customer_email, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        spawnedVoucherId, spawnedVoucherCode, payReq.plan_id, payReq.plan_name, Number(payReq.plan_price),
        'active', hours, limitGb, limitGb, speed, payReq.customer_name, payReq.customer_phone,
        payReq.customer_email || '', 'Auto added upon bank transfer review'
      ]);
      
      const custRes = await client.query('SELECT * FROM customers WHERE phone = $1', [payReq.customer_phone]);
      let custId = custRes.rows.length > 0 ? custRes.rows[0].id : 'cust_' + Math.floor(Math.random()*10000);
      let existingSpend = custRes.rows.length > 0 ? Number(custRes.rows[0].total_spend ?? 0) : 0;
      let existingCount = custRes.rows.length > 0 ? Number(custRes.rows[0].history_vouchers_count ?? 0) : 0;
      let joinedDate = custRes.rows.length > 0 ? custRes.rows[0].joined_date : new Date();
      
      await client.query(`
        INSERT INTO customers (
          id, name, phone, whatsapp, email, active_plan_id, active_plan_name, expiry_time,
          total_spend, history_vouchers_count, is_suspended, is_blacklisted, notes, joined_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, FALSE, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          active_plan_id = EXCLUDED.active_plan_id,
          active_plan_name = EXCLUDED.active_plan_name,
          expiry_time = EXCLUDED.expiry_time,
          total_spend = EXCLUDED.total_spend,
          history_vouchers_count = EXCLUDED.history_vouchers_count,
          notes = EXCLUDED.notes
      `, [
        custId, payReq.customer_name, payReq.customer_phone, payReq.customer_phone, payReq.customer_email || '',
        payReq.plan_id, payReq.plan_name, new Date(Date.now() + hours * 3600 * 1000).toISOString(),
        existingSpend + Number(payReq.plan_price), existingCount + 1, 'Auto added upon bank transfer review', joinedDate
      ]);
      
      await client.query('COMMIT');
      client.release();
      return res.json({ success: true });
    } catch (err: any) {
      await client.query('ROLLBACK');
      client.release();
      console.error('Neon payment approve error:', err.message);
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
  saveSandboxData();
  res.json({ success: true });
});

app.post('/api/payments/reject', validate(rejectPaymentSchema), async (req, res) => {
  const { id } = req.body;
  if (neonActive && pgPool) {
    try {
      await pgPool.query('UPDATE payment_requests SET status = $1 WHERE id = $2', ['Rejected', id]);
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Neon payment reject error:', err.message);
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
  if (neonActive && pgPool) {
    try {
      const result = await pgPool.query('SELECT * FROM active_vouchers ORDER BY date_created DESC');
      const vouchers = result.rows.map(row => ({
        id: row.id,
        code: row.code,
        planId: row.plan_id,
        planName: row.plan_name,
        planPrice: Number(row.plan_price),
        status: row.status,
        dateCreated: row.date_created,
        durationHours: Number(row.duration_hours),
        dataLimitGb: Number(row.data_limit_gb ?? 0),
        remainingDataGb: Number(row.remaining_data_gb ?? 0),
        speedLimitMbps: Number(row.speed_limit_mbps),
        customerName: row.customer_name || undefined,
        customerPhone: row.customer_phone || undefined,
        customerEmail: row.customer_email || undefined,
        isMultiDevice: !!row.is_multi_device,
        deviceLimit: Number(row.device_limit ?? 1),
        notes: row.notes || undefined
      }));
      return res.json(vouchers);
    } catch (err: any) {
      console.error('Neon vouchers read error:', err.message);
    }
  }
  res.json(fallbackVouchers);
});

app.post('/api/vouchers', validate(voucherSchema), async (req, res) => {
  const v = req.body;
  if (neonActive && pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO active_vouchers (
          id, code, plan_id, plan_name, plan_price, status, date_created, duration_hours,
          data_limit_gb, remaining_data_gb, speed_limit_mbps, customer_name, customer_phone,
          customer_email, is_multi_device, device_limit, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          plan_id = EXCLUDED.plan_id,
          plan_name = EXCLUDED.plan_name,
          plan_price = EXCLUDED.plan_price,
          status = EXCLUDED.status,
          date_created = EXCLUDED.date_created,
          duration_hours = EXCLUDED.duration_hours,
          data_limit_gb = EXCLUDED.data_limit_gb,
          remaining_data_gb = EXCLUDED.remaining_data_gb,
          speed_limit_mbps = EXCLUDED.speed_limit_mbps,
          customer_name = EXCLUDED.customer_name,
          customer_phone = EXCLUDED.customer_phone,
          customer_email = EXCLUDED.customer_email,
          is_multi_device = EXCLUDED.is_multi_device,
          device_limit = EXCLUDED.device_limit,
          notes = EXCLUDED.notes
      `, [
        v.id, v.code, v.planId, v.planName, Number(v.planPrice), v.status,
        v.dateCreated || new Date().toISOString(), Number(v.durationHours), Number(v.dataLimitGb ?? 0),
        Number(v.remainingDataGb ?? 0), Number(v.speedLimitMbps), v.customerName || null,
        v.customerPhone || null, v.customerEmail || null, v.isMultiDevice || false, v.deviceLimit || 1, v.notes || null
      ]);
      const idx = fallbackVouchers.findIndex(x => x.id === v.id);
      if (idx > -1) {
        fallbackVouchers[idx] = v;
      } else {
        fallbackVouchers.unshift(v);
      }
      saveSandboxData();
      return res.json({ success: true, voucher: v });
    } catch (err: any) {
      console.error('Neon vouchers write error:', err.message);
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
  if (neonActive && pgPool) {
    try {
      const result = await pgPool.query('SELECT * FROM customers ORDER BY joined_date DESC, id DESC');
      const customersList = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        whatsapp: row.whatsapp || '',
        activePlanId: row.active_plan_id || undefined,
        activePlanName: row.active_plan_name || undefined,
        expiryTime: row.expiry_time || undefined,
        totalSpend: Number(row.total_spend ?? 0),
        historyVouchersCount: Number(row.history_vouchers_count ?? 0),
        isSuspended: !!row.is_suspended,
        isBlacklisted: !!row.is_blacklisted,
        notes: row.notes ?? '',
        joinedDate: row.joined_date
      }));
      return res.json(customersList);
    } catch (err: any) {
      console.error('Neon customers read error:', err.message);
    }
  }
  res.json(fallbackCustomers);
});

app.post('/api/customers', validate(customerSchema), async (req, res) => {
  const c = req.body;
  if (neonActive && pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO customers (
          id, name, phone, whatsapp, active_plan_id, active_plan_name, expiry_time,
          total_spend, history_vouchers_count, is_suspended, is_blacklisted, notes, joined_date
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
          notes = EXCLUDED.notes,
          joined_date = EXCLUDED.joined_date
      `, [
        c.id, c.name, c.phone, c.whatsapp || '', c.activePlanId || '', c.activePlanName || '',
        c.expiryTime || '', Number(c.totalSpend ?? 0), Number(c.historyVouchersCount ?? 0),
        !!c.isSuspended, !!c.isBlacklisted, c.notes || '', c.joinedDate || new Date().toISOString()
      ]);
      const idx = fallbackCustomers.findIndex(x => x.id === c.id);
      if (idx > -1) {
        fallbackCustomers[idx] = c;
      } else {
        fallbackCustomers.unshift(c);
      }
      saveSandboxData();
      return res.json({ success: true, customer: c });
    } catch (err: any) {
      console.error('Neon customers write error:', err.message);
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
  if (neonActive && pgPool) {
    try {
      const result = await pgPool.query('SELECT * FROM active_sessions');
      const sessions = result.rows.map(row => ({
        id: row.id,
        customerName: row.customer_name,
        ipAddress: row.ip_address,
        macAddress: row.mac_address,
        deviceType: row.device_type,
        dataUsedGb: Number(row.data_used_gb ?? 0),
        uploadSpeedMbps: Number(row.upload_speed_mbps ?? 0),
        downloadSpeedMbps: Number(row.download_speed_mbps ?? 0),
        connectedDuration: row.connected_duration,
        voucherCode: row.voucher_code
      }));
      return res.json(sessions);
    } catch (err: any) {
      console.error('Neon sessions read error:', err.message);
    }
  }
  res.json(fallbackSessions);
});

app.post('/api/sessions/disconnect', async (req, res) => {
  const { id } = req.body;
  if (neonActive && pgPool) {
    try {
      await pgPool.query('DELETE FROM active_sessions WHERE id = $1', [id]);
      fallbackSessions = fallbackSessions.filter((s) => s.id !== id);
      saveSandboxData();
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Neon sessions delete error:', err.message);
    }
  }
  fallbackSessions = fallbackSessions.filter((s) => s.id !== id);
  saveSandboxData();
  res.json({ success: true });
});

// WHATSAPP OUTGOING MESSAGE LOGS
app.get('/api/message-logs', async (req, res) => {
  if (neonActive && pgPool) {
    try {
      const result = await pgPool.query('SELECT * FROM whatsapp_message_logs ORDER BY timestamp DESC');
      const logs = result.rows.map(row => ({
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
      return res.json(logs);
    } catch (err: any) {
      console.error('Neon logs read error:', err.message);
    }
  }
  res.json(fallbackMessageLogs);
});

app.post('/api/message-logs', validate(messageLogSchema), async (req, res) => {
  const m = req.body;
  if (neonActive && pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO whatsapp_message_logs (
          id, recipient_name, recipient_phone, message_type, content, status, timestamp, plan_name, voucher_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          recipient_name = EXCLUDED.recipient_name,
          recipient_phone = EXCLUDED.recipient_phone,
          message_type = EXCLUDED.message_type,
          content = EXCLUDED.content,
          status = EXCLUDED.status,
          timestamp = EXCLUDED.timestamp,
          plan_name = EXCLUDED.plan_name,
          voucher_code = EXCLUDED.voucher_code
      `, [
        m.id, m.recipientName, m.recipientPhone, m.messageType, m.content, m.status || 'Delivered',
        m.timestamp || new Date().toISOString(), m.planName || null, m.voucherCode || null
      ]);
      fallbackMessageLogs.unshift(m);
      saveSandboxData();
      return res.json({ success: true, log: m });
    } catch (err: any) {
      console.error('Neon logs write error:', err.message);
    }
  }
  fallbackMessageLogs.unshift(m);
  saveSandboxData();
  res.json({ success: true, log: m });
});

// OPERATOR CONFIGS (ANNOUNCEMENTS AND SAAS LEVEL TIERS)
app.get('/api/operator', async (req, res) => {
  if (neonActive && pgPool) {
    try {
      const result = await pgPool.query('SELECT * FROM system_config');
      let announcement = fallbackAnnouncement;
      let saasTier = fallbackSaaSTier;
      result.rows.forEach(row => {
        if (row.key === 'saas_announcement') announcement = row.value;
        if (row.key === 'saas_tier') saasTier = row.value;
      });
      return res.json({ announcement, saasTier });
    } catch (err: any) {
      console.error('Neon operator config read error:', err.message);
    }
  }
  res.json({ announcement: fallbackAnnouncement, saasTier: fallbackSaaSTier });
});

app.post('/api/operator/announcement', validate(announcementSchema), async (req, res) => {
  const { announcement } = req.body;
  if (neonActive && pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO system_config (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `, ['saas_announcement', announcement]);
      fallbackAnnouncement = announcement;
      saveSandboxData();
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Neon announcement config write error:', err.message);
    }
  }
  fallbackAnnouncement = announcement;
  saveSandboxData();
  res.json({ success: true });
});

app.post('/api/operator/saas-tier', validate(saasTierSchema), async (req, res) => {
  const { saasTier } = req.body;
  if (neonActive && pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO system_config (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `, ['saas_tier', saasTier]);
      fallbackSaaSTier = saasTier;
      saveSandboxData();
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Neon saas-tier config write error:', err.message);
    }
  }
  fallbackSaaSTier = saasTier;
  saveSandboxData();
  res.json({ success: true });
});

// Serve static frontend files — MUST be registered after all /api/* routes above,
// so API requests are matched first and this catch-all doesn't swallow them.
const distClientPath = path.join(process.cwd(), 'dist');
app.use(express.static(distClientPath, { maxAge: '1d' }));
app.get('*', (req, res) => {
  const indexPath = path.join(distClientPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built. Run npm run build.');
  }
});

// Export the Express app for Vercel serverless runtime
export { app };
export default app;

// Vite dev middleware + standalone server (local dev only — not used on Vercel)
async function serveApp() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Full-stack node running on port ${PORT}`);
  });
}

// Only start the standalone HTTP server when running directly (not imported by Vercel)
if (process.env.VERCEL !== '1') {
  serveApp();
}

