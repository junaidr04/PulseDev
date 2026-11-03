import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PulseBrandLogo } from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
} from 'lucide-react';

interface LoginProps {
  onNavigate: (route: string) => void;
}

interface PersonaCardItem {
  label: string;
  email: string;
  role: string;
}

const DEFAULT_PERSONAS: PersonaCardItem[] = [
  {
    label: 'Alex Chen',
    email: 'alex.chen@pulsedev.io',
    role: 'Admin',
  },
  {
    label: 'Priya Patel',
    email: 'priya.patel@pulsedev.io',
    role: 'Team lead',
  },
  {
    label: 'Marcus Vance',
    email: 'marcus.vance@pulsedev.io',
    role: 'Developer',
  },
  {
    label: 'Sophia Laurent',
    email: 'sophia.laurent@pulsedev.io',
    role: 'QA',
  },
  {
    label: 'Jordan Blake',
    email: 'jordan.blake@pulsedev.io',
    role: 'Product manager',
  },
];

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [personas, setPersonas] = useState<PersonaCardItem[]>(DEFAULT_PERSONAS);
  const [email, setEmail] = useState(() => {
    const prefilled = sessionStorage.getItem('pulsedev_prefill_login_email');
    if (prefilled) {
      sessionStorage.removeItem('pulsedev_prefill_login_email');
      return prefilled;
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const loadLivePersonas = async () => {
    try {
      const res = await api.auth.getPersonas();
      if (res.success && Array.isArray(res.personas) && res.personas.length > 0) {
        const mapped: PersonaCardItem[] = res.personas.map((u: any) => {
          const fallback = DEFAULT_PERSONAS.find(
            (d) => d.email.toLowerCase() === String(u.email).toLowerCase()
          );
          return {
            label: u.name,
            email: u.email,
            role: fallback?.role || u.title || u.role,
          };
        });
        setPersonas(mapped);
      }
    } catch {
      // Keep default personas smoothly
    }
  };

  useEffect(() => {
    loadLivePersonas();
  }, []);

  const selectedPersona = personas.find(
    (p) => p.email.toLowerCase() === email.trim().toLowerCase()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please select an account or enter your email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter the password for this account.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPersona = (p: PersonaCardItem) => {
    setEmail(p.email);
    setPassword('');
    setError(null);
  };

  const handleOpenForgotModal = () => {
    setIsForgotOpen(true);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950 p-6 overflow-y-auto">
      <div className="w-full max-w-lg space-y-5 my-auto">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-3">
            <PulseBrandLogo size="lg" />
          </div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Sign in</h2>
          <p className="text-xs text-slate-400 mt-1">
            Use a demo account or enter your email.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Demo accounts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {personas.map((p) => {
              const isSelected = email.toLowerCase() === p.email.toLowerCase();
              return (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => handleSelectPersona(p)}
                  className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500/40 bg-emerald-500/[0.06] text-white'
                      : 'border-slate-800 bg-slate-950/90 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <Avatar name={p.label} className="h-8 w-8 text-xs" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-white truncate">{p.label}</div>
                        <div
                          className={`text-[10px] font-medium truncate ${
                            isSelected ? 'text-emerald-300' : 'text-slate-400'
                          }`}
                        >
                          {p.role}
                        </div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-300 flex-shrink-0" />}
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500 truncate">{p.email}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Authentication Form */}
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="rounded-lg border border-slate-800 bg-slate-900 p-6 space-y-4 text-xs"
        >
          {error && (
            <div className="flex flex-col gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-400">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleOpenForgotModal}
                  className="text-[11px] font-semibold text-rose-300 underline hover:text-white cursor-pointer"
                >
                  Need help recovering your password?
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-300">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={handleOpenForgotModal}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
              >
                Need password help?
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  selectedPersona
                    ? `Enter password for ${selectedPersona.label}`
                    : 'Enter your account password'
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-9 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Signing in...' : 'Sign in'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex items-center justify-between pt-2 text-xs">
            <div>
              <span className="text-slate-400">Need a new account? </span>
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="font-bold text-emerald-400 hover:underline cursor-pointer"
              >
                Register here
              </button>
            </div>
            <button
              type="button"
              onClick={handleOpenForgotModal}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Password help
            </button>
          </div>
        </form>
      </div>

      {/* Password recovery notice */}
      {isForgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4"
          onClick={() => setIsForgotOpen(false)}
        >
          <div
            className="relative my-auto w-full max-w-md rounded-lg border border-white/[0.12] bg-[#11151f] p-6 space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Password recovery</h3>
                <p className="text-[11px] text-slate-400">We can’t verify account ownership by email alone.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="leading-relaxed text-slate-300">
              Contact a workspace admin to regain access. If you’re signed in, change your password from
              Profile settings.
            </p>
            <div className="flex justify-end border-t border-white/[0.08] pt-3">
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
