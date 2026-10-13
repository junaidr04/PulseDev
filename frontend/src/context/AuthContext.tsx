import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { emitInstantNotification, triggerNotificationRefresh } from '../utils/notificationBus';

export interface ImpersonatorInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'lead' | 'developer' | 'qa' | 'guest';
  avatar: string;
  title: string;
  department: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  permissions?: string[];
  impersonatedBy?: ImpersonatorInfo | null;
}

export type IntroPhase = 'none' | 'welcome' | 'pulse';

const USER_STORAGE_KEY = 'pulsedev_current_user';

function loadStoredUser(): User | null {
  if (sessionStorage.getItem('pulsedev_explicit_logout') === 'true') {
    return null;
  }
  const token = localStorage.getItem('pulsedev_jwt_token');
  const rawUser = localStorage.getItem(USER_STORAGE_KEY);
  if (!token || !rawUser) return null;
  try {
    const storedUser = JSON.parse(rawUser) as User & { passwordLabel?: string };
    if (storedUser.passwordLabel) {
      delete storedUser.passwordLabel;
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedUser));
    }
    return storedUser;
  } catch {
    return null;
  }
}

function saveStoredUser(u: User | null): void {
  try {
    if (!u) {
      localStorage.removeItem(USER_STORAGE_KEY);
    } else {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
    }
  } catch {
    // ignore storage errors
  }
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  introPhase: IntroPhase;
  welcomeSplashUser: User | null;
  dismissWelcomeSplash: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
  updateOwnProfile: (
    updates: Partial<{ name: string; title: string; department: string; status: string }>
  ) => Promise<void>;
  startImpersonation: (targetUserId: string, reason: string) => Promise<void>;
  exitImpersonation: () => Promise<void>;
  tokenDetails: any | null;
  inspectCurrentToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => loadStoredUser());
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem('pulsedev_explicit_logout') === 'true'
      ? null
      : localStorage.getItem('pulsedev_jwt_token')
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tokenDetails, setTokenDetails] = useState<any | null>(null);

  const [introPhase, setIntroPhase] = useState<IntroPhase>('none');
  const [welcomeSplashUser, setWelcomeSplashUser] = useState<User | null>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearIntroTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const dismissWelcomeSplash = () => {
    clearIntroTimers();
    setWelcomeSplashUser(null);
    setIntroPhase('none');
  };

  const startLoginSequence = (loggedUser: User) => {
    clearIntroTimers();
    setWelcomeSplashUser(loggedUser);
    setIntroPhase('welcome');

    const welcomeTimer = setTimeout(() => {
      setIntroPhase('pulse');
    }, 1400);
    const pulseTimer = setTimeout(() => {
      setWelcomeSplashUser(null);
      setIntroPhase('none');
    }, 2900);

    timersRef.current.push(welcomeTimer, pulseTimer);
  };

  useEffect(() => {
    return () => clearIntroTimers();
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (sessionStorage.getItem('pulsedev_explicit_logout') === 'true') {
        return;
      }

      const storedToken = localStorage.getItem('pulsedev_jwt_token');
      if (storedToken) {
        try {
          const res = await api.auth.getProfile();
          if (res.success && res.user) {
            setUser(res.user);
            saveStoredUser(res.user);
            setToken(storedToken);
            return;
          }
        } catch {
          localStorage.removeItem('pulsedev_jwt_token');
          saveStoredUser(null);
          setUser(null);
          setToken(null);
        }
      }
    };

    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password);
      if (res.success && res.token) {
        sessionStorage.removeItem('pulsedev_explicit_logout');
        localStorage.setItem('pulsedev_jwt_token', res.token);
        saveStoredUser(res.user);
        setToken(res.token);
        setUser(res.user);
        startLoginSequence(res.user);
        emitInstantNotification({
          title: 'Member Signed In',
          message: `${res.user.name} (${res.user.role.toUpperCase()}) signed in to the workspace.`,
          type: 'auth',
          actorName: res.user.name,
          actorAvatar: res.user.avatar,
        });
        triggerNotificationRefresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(userData);
      if (res.success && res.token) {
        sessionStorage.removeItem('pulsedev_explicit_logout');
        localStorage.setItem('pulsedev_jwt_token', res.token);
        saveStoredUser(res.user);
        setToken(res.token);
        setUser(res.user);
        startLoginSequence(res.user);
        emitInstantNotification({
          title: 'New Member Registered',
          message: `${res.user.name} joined as ${res.user.role.toUpperCase()} (${res.user.department}).`,
          type: 'auth',
          actorName: res.user.name,
          actorAvatar: res.user.avatar,
        });
        triggerNotificationRefresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    clearIntroTimers();
    setWelcomeSplashUser(null);
    setIntroPhase('none');
    try {
      await api.auth.logout();
    } catch {
      // Proceed with local cleanup even if network call fails
    }
    sessionStorage.setItem('pulsedev_explicit_logout', 'true');
    localStorage.removeItem('pulsedev_jwt_token');
    saveStoredUser(null);
    setToken(null);
    setUser(null);
    setTokenDetails(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<string> => {
    const res = await api.auth.changePassword(currentPassword, newPassword);
    triggerNotificationRefresh();
    return res.message || 'Password changed successfully.';
  };

  const updateOwnProfile = async (
    updates: Partial<{ name: string; title: string; department: string; status: string }>
  ) => {
    if (!user?._id) return;
    const res = await api.auth.updateProfile(user._id, updates);
    if (res.success && res.user) {
      setUser((prev) => {
        const nextUser = prev
          ? {
              ...prev,
              ...res.user,
              impersonatedBy: prev.impersonatedBy || null,
            }
          : res.user;
        saveStoredUser(nextUser);
        return nextUser;
      });
    }
  };

  const startImpersonation = async (targetUserId: string, reason: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.impersonateUser(targetUserId, reason);
      if (res.success && res.token && res.user) {
        localStorage.setItem('pulsedev_jwt_token', res.token);
        saveStoredUser(res.user);
        setToken(res.token);
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const exitImpersonation = async () => {
    setIsLoading(true);
    try {
      const res = await api.auth.exitImpersonation();
      if (res.success && res.token && res.user) {
        localStorage.setItem('pulsedev_jwt_token', res.token);
        saveStoredUser(res.user);
        setToken(res.token);
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inspectCurrentToken = async () => {
    if (!token) return;
    try {
      const res = await api.auth.inspectToken(token);
      if (res.success) {
        setTokenDetails(res);
      }
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        introPhase,
        welcomeSplashUser,
        dismissWelcomeSplash,
        login,
        register,
        logout,
        changePassword,
        updateOwnProfile,
        startImpersonation,
        exitImpersonation,
        tokenDetails,
        inspectCurrentToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
