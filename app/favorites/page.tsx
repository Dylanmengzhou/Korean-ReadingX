"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LuClock4 } from "react-icons/lu";
import { IoIosArrowBack } from "react-icons/io";
import { MdFavorite } from "react-icons/md";

// 计算韩文字数（只统计韩文字符）
const countKoreanWords = (text: string) => {
  const koreanChars = text.match(/[\uac00-\ud7a3\u3130-\u318f]/g);
  return koreanChars ? koreanChars.length : 0;
};

// 根据字数计算阅读时间（分钟）
const calculateReadingTime = (wordCount: number) => {
  const wordsPerMinute = 220;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, minutes);
};

type Article = {
  id: string;
  titleZh: string;
  descriptionZh: string;
  tags: string[];
  content: string;
};

type Favorite = {
  id: string;
  articleId: string;
  createdAt: string;
  article: Article;
};

export default function FavoritesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (session?.user) {
      fetchFavorites();
    }
  }, [session, status, router]);

  // 确保页面可以滚动
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/favorites");
      if (!res.ok) {
        throw new Error("Failed to fetch favorites");
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setFavorites(data);
      } else {
        console.error("Favorites data is not an array:", data);
        setFavorites([]);
      }
    } catch (error) {
      console.error("获取收藏失败:", error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (
    articleId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setRemovingId(articleId);

    try {
      await fetch(`/api/favorites?articleId=${articleId}`, {
        method: "DELETE",
      });
      setFavorites((prev) => prev.filter((fav) => fav.articleId !== articleId));
    } catch (error) {
      console.error("取消收藏失败:", error);
    } finally {
      setRemovingId(null);
    }
  };

  const handleReadArticle = (articleId: string) => {
    router.push(`/${articleId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5EFE1]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8B7355] border-t-transparent" />
          <p
            className="text-[#8B7355]"
            style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
          >
            加载中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F5EFE1] px-4 py-10 pb-20"
      style={{ overflow: "auto", WebkitOverflowScrolling: "touch" }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {/* 返回按钮 */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
          >
            <IoIosArrowBack size={20} />
            <span>返回</span>
          </Button>
        </div>

        {/* 标题 */}
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
            <MdFavorite size={28} className="text-red-500" />
            我的收藏
          </h1>
          <p className="text-sm text-amber-700 mt-2">
            共 {favorites.length} 篇文章
          </p>
        </div>

        {/* 收藏列表 */}
        <div className="space-y-4">
          {favorites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-white/60 p-8 text-center text-amber-700">
              <MdFavorite size={48} className="mx-auto mb-4 text-amber-300" />
              <p className="text-lg font-medium mb-2">还没有收藏任何文章</p>
              <p className="text-sm">
                去浏览文章，点击小心心收藏喜欢的内容吧！
              </p>
              <Button
                onClick={() => router.push("/articleList")}
                className="mt-4"
              >
                去浏览文章
              </Button>
            </div>
          ) : (
            favorites.map((favorite) => (
              <Card
                key={favorite.id}
                className="border border-amber-100 bg-white/90 shadow-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-amber-900">
                        {favorite.article.titleZh}
                      </CardTitle>
                      <CardDescription className="text-amber-700">
                        {favorite.article.descriptionZh}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) =>
                        handleRemoveFavorite(favorite.articleId, e)
                      }
                      disabled={removingId === favorite.articleId}
                      className="shrink-0 text-red-500 hover:text-red-700"
                    >
                      <MdFavorite size={24} />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-wrap items-center gap-3 text-sm text-amber-700">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                    <LuClock4 className="size-4" />
                    {calculateReadingTime(
                      countKoreanWords(favorite.article.content)
                    )}{" "}
                    分钟
                  </span>
                  {favorite.article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-amber-200 px-3 py-1 text-xs text-amber-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </CardContent>

                <CardFooter className="pt-0">
                  <Button
                    type="button"
                    size="sm"
                    className="ml-auto px-6"
                    onClick={() => handleReadArticle(favorite.article.id)}
                  >
                    阅读
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
