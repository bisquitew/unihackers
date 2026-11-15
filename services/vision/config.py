import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class VisionConfig:
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
    LOT_ID = os.getenv("LOT_ID", "lot-iulius-p5-09")
    MODEL_PATH = os.getenv("MODEL_PATH", "yolov8n.pt")
    
    # Detection classes for vehicles (COCO indices: 2=car, 3=motorcycle, 5=bus, 7=truck, 1=bicycle)
    VEHICLE_CLASSES = [2, 3, 5, 7, 1]
    
    OCCUPANCY_SMOOTHING = 5
    DEFAULT_CONF = 0.20
    INFERENCE_INTERVAL = 2.0  # seconds between inference runs
    REPORT_INTERVAL = 5.0     # seconds between backend updates
    RETRY_BACKOFF = 5.0       # seconds before reconnecting
    
    SLOTS_FILE = str(BASE_DIR / "assets" / "parking_slots.json")
    DEFAULT_VIDEO = str(BASE_DIR / "assets" / "demo_parking.mp4")

config = VisionConfig()
