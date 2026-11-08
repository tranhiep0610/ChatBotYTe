'use client';

import React from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  ShieldCheck,
  Activity,
  Zap,
  FileSpreadsheet,
  Volume2,
  BrainCircuit,
  FileText,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
  Clock,
  HeartPulse,
  Database,
  Lock,
  ChevronRight,
  Microscope,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { user, isAuthenticated, setIsAuthModalOpen } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 text-slate-900 flex flex-col select-none">
      {/* 1. TOP HERO HEADER */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-12 h-20 md:h-[84px] flex items-center justify-between transition-all">
        <Link href="/landing" className="flex items-center space-x-3 group">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200">
            <Stethoscope className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl md:text-[26px] font-black text-blue-600 tracking-tight leading-tight">
                Medi<span className="text-slate-900">Bot</span>
              </span>
              <span className="text-[11px] md:text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                AI Pro
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Chuẩn Hóa Bộ Y Tế & ICD-10
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-7 lg:space-x-9 text-[15px] font-semibold text-slate-600">
          <a href="#features" className="hover:text-blue-600 transition-colors py-1">Tính Năng AI</a>
          <a href="#pipeline" className="hover:text-blue-600 transition-colors py-1">Quy Trình Khám</a>
          <a href="#standards" className="hover:text-blue-600 transition-colors py-1">Chuẩn Bộ Y Tế</a>
          <Link href="/" className="hover:text-blue-600 transition-colors py-1">Dashboard Tổng Quan</Link>
          <Link href="/records" className="hover:text-blue-600 transition-colors py-1">Hồ Sơ Bệnh Án</Link>
        </div>

        {/* Right CTA */}
        <div className="flex items-center space-x-3.5">
          {isAuthenticated ? (
            <Link
              href="/chat"
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <HeartPulse className="w-5 h-5 text-emerald-300 animate-pulse" />
              <span>Vào Khám Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-[15px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Đăng Nhập
              </button>
              <Link
                href="/chat"
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Trải Nghiệm AI</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col items-center text-center space-y-8">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-400/20 via-indigo-400/20 to-teal-300/15 blur-3xl rounded-full pointer-events-none" />

        {/* Top Pills */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold tracking-wide shadow-2xs">
          <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
          <span>Hệ Thống Trợ Lý Y Tế AI Đa Phương Thức Thế Hệ 3.0</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-700">Online 24/7</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 max-w-4xl leading-[1.15]">
          Khám Bệnh & Phân Tầng Y Khoa{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
            Thông Minh Chuẩn Bộ Y Tế
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
          Tích hợp trí tuệ nhân tạo nhận diện giọng nói tự nhiên, bóc tách chỉ số xét nghiệm máu OCR,
          phân tầng bệnh học theo CSDL 211 mã ICD-10 và truy xuất 640 phác đồ điều trị Bộ Y Tế.
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/chat"
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow-lg shadow-blue-500/25 transition hover:scale-105 active:scale-95"
          >
            <Stethoscope className="w-5 h-5 text-emerald-300" />
            <span>Bắt Đầu Khám Ngay (Miễn Phí)</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/records"
            className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-base shadow-sm transition hover:border-slate-300"
          >
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Hồ Sơ Bệnh Án Điện Tử</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-sm transition"
          >
            <Activity className="w-5 h-5 text-teal-400" />
            <span>Trung Tâm Giám Sát AI</span>
          </Link>
        </div>

        {/* Metrics Grid Cards */}
        <div className="w-full pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl">
          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
            <span className="text-3xl lg:text-4xl font-black text-blue-600">211+</span>
            <span className="text-xs font-bold text-slate-700 mt-1">Mã Bệnh ICD-10</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Phân tầng bệnh học tự động</span>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
            <span className="text-3xl lg:text-4xl font-black text-emerald-600">640+</span>
            <span className="text-xs font-bold text-slate-700 mt-1">Phác Đồ Bộ Y Tế</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Truy xuất kiến thức Dense RAG</span>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
            <span className="text-3xl lg:text-4xl font-black text-rose-600">≤ 0.5s</span>
            <span className="text-xs font-bold text-slate-700 mt-1">Cảnh Báo Red Flag</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Cấp cứu 115 nguy kịch</span>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
            <span className="text-3xl lg:text-4xl font-black text-indigo-600">98.5%</span>
            <span className="text-xs font-bold text-slate-700 mt-1">Độ Chuẩn Xác Y Khoa</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Kiểm định bởi chuyên gia</span>
          </div>
        </div>
      </section>

      {/* 3. FOUR CORE AI CAPABILITIES */}
      <section id="features" className="py-16 bg-white border-y border-slate-200/80 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Công Nghệ Đột Phá
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              4 Trụ Cột Trí Tuệ Nhân Tạo Chuyên Biệt
            </h2>
            <p className="text-sm text-slate-500">
              Kết hợp hoàn hảo giữa xử lý ngôn ngữ tự nhiên tiếng Việt, thị giác máy tính và mô hình ngôn ngữ lớn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition">
                  <Volume2 size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  Nhận Diện Giọng Nói Tự Nhiên
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Công nghệ Faster-Whisper tối ưu riêng cho giọng nói tiếng Việt các vùng miền, chuyển lời kể bệnh thành văn bản lâm sàng chuẩn Unicode.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono font-bold text-blue-600">
                <span>Faster-Whisper STT</span>
                <span>~12ms</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-110 transition">
                  <FileSpreadsheet size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  OCR Phiếu Máu Tự Động
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bóc tách 18 chỉ số sinh hóa máu (WBC, RBC, HCT, PLT, Glucose, AST, ALT...) từ ảnh chụp phiếu xét nghiệm hoặc file PDF bệnh viện.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono font-bold text-amber-600">
                <span>PyMuPDF + EasyOCR</span>
                <span>18 Chỉ Số</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-rose-300 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-110 transition">
                  <Zap size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  PhoBERT NER & Red Flag
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Trích xuất thực thể y tế tiếng Việt sâu sắc (9 nhãn BIO), nhận diện phủ định loại trừ và cảnh báo dấu hiệu nguy kịch đe dọa tính mạng.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono font-bold text-rose-600">
                <span>vinai/phobert-base</span>
                <span>≤ 0.5s Cấp Cứu</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-110 transition">
                  <BrainCircuit size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  Suy Luận Lâm Sàng Gemini 2.0
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tổng hợp ngữ cảnh đa lượt (20 turns), đối chiếu phác đồ điều trị Bộ Y Tế và xuất bản bệnh án ngoại trú đầy đủ chỉ định cận lâm sàng.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono font-bold text-indigo-600">
                <span>gemini-2.0-flash + RAG</span>
                <span>Xuất PDF Chuẩn</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PATIENT JOURNEY FLOW */}
      <section id="pipeline" className="py-16 px-6 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Trải Nghiệm Đơn Giản
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Quy Trình Khám Bệnh 4 Bước Liền Mạch
          </h2>
          <p className="text-sm text-slate-500">
            Từ lúc chia sẻ cảm giác khó chịu đến khi nhận bệnh án hoàn chỉnh chỉ trong vài phút.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative space-y-3">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
              01
            </span>
            <h4 className="font-bold text-base text-slate-900">Mô Tả Triệu Chứng</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nhắn tin mô tả triệu chứng, gửi file ghi âm giọng nói hoặc tải ảnh chụp kết quả xét nghiệm máu.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative space-y-3">
            <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
              02
            </span>
            <h4 className="font-bold text-base text-slate-900">AI Bóc Tách & Triage</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mô hình bóc tách thực thể lâm sàng, nhận diện cờ đỏ cấp cứu và dự đoán top 3 mã bệnh ICD-10 tương ứng.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative space-y-3">
            <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold text-sm flex items-center justify-center">
              03
            </span>
            <h4 className="font-bold text-base text-slate-900">Tư Vấn & Hỏi Thăm</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bác sĩ AI ân cần đặt các câu hỏi làm rõ lâm sàng, trích dẫn phác đồ điều trị và chế độ dinh dưỡng an toàn.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative space-y-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center">
              04
            </span>
            <h4 className="font-bold text-base text-slate-900">Lưu Hồ Sơ & Xuất PDF</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tổng hợp toàn bộ buổi khám thành Bệnh Án Ngoại Trú điện tử, in hoặc xuất file PDF đưa cho bác sĩ xem.
            </p>
          </div>
        </div>

        {/* Big Banner CTA */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-8 lg:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-500/20">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Sẵn Sàng Chăm Sóc Sức Khỏe Cho Bạn & Gia Đình?
            </h3>
            <p className="text-sm text-blue-100/90 leading-relaxed">
              Trợ lý y tế AI túc trực 24/7, luôn lắng nghe và đưa ra lời khuyên y học khách quan, khoa học nhất.
            </p>
          </div>
          <Link
            href="/chat"
            className="px-8 py-4 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-base shadow-md transition hover:scale-105 active:scale-95 shrink-0 flex items-center gap-2"
          >
            <span>Bắt Đầu Khám Ngay</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* 5. MEDICAL DISCLAIMER & FOOTER */}
      <footer className="mt-auto bg-slate-900 text-white border-t border-slate-800 pt-12 pb-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            {/* Col 1 */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Stethoscope size={18} />
                </div>
                <span className="text-lg font-black text-white">MediBot AI</span>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Hệ thống Trợ Lý Y Tế AI Đa Phương Thức chuẩn hóa theo danh mục bệnh học ICD-10 và hướng dẫn chẩn đoán điều trị của Bộ Y Tế Việt Nam.
              </p>
            </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">Liên Kết Nhanh</h5>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li><Link href="/chat" className="hover:text-white transition">Phòng Khám AI</Link></li>
                <li><Link href="/" className="hover:text-white transition">Dashboard Tổng Quan</Link></li>
                <li><Link href="/records" className="hover:text-white transition">Hồ Sơ Bệnh Án</Link></li>
                <li><Link href="/admin" className="hover:text-white transition">Quản Trị Hệ Thống</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">Cấp Cứu 115</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Khi xuất hiện dấu hiệu nguy hiểm (đột quỵ, khó thở tím tái, đau thắt ngực), vui lòng gọi ngay cấp cứu y tế:
              </p>
              <a
                href="tel:115"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600/30 border border-rose-500 text-rose-300 text-xs font-bold font-mono"
              >
                <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                <span>HOTLINE CẤP CỨU: 115</span>
              </a>
            </div>
          </div>

          {/* Legal Disclaimer Warning */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Khuyến Cáo & Miễn Trừ Trách Nhiệm Y Tế: </strong>
              MediBot AI là công cụ hỗ trợ tham khảo lâm sàng và phân tầng ban đầu, không thay thế chẩn đoán hoặc chỉ định trực tiếp từ bác sĩ chuyên khoa. Trong các trường hợp cấp cứu đe dọa tính mạng, người bệnh phải đến cơ sở y tế gần nhất.
            </div>
          </div>

          {/* Copyright */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-4">
            <span>© 2026 MediBot AI - Multimodal Medical Assistant. All rights reserved.</span>
            <span>Bản quyền phát triển: Nguyễn Trần Hiệp & Nhóm Nghiên Cứu Y Tế Thông Minh</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
