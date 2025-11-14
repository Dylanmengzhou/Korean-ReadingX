"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { LuClock4, LuSearch } from "react-icons/lu";
import { IoIosArrowBack } from "react-icons/io";
import { MdFavorite, MdFavoriteBorder, MdClose } from "react-icons/md";

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

type ArticleListClientProps = {
  availableTags: string[];
};

export default function ArticleListClient({
  availableTags,
}: ArticleListClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [keyword, setKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null);
  const [isTagDrawerOpen, setIsTagDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showOnlyUnfavorited, setShowOnlyUnfavorited] = useState(false);

  // 懒加载相关状态
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 只显示前5个标签
  const visibleTags = availableTags.slice(0, 5);
  const hasMoreTags = availableTags.length > 5;

  // 加载文章的函数
  const loadArticles = useCallback(
    async (pageNum: number, reset = false) => {
      if (loading) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: "10",
        });

        if (keyword) params.append("keyword", keyword);
        if (selectedTag) params.append("tag", selectedTag);

        const response = await fetch(`/api/articles?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch articles");

        const data = await response.json();

        setArticles((prev) =>
          reset ? data.articles : [...prev, ...data.articles]
        );
        setHasMore(data.pagination.hasMore);
        setTotalCount(data.pagination.total);
        setPage(pageNum);
      } catch (error) {
        console.error("Error loading articles:", error);
      } finally {
        setLoading(false);
      }
    },
    [keyword, selectedTag, loading]
  );

  // 初始加载和搜索/筛选变化时重新加载
  useEffect(() => {
    setArticles([]);
    setPage(1);
    setHasMore(true);
    loadArticles(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, selectedTag, showOnlyUnfavorited]);

  // Intersection Observer 监听滚动到底部
  useEffect(() => {
    if (loading || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadArticles(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observerRef.current.observe(currentRef);
    }

    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef);
      }
    };
  }, [loading, hasMore, page, loadArticles]);

  // 获取用户的收藏列表
  useEffect(() => {
    if (session?.user) {
      fetch("/api/favorites")
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch favorites");
          }
          return res.json();
        })
        .then((data) => {
          // 确保data是数组
          if (Array.isArray(data)) {
            const ids = new Set<string>(
              data.map((fav: { articleId: string }) => fav.articleId)
            );
            setFavoriteIds(ids);
          } else {
            console.error("Favorites data is not an array:", data);
            setFavoriteIds(new Set());
          }
        })
        .catch((error) => {
          console.error("Error fetching favorites:", error);
          setFavoriteIds(new Set());
        });
    }
  }, [session]);

  const handleReadArticle = (articleId: string) => {
    router.push(`/${articleId}`);
  };

  const handleToggleFavorite = async (
    articleId: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault(); // 阻止默认行为
    e.stopPropagation(); // 防止触发卡片点击

    console.log("点击了收藏按钮，文章ID:", articleId); // 调试信息

    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    setFavoriteLoading(articleId);
    const isFavorited = favoriteIds.has(articleId);

    try {
      if (isFavorited) {
        // 取消收藏
        console.log("取消收藏:", articleId);
        await fetch(`/api/favorites?articleId=${articleId}`, {
          method: "DELETE",
        });
        setFavoriteIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(articleId);
          return newSet;
        });
      } else {
        // 添加收藏
        console.log("添加收藏:", articleId);
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId }),
        });
        setFavoriteIds((prev) => new Set(prev).add(articleId));
      }
    } catch (error) {
      console.error("收藏操作失败:", error);
    } finally {
      setFavoriteLoading(null);
    }
  };

  // 过滤后的文章列表（基于未收藏状态）
  const displayedArticles = useMemo(() => {
    if (showOnlyUnfavorited) {
      return articles.filter((article) => !favoriteIds.has(article.id));
    }
    return articles;
  }, [articles, showOnlyUnfavorited, favoriteIds]);

  return (
    <div className="min-h-screen bg-[#F5EFE1] px-4 py-10">
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

        <div className="rounded-2xl border border-amber-200 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-amber-700">
              搜索文章
            </label>
            <span className="text-xs text-amber-600">
              {showOnlyUnfavorited
                ? `约 ${totalCount - favoriteIds.size} 个未收藏`
                : keyword || selectedTag
                ? `${totalCount} 个搜索结果`
                : `共 ${totalCount} 篇文章`}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-amber-200 bg-white px-4 py-2">
            <LuSearch className="text-amber-500" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="输入标题、关键词或标签"
              className="flex-1 border-none bg-transparent text-base text-amber-900 outline-none"
            />
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-amber-600">热门标签</p>
            <div className="flex flex-wrap gap-2">
              {/* 未收藏标签 */}
              <button
                type="button"
                aria-pressed={showOnlyUnfavorited}
                onClick={() => {
                  setShowOnlyUnfavorited((current) => !current);
                  // 点击未收藏时，取消其他标签选择
                  if (!showOnlyUnfavorited) {
                    setSelectedTag(null);
                  }
                }}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  showOnlyUnfavorited
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-amber-200 bg-white text-amber-600 hover:border-amber-300 hover:text-amber-800"
                }`}
              >
                未收藏
              </button>

              {visibleTags.map((tag) => {
                const isActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setSelectedTag((current) =>
                        current === tag ? null : tag
                      );
                      // 点击标签时，取消未收藏过滤
                      if (tag !== selectedTag) {
                        setShowOnlyUnfavorited(false);
                      }
                    }}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      isActive
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-amber-200 bg-white text-amber-600 hover:border-amber-300 hover:text-amber-800"
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
              {hasMoreTags && (
                <Drawer
                  direction={isMobile ? "bottom" : "left"}
                  open={isTagDrawerOpen}
                  onOpenChange={setIsTagDrawerOpen}
                >
                  <DrawerTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-700 transition hover:bg-amber-100"
                    >
                      更多标签 +{availableTags.length - 5}
                    </button>
                  </DrawerTrigger>
                  <DrawerContent
                    className={
                      isMobile
                        ? "fixed bottom-0 left-0 right-0 max-h-[85vh]"
                        : "h-full w-[400px] fixed left-0 top-0 rounded-r-[10px]"
                    }
                  >
                    <div
                      className={`w-full ${
                        isMobile ? "max-w-md mx-auto" : "h-full"
                      }`}
                    >
                      <DrawerHeader className={isMobile ? "" : "p-6"}>
                        <div className="flex items-center justify-between">
                          <DrawerTitle className="text-amber-900">
                            所有标签
                          </DrawerTitle>
                          <DrawerClose asChild>
                            <button className="text-slate-400 hover:text-slate-600">
                              <MdClose size={24} />
                            </button>
                          </DrawerClose>
                        </div>
                        <DrawerDescription className="sr-only">
                          选择标签来筛选文章
                        </DrawerDescription>
                      </DrawerHeader>
                      <div
                        className={
                          isMobile
                            ? "p-4 max-h-[60vh] overflow-y-auto"
                            : "p-6 pt-0 h-[calc(100vh-120px)] overflow-y-auto"
                        }
                      >
                        <div className="flex flex-wrap gap-2">
                          {availableTags.map((tag) => {
                            const isActive = selectedTag === tag;
                            return (
                              <button
                                key={tag}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => {
                                  setSelectedTag((current) =>
                                    current === tag ? null : tag
                                  );
                                  // 点击标签时，取消未收藏过滤
                                  if (tag !== selectedTag) {
                                    setShowOnlyUnfavorited(false);
                                  }
                                  setIsTagDrawerOpen(false);
                                }}
                                className={`rounded-full border px-4 py-2 text-sm transition ${
                                  isActive
                                    ? "border-amber-500 bg-amber-50 text-amber-700 font-medium"
                                    : "border-amber-200 bg-white text-amber-600 hover:border-amber-300 hover:text-amber-800"
                                }`}
                              >
                                #{tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {displayedArticles.map((article) => (
            <Card
              key={article.id}
              className="border border-amber-100 bg-white/90 shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-amber-900">
                      {article.titleZh}
                    </CardTitle>
                    <CardDescription className="text-amber-700">
                      {article.descriptionZh}
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleToggleFavorite(article.id, e)}
                    disabled={favoriteLoading === article.id}
                    className="shrink-0 text-amber-600 hover:text-amber-900"
                  >
                    {favoriteIds.has(article.id) ? (
                      <MdFavorite size={24} className="text-red-500" />
                    ) : (
                      <MdFavoriteBorder size={24} />
                    )}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex flex-wrap items-center gap-3 text-sm text-amber-700">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                  <LuClock4 className="size-4" />
                  {calculateReadingTime(countKoreanWords(article.content))} 分钟
                </span>
                {article.tags.map((tag: string) => (
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
                  onClick={() => handleReadArticle(article.id)}
                >
                  阅读
                </Button>
              </CardFooter>
            </Card>
          ))}

          {/* 加载指示器 */}
          <div ref={loadMoreRef} className="py-4 text-center">
            {loading && (
              <div className="flex items-center justify-center gap-2 text-amber-600">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                <span>加载中...</span>
              </div>
            )}
            {!loading && !hasMore && displayedArticles.length > 0 && (
              <p className="text-sm text-amber-500">没有更多内容了</p>
            )}
          </div>

          {!loading && displayedArticles.length === 0 && (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-white/60 p-8 text-center text-amber-700">
              {showOnlyUnfavorited
                ? "所有文章都已收藏，没有未收藏的内容。"
                : "没有找到相关内容,换个词试试吧。"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
