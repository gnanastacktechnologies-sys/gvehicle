import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layouts/AuthLayout';
import Modal from '../../components/common/Modal';
import API from '../../services/api';
import { FaLock, FaEnvelope, FaPhone, FaSignInAlt, FaExclamationCircle, FaCheckCircle, FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Forgot Password Modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);
  const [showResetConfirmPass, setShowResetConfirmPass] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid credentials or server error.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgotModal = () => {
    setResetEmail(email || '');
    setResetPhone('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetError('');
    setResetSuccess('');
    setForgotModalOpen(true);
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetEmail || !resetPhone || !resetNewPassword) {
      setResetError('Please enter your registered email, mobile number, and new password.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('New password and confirmation password do not match.');
      return;
    }

    if (resetNewPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setResetLoading(true);
      const res = await API.post('/auth/forgot-password', {
        email: resetEmail,
        phone: resetPhone,
        newPassword: resetNewPassword,
      });

      if (res.data.success) {
        setResetSuccess('Password reset successfully! You can now sign in with your new password.');
        setEmail(resetEmail);
        setPassword(resetNewPassword);
        setTimeout(() => {
          setForgotModalOpen(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setResetError(err.response?.data?.message || 'Verification failed. Password could not be changed.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-700">
            <FaExclamationCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Email / Username
          </label>
          <div className="relative">
            <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Username or email"
              className="w-full pl-10 pr-4 py-3 bg-surface-input border border-surface-border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <button
              type="button"
              onClick={handleOpenForgotModal}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-hidden cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 bg-surface-input border border-surface-border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Login</span>
              <FaSignInAlt className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Password Verification"
      >
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter your registered email and mobile number. Your password will be updated <strong>only if both details match</strong> our registered records.
          </p>

          {resetSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-700">
              <FaCheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}

          {resetError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
              <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
              <span>{resetError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Email / Username *</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Username or email"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Mobile Number *</label>
            <div className="relative">
              <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                required
                value={resetPhone}
                onChange={(e) => setResetPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password *</label>
            <div className="relative">
              <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type={showResetPass ? 'text' : 'password'}
                required
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowResetPass(!showResetPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
              >
                {showResetPass ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type={showResetConfirmPass ? 'text' : 'password'}
                required
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowResetConfirmPass(!showResetConfirmPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
              >
                {showResetConfirmPass ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-1.5"
            >
              {resetLoading ? 'Verifying...' : 'Verify & Reset Password'}
            </button>
          </div>
        </form>
      </Modal>
    </AuthLayout>
  );
};

export default LoginPage;
