import StaffProfileForm from '@/components/admin/StaffProfileForm';

export const metadata = {
  title: 'নতুন কর্মী প্রোফাইল — Mymensingh Sheba',
};

export default function AdminNewStaffProfilePage() {
  return <StaffProfileForm mode="create" />;
}