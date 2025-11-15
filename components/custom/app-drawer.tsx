"use client";

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
import { useEffect, useState } from "react";
import { RiMenuFold4Line } from "react-icons/ri";
import { MdFavorite, MdClose } from "react-icons/md";
import { useSession } from "next-auth/react";

type WordFavorite = {
  id: string;
  word: string;
  baseForm: string | null;
  pronunciation: string | null;
  meanings: string[];
  posPrimary: string | null;
  posSecondary: string | null;
  summary: string | null;
  createdAt: string;
};

type AppDrawerProps = {
  articleId?: string;
};

export function AppDrawer({ articleId }: AppDrawerProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [wordFavorites, setWordFavorites] = useState<WordFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 加载收藏的单词
  useEffect(() => {
    const fetchWordFavorites = async () => {
      if (!session?.user || !isOpen || !articleId) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/word-favorites?articleId=${articleId}`);
        if (res.ok) {
          const data = await res.json();
          setWordFavorites(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("获取收藏单词失败:", error);
        setWordFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWordFavorites();
  }, [session, isOpen, articleId]);

  const handleRemoveWord = async (word: string) => {
    if (!articleId) return;

    setRemovingId(word);
    try {
      await fetch(
        `/api/word-favorites?word=${encodeURIComponent(
          word
        )}&articleId=${encodeURIComponent(articleId)}`,
        {
          method: "DELETE",
        }
      );
      setWordFavorites((prev) => prev.filter((w) => w.word !== word));

      // 触发自定义事件，通知其他组件单词已被删除
      window.dispatchEvent(
        new CustomEvent("wordFavoriteChanged", {
          detail: { word, favorited: false, articleId },
        })
      );
    } catch (error) {
      console.error("删除单词收藏失败:", error);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      {isMounted && (
        <Drawer open={isOpen} onOpenChange={setIsOpen} direction="left">
          <DrawerTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="打开抽屉菜单"
            >
              <RiMenuFold4Line size={20} />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-full w-[80%] sm:w-[400px] fixed left-0 top-0 rounded-r-[10px]">
            <div className="h-full flex flex-col p-6">
              <DrawerHeader className="p-0 mb-6">
                <div className="flex items-center justify-between">
                  <DrawerTitle className="text-xl font-bold text-amber-900 flex items-center gap-2">
                    <MdFavorite className="text-red-500" />
                    收藏的单词
                  </DrawerTitle>
                  <DrawerClose asChild>
                    <button className="text-slate-400 md:hover:text-slate-600">
                      <MdClose size={24} />
                    </button>
                  </DrawerClose>
                </div>
                <DrawerDescription className="sr-only">
                  查看和管理你收藏的单词
                </DrawerDescription>
              </DrawerHeader>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-transparent" />
                </div>
              ) : wordFavorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MdFavorite size={48} className="text-amber-200 mb-4" />
                  <p className="text-amber-700">还没有收藏任何单词</p>
                  <p className="text-sm text-amber-600 mt-2">
                    点击文章中的单词，查看释义后收藏吧！
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3">
                  {wordFavorites.map((wordFav) => (
                    <div
                      key={wordFav.id}
                      className="rounded-lg border border-amber-100 bg-white/90 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-lg font-semibold text-slate-900">
                              {wordFav.word}
                            </span>
                            {wordFav.pronunciation && (
                              <span className="text-xs text-amber-600">
                                {wordFav.pronunciation}
                              </span>
                            )}
                          </div>
                          {wordFav.meanings && wordFav.meanings.length > 0 && (
                            <p className="text-sm text-slate-600 mb-2">
                              {wordFav.meanings.join("、")}
                            </p>
                          )}
                          {(wordFav.posPrimary || wordFav.posSecondary) && (
                            <div className="flex flex-wrap gap-1">
                              {wordFav.posPrimary && (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                                  {wordFav.posPrimary}
                                </span>
                              )}
                              {wordFav.posSecondary && (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                                  {wordFav.posSecondary}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveWord(wordFav.word)}
                          disabled={removingId === wordFav.word}
                          className="text-red-500 md:hover:text-red-700 disabled:opacity-50 ml-2"
                        >
                          <MdClose size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
