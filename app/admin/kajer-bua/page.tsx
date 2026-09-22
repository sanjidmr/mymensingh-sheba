'use client';

import React, { useState } from 'react';
import { Sparkles, PlusCircle, ShieldCheck, CheckCircle2, UserCheck, Phone, MapPin } from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import { getAllMCCAreas } from '@/lib/locations';

export default function AdminKajerBuaPage() {
  const mccAreas = getAllMCCAreas();

  const [helpers, setHelpers] = useState([
    {
      id: 'kb-01',
      nameBn: 'রহিমা বেগম',
      title: 'অভিজ্ঞ রান্নার বুয়া (পার্ট-টাইম / সকাল)',
      phone: '01700-112233',
      area: 'চরপাড়া ও ভাটিকাশর',
      nidVerified: true,
      active: true,
    },
    {
      id: 'kb-02',
      nameBn: 'আলেয়া খাতুন',
      title: 'বাসা পরিষ্কার ও কাপড় ধোয়ার সহকারী',
      phone: '01800-445566',
      area: 'কাঁচিঝুলি ও সানকিপাড়া',
      nidVerified: true,
      active: true,
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newArea, setNewArea] = useState('charpara');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newHelper = {
      id: `kb-${Date.now().toString().slice(-3)}`,
      nameBn: newName,
      title: newTitle,
      phone: newPhone,
      area: newArea,
      nidVerified: true,
      active: true,
    };
    setHelpers([newHelper, ...helpers]);
    setShowAddModal(false);
    setNewName('');
    setNewTitle('');
    setNewPhone('');
  };

  return (
    <RoutePlaceholderShell
      title="কাজের বুয়া — অ্যাডমিন কন্ট্রোল"
      subtitle="অ্যাডমিন কর্তৃক নতুন গৃহকর্মী আপলোড, ব্যাকগ্রাউন্ড ও জাতীয় পরিচয়পত্র যাচাই এবং কাস্টমার রিকোয়েস্ট ম্যানেজমেন্ট।"
      categoryBadge="অ্যাডমিন পরিচালিত সেবা"
      breadcrumbs={[
        { label: 'অ্যাডমিন', href: '/admin' },
        { label: 'কাজের বুয়া' },
      ]}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">গৃহকর্মী প্রোফাইলসমূহ ({helpers.length})</h3>
          <p className="text-xs text-slate-500">গ্রাহকদের জন্য সরাসরি অ্যাডমিন টিম কর্তৃক পরিচালিত</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900"
        >
          <PlusCircle className="w-4 h-4" />
          <span>নতুন সহকারী যুক্ত করুন</span>
        </button>
      </div>

      {showAddModal && (
        <div className="mb-6 p-6 rounded-2xl bg-white border border-emerald-300 shadow-xs">
          <h4 className="font-bold text-slate-900 mb-3 text-sm">নতুন গৃহকর্মী তালিকাভুক্তিকরণ ফরম</h4>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পূর্ণ নাম:</label>
                <input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="যেমন: সাহিদা আক্তার" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">অভ্যন্তরীণ যোগাযোগের ফোন নম্বর:</label>
                <input required value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="01XXXXXXXXX" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">কাজের বিবরণ / টাইটেল:</label>
              <input required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="যেমন: দুপুরের রান্না ও ঘর মোছার কাজ" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 text-xs text-slate-600 rounded-lg">
                বাতিল
              </button>
              <button type="submit" className="px-4 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-semibold">
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {helpers.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-slate-900 text-sm">{item.nameBn}</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  NID ভেরিফাইড
                </span>
              </div>
              <div className="text-xs text-slate-600">{item.title}</div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>ফোন: {item.phone} (গোপনীয়)</span>
                <span>• এলাকা: {item.area}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold">
                সক্রিয়
              </span>
            </div>
          </div>
        ))}
      </div>
    </RoutePlaceholderShell>
  );
}
