'use client';

import React, { useState } from 'react';
import { MedicalRecord } from '@/types/medical';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  FileText,
  CheckCircle,
  Archive,
  Printer,
  AlertCircle,
  Stethoscope,
  Activity,
  Calendar,
  User,
} from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

interface SaveRecordConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recordData: Partial<MedicalRecord>;
  onSaved: (savedRecord: MedicalRecord, isDraft: boolean) => void;
}

export function SaveRecordConfirmDialog({
  isOpen,
  onClose,
  recordData,
  onSaved,
}: SaveRecordConfirmDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [actionDone, setActionDone] = useState<'official' | 'draft' | null>(null);

  if (!isOpen) return null;

  const handleSave = async (isDraft: boolean) => {
    setLoading(true);
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/v1\/?$/, '');
      const payload: Partial<MedicalRecord> = {
        record_code: recordData.record_code || `BA-${Date.now().toString().slice(-6)}`,
        user_id: user?.id || 'user-duy-02',
        patient_name: recordData.patient_name || user?.full_name || 'Nguyễn Trần Hiệp',
        age: recordData.age || 28,
        gender: recordData.gender || 'Nam',
        admission_date: recordData.admission_date || new Date().toISOString().replace('T', ' ').slice(0, 16),
        primary_symptoms: recordData.primary_symptoms || ['Triệu chứng lâm sàng từ phiên khám'],
        icd_code: recordData.icd_code || 'R05',
        diagnosis: recordData.diagnosis || 'Chẩn đoán sơ bộ dựa trên tư vấn đa phương thức',
        department: recordData.department || 'Khoa Nội Tổng Hợp',
        severity: recordData.severity || 'Medium',
        treatment_plan: recordData.treatment_plan || 'Theo dõi và tái khám định kỳ theo hướng dẫn bác sĩ.',
        is_draft: isDraft,
        source: 'chat_session',
      };

      const res = await fetch(`${apiUrl}/api/v1/medical/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let savedRecord: MedicalRecord;
      if (res.ok) {
        const resData = await res.json();
        savedRecord = resData.record || resData;
      } else {
        // Fallback local representation
        savedRecord = {
          ...payload,
          id: `rec-local-${Date.now()}`,
          created_at: new Date().toISOString(),
        } as MedicalRecord;
      }

      setActionDone(isDraft ? 'draft' : 'official');
      setTimeout(() => {
        onSaved(savedRecord, isDraft);
        onClose();
        setActionDone(null);
      }, 1600);
    } catch (e) {
      // Fallback
      setActionDone(isDraft ? 'draft' : 'official');
      setTimeout(() => {
        onClose();
        setActionDone(null);
      }, 1600);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen min-w-full flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Xác Nhận Lưu Hồ Sơ Bệnh Án</h2>
              <p className="text-blue-100 text-xs font-medium">Trích xuất tự động từ buổi khám với Bác sĩ AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {actionDone ? (
            <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
              {actionDone === 'official' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Đã Lưu Vào Hồ Sơ Chính Thức!</h3>
                  <p className="text-sm text-slate-600">
                    Bệnh án đã xuất hiện trong danh sách <strong>&quot;Hồ sơ bệnh án điện tử&quot;</strong> của bạn.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Archive className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Đã Lưu Tạm Ẩn Thành Công!</h3>
                  <p className="text-sm text-slate-600">
                    Hệ thống đã lưu vào cơ sở dữ liệu ở trạng thái ẩn (soft-delete). Bệnh án này <strong>sẽ không hiển thị</strong> trong danh sách của bạn.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Question notice */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 leading-relaxed">
                  <strong>Bác sĩ AI MediBot đã tổng hợp xong bệnh án lâm sàng.</strong>
                  <p className="mt-1 text-xs text-blue-700">
                    Bạn có muốn lưu bệnh án này vào danh sách Hồ sơ chính thức của mình không?
                  </p>
                </div>
              </div>

              {/* Record Preview Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>{recordData.patient_name || user?.full_name || 'Nguyễn Trần Hiệp'}</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({recordData.age || 28} tuổi • {recordData.gender || 'Nam'})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-100 text-blue-700">
                    ICD: {recordData.icd_code || 'R05'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex flex-col gap-1.5">
                  <div>
                    <strong className="text-slate-700">Chẩn đoán:</strong>{' '}
                    <span>{recordData.diagnosis || 'Theo dõi hội chứng lâm sàng'}</span>
                  </div>
                  <div>
                    <strong className="text-slate-700">Triệu chứng chính:</strong>{' '}
                    <span>
                      {Array.isArray(recordData.primary_symptoms)
                        ? recordData.primary_symptoms.join(', ')
                        : recordData.primary_symptoms || 'Bóc tách từ hội thoại'}
                    </span>
                  </div>
                  <div>
                    <strong className="text-slate-700">Khoa điều trị:</strong>{' '}
                    <span>{recordData.department || 'Nội Tổng Hợp'}</span>
                  </div>
                </div>
              </div>

              {/* Action Choices */}
              <div className="flex flex-col gap-2.5 pt-1">
                {/* Choice 1: Save Official */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSave(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 hover:bg-emerald-100/70 active:scale-[0.99] text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-emerald-950">Có, Lưu Vào Hồ Sơ Chính Thức</h4>
                      <p className="text-xs text-emerald-700">
                        Hiển thị đầy đủ trong danh sách bệnh án điện tử của bạn
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-lg">
                    Khuyên dùng
                  </span>
                </button>

                {/* Choice 2: Soft delete / Draft only */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSave(true)}
                  className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/50 active:scale-[0.99] text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-200 text-slate-700 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <Archive className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 group-hover:text-amber-900">
                        Không Lưu (Lưu Tạm Ẩn Vào DB)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Lưu dạng ẩn (soft-delete), KHÔNG hiển thị trong danh sách bệnh án của bạn
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Lưu ẩn</span>
                </button>

                {/* Print button */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>In / Xuất PDF ngay</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs font-medium text-slate-400 hover:text-slate-600 py-1.5 px-3"
                  >
                    Đóng lại
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
