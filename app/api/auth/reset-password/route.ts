import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, code, password } = await request.json();
    const normalizedEmail = email?.trim().toLowerCase();

    // 验证输入
    if (!normalizedEmail || !code || !password) {
      return NextResponse.json(
        { error: "邮箱、验证码和密码不能为空" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码长度至少为 6 位" },
        { status: 400 }
      );
    }

    // 查找验证码记录
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        email: normalizedEmail,
        code,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!resetRecord) {
      return NextResponse.json({ error: "验证码无效" }, { status: 400 });
    }

    // 检查验证码是否过期
    if (new Date() > resetRecord.expires) {
      // 删除过期的验证码
      await prisma.passwordReset.delete({
        where: { id: resetRecord.id },
      });
      return NextResponse.json(
        { error: "验证码已过期，请重新获取" },
        { status: 400 }
      );
    }

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 删除使用过的验证码
    await prisma.passwordReset.delete({
      where: { id: resetRecord.id },
    });

    // 删除该邮箱的其他验证码
    await prisma.passwordReset.deleteMany({
      where: { email: normalizedEmail },
    });

    return NextResponse.json({ message: "密码重置成功" }, { status: 200 });
  } catch (error) {
    console.error("重置密码错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
