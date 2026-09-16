import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import Badge from '../../components/common/Badge';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaKey,
  FaCheckCircle,
  FaExclamationCircle,
  FaShieldAlt,
} from 'react-icons/fa';

const ProfilePage = () => {
  const { user, setUser } = useAuth();

  // Profile Details Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Change Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Handle Profile Details Update (Name, Email, Phone) -> Updates MongoDB database
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });

    if (!name.trim()) {
      setProfileMessage({ type: 'error', text: 'Full Name is a required field.' });
      return;
    }

    try {
      setProfileLoading(true);
      const res = await API.put('/auth/profile', {
        name,
        email,
        phone,
      });

      if (res.data.success) {
        const updatedUser = {
          ...user,
          ...res.data.data,
        };
        // Update context and localStorage so the entire app reflects database updates immediately
        setUser(updatedUser);
        localStorage.setItem('gvehicle_user', JSON.stringify(updatedUser));

        setProfileMessage({
          type: 'success',
          text: 'Your profile information has been successfully updated!',
        });
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile. Please try again.',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Update -> Updates Hashed Password in MongoDB database
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (!newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New Password and Confirm Password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await API.put('/auth/update-password', {
        newPassword,
      });

      if (res.data.success) {
        setPasswordMessage({
          type: 'success',
          text: 'Your password has been changed successfully!',
        });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update password.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl uppercase shadow-md shadow-indigo-200">
            {user?.name?.slice(0, 2) || 'US'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{user?.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                {user?.role || 'USER'}
              </span>
              <span className="text-xs text-slate-400">• {user?.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs text-slate-600">
          <FaShieldAlt className="text-emerald-500 w-4 h-4" />
          <span>Database Account Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <FaUser className="text-indigo-600 w-4 h-4" />
            <h2 className="text-base font-bold text-slate-800">Personal Information</h2>
          </div>

          {profileMessage.text && (
            <div
              className={`p-3 rounded-xl flex items-center space-x-2 text-xs ${
                profileMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {profileMessage.type === 'success' ? (
                <FaCheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <FaExclamationCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <div className="relative">
                <FaUser className="absolute left-3.5 top-3.5 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3.5 top-3.5 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number / Phone</label>
              <div className="relative">
                <FaPhone className="absolute left-3.5 top-3.5 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <FaSave className="w-3.5 h-3.5" />
                <span>{profileLoading ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <FaKey className="text-indigo-600 w-4 h-4" />
            <h2 className="text-base font-bold text-slate-800">Change Password</h2>
          </div>

          {passwordMessage.text && (
            <div
              className={`p-3 rounded-xl flex items-center space-x-2 text-xs ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {passwordMessage.type === 'success' ? (
                <FaCheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <FaExclamationCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password *</label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-3.5 text-slate-400 w-3.5 h-3.5" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showNewPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-3.5 text-slate-400 w-3.5 h-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showConfirmPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-100 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <FaKey className="w-3.5 h-3.5" />
                <span>{passwordLoading ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
