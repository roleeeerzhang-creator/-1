"""
Personal OS Backend — FastAPI Application
"""
import os
import json
import uuid
from datetime import datetime, date, timedelta, timezone
from decimal import Decimal
from typing import Optional, Any

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from jose import JWTError, jwt
from passlib.context import CryptContext
import asyncpg
from contextlib import asynccontextmanager


# Custom JSON encoder for UUID, Decimal, datetime
class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (uuid.UUID,)):
            return str(obj)
        if isinstance(obj, (Decimal,)):
            return float(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


def serialize_row(row):
    """Convert asyncpg Row to JSON-safe dict"""
    if row is None:
        return None
    return json.loads(json.dumps(dict(row), cls=CustomEncoder))


def serialize_rows(rows):
    return [serialize_row(r) for r in rows]

# ============================================================
# Config
# ============================================================
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/personal_os")
SECRET_KEY = os.getenv("SECRET_KEY", "personal-os-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============================================================
# Database Pool
# ============================================================
pool: asyncpg.Pool = None

async def get_pool():
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    return pool

async def get_db():
    p = await get_pool()
    async with p.acquire() as conn:
        yield conn

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    print("🚀 Personal OS Backend started")
    yield
    await pool.close()
    print("👋 Personal OS Backend stopped")

# ============================================================
# App
# ============================================================
app = FastAPI(
    title="Personal OS API",
    version="1.0.0",
    description="人生操作系统 API — 你的第二大脑",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载前端静态文件
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/app", StaticFiles(directory=frontend_dir, html=True), name="frontend")

@app.get("/app")
async def spa_fallback():
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "frontend not found"}

# ============================================================
# Auth
# ============================================================
class TokenData(BaseModel):
    user_id: str
    role: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Query(None)):
    if not token:
        return {"user_id": "default", "role": "owner"}
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"user_id": payload.get("sub"), "role": payload.get("role", "owner")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============================================================
# Models
# ============================================================
class LoginRequest(BaseModel):
    username: str
    password: str

class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: str = "annual"
    start_date: str
    end_date: str
    priority: int = 5
    color: str = "#ec4899"

class KeyResultCreate(BaseModel):
    objective_id: str
    title: str
    target_value: float
    start_value: float = 0
    unit: str = ""

class MilestoneCreate(BaseModel):
    objective_id: str
    title: str
    due_date: str

class NoteCreate(BaseModel):
    title: str
    content: str
    domain_id: Optional[str] = None
    note_type: str = "highlight"

class InsightCreate(BaseModel):
    content: str
    domain_id: Optional[str] = None

class TransactionCreate(BaseModel):
    account_id: str
    category_id: Optional[str] = None
    amount: float
    description: Optional[str] = None
    transacted_at: str

class HealthQuickLog(BaseModel):
    content: str
    recorded_at: Optional[str] = None

class ContactCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None

class ReviewCreate(BaseModel):
    title: str
    period: str = "weekly"
    content: str
    mood_score: Optional[int] = None
    productivity_score: Optional[int] = None
    reviewed_at: str

# ============================================================
# Auth Endpoints
# ============================================================
@app.post("/api/v1/auth/login")
async def login(req: LoginRequest, db=Depends(get_db)):
    row = await db.fetchrow(
        "SELECT id, username, password_hash, role FROM system.user WHERE username = $1 AND deleted_at IS NULL",
        req.username
    )
    if not row or not pwd_context.verify(req.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    await db.execute("UPDATE system.user SET last_login_at = now() WHERE id = $1", row["id"])
    token = create_access_token({"sub": str(row["id"]), "role": row["role"]})
    return {"access_token": token, "user": {"id": str(row["id"]), "username": row["username"], "role": row["role"]}}

# ============================================================
# Dashboard Endpoint
# ============================================================
@app.get("/api/v1/dashboard")
async def dashboard(db=Depends(get_db)):
    # Goals
    goals = await db.fetchrow("SELECT COUNT(*) as total, COALESCE(AVG(progress),0) as avg_progress FROM goal.objective WHERE deleted_at IS NULL AND status = 'active'")
    
    # Finance
    finance = await db.fetchrow("""
        SELECT 
            COALESCE(SUM(CASE WHEN a.type != 'securities' THEN a.balance ELSE 0 END), 0) as net_worth,
            COALESCE(SUM(CASE WHEN t.amount > 0 AND t.transacted_at >= date_trunc('month', now()) THEN t.amount ELSE 0 END), 0) as monthly_income,
            COALESCE(SUM(CASE WHEN t.amount < 0 AND t.transacted_at >= date_trunc('month', now()) THEN ABS(t.amount) ELSE 0 END), 0) as monthly_expense
        FROM finance.account a
        LEFT JOIN finance.transaction t ON t.account_id = a.id AND t.deleted_at IS NULL
        WHERE a.deleted_at IS NULL AND a.is_active = true
    """)
    
    # Health score (simplified)
    health = await db.fetchrow("SELECT COALESCE(AVG(quality_score), 85) as score FROM health.sleep WHERE sleep_date >= CURRENT_DATE - INTERVAL '7 days' AND deleted_at IS NULL")
    
    # Growth
    growth = await db.fetchrow("SELECT COUNT(*) as total_notes FROM growth.note WHERE deleted_at IS NULL AND created_at >= date_trunc('month', now())")
    
    # Relation
    relation = await db.fetchrow("SELECT COUNT(*) as total FROM relation.contact WHERE deleted_at IS NULL")
    
    # Today's tasks (milestones due today)
    tasks = await db.fetch("""
        SELECT m.title, m.status, o.title as objective_title 
        FROM goal.milestone m 
        JOIN goal.objective o ON o.id = m.objective_id 
        WHERE m.due_date = CURRENT_DATE AND m.deleted_at IS NULL AND m.status != 'done'
        LIMIT 5
    """)
    
    # Domain heatmap
    domains = await db.fetch("""
        SELECT d.name, d.color, COUNT(n.id) as count 
        FROM growth.domain d 
        LEFT JOIN growth.note n ON n.domain_id = d.id AND n.deleted_at IS NULL AND n.created_at >= date_trunc('month', now())
        WHERE d.deleted_at IS NULL 
        GROUP BY d.id, d.name, d.color 
        ORDER BY count DESC
    """)
    
    return {
        "goals": {"total": goals["total"], "avg_progress": round(float(goals["avg_progress"] or 0), 1)},
        "finance": {
            "net_worth": float(finance["net_worth"] or 0),
            "monthly_income": float(finance["monthly_income"] or 0),
            "monthly_expense": float(finance["monthly_expense"] or 0),
        },
        "health": {"score": int(health["score"] or 85)},
        "growth": {"monthly_notes": growth["total_notes"]},
        "relation": {"total_contacts": relation["total"]},
        "today_tasks": [{"title": t["title"], "status": t["status"], "objective": t["objective_title"]} for t in tasks],
        "domain_heatmap": [{"name": d["name"], "color": d["color"], "count": d["count"]} for d in domains],
    }

# ============================================================
# Goal Endpoints
# ============================================================
@app.get("/api/v1/goals")
async def list_goals(status: Optional[str] = None, db=Depends(get_db)):
    query = "SELECT * FROM goal.objective WHERE deleted_at IS NULL"
    params = []
    if status:
        query += " AND status = $1"
        params.append(status)
    query += " ORDER BY priority DESC, created_at DESC"
    rows = await db.fetch(query, *params)
    return serialize_rows(rows)

@app.post("/api/v1/goals")
async def create_goal(goal: GoalCreate, db=Depends(get_db)):
    row = await db.fetchrow(
        """INSERT INTO goal.objective (title, description, type, start_date, end_date, priority, color) 
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *""",
        goal.title, goal.description, goal.type, date.fromisoformat(goal.start_date), date.fromisoformat(goal.end_date), goal.priority, goal.color
    )
    return serialize_row(row)

@app.post("/api/v1/goals/{goal_id}/key-results")
async def create_kr(goal_id: str, kr: KeyResultCreate, db=Depends(get_db)):
    row = await db.fetchrow(
        """INSERT INTO goal.key_result (objective_id, title, target_value, start_value, unit) 
           VALUES ($1,$2,$3,$4,$5) RETURNING *""",
        goal_id, kr.title, kr.target_value, kr.start_value, kr.unit
    )
    return serialize_row(row)

@app.post("/api/v1/goals/{goal_id}/milestones")
async def create_milestone(goal_id: str, ms: MilestoneCreate, db=Depends(get_db)):
    row = await db.fetchrow(
        "INSERT INTO goal.milestone (objective_id, title, due_date) VALUES ($1,$2,$3) RETURNING *",
        goal_id, ms.title, date.fromisoformat(ms.due_date)
    )
    return serialize_row(row)

# ============================================================
# Growth Endpoints
# ============================================================
@app.get("/api/v1/growth/domains")
async def list_domains(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM growth.domain WHERE deleted_at IS NULL ORDER BY sort_order")
    return serialize_rows(rows)

@app.get("/api/v1/growth/notes")
async def list_notes(domain_id: Optional[str] = None, limit: int = 20, offset: int = 0, db=Depends(get_db)):
    query = "SELECT n.*, d.name as domain_name FROM growth.note n LEFT JOIN growth.domain d ON d.id = n.domain_id WHERE n.deleted_at IS NULL"
    params = []
    if domain_id:
        query += " AND n.domain_id = $1"
        params.append(domain_id)
    query += f" ORDER BY n.created_at DESC LIMIT {limit} OFFSET {offset}"
    rows = await db.fetch(query, *params)
    return serialize_rows(rows)

@app.post("/api/v1/growth/notes")
async def create_note(note: NoteCreate, db=Depends(get_db)):
    word_count = len(note.content) if note.content else 0
    reading_time = max(1, word_count // 300)
    row = await db.fetchrow(
        """INSERT INTO growth.note (title, content, domain_id, note_type, word_count, reading_time) 
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING *""",
        note.title, note.content, note.domain_id, note.note_type, word_count, reading_time
    )
    return serialize_row(row)

@app.post("/api/v1/growth/insights")
async def create_insight(insight: InsightCreate, db=Depends(get_db)):
    row = await db.fetchrow(
        "INSERT INTO growth.insight (content, domain_id) VALUES ($1,$2) RETURNING *",
        insight.content, insight.domain_id
    )
    return serialize_row(row)

@app.get("/api/v1/growth/insights")
async def list_insights(limit: int = 20, db=Depends(get_db)):
    rows = await db.fetch(
        "SELECT i.*, d.name as domain_name FROM growth.insight i LEFT JOIN growth.domain d ON d.id = i.domain_id WHERE i.deleted_at IS NULL ORDER BY i.created_at DESC LIMIT $1",
        limit
    )
    return serialize_rows(rows)

# ============================================================
# Finance Endpoints
# ============================================================
@app.get("/api/v1/finance/accounts")
async def list_accounts(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM finance.account WHERE deleted_at IS NULL ORDER BY type, name")
    return serialize_rows(rows)

@app.get("/api/v1/finance/categories")
async def list_categories(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM finance.category WHERE deleted_at IS NULL ORDER BY type, name")
    return serialize_rows(rows)

@app.get("/api/v1/finance/transactions")
async def list_transactions(limit: int = 50, offset: int = 0, month: Optional[str] = None, db=Depends(get_db)):
    query = """SELECT t.*, a.name as account_name, c.name as category_name 
               FROM finance.transaction t 
               LEFT JOIN finance.account a ON a.id = t.account_id 
               LEFT JOIN finance.category c ON c.id = t.category_id 
               WHERE t.deleted_at IS NULL"""
    params = []
    if month:
        query += " AND to_char(t.transacted_at, 'YYYY-MM') = $1"
        params.append(month)
    query += f" ORDER BY t.transacted_at DESC LIMIT {limit} OFFSET {offset}"
    rows = await db.fetch(query, *params)
    return serialize_rows(rows)

@app.post("/api/v1/finance/transactions")
async def create_transaction(tx: TransactionCreate, db=Depends(get_db)):
    row = await db.fetchrow(
        """INSERT INTO finance.transaction (account_id, category_id, amount, description, transacted_at) 
           VALUES ($1,$2,$3,$4,$5) RETURNING *""",
        tx.account_id, tx.category_id, tx.amount, tx.description, datetime.fromisoformat(tx.transacted_at)
    )
    return serialize_row(row)

@app.post("/api/v1/finance/import/csv")
async def import_csv(file: UploadFile = File(...), db=Depends(get_db)):
    """导入支付宝/微信账单 CSV，AI 自动解析分类"""
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    
    lines = text.strip().split("\n")
    if len(lines) < 2:
        return {"status": "error", "message": "CSV 文件为空或格式不正确"}
    
    # 自动检测格式
    header = lines[0].lower()
    imported = 0
    skipped = 0
    preview = []
    
    # 获取默认分类
    categories = await db.fetch("SELECT id, name, type FROM finance.category WHERE deleted_at IS NULL")
    cat_map = {c["name"]: str(c["id"]) for c in categories}
    default_expense_id = cat_map.get("购物", list(cat_map.values())[0] if cat_map else None)
    
    # 获取默认账户
    account = await db.fetchrow("SELECT id FROM finance.account WHERE deleted_at IS NULL AND is_active = true LIMIT 1")
    account_id = str(account["id"]) if account else None
    
    if not account_id:
        return {"status": "error", "message": "请先创建账户"}
    
    for line in lines[1:]:
        if not line.strip():
            continue
        parts = line.replace('"', '').split(",")
        if len(parts) < 2:
            skipped += 1
            continue
        
        try:
            # 尝试多种 CSV 格式
            if len(parts) >= 5:
                trade_time, trade_type, counterparty, product, amount_str = parts[0], parts[1], parts[2], parts[3], parts[-2]
            else:
                trade_time, amount_str = parts[0], parts[1]
                counterparty, product = "", ""
            
            amount = float(amount_str.strip().replace("¥", "").replace("￥", "").replace(",", ""))
            is_expense = amount < 0 or "支出" in (parts[1] if len(parts) > 1 else "")
            
            # 简单分类
            cat_id = default_expense_id
            desc = f"{counterparty} {product}".strip()
            desc_lower = desc.lower()
            
            for cat_name, cid in cat_map.items():
                if cat_name in desc_lower:
                    cat_id = cid
                    break
            
            await db.execute(
                """INSERT INTO finance.transaction (account_id, category_id, amount, description, counterparty, transacted_at) 
                   VALUES ($1,$2,$3,$4,$5,$6)""",
                account_id, cat_id, -abs(amount) if is_expense else abs(amount), desc, counterparty, trade_time
            )
            imported += 1
            if len(preview) < 10:
                preview.append({"time": trade_time, "amount": amount, "description": desc, "is_expense": is_expense})
        except (ValueError, IndexError):
            skipped += 1
    
    return {"status": "success", "imported": imported, "skipped": skipped, "preview": preview}

# ============================================================
# Health Endpoints
# ============================================================
@app.post("/api/v1/health/quick-log")
async def health_quick_log(log: HealthQuickLog, db=Depends(get_db)):
    """一句话记录健康状态，AI 自动识别类型"""
    content = log.content
    recorded_at = log.recorded_at or datetime.now().strftime("%Y-%m-%d")
    
    # 简单关键词识别
    record_type = "other"
    if any(w in content for w in ["姨妈", "经期", "例假", "月经", "大姨妈", "来事"]):
        record_type = "menstruation"
    elif any(w in content for w in ["头疼", "头晕", "发烧", "感冒", "咳嗽", "不舒服", "难受", "疼"]):
        record_type = "symptom"
    elif any(w in content for w in ["体检", "检查", "胃镜", "B超", "CT", "核磁"]):
        record_type = "exam_report"
    elif any(w in content for w in ["跑", "健身", "游泳", "瑜伽", "运动", "锻炼"]):
        record_type = "exercise"
    
    row = await db.fetchrow(
        "INSERT INTO health.record (record_date, record_type, source, source_raw) VALUES ($1,$2,'manual',$3) RETURNING *",
        recorded_at, record_type, {"content": content}.__str__()
    )
    
    return {"status": "ok", "record_type": record_type, "record_id": str(row["id"]), "content": content}

@app.post("/api/v1/health/exam/upload")
async def upload_exam_report(file: UploadFile = File(...), exam_date: str = None, hospital: str = None, db=Depends(get_db)):
    """上传体检报告 PDF"""
    content = await file.read()
    # 保存文件（简化版，实际应存 MinIO）
    file_path = f"/workspace/personal-os/uploads/{file.filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(content)
    
    # 创建健康记录
    record = await db.fetchrow(
        "INSERT INTO health.record (record_date, record_type, source) VALUES ($1, 'exam_report', 'manual') RETURNING id",
        exam_date or datetime.now().strftime("%Y-%m-%d")
    )
    
    # 创建体检报告
    report = await db.fetchrow(
        """INSERT INTO health.exam_report (record_id, exam_date, hospital, report_file_url) 
           VALUES ($1,$2,$3,$4) RETURNING *""",
        record["id"], exam_date, hospital, file_path
    )
    
    return {"status": "ok", "report_id": str(report["id"]), "file": file.filename, "message": "体检报告已上传，AI 分析中..."}

@app.get("/api/v1/health/metrics")
async def list_body_metrics(metric_type: Optional[str] = None, limit: int = 30, db=Depends(get_db)):
    query = "SELECT * FROM health.body_metric WHERE deleted_at IS NULL"
    params = []
    if metric_type:
        query += " AND metric_type = $1"
        params.append(metric_type)
    query += " ORDER BY measured_at DESC LIMIT $2"
    params.append(limit)
    rows = await db.fetch(query, *params)
    return serialize_rows(rows)

# ============================================================
# Relation Endpoints
# ============================================================
@app.get("/api/v1/relations/contacts")
async def list_contacts(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM relation.contact WHERE deleted_at IS NULL ORDER BY relationship_level DESC, name")
    return serialize_rows(rows)

@app.post("/api/v1/relations/contacts")
async def create_contact(contact: ContactCreate, db=Depends(get_db)):
    row = await db.fetchrow(
        """INSERT INTO relation.contact (name, email, phone, company, notes) 
           VALUES ($1,$2,$3,$4,$5) RETURNING *""",
        contact.name, contact.email, contact.phone, contact.company, contact.notes
    )
    return serialize_row(row)

# 人情往来
class FavorCreate(BaseModel):
    contact_id: str
    type: str = "give"
    title: str
    amount: Optional[float] = None
    description: Optional[str] = None
    event_date: str
    is_reciprocated: bool = False
    notes: Optional[str] = None

@app.get("/api/v1/relations/favors")
async def list_favors(contact_id: Optional[str] = None, db=Depends(get_db)):
    query = """SELECT f.*, c.name as contact_name FROM relation.favor f 
               JOIN relation.contact c ON c.id = f.contact_id 
               WHERE f.deleted_at IS NULL"""
    params = []
    if contact_id:
        query += " AND f.contact_id = $1"
        params.append(contact_id)
    query += " ORDER BY f.event_date DESC LIMIT 100"
    rows = await db.fetch(query, *params)
    return serialize_rows(rows)

@app.post("/api/v1/relations/favors")
async def create_favor(favor: FavorCreate, db=Depends(get_db)):
    row = await db.fetchrow(
        """INSERT INTO relation.favor (contact_id, type, title, amount, description, event_date, is_reciprocated, notes) 
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *""",
        favor.contact_id, favor.type, favor.title, favor.amount, favor.description,
        date.fromisoformat(favor.event_date), favor.is_reciprocated, favor.notes
    )
    return serialize_row(row)

@app.get("/api/v1/relations/favors/summary")
async def favor_summary(db=Depends(get_db)):
    """人情往来汇总：各联系人给/收金额统计"""
    rows = await db.fetch("""
        SELECT c.id as contact_id, c.name as contact_name,
               COALESCE(SUM(CASE WHEN f.type='give' AND f.is_reciprocated=false THEN f.amount ELSE 0 END),0) as total_give_unreciprocated,
               COALESCE(SUM(CASE WHEN f.type='give' THEN f.amount ELSE 0 END),0) as total_give,
               COALESCE(SUM(CASE WHEN f.type='receive' THEN f.amount ELSE 0 END),0) as total_receive,
               COUNT(CASE WHEN f.is_reciprocated=false AND f.type='give' THEN 1 END) as pending_count
        FROM relation.contact c
        LEFT JOIN relation.favor f ON f.contact_id = c.id AND f.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        GROUP BY c.id, c.name
        ORDER BY total_give_unreciprocated DESC
    """)
    return serialize_rows(rows)

# ============================================================
# Review Endpoints
# ============================================================
@app.post("/api/v1/reviews")
async def create_review(review: ReviewCreate, db=Depends(get_db)):
    row = await db.fetchrow(
        """INSERT INTO public.review (title, period, content, mood_score, productivity_score, reviewed_at) 
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING *""",
        review.title, review.period, review.content, review.mood_score, review.productivity_score, date.fromisoformat(review.reviewed_at)
    )
    return serialize_row(row)

@app.get("/api/v1/reviews")
async def list_reviews(period: Optional[str] = None, limit: int = 10, db=Depends(get_db)):
    query = "SELECT * FROM public.review WHERE deleted_at IS NULL"
    params = []
    if period:
        query += " AND period = $1"
        params.append(period)
    query += " ORDER BY reviewed_at DESC LIMIT $2"
    params.append(limit)
    rows = await db.fetch(query, *params)
    return serialize_rows(rows)

# ============================================================
# Tag Endpoints
# ============================================================
@app.get("/api/v1/tags")
async def list_tags(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM public.tag WHERE deleted_at IS NULL ORDER BY name")
    return serialize_rows(rows)

# ============================================================
# Entity Link Endpoints
# ============================================================
@app.post("/api/v1/links")
async def create_link(source_type: str, source_id: str, target_type: str, target_id: str, relation_type: str = "relates_to", description: str = None, db=Depends(get_db)):
    row = await db.fetchrow(
        """INSERT INTO public.entity_link (source_type, source_id, target_type, target_id, relation_type, description) 
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING *""",
        source_type, source_id, target_type, target_id, relation_type, description
    )
    return serialize_row(row)

@app.get("/api/v1/links")
async def list_links(entity_type: str = None, entity_id: str = None, db=Depends(get_db)):
    if entity_type and entity_id:
        rows = await db.fetch(
            """SELECT * FROM public.entity_link 
               WHERE deleted_at IS NULL AND ((source_type = $1 AND source_id = $2) OR (target_type = $1 AND target_id = $2))
               ORDER BY created_at DESC""",
            entity_type, entity_id
        )
    else:
        rows = await db.fetch("SELECT * FROM public.entity_link WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 50")
    return serialize_rows(rows)

# ============================================================
# System Config
# ============================================================
@app.get("/api/v1/config")
async def list_config(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM system.config ORDER BY key")
    return serialize_rows(rows)

# ============================================================
# Health Check
# ============================================================
@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0", "timestamp": datetime.now().isoformat()}

# ============================================================
# Root
# ============================================================
@app.get("/")
async def root():
    return {
        "name": "Personal OS API",
        "version": "1.0.0",
        "docs": "/docs",
        "modules": ["goal", "growth", "finance", "health", "relation", "agent", "system"],
    }
