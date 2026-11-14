import { fetchLots, fetchLotById, saveLotPlots, sendDetection } from './api.js';
import { CameraCanvas } from './components/CameraCanvas.js';

let lots = [];
let currentLot = null;
let cameraCanvas = null;

// DOM Elements
const lotListEl = document.getElementById('lotList');
const canvasEl = document.getElementById('cameraCanvas');
const drawModeBtn = document.getElementById('drawModeBtn');
const selectModeBtn = document.getElementById('selectModeBtn');
const addGridBtn = document.getElementById('addGridBtn');
const savePlotsBtn = document.getElementById('savePlotsBtn');
const toastEl = document.getElementById('toast');

// Inspector Elements
const inspectorTitleEl = document.getElementById('inspectorTitle');
const plotIdInput = document.getElementById('plotIdInput');
const plotTypeSelect = document.getElementById('plotTypeSelect');
const plotStatusSelect = document.getElementById('plotStatusSelect');
const plotXInput = document.getElementById('plotXInput');
const plotYInput = document.getElementById('plotYInput');
const plotWInput = document.getElementById('plotWInput');
const plotHInput = document.getElementById('plotHInput');
const deletePlotBtn = document.getElementById('deletePlotBtn');
const toggleOccupancyBtn = document.getElementById('toggleOccupancyBtn');

// Stats Elements
const totalSpotsEl = document.getElementById('totalSpots');
const freeSpotsEl = document.getElementById('freeSpots');
const occSpotsEl = document.getElementById('occSpots');
const statusBadgeEl = document.getElementById('statusBadge');
const cameraUrlInput = document.getElementById('cameraUrlInput');

export async function initApp() {
  console.log('[Parkie Web] Initializing Admin Dashboard...');

  // Initialize Canvas
  cameraCanvas = new CameraCanvas(canvasEl, {
    onPlotSelected: (plot) => updateInspector(plot),
    onPlotsChanged: (plots) => updateStats(plots),
  });

  // Setup Toolbar Events
  drawModeBtn.addEventListener('click', () => {
    cameraCanvas.setMode('draw');
    drawModeBtn.classList.add('btn-active');
    selectModeBtn.classList.remove('btn-active');
  });

  selectModeBtn.addEventListener('click', () => {
    cameraCanvas.setMode('select');
    selectModeBtn.classList.add('btn-active');
    drawModeBtn.classList.remove('btn-active');
  });

  addGridBtn.addEventListener('click', () => {
    cameraCanvas.addGridSlots(5);
  });

  savePlotsBtn.addEventListener('click', async () => {
    await handleSavePlots();
  });

  // Setup Inspector Events
  plotIdInput.addEventListener('input', (e) => {
    cameraCanvas.updateSelectedPlot({ id: e.target.value });
  });

  plotTypeSelect.addEventListener('change', (e) => {
    cameraCanvas.updateSelectedPlot({ type: e.target.value });
  });

  plotStatusSelect.addEventListener('change', (e) => {
    cameraCanvas.updateSelectedPlot({ status: e.target.value });
  });

  [plotXInput, plotYInput, plotWInput, plotHInput].forEach(inp => {
    inp.addEventListener('input', () => {
      cameraCanvas.updateSelectedPlot({
        x: parseFloat(plotXInput.value) || 0,
        y: parseFloat(plotYInput.value) || 0,
        width: parseFloat(plotWInput.value) || 10,
        height: parseFloat(plotHInput.value) || 10,
      });
    });
  });

  deletePlotBtn.addEventListener('click', () => {
    cameraCanvas.deleteSelectedPlot();
  });

  toggleOccupancyBtn.addEventListener('click', () => {
    const plot = cameraCanvas.getSelectedPlot();
    if (plot) {
      const nextStatus = plot.status === 'occupied' ? 'available' : 'occupied';
      cameraCanvas.updateSelectedPlot({ status: nextStatus });
      plotStatusSelect.value = nextStatus;
    }
  });

  cameraUrlInput.addEventListener('change', (e) => {
    if (currentLot) {
      currentLot.camera_url = e.target.value;
    }
  });

  // Load Initial Lots
  await loadLots();
}

