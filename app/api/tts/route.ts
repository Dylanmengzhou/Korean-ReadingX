import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, voice = "ko-KR-SunHiNeural" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "文本不能为空" }, { status: 400 });
    }

    // 在 Vercel 上调用 Python serverless function
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/tts-python`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      throw new Error("Python TTS 调用失败");
    }

    const data = await response.json();

    // 解码 base64 音频数据
    const audioBuffer = Buffer.from(data.audio, "base64");

    // 返回音频数据
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400", // 缓存1天
      },
    });
  } catch (error) {
    console.error("TTS 生成失败:", error);
    return NextResponse.json(
      { error: "生成语音失败，请稍后重试" },
      { status: 500 }
    );
  }
}
