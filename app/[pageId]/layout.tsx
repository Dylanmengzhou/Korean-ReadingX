"use client";
import { AppDrawer } from "@/components/custom/app-drawer";
import { ReadingSettings } from "@/components/custom/reading-settings";
import {
  DifficultySelector,
  type DifficultyLevel,
} from "@/components/custom/difficulty-selector";
import { Button } from "@/components/ui/button";
import { IoIosArrowBack } from "react-icons/io";
import { PiHeadphones } from "react-icons/pi";
import { HiMiniHome } from "react-icons/hi2";
import { MdFavoriteBorder, MdFavorite } from "react-icons/md";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, createContext, useContext } from "react";
import { useReadingSettingsStore } from "@/lib/reading-settings-store";

type ReadingSettingsContextType = {
  fontSize: number;
  showTranslation: boolean;
  difficulty: DifficultyLevel;
  isPlayerOpen: boolean;
  isAudioLoading: boolean;
  openPlayer: () => void;
  closePlayer: () => void;
  setAudioLoadingState: (loading: boolean) => void;
};

const ReadingSettingsContext = createContext<ReadingSettingsContextType>({
  fontSize: 16,
  showTranslation: true,
  difficulty: "original",
  isPlayerOpen: false,
  isAudioLoading: false,
  openPlayer: () => {},
  closePlayer: () => {},
  setAudioLoadingState: () => {},
});

export function useReadingSettings() {
  return useContext(ReadingSettingsContext);
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("original");
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  // 从 Zustand store 获取阅读设置
  const fontSize = useReadingSettingsStore((state) => state.fontSize);
  const showTranslation = useReadingSettingsStore(
    (state) => state.showTranslation
  );
  const setFontSize = useReadingSettingsStore((state) => state.setFontSize);
  const setShowTranslation = useReadingSettingsStore(
    (state) => state.setShowTranslation
  );

  // 从路径中提取文章 ID
  const articleId = pathname?.split("/")[1];

  // 检查当前文章是否已收藏
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!session?.user || !articleId) return;

      try {
        const res = await fetch("/api/favorites");
        if (res.ok) {
          const data = await res.json();
          const favorites = Array.isArray(data) ? data : [];
          setIsFavorited(
            favorites.some(
              (fav: { articleId: string }) => fav.articleId === articleId
            )
          );
        }
      } catch (error) {
        console.error("检查收藏状态失败:", error);
      }
    };

    checkFavoriteStatus();
  }, [session, articleId]);

  // 切换收藏状态
  const handleToggleFavorite = async () => {
    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    if (!articleId) return;

    setIsLoading(true);

    try {
      if (isFavorited) {
        // 取消收藏
        const res = await fetch(`/api/favorites?articleId=${articleId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsFavorited(false);
        }
      } else {
        // 添加收藏
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId }),
        });
        if (res.ok) {
          setIsFavorited(true);
        }
      }
    } catch (error) {
      console.error("收藏操作失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ReadingSettingsContext.Provider
      value={{
        fontSize,
        showTranslation,
        difficulty,
        isPlayerOpen,
        isAudioLoading,
        openPlayer: () => setIsPlayerOpen(true),
        closePlayer: () => setIsPlayerOpen(false),
        setAudioLoadingState: setIsAudioLoading,
      }}
    >
      <section className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-40 w-full border-b border-white/20 bg-white/60 py-2 backdrop-blur-sm rounded-b-md">
          <div className="flex items-center justify-between">
            <div className="backupButton">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="active:bg-transparent"
              >
                <IoIosArrowBack size={20} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="首页"
                className="ml-2 active:bg-transparent"
                onClick={() => router.push("/")}
              >
                <HiMiniHome size={20} />
              </Button>
            </div>
            <div className="otherButtons flex items-center gap-2">
              <AppDrawer articleId={articleId || undefined} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={isFavorited ? "取消收藏" : "收藏文章"}
                onClick={handleToggleFavorite}
                disabled={isLoading}
                className={`active:bg-transparent ${
                  isFavorited ? "text-red-500" : ""
                }`}
              >
                {isFavorited ? (
                  <MdFavorite size={20} />
                ) : (
                  <MdFavoriteBorder size={20} />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="朗读全文"
                className="active:bg-transparent relative"
                onClick={() => setIsPlayerOpen(true)}
                disabled={isAudioLoading}
              >
                {isAudioLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                ) : (
                  <PiHeadphones size={20} />
                )}
              </Button>
              <DifficultySelector
                difficulty={difficulty}
                onDifficultyChange={setDifficulty}
              />
              <ReadingSettings
                fontSize={fontSize}
                showTranslation={showTranslation}
                onFontSizeChange={setFontSize}
                onShowTranslationChange={setShowTranslation}
              />
            </div>
          </div>
        </header>
        <div className="pt-4">{children}</div>
      </section>
    </ReadingSettingsContext.Provider>
  );
}