async function loadLots() {
  lots = await fetchLots();
  renderLotList();

  if (lots.length > 0) {
    selectLot(lots[0]);
  }
}

function renderLotList() {
  lotListEl.innerHTML = '';
  lots.forEach(lot => {
    const card = document.createElement('div');
    card.className = `lot-card ${currentLot?.id === lot.id ? 'active' : ''}`;
    card.onclick = () => selectLot(lot);

    const available = lot.available_spots;
    const capacity = lot.capacity;
    const statusColor = lot.status_color || 'green';

    card.innerHTML = `
      <div class="lot-card-header">
        <div class="lot-name">${lot.name}</div>
        <span class="status-pill status-${statusColor}">${statusColor}</span>
      </div>
      <div class="lot-stats">
        <div class="stat-item">Liber: <strong>${available}/${capacity}</strong></div>
        <div class="stat-item">Plots: <strong>${lot.slots_data?.length || 0}</strong></div>
      </div>
    `;
    lotListEl.appendChild(card);
  });
}

function selectLot(lot) {
  currentLot = lot;
  renderLotList();

  cameraUrlInput.value = lot.camera_url || '';
  cameraCanvas.setLot(lot);

  // If lot has 0 plots, initialize with a standard sample grid for quick onboarding
  if (!lot.slots_data || lot.slots_data.length === 0) {
    cameraCanvas.addGridSlots(6);
  }

  showToast(`Parcarea "${lot.name}" a fost selectată.`);
}

function updateInspector(plot) {
  if (!plot) {
    inspectorTitleEl.textContent = 'Niciun Plot Selectat';
    plotIdInput.value = '';
    plotIdInput.disabled = true;
    plotTypeSelect.disabled = true;
    plotStatusSelect.disabled = true;
    plotXInput.disabled = true;
    plotYInput.disabled = true;
    plotWInput.disabled = true;
    plotHInput.disabled = true;
    deletePlotBtn.disabled = true;
    toggleOccupancyBtn.disabled = true;
    return;
  }

  inspectorTitleEl.textContent = `Editare: ${plot.id}`;
  plotIdInput.disabled = false;
  plotTypeSelect.disabled = false;
  plotStatusSelect.disabled = false;
  plotXInput.disabled = false;
  plotYInput.disabled = false;
  plotWInput.disabled = false;
  plotHInput.disabled = false;
  deletePlotBtn.disabled = false;
  toggleOccupancyBtn.disabled = false;

  plotIdInput.value = plot.id;
  plotTypeSelect.value = plot.type || 'standard';
  plotStatusSelect.value = plot.status || 'available';
  plotXInput.value = plot.x;
  plotYInput.value = plot.y;
  plotWInput.value = plot.width;
  plotHInput.value = plot.height;
}

function updateStats(plots) {
  const total = plots.length;
  const occ = plots.filter(p => p.status === 'occupied').length;
  const free = Math.max(0, total - occ);

  totalSpotsEl.textContent = total;
  freeSpotsEl.textContent = free;
  occSpotsEl.textContent = occ;

  let color = 'green';
  if (total === 0 || free === 0) color = 'red';
  else if (free / total <= 0.25) color = 'yellow';

  statusBadgeEl.className = `status-pill status-${color}`;
  statusBadgeEl.textContent = color.toUpperCase();
}

async function handleSavePlots() {
  if (!currentLot) return;

  savePlotsBtn.disabled = true;
  savePlotsBtn.textContent = 'Salvare în curs...';

  try {
    const plots = cameraCanvas.getPlots();
    const cameraUrl = cameraUrlInput.value.trim() || null;

    const updated = await saveLotPlots(currentLot.id, {
      slots_data: plots,
      camera_url: cameraUrl,
      capacity: Math.max(plots.length, currentLot.capacity),
    });

    // Update in local lot store
    Object.assign(currentLot, updated);
    renderLotList();
    showToast(`✅ ${plots.length} plots salvate în baza de date!`);
  } catch (err) {
    showToast(`❌ Eroare la salvare: ${err.message}`);
  } finally {
    savePlotsBtn.disabled = false;
    savePlotsBtn.textContent = '💾 Salvează & Calibrează';
  }
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

// Auto-run on load
window.addEventListener('DOMContentLoaded', () => {
  initApp();
});
