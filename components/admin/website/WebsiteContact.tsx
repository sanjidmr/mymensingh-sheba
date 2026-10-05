'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Save } from 'lucide-react';
import { saveSiteContent } from '@/app/admin/actions/settings';
import { useToast } from '@/components/admin/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

/**
 * Contact details shown across the public site.
 *
 * The built-in `SITE_CONTACT` deliberately leaves the phone and address null
 * until real values exist — the site must not advertise a number that does not
 * work. This form inherits that rule: an empty phone saves as null, and the
 * footer keeps offering "বার্তা পাঠান" instead of a dead `tel:` link.
 */
export default function WebsiteContact({
  overrides,
}: {
  overrides: {
    phone?: string | null;
    email?: string | null;
    officeAddress?: string | null;
    serviceAreaBn?: string | null;
    hoursBn?: string | null;
    socials?: Array<{
      icon: 'facebook' | 'messenger';
      labelBn: string;
      href: string | null;
    }>;
  };
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [phone, setPhone] = useState(overrides.phone ?? '');
  const [email, setEmail] = useState(overrides.email ?? '');
  const [officeAddress, setOfficeAddress] = useState(overrides.officeAddress ?? '');
  const [serviceAreaBn, setServiceAreaBn] = useState(overrides.serviceAreaBn ?? '');
  const [hoursBn, setHoursBn] = useState(overrides.hoursBn ?? '');
  const [facebook, setFacebook] = useState(
    overrides.socials?.find((s) => s.icon === 'facebook')?.href ?? ''
  );
  const [messenger, setMessenger] = useState(
    overrides.socials?.find((s) => s.icon === 'messenger')?.href ?? ''
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const result = await saveSiteContent('site_contact', {
        phone: phone.trim() || null,
        email: email.trim() || null,
        officeAddress: officeAddress.trim() || null,
        serviceAreaBn: serviceAreaBn.trim() || null,
        hoursBn: hoursBn.trim() || null,
        socials: [
          {
            icon: 'facebook',
            labelBn: 'Facebook পেজ',
            href: facebook.trim() || null,
          },
          {
            icon: 'messenger',
            labelBn: 'Messenger',
            href: messenger.trim() || null,
          },
        ],
      });
      if (result.ok) {
        notify('success', 'যোগাযোগের তথ্য সংরক্ষিত হয়েছে');
        router.refresh();
      } else {
        notify('error', 'ব্যর্থ হয়েছে', result.error);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="ফোন নম্বর"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01XXXXXXXXX"
          helperText="খালি রাখলে ওয়েবসাইটে 'বার্তা পাঠান' দেখাবে"
        />
        <Input
          label="ইমেইল"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="help@example.com"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="অফিসের ঠিকানা"
          value={officeAddress}
          onChange={(e) => setOfficeAddress(e.target.value)}
          placeholder="খালি রাখলে ঠিকানা দেখাবে না"
        />
        <Input
          label="সেবার এলাকা"
          value={serviceAreaBn}
          onChange={(e) => setServiceAreaBn(e.target.value)}
        />
      </div>

      <Input
        label="সেবার সময়"
        value={hoursBn}
        onChange={(e) => setHoursBn(e.target.value)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Facebook পেজের লিংক"
          value={facebook}
          onChange={(e) => setFacebook(e.target.value)}
          placeholder="https://facebook.com/..."
          helperText="খালি রাখলে আইকনটি অনুপস্থিত থাকবে"
        />
        <Input
          label="Messenger লিংক"
          value={messenger}
          onChange={(e) => setMessenger(e.target.value)}
          placeholder="https://m.me/..."
        />
      </div>

      <div className="flex justify-end border-t border-mist-100 pt-3">
        <Button onClick={save} isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>
          সংরক্ষণ করুন
        </Button>
      </div>
    </div>
  );
}