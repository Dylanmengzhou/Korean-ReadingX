import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { text, voice = "ko-KR-SunHiNeural" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "文本不能为空" }, { status: 400 });
    }

    // 限制文本长度（太长会导致超时）
    const maxLength = 2000; // 限制到2000字
    const truncatedText =
      text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

    console.log(
      `[TTS-Article] 开始生成语音，文本长度: ${truncatedText.length}`
    );

    // 生成临时文件名
    const tempDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileId = randomBytes(8).toString("hex");
    const audioPath = path.join(tempDir, `tts_${fileId}.mp3`);
    const subtitlePath = path.join(tempDir, `tts_${fileId}.vtt`);

    // 调用 edge-tts 命令行工具，同时生成音频和字幕
    const edgeTTS = spawn("edge-tts", [
      "--text",
      truncatedText,
      "--voice",
      voice,
      "--write-media",
      audioPath,
      "--write-subtitles",
      subtitlePath,
    ]);

    let stderr = "";
    edgeTTS.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    // 等待进程完成，添加超时
    await Promise.race([
      new Promise<void>((resolve, reject) => {
        edgeTTS.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`edge-tts exited with code ${code}: ${stderr}`));
          }
        });

        edgeTTS.on("error", (err) => {
          reject(err);
        });
      }),
      new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error("TTS 生成超时")), 30000); // 30秒超时
      }),
    ]);

    console.log(`[TTS-Article] 语音生成完成`);

    // 检查文件是否存在
    if (!fs.existsSync(audioPath)) {
      throw new Error("音频文件生成失败");
    }

    // 读取生成的文件
    const audioBuffer = fs.readFileSync(audioPath);

    // 解析字幕（如果存在）
    let subtitles: Array<{ start: number; end: number; text: string }> = [];
    if (fs.existsSync(subtitlePath)) {
      const subtitleContent = fs.readFileSync(subtitlePath, "utf-8");
      subtitles = parseVTT(subtitleContent);
      fs.unlinkSync(subtitlePath);
    }

    // 删除临时文件
    fs.unlinkSync(audioPath);

    console.log(
      `[TTS-Article] 返回数据，音频大小: ${audioBuffer.length} bytes, 字幕数: ${subtitles.length}`
    );

    // 按句号分割文本为句子数组
    const sentences = truncatedText
      .split(/[.。!?！？]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`[TTS-Article] 句子数: ${sentences.length}`);

    // 返回音频和字幕数据
    return NextResponse.json({
      audio: audioBuffer.toString("base64"),
      subtitles,
      sentences, // 新增：返回分句后的文本数组
      duration: calculateDuration(subtitles),
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

// 解析 VTT 字幕文件
function parseVTT(vttContent: string) {
  const lines = vttContent.split("\n");
  const subtitles: Array<{ start: number; end: number; text: string }> = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // 查找时间戳行 (格式: 00:00:00.000 --> 00:00:01.000)
    if (line.includes("-->")) {
      const [startStr, endStr] = line.split("-->").map((s) => s.trim());
      const start = timeToSeconds(startStr);
      const end = timeToSeconds(endStr);

      // 读取字幕文本（可能多行）
      i++;
      let text = "";
      while (i < lines.length && lines[i].trim() !== "") {
        text += lines[i].trim() + " ";
        i++;
      }

      if (text.trim()) {
        subtitles.push({ start, end, text: text.trim() });
      }
    }
    i++;
  }

  return subtitles;
}

// 将时间字符串转换为秒
function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const seconds = parseFloat(parts[2]);
  return hours * 3600 + minutes * 60 + seconds;
}

// 计算总时长
function calculateDuration(
  subtitles: Array<{ start: number; end: number; text: string }>
): number {
  if (subtitles.length === 0) return 0;
  return subtitles[subtitles.length - 1].end;
}
