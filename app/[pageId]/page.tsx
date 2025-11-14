import { prisma } from "@/prisma";
import { notFound } from "next/navigation";
import ArticleContentClient from "./ArticleContentClient";

type PageProps = {
  params: Promise<{ pageId: string }>;
};

export default async function ArticlePage({ params }: PageProps) {
  const { pageId } = await params;

  // 从数据库获取文章
  const article = await prisma.article.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      titleKo: true,
      titleZh: true,
      content: true,
      contentBeginner: true,
      contentIntermediate: true,
      contentAdvanced: true,
    },
  });

  if (!article) {
    notFound();
  }

  return <ArticleContentClient article={article} />;
}
