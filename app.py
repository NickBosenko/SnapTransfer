import sys
import json
import http.server
import socketserver
import os
import webbrowser
import socket
import shutil
from datetime import datetime
import mimetypes
import CGI
from urllib.parse import unquote

PORT = 8000
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

os.chdir(BASE_DIR)

# Create 'bin' folder and extract built-in files into it
BIN_DIR = os.path.join(BASE_DIR, "bin")
if not os.path.exists(BIN_DIR):
    os.makedirs(BIN_DIR)

def copy_resource(filename):
    src_path = os.path.join(sys._MEIPASS, filename) if getattr(sys, 'frozen', False) else os.path.join(BASE_DIR, filename)
    dst_path = os.path.join(BIN_DIR, filename)
    if not os.path.exists(dst_path):
        shutil.copyfile(src_path, dst_path)

for file in ["index.html", "script.js", "translations.js"]:
    copy_resource(file)

# Change working directory to /bin where extracted files live
os.chdir(BIN_DIR)

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def get_file_category(filename):
    ext = os.path.splitext(filename)[1].lower()
    if ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
        return 'Photos'
    elif ext in ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv']:
        return 'Videos'
    elif ext in ['.mp3', '.wav', '.ogg', '.flac', '.m4a']:
        return 'Music'
    elif ext in ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx']:
        return 'Documents'
    else:
        return 'Other'

def get_date_folder():
    today = datetime.now()
    return today.strftime("%Y_%m_%d")

def ensure_category_folder(date_folder, category):
    category_path = os.path.join(UPLOAD_DIR, date_folder, category)
    if not os.path.exists(category_path):
        os.makedirs(category_path)
    return category_path

# Get local IP address
def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    finally:
        s.close()

local_ip = get_local_ip()

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.path = unquote(self.path)
        if self.path == "/get-ip":
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"http://{local_ip}:{PORT}".encode())
        elif self.path == "/":
            self.path = "/index.html"
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        elif self.path.startswith("/uploads/"):
            file_path = self.path.lstrip("/")
            full_path = os.path.join(BASE_DIR, file_path)

            if os.path.isfile(full_path):
                content_type, _ = mimetypes.guess_type(full_path)
                if content_type is None:
                    content_type = 'application/octet-stream'

                # --- Range support for video files ---
                if content_type and content_type.startswith('video/') and 'Range' in self.headers:
                    file_size = os.path.getsize(full_path)
                    range_header = self.headers['Range']
                    range_value = range_header.strip().split('=')[1]
                    range_start, range_end = range_value.split('-')[0], range_value.split('-')[1] if '-' in range_value else ''
                    start = int(range_start) if range_start else 0
                    end = int(range_end) if range_end else file_size - 1
                    if end >= file_size:
                        end = file_size - 1
                    chunk_size = end - start + 1

                    self.send_response(206)
                    self.send_header('Content-Type', content_type)
                    self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
                    self.send_header('Accept-Ranges', 'bytes')
                    self.send_header('Content-Length', str(chunk_size))
                    self.end_headers()
                    with open(full_path, 'rb') as f:
                        f.seek(start)
                        self.wfile.write(f.read(chunk_size))
                    return
                # --- End range support ---

                self.send_response(200)
                self.send_header("Content-type", content_type)
                self.end_headers()
                with open(full_path, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, "File not found")

        elif self.path == "/list-uploads":
            result = {}
            for date_folder in sorted(os.listdir(UPLOAD_DIR), reverse=True):
                date_path = os.path.join(UPLOAD_DIR, date_folder)
                if os.path.isdir(date_path):
                    result[date_folder] = {}
                    for category in ['Photos', 'Videos', 'Music', 'Documents', 'Other']:
                        category_path = os.path.join(date_path, category)
                        if os.path.exists(category_path):
                            files = sorted(os.listdir(category_path), reverse=True)
                            if files:
                                result[date_folder][category] = files

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        else:
            return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        ctype, pdict = cgi.parse_header(self.headers.get('content-type'))
        if ctype == 'multipart/form-data':
            pdict['boundary'] = bytes(pdict['boundary'], "utf-8")
            pdict['CONTENT-LENGTH'] = int(self.headers['content-length'])
            form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ={'REQUEST_METHOD': 'POST'}, keep_blank_values=True)
            fileitem = form['file']
            if fileitem.filename:
                filename = os.path.basename(fileitem.filename)
                file_data = fileitem.file.read()
            else:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"No file uploaded.")
                return
        else:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Invalid request.")
            return

        # Create date folder
        date_folder = get_date_folder()
        date_path = os.path.join(UPLOAD_DIR, date_folder)
        if not os.path.exists(date_path):
            os.makedirs(date_path)
        
        # Determine file category and save
        category = get_file_category(filename)
        category_path = ensure_category_folder(date_folder, category)
        
        # Save file with original name
        filepath = os.path.join(category_path, filename)
        with open(filepath, 'wb') as f:
            f.write(file_data)

        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"File uploaded successfully.")

Handler = MyHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"\n✅ Server is running at http://{local_ip}:{PORT}")
    print("❌ The server will stop automatically when you close this window.\n")
    webbrowser.open(f"http://{local_ip}:{PORT}")
    httpd.serve_forever()
