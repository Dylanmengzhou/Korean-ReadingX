import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { sendVerificationEmail, generateVerificationCode } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    // 检查邮箱是否已被注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 });
    }

    // 检查是否在短时间内多次发送（防止滥用）
    const recentVerification = await prisma.emailVerification.findFirst({
      where: {
        email,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // 60秒内
        },
      },
    });

    if (recentVerification) {
      return NextResponse.json(
        { error: "请稍后再试，验证码发送过于频繁" },
        { status: 429 }
      );
    }

    // 生成验证码
    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 删除该邮箱之前的验证码
    await prisma.emailVerification.deleteMany({
      where: { email },
    });

    // 存储新的验证码
    await prisma.emailVerification.create({
      data: {
        email,
        code,
        expires,
      },
    });

    // 发送邮件
    const result = await sendVerificationEmail(email, code);

    if (!result.success) {
      return NextResponse.json(
        { error: "发送验证码失败，请稍后重试" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "验证码已发送，请查收邮件" },
      { status: 200 }
    );
  } catch (error) {
    console.error("发送验证码错误:", error);
    return NextResponse.json(
      { error: "发送验证码失败，请稍后重试" },
      { status: 500 }
    );
  }
}
