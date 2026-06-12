/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HotspotPlan {
  id: string;
  name: string;
  price: number; // in local currency
  dataLimitGb: number; // absolute limit or 0 for unlimited
  durationHours: number; // e.g. 24, 168 (1 week), 720 (30 days)
  speedLimitMbps: number; // e.g. 2, 5, 10
  deviceLimit: number; // 1 to unlimited
  validityPeriodDays: number;
  autoExpiry: boolean;
  description: string;
  isActive: boolean;
  isPopular?: boolean;
}

export type VoucherStatus = 'pending_payment' | 'active' | 'used' | 'expired' | 'suspended';

export interface Voucher {
  id: string;
  code: string;
  planId: string;
  planName: string;
  planPrice: number;
  status: VoucherStatus;
  dateCreated: string;
  dateUsed?: string;
  dateExpired?: string;
  durationHours: number;
  dataLimitGb: number;
  remainingDataGb: number;
  speedLimitMbps: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentScreenshot?: string;
  paymentReference?: string;
  isMultiDevice: boolean;
  deviceLimit: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  activePlanId?: string;
  activePlanName?: string;
  expiryTime?: string;
  totalSpend: number;
  historyVouchersCount: number;
  isSuspended: boolean;
  isBlacklisted: boolean;
  notes: string;
  joinedDate: string;
}

export interface ActiveSession {
  id: string;
  customerName: string;
  ipAddress: string;
  macAddress: string;
  deviceType: string; // e.g. "iPhone 15", "Samsung S23", "Infinix Hot 30", "Windows PC"
  dataUsedGb: number;
  uploadSpeedMbps: number;
  downloadSpeedMbps: number;
  connectedDuration: string; // e.g., "02h 45m"
  voucherCode: string;
}

export interface HotspotBusiness {
  id: string;
  businessName: string;
  logoEmoji: string;
  logoBgColor: string;
  phone: string;
  whatsapp: string;
  location: string;
  currency: 'NGN' | 'USD' | 'KES' | 'GHS' | 'ZAR';
  timezone: string;
  routerType: 'Starlink' | 'MikroTik' | 'TP-Link' | 'Huawei 4G/5G' | 'Other';
  mikrotikIntegrationPlaceholder: boolean;
  coverageArea: string; // e.g. "Hostel A & B", "Main Market street"
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  paymentInstructions: string;
  whatsappProvider: 'Meta Cloud API' | 'Twilio' | 'Termii' | 'UltraMsg';
  whatsappApiKey: string;
}

export interface SaaSPlan {
  id: 'starter' | 'growth' | 'business';
  name: string;
  priceNaira: number;
  hotspotsLimit: number;
  customersLimit: number;
  vouchersLimit: number;
  whatsappCredits: number;
  maxStaff: number;
  features: string[];
}

export interface TenantHotspotBusiness {
  id: string;
  businessName: string;
  ownerEmail: string;
  ownerName: string;
  joinedDate: string;
  planId: 'starter' | 'growth' | 'business';
  status: 'active' | 'suspended';
  totalVouchersSold: number;
  totalRevenueNaira: number;
}

export interface PaymentRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  planId: string;
  planName: string;
  planPrice: number;
  screenshotUrl?: string;
  reference: string;
  status: 'Requested' | 'Awaiting Approval' | 'Approved' | 'Rejected';
  timestamp: string;
  whatsappDelivered: boolean;
}

export interface WhatsAppMessageLog {
  id: string;
  recipientName: string;
  recipientPhone: string;
  messageType: 'voucher' | 'reminder' | 'payment_received' | 'announcement';
  content: string;
  status: 'Delivered' | 'Failed';
  timestamp: string;
  planName?: string;
  voucherCode?: string;
}
