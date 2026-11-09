# 黑貂 SABLE 2027 营销日历 · 团队使用 & 部署指南

在线地址：**https://roleeeerzhang-creator.github.io/-1/**

---

## 一、同事怎么使用？（3 步上手）

### 第 1 步：打开网址
把下面的链接发给同事即可：
> **https://roleeeerzhang-creator.github.io/-1/**

### 第 2 步：连接云端共享数据
1. 打开页面后，点击右上角 **☁ 云同步** 按钮
2. 填入团队统一的 **Supabase URL** 和 **anon key**（找管理员要）
3. 点击 **保存并同步**，按钮变为 **☁ 已同步** 即成功

> 这一步只需做一次，配置会保存在各自浏览器里，以后打开自动连接。

### 第 3 步：输入自己的名字
首次打开会弹窗让你输入名字，这个名字会：
- 标记在你创建/修改的节点上（详情面板显示 👤 名字）
- 钉钉通知里显示"操作人：你的名字"

### 完成
现在所有人看到的是**同一份节点数据**。任何人新增/编辑/删除节点，其他人会在 **15 秒内**自动同步，并弹出提示「🔄 检测到节点更新，已同步」。

---

## 二、节点增删改如何同步给所有人？

### 同步机制
- **实时同步**：基于 Supabase Realtime WebSocket，有变更时即时推送
- **轮询兜底**：每 15 秒拉取一次云端最新数据，确保不漏
- **冲突处理**：以云端最新数据为准（后写入者覆盖）

### 操作说明
| 操作 | 方法 | 是否同步 | 是否钉钉通知 |
|------|------|---------|-------------|
| 新增节点 | 点日期格 → 右侧 + 按钮，或点顶部 **+ 添加节点** | ✅ 实时 | 勾选"重要"才通知 |
| 编辑节点 | 点击右侧任务项，修改后保存 | ✅ 实时 | 勾选"重要"才通知 |
| 删除节点 | 点任务项右侧 × | ✅ 实时 | 原节点为"重要"才通知 |
| 标记完成 | 点任务项左侧圆圈 | ✅ 实时 | ❌ 不通知 |

### 重要标记说明
- 新建/编辑节点时，底部有 **🔴 重要** 勾选框
- 勾选后：日历格 chip 前出现白点、详情面板显示「🔴重要」标签、**触发钉钉通知**
- 不勾选则仅同步不通知（适合日常小调整）

---

## 三、钉钉通知 & 验收提醒

### 触发钉钉通知的条件
**只有勾选了"🔴 重要"的节点**才会推送钉钉群消息：
- 🆕 新增重要节点 → 通知
- ✏️ 修改重要节点 → 通知
- 🗑️ 删除重要节点 → 通知
- 验收提醒（见下方）

通知内容包含：操作人、节点类型、日期、备注、日历链接。

### 验收提醒
- 节点设置了 **提醒**（准时/提前1天/提前3天）且未完成
- 距节点日期 **≤ 1 天** 时，自动推送钉钉验收提醒
- 每个节点只提醒一次（避免刷屏）
- 提醒内容含负责人、内容、日历链接

### 配置钉钉机器人（管理员操作，一次即可）

钉钉配置存储在 Supabase `app_config` 表中，**全团队共享**，只需一人配置。

1. 在钉钉群里添加机器人：
   - 群设置 → 智能群助手 → **添加机器人**
   - 选 **自定义** 机器人，名字随意（如"营销日历通知"）
   - 安全设置建议勾选 **加签**，复制 **加签密钥**（Secret）
   - 创建后复制 **Webhook 地址**（形如 `https://oapi.dingtalk.com/robot/send?access_token=xxx`）

2. 在日历页面配置：
   - 点 **☁ 云同步** 按钮
   - 下方"钉钉通知"区填入 Webhook 和加签密钥
   - 可选：填需要 @ 的手机号（逗号分隔），或勾选 @所有人
   - 点 **保存并同步**

> 配置保存在 Supabase，其他同事无需重复填写，打开页面自动加载。

---

## 四、Supabase 数据库配置（管理员首次配置）

### 1. 建表 SQL
进入 Supabase → SQL Editor，执行以下两段 SQL：

**① 节点数据表**（如已存在，只需执行 ALTER 添加字段）：
```sql
create table if not exists calendar_events (
  id uuid default gen_random_uuid() primary key,
  date text not null,
  type text not null,
  title text not null,
  note text,
  time text,
  remind text,
  done boolean default false,
  important boolean default false,
  created_by text,
  created_at timestamptz default now()
);

-- 如果表已存在但缺少字段，执行：
-- alter table calendar_events add column if not exists important boolean default false;
-- alter table calendar_events add column if not exists created_by text;

alter table calendar_events enable row level security;
drop policy if exists "public access" on calendar_events;
create policy "public access" on calendar_events
  for all using (true) with check (true);
```

**② 钉钉配置表**（团队共享钉钉配置）：
```sql
create table if not exists app_config (
  id uuid default gen_random_uuid() primary key,
  dingtalk_webhook text,
  dingtalk_secret text,
  dingtalk_at_all boolean default false,
  dingtalk_at_mobiles text
);
alter table app_config enable row level security;
drop policy if exists "public access" on app_config;
create policy "public access" on app_config
  for all using (true) with check (true);
```

### 2. 获取 URL 和 Key
Supabase → Project Settings → API：
- **Project URL**：`https://xxxx.supabase.co`
- **anon public** key：`eyJhbGciOi...` 长字符串

---

## 五、数据说明

| 数据类型 | 存储位置 | 团队共享 | 可编辑 |
|---------|---------|---------|-------|
| 预置营销节点（60+） | 代码内 | ✅ 所有人可见 | ❌ 不可删 |
| 手动添加的节点 | Supabase `calendar_events` | ✅ 共享 | ✅ 增删改 |
| 钉钉配置 | Supabase `app_config` | ✅ 共享 | ✅ 管理员配置 |
| 操作人名字 | 各自浏览器 localStorage | ❌ 个人 | ✅ 每人自己设 |

---

## 六、常见问题

**Q：同事看不到我加的节点？**
A：确认双方都点了「☁ 云同步」并填入了**相同的** URL 和 key。

**Q：钉钉没收到通知？**
A：① 确认节点勾选了"🔴 重要" ② 确认钉钉 Webhook 和加签密钥正确 ③ 确认 `app_config` 表已创建 ④ 检查钉钉机器人安全设置（加签模式必须填密钥）。

**Q：验收提醒什么时候发？**
A：节点设置了提醒（非"无"）且未完成，距日期 ≤ 1 天时自动发一次。需有人打开日历页面才会触发（页面在后台轮询时也会发）。

**Q：能 @ 指定的人吗？**
A：可以。在「☁ 云同步」→ 钉钉通知 → "@手机号"里填手机号（逗号分隔），验收提醒会 @ 这些人。

**Q：想让某个人只看不改？**
A：目前所有连接云端的人都可编辑。如需权限控制，可在 Supabase RLS policy 里限制（需要鉴权，较复杂，暂不支持）。
