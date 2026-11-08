'use client';

import React from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Clock,
  BarChart2,
  TrendingUp,
  FileSpreadsheet,
  ShieldAlert,
  Bot,
  BookOpen,
  Database,
  Activity
} from 'lucide-react';

export default function DashboardOverviewPage() {
  return (
    <div className="flex-1 p-6 lg:p-8 max-w-[1850px] w-full mx-auto space-y-6 select-none relative">
      {/* 1. Welcome Blue Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 rounded-3xl p-7 lg:p-9 text-white relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        {/* Decorative circle glow */}
        <div className="absolute -right-12 -top-12 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-2 z-10">
          <p className="text-sm md:text-base font-semibold text-blue-100 tracking-wide">
            Xin chào trở lại
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-[40px] font-extrabold tracking-tight flex items-center gap-2.5">
            <span>Nguyễn Trần Hiệp</span>
            <span className="inline-block animate-wave text-3xl md:text-4xl">👋</span>
          </h1>
          <p className="text-sm md:text-base text-blue-100/95 max-w-xl font-normal leading-relaxed">
            Hệ thống Trợ Lý Y Tế AI Đa Phương Thức chuẩn hóa Bộ Y Tế & CSDL ICD-10.
          </p>
        </div>

        {/* Right Metric Card */}
        <div className="z-10 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4.5 flex items-center space-x-4 shadow-2xs self-stretch md:self-auto justify-between md:justify-start">
          <div className="p-3 bg-white/20 rounded-xl">
            <Activity className="w-7 h-7 text-emerald-300 animate-pulse" />
          </div>
          <div>
            <p className="text-xs md:text-sm font-semibold text-blue-100">
              Độ chính xác chẩn đoán
            </p>
            <p className="text-3xl font-black text-white tracking-tight">
              98.5%
            </p>
          </div>
        </div>
      </div>

      {/* 2. Four Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {/* Stat Card 1: Nhóm bệnh học */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Stethoscope size={24} />
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black text-slate-800">32+</div>
            <div className="text-sm md:text-[15px] text-slate-600 font-bold mt-1">Nhóm bệnh ICD-10</div>
          </div>
        </div>

        {/* Stat Card 2: Chỉ số sinh hóa máu */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black text-slate-800">18</div>
            <div className="text-sm md:text-[15px] text-slate-600 font-bold mt-1">Chỉ số máu OCR</div>
          </div>
        </div>

        {/* Stat Card 3: Cảnh báo khẩn cấp */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black text-slate-800">≤ 0.5s</div>
            <div className="text-sm md:text-[15px] text-slate-600 font-bold mt-1">Phát hiện Red Flag 115</div>
          </div>
        </div>

        {/* Stat Card 4: Độ trễ phản hồi */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black text-slate-800">~20ms</div>
            <div className="text-sm md:text-[15px] text-slate-600 font-bold mt-1">Độ trễ Triage Cache</div>
          </div>
        </div>
      </div>

      {/* 3. Năng Lực Phân Tầng & Khám Bệnh Lâm Sàng Card */}
      <div className="bg-white rounded-2xl p-6 md:p-7 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2.5 text-slate-800 font-bold text-base md:text-lg">
          <BarChart2 size={22} className="text-blue-600" />
          <span>Năng Lực Phân Tầng & Khám Bệnh Lâm Sàng</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-center">
          <div className="py-2 md:py-0">
            <p className="text-3xl md:text-4xl font-black text-blue-600">100%</p>
            <p className="text-sm md:text-base text-slate-600 font-medium mt-1.5">Độ nhạy cấp cứu Red Flag</p>
          </div>
          <div className="py-2 md:py-0">
            <p className="text-3xl md:text-4xl font-black text-emerald-600">98.5%</p>
            <p className="text-sm md:text-base text-slate-600 font-medium mt-1.5">Độ chính xác Top-3 ICD-10</p>
          </div>
          <div className="py-2 md:py-0">
            <p className="text-3xl md:text-4xl font-black text-indigo-600">7+</p>
            <p className="text-sm md:text-base text-slate-600 font-medium mt-1.5">Kho CSDL Y tế chuẩn hóa</p>
          </div>
        </div>
      </div>

      {/* 4. Truy Cập Nhanh Card */}
      <div className="bg-white rounded-2xl p-6 md:p-7 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2.5 text-slate-800 font-bold text-base md:text-lg">
          <TrendingUp size={22} className="text-blue-600" />
          <span>Truy Cập Nhanh Chức Năng Lâm Sàng</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
          {/* Action 1: Khám bệnh với AI */}
          <Link
            href="/chat"
            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/70 hover:border-blue-200 transition group text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-xs group-hover:scale-105 transition">
              <Bot size={22} />
            </div>
            <span className="text-sm md:text-base font-bold text-slate-800 group-hover:text-blue-600">
              Khám Bệnh Với AI
            </span>
            <span className="text-xs text-slate-500 mt-1 font-normal">Đa tầng & Lập luận</span>
          </Link>

          {/* Action 2: Cấp cứu Red Flag 115 */}
          <Link
            href="/emergency"
            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-rose-50/70 hover:border-rose-200 transition group text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mb-3 shadow-xs group-hover:scale-105 transition">
              <ShieldAlert size={22} />
            </div>
            <span className="text-sm md:text-base font-bold text-slate-800 group-hover:text-rose-600">
              Cấp Cứu 115
            </span>
            <span className="text-xs text-slate-500 mt-1 font-normal">Dấu hiệu cờ đỏ & Sơ cứu</span>
          </Link>

          {/* Action 3: Phác đồ Bộ Y Tế */}
          <Link
            href="/protocols"
            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-emerald-50/70 hover:border-emerald-200 transition group text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-xs group-hover:scale-105 transition">
              <BookOpen size={22} />
            </div>
            <span className="text-sm md:text-base font-bold text-slate-800 group-hover:text-emerald-600">
              Phác Đồ Bộ Y Tế
            </span>
            <span className="text-xs text-slate-500 mt-1 font-normal">640+ Hướng dẫn lâm sàng</span>
          </Link>

          {/* Action 4: Tra Cứu ICD-10 */}
          <Link
            href="/lookup"
            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-indigo-50/70 hover:border-indigo-200 transition group text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-xs group-hover:scale-105 transition">
              <TrendingUp size={22} />
            </div>
            <span className="text-sm md:text-base font-bold text-slate-800 group-hover:text-indigo-600">
              Tra Cứu ICD-10
            </span>
            <span className="text-xs text-slate-500 mt-1 font-normal">211 Mã bệnh & Triệu chứng</span>
          </Link>

          {/* Action 5: Dược Thư & Thuốc */}
          <Link
            href="/drugs"
            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-amber-50/70 hover:border-amber-200 transition group text-center col-span-2 sm:col-span-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-3 shadow-xs group-hover:scale-105 transition">
              <Stethoscope size={22} />
            </div>
            <span className="text-sm md:text-base font-bold text-slate-800 group-hover:text-amber-600">
              Dược Thư & Thuốc
            </span>
            <span className="text-xs text-slate-500 mt-1 font-normal">Liều & Tương tác thuốc</span>
          </Link>
        </div>
      </div>

      {/* Floating Chat Button (Bottom Right Circle) */}
      <Link
        href="/chat"
        aria-label="Mở phòng khám AI"
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full shadow-lg shadow-blue-500/35 flex items-center justify-center z-50 transition-all hover:scale-105"
        title="Vào buồng khám MediBot AI"
      >
        <Stethoscope size={28} />
      </Link>
    </div>
  );
}
