import http.server
import socketserver
import json
import urllib.request
import random
import string
from urllib.parse import parse_qs, urlparse

PORT = 8000

# Store OTPs temporarily (in production, use a database)
otp_storage = {}

# IMPORTANT: Replace this with your actual Zapier webhook URL
# Get it from Zapier > Your Zap > Webhooks by Zapier > Catch Hook > Copy the URL
ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/your_webhook_key/'

class OTPHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(body)
            
            # OTP Generation endpoint
            if self.path == '/send-otp':
                email = data.get('email')
                if email:
                    # Generate 6-digit OTP
                    otp = ''.join(random.choices(string.digits, k=6))
                    otp_storage[email] = otp
                    
                    print(f"[OTP Generated] Email: {email}, OTP: {otp}")
                    
                    # Send OTP via Zapier webhook (triggers email/SMS)
                    payload = {
                        'email': email,
                        'otp': otp,
                        'subject': 'SoundWave Login OTP',
                        'username': 'SoundWave User'
                    }
                    
                    try:
                        req = urllib.request.Request(
                            ZAPIER_WEBHOOK_URL,
                            data=json.dumps(payload).encode('utf-8'),
                            headers={'Content-Type': 'application/json'}
                        )
                        response = urllib.request.urlopen(req, timeout=10)
                        print(f"[Zapier] OTP sent successfully to {email}")
                    except Exception as e:
                        print(f"[Zapier Error] Failed to send OTP: {e}")
                        # Still allow OTP verification to work even if webhook fails
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True, 'message': 'OTP sent to your email'}).encode())
                else:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': False, 'message': 'Email required'}).encode())
            
            # OTP Verification endpoint
            elif self.path == '/verify-otp':
                email = data.get('email')
                otp = data.get('otp')
                
                if email in otp_storage and otp_storage[email] == otp:
                    del otp_storage[email]
                    print(f"[OTP Verified] Email: {email}")
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True, 'message': 'OTP verified successfully'}).encode())
                else:
                    print(f"[OTP Failed] Invalid OTP for {email}")
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': False, 'message': 'Invalid or expired OTP'}).encode())
        except Exception as e:
            print(f"[Error] {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'success': False, 'message': 'Server error'}).encode())
    
    def do_GET(self):
        # Serve static files
        super().do_GET()
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

Handler = OTPHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"🎵 SoundWave Server running on port {PORT}")
    print(f"📧 OTP endpoints:")
    print(f"   - POST /send-otp (generates & sends OTP via Zapier)")
    print(f"   - POST /verify-otp (verifies OTP)")
    print(f"⚠️  Configure your Zapier webhook URL in ZAPIER_WEBHOOK_URL variable")
    httpd.serve_forever()