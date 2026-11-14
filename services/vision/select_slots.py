#!/usr/bin/env python3
"""Interactive Slot Selector (Polygon Mode) using OpenCV GUI.
Click 4 corners for each parking spot to calibrate slots on any frame or camera stream.
"""

import cv2
import json
import os
import sys
import argparse
import numpy as np
from pathlib import Path

try:
    from .config import config
    from .capture_frame import generate_mock_cctv_frame
except (ImportError, ValueError):
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from config import config
    from capture_frame import generate_mock_cctv_frame

class SlotSelector:
    def __init__(self, video_path):
        self.video_path = video_path
        self.slots = []
        self.current_poly = []
        self.frame = None
        self.clone = None
        self.window_name = "Parkie — Calibrate Parking Slots"

    def mouse_callback(self, event, x, y, flags, param):
        if event == cv2.EVENT_LBUTTONDOWN:
            self.current_poly.append([x, y])
            if len(self.current_poly) == 4:
                self.slots.append(self.current_poly)
                self.current_poly = []
                print(f"✅ Slot {len(self.slots)} defined.")

    def run(self, output_path):
        frame = None
        if self.video_path and os.path.exists(self.video_path):
            cap = cv2.VideoCapture(self.video_path)
            ret, captured = cap.read()
            cap.release()
            if ret and captured is not None:
                frame = captured

        if frame is None:
            frame = generate_mock_cctv_frame(lot_name="Interactive Slot Calibrator")

        self.frame = frame
        self.clone = frame.copy()
        H, W, _ = frame.shape

        cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(self.window_name, 1024, 576)
        cv2.setMouseCallback(self.window_name, self.mouse_callback)

        print("\n--- Parking Slot Selector (Polygon Mode) ---")
        print("1. Click 4 corners for each parking spot.")
        print("2. Press 'r' to reset (clear all slots).")
        print("3. Press 's' to save and exit.")
        print("4. Press 'q' or 'c' to cancel.")
        print("--------------------------------------------\n")

        while True:
            display = self.clone.copy()
            # Draw existing slots
            for i, slot in enumerate(self.slots):
                pts = np.array(slot, np.int32).reshape((-1, 1, 2))
                cv2.polylines(display, [pts], True, (0, 255, 0), 2)
                cv2.putText(display, f"Slot {i+1}", (slot[0][0], slot[0][1] - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

            # Draw in-progress polygon
            if len(self.current_poly) > 0:
                for pt in self.current_poly:
                    cv2.circle(display, tuple(pt), 4, (0, 0, 255), -1)
                if len(self.current_poly) > 1:
                    cv2.polylines(display, [np.array(self.current_poly, np.int32)], False, (0, 165, 255), 2)

            cv2.imshow(self.window_name, display)
            key = cv2.waitKey(20) & 0xFF

            if key == ord('r'):
                self.slots = []
                self.current_poly = []
                print("🔄 Slots reset.")
            elif key == ord('s'):
                output_data = {
                    "video_source": self.video_path,
                    "resolution": [W, H],
                    "slots": self.slots
                }
                with open(output_path, "w") as f:
                    json.dump(output_data, f, indent=4)
                print(f"💾 Saved {len(self.slots)} slots to {output_path}")
                break
            elif key in [ord('q'), ord('c'), 27]:
                print("Cancelled without saving.")
                break

        cv2.destroyAllWindows()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", default="rtsp://cam.timisoara-hub.ro/live")
    parser.add_argument("--output", default="assets/parking_slots.json")
    args = parser.parse_args()

    selector = SlotSelector(args.video)
    selector.run(args.output)

if __name__ == "__main__":
    main()
