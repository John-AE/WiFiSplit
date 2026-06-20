/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HotspotPlan, Voucher, Customer, ActiveSession, HotspotBusiness, SaaSPlan, TenantHotspotBusiness, PaymentRequest, WhatsAppMessageLog } from './types';

export const SaaSPlans: SaaSPlan[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    priceNaira: 15000,
    hotspotsLimit: 1,
    customersLimit: 30,
    vouchersLimit: 300,
    whatsappCredits: 500,
    maxStaff: 1,
    features: [
      '1 Hotspot Owner Business',
      'Up to 30 Active Customers',
      'Up to 300 Vouchers/mo',
      '500 WhatsApp Message Alerts',
      'Starlink & standard router setup wizard',
      'Manual Payment Verification Flow',
      'WhatsApp/SMS Delivery Templates',
      'Download Printable Vouchers (PDF/CSV)',
      'Basic Sales Reports'
    ]
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    priceNaira: 35000,
    hotspotsLimit: 3,
    customersLimit: 100,
    vouchersLimit: 1000,
    whatsappCredits: 3000,
    maxStaff: 3,
    features: [
      'Up to 3 Hotspot Owner Locations',
      'Up to 100 Active Customers',
      'Up to 1,000 Vouchers/mo',
      '3,000 WhatsApp Message Alerts',
      'Custom Router Integration Hook',
      'WhatsApp Automatic Reminders',
      'Comprehensive Sales & Growth Charts',
      'Bulk Slip Printing & custom branding',
      'Staff Role Management (Up to 3 staff)',
    ]
  },
  {
    id: 'business',
    name: 'Business Pro',
    priceNaira: 75000,
    hotspotsLimit: 5,
    customersLimit: 200,
    vouchersLimit: 20000,
    whatsappCredits: 10000,
    maxStaff: 10,
    features: [
      'Up to 5 Hotspot Locations',
      'Up to 200 Active Customers',
      'Up to 20,000 Vouchers/mo',
      '10,000 WhatsApp Message Alerts',
      'API Access for Automated Gateway',
      'Custom Bank Transfer Instructions',
      'MikroTik Direct Sync Bridge (Future-ready)',
      'Advanced Excel/PDF Financial Export',
      'Priority 24/7 Premium Support',
      'Up to 10 Sub-Staff Profiles',
    ]
  }
];

export const DefaultBusiness: HotspotBusiness = {
  id: 'biz_1',
  businessName: 'Starlink Elite Wi-Fi',
  logoEmoji: '⚡',
  logoBgColor: '#059669', // emerald-600
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
  whatsappApiKey: '',
  emailAlertsEnabled: true,
  adminAlertEmail: 'johnnybgsu@gmail.com'
};

