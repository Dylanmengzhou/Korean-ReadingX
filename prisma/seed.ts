import { PrismaClient } from "@prisma/client";
import articlesData from "../data/articles.json";

const prisma = new PrismaClient();

async function main() {
  console.log("开始导入文章数据...");

  for (const article of articlesData) {
    await prisma.article.upsert({
      where: { id: article.id },
      update: {
        titleKo: article.titleKo,
        titleZh: article.titleZh,
        descriptionZh: article.descriptionZh || "",
        tags: article.tags || [],
        content: article.content,
        contentBeginner: article.contentBeginner || null,
        contentIntermediate: article.contentIntermediate || null,
        contentAdvanced: article.contentAdvanced || null,
      },
      create: {
        id: article.id,
        titleKo: article.titleKo,
        titleZh: article.titleZh,
        descriptionZh: article.descriptionZh || "",
        tags: article.tags || [],
        content: article.content,
        contentBeginner: article.contentBeginner || null,
        contentIntermediate: article.contentIntermediate || null,
        contentAdvanced: article.contentAdvanced || null,
      },
    });
    console.log(`✓ 导入文章: ${article.id} - ${article.titleZh}`);
  }

  console.log(`\n成功导入 ${articlesData.length} 篇文章!`);
}

main()
  .catch((e) => {
    console.error("导入数据时出错:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
