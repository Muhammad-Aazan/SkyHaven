import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StoragePlan } from '../types';
import { authApi, usersApi, storageApi } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<{ email: string; tempToken: string; otpResent: boolean }>;
  verifyOtp: (email: string, otp: string) => Promise<{ verified: boolean; verificationToken: string }>;
  completeSignup: (name: string, email: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  switchPlan: (planId: 'pro' | 'business') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.data) setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setUser(res.data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await authApi.signup({ name, email, password }) as any;
    return { email: res.data.email, tempToken: res.data.tempToken, otpResent: Boolean(res.otpResent) };
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await authApi.verifyOtp(email, otp);
    return {
      verified: Boolean(res.data?.verified),
      verificationToken: res.data?.verificationToken || '',
    };
  };

  const completeSignup = async (name: string, email: string, verificationToken: string) => {
    setIsLoading(true);
    try {
      // Prefer the real verificationToken from verify-otp (stored in sessionStorage)
      const realToken = sessionStorage.getItem('sky_vtoken') || verificationToken;
      sessionStorage.removeItem('sky_vtoken');
      const res = await authApi.completeSignup({ name, email, verificationToken: realToken });
      setUser(res.data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    const res = await usersApi.updateProfile(updates);
    setUser(res.data);
  };

  const switchPlan = async (planId: 'pro' | 'business') => {
    const res = await storageApi.startCheckout(planId);
    await refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        verifyOtp,
        completeSignup,
        logout,
        updateUser,
        switchPlan,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
