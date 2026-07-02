from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import webbrowser

PORT = 8000

if __name__ == "__main__":
    server = ThreadingHTTPServer(("", PORT), SimpleHTTPRequestHandler)
    url = f"http://localhost:{PORT}"
    print(f"VoxelCraft Web running at {url}")
    print("Press Ctrl+C to stop.")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    server.serve_forever()
