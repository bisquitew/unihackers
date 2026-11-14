// Interactive Camera Viewport & Parking Plot Annotator

export class CameraCanvas {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.width = canvasElement.width = 800;
    this.height = canvasElement.height = 450;
    
    this.plots = [];
    this.selectedPlotId = null;
    this.mode = 'select'; // 'select' | 'draw'
    
    this.isDragging = false;
    this.isDrawing = false;
    this.dragStart = { x: 0, y: 0 };
    this.newPlotBox = null;
    this.activeHandle = null; // 'nw', 'ne', 'se', 'sw'
    
    this.onPlotSelected = options.onPlotSelected || (() => {});
    this.onPlotsChanged = options.onPlotsChanged || (() => {});
    
    this.lotName = 'Parking';
    this.setupEvents();
    this.startRenderLoop();
  }

  setLot(lot) {
    this.lotName = lot.name || 'Parking';
    // Ensure plots is an array of objects
    this.plots = (lot.slots_data || []).map((s, idx) => {
      if (Array.isArray(s)) {
        // [x, y, w, h] format
        return {
          id: `slot-${idx + 1}`,
          x: s[0] ?? 10,
          y: s[1] ?? 10,
          width: s[2] ?? 12,
          height: s[3] ?? 18,
          status: 'available',
          type: 'standard',
        };
      }
      return {
        id: s.id || `slot-${idx + 1}`,
        x: s.x ?? 10,
        y: s.y ?? 10,
        width: s.width ?? 12,
        height: s.height ?? 18,
        status: s.status || 'available',
        type: s.type || 'standard',
      };
    });
    
    this.selectedPlotId = this.plots[0]?.id || null;
    this.onPlotSelected(this.getSelectedPlot());
    this.onPlotsChanged(this.plots);
  }

  getPlots() {
    return this.plots;
  }

  getSelectedPlot() {
    return this.plots.find(p => p.id === this.selectedPlotId) || null;
  }

  setMode(mode) {
    this.mode = mode;
    this.canvas.style.cursor = mode === 'draw' ? 'crosshair' : 'default';
  }

  addPlot(plotData) {
    const newPlot = {
      id: plotData.id || `slot-${this.plots.length + 1}`,
      x: plotData.x ?? 20,
      y: plotData.y ?? 20,
      width: plotData.width ?? 12,
      height: plotData.height ?? 18,
      status: plotData.status || 'available',
      type: plotData.type || 'standard',
    };
    this.plots.push(newPlot);
    this.selectedPlotId = newPlot.id;
    this.onPlotSelected(newPlot);
    this.onPlotsChanged(this.plots);
  }

  updateSelectedPlot(patch) {
    const plot = this.getSelectedPlot();
    if (!plot) return;
    Object.assign(plot, patch);
    this.onPlotsChanged(this.plots);
  }

  deleteSelectedPlot() {
    if (!this.selectedPlotId) return;
    this.plots = this.plots.filter(p => p.id !== this.selectedPlotId);
    this.selectedPlotId = this.plots[0]?.id || null;
    this.onPlotSelected(this.getSelectedPlot());
    this.onPlotsChanged(this.plots);
  }

  addGridSlots(count = 5) {
    const startX = 10;
    const startY = 30;
    const slotW = 12;
    const slotH = 20;
    const spacing = 14;

    for (let i = 0; i < count; i++) {
      this.plots.push({
        id: `slot-${this.plots.length + 1}`,
        x: Math.min(85, startX + (i % 6) * spacing),
        y: Math.min(75, startY + Math.floor(i / 6) * 25),
        width: slotW,
        height: slotH,
        status: i % 3 === 0 ? 'occupied' : 'available',
        type: i === 0 ? 'ev' : (i === 1 ? 'disabled' : 'standard'),
      });
    }
    this.onPlotsChanged(this.plots);
  }

  clearPlots() {
    this.plots = [];
    this.selectedPlotId = null;
    this.onPlotSelected(null);
    this.onPlotsChanged(this.plots);
  }

  // --- Coordinate conversions ---
  toPx(percentCoord) {
    return {
      x: (percentCoord.x / 100) * this.width,
      y: (percentCoord.y / 100) * this.height,
      w: (percentCoord.width / 100) * this.width,
      h: (percentCoord.height / 100) * this.height,
    };
  }

  toPercent(pxCoord) {
    return {
      x: Math.round(((pxCoord.x / this.width) * 100) * 10) / 10,
      y: Math.round(((pxCoord.y / this.height) * 100) * 10) / 10,
      width: Math.round(((pxCoord.w / this.width) * 100) * 10) / 10,
      height: Math.round(((pxCoord.h / this.height) * 100) * 10) / 10,
    };
  }

  // --- Event Handlers ---
  setupEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
  }

  getCanvasPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  findPlotAt(x, y) {
    // Reverse search so topmost plot is selected
    for (let i = this.plots.length - 1; i >= 0; i--) {
      const p = this.plots[i];
      const box = this.toPx(p);
      if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
        return p;
      }
    }
    return null;
  }

  handleMouseDown(e) {
    const pt = this.getCanvasPoint(e);
    
    if (this.mode === 'draw') {
      this.isDrawing = true;
      this.dragStart = pt;
      this.newPlotBox = { x: pt.x, y: pt.y, w: 0, h: 0 };
      return;
    }

    const clickedPlot = this.findPlotAt(pt.x, pt.y);
    if (clickedPlot) {
      this.selectedPlotId = clickedPlot.id;
      this.onPlotSelected(clickedPlot);
      this.isDragging = true;
      this.dragStart = pt;
      const box = this.toPx(clickedPlot);
      this.dragOffset = { x: pt.x - box.x, y: pt.y - box.y };
    } else {
      this.selectedPlotId = null;
      this.onPlotSelected(null);
    }
  }

  handleMouseMove(e) {
    const pt = this.getCanvasPoint(e);

    if (this.isDrawing && this.newPlotBox) {
      this.newPlotBox.w = pt.x - this.dragStart.x;
      this.newPlotBox.h = pt.y - this.dragStart.y;
      return;
    }

    if (this.isDragging && this.selectedPlotId) {
      const plot = this.getSelectedPlot();
      if (!plot) return;

      const box = this.toPx(plot);
      let newX = pt.x - this.dragOffset.x;
      let newY = pt.y - this.dragOffset.y;

      // Bound to canvas
      newX = Math.max(0, Math.min(this.width - box.w, newX));
      newY = Math.max(0, Math.min(this.height - box.h, newY));

      const updated = this.toPercent({ x: newX, y: newY, w: box.w, h: box.h });
      plot.x = updated.x;
      plot.y = updated.y;
      this.onPlotSelected(plot);
      this.onPlotsChanged(this.plots);
    }
  }

  handleMouseUp() {
    if (this.isDrawing && this.newPlotBox) {
      let x = Math.min(this.dragStart.x, this.dragStart.x + this.newPlotBox.w);
      let y = Math.min(this.dragStart.y, this.dragStart.y + this.newPlotBox.h);
      let w = Math.abs(this.newPlotBox.w);
      let h = Math.abs(this.newPlotBox.h);

      // Only create if minimum size
      if (w > 20 && h > 20) {
        const percent = this.toPercent({ x, y, w, h });
        this.addPlot(percent);
      }
      this.isDrawing = false;
      this.newPlotBox = null;
      this.setMode('select');
    }

    this.isDragging = false;
  }

  handleDoubleClick(e) {
    const pt = this.getCanvasPoint(e);
    const clickedPlot = this.findPlotAt(pt.x, pt.y);
    if (clickedPlot) {
      // Toggle between available and occupied
      clickedPlot.status = clickedPlot.status === 'occupied' ? 'available' : 'occupied';
      this.onPlotSelected(clickedPlot);
      this.onPlotsChanged(this.plots);
    }
  }

  // --- Rendering Loop ---
  startRenderLoop() {
    const render = () => {
      this.draw();
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Simulated Parking Lot Camera Feed
    this.drawCCTVBackground(ctx);

    // 2. Draw defined parking plots
    for (const plot of this.plots) {
      this.drawPlot(ctx, plot, plot.id === this.selectedPlotId);
    }

    // 3. Draw in-progress drawing box
    if (this.isDrawing && this.newPlotBox) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(this.newPlotBox.x, this.newPlotBox.y, this.newPlotBox.w, this.newPlotBox.h);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fillRect(this.newPlotBox.x, this.newPlotBox.y, this.newPlotBox.w, this.newPlotBox.h);
      ctx.restore();
    }

    // 4. Draw CCTV OSD (On-Screen Display)
    this.drawOSD(ctx);
  }

  drawCCTVBackground(ctx) {
    // Asphalt base
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle perspective road texture & lanes
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 1;
    for (let y = 50; y < this.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // White parking divider markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    for (let x = 80; x < this.width; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x, 100);
      ctx.lineTo(x, 380);
      ctx.stroke();
    }

    // Central driving aisle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(0, 210, this.width, 60);

    // Subtle camera lens vignette
    const grad = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.width / 4,
      this.width / 2, this.height / 2, this.width / 1.5
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  drawPlot(ctx, plot, isSelected) {
    const box = this.toPx(plot);
    const isOccupied = plot.status === 'occupied';

    ctx.save();

    // Box fill
    if (isOccupied) {
      ctx.fillStyle = isSelected ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.25)';
      ctx.strokeStyle = isSelected ? '#ffffff' : '#ef4444';
    } else {
      ctx.fillStyle = isSelected ? 'rgba(34, 197, 94, 0.45)' : 'rgba(34, 197, 94, 0.25)';
      ctx.strokeStyle = isSelected ? '#ffffff' : '#22c55e';
    }

    ctx.lineWidth = isSelected ? 3 : 1.5;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    // Corner accent handles if selected
    if (isSelected) {
      ctx.fillStyle = '#38bdf8';
      const handleSize = 6;
      ctx.fillRect(box.x - handleSize/2, box.y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(box.x + box.w - handleSize/2, box.y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(box.x + box.w - handleSize/2, box.y + box.h - handleSize/2, handleSize, handleSize);
      ctx.fillRect(box.x - handleSize/2, box.y + box.h - handleSize/2, handleSize, handleSize);
    }

    // Vehicle silhouette if occupied
    if (isOccupied) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      const carMarginX = box.w * 0.2;
      const carMarginY = box.h * 0.15;
      ctx.fillRect(box.x + carMarginX, box.y + carMarginY, box.w - (carMarginX * 2), box.h - (carMarginY * 2));
    }

    // Label tag
    const badgeText = `${plot.id}${plot.type === 'ev' ? ' ⚡' : (plot.type === 'disabled' ? ' ♿' : '')}`;
    ctx.font = '10px monospace';
    const textMetrics = ctx.measureText(badgeText);
    const tagW = textMetrics.width + 8;
    const tagH = 14;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(box.x, box.y, tagW, tagH);

    ctx.fillStyle = isOccupied ? '#f87171' : '#4ade80';
    ctx.fillText(badgeText, box.x + 4, box.y + 10);

    ctx.restore();
  }

  drawOSD(ctx) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ro-RO');
    const dateStr = now.toISOString().split('T')[0];

    ctx.save();
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(`CAM-01 • ${this.lotName.toUpperCase()} • ${dateStr} ${timeStr}`, 14, 24);
    ctx.restore();
  }
}
