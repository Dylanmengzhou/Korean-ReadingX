import { NextRequest, NextResponse } from "next/server";

const GOOGLE_TTS_ENDPOINT =
  "https://translate.googleapis.com/translate_tts";
const LANGUAGE = "ko";
const MAX_LENGTH = 200;

export async function POST(request: NextRequest) {
  const { text, speed } = await request.json().catch(() => ({}));

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json(
      { error: "text is required for TTS." },
      { status: 400 },
    );
  }

  const q = text.trim();
  if (q.length > MAX_LENGTH) {
    return NextResponse.json(
      {
        error: `文本长度不能超过 ${MAX_LENGTH} 个字符（当前 ${q.length}）。`,
      },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    ie: "UTF-8",
    q,
    tl: LANGUAGE,
    client: "tw-ob",
  });

  if (speed) {
    params.set("ttsspeed", String(speed));
  }

  const upstream = await fetch(`${GOOGLE_TTS_ENDPOINT}?${params.toString()}`, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Failed to fetch pronunciation audio from Google." },
      { status: upstream.status },
    );
  }

  const buffer = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("Content-Type") ?? "audio/mpeg";

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
