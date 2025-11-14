"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type WordStructureComponent = {
  text?: string;
  type?: string;
  function?: string;
};

type WordStructure = {
  summary?: string;
  components?: WordStructureComponent[];
};

type Collocation = {
  korean: string;
  chinese: string;
};

type ExampleSentence = {
  korean: string;
  chinese: string;
};

type WordDetail = {
  word: string;
  baseForm?: string;
  pronunciation?: string | null;
  meanings: string[];
  yx?: string | null;
  posPrimary?: string | null;
  posSecondary?: string | null;
  summary?: string;
  wordStructure?: WordStructure | null;
  collocations: Collocation[];
  examples: ExampleSentence[];
  source: string;
};

type ApiWordResponse = WordDetail;

type AudioState = {
  status: "idle" | "loading" | "playing" | "error";
  target?: string;
  message?: string;
};

const KOREAN_TEXT = `오늘 아침 공원에는 따뜻한 햇살이 가득했다. 사람들은 가벼운 발걸음으로 산책을 즐기고, 아이들은 잔디밭에서 웃음소리를 퍼뜨렸다. 한쪽 벤치에 앉아 있던 지훈은 책을 펼치고 조용히 문장을 따라가며 마음을 가다듬었다. 그는 새로운 단어를 만날 때마다 뜻을 떠올리고, 그 단어가 만들어낼 이야기를 상상하는 것을 좋아했다.`;

const tokenizeText = (text: string) =>
  text.match(/\w+|\s+|[^\s\w]+/g) ?? [text];

const normalizeWord = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z\u00c0-\u024f\u3130-\u318f\uac00-\ud7a3]/g, "");

