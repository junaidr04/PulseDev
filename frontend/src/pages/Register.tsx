import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PulseBrandLogo } from '../components/Navbar';
import { Lock, Mail, User, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface RegisterProps {
  onNavigate: (route: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('developer');
  const [department, setDepartment] = useState('Engineering');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const roleTitleMap: Record<string, string> = {
        admin: 'Admin',
        lead: 'Team lead',
        developer: 'Developer',
        qa: 'QA',
        guest: 'Product Manager',
      };
      await register({
        name,
        email,
        password,
        role,
        department,
        title: roleTitleMap[role] || 'Software Engineer',
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950 p-6 overflow-y-auto">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.45, ease: 'easeOut' }}
        className="w-full max-w-md space-y-6"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-3">
            <PulseBrandLogo size="lg" />
          </div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Create an account</h2>
          <p className="text-xs text-slate-400 mt-1">Fill in your details to join the workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-800 bg-slate-900 p-6 space-y-4 text-xs">
          <AnimatePresence initial={false}>
          {error && (
            <motion.div
              key={error}
              initial={reducedMotion ? false : { opacity: 0, y: -4 }}
              animate={
                reducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, x: [0, -5, 5, -3, 3, 0] }
              }
              exit={{ opacity: 0, y: reducedMotion ? 0 : -3 }}
              transition={{ duration: reducedMotion ? 0 : 0.24, ease: 'easeOut' }}
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-400"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
          </AnimatePresence>

          <div>
            <label className="block font-medium text-slate-300">Name</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-white transition-colors duration-150 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@pulsedev.io"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-white transition-colors duration-150 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-9 py-2 text-white transition-colors duration-150 focus:border-emerald-500 focus:outline-none"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="developer">Developer</option>
                <option value="lead">Team lead</option>
                <option value="admin">Admin</option>
                <option value="qa">QA</option>
                <option value="guest">Product Manager</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Quality Assurance">QA</option>
                <option value="Product Strategy">Product Strategy</option>
              </select>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={reducedMotion || loading ? undefined : { y: -1 }}
            whileTap={reducedMotion || loading ? undefined : { scale: 0.985 }}
            transition={{ duration: reducedMotion ? 0 : 0.14, ease: 'easeOut' }}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-emerald-700 py-2.5 font-medium text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Creating account...' : 'Create account'}</span>
            <ArrowRight className="h-4 w-4" />
          </motion.button>

          <div className="text-center pt-2">
            <span className="text-slate-400">Already registered? </span>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="font-bold text-emerald-400 hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
