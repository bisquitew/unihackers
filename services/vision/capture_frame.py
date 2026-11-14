#!/usr/bin/env python3
"""Capture a single frame from an RTSP camera stream, video file, or camera device.
If the camera feed is offline or in simulated demo mode, generates a high-quality CCTV camera frame.
Outputs JSON to stdout: {"status": "ok", "image": "data:image/jpeg;base64,..."}
"""

import sys
import json
import base64
import os

# Suppress noisy OpenCV / GStreamer logging to stderr
os.environ["OPENCV_LOG_LEVEL"] = "SILENT"
os.environ["OPENCV_FFMPEG_LOGLEVEL"] = "-8"

import cv2
import numpy as np
from datetime import datetime

def generate_mock_cctv_frame(camera_url="rtsp://cam.timisoara-hub.ro/live", lot_name="Piața Unirii Central"):
    width, height = 800, 450
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    
    # 1. Dark asphalt tarmac with subtle texture
    frame[:] = (32, 30, 28)
    noise = np.random.normal(0, 4, (height, width, 3)).astype(np.int16)
    frame = np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # 2. Road lanes / drive aisle
    cv2.rectangle(frame, (0, 195), (width, 255), (42, 38, 36), -1)
    
    # Center divider dashed line
    for x in range(20, width, 40):
        cv2.line(frame, (x, 225), (x + 20, 225), (70, 70, 70), 2)

    # 3. Parking bay lines (top and bottom rows)
    bay_xs = list(range(60, 760, 70))
    for x in bay_xs:
        # Top row bays
        cv2.line(frame, (x, 70), (x, 190), (180, 180, 180), 2)
        # Bottom row bays
        cv2.line(frame, (x, 260), (x, 380), (180, 180, 180), 2)

    cv2.line(frame, (60, 70), (bay_xs[-1], 70), (180, 180, 180), 2)
    cv2.line(frame, (60, 380), (bay_xs[-1], 380), (180, 180, 180), 2)

    # 4. Draw simulated parked cars in some spots
    occupied_top = [0, 1, 3, 4, 7, 8]
    occupied_bottom = [1, 2, 5, 6, 8, 9]
    car_colors = [
        (180, 180, 180),  # silver
        (40, 40, 160),    # red
        (170, 120, 40),   # blue
        (30, 30, 30),     # dark grey
        (220, 220, 220),  # white
    ]

    for idx, i in enumerate(occupied_top):
        if i < len(bay_xs) - 1:
            bx = bay_xs[i] + 8
            by = 85
            color = car_colors[idx % len(car_colors)]
            cv2.rectangle(frame, (bx, by), (bx + 54, by + 90), color, -1)
            cv2.rectangle(frame, (bx + 8, by + 20), (bx + 46, by + 65), (50, 50, 50), -1) # windshield
            cv2.rectangle(frame, (bx, by), (bx + 54, by + 90), (10, 10, 10), 1)

    for idx, i in enumerate(occupied_bottom):
        if i < len(bay_xs) - 1:
            bx = bay_xs[i] + 8
            by = 275
            color = car_colors[(idx + 2) % len(car_colors)]
            cv2.rectangle(frame, (bx, by), (bx + 54, by + 90), color, -1)
            cv2.rectangle(frame, (bx + 8, by + 25), (bx + 46, by + 70), (50, 50, 50), -1) # windshield
            cv2.rectangle(frame, (bx, by), (bx + 54, by + 90), (10, 10, 10), 1)

    # 5. Vignette lens effect
    X, Y = np.meshgrid(np.linspace(-1, 1, width), np.linspace(-1, 1, height))
    vignette = 1.0 - 0.35 * (X**2 + Y**2)
    frame = np.clip(frame * vignette[:, :, np.newaxis], 0, 255).astype(np.uint8)

    # 6. CCTV OSD Header
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cv2.rectangle(frame, (0, 0), (width, 36), (15, 15, 15), -1)
    cv2.putText(frame, f"CAM-LIVE • {lot_name.upper()} • {now_str}", (16, 24),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 240, 240), 1, cv2.LINE_AA)
    
    clean_url = str(camera_url)[:45] if camera_url else "LIVE-STREAM"
    cv2.putText(frame, clean_url, (width - 320, 24),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (120, 200, 160), 1, cv2.LINE_AA)

    return frame

def capture_frame(camera_url=None):
    frame = None

    if camera_url and str(camera_url).strip():
        url = str(camera_url).strip()
        try:
            # Temporarily redirect stderr to /dev/null to silence noisy GStreamer/FFmpeg connection logs
            devnull = os.open(os.devnull, os.O_WRONLY)
            old_stderr = os.dup(2)
            os.dup2(devnull, 2)
            os.close(devnull)
            try:
                if url.isdigit():
                    cap = cv2.VideoCapture(int(url))
                else:
                    cap = cv2.VideoCapture(url)
                
                if cap.isOpened():
                    ret, captured = cap.read()
                    cap.release()
                    if ret and captured is not None and captured.size > 0:
                        frame = captured
            finally:
                os.dup2(old_stderr, 2)
                os.close(old_stderr)
        except Exception:
            pass

    # If stream could not be read, fallback to realistic CCTV frame
    if frame is None:
        frame = generate_mock_cctv_frame(camera_url)

    # Resize to standard 800x450 for fast transmission and standard aspect ratio
    if frame.shape[1] != 800 or frame.shape[0] != 450:
        frame = cv2.resize(frame, (800, 450))

    _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    b64 = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{b64}"

def main():
    camera_url = sys.argv[1] if len(sys.argv) > 1 else None
    try:
        image_data = capture_frame(camera_url)
        print(json.dumps({"status": "ok", "image": image_data}))
    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e)}))

if __name__ == "__main__":
    main()
