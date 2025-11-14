# 认证系统设置指南

## 已完成的配置

### 1. Prisma Schema 更新
- ✅ 在 User 模型中添加了 `password` 字段
- ✅ 数据库已同步

### 2. Auth.js 配置
- ✅ 配置了 Credentials 提供者
- ✅ 使用 bcrypt 进行密码加密
- ✅ JWT session 策略

### 3. Middleware
- ✅ 保护路由配置
- ✅ 自动重定向到登录页
- ✅ 已登录用户访问登录页自动跳转

### 4. API 路由
- ✅ `/api/auth/register` - 用户注册
- ✅ `/api/auth/[...nextauth]` - NextAuth 处理器

### 5. 页面
- ✅ `/auth/login` - 登录页面
- ✅ `/auth/register` - 注册页面

## 受保护的路由

以下路由需要登录才能访问:
- `/articleList` - 文章列表
- `/api/user/*` - 用户相关 API

## 使用方法

### 在服务器组件中获取会话

\`\`\`typescript
import { auth } from "@/auth"

export default async function Page() {
  const session = await auth()
  
  if (!session) {
    // 用户未登录
    return <div>请先登录</div>
  }
  
  return <div>欢迎, {session.user.name}</div>
}
\`\`\`

### 在客户端组件中使用会话

\`\`\`typescript
"use client"

import { useSession } from "next-auth/react"

export default function ClientComponent() {
  const { data: session, status } = useSession()
  
  if (status === "loading") {
    return <div>加载中...</div>
  }
  
  if (!session) {
    return <div>未登录</div>
  }
  
  return <div>欢迎, {session.user.name}</div>
}
\`\`\`

### 使用 UserButton 组件

\`\`\`typescript
import { auth } from "@/auth"
import { UserButton } from "@/components/custom/user-button"

export default async function Layout() {
  const session = await auth()
  
  return (
    <nav>
      {session ? (
        <UserButton user={session.user} />
      ) : (
        <a href="/auth/login">登录</a>
      )}
    </nav>
  )
}
\`\`\`

### 在 API 路由中验证

\`\`\`typescript
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }
  
  // 处理请求
  return NextResponse.json({ data: "受保护的数据" })
}
\`\`\`

### 登出

\`\`\`typescript
"use client"

import { signOut } from "next-auth/react"

export function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/auth/login" })}>
      退出登录
    </button>
  )
}
\`\`\`

## 环境变量

确保在 `.env` 或 `.env.local` 文件中设置以下变量:

\`\`\`env
DATABASE_URL="your-database-url"
AUTH_SECRET="your-secret-key"  # 运行 openssl rand -base64 32 生成
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

## 需要添加的功能 (可选)

1. **邮箱验证**
   - 注册后发送验证邮件
   - 使用 `emailVerified` 字段

2. **OAuth 提供者**
   - Google 登录
   - GitHub 登录

3. **密码重置**
   - 忘记密码功能
   - 使用 `VerificationToken` 模型

4. **会话管理**
   - 多设备登录管理
   - 强制登出功能

## 安全建议

1. ✅ 密码使用 bcrypt 加密
2. ✅ 使用 JWT session 策略
3. ⚠️ 确保 AUTH_SECRET 足够强且保密
4. ⚠️ 在生产环境中使用 HTTPS
5. ⚠️ 实施密码强度验证
6. ⚠️ 添加登录尝试次数限制
