import cv2
import os
import threading  # hop
import json
import time
import requests
import numpy as np
from collections import deque
from ultralytics import YOLO
from .config import config
from .utils.geometry import car_in_slot, denormalize_slots

# hop: the hop API only lets staff (or this agent) change a lot's occupancy, so the agent sends a token
AGENT_TOKEN = os.getenv("PARKIE_AGENT_TOKEN", "dev_admin")
AUTH = {"Authorization": f"Bearer {AGENT_TOKEN}"}

def get_backend_config(slots_file=None):
    backend_cfg = {"camera_url": None, "slots_data": []}
    if config.LOT_ID:
        url = f"{config.BACKEND_URL}/lots/{config.LOT_ID}/config"
        try:
            resp = requests.get(url, timeout=5, headers=AUTH)  # hop: token
            if resp.status_code == 200:
                backend_cfg = resp.json()
                print(f"Config fetched from backend for lot: {config.LOT_ID}")
            else:
                print(f"Backend returned {resp.status_code}")
        except Exception as e:
            print(f"Backend unreachable ({e})")

    if slots_file and os.path.exists(slots_file):
        try:
            with open(slots_file) as f:
                local_slots = json.load(f).get("slots", [])
            if local_slots:
                backend_cfg["slots_data"] = local_slots
                print(f"Using local slots from {slots_file}")
        except Exception as e:
            print(f"Error reading slots: {e}")

    return backend_cfg if (backend_cfg.get("camera_url") or backend_cfg.get("slots_data")) else None

def update_occupancy(occupied_count):
    if not config.LOT_ID:
        return
    try:
        resp = requests.post(f"{config.BACKEND_URL}/vision/update_lot",
                             json={"lot_id": config.LOT_ID, "detected_cars": occupied_count},
                             headers=AUTH, timeout=5)  # hop: token
        print(f"Backend updated: {occupied_count} cars  [{resp.status_code}]")
    except Exception as e:
        print(f"Backend update failed: {e}")

