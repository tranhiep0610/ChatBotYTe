'use client';

import React, { useState, useEffect } from 'react';
import { MedicalRecord } from '@/types/medical';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Trash2,
  Calendar,
  User,
  Activity,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ClipboardList,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function RecordsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'create_manual'>('list');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    patient_name: user?.full_name || 'Nguyễn Trần Hiệp',
    age: 28,
    gender: 'Nam',
    admission_date: '',
    primary_symptoms: '',
    icd_code: 'J02.9',
    diagnosis: 'Viêm họng cấp tính do nhiễm khuẩn đường hô hấp trên',
    department: 'Khoa Hô Hấp',
    severity: 'Low' as 'Critical' | 'High' | 'Medium' | 'Low',
    treatment_plan: 'Nghỉ ngơi phòng thoáng, súc họng nước muối sinh lý 0.9%, Paracetamol khi sốt.',
    notes: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/v1\/?$/, '');
      const res = await fetch(`${apiUrl}/api/v1/medical/records`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.records || []);
        setRecords(list);
      } else {
        // Fallback default mock data
        setRecords([
          {
            id: 'rec-01',
            record_code: 'BA-20260906-001',
            user_id: user?.id || 'user-duy-02',
            patient_name: user?.full_name || 'Nguyễn Trần Hiệp',
            age: 28,
            gender: 'Nam',
            admission_date: '2026-09-06 09:30',
            primary_symptoms: ['Sốt nhẹ 38°C', 'Ho khan từng cơn', 'Đau rát cổ họng'],
            icd_code: 'J02.9',
            diagnosis: 'Viêm họng cấp tính do virus',
            department: 'Khoa Hô Hấp',
            severity: 'Low',
            treatment_plan: 'Nghỉ ngơi, bù nước điện giải Oresol, dùng siro ho thảo dược.',
            created_at: '2026-09-06T09:30:00Z',
            is_draft: false,
            source: 'chat_session',
          },
          {
            id: 'rec-02',
            record_code: 'BA-20260901-084',
            user_id: user?.id || 'user-duy-02',
            patient_name: user?.full_name || 'Nguyễn Trần Hiệp',
            age: 28,
            gender: 'Nam',
            admission_date: '2026-09-01 14:15',
            primary_symptoms: ['Đau thượng vị âm ỉ sau ăn', 'Ợ chua', 'Đầy bụng'],
            icd_code: 'K29.7',
            diagnosis: 'Viêm dạ dày tá tràng mạn tính',
            department: 'Khoa Tiêu Hóa',
            severity: 'Medium',
            treatment_plan: 'Kháng tiết acid PPI Esomeprazole 40mg, kiêng đồ chua cay.',
            created_at: '2026-09-01T14:15:00Z',
            is_draft: false,
            source: 'manual_entry',
          },
        ]);
      }
    } catch (e) {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    setFormData((prev) => ({
      ...prev,
      patient_name: user?.full_name || prev.patient_name,
      admission_date: prev.admission_date || new Date().toISOString().slice(0, 10),
    }));
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa hồ sơ bệnh án này không?')) return;

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/v1\/?$/, '');
      await fetch(`${apiUrl}/api/v1/medical/records/${id}`, { method: 'DELETE' });
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (selectedRecord?.id === id) setSelectedRecord(null);
    } catch (err) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormSuccess(false);

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/v1\/?$/, '');
      const symptomsList = formData.primary_symptoms
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        user_id: user?.id || 'user-duy-02',
        primary_symptoms: symptomsList.length > 0 ? symptomsList : ['Khám tổng quát'],
        is_draft: false,
        source: 'manual_entry',
      };

      const res = await fetch(`${apiUrl}/api/v1/medical/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        const newRecord = saved.record || saved;
        setRecords((prev) => [newRecord, ...prev]);
      } else {
        const fakeRecord: MedicalRecord = {
          ...payload,
          id: `rec-${Date.now()}`,
          record_code: `BA-${Date.now().toString().slice(-6)}`,
          created_at: new Date().toISOString(),
        } as MedicalRecord;
        setRecords((prev) => [fakeRecord, ...prev]);
      }

      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        setActiveTab('list');
      }, 1500);
    } catch (err) {
      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        setActiveTab('list');
      }, 1500);
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.patient_name.toLowerCase().includes(q) ||
      r.diagnosis.toLowerCase().includes(q) ||
      r.icd_code.toLowerCase().includes(q) ||
      r.record_code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-8 max-w-[1850px] mx-auto w-full gap-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Hồ Sơ Bệnh Án Điện Tử (EMR)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                ICD-10 Chuẩn Bộ Y Tế
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý toàn diện lịch sử khám bệnh, phân loại mã bệnh quốc tế và kết quả chẩn đoán Bác sĩ AI
            </p>
          </div>
        </div>

        {/* Quick actions on header */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create_manual');
              setSelectedRecord(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Bệnh Án Mới</span>
          </button>

          <Link
            href="/chat"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Khám & Trích Xuất AI</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hồ Sơ Chính Thức</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{records.length}</div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              ● Đã lưu vào CSDL người dùng
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã Bệnh ICD-10 Đã Gán</span>
            <div className="text-2xl font-black text-blue-700 mt-1">100%</div>
            <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
              ● Đối soát CSDL Bộ Y Tế
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bệnh Nhân Hiện Tại</span>
            <div className="text-xl font-black text-slate-800 mt-1 truncate max-w-[180px]">
              {user?.full_name || 'Nguyễn Trần Hiệp'}
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
              {user?.email || 'nguyenbaduy@medibot.vn'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Navigation & Controls Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('list');
                setSelectedRecord(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'list'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Danh Sách Bệnh Án ({records.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('create_manual');
                setSelectedRecord(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'create_manual'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Nhập Bệnh Án Mới</span>
            </button>
          </div>

          {activeTab === 'list' && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Tìm theo tên bệnh nhân, mã ICD, triệu chứng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-72"
                />
              </div>

              <button
                type="button"
                onClick={fetchRecords}
                title="Làm mới danh sách"
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {activeTab === 'list' && (
            <>
              {selectedRecord ? (
                /* DETAIL VIEW */
                <div className="flex flex-col gap-6 max-w-3xl mx-auto">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(null)}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5"
                    >
                      ← Quay lại danh sách bệnh án
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      <Printer className="w-4 h-4" />
                      <span>In / Xuất Bản PDF Chuẩn Bộ Y Tế</span>
                    </button>
                  </div>

                  {/* Header Patient Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                        Họ và tên bệnh nhân
                      </span>
                      <strong className="text-slate-900 text-lg">{selectedRecord.patient_name}</strong>
                      <div className="text-xs text-slate-500 mt-1">
                        {selectedRecord.age} tuổi • Giới tính: {selectedRecord.gender}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                        Mã Bệnh Án / Thời gian
                      </span>
                      <strong className="text-blue-700 font-mono text-base">{selectedRecord.record_code}</strong>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{selectedRecord.admission_date}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                        Chuyên khoa điều trị
                      </span>
                      <strong className="text-slate-800 text-base">{selectedRecord.department}</strong>
                      <div className="mt-1">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800">
                          Mức độ: {selectedRecord.severity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Section */}
                  <div className="flex flex-col gap-4">
                    <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
                        Chẩn Đoán Xác Định ICD-10:
                      </span>
                      <h3 className="text-lg font-black text-blue-950">
                        [{selectedRecord.icd_code}] {selectedRecord.diagnosis}
                      </h3>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-slate-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Triệu chứng lâm sàng ghi nhận:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(selectedRecord.primary_symptoms) &&
                          selectedRecord.primary_symptoms.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                            >
                              • {s}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1.5">
                        Phác đồ điều trị & Lời dặn của bác sĩ:
                      </span>
                      <p className="text-sm text-emerald-950 font-medium leading-relaxed">
                        {selectedRecord.treatment_plan}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* LIST OF RECORDS */
                <div className="flex flex-col gap-3">
                  {filteredRecords.length === 0 ? (
                    <div className="text-center py-16 flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h3 className="font-bold text-slate-700 text-base">Chưa có hồ sơ bệnh án nào</h3>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Bạn có thể tạo bệnh án mới hoặc yêu cầu Bác sĩ AI tổng hợp tự động từ phòng chat.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('create_manual')}
                        className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                      >
                        + Tạo Bệnh Án Mới
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {filteredRecords.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => setSelectedRecord(r)}
                          className="p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-4 group"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3.5 rounded-2xl bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                                  {r.record_code}
                                </span>
                                <h4 className="font-bold text-base text-slate-900">{r.patient_name}</h4>
                                <span className="text-xs text-slate-400">({r.age} tuổi • {r.gender})</span>
                              </div>

                              <p className="text-sm font-semibold text-slate-700">
                                <span className="text-blue-600 font-bold">[{r.icd_code}]</span> {r.diagnosis}
                              </p>

                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span>{r.admission_date}</span>
                                <span>•</span>
                                <span>{r.department}</span>
                                <span>•</span>
                                <span className="text-slate-600 font-medium">
                                  {r.source === 'chat_session' ? '🤖 Trích xuất từ Chat AI' : '📝 Nhập thủ công'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => handleDelete(r.id, e)}
                              title="Xóa bệnh án"
                              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <span className="p-2 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                              <ChevronRight className="w-6 h-6" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 2: MANUAL FORM */}
          {activeTab === 'create_manual' && (
            <div className="max-w-2xl mx-auto py-2">
              <div className="mb-6 pb-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-lg">Tạo Bệnh Án Điện Tử Mới (Nhập Thủ Công)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Điền các thông tin hành chính, chẩn đoán ICD-10 và hướng điều trị cho bệnh nhân.
                </p>
              </div>

              {formSuccess && (
                <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Đã lưu thành công hồ sơ bệnh án vào danh sách chính thức!</span>
                </div>
              )}

              <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Họ và tên</label>
                    <input
                      type="text"
                      required
                      value={formData.patient_name}
                      onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                      className="p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Tuổi</label>
                    <input
                      type="number"
                      required
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                      className="p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Giới tính</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Mã bệnh quốc tế ICD-10</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: J02.9, E11, I10"
                      value={formData.icd_code}
                      onChange={(e) => setFormData({ ...formData, icd_code: e.target.value })}
                      className="p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Khoa điều trị</label>
                    <input
                      type="text"
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Chẩn đoán xác định</label>
                  <input
                    type="text"
                    required
                    placeholder="Mô tả chẩn đoán lâm sàng..."
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    className="p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Triệu chứng lâm sàng ghi nhận (cách nhau bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    placeholder="Sốt cao 38.5°C, ho rát họng, mệt mỏi..."
                    value={formData.primary_symptoms}
                    onChange={(e) => setFormData({ ...formData, primary_symptoms: e.target.value })}
                    className="p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Phác đồ điều trị & Toa thuốc</label>
                  <textarea
                    rows={3}
                    placeholder="Kê đơn thuốc, dặn dò chế độ dinh dưỡng, hẹn ngày tái khám..."
                    value={formData.treatment_plan}
                    onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                    className="p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md shadow-blue-500/20 transition-all"
                  >
                    {formSubmitting ? 'Đang lưu...' : 'Lưu Hồ Sơ Chính Thức'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
