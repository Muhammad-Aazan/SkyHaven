import subprocess
import time
import json
import base64
import os
import urllib.request
import asyncio
import websockets

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
OUTPUT_DIR = os.path.abspath("ad-assets/01_app_screenshots")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Generate valid JWT token for demonstration
import hmac
import hashlib

def generate_jwt(user_id, secret="skyhaven_dev_secret_key_2026"):
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({"id": user_id, "iat": int(time.time()), "exp": int(time.time()) + 86400 * 7}).encode()).decode().rstrip("=")
    sig = hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")
    return f"{header}.{payload}.{sig_b64}"

JWT_TOKEN = generate_jwt("6ae2a734845323a0a662cef7")

async def send_cmd(ws, method, params=None, msg_id=1):
    payload = {"id": msg_id, "method": method}
    if params:
        payload["params"] = params
    await ws.send(json.dumps(payload))
    while True:
        resp = json.loads(await ws.recv())
        if resp.get("id") == msg_id:
            return resp.get("result", {})

async def capture_screen(ws, filename, msg_id_start=100):
    res = await send_cmd(ws, "Page.captureScreenshot", {"format": "png", "quality": 100}, msg_id_start)
    data = base64.b64decode(res["data"])
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(data)
    print(f"Captured: {filename} ({len(data)} bytes)")

async def main():
    port = 9333
    proc = subprocess.Popen([
        EDGE_PATH,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--remote-debugging-port={port}",
        "--window-size=1920,1080",
        "about:blank"
    ])
    time.sleep(2.5)

    try:
        with urllib.request.urlopen(f"http://localhost:{port}/json") as resp:
            tabs = json.loads(resp.read().decode())
            ws_url = tabs[0]["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
            # 1. Enable Page and Emulation
            await send_cmd(ws, "Page.enable", msg_id=1)
            await send_cmd(ws, "Emulation.setDeviceMetricsOverride", {
                "width": 1920,
                "height": 1080,
                "deviceScaleFactor": 1,
                "mobile": False
            }, msg_id=2)

            # --- SCREENSHOT 1: Landing Page Hero ---
            await send_cmd(ws, "Page.navigate", {"url": "http://localhost:5173"}, msg_id=3)
            await asyncio.sleep(2)
            await capture_screen(ws, "01_landing_hero.png", 10)

            # --- SCREENSHOT 2: Landing Page Product Preview Frame ---
            await send_cmd(ws, "Runtime.evaluate", {
                "expression": "window.scrollTo({top: 500, behavior: 'instant'});"
            }, msg_id=20)
            await asyncio.sleep(1)
            await capture_screen(ws, "02_landing_product_preview.png", 21)

            # --- SCREENSHOT 3: Features Section ---
            await send_cmd(ws, "Runtime.evaluate", {
                "expression": "document.getElementById('features')?.scrollIntoView();"
            }, msg_id=30)
            await asyncio.sleep(1)
            await capture_screen(ws, "03_landing_features.png", 31)

            # --- SCREENSHOT 4: Security Section ---
            await send_cmd(ws, "Runtime.evaluate", {
                "expression": "document.getElementById('security')?.scrollIntoView();"
            }, msg_id=40)
            await asyncio.sleep(1)
            await capture_screen(ws, "04_landing_security.png", 41)

            # --- SCREENSHOT 5: Pricing Plans ---
            await send_cmd(ws, "Runtime.evaluate", {
                "expression": "document.getElementById('pricing')?.scrollIntoView();"
            }, msg_id=50)
            await asyncio.sleep(1)
            await capture_screen(ws, "05_landing_pricing.png", 51)

            # --- SCREENSHOT 6: Auth Login Modal ---
            await send_cmd(ws, "Runtime.evaluate", {
                "expression": "window.scrollTo(0, 0);"
            }, msg_id=60)
            await asyncio.sleep(0.5)
            # Click sign in button
            await send_cmd(ws, "Runtime.evaluate", {
                "expression": "document.querySelectorAll('button').forEach(b => { if (b.textContent.includes('Sign in') || b.textContent.includes('Log in')) b.click(); });"
            }, msg_id=61)
            await asyncio.sleep(1)
            await capture_screen(ws, "06_login_auth_modal.png", 62)

            # --- SCREENSHOT 7: Dashboard Workspace (Logged In) ---
            # Inject token and navigate to dashboard
            await send_cmd(ws, "Runtime.evaluate", {
                "expression": f"localStorage.setItem('skyhaven_token', '{JWT_TOKEN}'); location.reload();"
            }, msg_id=70)
            await asyncio.sleep(2.5)
            await capture_screen(ws, "07_dashboard_workspace.png", 71)

            # --- SCREENSHOT 8: Public Share Page ---
            await send_cmd(ws, "Page.navigate", {"url": "http://localhost:5173/share/preview_vault_doc"}, msg_id=80)
            await asyncio.sleep(1.5)
            await capture_screen(ws, "08_public_share_portal.png", 81)

            print("All high-resolution screenshots captured successfully!")
    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(main())
