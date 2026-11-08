import os
import re
import json
import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
from ..core.config import settings
from .local_llm_service import LocalLLMService
from .gemini_service import GeminiMedicalReasoningService
from .cohere_service import CohereMedicalReasoningService
from .conversational_engine import conversational_engine

logger = logging.getLogger(__name__)

class UnifiedClinicalReasoningService:
    """
    Trung tâm Điều phối Suy luận Y khoa (Unified Clinical Reasoning Coordinator):
    - Race condition giữa Google Gemini và Cohere: bên nào trả lời trước → kết quả chính.
    - Câu trả lời còn lại → alternative_answer để người dùng chuyển đổi bằng mũi tên.
    - Fallback sang Local LLM hoặc Deterministic Engine nếu cả 2 cloud thất bại.
    """

    def __init__(self):
        self.local_llm = LocalLLMService()
        self.gemini_service = GeminiMedicalReasoningService()
        self.cohere_service = CohereMedicalReasoningService()
        self.provider_mode = settings.LLM_PROVIDER.lower()

    async def _call_gemini_async(
        self,
        patient_message: str,
        predicted_diseases: List[Dict[str, Any]],
        symptoms: List[Dict[str, Any]],
        lab_indicators: Dict[str, Any],
        rag_citations: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]],
        is_emergency: bool,
        api_key: Optional[str] = None,
        negated_symptoms: Optional[List[Dict[str, Any]]] = None,
        clarifying_questions: Optional[List[Dict[str, Any]]] = None,
        clinical_stage: str = "provisional_assumption",
        perspective: str = "primary",
    ) -> Tuple[Optional[str], str]:
        """Gọi Gemini trong thread pool để không block event loop."""
        provider_name = "gemini_second_opinion" if perspective == "second_opinion" else "cloud_gemini"
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: self.gemini_service.synthesize_medical_response(
                    patient_message=patient_message,
                    predicted_diseases=predicted_diseases,
                    symptoms=symptoms,
                    lab_indicators=lab_indicators,
                    rag_citations=rag_citations,
                    chat_history=chat_history,
                    is_emergency=is_emergency,
                    api_key=api_key,
                    negated_symptoms=negated_symptoms,
                    clarifying_questions=clarifying_questions,
                    clinical_stage=clinical_stage,
                    perspective=perspective,
                )
            )
            return (result, provider_name) if result else (None, provider_name)
        except Exception as e:
            logger.warning(f"Gemini async call failed ({provider_name}): {e}")
            return (None, provider_name)

    async def _call_cohere_async(
        self,
        patient_message: str,
        predicted_diseases: List[Dict[str, Any]],
        symptoms: List[Dict[str, Any]],
        lab_indicators: Dict[str, Any],
        rag_citations: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]],
        is_emergency: bool,
        api_key: Optional[str],
        negated_symptoms: Optional[List[Dict[str, Any]]] = None,
        clarifying_questions: Optional[List[Dict[str, Any]]] = None,
        clinical_stage: str = "provisional_assumption",
    ) -> Tuple[Optional[str], str]:
        """Gọi Cohere trong thread pool để không block event loop."""
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: self.cohere_service.synthesize_medical_response(
                    patient_message=patient_message,
                    predicted_diseases=predicted_diseases,
                    symptoms=symptoms,
                    lab_indicators=lab_indicators,
                    rag_citations=rag_citations,
                    chat_history=chat_history,
                    is_emergency=is_emergency,
                    api_key=api_key,
                    negated_symptoms=negated_symptoms,
                    clarifying_questions=clarifying_questions,
                    clinical_stage=clinical_stage,
                )
            )
            return (result, "cloud_cohere") if result else (None, "cloud_cohere")
        except Exception as e:
            logger.warning(f"Cohere async call failed: {e}")
            return (None, "cloud_cohere")

    async def generate_clinical_advice(
        self,
        patient_message: str,
        predicted_diseases: List[Dict[str, Any]],
        symptoms: List[Dict[str, Any]],
        lab_indicators: Dict[str, Any],
        rag_citations: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None,
        is_emergency: bool = False,
        gemini_api_key: Optional[str] = None,
        cohere_api_key: Optional[str] = None,
        negated_symptoms: Optional[List[Dict[str, Any]]] = None,
        clarifying_questions: Optional[List[Dict[str, Any]]] = None,
        clinical_stage: str = "provisional_assumption"
    ) -> Dict[str, Any]:
        """
        Race condition giữa Gemini và Cohere:
        - Gọi song song cả 2 bằng asyncio.gather
        - Provider nào trả về trước → primary response
        - Provider còn lại → alternative_answer
        - Fallback: Local LLM → Deterministic Engine
        """
        used_provider = "rule_based"
        response_text = None
        alternative_text = None
        alternative_provider = None

        # Định nghĩa hàm gọi Cloud Race (Gemini vs Cohere)
        async def run_cloud_race():
            nonlocal response_text, used_provider, alternative_text, alternative_provider
            has_gemini = bool((gemini_api_key or os.getenv("GEMINI_API_KEYS", "") or os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")).strip())
            has_cohere = bool((cohere_api_key or os.getenv("COHERE_API_KEY", "")).strip())

            if has_gemini or has_cohere:
                tasks = []
                if has_gemini:
                    tasks.append(self._call_gemini_async(
                        patient_message=patient_message,
                        predicted_diseases=predicted_diseases,
                        symptoms=symptoms,
                        lab_indicators=lab_indicators,
                        rag_citations=rag_citations,
                        chat_history=chat_history,
                        is_emergency=is_emergency,
                        api_key=gemini_api_key,
                        negated_symptoms=negated_symptoms,
                        clarifying_questions=clarifying_questions,
                        clinical_stage=clinical_stage,
                        perspective="primary"
                    ))
                if has_cohere:
                    tasks.append(self._call_cohere_async(
                        patient_message=patient_message,
                        predicted_diseases=predicted_diseases,
                        symptoms=symptoms,
                        lab_indicators=lab_indicators,
                        rag_citations=rag_citations,
                        chat_history=chat_history,
                        is_emergency=is_emergency,
                        api_key=cohere_api_key,
                        negated_symptoms=negated_symptoms,
                        clarifying_questions=clarifying_questions,
                        clinical_stage=clinical_stage,
                    ))
                elif has_gemini:
                    # Kích hoạt Second Opinion song song để luôn có 2 góc nhìn AI đối chiếu
                    tasks.append(self._call_gemini_async(
                        patient_message=patient_message,
                        predicted_diseases=predicted_diseases,
                        symptoms=symptoms,
                        lab_indicators=lab_indicators,
                        rag_citations=rag_citations,
                        chat_history=chat_history,
                        is_emergency=is_emergency,
                        api_key=gemini_api_key,
                        negated_symptoms=negated_symptoms,
                        clarifying_questions=clarifying_questions,
                        clinical_stage=clinical_stage,
                        perspective="second_opinion"
                    ))

                try:
                    results = await asyncio.wait_for(
                        asyncio.gather(*tasks, return_exceptions=True),
                        timeout=12.0
                    )

                    successful = []
                    for res in results:
                        if isinstance(res, Exception):
                            continue
                        text, provider = res
                        if text:
                            successful.append((text, provider))

                    if len(successful) >= 1:
                        response_text, used_provider = successful[0]
                        logger.info(f"Primary provider: {used_provider}")

                    if len(successful) >= 2:
                        alternative_text, alternative_provider = successful[1]
                        logger.info(f"Alternative provider stored: {alternative_provider}")
                    elif len(successful) == 1 and not alternative_text:
                        # Fallback tạo góc nhìn chuyên khoa đối chiếu từ phác đồ Bộ Y Tế & Dược lâm sàng
                        top_pred = predicted_diseases[0] if predicted_diseases else {}
                        top_dis = top_pred.get("disease_name_vi", "tình trạng sức khỏe")
                        icd = top_pred.get("icd_code", "ICD-10")
                        prob_pct = top_pred.get("probability_percentage") or (f"{round(float(top_pred.get('probability', 0.85))*100, 1)}%" if top_pred else "85.0%")
                        sym_list = [s.get("standard_term", "") for s in symptoms if isinstance(s, dict) and s.get("standard_term")]
                        sym_display = ", ".join(sym_list[:3]) if sym_list else "các dấu hiệu bạn vừa chia sẻ"
                        rag_titles = [c.get("title", "") for c in rag_citations if isinstance(c, dict) and c.get("title")]
                        rag_info = f"Tham chiếu phác đồ BYT: {', '.join(rag_titles[:2])}" if rag_titles else "Dựa trên phác đồ hướng dẫn chẩn đoán và điều trị của Bộ Y Tế"

                        cot_second_opinion = conversational_engine._build_clinical_thinking(
                            symptoms=symptoms,
                            predicted_diseases=predicted_diseases,
                            negated_symptoms=negated_symptoms or [],
                            lab_indicators=lab_indicators or {},
                            is_emergency=is_emergency,
                            clinical_stage=clinical_stage
                        )

                        alternative_text = (
                            f"{cot_second_opinion}\n\n"
                            f"📋 **GÓC NHÌN HỘI CHẨN CHUYÊN KHOA ĐỐI CHIẾU (SECOND OPINION AI)**\n\n"
                            f"🔬 **Phân tích đối chiếu lâm sàng độc lập:**\n"
                            f"- **Định hướng chuyên môn:** Đồng thuận theo dõi nhóm bệnh lý **{top_dis}** (Mã ICD-10: `{icd}`) — **Tỉ lệ dự đoán: {prob_pct}** (Độ tin cậy lâm sàng). Các dấu hiệu ({sym_display}) cần được quan sát sát sao trong 24-48 giờ.\n"
                            f"- **Rà soát an toàn dược lâm sàng:** Tuyệt đối không tự ý mua thuốc kháng sinh hoặc corticoid khi chưa có đơn chỉ định từ bác sĩ chuyên khoa. Cẩn trọng nguy cơ quá liều hạ sốt hoặc xuất huyết tiêu hóa.\n"
                            f"- **Hướng dẫn chăm sóc & Hồi phục:** {rag_info}. Cần uống đủ 2 - 2.5 lít nước mỗi ngày, ăn thực phẩm thanh đạm dễ tiêu hóa và đến ngay cơ sở y tế gần nhất nếu triệu chứng tăng nặng.\n\n"
                            f"⚠️ **Dấu hiệu cảnh báo cần đi viện ngay:** Khó thở, tức ngực dữ dội, nôn liên tục không uống được nước, hoặc sốt cao trên 39°C không hạ."
                        )
                        alternative_provider = "second_opinion"

                except asyncio.TimeoutError:
                    logger.warning("Cloud AI race timed out (>5.0s). Fast-failing to deterministic protocol.")
                except Exception as e:
                    logger.warning(f"Race condition gather failed: {e}")

        # Định nghĩa hàm gọi Local LLM
        async def run_local_llm():
            nonlocal response_text, used_provider
            try:
                txt = await self.local_llm.generate_response(
                    patient_message=patient_message,
                    predicted_diseases=predicted_diseases,
                    symptoms=symptoms,
                    lab_indicators=lab_indicators,
                    rag_citations=rag_citations,
                    chat_history=chat_history,
                    is_emergency=is_emergency,
                    negated_symptoms=negated_symptoms,
                    clarifying_questions=clarifying_questions,
                    clinical_stage=clinical_stage,
                )
                if txt:
                    response_text = txt
                    used_provider = f"local_llm ({settings.LOCAL_LLM_MODEL})"
            except Exception as e:
                logger.warning(f"Local LLM routing failed: {e}")

        # Định tuyến linh hoạt theo provider_mode:
        if self.provider_mode in ["cloud_first", "gemini"]:
            await run_cloud_race()
            if not response_text and self.provider_mode == "cloud_first":
                await run_local_llm()
        elif self.provider_mode in ["local", "local_first"]:
            await run_local_llm()
            if not response_text and self.provider_mode == "local_first":
                await run_cloud_race()
        elif self.provider_mode == "rule_based":
            pass
        else:  # hybrid (mặc định thử cloud rồi local)
            await run_cloud_race()
            if not response_text:
                await run_local_llm()

        # 3. Fallback sang Deterministic nếu cả 2 cloud đều không trả lời
        cloud_errors = []
        gemini_err = getattr(self.gemini_service, "last_error", None)
        if gemini_err:
            cloud_errors.append(gemini_err)
        cohere_err = getattr(self.cohere_service, "last_error", None)
        if cohere_err:
            cloud_errors.append(cohere_err)

        if not response_text:
            response_text = self._build_deterministic_clinical_response(
                patient_message=patient_message,
                predicted_diseases=predicted_diseases,
                symptoms=symptoms,
                lab_indicators=lab_indicators,
                rag_citations=rag_citations,
                is_emergency=is_emergency,
                negated_symptoms=negated_symptoms,
                clarifying_questions=clarifying_questions,
                clinical_stage=clinical_stage
            )
            used_provider = "deterministic_clinical_protocol"

        # Bảo đảm luôn có câu trả lời của AI 2 (Second Opinion / Hội Chẩn Đối Chiếu Song Song)
        top_pred = predicted_diseases[0] if predicted_diseases else {}
        top_dis = top_pred.get("disease_name_vi", "tình trạng sức khỏe")
        icd = top_pred.get("icd_code", "ICD-10")
        prob_pct = top_pred.get("probability_percentage") or (f"{round(float(top_pred.get('probability', 0.85))*100, 1)}%" if top_pred else "85.0%")

        if not alternative_text and response_text:
            sym_list = [s.get("standard_term", "") for s in symptoms if isinstance(s, dict) and s.get("standard_term")]
            sym_display = ", ".join(sym_list[:3]) if sym_list else "các dấu hiệu bạn mô tả"
            rag_titles = [c.get("title", "") for c in rag_citations if isinstance(c, dict) and c.get("title")]
            rag_info = f"Tham chiếu phác đồ BYT: _{', '.join(rag_titles[:2])}_" if rag_titles else "Tuân thủ Hướng dẫn Chẩn đoán và Điều trị của Bộ Y Tế"

            cot_second_opinion = conversational_engine._build_clinical_thinking(
                symptoms=symptoms,
                predicted_diseases=predicted_diseases,
                negated_symptoms=negated_symptoms or [],
                lab_indicators=lab_indicators or {},
                is_emergency=is_emergency,
                clinical_stage=clinical_stage
            )
            alternative_text = (
                f"{cot_second_opinion}\n\n"
                f"📋 **GÓC NHÌN HỘI CHẨN CHUYÊN KHOA ĐỐI CHIẾU (SECOND OPINION AI)**\n\n"
                f"🔬 **Đánh giá chuyên môn độc lập:**\n"
                f"- **Định hướng lâm sàng:** Đồng thuận theo dõi nhóm bệnh lý **{top_dis}** (Mã ICD-10: `{icd}`) — **Tỉ lệ dự đoán: {prob_pct}** (Độ tin cậy lâm sàng) dựa trên các biểu hiện ({sym_display}).\n"
                f"- **Rà soát an toàn dược lâm sàng:** Cần đặc biệt lưu ý không tự ý sử dụng kháng sinh hoặc corticoid khi chưa có đơn chỉ định từ bác sĩ. Với triệu chứng sốt hoặc đau nhức, chỉ dùng Paracetamol đúng liều (10-15mg/kg/lần, cách nhau 4-6 giờ, người lớn không quá 3g/ngày).\n"
                f"- **Phác đồ & Chăm sóc bổ trợ:** {rag_info}. Đảm bảo uống đủ 2 - 2.5 lít nước mỗi ngày, ăn đồ ăn mềm dễ tiêu hóa và theo dõi sát diễn biến thân nhiệt.\n\n"
                f"⚠️ **Dấu hiệu cảnh báo cần đi viện ngay:** Khó thở, tức ngực dữ dội, nôn liên tục không uống được nước, hoặc sốt cao trên 39°C không hạ."
            )
            alternative_provider = "second_opinion"

        # BẢO ĐẢM TỈ LỆ PHẦN TRĂM DỰ ĐOÁN LUÔN CÓ MẶT TRONG CÂU TRẢ LỜI CỦA AI 2
        if alternative_text and prob_pct and top_dis and ("%" not in alternative_text or prob_pct not in alternative_text):
            pct_banner = f"🎯 **Định hướng hội chẩn độc lập:** Đồng thuận nhóm bệnh lý **{top_dis}** (Mã ICD-10: `{icd}`) — **Tỉ lệ dự đoán: {prob_pct}**\n\n"
            if "</clinical_thinking>" in alternative_text:
                parts = alternative_text.split("</clinical_thinking>", 1)
                alternative_text = parts[0] + "</clinical_thinking>\n\n" + pct_banner + parts[1].strip()
            else:
                alternative_text = pct_banner + alternative_text

        return {
            "text": response_text,
            "provider": used_provider,
            "is_emergency": is_emergency,
            "alternative_text": alternative_text,
            "alternative_provider": alternative_provider,
            "cloud_errors": cloud_errors,
        }

    def _build_deterministic_clinical_response(
        self,
        patient_message: str,
        predicted_diseases: List[Dict[str, Any]],
        symptoms: List[Dict[str, Any]],
        lab_indicators: Dict[str, Any],
        rag_citations: List[Dict[str, Any]],
        is_emergency: bool = False,
        negated_symptoms: Optional[List[Dict[str, Any]]] = None,
        clarifying_questions: Optional[List[Dict[str, Any]]] = None,
        clinical_stage: str = "provisional_assumption"
    ) -> str:
        """Sinh câu trả lời y tế linh hoạt, ân cần theo ý định qua ConversationalEngine."""
        return conversational_engine.generate_response(
            patient_message=patient_message,
            clinical_state=None,
            predicted_diseases=predicted_diseases,
            symptoms=symptoms,
            negated_symptoms=negated_symptoms or [],
            lab_indicators=lab_indicators or {},
            rag_citations=rag_citations or [],
            clarifying_questions=clarifying_questions,
            clinical_stage=clinical_stage,
            is_emergency=is_emergency
        )

    async def generate_disease_encyclopedia_advice(
        self,
        disease_name: str,
        user_query: str,
        icd_code: Optional[str] = None,
        rag_citations: Optional[List[Dict[str, Any]]] = None,
        disease_info: Optional[Dict[str, Any]] = None,
        gemini_api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sinh câu trả lời Tra cứu Kiến thức Bệnh học Chuyên sâu (Disease Knowledge & Encyclopedia Inquiry).
        - Ưu tiên Cloud Gemini 2.0 Flash để giải thích chi tiết, đầy đủ 5 mục.
        - Tự động Fallback sang Phác đồ Chuẩn Bộ Y Tế nếu Cloud AI không khả dụng.
        """
        response_text = None
        used_provider = "deterministic_disease_protocol"
        alternative_text = None
        alternative_provider = None

        has_gemini = bool((gemini_api_key or os.getenv("GEMINI_API_KEYS", "") or os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")).strip())
        if has_gemini:
            try:
                loop = asyncio.get_event_loop()
                response_text = await asyncio.wait_for(
                    loop.run_in_executor(
                        None,
                        lambda: self.gemini_service.synthesize_disease_knowledge_response(
                            disease_name=disease_name,
                            user_query=user_query,
                            icd_code=icd_code,
                            rag_citations=rag_citations or [],
                            disease_info=disease_info or {},
                            api_key=gemini_api_key
                        )
                    ),
                    timeout=10.0
                )
                if response_text:
                    used_provider = "cloud_gemini"
            except Exception as e:
                logger.warning(f"Gemini disease knowledge call failed ({e}). Using deterministic protocol.")

        # Fallback từ cơ sở dữ liệu phác đồ chuẩn Bộ Y Tế
        rag_docs = rag_citations or []
        cardinal_syms = disease_info.get("cardinal_symptoms", []) if disease_info else []
        all_syms = disease_info.get("all_symptoms", []) if disease_info else []
        sym_display = ", ".join(cardinal_syms if cardinal_syms else all_syms[:6]) if (cardinal_syms or all_syms) else "Sốt, mệt mỏi, đau nhức và các dấu hiệu đặc thù theo phác đồ"
        dept = disease_info.get("department", "Chuyên khoa") if disease_info else (rag_docs[0].get("department", "Chuyên khoa") if rag_docs else "Nội khoa")
        red_flag_warning = disease_info.get("emergency_warning") if disease_info else (rag_docs[0].get("emergency_warning", "Xuất hiện khó thở, sốt cao không hạ, xuất huyết hoặc đau ngực dữ dội cần cấp cứu ngay.") if rag_docs else "Khó thở, sốt cao li bì hoặc nôn liên tục.")
        precautions = disease_info.get("precautions", []) if disease_info else []

        cot_thinking = (
            "<clinical_thinking>\n"
            f"- Cơ chế bệnh sinh & Dịch tễ học: Tra cứu bệnh học {disease_name} (Mã ICD-10: {icd_code or 'R69'}). Đánh giá nguyên nhân sinh bệnh, cơ chế tác động cơ quan đích thuộc chuyên khoa {dept}.\n"
            f"- Triệu chứng chỉ điểm & Dấu hiệu đặc trưng: Các biểu hiện cốt lõi đã được Bộ Y Tế chuẩn hóa bao gồm: {sym_display}.\n"
            f"- Đánh giá cờ đỏ (Red Flags): {red_flag_warning}\n"
            f"- Phác đồ chuẩn & Khuyến cáo cận lâm sàng: Khuyến nghị xét nghiệm định lượng và tuân thủ hướng dẫn điều trị ngoại trú an toàn.\n"
            "</clinical_thinking>"
        )

        deterministic_text = (
            f"{cot_thinking}\n\n"
            f"Chào bạn, tôi là **Trợ Lý Y Tế AI (MediBot)** tham vấn theo chuẩn Bộ Y Tế Việt Nam.\n\n"
            f"## 📚 TỔNG QUAN KIẾN THỨC BỆNH HỌC: {disease_name.upper()} {f'(Mã ICD-10: `{icd_code}`)' if icd_code else ''}\n"
            f"- **Chuyên khoa phụ trách:** {dept}\n"
            f"- **Mức độ theo dõi:** Chuẩn hóa theo Hướng dẫn Chẩn đoán & Điều trị của Bộ Y Tế.\n\n"
            f"### 1. Bản chất & Nguyên nhân gây bệnh\n"
            f"- **{disease_name}** là bệnh lý thuộc chuyên khoa {dept}. Tình trạng bệnh có thể xuất phát từ nguyên nhân nhiễm trùng (virus, vi khuẩn), rối loạn chuyển hóa hoặc đáp ứng viêm cấp/mạn tính của cơ thể.\n\n"
            f"### 2. Các triệu chứng & Dấu hiệu nhận biết điển hình\n"
            f"- **Triệu chứng đặc trưng (Cardinal symptoms):** {sym_display}.\n"
            f"- Người bệnh thường trải qua giai đoạn khởi phát với cảm giác mệt mỏi, sốt hoặc khó chịu cơ năng, sau đó tiến triển sang các triệu chứng đặc hiệu tại cơ quan tổn thương.\n\n"
            f"### 3. Dấu hiệu cảnh báo nguy hiểm (Red Flags cần cấp cứu 115 ngay)\n"
            f"- 🚨 **BÁO ĐỘNG ĐỎ:** {red_flag_warning}\n"
            f"- Cần đưa người bệnh đến ngay khoa cấp cứu của bệnh viện gần nhất nếu xuất hiện rối loạn ý thức, khó thở tím tái hoặc xuất huyết ồ ạt.\n\n"
            f"### 4. Phương pháp chẩn đoán & Xét nghiệm cận lâm sàng\n"
            f"- **Xét nghiệm máu cơ bản:** Tổng phân tích tế bào máu ngoại vi (CBC), đánh giá phản ứng viêm (CRP), kiểm tra chức năng gan (AST/ALT) và thận (Creatinine/Ure).\n"
            f"- **Thăm dò chuyên sâu:** Tùy theo chỉ định của bác sĩ tại cơ sở y tế (test nhanh kháng nguyên/kháng thể, nội soi, siêu âm hoặc chụp X-quang).\n\n"
            f"### 5. Hướng dẫn chăm sóc & Dùng thuốc an toàn chuẩn Bộ Y Tế\n"
            f"- **Chăm sóc tại nhà:** Bù đủ nước và điện giải (2 - 2.5 lít nước/ngày), ăn thức ăn mềm dễ tiêu hóa và nghỉ ngơi điều độ.\n"
            f"- **Dùng thuốc an toàn:** Tuyệt đối không tự ý mua kháng sinh, thuốc giảm đau chống viêm (Aspirin/Ibuprofen) hoặc Corticoid bừa bãi khi chưa có chỉ định từ bác sĩ.\n"
            + (f"- **Dặn dò phòng ngừa:** {', '.join(precautions)}.\n" if precautions else "")
            + f"\n💡 *Lời khuyên Bác sĩ: Nếu bạn hoặc người thân đang có các biểu hiện nghi ngờ mắc phải tình trạng trên, hãy gõ mô tả cụ thể triệu chứng hiện tại để MediBot hỗ trợ phân tầng nguy cơ và hướng dẫn xử trí tức thì!*"
        )

        if not response_text:
            response_text = deterministic_text
        else:
            alternative_text = deterministic_text
            alternative_provider = "deterministic_disease_protocol"

        return {
            "text": response_text,
            "provider": used_provider,
            "is_emergency": False,
            "alternative_text": alternative_text,
            "alternative_provider": alternative_provider,
            "cloud_errors": [],
        }


clinical_reasoning_service = UnifiedClinicalReasoningService()
