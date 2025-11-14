// 示例 1: 在服务器组件中使用认证
// app/protected/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div>
      <h1>受保护的页面</h1>
      <p>欢迎, {session.user.name || session.user.email}!</p>
      <p>用户 ID: {session.user.id}</p>
    </div>
  );
}

// 示例 2: 在客户端组件中使用认证
// components/profile.tsx
("use client");

import { useSession, signOut } from "next-auth/react";

export function ProfileComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>加载中...</div>;
  }

  if (!session) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <h2>用户资料</h2>
      <p>姓名: {session.user.name}</p>
      <p>邮箱: {session.user.email}</p>
      <button onClick={() => signOut()}>退出登录</button>
    </div>
  );
}

// 示例 3: 在 API 路由中验证
// app/api/protected/route.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "未授权访问" }, { status: 401 });
  }

  // 返回受保护的数据
  return NextResponse.json({
    message: "这是受保护的数据",
    userId: session.user.id,
  });
}

// 示例 4: 在导航栏中显示用户信息
// components/navbar.tsx
import { auth } from "@/auth";
import { UserButton } from "@/components/custom/user-button";
import Link from "next/link";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="flex items-center justify-between p-4">
      <Link href="/">首页</Link>

      <div className="flex items-center gap-4">
        {session ? (
          <>
            <Link href="/articleList">文章列表</Link>
            <UserButton user={session.user} />
          </>
        ) : (
          <>
            <Link href="/auth/login">登录</Link>
            <Link href="/auth/register">注册</Link>
          </>
        )}
      </div>
    </nav>
  );
}

// 示例 5: 编程式登录
// app/custom-login/actions.ts
("use server");

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function authenticate(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.message };
    }
    throw error;
  }
}

// 示例 6: 在 Server Action 中使用
// app/profile/actions.ts
("use server");

import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function updateProfile(name: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("未授权");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  return { success: true };
}
