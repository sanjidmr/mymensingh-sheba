'use client';
import React, { useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { Camera, Home, GraduationCap, Heart, Lock, LogOut, CheckCircle2, ShieldCheck, Bookmark, Bell, MessageCircle, CircleAlert, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { MCC_AREAS, getAreaById, isInsideMCC } from '@/lib/locations';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { ListingMedia } from '@/components/catalog/CatalogCards';

const inputCls = 'w-full min-h-[48px] rounded-xl border border-brand-200 bg-white px-3.5 text-[14px] text-ink-900';
const labelCls = 'mb-1.5 block text-[12px] font-bold text-ink-900';

export default function DashboardProfile() {
  const { user, toletProfile, homeTutorProfile, bloodDonorProfile } = useAuth();
  const completion = useMemo(() => {
    if (!user) return { completed: 0, total: 10, percent: 0 };
    const checks = [
      Boolean(user.fullName),
      Boolean(user.phone),
      Boolean(user.email),
      Boolean(user.primaryAreaId),
      Boolean(user.bio),
      Boolean(user.emergencyContact),
      Boolean(user.avatarUrl),
      Boolean(toletProfile),
      Boolean(homeTutorProfile),
      Boolean(bloodDonorProfile),
    ];
    return {
      completed: checks.filter(Boolean).length,
      total: checks.length,
      percent: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    };
  }, [user, toletProfile, homeTutorProfile, bloodDonorProfile]);
  if (!user) return null;
  const area = getAreaById(user.primaryAreaId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-ink-900">আমার প্রোফাইল</h1>
        <p className="mt-1 text-[12.5px] text-ink-500">ছবি, নাম, এলাকা ও যোগাযোগ হালনাগাদ করুন।</p>
      </div>
      <ProfileCompletion Bar={completion.percent} completed={completion.completed} total={completion.total} />
      <AvatarCard />
      <InfoForm />
      <VerificationCard />
      <NotificationPreferencesCard />
      <AccountLinksCard />
      <PasswordCard />
      <SvcCard />
      <LogoutCard />
    </div>
  );
}

function ProfileCompletion({ Bar, completed, total }: { Bar: number; completed: number; total: number }) {
  const width = Math.min(100, Math.max(0, Bar));
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink-900">
          <CheckCircle2 className="h-4 w-4 text-brand-700" />
          প্রোফাইল অগ্রগতি
        </span>
        <span className="text-[12px] font-bold text-ink-500">{completed}/{total}</span>
      </div>
      <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-mist-100">
        <div
          className="h-full rounded-full bg-brand-700 transition-all duration-300 ease-out"
          style={{ width: `${width}%` }}
          aria-label={`${width}% অগ্রগতি`}>
        </div>
      </div>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-500">
        {width < 100
          ? 'আরও তথ্য ও সেবা প্রোফাইল যোগ করুন।'
          : 'আপনার প্রোফাইল পূর্ণ।'}
      </p>
    </div>
  );
}

function AvatarCard() {
  const { user, uploadAvatar } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true); setMsg(''); setFailed(false);
    try {
      const r = await uploadAvatar(f);
      setFailed(!r.success);
      setMsg(r.success ? 'ছবি হালনাগাদ হয়েছে।' : (r.error || 'আপলোড ব্যর্থ হয়েছে।'));
    } catch (error) {
      setFailed(true);
      setMsg(error instanceof Error ? error.message : 'ছবি আপলোড ব্যর্থ হয়েছে।');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-brand-100 bg-white p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent-400 text-2xl font-black text-brand-900">
            {user!.avatarUrl ? (
              <ListingMedia src={user!.avatarUrl} alt={user!.fullName} label={user!.fullName} imgClassName="h-full w-full object-cover" />
            ) : (
              user!.fullName.charAt(0)
            )}
          </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-extrabold text-ink-900">{user!.fullName}</p>
        <p className="truncate text-[12px] text-ink-500">{user!.phone}{user!.email ? ` · ${user!.email}` : ''}</p>
        <p className="mt-0.5 truncate text-[11px] text-ink-400">{getAreaById(user!.primaryAreaId)?.nameBn ?? user!.primaryAreaId}</p>
        <button type="button" disabled={busy} onClick={() => ref.current?.click()} className={`mt-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3.5 text-[12px] font-bold text-brand-700 hover:bg-brand-50 disabled:opacity-50 ${LIGHT_FOCUS}`}>
          <Camera className="h-4 w-4" /> {busy ? 'আপলোড হচ্ছে...' : 'ছবি বদলান'}
        </button>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        {msg && <p role={failed ? 'alert' : 'status'} className={`mt-1.5 text-[11.5px] font-semibold ${failed ? 'text-rose-700' : 'text-brand-700'}`}>{msg}</p>}
      </div>
    </div>
  );
}

