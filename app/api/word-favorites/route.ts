import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

// GET - 获取用户收藏的单词列表
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 从查询参数获取 articleId
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");

    const whereClause: { userId: string; articleId?: string } = {
      userId: user.id,
    };

    // 如果提供了 articleId，只返回该文章的收藏单词
    if (articleId) {
      whereClause.articleId = articleId;
    }

    const wordFavorites = await prisma.wordFavorite.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(wordFavorites);
  } catch (error) {
    console.error("获取单词收藏失败:", error);
    return NextResponse.json({ error: "获取单词收藏失败" }, { status: 500 });
  }
}

// POST - 添加单词到收藏
export async function POST(request: Request) {
  try {
    console.log("[word-favorites] POST 请求开始");
    const session = await auth();

    if (!session?.user?.email) {
      console.log("[word-favorites] 未授权，无 session");
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    console.log("[word-favorites] 用户邮箱:", session.user.email);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      console.log("[word-favorites] 用户不存在");
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    console.log("[word-favorites] 用户 ID:", user.id);

    const body = await request.json();
    console.log("[word-favorites] 请求 body:", body);
    const {
      word,
      articleId,
      baseForm,
      pronunciation,
      meanings,
      posPrimary,
      posSecondary,
      summary,
    } = body;

    if (!word) {
      console.log("[word-favorites] 单词为空");
      return NextResponse.json({ error: "单词不能为空" }, { status: 400 });
    }

    if (!articleId) {
      console.log("[word-favorites] 文章ID为空");
      return NextResponse.json({ error: "文章ID不能为空" }, { status: 400 });
    }

    // 使用 upsert 避免重复收藏
    console.log(
      "[word-favorites] 准备 upsert，userId:",
      user.id,
      "articleId:",
      articleId,
      "word:",
      word
    );
    const wordFavorite = await prisma.wordFavorite.upsert({
      where: {
        userId_articleId_word: {
          userId: user.id,
          articleId: articleId,
          word: word,
        },
      },
      update: {
        baseForm,
        pronunciation,
        meanings,
        posPrimary,
        posSecondary,
        summary,
      },
      create: {
        userId: user.id,
        articleId: articleId,
        word,
        baseForm,
        pronunciation,
        meanings,
        posPrimary,
        posSecondary,
        summary,
      },
    });

    console.log("[word-favorites] 收藏成功:", wordFavorite);
    return NextResponse.json(wordFavorite);
  } catch (error) {
    console.error("[word-favorites] 添加单词收藏失败:", error);
    return NextResponse.json(
      {
        error: "添加单词收藏失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除单词收藏
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const word = searchParams.get("word");
    const articleId = searchParams.get("articleId");

    if (!word) {
      return NextResponse.json({ error: "单词参数缺失" }, { status: 400 });
    }

    if (!articleId) {
      return NextResponse.json({ error: "文章ID参数缺失" }, { status: 400 });
    }

    await prisma.wordFavorite.delete({
      where: {
        userId_articleId_word: {
          userId: user.id,
          articleId: articleId,
          word: word,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除单词收藏失败:", error);
    return NextResponse.json({ error: "删除单词收藏失败" }, { status: 500 });
  }
}
