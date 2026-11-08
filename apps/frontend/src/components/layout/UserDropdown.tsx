'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  User,
  Settings,
  MessageSquareHeart,
  FileText,
  LogOut,
  LogIn,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Sparkles,
  CreditCard,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { SettingsModal } from '../settings/SettingsModal';
import { FeedbackModal } from '../feedback/FeedbackModal';
import { MedicalRecordsModal } from '../medical/MedicalRecordsModal';
import { AuthModal } from '../auth/AuthModal';
import { UserProfileModal } from '../profile/UserProfileModal';

export function UserDropdown() {
  const {
    user,
    isAuthenticated,
    isAdmin,
    logout,
    setIsAuthModalOpen,
    setIsProfileModalOpen,
    quickLoginAs
  } = useAuth();
  const { fontSizeScale, setFontSizeScale } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isRecordsOpen, setIsRecordsOpen] = useState(false);
  const [isConfirmLogout, setIsConfirmLogout] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.full_name || 'Khách vãng lai';
  const displayEmail = user?.email || 'Chưa đăng nhập';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* User Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-2xl border transition-all text-left group ${
            isOpen
              ? 'bg-blue-50/80 border-blue-400 shadow-sm'
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
          }`}
        >
          {/* Avatar with status indicator */}
          <div className="relative">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner text-white ${
                isAdmin
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 ring-2 ring-emerald-300'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 ring-2 ring-blue-200'
              }`}
            >
              {initials || <User className="w-4 h-4" />}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                isAuthenticated ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
          </div>

          {/* User Text */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors max-w-[120px] truncate">
                {displayName}
              </span>
              {isAdmin ? (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Admin
                </span>
              ) : (
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Bệnh nhân
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-mono tracking-tight max-w-[120px] truncate">
              {displayEmail}
            </span>
          </div>

          {/* Chevron */}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : 'group-hover:text-slate-600'
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Header profile info */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 rounded-t-xl">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white ${
                    isAdmin
                      ? 'bg-emerald-600'
                      : 'bg-blue-600'
                  }`}
                >
                  {initials || <User className="w-5 h-5" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-slate-900">{displayName}</span>
                  <span className="text-xs text-slate-500 truncate">{displayEmail}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
                    {isAdmin ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Quản Trị Viên (Toàn quyền)</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3 h-3 text-blue-600" />
                        <span>Người dùng / Bệnh nhân</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1.5">
              {/* Option 0: Medical Profile (CCCD, Ngày sinh, Giới tính, BHYT) */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-blue-50/90 hover:text-blue-700 transition-colors text-left group"
              >
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 group-hover:text-blue-700">Hồ sơ cá nhân & CCCD</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded">
                      Y Tế
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">
                    CCCD {user?.citizen_id ? `···${user.citizen_id.slice(-4)}` : 'chưa có'} · {user?.gender || 'Nam'} · {user?.blood_type || 'O+'}
                  </span>
                </div>
              </button>

              {/* Option 1: Settings */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50/80 hover:text-blue-700 transition-colors text-left"
              >
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                  <Settings className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">Cài đặt hệ thống</span>
                  <span className="text-[11px] text-slate-400 font-normal">Tùy chỉnh chi tiết & tính năng</span>
                </div>
              </button>

              {/* Quick Font Size Switcher */}
              <div className="mx-3 my-1 p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Cỡ chữ hiển thị:
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 font-mono">
                    {fontSizeScale === 'sm' ? 'Nhỏ (13.5px)' : fontSizeScale === 'md' ? 'Chuẩn (16px)' : 'To rõ (20px)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setFontSizeScale('sm')}
                    className={`py-1 text-xs rounded-lg font-bold border transition ${
                      fontSizeScale === 'sm'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    A- Nhỏ
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSizeScale('md')}
                    className={`py-1 text-xs rounded-lg font-bold border transition ${
                      fontSizeScale === 'md'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    A Chuẩn
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSizeScale('lg')}
                    className={`py-1 text-xs rounded-lg font-bold border transition ${
                      fontSizeScale === 'lg'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    A+ To
                  </button>
                </div>
              </div>

              {/* Option 2: Feedback */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsFeedbackOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50/80 hover:text-emerald-700 transition-colors text-left"
              >
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                  <MessageSquareHeart className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">Báo cáo & Góp ý</span>
                  <span className="text-[11px] text-slate-400 font-normal">Đóng góp chất lượng chẩn đoán AI & lỗi</span>
                </div>
              </button>

              {/* Option 3: Medical Records */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsRecordsOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50/80 hover:text-indigo-700 transition-colors text-left"
              >
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">Hồ sơ bệnh án của tôi</span>
                  <span className="text-[11px] text-slate-400 font-normal">Xem và quản lý hồ sơ ICD-10</span>
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 my-1" />

            {/* Fast Role Switch for testing */}
            <div className="px-4 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Chuyển nhanh vai trò thử nghiệm:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    quickLoginAs('user');
                    setIsOpen(false);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                    !isAdmin && isAuthenticated
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  👤 Nguyễn Trần Hiệp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    quickLoginAs('admin');
                    setIsOpen(false);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                    isAdmin
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🛡️ Admin
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 my-1" />

            {/* Auth Action: Logout with Confirmation */}
            <div className="px-2 py-1">
              {isAuthenticated ? (
                !isConfirmLogout ? (
                  <button
                    type="button"
                    onClick={() => setIsConfirmLogout(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng Xuất Khỏi Tài Khoản</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Xác nhận đăng xuất?</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsConfirmLogout(false)}
                        className="flex-1 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsConfirmLogout(false);
                          setIsOpen(false);
                        }}
                        className="flex-1 py-1 rounded-lg text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition shadow-2xs"
                      >
                        Đăng Xuất
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors text-left"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Tài Khoản</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Embedded Modals */}
      <UserProfileModal />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <MedicalRecordsModal isOpen={isRecordsOpen} onClose={() => setIsRecordsOpen(false)} />
      <AuthModal />
    </>
  );
}
