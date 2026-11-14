import cv2
import numpy as np

def is_point_in_poly(point, poly):
    """
    Checks if a point (x, y) is inside a polygon [[x1, y1], [x2, y2], ...].
    """
    pts = np.array(poly, np.int32).reshape((-1, 1, 2))
    return cv2.pointPolygonTest(pts, (float(point[0]), float(point[1])), False) >= 0

def shrink_poly(poly, factor=0.75):
    """
    Shrinks a polygon towards its centroid by a given factor.
    """
    pts = np.array(poly, dtype=np.float32)
    centroid = pts.mean(axis=0)
    return ((pts - centroid) * factor + centroid).astype(int).tolist()

def car_in_slot(poly, box, frame_w=1920, frame_h=1080, max_fraction=0.15, shrink=0.65):
    """
    Returns True if a vehicle detection meaningfully overlaps a slot polygon.
    Ignores detections whose bounding box is too large relative to the frame.
    """
    bx1, by1, bx2, by2 = box
    box_area = (bx2 - bx1) * (by2 - by1)
    frame_area = frame_w * frame_h
    if box_area > frame_area * max_fraction:
        return False

    cx = (bx1 + bx2) / 2
    cy = (by1 + by2) / 2
    bw = bx2 - bx1
    bh = by2 - by1
    
    inner = shrink_poly(poly, factor=shrink)
    check_points = [
        (cx,              by2 - bh * 0.05),  # ground contact center
        (cx - bw * 0.15,  by2 - bh * 0.05),  # ground left
        (cx + bw * 0.15,  by2 - bh * 0.05),  # ground right
        (cx,              by2 - bh * 0.25),  # lower center
        (cx - bw * 0.15,  by2 - bh * 0.25),  # lower left
        (cx + bw * 0.15,  by2 - bh * 0.25),  # lower right
        (cx,              by2 - bh * 0.50),  # mid-lower center
        (cx,              cy),               # absolute center
        (cx - bw * 0.15,  cy),               # mid left
        (cx + bw * 0.15,  cy),               # mid right
    ]
    
    hits_inner = sum(1 for pt in check_points if is_point_in_poly(pt, inner))
    hits_full = sum(1 for pt in check_points if is_point_in_poly(pt, poly))
    return hits_inner >= 2 or hits_full >= 4

def denormalize_slots(slots, W, H):
    """
    Converts normalized (0-1), percentage, or flat coordinates to nested list of pixel vertices.
    Handles:
    - 8 flat coordinates [x1, y1, x2, y2, x3, y3, x4, y4]
    - 4 flat coordinates [x1, y1, x2, y2]
    - Dict objects { id, x, y, width, height, polygon? }
    - Nested coordinate arrays [[x1, y1], [x2, y2], ...]
    """
    result = []
    for slot in slots:
        if isinstance(slot, dict):
            if "polygon" in slot and isinstance(slot["polygon"], list) and len(slot["polygon"]) >= 3:
                poly = slot["polygon"]
                is_norm = any(isinstance(p[0], float) and p[0] <= 1.01 for p in poly)
                result.append([[int(p[0] * W), int(p[1] * H)] if is_norm else [int(p[0]), int(p[1])] for p in poly])
            else:
                x = slot.get("x", 0)
                y = slot.get("y", 0)
                w = slot.get("width", 10)
                h = slot.get("height", 10)
                # Percent 0..100
                if max(x, y, w, h) > 1.05 and max(x, y, w, h) <= 100:
                    px = int((x / 100.0) * W)
                    py = int((y / 100.0) * H)
                    pw = int((w / 100.0) * W)
                    ph = int((h / 100.0) * H)
                elif max(x, y, w, h) <= 1.05:
                    px = int(x * W)
                    py = int(y * H)
                    pw = int(w * W)
                    ph = int(h * H)
                else:
                    px, py, pw, ph = int(x), int(y), int(w), int(h)
                result.append([[px, py], [px + pw, py], [px + pw, py + ph], [px, py + ph]])
        elif isinstance(slot, (list, tuple)):
            if len(slot) == 0:
                continue
            if not isinstance(slot[0], (list, tuple)):
                vals = list(slot)
                if max(vals) <= 1.01:
                    vals = [v * (W if i % 2 == 0 else H) for i, v in enumerate(vals)]
                
                if len(vals) == 4:  # x1, y1, x2, y2
                    x1, y1, x2, y2 = map(int, vals)
                    result.append([[x1, y1], [x2, y1], [x2, y2], [x1, y2]])
                elif len(vals) >= 8:  # 4-point polygon
                    result.append([[int(vals[i]), int(vals[i+1])] for i in range(0, 8, 2)])
            else:
                is_norm = any(isinstance(p[0], float) and p[0] <= 1.01 for p in slot)
                result.append([[int(p[0] * W), int(p[1] * H)] if is_norm else [int(p[0]), int(p[1])] for p in slot])
    return result
