# TTS 功能 Vercel 部署说明

## 问题
在 Vercel 部署时遇到两个错误:
1. `ENOENT: no such file or directory, mkdir '/var/task/tmp'` - 临时目录权限问题
2. `spawn edge-tts ENOENT` - 找不到 edge-tts 命令

## 解决方案

### 1. 文件结构更改

创建了以下新文件:
- `requirements.txt` - Python 依赖配置
- `vercel.json` - Vercel 部署配置
- `api/tts-python.py` - 简单 TTS Python serverless function
- `api/tts-python-subtitles.py` - 带字幕的 TTS Python serverless function

### 2. 架构调整

**之前**: Next.js API Route → spawn edge-tts 命令 (❌ Vercel 不支持)

**现在**: Next.js API Route → Vercel Python Function → edge-tts

### 3. 工作原理

1. **客户端** 调用 `/api/tts` 或 `/api/tts-article`
2. **TypeScript API Route** 接收请求,转发到 Python function
3. **Python Function** (`api/tts-python.py` 或 `api/tts-python-subtitles.py`) 执行 edge-tts
4. **返回** base64 编码的音频数据和字幕(如果需要)

### 4. 环境变量

在 Vercel 项目设置中,系统会自动设置:
- `VERCEL_URL` - 自动提供,用于内部 API 调用

### 5. 本地开发

本地开发时,仍然使用原来的 spawn 方式(如果你本地有 edge-tts),但部署到 Vercel 会自动切换到 Python function。

### 6. 部署步骤

1. 提交所有更改到 Git
```bash
git add .
git commit -m "fix: 修复 Vercel TTS 部署问题 - 使用 Python serverless functions"
git push
```

2. Vercel 会自动:
   - 检测 `requirements.txt` 并安装 Python 依赖
   - 部署 Python functions 到 `api/` 目录
   - 部署 Next.js 应用

### 7. 注意事项

- Python functions 执行时间限制: 
  - `/api/tts-python.py`: 30秒
  - `/api/tts-python-subtitles.py`: 60秒
- Vercel 免费版有执行时间限制,升级到 Pro 可以增加限制
- 临时文件会在函数执行完毕后自动清理

## 测试

部署后,访问你的应用,测试:
1. 单词发音功能
2. 整篇文章语音生成
3. 检查浏览器控制台是否有错误

## 回滚

如果需要回滚到本地 spawn 方式,删除:
- `api/` 目录下的 Python 文件
- `vercel.json` 中的 Python runtime 配置
- 恢复原来的 TypeScript 代码
