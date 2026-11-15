# Parkie vision agent

The computer vision pipeline from [Parkie](https://github.com/bisquitew/Parkie) (`ai_vision`), copied as it is.
`utils/geometry.py` and `vision_agent.py` come from Parkie commit `72fcef3e`; they were removed from Parkie later
although its README still uses them.

What it does (Parkie's logic, unchanged): YOLO (`yolo11m.pt`, vehicle classes) every 5 s, a detection counts for a
slot when enough of its sample points fall inside the slot polygon, a 5-frame majority vote per slot, and every 15 s
the number of occupied slots is posted to `POST /vision/update_lot`. The API turns that into free spots and a colour.

Changes for hop are marked `# hop:` in the code:
- the agent sends a staff token (`PARKIE_AGENT_TOKEN`), because the hop API only lets staff change occupancy;
- `--serve` streams the frames to the staff dashboard (`live_feed.py`: `/stream`, `/stream?overlay=1`,
  `/snapshot.jpg`) instead of opening an OpenCV window, paced to real time;
- slots saved from the dashboard are picked up at the next report, without a restart;
- with no slots yet, the camera is streamed and the agent waits for slots;
- overlay colours follow hop (mint = free, apricot = occupied).

## Run

The API starts it by itself when `PARKIE_VIDEO` points to a video (set `PARKIE_AGENT=0` to turn that off).
To run it by hand, from this folder:

```bash
python -m ai_vision.vision_agent --serve --video "C:\Users\qubsz\Downloads\demo3.MOV"
```

Then open the staff dashboard, Parking cameras: the feed plays there, and slots are drawn on a captured frame
exactly as in Parkie's lot editor (click 4 corners per slot, drag to adjust, undo, clear, save).