export default function Home() {
  const tokens = useMemo(() => tokenizeText(KOREAN_TEXT), []);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definitionCache, setDefinitionCache] = useState<
    Record<string, WordDetail>
  >({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [definitionState, setDefinitionState] = useState<{
    status: "idle" | "loading" | "ready" | "error";
    data: WordDetail | null;
    message?: string;
  }>({ status: "idle", data: null });
  const [audioState, setAudioState] = useState<AudioState>({
    status: "idle",
  });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const fetchKoreanDefinitions = async (word: string): Promise<WordDetail> => {
    const response = await fetch(`/api/naver?word=${encodeURIComponent(word)}`);
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      throw new Error(errorPayload?.error ?? "查询韩文词典失败，请稍后重试。");
    }

    const payload: ApiWordResponse = await response.json();
    if (!payload.meanings?.length) {
      throw new Error("这个单词没有找到可用释义。");
    }

    return {
      word: payload.word,
      baseForm: payload.baseForm,
      pronunciation: payload.pronunciation,
      meanings: payload.meanings,
      yx: payload.yx,
      posPrimary: payload.posPrimary,
      posSecondary: payload.posSecondary,
      summary: payload.summary,
      wordStructure: payload.wordStructure,
      collocations: payload.collocations ?? [],
      examples: payload.examples ?? [],
      source: payload.source,
    };
  };

  const playPronunciation = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    try {
      setAudioState({ status: "loading", target: trimmed });
      audioRef.current?.pause();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!response.ok) {
        throw new Error("暂时无法获取读音。");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;
      await audioRef.current.play();
      setAudioState({ status: "playing", target: trimmed });
      audioRef.current.onended = () => {
        setAudioState({ status: "idle" });
      };
    } catch (error) {
      setAudioState({
        status: "error",
        target: trimmed,
        message:
          error instanceof Error
            ? error.message
            : "播放读音时出现问题。",
      });
    }
  };

  const handleWordClick = async (word: string) => {
    const normalizedWord = normalizeWord(word);
    if (!normalizedWord) {
      return;
    }

    setSelectedWord(word);

    if (definitionCache[normalizedWord]) {
      const cached = definitionCache[normalizedWord];
      setDefinitionState({
        status: "ready",
        data: cached,
      });
      return;
    }

    setDefinitionState({ status: "loading", data: null });

    try {
      const result = await fetchKoreanDefinitions(word);
      setDefinitionCache((prev) => ({ ...prev, [normalizedWord]: result }));
      setDefinitionState({
        status: "ready",
        data: result,
      });
    } catch (error) {
      setDefinitionState({
        status: "error",
        data: null,
        message:
          error instanceof Error ? error.message : "查询释义时出现了未知错误。",
      });
    }
  };

  const handleCloseTooltip = () => {
    setSelectedWord(null);
    setDefinitionState((prev) =>
      prev.status === "idle" ? prev : { status: "idle", data: null }
    );
  };

  const currentData = definitionState.data;
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

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-12">
      <div
        ref={containerRef}
        className="relative mx-auto max-w-3xl text-lg leading-8 text-slate-900"
      >
        <p className="text-sm text-slate-500">点击任意单词，浮窗会显示释义</p>
        <div className="mt-6 whitespace-pre-wrap">
          {tokens.map((token, index) => {
            const normalized = normalizeWord(token);
            const isWord = Boolean(normalized);

            if (!isWord) {
              return (
                <span key={`${token}-${index}`} aria-hidden={!token.trim()}>
                  {token}
                </span>
              );
            }

            const isSelected =
              selectedWord && normalizeWord(selectedWord) === normalized;

            return (
              <button
                key={`${token}-${index}`}
                type="button"
                onClick={() => handleWordClick(token)}
                className={`inline cursor-pointer border-none bg-transparent p-0 text-left text-inherit underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                  isSelected
                    ? "text-indigo-700 underline decoration-indigo-400"
                    : "text-slate-900 hover:underline decoration-slate-400"
                }`}
              >
                {token}
              </button>
            );
          })}
        </div>

        {selectedWord && (
          <div className="fixed inset-0 z-30 flex items-center justify-center px-4 py-8">
            <button
              type="button"
              aria-label="关闭释义"
              onClick={handleCloseTooltip}
              className="absolute inset-0 -z-10 bg-slate-900/25 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-[90%] max-h-[90%] overflow-y-auto rounded-2xl border border-amber-100 bg-white/95 p-5 text-sm text-slate-800 shadow-[0_20px_50px_rgba(15,23,42,0.15)]">
              <button
                type="button"
                onClick={handleCloseTooltip}
                className="absolute right-4 top-4 text-slate-300 transition hover:text-slate-500"
                aria-label="关闭释义"
              >
                ×
              </button>

              {definitionState.status === "loading" && (
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-200 border-t-transparent" />
                  <p>正在为“{selectedWord}”查找释义…</p>
                </div>
              )}

              {definitionState.status === "error" && (
                <div className="space-y-2">
                  <p className="text-base font-semibold text-red-600">
                    查询失败
                  </p>
                  <p className="text-sm text-slate-600">
                    {definitionState.message}
                  </p>
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
                        <p className="text-base text-slate-500">
                          ({chineseMeaning})
                        </p>
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
                    <p className="text-xs font-semibold text-amber-700">
                      构成分析
                    </p>
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
                              {component.text ||
                                component.type ||
                                `部分 ${idx + 1}`}
                            </p>
                            {component.type && (
                              <p className="text-xs text-amber-600">
                                {component.type}
                              </p>
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
                      <p className="text-xs font-semibold text-amber-700">
                        搭配
                      </p>
                      <div className="space-y-2">
                        {collocations.map((item, idx) => (
                          <div
                            key={`${item.korean}-${idx}`}
                            className="flex items-start justify-between gap-3 rounded-2xl bg-white p-3 shadow-inner shadow-amber-50 ring-1 ring-amber-100/80"
                          >
                            <div>
                              <p className="font-medium text-slate-900">
                                {item.korean}
                              </p>
                              <p className="text-sm text-slate-600">
                                {item.chinese}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => playPronunciation(item.korean)}
                              disabled={
                                audioState.status === "loading" &&
                                audioState.target === item.korean
                              }
                              className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 text-amber-600 transition hover:bg-amber-50 disabled:opacity-50"
                              aria-label={`播放搭配 ${item.korean} 的读音`}
                            >
                              {audioState.status === "loading" &&
                              audioState.target === item.korean ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-200 border-t-transparent" />
                              ) : (
                                <span aria-hidden>🔊</span>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {exampleEntries.length > 0 && (
                    <section className="space-y-3 text-sm leading-6">
                      <p className="text-xs font-semibold text-amber-700">
                        例句
                      </p>
                      {exampleEntries.map((entry, idx) => (
                        <div
                          key={`${entry.korean}-${idx}`}
                          className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 p-3 shadow-inner"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {entry.korean}
                            </p>
                            <p className="text-sm text-slate-600">
                              {entry.chinese}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => playPronunciation(entry.korean)}
                            disabled={
                              audioState.status === "loading" &&
                              audioState.target === entry.korean
                            }
                            className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 text-amber-600 transition hover:bg-amber-50 disabled:opacity-50"
                            aria-label={`播放例句 ${entry.korean} 的读音`}
                          >
                            {audioState.status === "loading" &&
                            audioState.target === entry.korean ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-200 border-t-transparent" />
                            ) : (
                              <span aria-hidden>🔊</span>
                            )}
                          </button>
                        </div>
                      ))}
                    </section>
                  )}

                  {audioState.status === "error" && (
                    <p className="text-xs text-red-500">
                      {audioState.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
