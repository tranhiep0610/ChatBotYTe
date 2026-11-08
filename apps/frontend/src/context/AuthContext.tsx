'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '@/types/medical';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  sendOtp: (target: string) => Promise<{ success: boolean; message: string; demoCode?: string }>;
  verifyOtp: (target: string, code: string) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (updatedData: Partial<AuthUser>) => Promise<{ success: boolean; message?: string }>;
  quickLoginAs: (role: 'admin' | 'user') => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
}

const DEFAULT_USER: AuthUser = {
  id: 'user-duy-02',
  email: 'nguyenbaduy@medibot.vn',
  full_name: 'Nguyễn Trần Hiệp',
  role: 'user',
  phone: '0988 123 456',
  date_of_birth: '1998-05-15',
  gender: 'Nam',
  citizen_id: '001098012345',
  address: 'Số 54 Triều Khúc, Thanh Xuân, Hà Nội',
  health_insurance_number: 'DN4010123456789',
  blood_type: 'O+',
  allergies: 'Dị ứng Penicillin, Tôm cua biển',
  medical_history: 'Viêm xoang sàng mãn tính, Tiền sử đau dạ dày HP (-)',
  emergency_contact_name: 'Nguyễn Văn An (Bố đẻ)',
  emergency_contact_phone: '0912 345 678',
};

const ADMIN_USER: AuthUser = {
  id: 'admin-01',
  email: 'admin@medibot.vn',
  full_name: 'BS. CKII Nguyễn Văn Hùng',
  role: 'admin',
  phone: '0909 888 999',
  date_of_birth: '1982-11-20',
  gender: 'Nam',
  citizen_id: '001082098765',
  address: 'Bệnh viện Đa khoa Trung ương, Hà Nội',
  health_insurance_number: 'GD4010998877665',
  blood_type: 'A+',
  allergies: 'Không có dị ứng thuốc đã biết',
  medical_history: 'Không có bệnh lý nền',
  emergency_contact_name: 'Trần Thị Mai (Vợ)',
  emergency_contact_phone: '0903 112 233',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [activeOtps, setActiveOtps] = useState<Record<string, string>>({
    'admin@medibot.vn': '888666',
    'nguyenbaduy@medibot.vn': '666888',
    '0988123456': '666888',
    '0909888999': '888666'
  });

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('medibot_auth_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.warn('Could not read auth user from localStorage', e);
      setUser(null);
    }
  }, []);

  // Standard password login
  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    
    if (cleanEmail === 'admin@medibot.vn') {
      if (password === 'admin123') {
        setUser(ADMIN_USER);
        localStorage.setItem('medibot_auth_user', JSON.stringify(ADMIN_USER));
        return { success: true };
      } else {
        return { success: false, message: 'Mật khẩu quản trị viên không chính xác (Gợi ý: admin123)' };
      }
    }

    if (cleanEmail === 'nguyenbaduy@medibot.vn') {
      if (password === 'duy123') {
        setUser(DEFAULT_USER);
        localStorage.setItem('medibot_auth_user', JSON.stringify(DEFAULT_USER));
        return { success: true };
      } else {
        return { success: false, message: 'Mật khẩu không chính xác (Gợi ý: duy123)' };
      }
    }

    // Dynamic user registration on login
    if (password.length >= 4) {
      const newUser: AuthUser = {
        id: `user-${Date.now().toString().slice(-4)}`,
        email: cleanEmail,
        full_name: cleanEmail.split('@')[0],
        role: 'user',
        gender: 'Chưa xác định',
        date_of_birth: '1995-01-01',
        citizen_id: '001095' + Math.floor(100000 + Math.random() * 900000),
        address: 'Việt Nam',
        blood_type: 'Chưa xác định',
      };
      setUser(newUser);
      localStorage.setItem('medibot_auth_user', JSON.stringify(newUser));
      return { success: true };
    }

    return { success: false, message: 'Vui lòng nhập mật khẩu tối thiểu 4 ký tự' };
  };

  // Generate & Send OTP for 2FA or Phone/Email login
  const sendOtp = async (target: string): Promise<{ success: boolean; message: string; demoCode?: string }> => {
    const cleanTarget = target.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanTarget) {
      return { success: false, message: 'Vui lòng nhập số điện thoại hoặc email hợp lệ' };
    }

    // Generate random 6-digit OTP
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setActiveOtps(prev => ({ ...prev, [cleanTarget]: generatedCode }));

    return {
      success: true,
      message: `Mã xác nhận OTP y tế 6 chữ số đã được gửi tới ${cleanTarget}.`,
      demoCode: generatedCode
    };
  };

  // Verify OTP code
  const verifyOtp = async (target: string, code: string): Promise<{ success: boolean; message?: string }> => {
    const cleanTarget = target.trim().toLowerCase().replace(/\s+/g, '');
    const cleanCode = code.trim();

    const expectedCode = activeOtps[cleanTarget];

    // Check against expected code or master bypass for smooth UX
    const isMasterCode = cleanCode === '888666' || cleanCode === '666888' || cleanCode === '123456';
    const isMatched = expectedCode && expectedCode === cleanCode;

    if (isMasterCode || isMatched) {
      // Determine which user to log in as
      if (cleanTarget.includes('admin') || cleanTarget === '0909888999') {
        setUser(ADMIN_USER);
        localStorage.setItem('medibot_auth_user', JSON.stringify(ADMIN_USER));
      } else {
        const loggedUser: AuthUser = {
          ...DEFAULT_USER,
          email: cleanTarget.includes('@') ? cleanTarget : DEFAULT_USER.email,
          phone: !cleanTarget.includes('@') ? cleanTarget : DEFAULT_USER.phone,
        };
        setUser(loggedUser);
        localStorage.setItem('medibot_auth_user', JSON.stringify(loggedUser));
      }
      return { success: true };
    }

    return { success: false, message: 'Mã xác thực OTP không chính xác hoặc đã hết hạn. Vui lòng thử lại.' };
  };

  // Update Medical Profile
  const updateProfile = async (updatedData: Partial<AuthUser>): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      return { success: false, message: 'Chưa có phiên đăng nhập của người dùng.' };
    }

    const updatedUser: AuthUser = {
      ...user,
      ...updatedData
    };

    setUser(updatedUser);
    localStorage.setItem('medibot_auth_user', JSON.stringify(updatedUser));
    return { success: true, message: 'Hồ sơ y tế cá nhân đã được cập nhật thành công!' };
  };

  const quickLoginAs = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setUser(ADMIN_USER);
      localStorage.setItem('medibot_auth_user', JSON.stringify(ADMIN_USER));
    } else {
      setUser(DEFAULT_USER);
      localStorage.setItem('medibot_auth_user', JSON.stringify(DEFAULT_USER));
    }
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('medibot_auth_user');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        sendOtp,
        verifyOtp,
        updateProfile,
        quickLoginAs,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
