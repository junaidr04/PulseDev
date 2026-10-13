import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Shield,
  Users,
  Settings,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
  Lock,
  Mail,
  Briefcase,
  Building2,
  LogIn,
  KeyRound,
  AlertCircle,
} from 'lucide-react';

const FALLBACK_TEAM = [
  {
    _id: '66a1bf9823e4d5c6b7a89001',
    name: 'Alex Chen',
    email: 'alex.chen@pulsedev.io',
    role: 'admin',
    title: 'Principal Systems Architect',
    department: 'Platform Engineering',
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80',
  },
  {
    _id: '66a1bf9823e4d5c6b7a89002',
    name: 'Priya Patel',
    email: 'priya.patel@pulsedev.io',
    role: 'lead',
    title: 'Staff Backend Lead',
    department: 'Cloud Services',
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=128&h=128&q=80',
  },
  {
    _id: '66a1bf9823e4d5c6b7a89003',
    name: 'Marcus Vance',
    email: 'marcus.vance@pulsedev.io',
    role: 'developer',
    title: 'Senior Engineer',
    department: 'Product Features',
    status: 'away',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80',
  },
  {
    _id: '66a1bf9823e4d5c6b7a89004',
    name: 'Sophia Laurent',
    email: 'sophia.laurent@pulsedev.io',
    role: 'qa',
    title: 'Staff QA Automation Lead',
    department: 'Quality Assurance',
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=128&h=128&q=80',
  },
  {
    _id: '66a1bf9823e4d5c6b7a89005',
    name: 'Jordan Blake',
    email: 'jordan.blake@pulsedev.io',
    role: 'guest',
    title: 'Product Manager',
    department: 'Product Strategy',
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&h=128&q=80',
  },
];

