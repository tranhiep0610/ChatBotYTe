'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  ShieldCheck,
  User,
  LogIn,
  KeyRound,
  Mail,
  AlertCircle,
  CheckCircle2,
  Phone,
  Smartphone,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Lock,
  HeartHandshake
} from 'lucide-react';

import { ModalPortal } from '../common/ModalPortal';

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, login, sendOtp, verifyOtp, quickLoginAs } = useAuth();
  
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');
  
  // Password login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP login state
  const [otpTarget, setOtpTarget] = useState('0988 123 456');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [demoOtpCode, setDemoOtpCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  
  // Feedback state
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isAuthModalOpen) return null;

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await sendOtp(otpTarget);
      if (res.success) {
        setOtpStep('verify');
        setDemoOtpCode(res.demoCode || '888666');
        setCountdown(60);
        setSuccessMsg(res.message);
        // Focus first OTP input
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi gửi mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredCode = otpDigits.join('');
    if (enteredCode.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã OTP xác thực');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await verifyOtp(otpTarget, enteredCode);
      if (res.success) {
        setSuccessMsg('Xác thực OTP thành công! Đang chuyển tiếp vào hệ thống...');
        setTimeout(() => {
          setIsAuthModalOpen(false);
          resetForm();
        }, 600);
      } else {
        setError(res.message || 'Mã OTP không chính xác');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi xác thực mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Auto fill demo OTP
  const handleFillDemoOtp = () => {
    if (demoOtpCode && demoOtpCode.length === 6) {
      const chars = demoOtpCode.split('');
      setOtpDigits(chars);
      setError(null);
    }
  };

  // Handle single OTP digit input
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric characters
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);

    // Auto advance focus to next input
    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste full OTP code
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || '';
      }
      setOtpDigits(newDigits);
      if (pastedData.length === 6) {
        otpInputRefs.current[5]?.focus();
      }
    }
  };

  // Handle Backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        setIsAuthModalOpen(false);
        resetForm();
      } else {
        setError(res.message || 'Đăng nhập thất bại.');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setOtpDigits(['', '', '', '', '', '']);
    setOtpStep('request');
    setError(null);
    setSuccessMsg(null);
    setDemoOtpCode(null);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen min-w-full flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden flex flex-col my-auto">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-6 text-white">
          <button
            type="button"
            onClick={() => {
              setIsAuthModalOpen(false);
              resetForm();
            }}
            className="absolute top-5 right-5 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-xl shadow-inner border border-white/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>Cổng Đăng Nhập An Toàn</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-500/80 text-white font-black">
                  Bảo Mật OTP
                </span>
              </h2>
              <p className="text-blue-100 text-xs font-medium mt-0.5">
                Xác thực danh tính y tế chuẩn Bộ Y Tế & CSDL Quốc Gia
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-5 max-h-[82vh] overflow-y-auto custom-scrollbar">
          {/* Quick Login Role Cards */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Đăng nhập nhanh (Mẫu trải nghiệm):</span>
              <span className="text-blue-600 font-normal">1-Click Login</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* User Account */}
              <button
                type="button"
                onClick={() => quickLoginAs('user')}
                className="group flex flex-col items-start p-3 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 transition-all text-left"
              >
                <div className="flex items-center gap-2 mb-1 w-full">
                  <div className="p-1 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700 truncate">
                    Nguyễn Trần Hiệp
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 truncate w-full">0988 123 456 · Bệnh nhân</span>
                <span className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                  CCCD: 001098012345
                </span>
              </button>

              {/* Admin Account */}
              <button
                type="button"
                onClick={() => quickLoginAs('admin')}
                className="group flex flex-col items-start p-3 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 transition-all text-left"
              >
                <div className="flex items-center gap-2 mb-1 w-full">
                  <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 truncate">
                    BS. CKII Nguyễn Văn Hùng
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 truncate w-full">admin@medibot.vn · Trưởng khoa</span>
                <span className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  Quyền Toàn Hệ Thống
                </span>
              </button>
            </div>
          </div>

          {/* Auth Method Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('otp');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMethod === 'otp'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Đăng Nhập Bằng OTP (Khuyên dùng)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMethod === 'password'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Mật Khẩu & Tài Khoản</span>
            </button>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: OTP AUTHENTICATION FLOW */}
          {authMethod === 'otp' && (
            <div className="space-y-4">
              {otpStep === 'request' ? (
                /* Step 1: Input Phone or Email to get OTP */
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Số điện thoại hoặc Email nhận mã OTP</span>
                      <span className="text-[11px] text-blue-600 font-normal">SMS / Zalo / Email</span>
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={otpTarget}
                        onChange={(e) => setOtpTarget(e.target.value)}
                        placeholder="0988 123 456 hoặc user@medibot.vn"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-800 leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Hệ thống tự động cấp mã OTP 6 số an toàn để xác nhận chủ thể hồ sơ y tế mà không cần ghi nhớ mật khẩu phức tạp.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !otpTarget.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Đang gửi mã...' : 'Nhận Mã Xác Thực OTP (6 Số)'}</span>
                  </button>
                </form>
              ) : (
                /* Step 2: Enter 6-digit OTP code */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      Mã gửi đến: <strong className="text-slate-900 font-mono">{otpTarget}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep('request');
                        setOtpDigits(['', '', '', '', '', '']);
                        setError(null);
                      }}
                      className="text-blue-600 hover:underline font-semibold text-[11px]"
                    >
                      Đổi số khác
                    </button>
                  </div>

                  {/* 6 OTP Boxes */}
                  <div className="flex items-center justify-between gap-2" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className={`w-12 h-14 text-center text-xl font-bold font-mono rounded-xl border-2 transition-all focus:outline-none ${
                          digit
                            ? 'border-blue-600 bg-blue-50/40 text-blue-900'
                            : 'border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Demo Code Auto Fill Helper */}
                  {demoOtpCode && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-900">
                          Mã Thử Nghiệm
                        </span>
                        <span className="font-mono font-black tracking-widest text-sm">{demoOtpCode}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleFillDemoOtp}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition shadow-2xs"
                      >
                        Điền Nhanh
                      </button>
                    </div>
                  )}

                  {/* Resend button with countdown */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">Chưa nhận được mã?</span>
                    {countdown > 0 ? (
                      <span className="text-slate-400 font-mono text-[11px]">
                        Gửi lại sau <strong>{countdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="text-blue-600 hover:underline font-bold text-xs"
                      >
                        Gửi lại mã OTP
                      </button>
                    )}
                  </div>

                  {/* Submit OTP */}
                  <button
                    type="submit"
                    disabled={loading || otpDigits.join('').length < 6}
                    className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Đang xác thực...' : 'Xác Nhận & Đăng Nhập'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: PASSWORD LOGIN */}
          {authMethod === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Email đăng nhập</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@medibot.vn hoặc nguyenbaduy@medibot.vn"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Mật khẩu</label>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin123 hoặc duy123"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Đang kiểm tra...' : 'Đăng Nhập Bằng Mật Khẩu'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
