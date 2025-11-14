import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { NextRequest, NextResponse } from "next/server";

// 获取用户的所有收藏
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 通过 email 查找用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: user.id,
      },
      include: {
        article: {
          select: {
            id: true,
            titleZh: true,
            descriptionZh: true,
            tags: true,
            content: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error("获取收藏失败:", error);
    return NextResponse.json({ error: "获取收藏失败" }, { status: 500 });
  }
}

// 添加收藏
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 通过 email 查找用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const { articleId } = await request.json();

    if (!articleId) {
      return NextResponse.json({ error: "缺少文章ID" }, { status: 400 });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: user.id,
        articleId,
      },
    });

    return NextResponse.json(favorite);
  } catch (error) {
    console.error("添加收藏失败:", error);
    return NextResponse.json({ error: "添加收藏失败" }, { status: 500 });
  }
}

// 取消收藏
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 通过 email 查找用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json({ error: "缺少文章ID" }, { status: 400 });
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: user.id,
        articleId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("取消收藏失败:", error);
    return NextResponse.json({ error: "取消收藏失败" }, { status: 500 });
  }
}
