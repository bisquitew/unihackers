"""
Trains or fine-tunes a parking detector on PKLot data.
"""

import os
import shutil
import yaml
from pathlib import Path
from dotenv import load_dotenv
from ultralytics import YOLO
import torch

load_dotenv()

# CONFIG
DATASET_DIR   = "pklot_dataset"
OUTPUT_MODEL  = "assets/parking_detector.pt"
TRAIN_YAML    = "pklot.yaml"

EPOCHS        = 50
IMAGE_SIZE    = 640
BATCH_SIZE    = 16

def build_pklot_yaml():
    if not Path(DATASET_DIR).exists():
        print(f"Warning: {DATASET_DIR} not found. Ensure your dataset is in this folder.")
        return

    config = {
        "path": ".",
        "train": f"{DATASET_DIR}/train/images",
        "val": f"{DATASET_DIR}/valid/images",
        "test": f"{DATASET_DIR}/test/images",
        "nc": 2,
        "names": ["space-empty", "space-occupied"],
    }
    with open(TRAIN_YAML, "w") as f:
        yaml.dump(config, f, default_flow_style=False)
    print(f"Dataset config → {TRAIN_YAML}")

def train():
    if not torch.cuda.is_available():
        print("CUDA not available. Training will be very slow on CPU.")
        device = "cpu"
    else:
        gpu = torch.cuda.get_device_name(0)
        print(f"Using GPU: {gpu}")
        device = 0

    # Initialize from standard YOLOv8n
    model = YOLO("yolov8n.pt")

    results = model.train(
        data=TRAIN_YAML,
        epochs=EPOCHS,
        imgsz=IMAGE_SIZE,
        batch=BATCH_SIZE,
        name="pklot_training",
        device=device,
        exist_ok=True
    )

    best = Path(results.save_dir) / "weights" / "best.pt"
    os.makedirs("assets", exist_ok=True)
    shutil.copy(best, OUTPUT_MODEL)
    print(f"\nDone! Model saved → {OUTPUT_MODEL}")

if __name__ == "__main__":
    if Path(DATASET_DIR).exists():
        build_pklot_yaml()
        train()
    else:
        print(f"Please download PKLot dataset to {DATASET_DIR} before training.")