function InfoForm() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user!.fullName);
  const [email, setEmail] = useState(user!.email || '');
  const [bio, setBio] = useState(user!.bio || '');
  const [areaId, setAreaId] = useState(
    isInsideMCC(user!.primaryAreaId) ? user!.primaryAreaId : (MCC_AREAS[0]?.id ?? 'charpara')
  );
  const [emg, setEmg] = useState(user!.emergencyContact || '');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setOk(false); setError('');
    try {
      const result = await updateProfile({ fullName: name.trim(), email: email.trim(), bio: bio.trim(), primaryAreaId: areaId, emergencyContact: emg.trim() });
      if (!result.success) {
        setError(result.error || 'তথ্য সংরক্ষণ ব্যর্থ হয়েছে।');
        return;
      }
      setOk(true);
      setTimeout(() => setOk(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'তথ্য সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={save} className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4">
      <h2 className="text-[13px] font-extrabold text-ink-900">ব্যক্তিগত তথ্য</h2>
      <div><label className={labelCls}>পুরো নাম</label><input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} /></div>
      <div>
        <label className={labelCls}>মোবাইল নম্বর</label>
        <input value={user!.phone} readOnly className={`${inputCls} bg-mist-50 text-ink-700`} />
        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500">নিরাপত্তার জন্য মোবাইল নম্বর এখানে পরিবর্তন করা যায় না। নম্বর বদলের যাচাইকৃত ব্যবস্থা চালু হলে এই পৃষ্ঠা থেকে করা যাবে।</p>
      </div>
      <div><label className={labelCls}>যোগাযোগের ইমেইল (ঐচ্ছিক)</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className={inputCls} /><p className="mt-1 text-[11px] text-ink-500">এটি যোগাযোগের ঠিকানা; লগইন নম্বর পরিবর্তন হবে না।</p></div>
      <div><label className={labelCls}>এলাকা</label><select value={areaId} onChange={(e) => setAreaId(e.target.value)} className={inputCls}>{MCC_AREAS.map((a) => (<option key={a.id} value={a.id}>{a.nameBn}</option>))}</select></div>
      <div><label className={labelCls}>সংক্ষিপ্ত পরিচিতি</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={300} placeholder="নিজের সম্পর্কে দু-এক লাইন..." className={`${inputCls} py-3`} /></div>
      <div><label className={labelCls}>জরুরি যোগাযোগ</label><input type="tel" value={emg} onChange={(e) => setEmg(e.target.value)} placeholder="018xxxxxxxx" className={inputCls} /></div>
      {ok && <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-[12px] font-bold text-emerald-900">তথ্য সংরক্ষণ হয়েছে।</p>}
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-[12px] font-bold text-rose-800">{error}</p>}
      <button type="submit" disabled={busy} className={`min-h-[48px] w-full rounded-xl bg-brand-700 text-[14px] font-extrabold text-white hover:bg-brand-800 disabled:opacity-50 ${LIGHT_FOCUS}`}>{busy ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</button>
    </form>
  );
}

function VerificationCard() {
  const { user } = useAuth();
  const verified = Boolean(user?.isVerified);
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-4" aria-labelledby="verification-heading">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 id="verification-heading" className="text-[13px] font-extrabold text-ink-900">অ্যাকাউন্ট যাচাই</h2>
          <p className={`mt-1 text-[12px] font-bold ${verified ? 'text-emerald-700' : 'text-amber-700'}`}>
            {verified ? 'আপনার অ্যাকাউন্ট যাচাইকৃত' : 'আপনার অ্যাকাউন্ট এখনো যাচাই করা হয়নি'}
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500">যাচাইয়ের অবস্থা নিরাপত্তার জন্য প্রশাসক পরিচালনা করেন; আপনি এটি পরিবর্তন করতে পারবেন না।</p>
        </div>
      </div>
    </section>
  );
}

function NotificationPreferencesCard() {
  const { user, updateProfile } = useAuth();
  const preferences = user?.notificationPreferences ?? { postUpdates: true, requestUpdates: true, supportReplies: true };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const toggle = async (key: keyof typeof preferences) => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const result = await updateProfile({
        notificationPreferences: { ...preferences, [key]: !preferences[key] },
      });
      if (!result.success) {
        setError(result.error || 'পছন্দ সংরক্ষণ করা যায়নি।');
        return;
      }
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'পছন্দ সংরক্ষণ করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };
  const options: { key: keyof typeof preferences; label: string }[] = [
    { key: 'postUpdates', label: 'আমার পোস্টের সিদ্ধান্ত ও পরিবর্তন' },
    { key: 'requestUpdates', label: 'সেবা অনুরোধের আপডেট' },
    { key: 'supportReplies', label: 'অ্যাডমিনের বার্তা ও সহায়তার উত্তর' },
  ];
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-4" aria-labelledby="notification-settings-heading">
      <h2 id="notification-settings-heading" className="flex items-center gap-2 text-[13px] font-extrabold text-ink-900">
        <Bell className="h-4 w-4 text-brand-700" /> নোটিফিকেশন পছন্দ
      </h2>
      <div className="mt-3 divide-y divide-brand-100">
        {options.map(({ key, label }) => (
          <label key={key} className="flex min-h-12 cursor-pointer items-center justify-between gap-3 py-2.5 text-[12px] font-semibold text-ink-700">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={preferences[key]}
              disabled={busy}
              onChange={() => void toggle(key)}
              className="h-5 w-5 shrink-0 accent-brand-700"
            />
          </label>
        ))}
      </div>
      {saved && <p role="status" className="mt-2 text-[11.5px] font-semibold text-emerald-700">আপনার পছন্দ সংরক্ষণ হয়েছে।</p>}
      {error && <p role="alert" className="mt-2 text-[11.5px] font-semibold text-rose-700">{error}</p>}
      <p className="mt-2 text-[11px] leading-relaxed text-ink-400">পছন্দ পরিবর্তনের পর থেকে আসা প্রযোজ্য নোটিফিকেশনে এটি কার্যকর হবে।</p>
    </section>
  );
}

