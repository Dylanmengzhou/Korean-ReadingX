from http.server import BaseHTTPRequestHandler
import json
import subprocess
import tempfile
import os
import base64

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        text = data.get('text', '')
        voice = data.get('voice', 'ko-KR-SunHiNeural')
        
        if not text:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': '文本不能为空'}).encode())
            return
        
        try:
            # 创建临时文件
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
                audio_path = tmp_file.name
            
            # 调用 edge-tts
            subprocess.run([
                'edge-tts',
                '--text', text,
                '--voice', voice,
                '--write-media', audio_path
            ], check=True)
            
            # 读取音频文件并编码为 base64
            with open(audio_path, 'rb') as f:
                audio_data = base64.b64encode(f.read()).decode('utf-8')
            
            # 清理临时文件
            os.unlink(audio_path)
            
            # 返回响应
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'audio': audio_data,
                'contentType': 'audio/mpeg'
            }).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
