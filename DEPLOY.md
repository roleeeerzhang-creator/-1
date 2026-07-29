# Personal OS — 部署指南

## 整体架构

```
你的手机/电脑
    │
    ▼
Vercel (前端静态页面)  ←── 自动从 GitHub 部署
    │
    ▼ API 调用
Railway (FastAPI 后端 + PostgreSQL 数据库)
```

---

## 第一步：GitHub 准备（5分钟）

1. 打开 https://github.com/new
2. 仓库名：`personal-os`
3. 选择 Private（私人仓库，你的数据安全）
4. 不要勾选任何初始化选项
5. 创建后，记下仓库地址，如 `https://github.com/你的用户名/personal-os.git`

### 创建 Personal Access Token
1. 打开 https://github.com/settings/tokens
2. 点「Generate new token (classic)」
3. Note 填 `personal-os-deploy`
4. 勾选 `repo`（全部）、`workflow`
5. 生成后**立即复制保存**（只显示一次）

---

## 第二步：Railway 部署后端+数据库（10分钟）

1. 打开 https://railway.com
2. 用 GitHub 登录
3. 点「New Project」→「Deploy from GitHub repo」
4. 选择刚才创建的 `personal-os` 仓库
5. Railway 会自动检测 `backend/railway.toml`

### 添加 PostgreSQL 数据库
1. 在项目页面点「+ New」→「Database」→「Add PostgreSQL」
2. 等待数据库创建完成
3. 点数据库卡片 →「Connect」→ 复制 `DATABASE_URL`（以 `postgresql://` 开头）

### 配置后端环境变量
1. 点后端服务卡片 →「Variables」
2. 添加：
   - `DATABASE_URL` = 粘贴刚才复制的数据库连接地址
   - `SECRET_KEY` = 随便填一个长随机字符串（如 `my-super-secret-key-2026`）
   - `PORT` = `8000`

### 初始化数据库
1. 在 Railway 后端服务页面 → 点「Shell」打开命令行
2. 运行：
```bash
apt-get update && apt-get install -y postgresql-client
psql $DATABASE_URL -f /app/schema.sql
```
> 等等，Railway 上的 schema.sql 需要先上传。所以更简单的方式：
1. Railway 项目页面 → 后端服务 →「Settings」→ 找到「Public URL」
2. 复制后端地址，如 `https://personal-os.up.railway.app`
3. 浏览器访问 `https://你的后端地址/docs` → 能看到 Swagger API 文档就成功了
4. 然后在本地运行：
```bash
# 把本地 schema.sql 导入 Railway 数据库
psql "你的DATABASE_URL" -f schema.sql
```

---

## 第三步：Vercel 部署前端（5分钟）

### 3.1 修改 API 地址
编辑 `frontend/index.html`，把第一行 JS 中的：
```js
const API='__RAILWAY_API_URL__/api/v1';
```
改成你 Railway 后端的实际地址：
```js
const API='https://你的项目名.up.railway.app/api/v1';
```

### 3.2 部署到 Vercel
1. 打开 https://vercel.com
2. 用 GitHub 登录
3. 点「Add New」→「Project」
4. 导入 `personal-os` 仓库
5. **Framework Preset** 选 `Other`
6. **Root Directory** 设为 `frontend`
7. **Build Command** 留空
8. **Output Directory** 留空
9. 点「Deploy」
10. 部署完成后会得到一个地址如 `https://personal-os.vercel.app`

---

## 第四步：验证

1. 浏览器打开 Vercel 给的地址
2. 看到登录页面 → 输入 `vincent` / `admin123`
3. 进入 Dashboard → 确认数据正常加载

### 手机添加到桌面
- iPhone Safari：打开网址 → 分享 → 添加到主屏幕
- Android Chrome：打开网址 → 菜单 → 添加到主屏幕
- 会出现粉色 Personal OS 图标，点击像原生 App 一样打开

---

## 日常更新

每次修改代码后：
```bash
git add -A
git commit -m "更新描述"
git push origin master
```
- Vercel 自动重新部署前端（约30秒）
- Railway 自动重新部署后端（约2分钟）

---

## 成本

| 服务 | 免费额度 | 是否够用 |
|------|---------|---------|
| GitHub | 无限私人仓库 | ✅ |
| Railway | $5 免费额度/月 | ✅ PostgreSQL + 后端约 $3-4/月 |
| Vercel | 100GB 带宽/月 | ✅ 个人使用绰绰有余 |

**总成本：$0/月**（Railway 免费额度内）

---

## 本地开发

如果要在本地修改代码后测试：
```bash
# 终端1：启动后端
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 终端2：启动前端
cd frontend
python3 -m http.server 3000
# 访问 http://localhost:3000
```
