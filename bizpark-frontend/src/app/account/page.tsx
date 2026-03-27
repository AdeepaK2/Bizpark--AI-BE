'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { updateProfile } from '@/lib/api';
import Link from 'next/link';

export default function AccountPage() {
  const { config, user, token, login } = useApp();
  const router = useRouter();
  const primary = config?.primaryColor ?? '#2563eb';

  const [tab, setTab] = useState<'profile' | 'password'>('profile');

  // Profile form
  const [name, setName] = useState(user?.name ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  if (!user || !token) {
    router.replace('/auth');
    return null;
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErr(''); setProfileMsg('');
    setSavingProfile(true);
    try {
      const res = await updateProfile(token, { name: name.trim() });
      login(token, res.data);
      setProfileMsg('Profile updated!');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (e: unknown) {
      setProfileErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr(''); setPwMsg('');
    if (newPassword !== confirmPassword) { setPwErr('Passwords do not match'); return; }
    if (newPassword.length < 6) { setPwErr('Password must be at least 6 characters'); return; }
    setSavingPw(true);
    try {
      await updateProfile(token, { currentPassword, newPassword });
      setPwMsg('Password changed!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setPwMsg(''), 3000);
    } catch (e: unknown) {
      setPwErr(e instanceof Error ? e.message : 'Password change failed');
    } finally {
      setSavingPw(false);
    }
  };

  const inputCls = 'w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white';
  const tabCls = (t: string) => `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/orders" className="bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
          <p className="font-semibold text-gray-900 text-sm">My Orders</p>
          <p className="text-xs text-gray-500 mt-0.5">View order history</p>
        </Link>
        <Link href="/cart" className="bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
          <p className="font-semibold text-gray-900 text-sm">My Cart</p>
          <p className="text-xs text-gray-500 mt-0.5">View current cart</p>
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex gap-2 p-3 border-b bg-gray-50">
          <button className={tabCls('profile')} style={tab === 'profile' ? { backgroundColor: primary } : {}} onClick={() => setTab('profile')}>Profile</button>
          <button className={tabCls('password')} style={tab === 'password' ? { backgroundColor: primary } : {}} onClick={() => setTab('password')}>Change Password</button>
        </div>

        <div className="p-6">
          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input className={inputCls} value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} value={user.email} disabled />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              {profileErr && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{profileErr}</p>}
              {profileMsg && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{profileMsg}</p>}
              <button type="submit" disabled={savingProfile} className="px-6 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50" style={{ backgroundColor: primary }}>
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {tab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" className={inputCls} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" className={inputCls} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" className={inputCls} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
              </div>
              {pwErr && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{pwErr}</p>}
              {pwMsg && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{pwMsg}</p>}
              <button type="submit" disabled={savingPw} className="px-6 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50" style={{ backgroundColor: primary }}>
                {savingPw ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
