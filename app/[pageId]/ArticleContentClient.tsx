"use client";

import { DefinitionCard } from "@/components/custom/definition-card";
import {
  ArticleAudioPlayer,
  type AudioPlayerControls,
} from "@/components/custom/article-audio-player";
import { FaRegClock } from "react-icons/fa";
import {
  type ApiWordResponse,
  type DefinitionState,
  type WordDetail,
} from "@/lib/word";
import { useEffect, useMemo, useRef, useState } from "react";
import { MdNumbers } from "react-icons/md";
import { useSession } from "next-auth/react";
import { useReadingSettings } from "./layout";

const normalizeWord = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z\u00c0-\u024f\u3130-\u318f\uac00-\ud7a3]/g, "");

const tokenizeText = (text: string) =>
  text.match(/\w+|\s+|[^\s\w]+/g) ?? [text];

// 计算韩文字数（只统计韩文字符）
const countKoreanWords = (text: string) => {
  const koreanChars = text.match(/[\uac00-\ud7a3\u3130-\u318f]/g);
  return koreanChars ? koreanChars.length : 0;
};

// 根据字数计算阅读时间（分钟）
// 假设韩语阅读速度约为每分钟 200-250 字
const calculateReadingTime = (wordCount: number) => {
  const wordsPerMinute = 220; // 平均阅读速度
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, minutes); // 至少1分钟
};

// 解析文章内容，分离韩语和中文段落
const parseContent = (content: string) => {
  const paragraphs = content.split(/\n\n+/);
  const parsed: Array<{ type: "korean" | "chinese"; text: string }> = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // 检测是否为中文段落（包含中文字符）
    const hasChinese = /[\u4e00-\u9fa5]/.test(trimmed);
    const hasKorean = /[\uac00-\ud7a3]/.test(trimmed);

    if (hasChinese && !hasKorean) {
      parsed.push({ type: "chinese", text: trimmed });
    } else if (hasKorean) {
      parsed.push({ type: "korean", text: trimmed });
    }
  }

  return parsed;
};

type Article = {
  id: string;
  titleKo: string;
  titleZh: string;
  content: string;
  contentBeginner?: string | null;
  contentIntermediate?: string | null;
  contentAdvanced?: string | null;
};

type ArticleContentClientProps = {
  article: Article;
};

