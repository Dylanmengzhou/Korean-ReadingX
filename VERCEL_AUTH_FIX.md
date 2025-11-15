# 登录错误修复指南

## 问题症状
登录后跳转到 `/api/auth/error` 错误页面

## 根本原因
1. Vercel 环境变量未配置
2. Google OAuth 重定向 URI 未添加生产 URL

## 解决步骤

### 1. 配置 Vercel 环境变量

前往 Vercel 项目设置 → Environment Variables,添加以下变量:

#### ✅ 必需的环境变量

```bash
# 数据库连接
DATABASE_URL=your_neon_database_url_here

# NextAuth 密钥(两个都需要)
AUTH_SECRET=your_auth_secret_here
NEXTAUTH_SECRET=your_auth_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Resend 邮件服务
RESEND_API_KEY=your_resend_api_key_here
```

> ⚠️ **重要**: 请从本地 `.env` 文件复制实际的环境变量值到 Vercel 设置中。

#### ⚙️ 设置步骤:
1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. Settings → Environment Variables
4. 逐个添加上述变量
5. 确保选择 "Production", "Preview", "Development" 三个环境

### 2. 配置 Google OAuth 重定向 URI

#### 📍 步骤:

1. 前往 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

2. 选择你的 OAuth 2.0 客户端 ID (从你的 Google Cloud Console 获取)

3. 在 "已获授权的重定向 URI" 部分点击 "添加 URI"

4. 添加你的 Vercel 生产 URL:
   ```
   https://korean-reading-b7856cvkd-dylanmengzhous-projects.vercel.app/api/auth/callback/google
   ```

5. 如果有自定义域名,也要添加:
   ```
   https://your-custom-domain.com/api/auth/callback/google
   ```

6. 点击 "保存"

### 3. 重新部署

配置完成后:

```bash
# 提交更改
git add .
git commit -m "fix: 修复认证配置"
git push

# 或在 Vercel Dashboard 手动触发重新部署
```

### 4. 验证配置

部署完成后,运行环境变量检查:

```bash
# 本地检查
node scripts/check-env.js

# 在 Vercel 上检查(通过函数日志)
```

### 5. 测试登录

1. 访问你的生产 URL
2. 点击登录
3. 尝试 Google 登录
4. 应该能成功登录并跳转到首页

## 常见错误排查

### ❌ 错误: "Configuration" 
- **原因**: `AUTH_SECRET` 或 `NEXTAUTH_SECRET` 未设置
- **解决**: 在 Vercel 添加这两个环境变量

### ❌ 错误: "redirect_uri_mismatch"
- **原因**: Google OAuth 重定向 URI 不匹配
- **解决**: 检查 Google Console 中的重定向 URI 配置

### ❌ 错误: "Database connection failed"
- **原因**: `DATABASE_URL` 未设置或格式错误
- **解决**: 确认 Neon 数据库 URL 正确

### ❌ 错误: "OAuthAccountNotLinked"
- **原因**: 邮箱已被其他登录方式使用
- **解决**: 使用原始登录方式,或在数据库中合并账户

## 验证清单

- [ ] Vercel 环境变量已全部添加
- [ ] Google OAuth 重定向 URI 已配置
- [ ] 代码已提交并推送
- [ ] Vercel 部署成功
- [ ] 本地 `.env` 文件配置正确(用于开发)
- [ ] Google 登录测试通过
- [ ] 邮箱密码登录测试通过

## 额外建议

### 生成新的 AUTH_SECRET (可选)

如果担心密钥安全,可以生成新的:

```bash
# 使用 OpenSSL
openssl rand -base64 32

# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

然后在 Vercel 和本地 `.env` 文件中更新。

## 联系支持

如果问题仍未解决:
1. 检查 Vercel 部署日志
2. 查看浏览器控制台错误
3. 检查 Network 标签中的 API 请求

---

✅ 配置完成后,登录应该能正常工作!
