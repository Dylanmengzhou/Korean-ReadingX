from http.server import BaseHTTPRequestHandler
import json
import subprocess
import tempfile
import os
import base64
import re

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        text = data.get('text', '')
        voice = data.get('voice', 'ko-KR-SunHiNeural')
        with_subtitles = data.get('withSubtitles', False)
        
        if not text:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': '文本不能为空'}).encode())
            return
        
        try:
            # 创建临时文件
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_audio:
                audio_path = tmp_audio.name
            
            subtitle_path = None
            if with_subtitles:
                with tempfile.NamedTemporaryFile(suffix='.vtt', delete=False) as tmp_sub:
                    subtitle_path = tmp_sub.name
            
            # 构建命令
            cmd = [
                'edge-tts',
                '--text', text,
                '--voice', voice,
                '--write-media', audio_path
            ]
            
            if subtitle_path:
                cmd.extend(['--write-subtitles', subtitle_path])
            
            # 调用 edge-tts
            subprocess.run(cmd, check=True, capture_output=True)
            
            # 读取音频文件
            with open(audio_path, 'rb') as f:
                audio_data = base64.b64encode(f.read()).decode('utf-8')
            
            response_data = {
                'audio': audio_data,
                'contentType': 'audio/mpeg'
            }
            
            # 读取并解析字幕
            if subtitle_path and os.path.exists(subtitle_path):
                with open(subtitle_path, 'r', encoding='utf-8') as f:
                    vtt_content = f.read()
                subtitles = self.parse_vtt(vtt_content)
                response_data['subtitles'] = subtitles
                os.unlink(subtitle_path)
            
            # 清理音频临时文件
            os.unlink(audio_path)
            
            # 返回响应
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def parse_vtt(self, vtt_content):
        """解析 VTT 字幕文件"""
        subtitles = []
        lines = vtt_content.split('\n')
        i = 0
        
        while i < len(lines):
            line = lines[i].strip()
            
            # 查找时间戳行
            if '-->' in line:
                parts = line.split('-->')
                start_str = parts[0].strip()
                end_str = parts[1].strip()
                
                start = self.time_to_seconds(start_str)
                end = self.time_to_seconds(end_str)
                
                # 读取字幕文本
                i += 1
                text = ''
                while i < len(lines) and lines[i].strip() != '':
                    text += lines[i].strip() + ' '
                    i += 1
                
                if text.strip():
                    subtitles.append({
                        'start': start,
                        'end': end,
                        'text': text.strip()
                    })
            i += 1
        
        return subtitles
    
    def time_to_seconds(self, time_str):
        """将时间字符串转换为秒"""
        parts = time_str.split(':')
        hours = int(parts[0])
        minutes = int(parts[1])
        seconds = float(parts[2])
        return hours * 3600 + minutes * 60 + seconds
