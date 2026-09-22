export interface AdminUserRow {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: 'customer' | 'admin';
  status: 'active' | 'suspended' | 'blocked';
  isVerified: boolean;
  createdAt: string;
  toletStatus?: string | null;
  tutorStatus?: string | null;
  donorStatus?: string | null;
}

export type AdminReportType = 'listing' | 'staff' | 'tutor' | 'donor';

export interface AdminReportRow {
  id: string;
  type: AdminReportType;
  status: string;
  title?: string;
  reason: string;
  createdAt: string;
  relatedId?: string;
}

export type AdminReportStatus = 'open' | 'reviewed' | 'resolved' | 'dismissed';

export interface AdminDashboardStats {
  users: number;
  pendingVerifications: number;
  publishedTutors: number;
  publishedDonors: number;
  activeStaff: number;
  openRequests: number;
  bloodPending: number;
  openReports: number;
  unreadAdminNotifs: number;
}

export interface PlatformSettings {
  toletFeeRules: {
    messSeatFee: number;
    tier1Max10k: number;
    tier2Max20k: number;
    tier3Above20k: number;
  };
  serviceAvailability: Record<string, boolean>;
  notificationSettings: {
    notifyOnRequestSubmitted: boolean;
    notifyOnStatusChange: boolean;
    notifyAdminOnNewRequest: boolean;
    notifyCustomerOnStatusChange: boolean;
  };
}