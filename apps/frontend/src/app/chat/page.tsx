'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from '../../hooks/useChat';
import { ChatBox } from '../../components/chat/ChatBox';
import { SymptomList } from '../../components/dashboard/SymptomList';
import { LabResultsWidget } from '../../components/dashboard/LabResultsWidget';
import { ProbabilityChart } from '../../components/dashboard/ProbabilityChart';
import { ClarificationWidget } from '../../components/dashboard/ClarificationWidget';
import { RagCitationsWidget } from '../../components/dashboard/RagCitationsWidget';
import { RedFlagModal } from '../../components/emergency/RedFlagModal';
import { MedicalRecordModal } from '../../components/medical/MedicalRecordModal';
import { SaveRecordConfirmDialog } from '../../components/medical/SaveRecordConfirmDialog';
import { ModalPortal } from '../../components/common/ModalPortal';
import { useAuth } from '@/context/AuthContext';
import { OCRResult } from '../../types/medical';
import {
  Activity,
  ShieldCheck,
  Key,
  Sparkles,
  Check,
  Stethoscope,
  PlusCircle,
  History,
  FileText,
  Copy,
  Printer,
  Trash2,
  X,
  MessageSquare,
  Clock,
  Loader2,
  Download,
  Square,
  FileCode
} from 'lucide-react';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const { user, isAdmin } = useAuth();

  const {
    sessions,
    sessionId,
    createNewSession,
    loadSession,
    deleteSession,
    messages,
    telemetry,
    isProcessing,
    isConnected,
    isEmergencyModalOpen,
    setIsEmergencyModalOpen,
    sendMessage,
    cancelQuery,
    setTelemetry,
    generateMedicalRecord,
    exportSessionAuditJson,
    setActiveAnswerIndex,
    submitFeedback,
  } = useChat();

  const [mounted, setMounted] = useState<boolean>(false);
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [keySaved, setKeySaved] = useState<boolean>(false);

  // History Drawer State
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);

  // Medical Record Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
  const [medicalRecordText, setMedicalRecordText] = useState<string>('');
  const [isGeneratingRecord, setIsGeneratingRecord] = useState<boolean>(false);
  const [recordCopied, setRecordCopied] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('gemini_api_key') || '';
    setGeminiKey(saved);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (mode === 'record') {
        handleOpenMedicalRecord();
      } else if (mode === 'emergency') {
        setIsEmergencyModalOpen(true);
      }
    }
  }, [mode, mounted]);

  const handleSaveKey = () => {
    localStorage.setItem('gemini_api_key', geminiKey.trim());
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setIsKeyModalOpen(false);
    }, 1200);
  };

  const handleOCRComplete = (ocrResult: OCRResult, fileName: string) => {
    const indicatorsCount = ocrResult.total_indicators_found;
    const labEntries = Object.entries(ocrResult.parsed_indicators || {});
    
    let userPrompt = '';
    if (indicatorsCount > 0) {
      const labDetails = labEntries
        .map(([k, v]) => `${k}: ${v.value} ${v.unit || ''}`)
        .join(', ');
      userPrompt = `Tôi vừa tải lên phiếu xét nghiệm [${fileName}]. Bóc tách được ${indicatorsCount} chỉ số sinh hóa máu: ${labDetails}. Nhờ bác sĩ AI đánh giá và kết hợp chẩn đoán.`;
    } else {
      userPrompt = `Tôi vừa tải lên tệp tài liệu / hình ảnh xét nghiệm [${fileName}]. Nhờ bác sĩ AI xem xét hình ảnh cận lâm sàng này và hỗ trợ đánh giá giúp tôi.`;
    }
    
    if (telemetry) {
      setTelemetry({
        ...telemetry,
        lab_indicators: ocrResult.parsed_indicators || {},
      });
    }

    sendMessage(userPrompt);
  };

  const handleClarificationAnswer = (answer: string) => {
    sendMessage(`Trả lời câu hỏi làm rõ: "${answer}"`);
  };

  // Open Medical Record Modal and synthesize record
  const handleOpenMedicalRecord = async () => {
    setIsRecordModalOpen(true);
    setIsGeneratingRecord(true);
    try {
      const record = await generateMedicalRecord();
      setMedicalRecordText(record);
      // Requirement: Sau khi AI sinh xong nội dung bệnh án, hiển thị Hộp thoại xác nhận (Confirmation Dialog)
      setTimeout(() => {
        setIsConfirmDialogOpen(true);
      }, 600);
    } catch (e) {
      console.error('Error generating medical record:', e);
      setMedicalRecordText('Có lỗi xảy ra khi tạo bệnh án. Vui lòng thử lại.');
    } finally {
      setIsGeneratingRecord(false);
    }
  };

  const handleCopyRecord = () => {
    navigator.clipboard.writeText(medicalRecordText);
    setRecordCopied(true);
    setTimeout(() => setRecordCopied(false), 2000);
  };

  const handlePrintRecord = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bệnh Án Lâm Sàng - MediBot AI</title>
            <style>
              body { font-family: 'Open Sans', 'Google Sans', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
              h1 { color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px; }
              h2 { color: #0f766e; margin-top: 20px; font-size: 16px; }
              pre { background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 13px; }
              ul { padding-left: 20px; }
            </style>
          </head>
          <body>
            <div>${medicalRecordText.replace(/\n/g, '<br/>')}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[300px]">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Đang khởi tạo phiên khám...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-3 md:p-5 lg:p-6 w-full max-w-full h-full max-h-full overflow-hidden relative">
      {/* Sleek Clinical Session Toolbar (Eliminates navigation conflict with top layout header) */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between py-2 px-3 mb-3 bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 shadow-xs gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200/80 rounded-xl text-blue-900 font-mono text-[11px] font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-blue-700 font-sans font-medium text-[10px] uppercase tracking-wider">Phiên:</span>
            <span>{sessionId.slice(0, 16)}</span>
          </div>
          <div className="hidden md:flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium">
            <span>•</span>
            <span className="text-slate-600">Sẵn sàng tiếp nhận triệu chứng & xét nghiệm</span>
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center space-x-2 text-xs">
          {/* New Chat Button */}
          <button
            type="button"
            onClick={createNewSession}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition hover:scale-102 active:scale-98"
            title="Tạo phiên khám mới"
          >
            <PlusCircle size={14} />
            <span>Khám Mới</span>
          </button>

          {/* History Sessions Drawer Button */}
          <button
            type="button"
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 border border-slate-200/90 shadow-2xs transition"
            title="Xem lại các cuộc trò chuyện trước"
          >
            <History size={14} className="text-blue-600" />
            <span>Lịch Sử ({sessions.length})</span>
          </button>

          {/* Generate Medical Record Button */}
          <button
            type="button"
            onClick={handleOpenMedicalRecord}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50/90 hover:bg-blue-100 text-blue-900 border border-blue-200/80 font-semibold shadow-2xs transition"
            title="Tổng hợp toàn bộ quá trình khám thành Bệnh Án hoàn chỉnh"
          >
            <FileText size={14} className="text-blue-600" />
            <span>Tổng Hợp Bệnh Án</span>
          </button>

          {/* Admin Only: Export Complete Audit JSON Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => exportSessionAuditJson(sessionId)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-50/90 hover:bg-purple-100 text-purple-900 border border-purple-200/90 font-semibold shadow-2xs transition hover:scale-102"
              title="Tải toàn bộ chi tiết cuộc hội thoại, latency, telemetry dạng JSON để bảo trì (Chỉ Admin)"
            >
              <Download size={14} className="text-purple-600" />
              <span>Xuất JSON Bảo Trì</span>
            </button>
          )}

          {/* Gemini Key Config */}
          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition shadow-2xs ${
              geminiKey
                ? 'bg-blue-50/90 border-blue-300 text-blue-900 font-semibold'
                : 'bg-amber-50/90 border-amber-300 text-amber-900 hover:bg-amber-100 font-medium'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{geminiKey ? 'Gemini: Bật' : 'API Key'}</span>
          </button>
        </div>
      </div>

      {/* History Sessions Drawer */}
      {isHistoryDrawerOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen min-w-full bg-slate-900/40 backdrop-blur-sm flex justify-end">
            <div className="bg-white/95 w-full max-w-sm h-full shadow-2xl border-l border-slate-200 p-5 flex flex-col space-y-4 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                <History className="w-4 h-4 text-teal-600" />
                <span>Lịch Sử Các Cuộc Khám ({sessions.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {sessions.map((s) => {
                const isActive = s.id === sessionId;
                const dateStr = new Date(s.timestamp).toLocaleDateString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                });

                return (
                  <div
                    key={s.id}
                    className={`p-3.5 rounded-2xl border text-xs transition flex items-center justify-between group ${
                      isActive
                        ? 'bg-teal-50/90 border-teal-300 text-teal-900 font-medium shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        loadSession(s.id);
                        setIsHistoryDrawerOpen(false);
                      }}
                      className="flex-1 text-left space-y-1 truncate pr-2"
                    >
                      <div className="flex items-center space-x-1.5">
                        <MessageSquare size={13} className={isActive ? 'text-teal-600' : 'text-slate-400'} />
                        <span className="font-bold truncate">{s.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                        <Clock size={10} />
                        <span suppressHydrationWarning>{dateStr}</span>
                        <span>•</span>
                        <span>{s.messages?.length || 1} tin nhắn</span>
                      </div>
                    </button>

                    <div className="flex items-center space-x-1">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportSessionAuditJson(s.id);
                          }}
                          title="Tải JSON phiên này để bảo trì (Admin)"
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        >
                          <Download size={14} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(s.id);
                        }}
                        title="Xóa cuộc trò chuyện này"
                        className="p-1 text-slate-300 hover:text-red-500 rounded-lg transition opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                createNewSession();
                setIsHistoryDrawerOpen(false);
              }}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              <PlusCircle size={15} />
              <span>Tạo Cuộc Khám Mới</span>
            </button>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Comprehensive Medical Record Modal */}
      <MedicalRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        medicalRecordText={medicalRecordText}
        isGenerating={isGeneratingRecord}
        sessionId={sessionId}
      />

      {/* Gemini API Key Modal */}
      {isKeyModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen min-w-full bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white/95 rounded-[2rem] p-6 max-w-md w-full shadow-2xl border border-white/80 space-y-4 my-auto">
              <div className="flex items-center space-x-2.5 text-teal-700">
                <Key className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Cấu Hình Google Gemini API Key</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nhập API Key Google Gemini (lấy miễn phí từ <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-teal-600 underline font-semibold">Google AI Studio</a>) để kích hoạt suy luận lâm sàng chuyên sâu:
              </p>

              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-500"
              />

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/25 flex items-center space-x-1.5"
                >
                  {keySaved ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{keySaved ? 'Đã Lưu!' : 'Lưu Cấu Hình'}</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Main Split-View Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 min-h-0 overflow-hidden">
        {/* Left Column: Multimodal Chatbox (8 cols) */}
        <div className="lg:col-span-8 h-full max-h-full flex flex-col min-h-0 overflow-hidden">
          <ChatBox
            messages={messages}
            isProcessing={isProcessing}
            onSendMessage={sendMessage}
            onCancelQuery={cancelQuery}
            onOCRComplete={handleOCRComplete}
            sessionId={sessionId}
            onSetActiveAnswerIndex={setActiveAnswerIndex}
            onSubmitFeedback={submitFeedback}
          />
        </div>

        {/* Right Column: Dynamic Medical Side Dashboard (4 cols - nhỏ gọn, thanh thoát hơn) */}
        <div className="lg:col-span-4 h-full max-h-full overflow-y-auto custom-scrollbar space-y-3 pr-1 pb-2 medical-side-dashboard">
          {/* Clarification Widget */}
          <ClarificationWidget
            clarification={telemetry?.clarification}
            onSelectAnswer={handleClarificationAnswer}
          />

          {/* Widget 1: Extracted Symptoms NER */}
          <SymptomList symptoms={telemetry?.symptoms || []} />

          {/* Widget 2: Blood Lab Indicators Table */}
          <LabResultsWidget labIndicators={telemetry?.lab_indicators || {}} />

          {/* Widget 3: Disease Prediction Probability Chart */}
          <ProbabilityChart predictions={telemetry?.top_predictions || []} />

          {/* Widget 4: RAG Knowledge Citations */}
          <RagCitationsWidget citations={telemetry?.rag_citations || []} />
        </div>
      </div>

      {/* Emergency Red Flag Modal */}
      <RedFlagModal
        isOpen={isEmergencyModalOpen}
        alerts={telemetry?.red_flag?.triggered_flags || []}
        onClose={() => setIsEmergencyModalOpen(false)}
      />

      {/* Medical Record Review Modal */}
      <MedicalRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        medicalRecordText={medicalRecordText}
        isGenerating={isGeneratingRecord}
        sessionId={sessionId}
        onSaveRecord={() => {
          setIsRecordModalOpen(false);
          setIsConfirmDialogOpen(true);
        }}
      />

      {/* Save Record Confirmation Dialog (Official vs Soft-Delete Draft) */}
      <SaveRecordConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        recordData={{
          record_code: `BA-${sessionId.slice(0, 8).toUpperCase()}`,
          patient_name: user?.full_name || 'Nguyễn Trần Hiệp',
          age: 28,
          gender: 'Nam',
          icd_code: telemetry?.top_predictions?.[0]?.icd_code || 'J02.9',
          diagnosis: telemetry?.top_predictions?.[0]?.disease_name_vi || 'Viêm đường hô hấp cấp',
          primary_symptoms: telemetry?.symptoms
            ? telemetry.symptoms.map((s: any) => (typeof s === 'string' ? s : s.standard_term || s.id || ''))
            : ['Sốt', 'Đau họng', 'Ho'],
          department: 'Khoa Nội Hô Hấp',
          severity: telemetry?.red_flag?.is_emergency ? 'Critical' : 'Low',
          treatment_plan: 'Theo dõi triệu chứng, uống đủ nước và dùng thuốc theo đơn chỉ định.',
        }}
        onSaved={(rec, isDraft) => {
          console.log('Record saved successfully. isDraft:', isDraft);
        }}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-6">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