interface ProfileProps {
  onNavigate?: (route: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate }) => {
  const { user, updateOwnProfile, logout, changePassword } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>(FALLBACK_TEAM);
  const [activeTab, setActiveTab] = useState<'directory' | 'settings'>(() => {
    const saved = sessionStorage.getItem('pulsedev_profile_tab');
    return saved === 'settings' ? 'settings' : 'directory';
  });

  // Read-only selected team member public profile
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Self profile settings state
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [titleInput, setTitleInput] = useState(user?.title || '');
  const [departmentInput, setDepartmentInput] = useState(user?.department || '');
  const [statusInput, setStatusInput] = useState<string>(user?.status || 'online');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  // Change / Reset Password State
  const passwordSectionRef = useRef<HTMLDivElement>(null);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const refreshTeamDirectory = () => {
    api.auth
      .getTeamMembers()
      .then((res) => {
        if (res.success && Array.isArray(res.users) && res.users.length > 0) {
          setTeamMembers(res.users);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    setNameInput(user?.name || '');
    setTitleInput(user?.title || '');
    setDepartmentInput(user?.department || '');
    setStatusInput(user?.status || 'online');
  }, [user]);

  useEffect(() => {
    const handleTabEvent = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail === 'settings' || custom.detail === 'directory') {
        setActiveTab(custom.detail);
      } else if (custom.detail === 'password') {
        setActiveTab('settings');
        setTimeout(() => {
          passwordSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    };
    window.addEventListener('pulsedev:profile-tab', handleTabEvent);
    return () => window.removeEventListener('pulsedev:profile-tab', handleTabEvent);
  }, []);

  useEffect(() => {
    refreshTeamDirectory();
  }, []);

  const handleInspectMemberProfile = async (member: any) => {
    setSelectedMemberProfile(member);
    if (!member?._id) return;
    setLoadingProfile(true);
    try {
      const res = await api.auth.getTeamMemberProfile(member._id);
      if (res.success && res.profile) {
        setSelectedMemberProfile(res.profile);
      }
    } catch {
      // Keep basic directory profile if offline
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSwitchToMemberLogin = async (targetEmail: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sessionStorage.setItem('pulsedev_prefill_login_email', targetEmail);
    await logout();
    onNavigate?.('login');
  };

  const handleSaveOwnSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsFeedback(null);
    try {
      await updateOwnProfile({
        name: nameInput.trim(),
        title: titleInput.trim(),
        department: departmentInput.trim(),
        status: statusInput,
      });
      setSettingsFeedback('Your profile settings have been saved.');
      refreshTeamDirectory();
    } catch (err: any) {
      setSettingsFeedback(err.message || 'Failed to update profile.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassInput.trim().length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassInput.trim() !== confirmPassInput.trim()) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      if (!currentPassInput.trim()) {
        setPasswordError('Please enter your current password.');
        setSavingPassword(false);
        return;
      }
      const msg = await changePassword(currentPassInput.trim(), newPassInput.trim());
      setPasswordSuccess(msg);
      setCurrentPassInput('');
      setNewPassInput('');
      setConfirmPassInput('');
      refreshTeamDirectory();
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const userPermissions = user?.permissions || ['profile.read', 'team.read'];
  const currentSelfMember = teamMembers.find(
    (m) => m.email?.toLowerCase() === user?.email?.toLowerCase()
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b0c0e] px-6 py-7 pb-24">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-white/[0.07] pb-5">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Profile, Security & Team Directory
            </h1>
            <p className="text-[13px] text-neutral-400 mt-1">
              Authenticated member profile, password management, RBAC permissions, and employee directory.
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#111317] p-1">
            <button
              onClick={() => {
                setActiveTab('directory');
                sessionStorage.setItem('pulsedev_profile_tab', 'directory');
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-white/[0.1] text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span>Team Directory</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                sessionStorage.setItem('pulsedev_profile_tab', 'settings');
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white/[0.1] text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Settings className="h-3.5 w-3.5 text-cyan-400" />
              <span>Profile & Password</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Active Authenticated User Card */}
          <div className="lg:col-span-4 rounded-xl border border-white/[0.07] bg-[#111317] p-5 space-y-5 h-fit">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                Authenticated Identity
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                <Lock className="h-2.5 w-2.5" />
                Verified JWT
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80'
                }
                alt={user?.name || 'Member'}
                className="h-14 w-14 rounded-xl object-cover border border-white/[0.1]"
              />
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-white truncate">
                  {user?.name || 'Alex Chen'}
                </h3>
                <p className="text-xs text-neutral-400 truncate">
                  {user?.email || 'alex.chen@pulsedev.io'}
                </p>
                <span className="mt-1 inline-block rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-mono text-neutral-300 capitalize">
                  Role: {user?.role === 'guest' ? 'Product Manager' : user?.role || 'admin'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/[0.07] text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Title</span>
                <span className="text-neutral-200 font-medium">{user?.title || 'Engineer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Department</span>
                <span className="text-neutral-200 font-medium">{user?.department || 'Engineering'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Status</span>
                <span className="text-emerald-400 font-mono text-[11px] capitalize">
                  {user?.status || 'online'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('settings');
                sessionStorage.setItem('pulsedev_profile_tab', 'settings');
                setTimeout(() => {
                  passwordSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Change Password</span>
            </button>

            {/* Active RBAC Permissions */}
            <div className="pt-4 border-t border-white/[0.07] space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-300">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>Granted RBAC Permissions</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {userPermissions.map((perm) => (
                  <span
                    key={perm}
                    className="rounded border border-white/[0.08] bg-[#0c0e13] px-2 py-0.5 font-mono text-[10px] text-neutral-300"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Team Directory OR Profile & Password Settings */}
          <div className="lg:col-span-8 space-y-6">
            {activeTab === 'directory' ? (
              <div className="rounded-xl border border-white/[0.07] bg-[#111317] overflow-hidden">
                <div className="border-b border-white/[0.07] px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-semibold text-white">
                      Team Directory ({teamMembers.length})
                    </h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Each role has its own unique password. Click any employee to view their profile or switch accounts.
                    </p>
                  </div>
                  <span className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-neutral-400">
                    Role-based credentials
                  </span>
                </div>

                <div className="divide-y divide-white/[0.06]">
                  {teamMembers.map((member) => {
                    const isSelf = member.email === user?.email;
                    const isSelected = selectedMemberProfile?.email === member.email;

                    return (
                      <button
                        key={member._id || member.email}
                        type="button"
                        onClick={() => handleInspectMemberProfile(member)}
                        className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors cursor-pointer ${
                          isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="h-9 w-9 rounded-full object-cover flex-shrink-0 border border-white/[0.08]"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-neutral-100 truncate">
                                {member.name}
                              </span>
                              {isSelf && (
                                <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] font-mono text-emerald-300">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-400 truncate">
                              {member.title}
                            </div>
                            <div className="text-[11px] text-neutral-500 truncate">
                              {member.department} · {member.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                          <span className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] font-mono text-neutral-300 capitalize">
                            {member.role === 'guest' ? 'PM' : member.role}
                          </span>
                          {!isSelf && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => handleSwitchToMemberLogin(member.email, e)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  handleSwitchToMemberLogin(member.email);
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                              title={`Log in as ${member.name}`}
                            >
                              <LogIn className="h-3 w-3" />
                              <span>Log in</span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-emerald-400 font-medium">
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Profile</span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Card 1: Profile Details */}
                <div className="rounded-xl border border-white/[0.07] bg-[#111317] p-5">
                  <div className="border-b border-white/[0.07] pb-3.5 mb-4">
                    <h3 className="text-sm font-semibold text-white">Account & Profile Settings</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Update your personal workspace profile details and availability status.
                    </p>
                  </div>

                  <form onSubmit={handleSaveOwnSettings} className="space-y-4 text-xs">
                    {settingsFeedback && (
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span>{settingsFeedback}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          className="w-full rounded-lg border border-white/[0.1] bg-[#0c0e13] px-3 py-2 text-white focus:border-emerald-400/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">
                          Email Address (Verified Identity)
                        </label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full rounded-lg border border-white/[0.06] bg-[#090b10] px-3 py-2 text-neutral-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">Job Title</label>
                        <input
                          type="text"
                          value={titleInput}
                          onChange={(e) => setTitleInput(e.target.value)}
                          className="w-full rounded-lg border border-white/[0.1] bg-[#0c0e13] px-3 py-2 text-white focus:border-emerald-400/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">Department</label>
                        <input
                          type="text"
                          value={departmentInput}
                          onChange={(e) => setDepartmentInput(e.target.value)}
                          className="w-full rounded-lg border border-white/[0.1] bg-[#0c0e13] px-3 py-2 text-white focus:border-emerald-400/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">
                          Availability Status
                        </label>
                        <select
                          value={statusInput}
                          onChange={(e) => setStatusInput(e.target.value)}
                          className="w-full rounded-lg border border-white/[0.1] bg-[#0c0e13] px-3 py-2 text-white focus:border-emerald-400/50 focus:outline-none"
                        >
                          <option value="online">Online</option>
                          <option value="away">Away</option>
                          <option value="busy">Busy</option>
                          <option value="offline">Offline</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">RBAC Role</label>
                        <input
                          type="text"
                          value={user?.role === 'guest' ? 'PRODUCT MANAGER' : user?.role || 'developer'}
                          disabled
                          className="w-full rounded-lg border border-white/[0.06] bg-[#090b10] px-3 py-2 font-mono text-neutral-500 uppercase cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2 text-xs font-semibold text-[#090b10] hover:opacity-95 transition-opacity cursor-pointer"
                      >
                        {savingSettings ? 'Saving...' : 'Save profile changes'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Card 2: Change Password & Forgot Password Recovery */}
                <div
                  ref={passwordSectionRef}
                  className="rounded-xl border border-white/[0.07] bg-[#111317] p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.07] pb-3.5 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Password & Account Security
                        </h3>
                        <p className="text-xs text-neutral-400">
                          Confirm your current password before choosing a new one.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
                    {passwordSuccess && (
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}

                    {passwordError && (
                      <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-rose-300">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    <div>
                      <label className="mb-1 block font-medium text-neutral-300">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          required
                          value={currentPassInput}
                          onChange={(e) => setCurrentPassInput(e.target.value)}
                          placeholder="Enter your current password"
                          className="w-full rounded-lg border border-white/[0.1] bg-[#0c0e13] pl-9 pr-9 py-2 text-white focus:border-emerald-400/50 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          aria-label={showCurrentPass ? 'Hide current password' : 'Show current password'}
                          className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                        >
                          {showCurrentPass ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={newPassInput}
                            onChange={(e) => setNewPassInput(e.target.value)}
                            placeholder="Minimum 6 characters..."
                            className="w-full rounded-lg border border-white/[0.1] bg-[#0c0e13] pl-9 pr-9 py-2 text-white focus:border-emerald-400/50 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                          >
                            {showNewPass ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={confirmPassInput}
                            onChange={(e) => setConfirmPassInput(e.target.value)}
                            placeholder="Confirm new password..."
                            className="w-full rounded-lg border border-white/[0.1] bg-[#0c0e13] pl-9 pr-9 py-2 text-white focus:border-emerald-400/50 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                          >
                            {showConfirmPass ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2 text-xs font-semibold text-[#090b10] hover:opacity-95 transition-opacity cursor-pointer"
                      >
                        {savingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Selected Team Member Public Profile Drawer/Card */}
            {selectedMemberProfile && (
              <div className="rounded-xl border border-emerald-500/25 bg-[#11151f] p-5 shadow-xl animate-modal-pop">
                <div className="flex items-start justify-between border-b border-white/[0.07] pb-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={selectedMemberProfile.avatar}
                      alt={selectedMemberProfile.name}
                      className="h-12 w-12 rounded-xl object-cover border border-white/[0.12]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">
                          {selectedMemberProfile.name}
                        </h4>
                        <span className="rounded border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-emerald-300 capitalize">
                          {selectedMemberProfile.role === 'guest'
                            ? 'Product Manager'
                            : selectedMemberProfile.role}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 mt-0.5">
                        {selectedMemberProfile.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedMemberProfile.email !== user?.email && (
                      <button
                        type="button"
                        onClick={() => handleSwitchToMemberLogin(selectedMemberProfile.email)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 px-3 py-1.5 text-xs font-semibold text-[#090b10] hover:opacity-95 transition-opacity cursor-pointer"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        <span>Log in as {selectedMemberProfile.name.split(' ')[0]}</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedMemberProfile(null)}
                      className="text-neutral-400 hover:text-white p-1 cursor-pointer"
                      aria-label="Close member profile"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
                  <div className="rounded-lg border border-white/[0.06] bg-[#0c0e14] p-3">
                    <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                      <Mail className="h-3.5 w-3.5" />
                      <span>Email</span>
                    </div>
                    <div className="mt-1 font-medium text-neutral-200 truncate">
                      {selectedMemberProfile.email}
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-[#0c0e14] p-3">
                    <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Department</span>
                    </div>
                    <div className="mt-1 font-medium text-neutral-200">
                      {selectedMemberProfile.department}
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-[#0c0e14] p-3">
                    <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>Assigned Sprint Tasks</span>
                    </div>
                    <div className="mt-1 font-mono font-semibold text-emerald-400">
                      {loadingProfile
                        ? '...'
                        : selectedMemberProfile.assignedTaskCount ??
                          (selectedMemberProfile.assignedTasks?.length || 0)}
                    </div>
                  </div>
                </div>

                {Array.isArray(selectedMemberProfile.assignedTasks) &&
                  selectedMemberProfile.assignedTasks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/[0.07]">
                      <div className="text-[11px] font-semibold text-neutral-400 mb-2">
                        Active Assigned Issues
                      </div>
                      <div className="space-y-1.5">
                        {selectedMemberProfile.assignedTasks.map((t: any) => (
                          <div
                            key={t._id}
                            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0c0e14] px-3 py-2 text-xs"
                          >
                            <span className="text-neutral-200 truncate">{t.title}</span>
                            <span className="font-mono text-[10px] text-neutral-400 uppercase ml-2">
                              {(t.column || '').replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
