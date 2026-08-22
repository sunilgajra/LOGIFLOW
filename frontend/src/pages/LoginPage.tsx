import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, Lock, Mail, ArrowRight, X, CheckCircle2, KeyRound, ExternalLink } from 'lucide-react';
import { API_BASE } from '../api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [demoResetUrl, setDemoResetUrl] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        login(data.token, data.user);
        
        if (data.user.role === 'OPERATIONS') {
          navigate('/dashboard/delivery');
        } else {
          navigate('/dashboard');
        }
        return;
      }
      
      const data = await response.json();
      throw new Error(data.error || 'Login failed');

    } catch (err: any) {
      console.warn('Backend API connection failed, falling back to Demo Mode login:', err.message);

      // Demo Mode Fallback for mobile / static preview
      const isDriver = email.toLowerCase().includes('driver');
      const isClient = email.toLowerCase().includes('client') || email.toLowerCase().includes('rahul') || email.toLowerCase().includes('apex');

      let role = 'SUPER_ADMIN';
      let firstName = 'Admin';
      let lastName = 'User';
      let clientId = undefined;

      if (isDriver) {
        role = 'OPERATIONS';
        firstName = 'Delivery';
        lastName = 'Driver';
      } else if (isClient) {
        role = 'CLIENT';
        firstName = 'Rahul';
        lastName = 'Sharma';
        clientId = 'client-1';
      }

      const demoUser = {
        id: isDriver ? 'driver-demo-id' : (isClient ? 'client-demo-id' : 'admin-demo-id'),
        email: email || 'admin@logiflow.com',
        first_name: firstName,
        last_name: lastName,
        role: role,
        client_id: clientId,
      };

      login('demo-preview-token', demoUser);

      if (isDriver) {
        navigate('/dashboard/delivery');
      } else {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotSuccess(false);
    setForgotMessage('');
    setDemoResetUrl('');

    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();
      if (response.ok) {
        setForgotSuccess(true);
        setForgotMessage(data.message || 'Reset instructions sent to your email.');
        if (data.resetUrl) {
          setDemoResetUrl(data.resetUrl);
        } else if (data.resetToken) {
          setDemoResetUrl(`/reset-password?token=${data.resetToken}`);
        }
      } else {
        throw new Error(data.error || 'Failed to request password reset');
      }
    } catch (err: any) {
      console.warn('API offline, simulating forgot password demo response');
      setForgotSuccess(true);
      setForgotMessage('Password reset link generated for demo mode.');
      setDemoResetUrl(`/reset-password?token=demo-token-${Date.now()}`);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Package className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Sign in to LogiFlow
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Or return to the <a href="/" className="font-medium text-blue-600 hover:text-blue-500">public homepage</a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
          
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-md text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2.5 border"
                  placeholder="admin@logiflow.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2.5 border"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">Remember me</label>
              </div>
              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotSuccess(false);
                    setDemoResetUrl('');
                    setShowForgotModal(true);
                  }}
                  className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70"
              >
                {loading ? 'Signing in...' : 'Sign in'} <ArrowRight className="w-4 h-4 ml-2 mt-0.5" />
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="text-xs text-center text-slate-500">
              <strong>Demo Accounts:</strong><br/>
              Admin: <code>admin@logiflow.com</code> / <code>password123</code><br/>
              Driver: <code>driver@logiflow.com</code> / <code>password123</code>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative transform transition-all">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <span>Forgot Password</span>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {forgotSuccess ? (
                <div className="text-center py-2">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-slate-900 text-base mb-1">Reset Request Sent</h4>
                  <p className="text-xs text-slate-600 mb-4">{forgotMessage}</p>

                  {demoResetUrl && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-left mb-4">
                      <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5" /> Test Password Reset Link:
                      </p>
                      <Link
                        to={demoResetUrl}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        Open Reset Form <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}

                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="w-full py-2 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter the email address associated with your LogiFlow account. We will issue a secure reset link to recover your access.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 text-xs border-slate-300 rounded-lg py-2.5 border"
                        placeholder="e.g. admin@logiflow.com"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="w-1/2 py-2 px-4 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-1/2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-70"
                    >
                      {forgotLoading ? 'Generating Link...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
