import { prisma } from "@/prisma";
import ArticleListClient from "./ArticleListClient";

export default async function ArticleListPage() {
  // 只获取所有唯一的标签，文章通过客户端懒加载
  const articles = await prisma.article.findMany({
    select: {
      tags: true,
    },
  });

  // 提取所有唯一的标签
  const tagSet = new Set<string>();
  for (const article of articles) {
    for (const tag of article.tags) {
      tagSet.add(tag);
    }
  }
  const availableTags = Array.from(tagSet);

  return <ArticleListClient availableTags={availableTags} />;
}
