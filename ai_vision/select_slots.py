import cv2
import json
import os
import argparse

# Global variables to store slot coordinates
slots = []
current_slot = None
drawing = False

def mouse_callback(event, x, y, flags, param):
    global current_slot, drawing, slots

    if event == cv2.EVENT_LBUTTONDOWN:
        drawing = True
        current_slot = [x, y, x, y]

    elif event == cv2.EVENT_MOUSEMOVE:
        if drawing:
            current_slot[2] = x
            current_slot[3] = y

    elif event == cv2.EVENT_LBUTTONUP:
        drawing = False
        current_slot[2] = x
        current_slot[3] = y
        # Normalized coordinates (0.0 to 1.0) for resolution independence
        x1, y1, x2, y2 = current_slot
        # Ensure x1 < x2 and y1 < y2
        x_min, x_max = min(x1, x2), max(x1, x2)
        y_min, y_max = min(y1, y2), max(y1, y2)
        
        # Store as pixel coordinates for now, we'll normalize on save
        slots.append([x_min, y_min, x_max, y_max])
        current_slot = None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", default="assets/demo_video.mp4", help="Path to video source")
    parser.add_argument("--output", default="assets/parking_slots.json", help="Output JSON path")
    args = parser.parse_args()

    if not os.path.exists(args.video):
        print(f"Error: {args.video} not found!")
        return

    cap = cv2.VideoCapture(args.video)
    ret, frame = cap.read()
    cap.release()

    if not ret:
        print("Error: Could not read frame from video.")
        return

    H, W, _ = frame.shape
    clone = frame.copy()
    cv2.namedWindow("Select Slots")
    cv2.setMouseCallback("Select Slots", mouse_callback)

    print("\n--- Parking Slot Selector ---")
    print("1. Click and drag to draw a box around a parking spot.")
    print("2. Press 'r' to reset (clear all slots).")
    print("3. Press 'c' to cancel and exit without saving.")
    print("4. Press 's' to save and exit.")
    print("------------------------------\n")

    while True:
        temp_frame = clone.copy()
        
        # Draw existing slots
        for i, (x1, y1, x2, y2) in enumerate(slots):
            cv2.rectangle(temp_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(temp_frame, f"Slot {i+1}", (x1, y1 - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

        # Draw current drawing box
        if current_slot:
            cv2.rectangle(temp_frame, (current_slot[0], current_slot[1]), 
                          (current_slot[2], current_slot[3]), (0, 255, 255), 2)

        cv2.imshow("Select Slots", temp_frame)
        key = cv2.waitKey(1) & 0xFF

        if key == ord("s"):
            # Save slots
            data = {
                "video_source": args.video,
                "resolution": [W, H],
                "slots": slots
            }
            os.makedirs(os.path.dirname(args.output), exist_ok=True)
            with open(args.output, "w") as f:
                json.dump(data, f, indent=4)
            print(f"Saved {len(slots)} slots to {args.output}")
            break
        
        elif key == ord("r"):
            slots.clear()
            print("Cleared all slots.")

        elif key == ord("c"):
            print("Cancelled.")
            break

    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
