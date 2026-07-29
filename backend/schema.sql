-- ============================================================
-- Personal OS v1.0 — 完整数据库 Schema
-- PostgreSQL 16
-- SSOT 核心数据库
-- ============================================================

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- Schema: public (全局横切)
-- ============================================================

CREATE SCHEMA IF NOT EXISTS goal;
CREATE SCHEMA IF NOT EXISTS growth;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS health;
CREATE SCHEMA IF NOT EXISTS relation;
CREATE SCHEMA IF NOT EXISTS agent;
CREATE SCHEMA IF NOT EXISTS system;

-- ----------------------------------------
-- public.tag — 全局标签
-- ----------------------------------------
CREATE TABLE public.tag (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#ec4899',
    scope VARCHAR(50) NOT NULL DEFAULT 'global',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX idx_tag_name ON public.tag(name) WHERE deleted_at IS NULL;

-- ----------------------------------------
-- public.entity_tag — 实体-标签关联
-- ----------------------------------------
CREATE TABLE public.entity_tag (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES public.tag(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_entity_tag_entity ON public.entity_tag(entity_type, entity_id);
CREATE INDEX idx_entity_tag_tag ON public.entity_tag(tag_id);

-- ----------------------------------------
-- public.media — 媒体文件元数据
-- ----------------------------------------
CREATE TABLE public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(300) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id UUID,
    ai_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------
-- public.review — 跨模块复盘
-- ----------------------------------------
CREATE TABLE public.review (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    period VARCHAR(20) NOT NULL DEFAULT 'weekly',
    content TEXT NOT NULL,
    ai_analysis TEXT,
    mood_score INT CHECK (mood_score BETWEEN 1 AND 10),
    productivity_score INT CHECK (productivity_score BETWEEN 1 AND 10),
    reviewed_at DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_review_period ON public.review(period, reviewed_at);

-- ----------------------------------------
-- public.entity_link — 万能实体关联
-- ----------------------------------------
CREATE TABLE public.entity_link (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50) NOT NULL,
    source_id UUID NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    relation_type VARCHAR(30) NOT NULL DEFAULT 'relates_to',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_entity_link_source ON public.entity_link(source_type, source_id);
CREATE INDEX idx_entity_link_target ON public.entity_link(target_type, target_id);


-- ============================================================
-- Schema: goal (目标管理)
-- ============================================================

CREATE TABLE goal.objective (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'annual',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    priority INT DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    progress DECIMAL(5,2) DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    parent_id UUID REFERENCES goal.objective(id),
    color VARCHAR(7) DEFAULT '#ec4899',
    icon VARCHAR(50) DEFAULT '🎯',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE goal.key_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id UUID NOT NULL REFERENCES goal.objective(id),
    title VARCHAR(200) NOT NULL,
    metric_type VARCHAR(20) NOT NULL DEFAULT 'number',
    start_value DECIMAL(15,4) NOT NULL DEFAULT 0,
    target_value DECIMAL(15,4) NOT NULL DEFAULT 0,
    current_value DECIMAL(15,4) DEFAULT 0,
    unit VARCHAR(20) DEFAULT '',
    weight DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE goal.milestone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id UUID NOT NULL REFERENCES goal.objective(id),
    title VARCHAR(200) NOT NULL,
    due_date DATE NOT NULL,
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);


-- ============================================================
-- Schema: growth (成长管理)
-- ============================================================

CREATE TABLE growth.domain (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#ec4899',
    icon VARCHAR(50) DEFAULT '📚',
    parent_id UUID REFERENCES growth.domain(id),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE growth.source (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'book',
    author VARCHAR(200),
    url TEXT,
    domain_id UUID REFERENCES growth.domain(id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    status VARCHAR(20) NOT NULL DEFAULT 'to_read',
    started_at DATE,
    finished_at DATE,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE growth.note (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    source_id UUID REFERENCES growth.source(id),
    domain_id UUID REFERENCES growth.domain(id),
    note_type VARCHAR(20) NOT NULL DEFAULT 'highlight',
    obsidian_path TEXT,
    word_count INT DEFAULT 0,
    reading_time INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE growth.insight (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    source_note_id UUID REFERENCES growth.note(id),
    domain_id UUID REFERENCES growth.domain(id),
    confidence INT DEFAULT 5 CHECK (confidence BETWEEN 1 AND 10),
    status VARCHAR(20) NOT NULL DEFAULT 'seed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);


-- ============================================================
-- Schema: finance (财务管理)
-- ============================================================

CREATE TABLE finance.account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'bank_card',
    currency VARCHAR(3) NOT NULL DEFAULT 'CNY',
    balance DECIMAL(18,2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    icon VARCHAR(50) DEFAULT '💳',
    color VARCHAR(7) DEFAULT '#ec4899',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE finance.category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'expense',
    parent_id UUID REFERENCES finance.category(id),
    icon VARCHAR(50) DEFAULT '📌',
    color VARCHAR(7) DEFAULT '#ec4899',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE finance.transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES finance.account(id),
    category_id UUID REFERENCES finance.category(id),
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'CNY',
    transacted_at TIMESTAMPTZ NOT NULL,
    description TEXT,
    counterparty VARCHAR(200),
    is_recurring BOOLEAN DEFAULT false,
    recurring_rule JSONB,
    tags JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_transaction_date ON finance.transaction(transacted_at);
CREATE INDEX idx_transaction_account ON finance.transaction(account_id);

CREATE TABLE finance.portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    account_id UUID NOT NULL REFERENCES finance.account(id),
    type VARCHAR(20) NOT NULL DEFAULT 'stock',
    total_cost DECIMAL(18,2) DEFAULT 0,
    market_value DECIMAL(18,2) DEFAULT 0,
    profit_loss DECIMAL(18,2) DEFAULT 0,
    return_rate DECIMAL(8,4) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE finance.holding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES finance.portfolio(id),
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity DECIMAL(18,4) NOT NULL DEFAULT 0,
    cost_price DECIMAL(18,4) NOT NULL DEFAULT 0,
    current_price DECIMAL(18,4) DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE finance.budget (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES finance.category(id),
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    period VARCHAR(20) NOT NULL DEFAULT 'monthly',
    year INT NOT NULL,
    month INT,
    spent DECIMAL(18,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);


-- ============================================================
-- Schema: health (健康管理)
-- ============================================================

CREATE TABLE health.record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_date DATE NOT NULL,
    record_type VARCHAR(20) NOT NULL DEFAULT 'other',
    source VARCHAR(20) NOT NULL DEFAULT 'manual',
    source_raw JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_health_record_date ON health.record(record_date);

CREATE TABLE health.exam_report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES health.record(id),
    exam_date DATE NOT NULL,
    hospital VARCHAR(200),
    report_file_url TEXT,
    ai_summary TEXT,
    ai_risk_alerts JSONB,
    overall_score INT CHECK (overall_score BETWEEN 1 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE health.exam_indicator (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_report_id UUID NOT NULL REFERENCES health.exam_report(id),
    name VARCHAR(100) NOT NULL,
    value VARCHAR(50) NOT NULL,
    unit VARCHAR(20),
    ref_range VARCHAR(50),
    is_abnormal BOOLEAN DEFAULT false,
    trend VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE health.body_metric (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES health.record(id),
    metric_type VARCHAR(30) NOT NULL DEFAULT 'weight',
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    measured_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_body_metric_type ON health.body_metric(metric_type, measured_at);

CREATE TABLE health.exercise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES health.record(id),
    exercise_type VARCHAR(20) NOT NULL DEFAULT 'run',
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_minutes INT,
    calories INT,
    distance_km DECIMAL(8,2),
    avg_heart_rate INT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE health.sleep (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES health.record(id),
    sleep_date DATE NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT,
    deep_sleep_minutes INT,
    rem_minutes INT,
    awake_count INT,
    quality_score INT CHECK (quality_score BETWEEN 1 AND 100),
    source VARCHAR(20) NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);


-- ============================================================
-- Schema: relation (人脉管理)
-- ============================================================

CREATE TABLE relation.contact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100),
    avatar_url TEXT,
    email VARCHAR(200),
    phone VARCHAR(30),
    wechat VARCHAR(100),
    company VARCHAR(200),
    position VARCHAR(200),
    birthday DATE,
    notes TEXT,
    relationship_level INT DEFAULT 5 CHECK (relationship_level BETWEEN 1 AND 10),
    last_contact_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE relation.group (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#ec4899',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE relation.contact_group (
    contact_id UUID NOT NULL REFERENCES relation.contact(id),
    group_id UUID NOT NULL REFERENCES relation.group(id),
    PRIMARY KEY (contact_id, group_id)
);

CREATE TABLE relation.interaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES relation.contact(id),
    type VARCHAR(20) NOT NULL DEFAULT 'meeting',
    title VARCHAR(200),
    notes TEXT,
    interacted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_interaction_contact ON relation.interaction(contact_id, interacted_at);


-- ============================================================
-- Schema: agent (AI 协作)
-- ============================================================

CREATE TABLE agent.config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(200) NOT NULL,
    model VARCHAR(50) NOT NULL DEFAULT 'gpt-4',
    system_prompt TEXT NOT NULL,
    tools JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE agent.prompt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(20) NOT NULL DEFAULT 'custom',
    tags JSONB,
    usage_count INT DEFAULT 0,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE agent.mcp_server (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    endpoint TEXT NOT NULL,
    protocol VARCHAR(20) NOT NULL DEFAULT 'stdio',
    tools_schema JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE agent.session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID REFERENCES agent.config(id),
    title VARCHAR(200),
    context_entity_type VARCHAR(50),
    context_entity_id UUID,
    message_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);


-- ============================================================
-- Schema: system (系统管理)
-- ============================================================

CREATE TABLE system.user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'owner',
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE system.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES system.user(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    changes JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE system.config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE system.sync_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'custom',
    direction VARCHAR(20) NOT NULL DEFAULT 'import',
    schedule VARCHAR(50),
    last_run_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'idle',
    error_log JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 种子数据：默认成长领域
-- ============================================================
INSERT INTO growth.domain (name, color, icon, sort_order) VALUES
    ('金融', '#ec4899', '💰', 1),
    ('历史', '#f472b6', '📜', 2),
    ('政治', '#f9a8d4', '🏛️', 3),
    ('认知', '#fbcfe8', '🧠', 4),
    ('心理', '#fce7f3', '❤️', 5);

-- ============================================================
-- 种子数据：默认财务分类
-- ============================================================
INSERT INTO finance.category (name, type, icon, color) VALUES
    ('餐饮', 'expense', '🍜', '#ec4899'),
    ('交通', 'expense', '🚗', '#f472b6'),
    ('居住', 'expense', '🏠', '#f9a8d4'),
    ('购物', 'expense', '🛒', '#fbcfe8'),
    ('娱乐', 'expense', '🎮', '#fce7f3'),
    ('医疗', 'expense', '💊', '#e11d48'),
    ('教育', 'expense', '📖', '#be185d'),
    ('通讯', 'expense', '📱', '#9d174d'),
    ('薪资', 'income', '💵', '#10b981'),
    ('投资', 'investment', '📈', '#f59e0b'),
    ('理财', 'income', '🏦', '#06b6d4'),
    ('其他收入', 'income', '📦', '#8b5cf6'),
    ('转账', 'transfer', '🔄', '#64748b');

-- ============================================================
-- 种子数据：默认标签
-- ============================================================
INSERT INTO public.tag (name, color, scope) VALUES
    ('重要', '#ec4899', 'global'),
    ('待办', '#f59e0b', 'global'),
    ('灵感', '#8b5cf6', 'global'),
    ('投资', '#10b981', 'global'),
    ('健康', '#06b6d4', 'global'),
    ('学习', '#3b82f6', 'global');

-- ============================================================
-- 种子数据：系统配置
-- ============================================================
INSERT INTO system.config (key, value, description) VALUES
    ('app.name', '"Personal OS"', '应用名称'),
    ('app.version', '"1.0.0"', '版本号'),
    ('theme.primary', '"#ec4899"', '主题色'),
    ('reminder.monthly_csv', '{"enabled": true, "day": 1, "time": "08:00"}', '月度CSV导入提醒'),
    ('reminder.weekly_review', '{"enabled": true, "day": 0, "time": "20:00"}', '每周复盘提醒'),
    ('ai.daily_brief', '{"enabled": true, "time": "07:00"}', '每日AI简报');

-- 创建默认管理员用户 (密码: admin123)
INSERT INTO system.user (username, email, password_hash, role) VALUES
    ('vincent', 'admin@personal-os.local', crypt('admin123', gen_salt('bf')), 'owner');

-- ============================================================
-- 完成
-- ============================================================
DO $$ BEGIN RAISE NOTICE '✅ Personal OS 数据库 Schema 创建完成！'; END $$;