function AccountLinksCard() {
  const links = [
    { href: '/profile/saved', label: 'সংরক্ষিত পোস্ট', detail: 'আপনার পছন্দের পোস্ট', icon: Bookmark },
    { href: '/dashboard/notifications', label: 'নোটিফিকেশন', detail: 'পোস্ট ও অ্যাকাউন্ট আপডেট', icon: Bell },
    { href: '/dashboard/messages', label: 'বার্তা', detail: 'সাপোর্ট টিমের সাথে কথোপকথন', icon: MessageCircle },
    { href: '/dashboard/complaints', label: 'অভিযোগ', detail: 'অভিযোগ জানান ও ফলো করুন', icon: CircleAlert },
    { href: '/profile/requests', label: 'সেবা অনুরোধ', detail: 'আপনার জমা দেওয়া অনুরোধ', icon: FileText },
  ];
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-4" aria-labelledby="account-links-heading">
      <h2 id="account-links-heading" className="text-[13px] font-extrabold text-ink-900">অ্যাকাউন্ট ও সহায়তা</h2>
      <ul className="mt-2.5 space-y-2">
        {links.map(({ href, label, detail, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className={`flex min-h-12 items-center gap-3 rounded-xl border border-brand-100 p-3 hover:border-brand-200 ${LIGHT_FOCUS}`}>
              <Icon className="h-4 w-4 shrink-0 text-brand-700" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold text-ink-900">{label}</span>
                <span className="block text-[11px] text-ink-500">{detail}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-500">অ্যাকাউন্ট বন্ধ বা মুছে ফেলার স্ব-সেবা ব্যবস্থা বর্তমানে নেই। নিরাপদ সহায়তার জন্য অভিযোগ/মেসেজ থেকে যোগাযোগ করুন।</p>
    </section>
  );
}

function SvcCard() {
  const { user, toletProfile, homeTutorProfile, bloodDonorProfile } = useAuth();
  const area = getAreaById(user!.primaryAreaId);
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4">
      <h2 className="text-[13px] font-extrabold text-ink-900">আমার সার্ভিস প্রোফাইল</h2>
      <ul className="mt-2.5 space-y-2">
        <SvcRow href="/profile/tolet" icon={Home} label="বাসা ভাড়া" desc={toletProfile ? 'প্রোফাইল আছে' : 'এখনো খোলা হয়নি'} />
        <SvcRow href="/profile/home-tutor" icon={GraduationCap} label="গৃহশিক্ষক" desc={homeTutorProfile ? 'প্রোফাইল আছে' : 'এখনো খোলা হয়নি'} />
        <SvcRow href="/profile/blood-donor" icon={Heart} label="রক্তদাতা" desc={bloodDonorProfile ? 'প্রোফাইল আছে' : 'এখনো খোলা হয়নি'} />
      </ul>
      <p className="mt-2.5 text-[11.5px] text-ink-400">ফোন: {user!.phone} · এলাকা: {area?.nameBn ?? user!.primaryAreaId}</p>
    </div>
  );
}

function SvcRow({ href, icon: Icon, label, desc }: { href: string; icon: typeof Home; label: string; desc: string }) {
  return (
    <li>
      <Link href={href} className={`flex items-center gap-3 rounded-xl border border-brand-100 p-3 hover:border-brand-200 ${LIGHT_FOCUS}`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold text-ink-900">{label}</span><span className="block text-[11.5px] text-ink-400">{desc}</span></span>
      </Link>
    </li>
  );
}

function PasswordCard() {
  const { changePassword } = useAuth();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { setMsg('কমপক্ষে ৬ অক্ষর দিন।'); return; }
    if (pw !== pw2) { setMsg('দুইবার একই পাসওয়ার্ড দিন।'); return; }
    setBusy(true); setMsg('');
    const r = await changePassword(pw);
    setBusy(false);
    setMsg(r.success ? 'পাসওয়ার্ড বদলে গেছে।' : (r.error || 'ব্যর্থ হয়েছে।'));
    if (r.success) { setPw(''); setPw2(''); }
  };
  return (
    <form onSubmit={save} className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4">
      <h2 className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink-900"><Lock className="h-4 w-4" /> পাসওয়ার্ড বদলান</h2>
      <div><label className={labelCls}>নতুন পাসওয়ার্ড</label><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} className={inputCls} /></div>
      <div><label className={labelCls}>আবার দিন</label><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={6} className={inputCls} /></div>
      {msg && <p className="text-[12px] font-semibold text-brand-700">{msg}</p>}
      <button type="submit" disabled={busy} className={`min-h-[48px] w-full rounded-xl border border-brand-200 text-[13px] font-bold text-brand-700 ${LIGHT_FOCUS}`}>{busy ? 'বদলানো হচ্ছে...' : 'সংরক্ষণ করুন'}</button>
    </form>
  );
}

function LogoutCard() {
  const { logout } = useAuth();
  const [error, setError] = useState('');
  return (
    <div>
      <button type="button" onClick={async () => {
        if (!window.confirm('আপনি কি লগআউট করতে চান?')) return;
        try {
          await logout();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : 'লগআউট করা যায়নি। আবার চেষ্টা করুন।');
        }
      }} className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white text-[13px] font-bold text-red-700 ${LIGHT_FOCUS}`}>
        <LogOut className="h-4 w-4" /> লগআউট
      </button>
      {error && <p role="alert" className="mt-2 text-center text-[12px] font-semibold text-rose-700">{error}</p>}
    </div>
  );
}
