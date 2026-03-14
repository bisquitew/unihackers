import cv2
import os
import json
import time
import requests
import numpy as np
from collections import deque
from ultralytics import YOLO
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL         = os.getenv("BACKEND_URL", "http://localhost:8000")
LOT_ID              = os.getenv("LOT_ID")
MODEL_PATH          = "yolo11m.pt"
INTERVAL            = 5
VEHICLE_CLASSES     = [2, 3, 5, 7, 1] # 1: bicycle, 2: car, 3: motorcycle, 5: bus, 7: truck
OCCUPANCY_SMOOTHING = 5   # frames to smooth flicker
DEFAULT_CONF        = 0.15 # Lowered from 0.25 to catch less obvious vehicles/vans


def is_point_in_poly(point, poly):
    pts = np.array(poly, np.int32).reshape((-1, 1, 2))
    return cv2.pointPolygonTest(pts, (float(point[0]), float(point[1])), False) >= 0


def car_in_slot(poly, box):
    """
    Check if a car is truly inside a slot.
    Focuses on the lower 'footprint' and 'center' of the car detection box.
    Sample points are biased towards the bottom to prevent side-bleed from
    tall vans, but include the center to catch cars that "overhang" their slots.
    """
    bx1, by1, bx2, by2 = box
    cx = (bx1 + bx2) / 2
    cy = (by1 + by2) / 2
    bw = bx2 - bx1
    bh = by2 - by1
    
    # Sample points from bottom to center
    check_points = [
        (cx,             by2 - bh * 0.05), # Ground contact center
        (cx - bw * 0.15, by2 - bh * 0.05), # Ground contact left
        (cx + bw * 0.15, by2 - bh * 0.05), # Ground contact right
        (cx,             by2 - bh * 0.25), # Lower-mid center
        (cx,             cy),              # Absolute center
    ]
    
    # Requiring at least 2 points ensures that we catch cars that are 
    # slightly misaligned or have large shadows, while still requiring 
    # the bulk of the vehicle to be "over" the polygon.
    points_inside = sum(1 for pt in check_points if is_point_in_poly(pt, poly))
    return points_inside >= 2


def denormalize_slots(slots, W, H):
    """
    Handles all slot formats saved by slot_selector:
      - Flat rectangle: [x1, y1, x2, y2]
      - Flat polygon: [x1, y1, x2, y2, x3, y3, x4, y4]
      - Nested polygon: [[x,y], ...]
    Always returns list of pixel polygons [[x,y], ...].
    """
    result = []
    for slot in slots:
        # 1. Handle flat lists (ints or normalized floats)
        if not isinstance(slot[0], (list, tuple)):
            vals = list(slot)
            # Normalize check: if all values <= 1.0, they are likely percentages
            if max(vals) <= 1.01: # 1.01 to account for float precision
                vals = [val * (W if i % 2 == 0 else H) for i, val in enumerate(vals)]
            
            if len(vals) == 4:
                # [x1, y1, x2, y2] rectangle
                x1, y1, x2, y2 = map(int, vals)
                result.append([[x1, y1], [x2, y1], [x2, y2], [x1, y2]])
            elif len(vals) == 8:
                # [x1, y1, x2, y2, x3, y3, x4, y4] flat polygon
                poly = [[int(vals[i]), int(vals[i+1])] for i in range(0, 8, 2)]
                result.append(poly)
            else:
                print(f"Warning: Unknown flat slot format with length {len(vals)}")
        
        # 2. Handle nested lists [[x,y], ...]
        else:
            poly = []
            is_normalized = any(isinstance(p[0], float) and p[0] <= 1.0 for p in slot)
            for p in slot:
                x, y = p
                if is_normalized:
                    x, y = x * W, y * H
                poly.append([int(x), int(y)])
            result.append(poly)
            
    return result


def get_config(slots_file=None):
    local_slots = []
    if slots_file and os.path.exists(slots_file):
        try:
            with open(slots_file) as f:
                data = json.load(f)
            local_slots = data.get("slots", [])
            print(f"Loaded {len(local_slots)} slots from {slots_file}")
        except Exception as e:
            print(f"Error reading slots file: {e}")

    if not LOT_ID:
        print("LOT_ID not set — using local config only.")
        return {"camera_url": None, "slots_data": local_slots} if local_slots else None

    url = f"{BACKEND_URL}/lots/{LOT_ID}/config"
    try:
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        config = resp.json()
        if local_slots:
            config["slots_data"] = local_slots
        return config
    except Exception as e:
        print(f"Backend unreachable ({e}) — using local config.")
        return {"camera_url": None, "slots_data": local_slots} if local_slots else None


