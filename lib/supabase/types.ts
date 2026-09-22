export type UserRole = 'customer' | 'admin';

export type UserAccountStatus = 'active' | 'suspended' | 'blocked';

export type ServiceProfileStatus = 'draft' | 'pending_approval' | 'approved' | 'paused' | 'suspended';

export type TutorProfileStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'paused' | 'suspended';
export type TutorTeachingMode = 'home' | 'online' | 'both';
export type TutorAvailability = 'available' | 'limited' | 'busy';

export type BloodDonorStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'paused' | 'suspended';
export type BloodRequestStatus =
  | 'pending_review'
  | 'approved'
  | 'donor_contacted'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  primaryAreaId: string;
  role: UserRole;
  status: UserAccountStatus;
  isVerified: boolean;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToletProfile {
  id: string;
  userId: string;
  status: ServiceProfileStatus;
  ownerName: string;
  phone: string;
  emergencyPhone?: string;
  primaryAreaId: string;
  addressLine: string;
  nidNumber?: string;
  nidDocUrl?: string;
  holdingNumber?: string;
  totalListingsCount: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HomeTutorProfile {
  id: string;
  userId: string;
  status: TutorProfileStatus;
  fullName: string;
  gender: 'male' | 'female';
  institution: string;
  department: string;
  qualification: string;
  experienceYears: number;
  preferredAreas: string[]; // MCC Area IDs
  preferredClasses: string[];
  preferredSubjects: string[];
  expectedSalaryMin: number;
  expectedSalaryMax: number;
  daysPerWeek: number;
  bio?: string;
  studentIdCardUrl?: string;
  nidNumber?: string;
  isVerified: boolean;
  // Private contact - NEVER exposed on public directory
  privatePhone: string;
  // Teaching mode: বাসায় / Online / দুটোই (added in tutor milestone)
  teachingMode: TutorTeachingMode;
  // Availability: available / limited / busy
  availability: TutorAvailability;
  profilePhotoUrl?: string;
  adminNotes?: string;
  rejectionReason?: string;
  publishedAt?: string;
  ratingAvg?: number;
  ratingCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TutorReview {
  id: string;
  tutorId: string;
  customerId: string;
  requestId: string;
  rating: number;
  comment?: string;
  isPublished: boolean;
  createdAt: string;
  customerName?: string;
}

export type TutorReportStatus = 'open' | 'resolved' | 'dismissed';

export interface TutorReport {
  id: string;
  tutorId: string;
  reporterId?: string;
  reporterName: string;
  reason: string;
  details?: string;
  status: TutorReportStatus;
  createdAt: string;
  tutorName?: string;
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface BloodDonorProfile {
  id: string;
  userId: string;
  status: BloodDonorStatus;
  fullName: string;
  bloodGroup: BloodGroup;
  areaId: string; // MCC Area ID
  gender: 'male' | 'female';
  birthYear?: number;
  weightKg?: number;
  isAvailable: boolean;
  lastDonationDate?: string;
  donationCount: number;
  // Private phone - strictly protected by admin verification
  privatePhone: string;
  isVerified: boolean;
  intro?: string;
  profilePhotoUrl?: string;
  adminNotes?: string;
  rejectionReason?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BloodRequest {
  id: string;
  customerId: string;
  donorProfileId?: string;
  donorName?: string;
  donorBloodGroup?: BloodGroup;
  status: BloodRequestStatus;
  patientName: string;
  phone: string;
  bloodGroup: BloodGroup;
  units: number;
  hospitalName: string;
  hospitalAreaId?: string;
  hospitalLocation: string;
  requiredDateTime?: string;
  areaId: string;
  patientInfo?: string;
  /** Private 'documents' storage path — admin-only viewing. Never public. */
  prescriptionUrl: string;
  adminNotes?: string;
  rejectionReason?: string;
  /** Set when Admin released the donor contact to this requester. */
  contactedDonorName?: string;
  contactReleasedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BloodContactRelease {
  id: string;
  requestId: string;
  donorProfileId: string;
  releasedBy: string;
  releasedToCustomer: string;
  /** The donor phone (plaintext) is handed to the requester only in-memory/on-screen. */
  contactPhone?: string;
  createdAt: string;
}

export type BloodDonorReportStatus = 'open' | 'resolved' | 'dismissed';

export interface BloodDonorReport {
  id: string;
  donorProfileId: string;
  reporterId?: string;
  reporterName: string;
  reason: string;
  details?: string;
  status: BloodDonorReportStatus;
  createdAt: string;
  donorName?: string;
}

export type ServiceRequestStatus =
  | 'new'
  | 'reviewing'
  | 'contacted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'submitted'
  | 'assigned';

export interface ServiceRequestItem {
  id: string;
  customerId: string;
  serviceSlug: string;
  serviceTitleBn: string;
  status: ServiceRequestStatus;
  areaId: string;
  addressLine: string;
  contactName: string;
  contactPhone: string;
  preferredDate?: string;
  details?: string;
  /** Selected admin-managed staff profile (kajer-bua / electrician / plumber). */
  profileId?: string;
  profileTitleBn?: string;
  /** Work / problem type id for staff services. */
  serviceType?: string;
  preferredTime?: string;
  attachmentUrl?: string;
  adminNotes?: string;
  updatedAt?: string;
  createdAt: string;
  // --- Home Moving (বাসা পাল্টানো) private request fields ---
  pickupAreaId?: string;
  destinationAreaId?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  pickupFloor?: string;
  destinationFloor?: string;
  hasLift?: boolean;
  parkingInfo?: string;
  movingItems?: { id: string; labelBn: string; quantity?: number }[];
  photoUrls?: string[];
  /** Future quotation support: Admin records the agreed price manually. */
  quotation?: string;
}

export interface SavedListingItem {
  id: string;
  userId: string;
  itemType: 'tolet' | 'tutor' | 'service';
  title: string;
  areaName: string;
  priceOrRate?: string;
  linkHref: string;
  savedAt: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  /** 'admin' notifications are shown in every admin's hub inbox. */
  targetRole: 'customer' | 'admin';
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  relatedType?: string;
  relatedId?: string;
  isRead: boolean;
  linkHref?: string;
  createdAt: string;
}

// Staff (admin-managed services)
export interface StaffProfile {
  id: string;
  serviceSlug: 'kajer-bua' | 'electrician' | 'plumber';
  nameBn: string;
  titleBn: string;
  imageUrl?: string;
  areas: string[];
  workTypes: string[];
  workMode?: string;
  timeSlot?: string;
  experienceYears: number;
  availability: 'available' | 'limited' | 'busy';
  isEmergency: boolean;
  salaryMin?: number;
  salaryMax?: number;
  rateLabel?: string;
  aboutBn: string;
  phonePrivate: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffReport {
  id: string;
  staffProfileId: string;
  reporterId?: string;
  reporterName: string;
  reason: string;
  details?: string;
  status: StaffReportStatus;
  createdAt: string;
  staffName?: string;
}

export type StaffReportStatus = 'open' | 'resolved' | 'dismissed';

// To-Let listing reports
export interface ListingReport {
  id: string;
  listingId: string;
  reporterId?: string;
  reporterName: string;
  reason: string;
  details?: string;
  status: ListingReportStatus;
  title?: string;
  createdAt: string;
}

export type ListingReportStatus = 'open' | 'reviewed' | 'resolved' | 'dismissed';

// Tutor reports (already exists but ensure complete)
export interface TutorReport {
  id: string;
  tutorId: string;
  reporterId?: string;
  reporterName: string;
  reason: string;
  details?: string;
  status: TutorReportStatus;
  createdAt: string;
  tutorName?: string;
}
