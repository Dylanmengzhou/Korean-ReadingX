import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "邮箱地址不能为空" }, { status: 400 });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "该邮箱未注册" }, { status: 404 });
    }

    // 检查是否是 Google 账号（没有密码）
    if (!user.password) {
      return NextResponse.json(
        { error: "此账号使用 Google 登录，无法重置密码" },
        { status: 400 }
      );
    }

    // 检查是否在60秒内已发送过验证码
    const recentCode = await prisma.passwordReset.findFirst({
      where: {
        email: normalizedEmail,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // 60秒内
        },
      },
    });

    if (recentCode) {
      return NextResponse.json(
        { error: "验证码已发送，请稍后再试" },
        { status: 429 }
      );
    }

    // 生成6位数验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 保存验证码到数据库（10分钟有效期）
    await prisma.passwordReset.create({
      data: {
        email: normalizedEmail,
        code,
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10分钟后过期
      },
    });

    // 发送验证码邮件
    const emailResult = await sendPasswordResetEmail(normalizedEmail, code);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "发送验证码失败，请稍后重试" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "验证码已发送到您的邮箱",
    });
  } catch (error) {
    console.error("发送密码重置验证码失败:", error);
    return NextResponse.json(
      { error: "发送验证码失败，请稍后重试" },
      { status: 500 }
    );
  }
}