export default function ArticleContentClient({
  article,
}: ArticleContentClientProps) {
  const Topic = article.titleKo;
  const titleZh = article.titleZh;

  const { data: session } = useSession();
  const {
    fontSize,
    showTranslation,
    difficulty,
    isPlayerOpen,
    closePlayer,
    setAudioLoadingState,
  } = useReadingSettings();

  // 根据难度选择对应的内容
  const KOREAN_TEXT = useMemo(() => {
    switch (difficulty) {
      case "beginner":
        return article.contentBeginner || article.content;
      case "intermediate":
        return article.contentIntermediate || article.content;
      case "advanced":
        return article.contentAdvanced || article.content;
      case "original":
      default:
        return article.content;
    }
  }, [difficulty, article]);

  // 计算当前内容的字数和阅读时间
  const { wordCount, minutes } = useMemo(() => {
    const count = countKoreanWords(KOREAN_TEXT);
    const time = calculateReadingTime(count);
    return { wordCount: count, minutes: time };
  }, [KOREAN_TEXT]);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definitionCache, setDefinitionCache] = useState<
    Record<string, WordDetail>
  >({});
  const [favoritedWords, setFavoritedWords] = useState<Set<string>>(new Set());
  const [currentHighlightText, setCurrentHighlightText] = useState<string>(""); // 当前高亮的文本
  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioControlsRef = useRef<AudioPlayerControls | null>(null); // 存储音频控制方法
  const [definitionState, setDefinitionState] = useState<DefinitionState>({
    status: "idle",
    data: null,
  });

  const parsedParagraphs = useMemo(
    () => parseContent(KOREAN_TEXT),
    [KOREAN_TEXT]
  );

  // 加载用户收藏的单词
  useEffect(() => {
    const fetchFavoritedWords = async () => {
      if (!session?.user) {
        setFavoritedWords(new Set());
        return;
      }

      try {
        const res = await fetch(`/api/word-favorites?articleId=${article.id}`);
        if (res.ok) {
          const data = await res.json();
          const words = Array.isArray(data) ? data : [];
          setFavoritedWords(
            new Set(words.map((w: { word: string }) => w.word))
          );
        }
      } catch (error) {
        console.error("获取收藏单词失败:", error);
        setFavoritedWords(new Set());
      }
    };

    fetchFavoritedWords();
  }, [session, article.id]);

  // 监听单词收藏状态变化事件
  useEffect(() => {
    const handleWordFavoriteChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        word: string;
        favorited: boolean;
        articleId: string;
      }>;
      const { word, favorited, articleId: eventArticleId } = customEvent.detail;

      // 只处理当前文章的收藏变化
      if (eventArticleId === article.id) {
        setFavoritedWords((prev) => {
          const newSet = new Set(prev);
          if (favorited) {
            newSet.add(word);
          } else {
            newSet.delete(word);
          }
          return newSet;
        });
      }
    };

    window.addEventListener("wordFavoriteChanged", handleWordFavoriteChange);
    return () => {
      window.removeEventListener(
        "wordFavoriteChanged",
        handleWordFavoriteChange
      );
    };
  }, [article.id]);

  useEffect(() => {
    if (!selectedWord) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedWord]);

  // 当高亮文本变化时，自动滚动到对应段落
  useEffect(() => {
    if (currentHighlightText && containerRef.current) {
      // 查找包含高亮文本的段落
      const paragraphs = containerRef.current.querySelectorAll("p");
      for (const p of Array.from(paragraphs)) {
        if (p.textContent?.includes(currentHighlightText.trim())) {
          // 平滑滚动到该段落
          p.scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
      }
    }
  }, [currentHighlightText]);

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

  // 用于处理单击/双击冲突的 timer
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleWordClick = async (word: string) => {
    // 清除之前的定时器
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    // 延迟执行单击，如果在延迟期间发生双击，则不执行
    clickTimerRef.current = setTimeout(async () => {
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
            error instanceof Error
              ? error.message
              : "查询释义时出现了未知错误。",
        });
      }
    }, 250); // 250ms 延迟，足够检测双击
  };

  // 处理双击单词 - 跳转到该句子播放
  const handleWordDoubleClick = (sentence: string) => {
    // 清除单击的定时器，防止打开释义卡片
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    console.log(`[ArticleClient] 双击单词，句子: "${sentence}"`);

    // 调用音频控制器跳转
    if (audioControlsRef.current) {
      audioControlsRef.current.seekToText(sentence);
    } else {
      console.log("[ArticleClient] 音频控制器未就绪");
    }
  };

  const handleCloseTooltip = () => {
    setSelectedWord(null);
    setDefinitionState((prev) =>
      prev.status === "idle" ? prev : { status: "idle", data: null }
    );
  };

  const handleFavoriteToggle = (favorited: boolean) => {
    if (!selectedWord) return;

    setFavoritedWords((prev) => {
      const newSet = new Set(prev);
      if (favorited) {
        newSet.add(selectedWord);
      } else {
        newSet.delete(selectedWord);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-12">
      <div
        ref={containerRef}
        className="relative mx-auto max-w-3xl text-lg leading-8 text-slate-900"
      >
        <h1 className="text-5xl font-bold mb-4 flex items-center justify-center">
          {Topic}
        </h1>
        <h2 className="text-2xl font-semibold mb-8 text-center text-slate-700">
          {titleZh}
        </h2>
        <div className="flex justify-center">
          <div className="w-full md:max-w-[80%] flex items-center mb-6 justify-between">
            <div className="flex items-center gap-1 text-sm md:text-xl">
              <FaRegClock className="inline mr-2 text-slate-500" size={20} />
              <span className="text-slate-500">阅读时间</span>
              <span className="text-black">{minutes}分钟</span>
            </div>
            <div className="flex items-center gap-1 text-sm md:text-xl">
              <MdNumbers className="inline text-slate-500" size={25} />
              <span className="text-slate-500">总字数</span>
              <span className="text-black">{wordCount}字</span>
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-4" style={{ fontSize: `${fontSize}px` }}>
          {parsedParagraphs.map((paragraph, paraIndex) => {
            // 中文段落 - 只在 showTranslation 为 true 时显示
            if (paragraph.type === "chinese") {
              if (!showTranslation) return null;

              return (
                <p
                  key={`para-${paraIndex}`}
                  className="text-slate-500 leading-relaxed"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {paragraph.text}
                </p>
              );
            }

            // 韩语段落 - 渲染可点击的单词
            // 先按句号分割成句子
            const sentences = paragraph.text
              .split(/([.。!?！？])/)
              .reduce((acc: string[], curr, idx, arr) => {
                if (idx % 2 === 0 && curr.trim()) {
                  const punctuation = arr[idx + 1] || "";
                  acc.push(curr.trim() + punctuation);
                }
                return acc;
              }, []);

            return (
              <p
                key={`para-${paraIndex}`}
                className="text-slate-900 leading-relaxed mb-4"
                style={{ fontSize: `${fontSize}px` }}
              >
                {sentences.map((sentence, sentIndex) => {
                  const tokens = tokenizeText(sentence);

                  // 检查这个句子是否应该高亮
                  // 清理逻辑：移除所有空白、标点、引号，只保留韩文和字母
                  const cleanHighlight = currentHighlightText
                    .replace(/[\s\p{P}"'"'"]/gu, "")
                    .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, "") // 移除中文
                    .toLowerCase();
                  const cleanSentence = sentence
                    .replace(/[\s\p{P}"'"'"]/gu, "")
                    .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, "") // 移除中文
                    .toLowerCase();

                  // 使用includes进行更宽松的匹配
                  const shouldHighlight =
                    cleanHighlight.length > 3 &&
                    (cleanSentence.includes(cleanHighlight) ||
                      cleanHighlight.includes(cleanSentence));

                  if (shouldHighlight) {
                    console.log(
                      `[Highlight] 匹配句子 ${paraIndex}-${sentIndex}: "${sentence}"`
                    );
                    console.log(`[Highlight] 清理后字幕: "${cleanHighlight}"`);
                    console.log(`[Highlight] 清理后句子: "${cleanSentence}"`);
                  }

                  return (
                    <span
                      key={`para-${paraIndex}-sent-${sentIndex}`}
                      className={`inline transition-all duration-200 ${
                        shouldHighlight ? "bg-yellow-200/70 rounded px-1" : ""
                      }`}
                    >
                      {tokens.map((token, tokenIndex) => {
                        const normalized = normalizeWord(token);
                        const isWord = Boolean(normalized);

                        if (!isWord) {
                          return (
                            <span
                              key={`${paraIndex}-${sentIndex}-${tokenIndex}`}
                              aria-hidden={!token.trim()}
                            >
                              {token}
                            </span>
                          );
                        }

                        const isSelected =
                          selectedWord &&
                          normalizeWord(selectedWord) === normalized;

                        // 检查这个单词是否被收藏
                        const isFavorited = favoritedWords.has(token);

                        return (
                          <button
                            key={`${paraIndex}-${sentIndex}-${tokenIndex}`}
                            type="button"
                            onClick={() => handleWordClick(token)}
                            onDoubleClick={() =>
                              handleWordDoubleClick(sentence)
                            }
                            className={`inline cursor-pointer border-none bg-transparent p-0 text-left text-inherit underline-offset-4 focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                              isSelected
                                ? "text-indigo-700 underline decoration-indigo-400"
                                : isFavorited
                                ? "text-slate-900 underline decoration-yellow-500 decoration-2 md:hover:underline md:hover:decoration-slate-400"
                                : "text-slate-900 md:hover:underline md:hover:decoration-slate-400"
                            }`}
                          >
                            {token}
                          </button>
                        );
                      })}
                      {sentIndex < sentences.length - 1 && " "}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </div>

        {selectedWord && (
          <div className="fixed inset-0 z-30 flex items-center justify-center px-4 py-8">
            <button
              type="button"
              aria-label="关闭释义"
              onClick={handleCloseTooltip}
              className="absolute inset-0 bg-slate-900/25 backdrop-blur-sm"
            />
            <DefinitionCard
              selectedWord={selectedWord}
              definitionState={definitionState}
              onClose={handleCloseTooltip}
              isFavorited={favoritedWords.has(selectedWord)}
              onFavoriteToggle={handleFavoriteToggle}
              articleId={article.id}
            />
          </div>
        )}

        <ArticleAudioPlayer
          content={KOREAN_TEXT}
          isOpen={isPlayerOpen}
          onClose={closePlayer}
          onCurrentTextChange={setCurrentHighlightText}
          onPlayerReady={(controls) => {
            audioControlsRef.current = controls;
            console.log("[ArticleClient] 音频控制器已就绪");
          }}
          onLoadingStateChange={setAudioLoadingState}
          autoPreload={true}
        />
      </div>
    </div>
  );
}
