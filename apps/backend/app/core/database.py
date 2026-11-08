import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from .config import settings
from .security import get_password_hash

logger = logging.getLogger(__name__)

class InMemoryDatabase:
    """In-memory database fallback khi chưa kết nối được MongoDB."""
    def __init__(self):
        self.users: Dict[str, Dict[str, Any]] = {}
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.messages: List[Dict[str, Any]] = []
        self.glossary: Dict[str, Dict[str, Any]] = {}
        self.feedback: List[Dict[str, Any]] = []
        self.medical_records: List[Dict[str, Any]] = []
        
        # Khởi tạo người dùng mặc định (Admin & User) với mật khẩu bcrypt
        self._init_default_users()
        # Khởi tạo bệnh án mẫu (Official & Draft)
        self._init_sample_records()

    def _init_default_users(self):
        admin_id = "user-admin-01"
        self.users[admin_id] = {
            "id": admin_id,
            "email": "admin@medibot.vn",
            "password_hash": get_password_hash("admin123"),
            "full_name": "BS. CKII Nguyễn Văn Hùng",
            "role": "admin",
            "gender": "Nam",
            "date_of_birth": "1982-11-20",
            "citizen_id": "001082098765",
            "phone": "0909 888 999",
            "address": "Bệnh viện Đa khoa Trung ương, Hà Nội",
            "created_at": datetime.utcnow().isoformat()
        }
        
        user_id = "user-duy-02"
        self.users[user_id] = {
            "id": user_id,
            "email": "nguyenbaduy@medibot.vn",
            "password_hash": get_password_hash("duy123"),
            "full_name": "Nguyễn Trần Hiệp",
            "role": "user",
            "gender": "Nam",
            "date_of_birth": "1998-05-15",
            "citizen_id": "001098012345",
            "phone": "0988 123 456",
            "address": "Số 54 Triều Khúc, Thanh Xuân, Hà Nội",
            "created_at": datetime.utcnow().isoformat()
        }

    def _init_sample_records(self):
        self.medical_records = [
            {
                "id": "rec-sample-01",
                "record_code": "BA-2026-0901",
                "user_id": "user-duy-02",
                "patient_name": "Nguyễn Trần Hiệp",
                "age": 28,
                "gender": "Nam",
                "phone": "0987654321",
                "address": "Hà Nội, Việt Nam",
                "admission_date": "2026-09-01 09:30",
                "primary_symptoms": ["Sốt cao liên tục 39 độ", "Đau mỏi cơ toàn thân", "Chảy máu chân răng"],
                "icd_code": "A90",
                "diagnosis": "Sốt xuất huyết Dengue thể cảnh báo",
                "department": "Khoa Truyền nhiễm & Nhiệt đới",
                "severity": "High",
                "vital_signs": {"temperature": 39.2, "blood_pressure": "115/75", "pulse": 96, "sp_o2": 98},
                "lab_findings": "PLT giảm: 78 G/L (Tiểu cầu thấp nguy hiểm), HCT: 46% (Cô đặc máu)",
                "treatment_plan": "Bù dịch Oresol theo phác đồ Bộ Y Tế. Tuyệt đối không dùng Aspirin/Ibuprofen. Tái khám và xét nghiệm tiểu cầu sau 24h.",
                "doctor_notes": "Bệnh nhân cần nhập viện theo dõi tại buồng lưu truyền nhiễm nếu tiểu cầu giảm dưới 50 G/L.",
                "created_at": "2026-09-01T09:30:00Z",
                "is_draft": False,
                "source": "chat_session"
            },
            {
                "id": "rec-sample-02",
                "record_code": "BA-2026-0822",
                "user_id": "user-duy-02",
                "patient_name": "Nguyễn Trần Hiệp",
                "age": 28,
                "gender": "Nam",
                "phone": "0987654321",
                "address": "Hà Nội, Việt Nam",
                "admission_date": "2026-08-22 14:15",
                "primary_symptoms": ["Đau thượng vị cồn cào", "Ợ chua nóng rát", "Buồn nôn sau ăn"],
                "icd_code": "K29.7",
                "diagnosis": "Viêm loét dạ dày tá tràng mạn tính nghi ngờ trào ngược GERD",
                "department": "Khoa Tiêu hóa",
                "severity": "Medium",
                "vital_signs": {"temperature": 36.8, "blood_pressure": "120/80", "pulse": 78, "sp_o2": 99},
                "lab_findings": "Chưa có nội soi can thiệp",
                "treatment_plan": "Thuốc ức chế bơm proton (PPI) uống trước ăn 30 phút. Tránh đồ cay nóng, cà phê, kiêng bia rượu.",
                "doctor_notes": "Chỉ định nội soi dạ dày thực quản kiểm tra vi khuẩn HP nếu triệu chứng không thuyên giảm sau 2 tuần.",
                "created_at": "2026-08-22T14:15:00Z",
                "is_draft": False,
                "source": "manual_entry"
            },
            {
                "id": "rec-draft-03",
                "record_code": "BA-DRAFT-99",
                "user_id": "user-duy-02",
                "patient_name": "Nguyễn Trần Hiệp",
                "age": 28,
                "gender": "Nam",
                "admission_date": "2026-09-05 20:00",
                "primary_symptoms": ["Đau nửa đầu Migraine giật nhói"],
                "icd_code": "G43.9",
                "diagnosis": "Đau nửa đầu Migraine thể không có tiền triệu",
                "department": "Khoa Thần kinh",
                "severity": "Low",
                "treatment_plan": "Nghỉ ngơi phòng tối, tránh tiếng ồn, dùng Paracetamol khi cần.",
                "created_at": "2026-09-05T20:00:00Z",
                "is_draft": True,
                "source": "chat_session"
            }
        ]

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        for u in self.users.values():
            if u.get("email") == email:
                return dict(u)
        return None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        u = self.users.get(user_id)
        return dict(u) if u else None

    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        u_id = user_data.get("id") or str(uuid.uuid4())
        user_doc = {
            **user_data,
            "id": u_id,
            "created_at": user_data.get("created_at") or datetime.utcnow().isoformat()
        }
        self.users[u_id] = user_doc
        return dict(user_doc)

    def list_users(self) -> List[Dict[str, Any]]:
        return [dict(u) for u in self.users.values()]

    def update_user_role(self, user_id: str, role: str) -> bool:
        if user_id in self.users:
            self.users[user_id]["role"] = role
            return True
        return False

    def delete_user(self, user_id: str) -> bool:
        if user_id in self.users:
            del self.users[user_id]
            return True
        return False

    def get_medical_records(self, user_id: Optional[str] = None, include_drafts: bool = False) -> List[Dict[str, Any]]:
        records = []
        for r in self.medical_records:
            if not include_drafts and r.get("is_draft", False):
                continue
            if user_id and r.get("user_id") != user_id:
                continue
            records.append(dict(r))
        return sorted(records, key=lambda x: x.get("created_at", ""), reverse=True)

    def add_medical_record(self, record_data: Dict[str, Any]) -> Dict[str, Any]:
        rec_id = record_data.get("id") or f"rec-{uuid.uuid4().hex[:8]}"
        record_code = record_data.get("record_code") or f"BA-{datetime.utcnow().strftime('%Y%m%d%H%M')}"
        now_iso = datetime.utcnow().isoformat()
        
        record = {
            **record_data,
            "id": rec_id,
            "record_code": record_code,
            "created_at": record_data.get("created_at") or now_iso,
            "is_draft": record_data.get("is_draft", False)
        }
        self.medical_records.append(record)
        return dict(record)

    def delete_medical_record(self, record_id: str) -> bool:
        initial_len = len(self.medical_records)
        self.medical_records = [r for r in self.medical_records if r.get("id") != record_id]
        return len(self.medical_records) < initial_len

    def save_message(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        msg = {
            **message_data,
            "id": message_data.get("id") or message_data.get("message_id") or str(uuid.uuid4()),
            "created_at": message_data.get("created_at") or datetime.utcnow().isoformat()
        }
        self.messages.append(msg)
        return dict(msg)

    def get_messages_by_session(self, session_id: str) -> List[Dict[str, Any]]:
        return [dict(m) for m in self.messages if m.get("session_id") == session_id]

    def add_feedback(self, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        fb_id = feedback_data.get("id") or f"fb-{len(self.feedback) + 1}"
        doc = {
            **feedback_data,
            "id": fb_id,
            "created_at": feedback_data.get("created_at") or datetime.utcnow().isoformat()
        }
        self.feedback.append(doc)
        return dict(doc)

    def get_feedback_stats(self) -> Dict[str, Any]:
        total = len(self.feedback)
        correct_count = sum(1 for f in self.feedback if f.get("doctor_label_correct"))
        accuracy = (correct_count / total * 100.0) if total > 0 else 100.0
        return {
            "total_cases_reviewed": total,
            "correct_predictions": correct_count,
            "accuracy_rate_percentage": round(accuracy, 2),
            "recent_logs": [dict(f) for f in self.feedback[-10:]]
        }

db_fallback = InMemoryDatabase()

class DatabaseManager:
    client = None
    db = None

db_manager = DatabaseManager()

class _MongoConnectionStatus:
    def __bool__(self):
        return db_manager.db is not None
    def __call__(self):
        return db_manager.db is not None
    def __eq__(self, other):
        return bool(self) == bool(other)
    def __repr__(self):
        return str(bool(self))

class DatabaseService:
    """Unified Database Service - Hỗ trợ cả MongoDB Atlas/Local và InMemory fallback."""

    @property
    def is_mongo_connected(self) -> _MongoConnectionStatus:
        return _MongoConnectionStatus()


    # --- Users ---
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        if self.is_mongo_connected():
            try:
                user = await db_manager.db["users"].find_one({"email": email})
                if user:
                    user.pop("_id", None)
                return user
            except Exception as e:
                logger.error(f"Error finding user by email in Mongo: {e}")
        return db_fallback.get_user_by_email(email)

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        if self.is_mongo_connected():
            try:
                user = await db_manager.db["users"].find_one({"id": user_id})
                if user:
                    user.pop("_id", None)
                return user
            except Exception as e:
                logger.error(f"Error finding user by id in Mongo: {e}")
        return db_fallback.get_user_by_id(user_id)

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        u_id = user_data.get("id") or str(uuid.uuid4())
        doc = {
            **user_data,
            "id": u_id,
            "created_at": user_data.get("created_at") or datetime.utcnow().isoformat()
        }
        if self.is_mongo_connected():
            try:
                await db_manager.db["users"].insert_one(dict(doc))
                inserted = dict(doc)
                inserted.pop("_id", None)
                # Keep fallback in sync
                db_fallback.users[u_id] = inserted
                return inserted
            except Exception as e:
                logger.error(f"Error creating user in Mongo: {e}")
        return db_fallback.create_user(doc)

    async def list_users(self) -> List[Dict[str, Any]]:
        if self.is_mongo_connected():
            try:
                cursor = db_manager.db["users"].find({})
                users = []
                async for u in cursor:
                    u.pop("_id", None)
                    users.append(u)
                return users
            except Exception as e:
                logger.error(f"Error listing users from Mongo: {e}")
        return db_fallback.list_users()

    async def update_user_role(self, user_id: str, role: str) -> bool:
        if self.is_mongo_connected():
            try:
                res = await db_manager.db["users"].update_one({"id": user_id}, {"$set": {"role": role}})
                db_fallback.update_user_role(user_id, role)
                return res.modified_count > 0 or res.matched_count > 0
            except Exception as e:
                logger.error(f"Error updating user role in Mongo: {e}")
        return db_fallback.update_user_role(user_id, role)

    async def delete_user(self, user_id: str) -> bool:
        if self.is_mongo_connected():
            try:
                res = await db_manager.db["users"].delete_one({"id": user_id})
                db_fallback.delete_user(user_id)
                return res.deleted_count > 0
            except Exception as e:
                logger.error(f"Error deleting user from Mongo: {e}")
        return db_fallback.delete_user(user_id)

    # --- Medical Records ---
    async def get_medical_records(self, user_id: Optional[str] = None, include_drafts: bool = False) -> List[Dict[str, Any]]:
        if self.is_mongo_connected():
            try:
                query: Dict[str, Any] = {}
                if not include_drafts:
                    query["is_draft"] = False
                if user_id:
                    query["user_id"] = user_id
                cursor = db_manager.db["medical_records"].find(query).sort("created_at", -1)
                records = []
                async for r in cursor:
                    r.pop("_id", None)
                    records.append(r)
                return records
            except Exception as e:
                logger.error(f"Error getting medical records from Mongo: {e}")
        return db_fallback.get_medical_records(user_id=user_id, include_drafts=include_drafts)

    async def add_medical_record(self, record_data: Dict[str, Any]) -> Dict[str, Any]:
        rec_id = record_data.get("id") or f"rec-{uuid.uuid4().hex[:8]}"
        record_code = record_data.get("record_code") or f"BA-{datetime.utcnow().strftime('%Y%m%d%H%M')}"
        now_iso = datetime.utcnow().isoformat()
        record = {
            **record_data,
            "id": rec_id,
            "record_code": record_code,
            "created_at": record_data.get("created_at") or now_iso,
            "is_draft": record_data.get("is_draft", False)
        }
        if self.is_mongo_connected():
            try:
                await db_manager.db["medical_records"].insert_one(dict(record))
                res = dict(record)
                res.pop("_id", None)
                db_fallback.add_medical_record(res)
                return res
            except Exception as e:
                logger.error(f"Error adding medical record to Mongo: {e}")
        return db_fallback.add_medical_record(record)

    async def delete_medical_record(self, record_id: str) -> bool:
        if self.is_mongo_connected():
            try:
                res = await db_manager.db["medical_records"].delete_one({"id": record_id})
                db_fallback.delete_medical_record(record_id)
                return res.deleted_count > 0
            except Exception as e:
                logger.error(f"Error deleting medical record from Mongo: {e}")
        return db_fallback.delete_medical_record(record_id)

    # --- Chat Messages ---
    async def save_message(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        msg = {
            **message_data,
            "id": message_data.get("id") or message_data.get("message_id") or str(uuid.uuid4()),
            "created_at": message_data.get("created_at") or datetime.utcnow().isoformat()
        }
        if self.is_mongo_connected():
            try:
                await db_manager.db["messages"].insert_one(dict(msg))
                res = dict(msg)
                res.pop("_id", None)
                db_fallback.save_message(res)
                return res
            except Exception as e:
                logger.error(f"Error saving message to Mongo: {e}")
        return db_fallback.save_message(msg)

    async def get_messages_by_session(self, session_id: str) -> List[Dict[str, Any]]:
        if self.is_mongo_connected():
            try:
                cursor = db_manager.db["messages"].find({"session_id": session_id}).sort("created_at", 1)
                messages = []
                async for m in cursor:
                    m.pop("_id", None)
                    messages.append(m)
                return messages
            except Exception as e:
                logger.error(f"Error getting messages from Mongo: {e}")
        return db_fallback.get_messages_by_session(session_id)

    # --- Feedback & QA ---
    async def add_feedback(self, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.is_mongo_connected():
            try:
                await db_manager.db["feedback"].insert_one(dict(feedback_data))
                res = dict(feedback_data)
                res.pop("_id", None)
                db_fallback.add_feedback(res)
                return res
            except Exception as e:
                logger.error(f"Error adding feedback to Mongo: {e}")
        return db_fallback.add_feedback(feedback_data)

    async def get_feedback_stats(self) -> Dict[str, Any]:
        if self.is_mongo_connected():
            try:
                total = await db_manager.db["feedback"].count_documents({})
                correct_count = await db_manager.db["feedback"].count_documents({"doctor_label_correct": True})
                cursor = db_manager.db["feedback"].find({}).sort("created_at", -1).limit(10)
                recent_logs = []
                async for f in cursor:
                    f.pop("_id", None)
                    recent_logs.append(f)
                accuracy = (correct_count / total * 100.0) if total > 0 else 100.0
                return {
                    "total_cases_reviewed": total,
                    "correct_predictions": correct_count,
                    "accuracy_rate_percentage": round(accuracy, 2),
                    "recent_logs": recent_logs
                }
            except Exception as e:
                logger.error(f"Error getting feedback stats from Mongo: {e}")
        return db_fallback.get_feedback_stats()

    async def get_feedback(self) -> List[Dict[str, Any]]:
        if self.is_mongo_connected:
            try:
                cursor = db_manager.db["feedback"].find({}).sort("created_at", -1)
                fbs = []
                async for f in cursor:
                    f.pop("_id", None)
                    fbs.append(f)
                return fbs
            except Exception as e:
                logger.error(f"Error getting feedback from Mongo: {e}")
        return [dict(f) for f in reversed(db_fallback.feedback)]

    async def get_session_count_for_user(self, user_id: str) -> int:
        if self.is_mongo_connected:
            try:
                return await db_manager.db["messages"].count_documents({"user_id": user_id})
            except Exception:
                pass
        return sum(1 for m in db_fallback.messages if m.get("user_id") == user_id)

    async def list_all_sessions(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Admin: Liệt kê tất cả các session hội thoại từ messages."""
        if self.is_mongo_connected():
            try:
                pipeline = [
                    {"$group": {
                        "_id": "$session_id",
                        "message_count": {"$sum": 1},
                        "last_message": {"$max": "$created_at"},
                        "user_id": {"$first": "$user_id"},
                        "first_message": {"$first": "$text_content"},
                    }},
                    {"$sort": {"last_message": -1}},
                    {"$skip": offset},
                    {"$limit": limit},
                ]
                cursor = db_manager.db["messages"].aggregate(pipeline)
                sessions = []
                async for s in cursor:
                    s["session_id"] = s.pop("_id")
                    sessions.append(s)
                return sessions
            except Exception as e:
                logger.error(f"Error listing sessions from Mongo: {e}")
        # In-memory fallback: group by session_id
        session_map: Dict[str, Any] = {}
        for m in db_fallback.messages:
            sid = m.get("session_id", "unknown")
            if sid not in session_map:
                session_map[sid] = {
                    "session_id": sid,
                    "message_count": 0,
                    "last_message": m.get("created_at", ""),
                    "user_id": m.get("user_id", "anonymous"),
                    "first_message": m.get("text_content", m.get("content", ""))[:100],
                }
            session_map[sid]["message_count"] += 1
            if m.get("created_at", "") > session_map[sid]["last_message"]:
                session_map[sid]["last_message"] = m.get("created_at", "")
        sessions = sorted(session_map.values(), key=lambda x: x.get("last_message", ""), reverse=True)
        return sessions[offset: offset + limit]


db_service = DatabaseService()

async def connect_to_mongo():
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL} (Database: {settings.DATABASE_NAME})...")
        db_manager.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=2500,
            connectTimeoutMS=2500
        )
        db_manager.db = db_manager.client[settings.DATABASE_NAME]
        # Ping server to verify connection
        await db_manager.client.admin.command("ping")
        logger.info("Connected to MongoDB successfully.")

        # Ensure collection indexes
        try:
            await db_manager.db["users"].create_index("email", unique=True)
            await db_manager.db["users"].create_index("id", unique=True)
            await db_manager.db["messages"].create_index("session_id")
            await db_manager.db["messages"].create_index("created_at")
            await db_manager.db["medical_records"].create_index("id", unique=True)
            await db_manager.db["medical_records"].create_index("user_id")
            await db_manager.db["medical_records"].create_index("record_code")
            await db_manager.db["feedback"].create_index("created_at")
            logger.info("MongoDB indexes verified.")
        except Exception as idx_err:
            logger.warning(f"Index creation warning: {idx_err}")

        # Seed initial users if collection empty
        user_count = await db_manager.db["users"].count_documents({})
        if user_count == 0:
            logger.info("Seeding initial users into MongoDB with bcrypt hashes...")
            for u in db_fallback.users.values():
                await db_manager.db["users"].insert_one(dict(u))
            logger.info(f"Seeded {len(db_fallback.users)} users into MongoDB.")

        # Seed initial medical records if collection empty
        rec_count = await db_manager.db["medical_records"].count_documents({})
        if rec_count == 0:
            logger.info("Seeding initial medical records into MongoDB...")
            for r in db_fallback.medical_records:
                await db_manager.db["medical_records"].insert_one(dict(r))
            logger.info(f"Seeded {len(db_fallback.medical_records)} medical records into MongoDB.")

    except Exception as e:
        logger.warning(f"MongoDB connection failed ({e}). Operating in resilient In-Memory mode.")
        db_manager.client = None
        db_manager.db = None

async def close_mongo_connection():
    if db_manager.client:
        db_manager.client.close()
        logger.info("MongoDB connection closed.")
