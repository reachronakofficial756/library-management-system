import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Library, Mail, Lock, Eye, EyeOff, Loader2, User, Building, Phone, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';

const LoginPage: React.FC = () => {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'login') {
      if (!email || !password) {
        toast.error('Please enter email and password');
        return;
      }
      setIsLoading(true);
      try {
        await login({ email, password });
        toast.success('Welcome back!');
        navigate('/dashboard');
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!name || !email || !password) {
        toast.error('Please fill in your name, email, and password');
        return;
      }
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      setIsLoading(true);
      try {
        await register({ name, email, password, department, phone });
        toast.success('Account created! Welcome to ShelfLife.');
        navigate('/dashboard');
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fillDemo = (role: 'librarian' | 'member') => {
    setMode('login');
    if (role === 'librarian') {
      setEmail('ananya.sharma@college.edu');
      setPassword('librarian123');
    } else {
      setEmail('rohan.mehta@college.edu');
      setPassword('member123');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#f8fafc] overflow-hidden">
      {/* Stripe-style Atmospheric Gradient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#635bff]/15 blur-3xl" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-[#00d4b8]/12 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-[#00a4ff]/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-900/10 transition-all">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#635bff] to-[#00d4b8] items-center justify-center text-white shadow-lg shadow-[#635bff]/25 mb-4">
              <Library size={28} className="stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0a2540]">ShelfLife</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Next-Generation Library Platform</p>
          </div>

          {/* Auth Tab Switcher */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80 mb-6">
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-[#635bff] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-[#635bff] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setMode('register')}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-[#0a2540] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-3 focus:ring-[#635bff]/10 transition-all"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-[#0a2540] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-3 focus:ring-[#635bff]/10 transition-all"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Min 6 characters' : '••••••••'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-[#0a2540] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-3 focus:ring-[#635bff]/10 transition-all"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department (optional)</label>
                  <div className="relative flex items-center">
                    <Building size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-[#0a2540] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-3 focus:ring-[#635bff]/10 transition-all"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number (optional)</label>
                  <div className="relative flex items-center">
                    <Phone size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91-9876543210"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-[#0a2540] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-3 focus:ring-[#635bff]/10 transition-all"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#635bff] hover:bg-[#533afd] shadow-md shadow-[#635bff]/25 hover:shadow-lg hover:shadow-[#635bff]/30 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Continue to Dashboard' : 'Create Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access (only on login) */}
          {mode === 'login' && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-3">
                <Sparkles size={12} className="text-[#635bff]" />
                <span>Instant Demo Login</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo('librarian')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-white hover:border-[#635bff]/50 hover:shadow-sm text-xs font-semibold text-slate-700 transition-all"
                >
                  <span className="text-base mb-0.5">🔑</span>
                  <span>Librarian (Admin)</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('member')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-white hover:border-[#635bff]/50 hover:shadow-sm text-xs font-semibold text-slate-700 transition-all"
                >
                  <span className="text-base mb-0.5">📚</span>
                  <span>Student (Member)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
