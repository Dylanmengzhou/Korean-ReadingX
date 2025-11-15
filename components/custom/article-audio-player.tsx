"use client";

import { useState, useRef, useEffect } from "react";
import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaRedo,
} from "react-icons/fa";
import { MdClose } from "react-icons/md";

type Subtitle = {
  start: number;
  end: number;
  text: string;
};

type AudioPlayerProps = {
  content: string;
  isOpen: boolean;
  onClose: () => void;
  onCurrentTextChange?: (text: string) => void; // 新增:回调当前播放的文本
  onPlayerReady?: (controls: AudioPlayerControls) => void; // 暴露控制方法
  onLoadingStateChange?: (isLoading: boolean) => void; // 新增:通知加载状态
  autoPreload?: boolean; // 新增:是否自动预加载
};

export type AudioPlayerControls = {
  seekToText: (text: string) => void;
};

export function ArticleAudioPlayer({
  content,
  isOpen,
  onClose,
  onCurrentTextChange,
  onPlayerReady,
  onLoadingStateChange,
  autoPreload = false,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(""); // 加载进度提示
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1); // 播放倍速
  const [isLooping, setIsLooping] = useState(false); // 循环播放
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1); // 当前字幕索引 (用于prev/next功能)
  const [isPreloaded, setIsPreloaded] = useState(false); // 是否已预加载

  // 避免 lint 警告，currentSubtitleIndex 在 prev/next 功能中会用到
  console.log(`[AudioPlayer] 当前字幕索引: ${currentSubtitleIndex}`);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const frameCounterRef = useRef(0);
  const subtitlesRef = useRef<Subtitle[]>([]); // 用ref存储字幕，避免闭包陷阱
  const preloadedContentRef = useRef<string>(""); // 记录预加载的内容

  // 加载音频（支持静默预加载）
  const loadAudio = async (silentPreload = false) => {
    // 如果内容相同且已经加载过，直接返回
    if (
      isPreloaded &&
      content === preloadedContentRef.current &&
      audioRef.current
    ) {
      console.log("[AudioPlayer] 使用已预加载的音频");
      return;
    }

    setIsLoading(true);
    if (onLoadingStateChange) {
      onLoadingStateChange(true);
    }
    if (!silentPreload) {
      setLoadingProgress("正在生成语音...");
    }
    try {
      console.log("[AudioPlayer] 开始加载音频...");

      // 清理文本：只保留韩文，移除中文和多余空格
      const cleanedText = content
        .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, "") // 移除中文字符
        .replace(/\n+/g, " ") // 换行替换为空格
        .replace(/\s+/g, " ") // 多个空格替换为单个空格
        .trim();

      console.log(
        `[AudioPlayer] 原文本长度: ${content.length} 字符, 过滤后: ${cleanedText.length} 字符`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35秒超时

      setLoadingProgress("连接服务器...");

      const response = await fetch("/api/tts-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanedText,
          voice: "ko-KR-SunHiNeural",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "未知错误" }));
        throw new Error(errorData.error || `请求失败 (${response.status})`);
      }

      setLoadingProgress("处理音频数据...");

      const data = await response.json();

      console.log(
        `[AudioPlayer] 收到数据: 字幕数=${data.subtitles?.length || 0}`
      );

      // 存储字幕数据到ref（避免闭包陷阱）
      const receivedSubtitles = data.subtitles || [];
      subtitlesRef.current = receivedSubtitles;

      // 诊断信息：打印前几个字幕示例和时间范围，便于排查时间对齐问题
      try {
        console.log(
          "[AudioPlayer] subtitles sample:",
          receivedSubtitles.slice(0, 6)
        );
        if (receivedSubtitles.length > 0) {
          const last = receivedSubtitles[receivedSubtitles.length - 1];
          console.log(
            `[AudioPlayer] subtitles time range: 0 -> ${last.end} (count=${receivedSubtitles.length})`
          );
        }
        if (data.duration) {
          console.log(
            `[AudioPlayer] server reported duration: ${data.duration}`
          );
        }
      } catch (e) {
        console.warn("[AudioPlayer] subtitle diagnostics failed", e);
      }

      setLoadingProgress("创建播放器...");

      // 创建音频
      const audioBlob = await fetch(
        `data:audio/mpeg;base64,${data.audio}`
      ).then((r) => r.blob());
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
        console.log(`[AudioPlayer] 音频时长: ${audio.duration.toFixed(2)}秒`);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
        // 清除高亮
        if (onCurrentTextChange) {
          onCurrentTextChange("");
        }
      });

      audio.addEventListener("error", (e) => {
        console.error("[AudioPlayer] 音频播放错误:", e);
        alert("音频播放出错，请重试");
      });

      // 标记为已预加载
      setIsPreloaded(true);
      preloadedContentRef.current = content;

      if (!silentPreload) {
        setLoadingProgress("准备播放...");
        // 立即播放
        await audio.play();
        setIsPlaying(true);
        updateTime();
        console.log("[AudioPlayer] 开始播放");
      } else {
        console.log("[AudioPlayer] 预加载完成，等待用户点击播放");
      }
    } catch (error) {
      console.error("[AudioPlayer] 加载失败:", error);

      let errorMessage = "加载音频失败";
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "加载超时，文本可能太长。请尝试选择更短的内容。";
        } else {
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingProgress("");
      if (onLoadingStateChange) {
        onLoadingStateChange(false);
      }
    }
  };

  // 自动预加载音频
  useEffect(() => {
    if (autoPreload && content && !isPreloaded) {
      console.log("[AudioPlayer] 开始自动预加载音频...");
      loadAudio(true); // 静默预加载
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPreload, content, isPreloaded]);

  // 播放/暂停
  const togglePlay = async () => {
    if (!audioRef.current) {
      await loadAudio();
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      await audioRef.current.play();
      setIsPlaying(true);
      updateTime();
    }
  };

  // 切换播放速度
  const toggleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackRate(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  // 上一句
  const goToPrevSentence = () => {
    if (!audioRef.current || subtitlesRef.current.length === 0) return;

    const currentTime = audioRef.current.currentTime;
    // 找到当前时间之前的最后一个字幕
    let prevIndex = -1;
    for (let i = subtitlesRef.current.length - 1; i >= 0; i--) {
      if (subtitlesRef.current[i].start < currentTime - 0.5) {
        prevIndex = i;
        break;
      }
    }

    if (prevIndex >= 0) {
      audioRef.current.currentTime = subtitlesRef.current[prevIndex].start;
      setCurrentSubtitleIndex(prevIndex);
    }
  };

  // 下一句
  const goToNextSentence = () => {
    if (!audioRef.current || subtitlesRef.current.length === 0) return;

    const currentTime = audioRef.current.currentTime;
    // 找到当前时间之后的第一个字幕
    const nextIndex = subtitlesRef.current.findIndex(
      (sub) => sub.start > currentTime + 0.5
    );

    if (nextIndex >= 0) {
      audioRef.current.currentTime = subtitlesRef.current[nextIndex].start;
      setCurrentSubtitleIndex(nextIndex);
    }
  };

  // 切换循环播放
  const toggleLoop = () => {
    setIsLooping(!isLooping);
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
    }
  };

  // 跳转到包含指定文本的字幕位置并开始播放
  const seekToText = async (text: string) => {
    console.log(`[AudioPlayer] seekToText 被调用，查找文本: "${text}"`);

    // 如果音频还没加载，先加载
    if (!audioRef.current) {
      await loadAudio();
    }

    if (subtitlesRef.current.length === 0) {
      console.log("[AudioPlayer] 字幕为空，无法跳转");
      return;
    }

    // 清理文本用于匹配（和高亮匹配逻辑一致）
    const cleanText = text
      .replace(/[\s\p{P}"'"'"]/gu, "")
      .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, "")
      .toLowerCase();

    console.log(`[AudioPlayer] 清理后的文本: "${cleanText}"`);

    // 查找匹配的字幕
    let foundIndex = -1;
    for (let i = 0; i < subtitlesRef.current.length; i++) {
      const sub = subtitlesRef.current[i];
      const cleanSubtitle = sub.text
        .replace(/[\s\p{P}"'"'"]/gu, "")
        .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, "")
        .toLowerCase();

      if (
        cleanSubtitle.includes(cleanText) ||
        cleanText.includes(cleanSubtitle)
      ) {
        foundIndex = i;
        console.log(
          `[AudioPlayer] 找到匹配字幕 [${i}]: "${sub.text}" at ${sub.start}s`
        );
        break;
      }
    }

    if (foundIndex >= 0 && audioRef.current) {
      const targetSubtitle = subtitlesRef.current[foundIndex];
      const wasPlaying = isPlaying;

      // 先暂停（如果正在播放）
      if (wasPlaying && animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // 跳转到目标时间
      audioRef.current.currentTime = targetSubtitle.start;
      setCurrentTime(targetSubtitle.start);
      setCurrentSubtitleIndex(foundIndex);

      // 如果之前在播放或当前未播放，都要开始播放
      if (!isPlaying) {
        await audioRef.current.play();
        setIsPlaying(true);
      }

      // 重新启动更新循环
      updateTime();

      console.log(
        `[AudioPlayer] 跳转成功，从 ${targetSubtitle.start}s 开始播放`
      );
    } else {
      console.log("[AudioPlayer] 未找到匹配的字幕");
    }
  };

  // 更新播放时间
  const updateTime = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;

      // 每帧都更新 currentTime，确保进度条流畅
      setCurrentTime(time);

      // 仅打印前几帧的调试信息，避免控制台被刷屏
      frameCounterRef.current = (frameCounterRef.current || 0) + 1;
      if (frameCounterRef.current <= 6) {
        console.log(
          `[AudioPlayer] updateTime tick #${
            frameCounterRef.current
          }, time=${time.toFixed(3)}, subtitlesLen=${
            subtitlesRef.current.length
          }`
        );
      }

      // 查找当前时间对应的字幕文本（从ref读取最新值）
      // 使用节流：只在字幕索引变化时更新
      if (onCurrentTextChange && subtitlesRef.current.length > 0) {
        const currentSubtitleIdx = subtitlesRef.current.findIndex(
          (sub) => time >= sub.start && time <= sub.end
        );

        // 只有当字幕索引变化时才更新高亮
        if (
          currentSubtitleIdx >= 0 &&
          currentSubtitleIdx !== currentSubtitleIndex
        ) {
          const currentSubtitle = subtitlesRef.current[currentSubtitleIdx];
          setCurrentSubtitleIndex(currentSubtitleIdx);
          console.log(`[AudioPlayer] 字幕切换: "${currentSubtitle.text}"`);
          onCurrentTextChange(currentSubtitle.text);
        } else if (currentSubtitleIdx < 0 && currentSubtitleIndex >= 0) {
          // 如果没有匹配的字幕且之前有高亮，清除高亮
          setCurrentSubtitleIndex(-1);
          onCurrentTextChange("");
        }
      }

      if (!audioRef.current.paused) {
        animationRef.current = requestAnimationFrame(updateTime);
      }
    }
  };

  // 进度条拖动
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // 关闭播放器
  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    subtitlesRef.current = []; // 清空字幕ref
    // 清除高亮
    if (onCurrentTextChange) {
      onCurrentTextChange("");
    }
    onClose();
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 打开时加载
  useEffect(() => {
    if (isOpen && !audioRef.current) {
      loadAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 暴露控制方法给父组件
  useEffect(() => {
    if (onPlayerReady) {
      onPlayerReady({
        seekToText,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPlayerReady]);

  // 清理
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  // 基于字幕索引计算进度（更平滑且精确）
  const totalSubtitles = subtitlesRef.current.length;
  const currentIndex = Math.max(0, currentSubtitleIndex); // 未开始时显示为0
  const progress =
    totalSubtitles > 0 ? (currentIndex / totalSubtitles) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/98 to-black/95 backdrop-blur-md z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
      <div className="max-w-5xl mx-auto px-6 py-5">
        {/* 加载提示 */}
        {isLoading && loadingProgress && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
              <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              <span className="text-white/90 text-sm font-medium">
                {loadingProgress}
              </span>
            </div>
          </div>
        )}

        {/* 进度条区域 */}
        <div className="mb-4">
          {/* 进度条容器 */}
          <div className="relative group">
            {/* 背景轨道 */}
            <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
              {/* 进度填充 */}
              <div
                className="h-full bg-gradient-to-r from-white to-gray-200 transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* 交互式进度条 (覆盖层) */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              disabled={!audioRef.current || isLoading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />

            {/* 进度指示点 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md transition-all duration-150 ease-out pointer-events-none"
              style={{ left: `calc(${progress}% - 7px)` }}
            />
          </div>

          {/* 显示字幕进度和时间 */}
          <div className="flex justify-between items-center text-xs font-medium tabular-nums mt-2">
            <span className="text-white/80">
              {totalSubtitles > 0
                ? `第 ${currentIndex + 1}/${totalSubtitles} 句`
                : "0/0"}
            </span>
            <span className="text-white/50">—</span>
            <span className="text-white/80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* 控制按钮区域 */}
        <div className="flex items-center justify-center gap-4">
          {/* 倍速按钮 */}
          <button
            type="button"
            onClick={toggleSpeed}
            disabled={isLoading}
            className="w-12 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/90 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="切换播放速度"
          >
            {playbackRate}x
          </button>

          {/* 上一句 */}
          <button
            type="button"
            onClick={goToPrevSentence}
            disabled={isLoading || !audioRef.current}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="上一句"
          >
            <FaStepBackward size={16} />
          </button>

          {/* 播放/暂停按钮 */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={isLoading}
            className="group relative w-14 h-14 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/70 border-t-black rounded-full animate-spin" />
            ) : isPlaying ? (
              <FaPause size={18} className="text-black" />
            ) : (
              <FaPlay size={18} className="text-black ml-1" />
            )}
          </button>

          {/* 下一句 */}
          <button
            type="button"
            onClick={goToNextSentence}
            disabled={isLoading || !audioRef.current}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="下一句"
          >
            <FaStepForward size={16} />
          </button>

          {/* 循环播放按钮 */}
          <button
            type="button"
            onClick={toggleLoop}
            disabled={isLoading}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              isLooping
                ? "bg-white/20 text-white"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
            aria-label="循环播放"
          >
            <FaRedo size={14} />
          </button>

          {/* 关闭按钮 */}
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all ml-2"
            aria-label="关闭播放器"
          >
            <MdClose size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
