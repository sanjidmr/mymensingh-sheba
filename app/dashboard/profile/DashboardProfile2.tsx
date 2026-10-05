'use client';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, Home, GraduationCap, Heart, Lock, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { MCC_AREAS, getAreaById } from '@/lib/locations';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

const inputCls = 'w-full min-h-[48px] rounded-xl border border-brand-200 bg-white px-3.5 text-[14px] text-ink-900';
const labelCls = 'mb-1.5 block text-[12px] font-bold text-ink-900';

export default function DashboardProfile() {
  const { user, toletProfile, homeTutorProfile, bloodDonorProfile } = useAuth();
  if (!user) return null;
  const area = getAreaById(user.primaryAreaId);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-ink-900">আমার প্রোফাইল</h1>
        <p className="mt-1 text-[12.5px] text-ink-500">ছবি, নাম, এলাকা ও যোগাযোগ হালনাগাদ করুন।</p>
      </div>
      <AvatarCard />
      <InfoForm />
      <PasswordCard />
      <SvcCard />
      <LogoutCard />
    </div>
  );
}

function AvatarCard() {
  const { user, uploadAvatar } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true); setMsg('');
    const r = await uploadAvatar(f);
    setBusy(false);
    setMsg(r.success ? 'ছবি হালনাগাদ হয়েছে।' : (r.error || 'আপলোড ব্যর্থ হয়েছে।'));
  };
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-brand-100 bg-white p-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent-400 text-2xl font-black text-brand-900">
        {user!.avatarUrl ? (<img src={user!.avatarUrl} alt={user!.fullName} className="h-full w-full object-cover" />) : (user!.fullName.charAt(0))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-extrabold text-ink-900">{user!.fullName}</p>
        <p className="truncate text-[12px] text-ink-500">{user!.phone}{user!.email ? ` · ${user!.email}` : ''}</p>
        <button type="button" disabled={busy} onClick={() => ref.current?.click()} className={`mt-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3.5 text-[12px] font-bold text-brand-700 hover:bg-brand-50 disabled:opacity-50 ${LIGHT_FOCUS}`}>
          <Camera className="h-4 w-4" /> {busy ? 'আপলোড হচ্ছে...' : 'ছবি বদলান'}
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        {msg && <p className="mt-1.5 text-[11.5px] font-semibold text-brand-700">{msg}</p>}
      </div>
    </div>
  );
}

function InfoForm() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user!.fullName);
  const [email, setEmail] = useState(user!.email || '');
  const [bio, setBio] = useState(user!.bio || '');
  const [areaId, setAreaId] = useState(user!.primaryAreaId);
  const [emg, setEmg] = useState(user!.emergencyContact || '');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setOk(false);
    await updateProfile({ fullName: name.trim(), email: email.trim() || undefined, bio: bio.trim() || undefined, primaryAreaId: areaId, emergencyContact: emg.trim() || undefined });
    setBusy(false); setOk(true);
    setTimeout(() => setOk(false), 3000);
  };
  return (
    <form onSubmit={save} className="space-y-3 rounded-2xl border border-brand-100 bg-white p-4">
      <h2 className="text-[13px] font-extrabold text-ink-900">ব্যক্তিগত তথ্য</h2>
      <div><label className={labelCls}>পুরো নাম</label><input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} /></div>
      <div><label className={labelCls}>মোবাইল (অপরিবর্তনযোগ্য)</label><input value={user!.phone} disabled className={`${inputCls} bg-mist-50 text-ink-400`} /></div>
      <div><label className={labelCls}>ইমেইল (ঐচ্ছিক)</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className={inputCls} /></div>
      <div><label className={labelCls}>এলাকা</label><select value={areaId} onChange={(e) => setAreaId(e.target.value)} className={inputCls}>{MCC_AREAS.map((a) => (<option key={a.id} value={a.id}>{a.nameBn}</option>))}</select></div>
      <div><label className={labelCls}>সংক্ষিপ্ত পরিচিতি</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={300} placeholder="নিজের সম্পর্কে দু-এক লাইন..." className={`${inputCls} py-3`} /></div>
      <div><label className={labelCls}>জরুরি যোগাযোগ</label><input type="tel" value={emg} onChange={(e) => setEmg(e.target.value)} placeholder="018xxxxxxxx" className={inputCls} /></div>
      {ok && <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-[12px] font-bold text-emerald-900">তথ্য সংরক্ষণ হয়েছে।</p>}
      <button type="submit" disabled={busy} className={`min-h-[48px] w-full rounded-xl bg-brand-700 text-[14px] font-extrabold text-white hover:bg-brand-800 disabled:opacity-50 ${LIGHT_FOCUS}`}>{busy ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</button>
    </form>
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
  return (
    <button type="button" onClick={() => logout()} className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white text-[13px] font-bold text-red-700 ${LIGHT_FOCUS}`}>
      <LogOut className="h-4 w-4" /> লগআউট
    </button>
  );
}
