import { NextRequest, NextResponse } from "next/server";

type HanXiaoBanResponse = {
  type?: string;
  analysis?: {
    word?: string;
    baseForm?: string;
    pronunciation?: string;
    meanings?: string[];
    meaningsYx?: string[];
    yx?: string;
    pos1?: string;
    pos2?: string;
    wordStructure?: {
      summary?: string;
      components?: Array<{
        gn?: string;
        yx?: string;
        text?: string;
        type?: string;
        function?: string;
      }>;
    };
    collocations?: Array<{ korean: string; chinese: string }>;
    examples?: Array<{ korean: string; chinese: string }>;
    createdAt?: string;
    updatedAt?: string;
    language?: string;
  };
};

const HANXIAOBAN_ENDPOINT = "https://hanxiaoban.xyz/api/word-cache";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word");

  if (!word) {
    return NextResponse.json(
      { error: "word query parameter is required." },
      { status: 400 },
    );
  }

  const url = new URL(HANXIAOBAN_ENDPOINT);
  url.searchParams.set("word", word);
  url.searchParams.set("stream", "true");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "text/event-stream",
      "User-Agent":
        request.headers.get("user-agent") ??
        "Mozilla/5.0 (compatible; korean-readingx/1.0)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to query Hanxiaoban dictionary." },
      { status: response.status },
    );
  }

  const payloadText = await response.text();
  const events = payloadText
    .split("\n\n")
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  let analysis: HanXiaoBanResponse["analysis"] | null = null;
  for (const event of events) {
    if (!event.startsWith("data:")) {
      continue;
    }
    const data = event.replace(/^data:\s*/, "");
    if (data === "[DONE]") {
      continue;
    }
    try {
      const parsed: HanXiaoBanResponse = JSON.parse(data);
      if (parsed.analysis) {
        analysis = parsed.analysis;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!analysis) {
    return NextResponse.json(
      { error: "No analysis returned for this word." },
      { status: 502 },
    );
  }

  const normalized = {
    word: analysis.word ?? word,
    baseForm: analysis.baseForm ?? analysis.yx ?? analysis.word ?? word,
    pronunciation: analysis.pronunciation ?? null,
    meanings: analysis.meanings ?? analysis.meaningsYx ?? [],
    yx: analysis.yx ?? null,
    posPrimary: analysis.pos1 ?? null,
    posSecondary: analysis.pos2 ?? null,
    summary: analysis.wordStructure?.summary ?? "",
    wordStructure: analysis.wordStructure ?? null,
    collocations: analysis.collocations ?? [],
    examples: analysis.examples ?? [],
    source: "Han小伴词典",
  };

  return NextResponse.json(normalized);
}
