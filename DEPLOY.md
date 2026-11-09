# 黑貂 2027 营销日历 · 云端部署指南

让团队成员都能访问并共享同一份营销日历数据，只需两步：**部署静态页面** + **配置云端数据库（Supabase）**。

---

## 第一步：部署静态页面（获得团队可访问的网址）

任选一个免费平台，推荐 **Vercel** 或 **Cloudflare Pages**。

### 方案 A：Vercel（最简单，推荐）
1. 访问 https://vercel.com，用 GitHub 账号登录
2. 点击 **Add New → Project**，导入存放 `marketing-calendar` 文件夹的仓库
3. Framework Preset 选 **Other**，Build Command 留空，Output Directory 填 `marketing-calendar`
4. 点击 **Deploy**，几十秒后获得一个 `https://xxx.vercel.app` 网址
5. 把这个网址发给同事即可访问

### 方案 B：Cloudflare Pages
1. 访问 https://pages.cloudflare.com，登录 Cloudflare
2. **Create a project → Upload assets**
3. 把整个 `marketing-calendar` 文件夹拖进去上传
4. 部署后获得 `https://xxx.pages.dev` 网址

### 方案 C：GitHub Pages
1. 把 `marketing-calendar` 文件夹推送到 GitHub 仓库
2. 仓库 Settings → Pages → Source 选 `main` 分支，保存
3. 获得 `https://用户名.github.io/仓库名/marketing-calendar/` 网址

---

## 第二步：配置 Supabase（让团队共享同一份节点数据）

不配置 Supabase 时，每个人的手动节点只存在自己浏览器里，互相看不到。配置后所有人共享同一份数据。

### 1. 创建 Supabase 项目
1. 访问 https://supabase.com，注册免费账号
2. **New Project**，命名如 `sable-calendar`，选一个区域（新加坡/东京延迟低），设置数据库密码
3. 等待项目创建完成（约 2 分钟）

### 2. 建表
进入项目左侧 **SQL Editor → New query**，粘贴并执行：
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
  created_at timestamptz default now()
);
alter table calendar_events enable row level security;
create policy "public access" on calendar_events
  for all using (true) with check (true);
```

### 3. 获取配置
左侧 **Project Settings → API**：
- 复制 **Project URL**（形如 `https://xxxx.supabase.co`）
- 复制 **anon public** key（`eyJhbGciOi...` 开头的长字符串）

### 4. 在日历中填入
1. 打开部署好的日历网址
2. 点击右上角 **☁ 云同步** 按钮
3. 粘贴 URL 和 anon key，点击 **保存并同步**
4. 按钮变为 **☁ 已同步** 即成功

> 团队其他同事打开同一网址后，**无需重复配置**——但因为配置存在各自浏览器，建议把 URL 和 key 发到群里，每个人首次打开时点一次「云同步」填入即可。之后所有人新增/编辑/删除的节点都会实时共享。

---

## 数据说明
- **预置营销节点**（60+ 电商/内容/节日节点 + 泳镜内容策略）：写死在代码里，所有人可见，不可删除
- **手动添加的节点**：存储在 Supabase，团队共享，可增删改
- 未配置 Supabase 时，手动节点仅保存在本地浏览器

## 常见问题
- **同事看不到我加的节点？** 确认双方都点了「☁ 云同步」并填入了相同的 URL 和 key
- **云同步按钮报错？** 检查表是否创建成功、RLS policy 是否执行、URL/key 是否正确
- **想换数据？** 直接在 Supabase Table Editor 里编辑 `calendar_events` 表即可
