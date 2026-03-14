import cv2
import os
import json
import argparse
import numpy as np
from ultralytics import YOLO
from dotenv import load_dotenv

load_dotenv()

# SETTINGS
SLOTS_FILE = "assets/parking_slots.json"
DEFAULT_MODEL = "yolov8s.pt"  # Upgraded to 'Small' model for better detection at scale.

# Detection classes for cars/vehicles (COCO indices)
# 2: car, 3: motorcycle, 5: bus, 7: truck
COCO_VEHICLE_CLASSES = [2, 3, 5, 7]

def calculate_iou(boxA, boxB):
    # box = [x1, y1, x2, y2]
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interArea = max(0, xB - xA + 1) * max(0, yB - yA + 1)
    boxAArea = (boxA[2] - boxA[0] + 1) * (boxA[3] - boxA[1] + 1)
    
    # We use "intersection over slot area" for occupancy
    overlap = interArea / float(boxAArea)
    return overlap

def main():
    parser = argparse.ArgumentParser()
    src = parser.add_mutually_exclusive_group()
    src.add_argument("--video",  default="assets/demo_video.mp4")
    src.add_argument("--camera", type=int, help="Camera index e.g. 0")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Path to YOLO model (.pt)")
    parser.add_argument("--conf", type=float, default=0.25)
    parser.add_argument("--iou", type=float, default=0.3, help="Overlap threshold for occupancy")
    parser.add_argument("--imgsz", type=int, default=640, help="Inference image size")
    parser.add_argument("--debug", action="store_true", help="Draw raw model detections")
    args = parser.parse_args()

    # 1. Load Slots
    if not os.path.exists(SLOTS_FILE):
        print(f"Error: {SLOTS_FILE} not found!")
        print(f"Please run 'python select_slots.py' first to define parking spots.")
        return
    
    with open(SLOTS_FILE, "r") as f:
        slots_data = json.load(f)
    
    parking_slots = slots_data.get("slots", [])
    print(f"Loaded {len(parking_slots)} parking slots.")

    # 2. Load Model
    print(f"Loading model: {args.model}")
    model = YOLO(args.model)
    print("Model ready.")

    # Determine if we should filter by vehicle classes (COCO) or use all detections (PKLot)
    # COCO models have 'car' at index 2. PKLot models are usually 0: empty, 1: occupied.
    is_coco = "yolo" in args.model.lower() and "parking_detector" not in args.model.lower()
    
    source = args.camera if args.camera is not None else args.video
    cap    = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"Cannot open: {source}")
        return

    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    print(f"\nFeed: {W}x{H}  —  press Q to quit")
    print(f"Using {'COCO' if is_coco else 'Custom PKLot'} detection logic.")

    while cap.isOpened():
        ok, frame = cap.read()
        if not ok:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        # Inference
        target_classes = COCO_VEHICLE_CLASSES if is_coco else None
        results = model(frame, conf=args.conf, classes=target_classes, imgsz=args.imgsz, verbose=False)
        detections = results[0].boxes.data.tolist()

        occupied_count = 0
        
        # Check each slot
        slot_statuses = [] 
        for i, slot in enumerate(parking_slots):
            is_occupied = False
            for det in detections:
                det_box = det[:4] 
                cls_id  = int(det[5])
                
                # Logic:
                # If COCO: Any 'vehicle' detection overlapping the slot counts as occupied.
                # If PKLot: Any detection labeled 'space-occupied' (usually cls 1) overlapping counts.
                # If PKLot: We can also check if a 'detected slot' overlaps our 'manual slot'.
                
                overlap = calculate_iou(slot, det_box)
                
                if overlap > args.iou:
                    if not is_coco:
                        # For PKLot model, check if the label is 'occupied'
                        label = model.names[cls_id].lower()
                        if "occupied" in label:
                            is_occupied = True
                            break
                    else:
                        is_occupied = True
                        break
            
            slot_statuses.append((slot, is_occupied))
            if is_occupied:
                occupied_count += 1

        # Debug drawing (raw detections)
        if args.debug:
            for det in detections:
                dx1, dy1, dx2, dy2, dconf, dcls = det
                dcls_name = model.names[int(dcls)]
                cv2.rectangle(frame, (int(dx1), int(dy1)), (int(dx2), int(dy2)), (255, 255, 0), 1)
                cv2.putText(frame, f"RAW: {dcls_name} {dconf:.2f}", (int(dx1), int(dy1) - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 0), 1)

        # Drawing
        for (x1, y1, x2, y2), occupied in slot_statuses:
            # Cast to int to ensure valid slicing and drawing
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            
            color = (0, 0, 210) if occupied else (0, 210, 0)
            status_text = "OCCUPIED" if occupied else "FREE"
            
            # Guard against zero-size ROIs (which would cause cv2 to return None)
            if (x2 > x1) and (y2 > y1):
                # Transparent Overlay
                sub_img = frame[y1:y2, x1:x2]
                overlay = np.full(sub_img.shape, color, dtype=np.uint8)
                res = cv2.addWeighted(sub_img, 0.7, overlay, 0.3, 0)
                if res is not None:
                    frame[y1:y2, x1:x2] = res
            
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, status_text, (x1 + 3, y1 + 15),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)

        # HUD
        free_count = len(parking_slots) - occupied_count
        cv2.rectangle(frame, (0, 0), (W, 40), (20, 20, 20), -1)
        cv2.putText(frame,
                    f"FREE: {free_count}   OCCUPIED: {occupied_count}   TOTAL: {len(parking_slots)} [ROI Mode]",
                    (15, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        cv2.imshow("Smart Parking Viewer", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()