def draw_overlay(frame, slots, slot_states, detections, model_names, W):
    for i, poly in enumerate(slots):
        occupied = slot_states[i]
        color = (92, 154, 255) if occupied else (154, 201, 53)  # hop: apricot / mint
        pts = np.array(poly, np.int32).reshape((-1, 1, 2))
        overlay = frame.copy()
        cv2.fillPoly(overlay, [pts], color)
        cv2.addWeighted(overlay, 0.25, frame, 0.75, 0, frame)
        cv2.polylines(frame, [pts], True, color, 2)

    for d in detections:
        x1,y1,x2,y2,conf,cls = d
        cv2.rectangle(frame,(int(x1),int(y1)),(int(x2),int(y2)),(255,91,61),1)  # hop: blue
        cv2.putText(frame, f"{model_names[int(cls)]} {conf:.2f}",
                    (int(x1),int(y1)-5), cv2.FONT_HERSHEY_SIMPLEX, 0.35,(255,91,61),1)

    occupied_count = sum(slot_states.values())
    free = len(slots) - occupied_count
    cv2.rectangle(frame,(0,0),(W,36),(51,16,26),-1)  # hop: ink
    cv2.putText(frame,
                f"FREE: {free}   OCCUPIED: {occupied_count}   TOTAL: {len(slots)}",
                (10,24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)

def draw_overlay_stream(frame, slots, slot_states, detections, model_names, W, width=960):
    """hop: the same picture as draw_overlay, drawn once on a 960 px copy for the web stream
    (draw_overlay copies the full frame once per slot, too slow to do 30 times a second)."""
    k = width / W
    small = cv2.resize(frame, (width, int(frame.shape[0] * k)), interpolation=cv2.INTER_AREA)
    layer = small.copy()
    for i, poly in enumerate(slots):
        color = (92, 154, 255) if slot_states.get(i) else (154, 201, 53)  # apricot / mint
        pts = (np.array(poly, np.float32) * k).astype(np.int32).reshape((-1, 1, 2))
        cv2.fillPoly(layer, [pts], color)
    cv2.addWeighted(layer, 0.25, small, 0.75, 0, small)
    for i, poly in enumerate(slots):
        color = (92, 154, 255) if slot_states.get(i) else (154, 201, 53)
        pts = (np.array(poly, np.float32) * k).astype(np.int32).reshape((-1, 1, 2))
        cv2.polylines(small, [pts], True, color, 2)
    for d in detections:
        x1, y1, x2, y2, conf, cls = d
        cv2.rectangle(small, (int(x1 * k), int(y1 * k)), (int(x2 * k), int(y2 * k)), (255, 91, 61), 1)
    occupied_count = sum(1 for v in slot_states.values() if v)
    free = len(slots) - occupied_count
    cv2.rectangle(small, (0, 0), (width, 30), (51, 16, 26), -1)
    cv2.putText(small, f"FREE: {free}   OCCUPIED: {occupied_count}   TOTAL: {len(slots)}",
                (10, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    return small

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", help="Video file path")
    parser.add_argument("--camera", type=int)
    parser.add_argument("--slots", help="Local slots JSON override")
    parser.add_argument("--model", default=config.MODEL_PATH)
    parser.add_argument("--debug", action="store_true")
    parser.add_argument("--conf", type=float, default=config.DEFAULT_CONF)
    parser.add_argument("--shrink", type=float, default=0.65)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--infer-every", type=float, default=config.INFERENCE_INTERVAL)
    parser.add_argument("--report-every", type=float, default=config.REPORT_INTERVAL)
    # hop: serve the frames to the web dashboard instead of an OpenCV window
    parser.add_argument("--serve", action="store_true")
    parser.add_argument("--port", type=int, default=int(os.getenv("PARKIE_FEED_PORT", "8090")))
    args = parser.parse_args()

    if args.serve:
        from .live_feed import hub, start_server
        start_server(args.port)

    backend_cfg = get_backend_config(slots_file=args.slots)
    if not backend_cfg:
        # hop: a lot with no slots drawn yet still shows its camera; slots are picked up once an admin saves them
        if not (args.serve and (args.video or args.camera is not None)):
            print("No config. Run select_slots.py first."); return
        backend_cfg = {"camera_url": None, "slots_data": []}
        print("No slots yet: streaming the camera and waiting for slots from the dashboard.")

    source = args.camera if args.camera is not None \
             else args.video if args.video \
             else backend_cfg.get("camera_url")
    if source is None:
        print("No video source."); return

    slots_raw = backend_cfg.get("slots_data", [])
    model = YOLO(args.model)

    # hop: in --serve mode the same inference runs on a worker thread, so the video keeps real-time speed.
    # torch would take every core and starve the video decoder, so it gets half of them.
    infer_busy = threading.Event()
    if args.serve:
        try:
            import torch
            torch.set_num_threads(int(os.getenv("PARKIE_TORCH_THREADS", max(1, (os.cpu_count() or 2) // 2))))
        except Exception:
            pass

    def infer_async(img, slots_now, history_now, states_now):
        nonlocal last_dets
        try:
            results = model(img, classes=config.VEHICLE_CLASSES,
                               conf=args.conf, imgsz=args.imgsz, verbose=False)
            dets = results[0].boxes.data.tolist()
            fh, fw = img.shape[:2]
            for i, poly in enumerate(slots_now):
                raw = any(car_in_slot(poly, d[:4], frame_w=fw, frame_h=fh, shrink=args.shrink) for d in dets)
                history_now[i].append(raw)
                states_now[i] = sum(history_now[i]) > len(history_now[i]) / 2
            last_dets = dets
        except Exception as e:
            print(f"Inference error: {e}")
        finally:
            infer_busy.clear()
    
    while True: # Outer loop for reconnection
        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            print(f"Cannot open: {source}. Retrying in {config.RETRY_BACKOFF}s...")
            time.sleep(config.RETRY_BACKOFF)
            continue

        W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        slots = denormalize_slots(slots_raw, W, H)
        history = {i: deque(maxlen=config.OCCUPANCY_SMOOTHING) for i in range(len(slots))}
        slot_states = {i: False for i in range(len(slots))}
        last_dets = []
        last_infer = 0
        last_report = 0

        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        delay = max(1, int(1000 / fps))
        frame_period = 1.0 / fps  # hop: without the OpenCV window, pace the file to real time
        next_frame_at = time.time()
        served = 0
        shown = None

        if args.debug:
            cv2.namedWindow("Vision Agent", cv2.WINDOW_NORMAL)
            cv2.resizeWindow("Vision Agent", 1024, 576)

        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    # If it's a file, loop it. If it's a stream, it might have dropped.
                    if isinstance(source, str) and os.path.exists(source):
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue
                    else:
                        print("Stream dropped.")
                        break

                now = time.time()
                
                if args.serve and now - last_infer >= args.infer_every:
                    last_infer = now
                    if not infer_busy.is_set():
                        infer_busy.set()
                        threading.Thread(target=infer_async, args=(frame.copy(), slots, history, slot_states), daemon=True).start()
                elif now - last_infer >= args.infer_every:
                    results = model(frame, classes=config.VEHICLE_CLASSES,
                                       conf=args.conf, imgsz=args.imgsz, verbose=False)
                    last_dets = results[0].boxes.data.tolist()
                    last_infer = now

                    occupied_count = 0
                    for i, poly in enumerate(slots):
                        raw = any(car_in_slot(poly, d[:4], frame_w=W, frame_h=H, shrink=args.shrink) for d in last_dets)
                        history[i].append(raw)
                        slot_states[i] = sum(history[i]) > len(history[i]) / 2
                        if slot_states[i]:
                            occupied_count += 1

                if args.serve:
                    # hop: publish the raw frame and the overlay view to the dashboard
                    hub.publish(frame, draw_overlay_stream(frame, slots, slot_states, last_dets, model.names, W))
                elif args.debug:
                    draw_overlay(frame, slots, slot_states, last_dets, model.names, W)
                    cv2.imshow("Vision Agent", frame)

                if now - last_report >= args.report_every:
                    stable_occupied = sum(1 for states in history.values() if sum(states) > len(states)/2)
                    if slots:  # hop: nothing to report before any slot is drawn
                        update_occupancy(stable_occupied)
                    last_report = now
                    # hop: pick up slots saved from the dashboard without restarting
                    fresh = get_backend_config(slots_file=args.slots)
                    if fresh and fresh.get("slots_data") != slots_raw:
                        slots_raw = fresh.get("slots_data", [])
                        slots = denormalize_slots(slots_raw, W, H)
                        history = {i: deque(maxlen=config.OCCUPANCY_SMOOTHING) for i in range(len(slots))}
                        slot_states = {i: False for i in range(len(slots))}
                        last_infer = 0
                        print(f"Slots updated from the dashboard: {len(slots)} slots")

                if args.serve:
                    # hop: real-time pacing for a looping file
                    next_frame_at += frame_period
                    pause = next_frame_at - time.time()
                    if pause > 0:
                        time.sleep(pause)
                    else:
                        # behind real time: drop frames to catch up instead of slowing the video down
                        while next_frame_at + frame_period < time.time():
                            if not cap.grab():
                                break
                            next_frame_at += frame_period
                    continue
                if cv2.waitKey(delay) & 0xFF == ord('q'):
                    cap.release()
                    cv2.destroyAllWindows()
                    return

        except Exception as e:
            print(f"Error during execution: {e}")
        
        cap.release()
        print(f"Reconnecting in {config.RETRY_BACKOFF}s...")
        time.sleep(config.RETRY_BACKOFF)

if __name__ == "__main__":
    main()
