# hop: the live camera feed for the web dashboard.
# Parkie shows the agent's view in an OpenCV window (--debug). The hop staff dashboard runs in a browser, so the
# same frames are served over HTTP instead:
#   GET /stream            MJPEG of the raw camera frames (an <img> plays it, like an IP camera)
#   GET /stream?overlay=1  the same frames with the agent's overlay (slots, detections, FREE/OCCUPIED bar)
#   GET /snapshot.jpg      the current raw frame at full resolution, for drawing slots on
#   GET /health            {"ok": true, "frames": n}
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

import cv2

STREAM_WIDTH = 960  # the stream is downscaled for the browser; detection uses full frames


class FrameHub:
    def __init__(self):
        self._lock = threading.Condition()
        self._raw = None       # full-resolution BGR frame
        self._raw_jpg = None   # downscaled JPEG for the stream
        self._over_jpg = None  # downscaled JPEG with the overlay
        self.frames = 0

    @staticmethod
    def _encode(frame, width=STREAM_WIDTH):
        h, w = frame.shape[:2]
        if w > width:
            frame = cv2.resize(frame, (width, int(h * width / w)), interpolation=cv2.INTER_AREA)
        ok, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 78])
        return buf.tobytes() if ok else None

    def publish(self, raw, overlay=None):
        # frames are only stored here; they are encoded when a viewer asks (see wait_jpg)
        with self._lock:
            self._raw = raw
            self._overlay = overlay if overlay is not None else raw
            self.frames += 1
            self._cache = {}
            self._lock.notify_all()

    def wait_jpg(self, overlay, last_count, timeout=2.0):
        with self._lock:
            if self.frames == last_count:
                self._lock.wait(timeout)
            count = self.frames
            cached = getattr(self, '_cache', {}).get(overlay)
            frame = getattr(self, '_overlay', None) if overlay else self._raw
        if cached is not None:
            return cached, count
        if frame is None:
            return None, count
        jpg = self._encode(frame)
        with self._lock:
            if self.frames == count:
                self._cache[overlay] = jpg
        return jpg, count

    def snapshot(self):
        with self._lock:
            raw = None if self._raw is None else self._raw.copy()
        if raw is None:
            return None
        ok, buf = cv2.imencode('.jpg', raw, [cv2.IMWRITE_JPEG_QUALITY, 90])
        return buf.tobytes() if ok else None


hub = FrameHub()


class _Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')

    def do_GET(self):
        url = urlparse(self.path)
        if url.path == '/stream':
            overlay = parse_qs(url.query).get('overlay', ['0'])[0] in ('1', 'true')
            self.send_response(200)
            self._cors()
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=frame')
            self.end_headers()
            count = -1
            try:
                while True:
                    jpg, count = hub.wait_jpg(overlay, count)
                    if jpg is None:
                        time.sleep(0.1)
                        continue
                    self.wfile.write(b'--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ' + str(len(jpg)).encode() + b'\r\n\r\n' + jpg + b'\r\n')
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                return
        elif url.path == '/snapshot.jpg':
            jpg = hub.snapshot()
            if jpg is None:
                self.send_response(503)
                self._cors()
                self.end_headers()
                return
            self.send_response(200)
            self._cors()
            self.send_header('Content-Type', 'image/jpeg')
            self.send_header('Content-Length', str(len(jpg)))
            self.end_headers()
            self.wfile.write(jpg)
        elif url.path == '/health':
            body = ('{"ok": true, "frames": %d}' % hub.frames).encode()
            self.send_response(200)
            self._cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()


def start_server(port=8090):
    server = ThreadingHTTPServer(('0.0.0.0', port), _Handler)
    server.daemon_threads = True
    threading.Thread(target=server.serve_forever, daemon=True).start()
    print(f"Live feed on http://localhost:{port}/stream")
    return server
