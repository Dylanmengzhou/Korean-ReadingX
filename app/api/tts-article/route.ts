import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, voice = "ko-KR-SunHiNeural" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "文本不能为空" }, { status: 400 });
    }

    // 限制文本长度（太长会导致超时）
    const maxLength = 2000;
    const truncatedText =
      text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

    console.log(
      `[TTS-Article] 开始生成语音，文本长度: ${truncatedText.length}`
    );

    // 在 Vercel 上调用 Python serverless function
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/tts-python-subtitles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: truncatedText,
        voice,
        withSubtitles: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Python TTS 调用失败");
    }

    const data = await response.json();

    console.log(`[TTS-Article] 语音生成完成`);

    // 按句号分割文本为句子数组
    const sentences = truncatedText
      .split(/[.。!?！？]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(
      `[TTS-Article] 返回数据，音频大小: ${data.audio.length} bytes, 字幕数: ${
        data.subtitles?.length || 0
      }`
    );
    console.log(`[TTS-Article] 句子数: ${sentences.length}`);

    // 返回音频和字幕数据
    return NextResponse.json({
      audio: data.audio,
      subtitles: data.subtitles || [],
      sentences,
      duration: calculateDuration(data.subtitles || []),
    });
  } catch (error) {
    console.error("[TTS-Article] 生成失败:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "生成语音失败，请稍后重试",
      },
      { status: 500 }
    );
  }
}

// 计算总时长
function calculateDuration(
  subtitles: Array<{ start: number; end: number; text: string }>
): number {
  if (subtitles.length === 0) return 0;
  return subtitles[subtitles.length - 1].end;
}
