import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, verificationCode } = body;

    if (!email || !password || !verificationCode) {
      return NextResponse.json(
        { error: "邮箱、密码和验证码不能为空" },
        { status: 400 }
      );
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 });
    }

    // 验证验证码
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email,
        code: verificationCode,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verification) {
      return NextResponse.json({ error: "验证码错误" }, { status: 400 });
    }

    // 检查验证码是否过期
    if (new Date() > verification.expires) {
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      });
      return NextResponse.json(
        { error: "验证码已过期，请重新获取" },
        { status: 400 }
      );
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: hashedPassword,
        emailVerified: new Date(), // 标记邮箱已验证
      },
    });

    // 删除使用过的验证码
    await prisma.emailVerification.delete({
      where: { id: verification.id },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("注册错误:", error);
    return NextResponse.json({ error: "注册失败,请稍后重试" }, { status: 500 });
  }
}
