"use client";

import type { DefinitionState } from "@/lib/word";
import { useState } from "react";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { useSession } from "next-auth/react";

type DefinitionCardProps = {
  selectedWord: string;
  definitionState: DefinitionState;
  onClose: () => void;
  isFavorited?: boolean;
  onFavoriteToggle?: (favorited: boolean) => void;
  articleId: string;
};

export function DefinitionCard({
  selectedWord,
  definitionState,
  onClose,
  isFavorited = false,
  onFavoriteToggle,
  articleId,
}: DefinitionCardProps) {
  const { data: session } = useSession();
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const currentData =
    definitionState.status === "ready" ? definitionState.data : null;
  const chineseMeaning =
    currentData?.meanings?.length && currentData.meanings.join("、");
  const structureSummary =
    currentData?.wordStructure?.summary ??
    currentData?.summary ??
    chineseMeaning ??
    "";
  const structureComponents = currentData?.wordStructure?.components ?? [];
  const exampleEntries = currentData?.examples ?? [];
  const collocations = currentData?.collocations ?? [];
  const partOfSpeechBadges = [
    currentData?.posPrimary,
    currentData?.posSecondary,
  ].filter(Boolean) as string[];

  const handleFavoriteClick = async () => {
    if (!session?.user || !currentData || isTogglingFavorite) return;

    setIsTogglingFavorite(true);

    try {
      if (isFavorited) {
        // 取消收藏
        console.log("取消收藏单词:", selectedWord, "文章:", articleId);
        const res = await fetch(
          `/api/word-favorites?word=${encodeURIComponent(
            selectedWord
          )}&articleId=${encodeURIComponent(articleId)}`,
          {
            method: "DELETE",
          }
        );
        console.log("取消收藏响应:", res.status, await res.text());
        onFavoriteToggle?.(false);
      } else {
        // 添加收藏
        const payload = {
          word: selectedWord,
          articleId: articleId,
          baseForm: currentData.baseForm,
          pronunciation: currentData.pronunciation,
          meanings: currentData.meanings,
          posPrimary: currentData.posPrimary,
          posSecondary: currentData.posSecondary,
          summary: structureSummary,
        };
        console.log("添加收藏单词:", payload);
        const res = await fetch("/api/word-favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const responseText = await res.text();
        console.log("添加收藏响应:", res.status, responseText);
        if (res.ok) {
          onFavoriteToggle?.(true);
        } else {
          console.error("添加收藏失败:", responseText);
        }
      }
    } catch (error) {
      console.error("收藏操作失败:", error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-[90%] max-h-[90%] overflow-y-auto rounded-2xl border border-amber-100 bg-white/95 p-5 text-sm text-slate-800 shadow-[0_20px_50px_rgba(15,23,42,0.15)]">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        {/* 收藏按钮 */}
        {session?.user && definitionState.status === "ready" && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            disabled={isTogglingFavorite}
            className="text-amber-600 transition md:hover:text-red-500 disabled:opacity-50"
            aria-label={isFavorited ? "取消收藏" : "收藏单词"}
          >
            {isFavorited ? (
              <MdFavorite size={24} className="text-red-500" />
            ) : (
              <MdFavoriteBorder size={24} />
            )}
          </button>
        )}
        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={onClose}
          className="text-slate-300 transition md:hover:text-slate-500"
          aria-label="关闭释义"
        >
          <span className="text-2xl">×</span>
        </button>
      </div>

      {definitionState.status === "loading" && (
        <div className="flex items-center gap-3 text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-200 border-t-transparent" />
          <p>正在为“{selectedWord}”查找释义…</p>
        </div>
      )}

      {definitionState.status === "error" && (
        <div className="space-y-2">
          <p className="text-base font-semibold text-red-600">查询失败</p>
          <p className="text-sm text-slate-600">{definitionState.message}</p>
        </div>
      )}

      {definitionState.status === "ready" && currentData && (
        <div className="space-y-5">
          <header className="space-y-1">
            {currentData.pronunciation && (
              <p className="text-xs uppercase tracking-[0.3em] text-amber-600">
                {currentData.pronunciation}
              </p>
            )}
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-2xl font-semibold text-slate-900">
                {selectedWord}
              </p>
              {chineseMeaning && (
                <p className="text-base text-slate-500">({chineseMeaning})</p>
              )}
            </div>
            {partOfSpeechBadges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {partOfSpeechBadges.map((pos, idx) => (
                  <span
                    key={`${pos}-${idx}`}
                    className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                  >
                    {pos}
                  </span>
                ))}
              </div>
            )}
          </header>

          <hr className="border-amber-100" />

          <section className="space-y-3 text-sm leading-6">
            <p className="text-xs font-semibold text-amber-700">构成分析</p>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
              {currentData.baseForm ?? selectedWord}
            </span>
            {structureSummary && (
              <p className="text-slate-700">{structureSummary}</p>
            )}
            {structureComponents.length > 0 && (
              <div className="space-y-2">
                {structureComponents.map((component, idx) => (
                  <div
                    key={`${component.text ?? component.type}-${idx}`}
                    className="rounded-2xl border border-amber-100/60 bg-amber-50/30 p-3"
                  >
                    <p className="text-sm font-semibold text-amber-800">
                      {component.text || component.type || `部分 ${idx + 1}`}
                    </p>
                    {component.type && (
                      <p className="text-xs text-amber-600">{component.type}</p>
                    )}
                    {component.function && (
                      <p className="text-sm text-slate-600">
                        {component.function}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {collocations.length > 0 && (
            <section className="space-y-3 text-sm leading-6">
              <p className="text-xs font-semibold text-amber-700">搭配</p>
              <div className="space-y-2">
                {collocations.map((item, idx) => (
                  <div
                    key={`${item.korean}-${idx}`}
                    className="rounded-2xl bg-white p-3 shadow-inner shadow-amber-50 ring-1 ring-amber-100/80"
                  >
                    <p className="font-medium text-slate-900">{item.korean}</p>
                    <p className="text-sm text-slate-600">{item.chinese}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {exampleEntries.length > 0 && (
            <section className="space-y-3 text-sm leading-6">
              <p className="text-xs font-semibold text-amber-700">例句</p>
              {exampleEntries.map((entry, idx) => (
                <div
                  key={`${entry.korean}-${idx}`}
                  className="rounded-2xl bg-slate-50 p-3 shadow-inner"
                >
                  <p className="font-medium text-slate-900">{entry.korean}</p>
                  <p className="text-sm text-slate-600">{entry.chinese}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
