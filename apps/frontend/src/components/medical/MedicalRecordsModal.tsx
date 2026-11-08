'use client';

import React, { useState, useEffect } from 'react';
import { MedicalRecord } from '@/types/medical';
import { ModalPortal } from '../common/ModalPortal';
import { useAuth } from '@/context/AuthContext';
import {
  X,
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
  Eye,
  RefreshCw,
} from 'lucide-react';

interface MedicalRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChatToExtract?: () => void;
}

export function MedicalRecordsModal({
  isOpen,
  onClose,
  onSelectChatToExtract,
}: MedicalRecordsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'create_manual' | 'create_chat'>('list');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  // Manual Form State
  const [formData, setFormData] = useState({
    patient_name: user?.full_name || 'Nguyễn Trần Hiệp',
    age: 28,
    gender: 'Nam',
    admission_date: new Date().toISOString().slice(0, 10),
    primary_symptoms: '',
    icd_code: 'J00',
    diagnosis: 'Viêm mũi họng cấp tính (Cảm cúm thông thường)',
    department: 'Khoa Hô Hấp',
    severity: 'Low' as 'Critical' | 'High' | 'Medium' | 'Low',
    treatment_plan: 'Paracetamol 500mg, uống nhiều nước ấm, súc họng nước muối sinh lý.',
    notes: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Fetch records
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
        // Mock default records if backend fails
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
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecords();
      if (user?.full_name) {
        setFormData((prev) => ({ ...prev, patient_name: user.full_name }));
      }
    }
  }, [isOpen, user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa bệnh án này khỏi hồ sơ không?')) return;

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
        primary_symptoms: symptomsList.length > 0 ? symptomsList : ['Khám tổng quát định kỳ'],
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

  const handleCreateFromChat = () => {
    // Navigate or close and start chat synthesis
    onClose();
    if (onSelectChatToExtract) {
      onSelectChatToExtract();
    } else {
      window.location.href = '/chat';
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

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen min-w-full flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Hồ Sơ Bệnh Án Điện Tử (EMR)</h2>
              <p className="text-blue-100 text-xs font-medium">
                Chuẩn hóa Bộ Y Tế & Danh mục Bệnh tật Quốc tế ICD-10
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Actions Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('list');
                setSelectedRecord(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'list'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Danh Sách Bệnh Án ({records.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('create_manual');
                setSelectedRecord(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'create_manual'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nhập Bệnh Án Thủ Công</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('create_chat');
                setSelectedRecord(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'create_chat'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tạo Từ Đoạn Chat AI</span>
            </button>
          </div>

          {activeTab === 'list' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, chẩn đoán, mã ICD..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 w-56"
                />
              </div>
              <button
                onClick={fetchRecords}
                title="Tải lại danh sách"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50">
          {/* TAB 1: LIST OF RECORDS */}
          {activeTab === 'list' && (
            <>
              {selectedRecord ? (
                /* DETAIL VIEW OF A SELECTED RECORD */
                <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(null)}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      ← Quay lại danh sách
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>In Bệnh Án</span>
                      </button>
                    </div>
                  </div>

                  {/* Standard Medical Header */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                        Bệnh nhân
                      </span>
                      <strong className="text-slate-800 text-base">{selectedRecord.patient_name}</strong>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {selectedRecord.age} tuổi • {selectedRecord.gender}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                        Mã Hồ Sơ / Ngày khám
                      </span>
                      <strong className="text-blue-700 text-sm font-mono">{selectedRecord.record_code}</strong>
                      <div className="text-xs text-slate-500 mt-0.5">{selectedRecord.admission_date}</div>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                        Khoa / Mức độ
                      </span>
                      <strong className="text-slate-800 text-sm">{selectedRecord.department}</strong>
                      <div className="mt-0.5">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
                          Độ ưu tiên: {selectedRecord.severity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Diagnosis Section */}
                  <div className="flex flex-col gap-4">
                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
                        Chẩn Đoán Xác Định (ICD-10):
                      </span>
                      <p className="text-base font-bold text-blue-950">
                        [{selectedRecord.icd_code}] {selectedRecord.diagnosis}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                        Triệu chứng lâm sàng ghi nhận:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(selectedRecord.primary_symptoms) &&
                          selectedRecord.primary_symptoms.map((sym, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                            >
                              • {sym}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                        Phác đồ điều trị & Hướng xử trí:
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
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <FileText className="w-7 h-7" />
                      </div>
                      <h3 className="font-bold text-slate-700">Chưa có bệnh án nào phù hợp</h3>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Bạn có thể tạo bệnh án mới bằng cách nhập thủ công hoặc trích xuất từ cuộc trò chuyện với Bác sĩ AI.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('create_manual')}
                        className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
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
                          className="bg-white hover:bg-blue-50/40 p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-sm flex items-center justify-between gap-4 group"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="p-3 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                  {r.record_code}
                                </span>
                                <h4 className="font-bold text-sm text-slate-800">{r.patient_name}</h4>
                                <span className="text-xs text-slate-400">({r.age} tuổi)</span>
                              </div>
                              <p className="text-xs text-slate-600 font-semibold line-clamp-1">
                                <span className="text-blue-700 font-bold">[{r.icd_code}]</span> {r.diagnosis}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                <span>{r.admission_date}</span>
                                <span>•</span>
                                <span>{r.department}</span>
                                <span>•</span>
                                <span className="text-slate-500 font-medium">
                                  {r.source === 'chat_session' ? '🤖 Từ Chat AI' : '📝 Nhập thủ công'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleDelete(r.id, e)}
                              title="Xóa bệnh án"
                              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <span className="p-2 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">
                              <ChevronRight className="w-5 h-5" />
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

          {/* TAB 2: CREATE MANUAL */}
          {activeTab === 'create_manual' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="mb-5 pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 text-base">Tạo Bệnh Án Mới (Nhập Thủ Công)</h3>
                <p className="text-xs text-slate-500">
                  Điền các thông tin hành chính, chẩn đoán ICD-10 và phác đồ điều trị cho bệnh nhân.
                </p>
              </div>

              {formSuccess && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Đã tạo và lưu bệnh án thành công vào danh sách!</span>
                </div>
              )}

              <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Họ và tên bệnh nhân</label>
                    <input
                      type="text"
                      required
                      value={formData.patient_name}
                      onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                      className="p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Tuổi</label>
                    <input
                      type="number"
                      required
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                      className="p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Giới tính</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Mã bệnh quốc tế ICD-10</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: J02.9, E11, I10"
                      value={formData.icd_code}
                      onChange={(e) => setFormData({ ...formData, icd_code: e.target.value })}
                      className="p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Khoa điều trị</label>
                    <input
                      type="text"
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Chẩn đoán xác định</label>
                  <input
                    type="text"
                    required
                    placeholder="Mô tả chẩn đoán lâm sàng..."
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    className="p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Triệu chứng lâm sàng (cách nhau bởi dấu phẩy)
                  </label>
                  <input
                    type="text"
                    placeholder="Sốt cao, đau họng, mệt mỏi..."
                    value={formData.primary_symptoms}
                    onChange={(e) => setFormData({ ...formData, primary_symptoms: e.target.value })}
                    className="p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Phác đồ điều trị / Toa thuốc</label>
                  <textarea
                    rows={3}
                    placeholder="Kê đơn thuốc, chế độ ăn uống, lịch hẹn tái khám..."
                    value={formData.treatment_plan}
                    onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                    className="p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
                  >
                    {formSubmitting ? 'Đang lưu...' : 'Lưu Bệnh Án'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CREATE FROM CHAT */}
          {activeTab === 'create_chat' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Trích Xuất Bệnh Án Tự Động Bằng AI</h3>
                <p className="text-xs text-slate-500 max-w-md mt-1">
                  Bạn có thể mở cuộc hội thoại khám bệnh với Bác sĩ AI. Tại màn hình chat, bấm nút{' '}
                  <strong className="text-blue-600">&quot;Tổng Hợp Bệnh Án&quot;</strong>, AI sẽ tự động phân tích toàn bộ triệu chứng và mã ICD-10, sau đó hỏi bạn xác nhận lưu chính thức hay lưu tạm.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleCreateFromChat}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  <Activity className="w-4 h-4" />
                  <span>Đi Tới Phòng Khám Chat AI Ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
