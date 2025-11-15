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

    // 生成临时文件名
    const tempDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileName = `tts_${randomBytes(8).toString("hex")}.mp3`;
    const filePath = path.join(tempDir, fileName);

    // 调用 edge-tts 命令行工具
    const edgeTTS = spawn("edge-tts", [
      "--text",
      text,
      "--voice",
      voice,
      "--write-media",
      filePath,
    ]);

    // 等待进程完成
    await new Promise<void>((resolve, reject) => {
      edgeTTS.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`edge-tts exited with code ${code}`));
        }
      });

      edgeTTS.on("error", (err) => {
        reject(err);
      });
    });

    // 读取生成的音频文件
    const audioBuffer = fs.readFileSync(filePath);

    // 删除临时文件
    fs.unlinkSync(filePath);

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