def update_occupancy(occupied_count, total):
    if not LOT_ID:
        return
    try:
        requests.post(f"{BACKEND_URL}/update_lot",
                      json={"lot_id": LOT_ID, "detected_cars": occupied_count,
                            "total_slots": total},
                      timeout=5)
    except Exception as e:
        print(f"Backend update failed: {e}")


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--video",  help="Video file path")
    parser.add_argument("--camera", type=int, help="Camera index e.g. 0")
    parser.add_argument("--slots",  default="assets/parking_slots.json")
    parser.add_argument("--model",  default=MODEL_PATH, help="YOLO model path (e.g., yolov8m.pt)")
    parser.add_argument("--debug",  action="store_true")
    parser.add_argument("--conf",   type=float, default=DEFAULT_CONF)
    args = parser.parse_args()

    config = get_config(slots_file=args.slots)
    if not config:
        print("No configuration found. Run slot_selector.py first."); return

    source = args.camera if args.camera is not None \
             else args.video if args.video \
             else config.get("camera_url")
    if source is None:
        print("No video source. Use --video or --camera."); return

    slots_raw  = config.get("slots_data", [])
    if not slots_raw:
        print("No slots defined. Run slot_selector.py first."); return

    model = YOLO(args.model)
    print(f"Model: {args.model}")

    # Open capture once — don't reopen every frame
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"Cannot open: {source}"); return

    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Feed: {W}x{H}  |  Slots: {len(slots_raw)}  |  Press Q to quit")

    # Denormalize slots once at startup
    slots = denormalize_slots(slots_raw, W, H)

    # Temporal smoothing per slot
    history = {i: deque(maxlen=OCCUPANCY_SMOOTHING) for i in range(len(slots))}

    if args.debug:
        cv2.namedWindow("Vision Agent", cv2.WINDOW_NORMAL)
        cv2.resizeWindow("Vision Agent", 1280, 720)

    last_report = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            # Loop video files, exit on dead streams
            if isinstance(source, str) and os.path.exists(source):
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            break

        results    = model(frame, classes=VEHICLE_CLASSES,
                           conf=args.conf, verbose=False)
        detections = results[0].boxes.data.tolist()

        occupied_count = 0
        for i, poly in enumerate(slots):
            raw = any(car_in_slot(poly, d[:4]) for d in detections)
            history[i].append(raw)
            occupied = sum(history[i]) > len(history[i]) / 2
            if occupied:
                occupied_count += 1

            if args.debug:
                color = (0, 0, 220) if occupied else (0, 210, 0)
                pts   = np.array(poly, np.int32).reshape((-1, 1, 2))

                # Semi-transparent fill
                overlay = frame.copy()
                cv2.fillPoly(overlay, [pts], color)
                cv2.addWeighted(overlay, 0.25, frame, 0.75, 0, frame)
                cv2.polylines(frame, [pts], True, color, 2)

        if args.debug:
            # Draw YOLO detections
            for d in detections:
                x1,y1,x2,y2,conf,cls = d
                cv2.rectangle(frame,(int(x1),int(y1)),(int(x2),int(y2)),(255,200,0),1)
                cv2.putText(frame,f"{model.names[int(cls)]} {conf:.2f}",
                            (int(x1),int(y1)-5),cv2.FONT_HERSHEY_SIMPLEX,0.35,(255,200,0),1)

            free = len(slots) - occupied_count
            cv2.rectangle(frame,(0,0),(W,36),(20,20,20),-1)
            cv2.putText(frame,
                        f"FREE: {free}   OCCUPIED: {occupied_count}   TOTAL: {len(slots)}",
                        (10,24),cv2.FONT_HERSHEY_SIMPLEX,0.7,(0,230,230),2)
            cv2.imshow("Vision Agent", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        # Report to backend at INTERVAL seconds
        now = time.time()
        if now - last_report >= INTERVAL:
            print(f"Occupied: {occupied_count}/{len(slots)}")
            update_occupancy(occupied_count, len(slots))
            last_report = now

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()