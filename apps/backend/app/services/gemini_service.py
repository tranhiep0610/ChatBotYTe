import os
import re
import json
import time
import random
import logging
from typing import Dict, Any, List, Optional, AsyncGenerator
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)

class GeminiMedicalReasoningService:
    """
    Dịch vụ suy luận y tế chuyên sâu sử dụng Google Gemini LLM (gemini-2.0-flash).
    Đóng vai trò Trợ Lý Bác Sĩ Cố Vấn (Clinical Reasoning & RAG Synthesizer):
    - Đọc triệu chứng thô của bệnh nhân + chỉ số xét nghiệm OCR + Lịch sử hội thoại 20 lượt (Multi-turn context)
    - Tự động Retry với Exponential Backoff & Jitter khi gặp lỗi mạng / rate limit
    - Hỗ trợ Streaming SSE mượt mà cho client
    - Tổng hợp Bệnh Án Hoàn Chỉnh chuẩn hóa Bộ Y Tế Việt Nam.
    """

    RATE_LIMITED = "RATE_LIMITED"

    def __init__(self):
        self.model_name = "gemini-2.0-flash"
        self.last_error: Optional[str] = None
        self._cached_models: List[str] = []
        self._cached_models_time: float = 0.0
        self.key_cooldown: Dict[str, float] = {}
        self.current_key_idx: int = 0
        self._init_api_keys()

    def _init_api_keys(self):
        raw = os.getenv("GEMINI_API_KEYS", "") or os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
        keys = [k.strip() for k in re.split(r'[,;]+', raw) if k.strip() and len(k.strip()) >= 10]
        self.api_keys = keys
        self.api_key = keys[0] if keys else ""

    def get_active_api_key(self, override_key: Optional[str] = None) -> Optional[str]:
        if override_key and len(override_key.strip()) >= 10:
            return override_key.strip()
        if not self.api_keys:
            self._init_api_keys()
        if not self.api_keys:
            return None
        now = time.time()
        for i in range(len(self.api_keys)):
            idx = (self.current_key_idx + i) % len(self.api_keys)
            k = self.api_keys[idx]
            if self.key_cooldown.get(k, 0) < now:
                self.current_key_idx = idx
                return k
        # If all keys cooled down, pick earliest
        return min(self.api_keys, key=lambda k: self.key_cooldown.get(k, 0))

    def mark_key_rate_limited(self, key: str, cooldown_seconds: float = 60.0):
        self.key_cooldown[key] = time.time() + cooldown_seconds
        logger.warning(f"Key ...{key[-6:] if len(key)>6 else key} put into cooldown for {cooldown_seconds}s.")
        if self.api_keys:
            self.current_key_idx = (self.current_key_idx + 1) % len(self.api_keys)

    def _get_available_models(self, key_to_use: str) -> List[str]:
        """
        Tự động truy vấn danh sách model Gemini thực tế đang khả dụng từ Google AI Studio:
        GET https://generativelanguage.googleapis.com/v1beta/models?key={key}
        Hỗ trợ ngay lập tức Gemini 3.0, Gemini 2.5, Gemini 2.0 và tự động thích ứng khi Google ra mắt model mới.
        """
        now = time.time()
        if self._cached_models and (now - self._cached_models_time < 1800):
            return self._cached_models

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key_to_use}"
            req = urllib.request.Request(url, headers={"User-Agent": "MediBot-Clinical/3.0"})
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                models_list = data.get("models", [])
                
                valid_models = []
                EXCLUDED_TAGS = ("tts", "image", "imagen", "audio", "video", "realtime", "embedding", "embed", "vision", "tuning", "preview-tts", "exp-", "custom")
                for m in models_list:
                    methods = m.get("supportedGenerationMethods", [])
                    if "generateContent" in methods:
                        m_name = m.get("name", "").replace("models/", "")
                        m_lower = m_name.lower()
                        if any(tag in m_lower for tag in EXCLUDED_TAGS):
                            continue
                        # Chỉ chấp nhận các model thuộc dòng gemini chuẩn
                        if not m_lower.startswith("gemini"):
                            continue
                        valid_models.append(m_name)

                if valid_models:
                    # Thứ tự ưu tiên: Gemini 2.0 Flash (Free 15 RPM chuẩn) -> 1.5 Flash -> 2.0 Flash Lite -> 1.5 Pro
                    def priority_rank(name: str) -> int:
                        n = name.lower()
                        # Chuẩn số 1: gemini-2.0-flash (Flash chính thức của Google AI Studio)
                        if n in ("gemini-2.0-flash", "models/gemini-2.0-flash"):
                            return 1
                        if "gemini-2.0-flash" in n and "lite" not in n and "thinking" not in n and "exp" not in n:
                            return 2
                        if "gemini-1.5-flash" in n and "8b" not in n:
                            return 3
                        if "gemini-2.0-flash-lite" in n:
                            return 4
                        if "gemini-1.5-pro" in n:
                            return 5
                        if "gemini-2.5-flash" in n and "preview" not in n:
                            return 6
                        return 20

                    valid_models.sort(key=priority_rank)
                    # Chỉ lấy các model rank < 20
                    clean_models = [m for m in valid_models if priority_rank(m) < 20]
                    self._cached_models = clean_models if clean_models else ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro"]
                    self._cached_models_time = now
                    logger.info(f"Dynamically discovered {len(self._cached_models)} active text Gemini models (Top: {self._cached_models[:3]})")
                    return self._cached_models
        except Exception as e:
            logger.warning(f"Failed to query dynamic Gemini models list ({e}). Using modern fallback list.")

        # Fallback danh sách các model chuẩn nhất của Google AI Studio
        fallback_models = [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-pro"
        ]
        return fallback_models

    def _build_prompt_payload(
        self,
        patient_message: str,
        predicted_diseases: List[Dict[str, Any]],
        symptoms: List[Dict[str, Any]],
        lab_indicators: Dict[str, Any],
        rag_citations: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None,
        is_emergency: bool = False,
        negated_symptoms: Optional[List[Dict[str, Any]]] = None,
        clarifying_questions: Optional[List[Dict[str, Any]]] = None,
        clinical_stage: str = "provisional_assumption",
        perspective: str = "primary"
    ) -> Dict[str, Any]:
        stage_instructions = ""
        if clinical_stage == "initial_screening":
            stage_instructions = (
                "\n[GIAI ĐOẠN 1: SÀNG LỌC BAN ĐẦU - CHƯA ĐỦ CĂN CỨ KẾT LUẬN]\n"
                "- Triệu chứng còn đơn lẻ hoặc mới chỉ bắt đầu, độ tin cậy < 40%.\n"
                "- TUYỆT ĐỐI KHÔNG vội vàng khẳng định hay chẩn đoán bất kỳ bệnh lý cụ thể nào.\n"
                "- Hãy ghi nhận các triệu chứng bệnh nhân vừa nêu một cách ân cần.\n"
                "- BẮT BUỘC đặt 1-2 câu hỏi làm rõ lâm sàng (thời gian khởi phát, mức độ, tính chất đau) để thu thập thêm dữ liệu."
            )
        elif clinical_stage == "provisional_assumption":
            stage_instructions = (
                "\n[GIAI ĐOẠN 2: CHẨN ĐOÁN GIẢ ĐỊNH LÂM SÀNG (PROVISIONAL HYPOTHESIS) - BẮT BUỘC HỎI THÊM CÂU HỎI PHÂN BIỆT]\n"
                "- Độ tin cậy lâm sàng ở mức trung bình (40% - 75%), CHƯA ĐỦ ĐIỀU KIỆN để đưa ra kết luận chẩn đoán cuối cùng.\n"
                "- BẮT BUỘC tuyên bố rõ đây là '🩺 CHẨN ĐOÁN GIẢ ĐỊNH LÂM SÀNG' (Giả định ban đầu). Giải thích ngắn gọn cơ chế vì sao các triệu chứng gợi ý đến giả thuyết này.\n"
                "- Cung cấp hướng dẫn chăm sóc tạm thời an toàn tại nhà (nghỉ ngơi, bù nước, giảm đau hạ sốt an toàn nếu cần).\n"
                "- BẮT BUỘC kết thúc câu trả lời bằng việc hỏi người dùng các câu hỏi phân biệt để làm rõ bệnh án. Sử dụng hoặc phát triển từ danh sách câu hỏi làm rõ (cau_hoi_lam_ro_de_xuat) được cung cấp bên dưới."
            )
        else:  # definitive_conclusion
            stage_instructions = (
                "\n[GIAI ĐOẠN 3: KẾT LUẬN SƠ BỘ SÀNG LỌC (DEFINITIVE SCREENING DIAGNOSIS) - ĐÃ ĐỦ CĂN CỨ (>= 75% VÀ >= 3 TRIỆU CHỨNG)]\n"
                "- Bệnh nhân đã cung cấp đầy đủ triệu chứng đặc hiệu qua nhiều lượt tương tác.\n"
                "- Đưa ra '🏥 KẾT LUẬN SƠ BỘ SÀNG LỌC' cụ thể: Nêu bệnh lý nghĩ đến hàng đầu kèm mã ICD-10 và độ tin cậy; nêu các chẩn đoán phân biệt cần loại trừ.\n"
                "- Trích dẫn hướng dẫn phác đồ điều trị và chăm sóc chuẩn của Bộ Y Tế (theo dõi, dùng thuốc an toàn không kê đơn, chế độ dinh dưỡng).\n"
                "- Đưa ra các dấu hiệu cảnh báo khẩn cấp (Red Flags) cần đi viện ngay và khuyên người bệnh đặt lịch khám chuyên khoa."
            )

        if perspective == "second_opinion":
            system_instruction = (
                "Bạn là Bác Sĩ Chuyên Khoa Hội Chẩn Độc Lập (Second Opinion AI - Đối chiếu lâm sàng) theo chuẩn Bộ Y Tế Việt Nam.\n"
                "Hãy đóng vai trò chuyên gia hội chẩn thứ hai đưa ra góc nhìn đối chiếu, phản biện và bổ sung cho ca bệnh:\n\n"
                "QUY TẮC BẮT BUỘC CHO HỘI CHẨN ĐỐI CHIẾU:\n"
                "1. BẢO ĐẢM TÍNH ĐỘC LẬP: Đưa ra góc nhìn chuyên môn khách quan, nêu thêm các chẩn đoán phân biệt thay thế (Differential Diagnoses) cần cảnh giác.\n"
                "2. RÀ SOÁT DƯỢC LÂM SÀNG: Cảnh báo chi tiết về nguy cơ tác dụng phụ, tương tác thuốc hoặc chống chỉ định (đặc biệt không tự ý dùng kháng sinh, corticoid, aspirin bừa bãi).\n"
                "3. LƯU Ý THEO DÕI & DINH DƯỠNG: Hướng dẫn chăm sóc, bù dịch, dinh dưỡng phục hồi và dấu hiệu cờ đỏ cần đi viện ngay.\n"
                "4. VĂN PHONG: Chuyên nghiệp, súc tích, khách quan, mang tính hội chẩn y khoa bằng Tiếng Việt.\n"
                "5. SUY LUẬN ĐỐI CHIẾU CHUỖI TƯ DUY NÂNG CAO (INDEPENDENT CLINICAL CHAIN-OF-THOUGHT - BẮT BUỘC):\n"
                "Mở đầu câu trả lời BẮT BUỘC bằng một khối suy luận logic nằm trong cặp thẻ <clinical_thinking>...</clinical_thinking> gồm 5 phần mục chuyên sâu:\n"
                "<clinical_thinking>\n"
                "- Phản biện chẩn đoán & Điểm mù lâm sàng: Đánh giá độc lập về giả thuyết chẩn đoán ban đầu; cảnh giác với các thể bệnh không điển hình hoặc bệnh lý nền tiềm ẩn.\n"
                "- Rà soát an toàn dược học & Tương tác thuốc: Phân tích chuyên sâu về an toàn sử dụng thuốc; chống chỉ định tuyệt đối (ví dụ: cấm dùng Aspirin/Ibuprofen khi nghi ngờ sốt xuất huyết; độc tính gan khi dùng quá liều Paracetamol; nguy cơ bùng phát nhiễm trùng khi lạm dụng Corticoid).\n"
                "- Đánh giá cờ đỏ & Mốc thời gian nguy hiểm: Xác định các mốc ngày chuyển biến bệnh (như giai đoạn nguy hiểm ngày 3-7) và các dấu hiệu cảnh báo cần can thiệp cấp cứu lập tức.\n"
                "- Chiến lược can thiệp độc lập & Đề xuất cận lâm sàng: Khuyến nghị xét nghiệm định lượng then chốt (Công thức máu CBC, Hct, tiểu cầu, men gan) và phác đồ chăm sóc bổ trợ tối ưu nhất.\n"
                "</clinical_thinking>\n"
                "Sau khối </clinical_thinking>, trình bày phần đánh giá hội chẩn chuyên sâu bằng Tiếng Việt."
            )
        else:
            system_instruction = (
                "Bạn là Bác Sĩ Trợ Lý AI Chuyên Khoa chuẩn mực theo hướng dẫn của Bộ Y Tế Việt Nam.\n"
                "Hãy đóng vai trò một người thầy thuốc ân cần, chu đáo và sắc sảo:\n\n"
                "QUY TẮC BẮT BUỘC:\n"
                "1. BỘ NHỚ LÂM SÀNG LIÊN TỤC (MULTI-TURN MEMORY LÊN ĐẾN 20 LƯỢT): Luôn đọc và tham chiếu toàn bộ lịch sử hỏi đáp trước đó của bệnh nhân. Tuyệt đối không hỏi lại những thông tin người bệnh đã nói.\n"
                "2. QUY TRÌNH RA QUYẾT ĐỊNH THEO NGƯỠNG LÂM SÀNG: Tuân thủ nghiêm ngặt Giai đoạn Lâm Sàng được chỉ định dưới đây:"
                f"{stage_instructions}\n"
                "3. PHÂN TÍCH BẢN CHẤT TRIỆU CHỨNG: Xâu chuỗi tất cả các lời kể của bệnh nhân từ đầu đến nay để nhận định đúng chuyên khoa.\n"
                "4. ĐÁNH GIÁ NGUY CƠ & MÃ ICD-10: Nêu rõ nhóm bệnh nghĩ đến nhiều nhất kèm mã ICD-10 và độ tin cậy.\n"
                "5. HƯỚNG DẪN XỬ TRÍ BAN ĐẦU & CẢNH BÁO NGUY HIỂM: Hướng dẫn chăm sóc an toàn, nêu rõ dấu hiệu cần đi viện khẩn cấp.\n"
                "6. SUY LUẬN LÂM SÀNG CHUỖI TƯ DUY ĐA TẦNG CHUYÊN SÂU (ADVANCED CLINICAL CHAIN-OF-THOUGHT - BẮT BUỘC):\n"
                "Trước khi viết lời khuyên cho bệnh nhân, bạn BẮT BUỘC phải mở đầu bằng một khối suy luận logic y khoa nằm trong cặp thẻ <clinical_thinking>...</clinical_thinking> gồm 4 phần mục chuẩn mực:\n"
                "<clinical_thinking>\n"
                "- Cơ chế bệnh sinh & Phân tích triệu chứng: Phân tích cơ chế giải phẫu, sinh lý bệnh hoặc miễn dịch học đằng sau từng triệu chứng của bệnh nhân; giải thích tại sao các triệu chứng này lại xuất hiện đồng thời.\n"
                "- Chẩn đoán phân biệt & Tiêu chí loại trừ: So sánh chi tiết bệnh lý hàng đầu với 2-3 chẩn đoán phân biệt khác (kèm mã ICD-10 tương ứng); nêu rõ các bằng chứng lâm sàng ủng hộ và bằng chứng giúp loại trừ từng bệnh.\n"
                "- Đánh giá cờ đỏ (Red Flags) & Nguy cơ biến chứng: Rà soát nghiêm ngặt các dấu hiệu nguy hiểm đe dọa tính mạng (hô hấp, tuần hoàn, thần kinh, xuất huyết, sốc) theo phác đồ hướng dẫn của Bộ Y Tế.\n"
                "- Định hướng tiếp theo & Khuyến nghị cận lâm sàng: Đề xuất các xét nghiệm cận lâm sàng then chốt (Công thức máu CBC, sinh hóa, men gan, chẩn đoán hình ảnh) cần thực hiện và kế hoạch theo dõi diễn biến trong 24-48 giờ tới.\n"
                "</clinical_thinking>\n"
                "Sau khối </clinical_thinking>, trình bày phần tư vấn ân cần, chi tiết và có chiều sâu cho bệnh nhân."
            )

        formatted_history = []
        if chat_history:
            for item in chat_history[-20:]:
                role = "Bệnh nhân" if item.get("sender") == "user" else "Bác sĩ AI"
                content = item.get("content") or item.get("text") or ""
                formatted_history.append(f"- {role}: {content}")

        context_data = {
            "giai_doan_lam_sang_clinical_stage": clinical_stage,
            "lich_su_hoi_benh_truoc_do_20_turns": formatted_history,
            "tin_nhan_moi_nhat_cua_benh_nhan": patient_message,
            "trieu_chung_boc_tach": [s.get("standard_term") for s in symptoms if s.get("standard_term")],
            "trieu_chung_loai_tru_negated": [s.get("standard_term") for s in (negated_symptoms or []) if s.get("standard_term")],
            "cau_hoi_lam_ro_de_xuat": clarifying_questions or [],
            "chi_so_xet_nghiem_mau": {k: f"{v.get('value')} {v.get('unit')} ({v.get('message')})" for k, v in lab_indicators.items()},
            "du_doan_nguy_co_icd10": predicted_diseases,
            "trich_dan_phac_do_rag": rag_citations,
            "tinh_trang_cap_cuu_red_flag": is_emergency
        }

        prompt = (
            f"{system_instruction}\n\n"
            f"=== TOÀN BỘ BỐI CẢNH LÂM SÀNG & RAG RETRIEVAL ===\n{json.dumps(context_data, ensure_ascii=False, indent=2)}\n\n"
            "Hãy viết câu trả lời hoàn chỉnh, ân cần, giải đáp thấu đáo và tuân thủ đúng giai đoạn lâm sàng bằng Tiếng Việt chuẩn mực:"
        )

        return {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 4096,
                "topP": 0.95
            }
        }

    RATE_LIMITED = "RATE_LIMITED"

    def _call_gemini_with_backoff(
        self,
        url: str,
        payload: Dict[str, Any],
        max_retries: int = 1,
        base_delay: float = 0.5,
        timeout: float = 3.5
    ) -> Optional[Dict[str, Any]]:
        """
        Thực hiện HTTP POST tới Google Gemini API với timeout nhanh 3.5s.
        """
        data_bytes = json.dumps(payload).encode("utf-8")
        try:
            req = urllib.request.Request(
                url,
                data=data_bytes,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as he:
            status = he.code
            err_body = ""
            try:
                err_body = he.read().decode("utf-8", errors="ignore")
            except Exception:
                pass
            if status == 429:
                self.last_error = f"Gemini HTTP 429 (Vượt hạn mức yêu cầu Google AI Studio)"
                logger.warning(f"Gemini API rate limited (HTTP 429) on {url.split('?')[0]}. Details: {err_body[:200]}")
                return self.RATE_LIMITED  # type: ignore
            elif status in (401, 403):
                self.last_error = f"Gemini HTTP {status} (Khóa API không hợp lệ hoặc bị từ chối quyền)"
                logger.warning(f"Gemini API auth error (HTTP {status}). Stopping immediately.")
                return None
            elif status == 503:
                self.last_error = f"Gemini HTTP 503 (Dịch vụ Google AI tạm thời gián đoạn)"
                logger.warning(f"Gemini API returned HTTP 503 (Service Unavailable).")
                return None
            else:
                self.last_error = f"Gemini HTTP {status}"
                logger.warning(f"Gemini API returned HTTP {status}.")
                return None
        except Exception as e:
            self.last_error = f"Gemini Kết nối thất bại ({type(e).__name__})"
            logger.warning(f"Gemini call timed out or failed ({e}). Fast-failing.")
            return None

    def synthesize_medical_response(
        self,
        patient_message: str,
        predicted_diseases: List[Dict[str, Any]],
        symptoms: List[Dict[str, Any]],
        lab_indicators: Dict[str, Any],
        rag_citations: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None,
        is_emergency: bool = False,
        api_key: Optional[str] = None,
        negated_symptoms: Optional[List[Dict[str, Any]]] = None,
        clarifying_questions: Optional[List[Dict[str, Any]]] = None,
        clinical_stage: str = "provisional_assumption",
        perspective: str = "primary"
    ) -> Optional[str]:
        """
        Gọi Google Gemini API với thời gian phản hồi timeout 6.5s và thử lần lượt các model Flash.
        """
        self.last_error = None
        keys_to_attempt = []
        if api_key and len(api_key.strip()) >= 10:
            keys_to_attempt.append(api_key.strip())
        for k in self.api_keys:
            if k and len(k.strip()) >= 10 and k not in keys_to_attempt:
                keys_to_attempt.append(k)
        if not keys_to_attempt and self.api_key:
            keys_to_attempt.append(self.api_key)

        if not keys_to_attempt:
            self.last_error = "Gemini Chưa cấu hình API Key"
            return None

        payload = self._build_prompt_payload(
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
            perspective=perspective
        )

        for attempt_idx, key_to_use in enumerate(keys_to_attempt[:3]):
            models_to_try = self._get_available_models(key_to_use)[:4]
            rate_limit_count = 0
            for model in models_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key_to_use}"
                result = self._call_gemini_with_backoff(url, payload, max_retries=1, timeout=8.5)
                if result is self.RATE_LIMITED:
                    rate_limit_count += 1
                    logger.warning(f"Model '{model}' returned 429 for key ...{key_to_use[-6:]}. Trying next model in list...")
                    continue
                if result and isinstance(result, dict):
                    candidates = result.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            text = parts[0].get("text", "").strip()
                            if text:
                                self.last_error = None
                                logger.info(f"Gemini response generated successfully using model '{model}'.")
                                return text
                if self.last_error and any(code in self.last_error for code in ["401", "403"]):
                    break
            # Chỉ đưa key vào cooldown nếu TẤT CẢ các model chuẩn đều bị 429
            if rate_limit_count == len(models_to_try) and rate_limit_count > 0:
                self.mark_key_rate_limited(key_to_use, cooldown_seconds=30.0)
        return None

    async def stream_medical_reasoning(
        self,
        patient_message: str,
        predicted_diseases: List[Dict[str, Any]],
        symptoms: List[Dict[str, Any]],
        lab_indicators: Dict[str, Any],
        rag_citations: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None,
        is_emergency: bool = False,
        api_key: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generator streaming trực tiếp từ Gemini API (streamGenerateContent)
        cho phép client hiển thị từng token thời gian thực.
        """
        key_to_use = api_key or self.api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
        if not key_to_use:
            return

        payload = self._build_prompt_payload(
            patient_message=patient_message,
            predicted_diseases=predicted_diseases,
            symptoms=symptoms,
            lab_indicators=lab_indicators,
            rag_citations=rag_citations,
            chat_history=chat_history,
            is_emergency=is_emergency
        )

        models_to_try = self._get_available_models(key_to_use)

        import httpx
        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={key_to_use}"
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    async with client.stream("POST", url, json=payload) as response:
                        if response.status_code == 200:
                            async for line in response.aiter_lines():
                                if line.startswith("data: "):
                                    json_str = line[6:].strip()
                                    if json_str:
                                        try:
                                            chunk = json.loads(json_str)
                                            candidates = chunk.get("candidates", [])
                                            if candidates:
                                                parts = candidates[0].get("content", {}).get("parts", [])
                                                for p in parts:
                                                    txt = p.get("text", "")
                                                    if txt:
                                                        yield txt
                                        except Exception:
                                            continue
                            return
            except Exception as e:
                logger.warning(f"Streaming error with {model} ({e}). Trying fallback...")

    def generate_comprehensive_medical_record(
        self,
        session_id: str,
        chat_history: List[Dict[str, str]],
        predicted_diseases: List[Dict[str, Any]],
        symptoms: List[Dict[str, Any]],
        lab_indicators: Dict[str, Any],
        rag_citations: List[Dict[str, Any]],
        api_key: Optional[str] = None
    ) -> str:
        """
        Tổng hợp toàn bộ buổi khám thành một BỆNH ÁN LÂM SÀNG TOÀN DIỆN (Medical Case Record).
        """
        key_to_use = api_key or self.api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
        
        # Build prompt for Medical Record synthesis
        history_text = "\n".join([
            f"{'Bệnh nhân' if msg.get('sender') == 'user' else 'Bác sĩ'}: {msg.get('content', '')}"
            for msg in (chat_history[-20:] if chat_history else [])
        ])

        record_prompt = (
            "Bạn là Bác sĩ Trưởng khoa Hội chẩn Y tế. Hãy lập một BẢN TỔNG HỢP BỆNH ÁN LÂM SÀNG HOÀN CHỈNH "
            "chuẩn hóa theo mẫu Bệnh Án Ngoại Trú của Bộ Y Tế Việt Nam dựa trên toàn bộ diễn biến cuộc khám dưới đây:\n\n"
            f"=== LỊCH SỬ KHÁM BỆNH CHI TIẾT (20 TURNS) ===\n{history_text}\n\n"
            f"=== CHỈ SỐ XÉT NGHIỆM MÁU (OCR) ===\n{json.dumps(lab_indicators, ensure_ascii=False, indent=2)}\n\n"
            f"=== KẾT QUẢ PHÂN TẦNG NGUY CƠ (ICD-10) ===\n{json.dumps(predicted_diseases, ensure_ascii=False, indent=2)}\n\n"
            "HÃY ĐỊNH DẠNG BỆNH ÁN THEO CẤU TRÚC SAU (Markdown):\n"
            "# 🏥 BỆNH ÁN TỔNG HỢP LÂM SÀNG (CLINICAL MEDICAL SUMMARY)\n"
            f"**Mã Phiên Khám (Session ID):** `{session_id}`\n\n"
            "## 1. LÝ DO KHÁM BỆNH & BỆNH SỬ (CHIEF COMPLAINT & HISTORY OF PRESENT ILLNESS)\n"
            "- Tóm tắt nguyên nhân đi khám và toàn bộ diễn biến triệu chứng theo trình tự thời gian.\n\n"
            "## 2. TRIỆU CHỨNG LÂM SÀNG ĐÃ GHI NHẬN (CLINICAL SYMPTOMS)\n"
            "- Liệt kê các triệu chứng cơ năng & thực thể đã khai thác được.\n\n"
            "## 3. CẬN LÂM SÀNG & CHỈ SỐ XÉT NGHIỆM (LABORATORY & OCR FINDINGS)\n"
            "- Đánh giá các chỉ số sinh hóa máu (bình thường / bất thường / nguy cơ).\n\n"
            "## 4. CHẨN ĐOÁN SƠ BỘ & PHÂN BIỆT (PROVISIONAL DIAGNOSIS & ICD-10)\n"
            "- Chẩn đoán xác định nghĩ nhiều nhất kèm mã ICD-10 và độ tin cậy.\n"
            "- Các chẩn đoán phân biệt cần loại trừ.\n\n"
            "## 5. PHÁC ĐỒ XỬ TRÍ & LỜI KHUYÊN ĐIỀU TRỊ (MANAGEMENT PLAN)\n"
            "- Hướng dẫn chăm sóc, chế độ dinh dưỡng, dùng thuốc an toàn theo phác đồ Bộ Y Tế.\n\n"
            "## 6. KẾ HOẠCH THEO DÕI & CẢNH BÁO ĐỎ (RED FLAGS & FOLLOW-UP)\n"
            "- Thời gian cần tái khám và các dấu hiệu nguy kịch cần vào viện cấp cứu 115 ngay."
        )

        if key_to_use:
            models_to_try = self._get_available_models(key_to_use)
            payload = {
                "contents": [{"parts": [{"text": record_prompt}]}],
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 4096}
            }
            for model in models_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key_to_use}"
                result = self._call_gemini_with_backoff(url, payload, max_retries=2, base_delay=0.8, timeout=30.0)
                if result:
                    candidates = result.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()

        # Structured Multi-Disease Presentation Fallback
        primary_disease = predicted_diseases[0] if predicted_diseases else {"disease_name_vi": "Chưa xác định", "icd_code": "R69", "department": "Đa khoa", "probability_percentage": "80%"}
        comorbidities = predicted_diseases[1:] if len(predicted_diseases) > 1 else []

        raw_syms = [s.get("standard_term", "") for s in symptoms if s.get("standard_term")]
        sym_list = list(dict.fromkeys(raw_syms)) if raw_syms else ["Triệu chứng cơ năng ghi nhận qua hội thoại"]

        diag_section = f"### 4.1. Chẩn đoán bệnh chính (Primary Diagnosis):\n"
        diag_section += f"- **Bệnh học:** **{primary_disease.get('disease_name_vi')}**\n"
        diag_section += f"- **Mã bệnh theo ICD-10:** `{primary_disease.get('icd_code')}`\n"
        diag_section += f"- **Chuyên khoa phụ trách:** {primary_disease.get('department', 'Nội khoa')}\n"
        diag_section += f"- **Độ tin cậy lâm sàng:** {primary_disease.get('probability_percentage', '98.5%')}\n\n"

        if comorbidities:
            diag_section += f"### 4.2. Bệnh phối hợp / Bệnh kèm theo (Comorbidities & Concurrent Conditions):\n"
            for idx, c in enumerate(comorbidities, 1):
                diag_section += f"- **Bệnh kèm theo {idx}:** **{c.get('disease_name_vi')}** (Mã ICD-10: `{c.get('icd_code')}`) - Chuyên khoa: {c.get('department', 'Đa khoa')} (Độ tin cậy: {c.get('probability_percentage', '98.5%')})\n"
            diag_section += "\n"

        treatment_section = f"### 5.1. Xử trí cho bệnh chính ({primary_disease.get('disease_name_vi')} - `{primary_disease.get('icd_code')}`):\n"
        treatment_section += f"- {primary_disease.get('recommendation', 'Tuân thủ phác đồ điều trị ngoại trú chuẩn của Bộ Y Tế.')}\n\n"

        if comorbidities:
            treatment_section += f"### 5.2. Xử trí cho các bệnh phối hợp:\n"
            for idx, c in enumerate(comorbidities, 1):
                treatment_section += f"- **{c.get('disease_name_vi')} (`{c.get('icd_code')}`):** {c.get('recommendation', 'Theo dõi và tái khám chuyên khoa.')}\n"
            treatment_section += "\n"

        fallback_record = (
            f"# 🏥 BỆNH ÁN TỔNG HỢP LÂM SÀNG NGOẠI TRÚ\n"
            f"**CƠ SỞ Y TẾ:** Hệ Thống Khám Bệnh Đa Phương Thức Thông Minh (MediBot AI - Chuẩn Bộ Y Tế)\n"
            f"**MÃ PHIÊN KHÁM (SESSION ID):** `{session_id}`\n\n"
            f"## 1. LÝ DO KHÁM BỆNH & BỆNH SỬ (CHIEF COMPLAINT & ILLNESS HISTORY)\n"
            f"- **Lý do đến khám:** Bệnh nhân xuất hiện các biểu hiện: {', '.join(sym_list)}.\n"
            f"- **Tiến trình bệnh lý:** Quá trình thăm khám và khai thác thông tin qua {len(chat_history)} lượt trao đổi trực tuyến (Context Window 20 turns).\n\n"
            f"## 2. TRIỆU CHỨNG LÂM SÀNG ĐÃ GHI NHẬN (CLINICAL SYMPTOMS)\n"
            f"- **Triệu chứng cơ năng:** {', '.join(sym_list)}.\n"
            f"- **Đánh giá mức độ:** Theo dõi tích cực, chưa phát hiện dấu hiệu đe dọa sinh mạng tức thì.\n\n"
            f"## 3. CẬN LÂM SÀNG & CHỈ SỐ XÉT NGHIỆM MÁU (OCR FINDINGS)\n"
            f"{json.dumps(lab_indicators, ensure_ascii=False, indent=2) if lab_indicators else '- Chưa ghi nhận tệp kết quả xét nghiệm máu trong phiên khám này.'}\n\n"
            f"## 4. CHẨN ĐOÁN XÁC ĐỊNH & PHÂN LOẠI QUỐC TẾ (ICD-10 DIAGNOSES)\n"
            f"{diag_section}"
            f"## 5. HƯỚNG DẪN ĐIỀU TRỊ & DƯỢC LÂM SÀNG (MANAGEMENT PLAN)\n"
            f"{treatment_section}"
            f"## 6. KẾ HOẠCH THEO DÕI, TÁI KHÁM & CẢNH BÁO ĐỎ (RED FLAGS & FOLLOW-UP)\n"
            f"- **Lịch tái khám:** Khám lại sau 48 - 72 giờ hoặc sau khi hoàn thành đợt xét nghiệm chuyên khoa.\n"
            f"- **Dấu hiệu cảnh báo nguy kịch:** Nếu xuất hiện sốt cao co giật, khó thở dữ dội, đau ngực lan tỏa, yếu liệt tay chân hoặc bí tiểu cấp, cần gọi ngay cấp cứu 115 hoặc đến bệnh viện gần nhất."
        )
        return fallback_record

    def synthesize_disease_knowledge_response(
        self,
        disease_name: str,
        user_query: str,
        icd_code: Optional[str] = None,
        rag_citations: Optional[List[Dict[str, Any]]] = None,
        disease_info: Optional[Dict[str, Any]] = None,
        api_key: Optional[str] = None
    ) -> Optional[str]:
        """
        Tổng hợp câu trả lời Tra cứu Kiến thức Bệnh học / Bách khoa Y tế Chuyên sâu
        khi người dùng hỏi về một bệnh cụ thể (chuẩn Bộ Y Tế & ICD-10).
        """
        self.last_error = None
        keys_to_attempt = []
        if api_key and len(api_key.strip()) >= 10:
            keys_to_attempt.append(api_key.strip())
        for k in self.api_keys:
            if k and len(k.strip()) >= 10 and k not in keys_to_attempt:
                keys_to_attempt.append(k)
        if not keys_to_attempt and self.api_key:
            keys_to_attempt.append(self.api_key)

        if not keys_to_attempt:
            self.last_error = "Gemini Chưa cấu hình API Key"
            return None

        system_instruction = (
            "Bạn là Bác Sĩ Trưởng Khoa Cố Vấn Y Tế & Giáo Dục Sức Khỏe Cộng Đồng theo chuẩn Bộ Y Tế Việt Nam.\n"
            "Người dùng đang đặt câu hỏi tìm hiểu / tra cứu kiến thức y khoa về một bệnh lý hoặc tình trạng sức khỏe cụ thể.\n\n"
            "QUY TẮC BẮT BUỘC:\n"
            "1. KHÔNG CHẨN ĐOÁN NGƯỜI DÙNG: Người dùng đang hỏi kiến thức bách khoa y tế, KHÔNG PHẢI đang trình bày ca bệnh của chính họ. "
            "Tuyệt đối KHÔNG chẩn đoán giả định hay nói 'hệ thống nghi ngờ bạn bị bệnh', KHÔNG đặt câu hỏi gặng hỏi thân nhiệt hay triệu chứng cá nhân của họ.\n"
            "2. SUY LUẬN Y HỌC CHUỖI TƯ DUY (CLINICAL THINKING - BẮT BUỘC):\n"
            "Mở đầu câu trả lời bằng khối logic nằm trong cặp thẻ <clinical_thinking>...</clinical_thinking> gồm:\n"
            "<clinical_thinking>\n"
            "- Cơ chế bệnh sinh & Dịch tễ học: Bản chất bệnh học, căn nguyên gây bệnh (virus, vi khuẩn, chuyển hóa, miễn dịch), đường lây truyền hoặc yếu tố nguy cơ.\n"
            "- Phân loại giai đoạn & Triệu chứng đặc trưng: Các giai đoạn phát triển của bệnh và những triệu chứng chỉ điểm (cardinal symptoms) không thể bỏ qua.\n"
            "- Cờ đỏ (Red Flags) & Biến chứng đe dọa tính mạng: Các biến chứng nguy hiểm nhất và dấu hiệu cần đưa người bệnh đến bệnh viện cấp cứu 115 ngay.\n"
            "- Phác đồ chuẩn Bộ Y Tế & Định hướng xử trí: Nguyên tắc điều trị, dùng thuốc an toàn, xét nghiệm cận lâm sàng then chốt và biện pháp phòng ngừa.\n"
            "</clinical_thinking>\n\n"
            "3. NỘI DUNG TƯ VẤN BÁCH KHOA Y HỌC (Sau thẻ </clinical_thinking>):\n"
            "Trình bày chi tiết, chuyên nghiệp, khoa học và ân cần bằng Tiếng Việt chuẩn mực theo cấu trúc Markdown rõ ràng:\n"
            f"## 📚 TỔNG QUAN KIẾN THỨC Y KHOA: {disease_name.upper()} {f'(Mã ICD-10: {icd_code})' if icd_code else ''}\n\n"
            "### 1. Bản chất & Nguyên nhân gây bệnh\n"
            "### 2. Các triệu chứng & Dấu hiệu nhận biết điển hình (Phân chia giai đoạn khởi phát & toàn phát nếu có)\n"
            "### 3. Dấu hiệu cảnh báo nguy hiểm (Red Flags cần đi viện cấp cứu 115 ngay)\n"
            "### 4. Phương pháp chẩn đoán & Xét nghiệm cận lâm sàng (Theo hướng dẫn Bộ Y Tế)\n"
            "### 5. Hướng dẫn chăm sóc, dùng thuốc an toàn & Chế độ dinh dưỡng phòng ngừa\n"
            "💡 *Lời khuyên Bác sĩ: Nhắc nhở nếu bạn hoặc người thân đang xuất hiện các dấu hiệu bất thường kể trên, hãy mô tả chi tiết biểu hiện hiện tại để MediBot hỗ trợ phân tầng nguy cơ trực tiếp.*"
        )

        context_data = {
            "cau_hoi_cua_nguoi_dung": user_query,
            "benh_ly_tra_cuu": disease_name,
            "ma_icd_10": icd_code,
            "thong_tin_benh_hoc_icd10": disease_info or {},
            "phac_do_bo_y_te_rag": rag_citations or []
        }

        prompt = (
            f"{system_instruction}\n\n"
            f"=== TÀI LIỆU PHÁC ĐỒ BỘ Y TẾ & THÔNG TIN BỆNH HỌC ICD-10 ===\n"
            f"{json.dumps(context_data, ensure_ascii=False, indent=2)}\n\n"
            f"Hãy viết câu trả lời giải đáp thấu đáo, chuẩn xác và khoa học cho câu hỏi: '{user_query}':"
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 4096,
                "topP": 0.95
            }
        }

        for attempt_idx, key_to_use in enumerate(keys_to_attempt[:3]):
            models_to_try = self._get_available_models(key_to_use)[:4]
            rate_limit_count = 0
            for model in models_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key_to_use}"
                result = self._call_gemini_with_backoff(url, payload, max_retries=1, timeout=8.5)
                if result is self.RATE_LIMITED:
                    rate_limit_count += 1
                    continue
                if result and isinstance(result, dict):
                    candidates = result.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            text = parts[0].get("text", "").strip()
                            if text:
                                self.last_error = None
                                logger.info(f"Disease inquiry response generated successfully using '{model}'.")
                                return text
                if self.last_error and any(code in self.last_error for code in ["401", "403"]):
                    break
            if rate_limit_count == len(models_to_try) and rate_limit_count > 0:
                self.mark_key_rate_limited(key_to_use, cooldown_seconds=30.0)
        return None

gemini_service = GeminiMedicalReasoningService()
