// Parkie's lot editor (Frontend/Dashboard/src/views/lotEditor.ts in github.com/bisquitew/Parkie), in plain JavaScript.
// Same behaviour: capture a camera frame, click 4 corners per parking slot, drag a corner to adjust it, undo the last
// point, clear everything, and save the slots as [x1,y1,x2,y2,x3,y3,x4,y4] in the frame's own pixels with the
// capacity set to the number of slots. Changes for hop: hop colours, and the window listeners are removed on close.
// Parkie grabs any point within 10 px of a click, which makes it impossible to start a new slot on a neighbour's
// corner. Here a click always adds a point (snapped onto a corner when it lands on one) and a corner only moves once
// the mouse is dragged a few pixels. Distances are in screen pixels, so it feels the same at any zoom.
const HIT_RADIUS = 7;   // screen px around a corner
const DRAG_START = 4;   // screen px of movement before a press becomes a drag
// hop colours, read from the page theme so they follow light and dark mode (Parkie: #aa3bff, #ff00ff, #ff3b3b)
const themeColor = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
const colors = () => ({ slot: themeColor('--ink', '#1A1033'), drag: themeColor('--blue', '#3D5BFF'), open: themeColor('--apricot', '#E2711D') });

/**
 * @param {object} o
 * @param {HTMLCanvasElement} o.canvas
 * @param {number[][]} o.slots   existing slots_data of the lot
 * @param {(slots: number[][]) => Promise<void>} o.onSave
 */
export function createLotEditor({ canvas, slots = [], onSave }) {
  const ctx = canvas.getContext('2d');
  let points = [];
  let img = null;
  let draggingPointIndex = null;
  let press = null; // { index, x, y, sx, sy } of the current mouse press

  // Initialize from existing slots (as in Parkie)
  slots.forEach((slot) => {
    for (let i = 0; i < 8; i += 2) points.push({ x: slot[i], y: slot[i + 1] });
  });

  const getMousePos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: Math.round((e.clientX - rect.left) * scaleX), y: Math.round((e.clientY - rect.top) * scaleY) };
  };

  function draw() {
    if (!img) return;
    const { slot: COLOR_SLOT, drag: COLOR_DRAG, open: COLOR_OPEN } = colors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    // lines and dots scale with the frame so they stay visible on a 1920 px frame shown smaller
    const k = Math.max(1, canvas.width / 960);
    ctx.lineWidth = 2 * k;

    for (let i = 0; i < points.length; i += 4) {
      ctx.strokeStyle = COLOR_SLOT;
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      if (points[i + 1]) ctx.lineTo(points[i + 1].x, points[i + 1].y);
      if (points[i + 2]) ctx.lineTo(points[i + 2].x, points[i + 2].y);
      if (points[i + 3]) ctx.lineTo(points[i + 3].x, points[i + 3].y);
      if (points[i + 3]) ctx.closePath();
      ctx.stroke();

      for (let j = 0; j < 4 && i + j < points.length; j++) {
        ctx.fillStyle = i + j === draggingPointIndex ? COLOR_DRAG : COLOR_SLOT;
        ctx.beginPath();
        ctx.arc(points[i + j].x, points[i + j].y, 5 * k, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const remaining = points.length % 4;
    if (remaining > 0) {
      const start = points.length - remaining;
      ctx.strokeStyle = COLOR_OPEN;
      ctx.beginPath();
      ctx.moveTo(points[start].x, points[start].y);
      for (let j = 1; j < remaining; j++) ctx.lineTo(points[start + j].x, points[start + j].y);
      ctx.stroke();
    }
  }

  // canvas pixels per screen pixel
  const scale = () => canvas.width / Math.max(1, canvas.getBoundingClientRect().width);
  const nearestPoint = (x, y) => {
    const r = HIT_RADIUS * scale();
    let best = -1;
    let bestD = Infinity;
    points.forEach((p, i) => {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < r && d < bestD) { best = i; bestD = d; }
    });
    return best;
  };

  const onDown = (e) => {
    if (e.button !== 0 || !img || !img.complete || !img.src) return;
    e.preventDefault();
    const { x, y } = getMousePos(e);
    press = { index: nearestPoint(x, y), x, y, sx: e.clientX, sy: e.clientY };
  };
  const onMove = (e) => {
    if (!press) return;
    if (draggingPointIndex === null) {
      if (press.index === -1 || Math.hypot(e.clientX - press.sx, e.clientY - press.sy) < DRAG_START) return;
      draggingPointIndex = press.index;
    }
    points[draggingPointIndex] = getMousePos(e);
    draw();
  };
  const onUp = () => {
    if (!press) return;
    if (draggingPointIndex !== null) {
      draggingPointIndex = null;
    } else {
      // a click: add a point; on an existing corner, reuse its exact position so neighbouring slots share it
      const hit = press.index !== -1 ? points[press.index] : null;
      points.push(hit ? { x: hit.x, y: hit.y } : { x: press.x, y: press.y });
    }
    press = null;
    draw();
  };
  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  return {
    /** Shows a captured frame (an image URL or data URL) and draws the slots on it. */
    setFrame(src) {
      return new Promise((resolve, reject) => {
        const next = new Image();
        next.crossOrigin = 'anonymous';
        next.onload = () => {
          img = next;
          canvas.width = img.width;
          canvas.height = img.height;
          draw();
          resolve();
        };
        next.onerror = () => reject(new Error('Could not load the frame.'));
        next.src = src;
      });
    },
    undo() { points.pop(); draw(); },
    clear() { points = []; draw(); },
    count: () => ({ points: points.length, slots: Math.floor(points.length / 4) }),
    async save() {
      if (points.length % 4 !== 0 || points.length === 0) {
        throw new Error('Please define at least one complete slot (4 points per slot).');
      }
      const slotsData = [];
      for (let i = 0; i < points.length; i += 4) {
        const [p1, p2, p3, p4] = points.slice(i, i + 4);
        slotsData.push([p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y]);
      }
      await onSave(slotsData);
      return slotsData.length;
    },
    destroy() {
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    },
  };
}