export const DefaultPlans: HotspotPlan[] = [
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

export const DefaultCustomers: Customer[] = [
  {
    id: 'c_john_b',
    name: 'John B',
    email: 'johnamaka2@gmail.com',
    phone: '+234 812 700 9000',
    whatsapp: '+234 812 700 9000',
    activePlanId: 'plan_7d_11gb',
    activePlanName: '₦2,500 Weekly Premium',
    expiryTime: '2026-06-19T13:00:00Z',
    totalSpend: 5000,
    historyVouchersCount: 2,
    isSuspended: false,
    isBlacklisted: false,
    notes: 'Premium customer testing the portal.',
    joinedDate: '2026-06-10'
  },
  {
    id: 'c_1',
    name: 'Chinedu Okafor',
    phone: '+234 803 111 2222',
    whatsapp: '+234 803 111 2222',
    activePlanId: 'p_3',
    activePlanName: '₦2,000 Weekly Lite',
    expiryTime: '2026-06-18T14:30:00Z',
    totalSpend: 12500,
    historyVouchersCount: 6,
    isSuspended: false,
    isBlacklisted: false,
    notes: 'Yaba hostel block A room 12. Friendly regular customer, pays promptly.',
    joinedDate: '2026-01-15'
  },
  {
    id: 'c_2',
    name: 'Amina Bello',
    phone: '+234 809 333 4444',
    whatsapp: '+234 809 333 4444',
    activePlanId: 'p_1',
    activePlanName: '₦500 Daily Plan',
    expiryTime: '2026-06-13T09:15:00Z',
    totalSpend: 3500,
    historyVouchersCount: 7,
    isSuspended: false,
    isBlacklisted: false,
    notes: 'Yaba Main Street Cyber enthusiast.',
    joinedDate: '2026-02-10'
  },
  {
    id: 'c_3',
    name: 'Babajide Alao',
    phone: '+234 812 555 6666',
    whatsapp: '+234 812 555 6666',
    activePlanId: 'p_4',
    activePlanName: '₦7,500 Unlimited Monthly',
    expiryTime: '2026-07-10T18:00:00Z',
    totalSpend: 45000,
    historyVouchersCount: 6,
    isSuspended: false,
    isBlacklisted: false,
    notes: 'Local mini-cybercafe owner who resells access to co-working desks.',
    joinedDate: '2025-11-01'
  },
  {
    id: 'c_4',
    name: 'Chioma Nnaji',
    phone: '+234 905 777 8888',
    whatsapp: '+234 905 777 8888',
    activePlanId: undefined,
    activePlanName: undefined,
    expiryTime: undefined,
    totalSpend: 1500,
    historyVouchersCount: 3,
    isSuspended: false,
    isBlacklisted: false,
    notes: 'Often uses daily passes for group discussion sessions on university compound.',
    joinedDate: '2026-04-20'
  },
  {
    id: 'c_5',
    name: 'Emeka Obi',
    phone: '+234 701 999 0000',
    whatsapp: '+234 701 999 0000',
    activePlanId: undefined,
    activePlanName: undefined,
    expiryTime: undefined,
    totalSpend: 800,
    historyVouchersCount: 4,
    isSuspended: true,
    isBlacklisted: false,
    notes: 'Suspended for excessive torrenting on starter trials. Kept ignoring fair use warnings.',
    joinedDate: '2026-03-05'
  }
];

export const DefaultVouchers: Voucher[] = [
  {
    id: 'v_john_b',
    code: 'HN77-JB20-PASS',
    planId: 'plan_7d_11gb',
    planName: '₦2,500 Weekly Premium',
    planPrice: 2500,
    status: 'active',
    dateCreated: '2026-06-12T13:00:00Z',
    dateUsed: '2026-06-12T13:05:00Z',
    dateExpired: '2026-06-19T13:00:00Z',
    durationHours: 168,
    dataLimitGb: 11,
    remainingDataGb: 10.2,
    speedLimitMbps: 12,
    customerName: 'John B',
    customerPhone: '+234 812 700 9000',
    customerEmail: 'johnamaka2@gmail.com',
    paymentReference: 'REF-BANK-JB-99201',
    isMultiDevice: true,
    deviceLimit: 2
  },
  {
    id: 'v_1',
    code: 'PL8Q-CD44-AB12',
    planId: 'plan_30d_60gb',
    planName: '₦7,500 Monthly Value',
    planPrice: 7500,
    status: 'active',
    dateCreated: '2026-06-11T14:30:00Z',
    dateUsed: '2026-06-11T14:35:00Z',
    dateExpired: '2026-07-11T14:30:00Z',
    durationHours: 720,
    dataLimitGb: 60,
    remainingDataGb: 48.4,
    speedLimitMbps: 15,
    customerName: 'Chinedu Okafor',
    customerPhone: '+234 803 111 2222',
    paymentReference: 'MP-TRSF-890251-X',
    isMultiDevice: true,
    deviceLimit: 3
  },
  {
    id: 'v_2',
    code: 'XQ72-MP41-LK9A',
    planId: 'plan_7d_11gb',
    planName: '₦2,500 Weekly Premium',
    planPrice: 2500,
    status: 'active',
    dateCreated: '2026-06-12T09:15:00Z',
    dateUsed: '2026-06-12T09:16:00Z',
    dateExpired: '2026-06-19T09:15:00Z',
    durationHours: 168,
    dataLimitGb: 11,
    remainingDataGb: 7.6,
    speedLimitMbps: 12,
    customerName: 'Amina Bello',
    customerPhone: '+234 809 333 4444',
    paymentReference: 'BANK-TRSF-550291-B',
    isMultiDevice: true,
    deviceLimit: 2
  },
  {
    id: 'v_3',
    code: 'PL8Q-LK9A-MK88',
    planId: 'plan_1d_1gb',
    planName: '₦100 Super Saver',
    planPrice: 100,
    status: 'expired',
    dateCreated: '2026-06-10T18:00:00Z',
    dateUsed: '2026-06-10T18:05:00Z',
    dateExpired: '2026-06-11T18:00:00Z',
    durationHours: 24,
    dataLimitGb: 1,
    remainingDataGb: 0.0,
    speedLimitMbps: 5,
    customerName: 'Babajide Alao',
    customerPhone: '+234 812 555 6666',
    paymentReference: 'OPAY-99210-91A',
    isMultiDevice: false,
    deviceLimit: 1
  },
  {
    id: 'v_4',
    code: 'ZZ99-KK11-MM44',
    planId: 'plan_1d_500mb',
    planName: '₦200 Daily Lite',
    planPrice: 200,
    status: 'expired',
    dateCreated: '2026-06-05T10:00:00Z',
    dateUsed: '2026-06-05T10:02:00Z',
    dateExpired: '2026-06-06T10:00:00Z',
    durationHours: 24,
    dataLimitGb: 0.5,
    remainingDataGb: 0.0,
    speedLimitMbps: 5,
    customerName: 'Chioma Nnaji',
    customerPhone: '+234 905 777 8888',
    paymentReference: 'MP-TRSF-50125-J',
    isMultiDevice: false,
    deviceLimit: 1
  },
  {
    id: 'v_5',
    code: 'BB77-YY11-PP99',
    planId: 'plan_1d_1gb',
    planName: '₦100 Super Saver',
    planPrice: 100,
    status: 'used',
    dateCreated: '2026-06-11T08:00:00Z',
    dateUsed: '2026-06-11T08:02:00Z',
    dateExpired: '2026-06-12T08:00:00Z',
    durationHours: 24,
    dataLimitGb: 1,
    remainingDataGb: 0.0,
    speedLimitMbps: 5,
    customerName: 'Amina Bello',
    customerPhone: '+234 809 333 4444',
    paymentReference: 'TRSF-7782A',
    isMultiDevice: false,
    deviceLimit: 1
  },
  {
    id: 'v_6',
    code: 'MN56-RT89-PO23',
    planId: 'plan_1d_500mb',
    planName: '₦200 Daily Lite',
    planPrice: 200,
    status: 'expired',
    dateCreated: '2026-06-11T01:00:00Z',
    durationHours: 24,
    dataLimitGb: 0.5,
    remainingDataGb: 0.0,
    speedLimitMbps: 5,
    isMultiDevice: false,
    deviceLimit: 1
  },
  {
    id: 'v_7',
    code: 'HG99-SA12-WQ88',
    planId: 'plan_1d_1gb',
    planName: '₦100 Super Saver',
    planPrice: 100,
    status: 'expired',
    dateCreated: '2026-06-11T02:00:00Z',
    durationHours: 24,
    dataLimitGb: 1,
    remainingDataGb: 0.0,
    speedLimitMbps: 5,
    isMultiDevice: false,
    deviceLimit: 1
  }
];

export const DefaultSessions: ActiveSession[] = [
  {
    id: 'sess_1',
    customerName: 'Chinedu Okafor',
    ipAddress: '192.168.88.24',
    macAddress: '00:1A:2B:3C:4D:5E',
    deviceType: 'Infinix Hot 30i',
    dataUsedGb: 3.6,
    uploadSpeedMbps: 0.8,
    downloadSpeedMbps: 4.2,
    connectedDuration: '04h 22m',
    voucherCode: 'PL8Q-CD44-AB12'
  },
  {
    id: 'sess_2',
    customerName: 'Amina Bello',
    ipAddress: '192.168.88.42',
    macAddress: '74:DC:B8:31:0A:F4',
    deviceType: 'iPhone 13 Pro',
    dataUsedGb: 0.15,
    uploadSpeedMbps: 1.2,
    downloadSpeedMbps: 7.1,
    connectedDuration: '00h 18m',
    voucherCode: 'XQ72-MP41-LK9A'
  },
  {
    id: 'sess_3',
    customerName: 'Babajide Alao',
    ipAddress: '192.168.88.10',
    macAddress: '3C:F8:62:DA:DE:22',
    deviceType: 'HP ProBook Windows 11',
    dataUsedGb: 11.8,
    uploadSpeedMbps: 2.1,
    downloadSpeedMbps: 12.8,
    connectedDuration: '10h 05m',
    voucherCode: 'PL8Q-LK9A-MK88'
  },
  {
    id: 'sess_4',
    customerName: 'Babajide Alao (Staff Laptop)',
    ipAddress: '192.168.88.11',
    macAddress: 'BC:83:85:92:EF:01',
    deviceType: 'Tecno Spark 10',
    dataUsedGb: 2.4,
    uploadSpeedMbps: 0.4,
    downloadSpeedMbps: 3.9,
    connectedDuration: '02h 11m',
    voucherCode: 'PL8Q-LK9A-MK88'
  }
];

export const DefaultPaymentRequests: PaymentRequest[] = [
  {
    id: 'req_1',
    customerName: 'Kelechi Amadi',
    customerPhone: '+234 812 700 8000',
    planId: 'p_1',
    planName: '₦500 Daily Plan',
    planPrice: 500,
    screenshotUrl: 'https://images.unsplash.com/photo-1616077168079-7e09a677fb2c?q=80&w=600&auto=format&fit=crop',
    reference: 'REF-OPAY-44109281',
    status: 'Awaiting Approval',
    timestamp: '2026-06-12T04:10:00Z',
    whatsappDelivered: false
  },
  {
    id: 'req_2',
    customerName: 'Fatima Yusuf',
    customerPhone: '+234 902 400 3000',
    planId: 'p_3',
    planName: '₦2,000 Weekly Lite',
    planPrice: 2000,
    screenshotUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop',
    reference: 'REF-GTB-882012903',
    status: 'Awaiting Approval',
    timestamp: '2026-06-12T04:25:00Z',
    whatsappDelivered: false
  },
  {
    id: 'req_3',
    customerName: 'Tunde Bakare',
    customerPhone: '+234 810 500 6000',
    planId: 'p_4',
    planName: '₦7,500 Unlimited Monthly',
    planPrice: 7500,
    screenshotUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=600&auto=format&fit=crop',
    reference: 'REF-ACCESS-00392019',
    status: 'Requested',
    timestamp: '2026-06-11T21:40:00Z',
    whatsappDelivered: false
  }
];

export const DefaultSuperTenants: TenantHotspotBusiness[] = [
  {
    id: 't_1',
    businessName: 'Starlink Elite Wi-Fi',
    ownerName: 'Johnny BGSU',
    ownerEmail: 'johnnybgsu@gmail.com',
    joinedDate: '2026-01-10',
    planId: 'growth',
    status: 'active',
    totalVouchersSold: 1420,
    totalRevenueNaira: 1250000
  },
  {
    id: 't_2',
    businessName: 'Nasarawa Hostels Starlink',
    ownerName: 'Alhaji Ibrahim Musa',
    ownerEmail: 'ibrahim@nasarawahotspots.ng',
    joinedDate: '2026-02-15',
    planId: 'starter',
    status: 'active',
    totalVouchersSold: 320,
    totalRevenueNaira: 240000
  },
  {
    id: 't_3',
    businessName: 'Campus Express Wi-Fi (UniBen)',
    ownerName: 'Osas Efe',
    ownerEmail: 'osas.wireless@uniben.edu.ng',
    joinedDate: '2026-03-01',
    planId: 'business',
    status: 'active',
    totalVouchersSold: 3950,
    totalRevenueNaira: 4200000
  },
  {
    id: 't_4',
    businessName: 'Yaba Tech QuickNet',
    ownerName: 'Segun Alabi',
    ownerEmail: 'segun@yabatechquick.net',
    joinedDate: '2025-12-12',
    planId: 'growth',
    status: 'suspended',
    totalVouchersSold: 110,
    totalRevenueNaira: 85000
  },
  {
    id: 't_5',
    businessName: 'Kano Cyber Connect',
    ownerName: 'Umar Abdullahi',
    ownerEmail: 'umar@cyberconnect.com.ng',
    joinedDate: '2026-04-05',
    planId: 'starter',
    status: 'active',
    totalVouchersSold: 140,
    totalRevenueNaira: 89000
  }
];

export const DefaultMessageLogs: WhatsAppMessageLog[] = [
  {
    id: 'msg_1',
    recipientName: 'Chinedu Okafor',
    recipientPhone: '+234 803 111 2222',
    messageType: 'voucher',
    content: `Hello Chinedu Okafor\n\nYour Wi-Fi voucher is ready.\n\nPlan: ₦2,000 Weekly Lite\nVoucher Code: PL8Q-CD44-AB12\nData Limit: 25 GB\nExpiry: 7 days\n\nThank you for choosing Starlink Elite Wi-Fi!`,
    status: 'Delivered',
    timestamp: '2026-06-11T14:35:00Z',
    planName: '₦2,000 Weekly Lite',
    voucherCode: 'PL8Q-CD44-AB12'
  },
  {
    id: 'msg_2',
    recipientName: 'Amina Bello',
    recipientPhone: '+234 809 333 4444',
    messageType: 'voucher',
    content: `Hello Amina Bello\n\nYour Wi-Fi voucher is ready.\n\nPlan: ₦500 Daily Plan\nVoucher Code: XQ72-MP41-LK9A\nData Limit: 5 GB\nExpiry: 24 hours\n\nThank you for choosing Starlink Elite Wi-Fi!`,
    status: 'Delivered',
    timestamp: '2026-06-12T09:16:00Z',
    planName: '₦500 Daily Plan',
    voucherCode: 'XQ72-MP41-LK9A'
  },
  {
    id: 'msg_3',
    recipientName: 'Emeka Obi',
    recipientPhone: '+234 701 999 0000',
    messageType: 'announcement',
    content: `Hello Emeka Obi, this is to inform you that your account has been suspended due to violations of torrent/download usage guidelines on the student starter trial. Please contact management to restore.`,
    status: 'Delivered',
    timestamp: '2026-06-11T18:00:00Z'
  }
];

// LocalStorage helpers
export const loadLocalData = <T>(key: string, defaults: T): T => {
  try {
    const saved = localStorage.getItem(`hotspot_${key}`);
    return saved ? JSON.parse(saved) : defaults;
  } catch (e) {
    return defaults;
  }
};

export const saveLocalData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(`hotspot_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
};
