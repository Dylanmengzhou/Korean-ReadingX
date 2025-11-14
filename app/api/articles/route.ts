import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const keyword = searchParams.get("keyword") || "";
  const tag = searchParams.get("tag") || "";

  try {
    // 构建查询条件
    const where: {
      AND?: Array<{
        OR?: Array<{
          titleZh?: { contains: string; mode: "insensitive" };
          descriptionZh?: { contains: string; mode: "insensitive" };
        }>;
        tags?: { has: string };
      }>;
    } = {};

    const conditions = [];

    // 关键词搜索
    if (keyword) {
      conditions.push({
        OR: [
          { titleZh: { contains: keyword, mode: "insensitive" as const } },
          {
            descriptionZh: { contains: keyword, mode: "insensitive" as const },
          },
        ],
      });
    }

    // 标签筛选
    if (tag) {
      conditions.push({
        tags: { has: tag },
      });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    // 获取总数
    const total = await prisma.article.count({ where });

    // 分页获取文章
    const articles = await prisma.article.findMany({
      where,
      select: {
        id: true,
        titleZh: true,
        descriptionZh: true,
        tags: true,
        content: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
