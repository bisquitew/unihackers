import { fetchLots, fetchOutages, fetchTransitLines, fetchEvents, fetchSmellPins } from '../api.js';

export async function renderMapView() {
  const [lots, outages, transit, events, smell] = await Promise.all([
    fetchLots(),
    fetchOutages(),
    fetchTransitLines(),
    fetchEvents(),
    fetchSmellPins(),
  ]);

  return `
    <div class="view-content map-view-container">
      
      <!-- Layer Filter Bar -->
      <div class="map-controls-bar">
        <div class="layer-filters">
          <label class="filter-chip active" data-layer="parking">
            <input type="checkbox" checked data-layer-input="parking"> 🅿️ Parcări Parkie (${lots.length})
          </label>
          <label class="filter-chip active" data-layer="outages">
            <input type="checkbox" checked data-layer-input="outages"> 🚰 Avarii Utilități (${outages.length})
          </label>
          <label class="filter-chip active" data-layer="transit">
            <input type="checkbox" checked data-layer-input="transit"> 🚊 Linii STPT (${transit.length})
          </label>
          <label class="filter-chip active" data-layer="events">
            <input type="checkbox" checked data-layer-input="events"> 🎭 Evenimente (${events.length})
          </label>
          <label class="filter-chip active" data-layer="smell">
            <input type="checkbox" checked data-layer-input="smell"> 💨 Rapoarte Miros (${smell.pins?.length || 0})
          </label>
        </div>
        <div class="map-status-pill">
          <span>Timișoara Live GIS • OpenStreetMap</span>
        </div>
      </div>

      <!-- Map Display Frame -->
      <div class="map-canvas-wrapper">
        <div id="cityMapEl" class="city-map-element"></div>
        <div id="mapPopupCard" class="map-popup-card" style="display: none;"></div>
      </div>

    </div>
  `;
}

export function initMapLogic(lots, outages, events, smellPins) {
  const mapEl = document.getElementById('cityMapEl');
  if (!mapEl || !window.L) return;

  // Initialize Leaflet Map
  const map = L.map('cityMapEl', {
    center: [45.7537, 21.2257],
    zoom: 13,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
  }).addTo(map);

  const layers = {
    parking: L.layerGroup().addTo(map),
    outages: L.layerGroup().addTo(map),
    events: L.layerGroup().addTo(map),
    smell: L.layerGroup().addTo(map),
  };

  // Add Parking Pins
  lots.forEach(lot => {
    const isGreen = lot.status_color === 'green';
    const isYellow = lot.status_color === 'yellow';
    const color = isGreen ? '#22c55e' : (isYellow ? '#eab308' : '#ef4444');

    const icon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="background: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: grid; place-items: center; font-weight: bold; font-size: 11px; color: #000; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">🅿️</div>`,
      iconSize: [28, 28],
    });

    const marker = L.marker([lot.latitude, lot.longitude], { icon });
    marker.bindPopup(`
      <div style="font-family: sans-serif; color: #18181b;">
        <h4 style="margin: 0 0 4px;">${lot.name}</h4>
        <p style="margin: 0 0 6px; font-size: 13px;">Disponibile: <strong>${lot.available_spots} / ${lot.capacity}</strong> locuri</p>
        <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: ${color}; color: white; font-weight: bold;">${lot.status_color.toUpperCase()}</span>
      </div>
    `);
    layers.parking.addLayer(marker);
  });

  // Add Outages Pins (approximate Timisoara neighborhood locations)
  const areaCoords = {
    'Circumvalațiunii': [45.7620, 21.2180],
    'Complex Studențesc': [45.7480, 21.2390],
    'Calea Șagului': [45.7320, 21.2050],
    'Calea Aradului': [45.7720, 21.2240],
    'Iosefin': [45.7450, 21.2090],
  };

  outages.forEach(out => {
    const area = out.affected_areas?.[0] || 'Circumvalațiunii';
    const coords = areaCoords[area] || [45.7550 + Math.random() * 0.01, 21.2200 + Math.random() * 0.01];

    const icon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="background: #ef4444; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: grid; place-items: center; font-size: 13px; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">🚰</div>`,
      iconSize: [28, 28],
    });

    const marker = L.marker(coords, { icon });
    marker.bindPopup(`
      <div style="font-family: sans-serif; color: #18181b;">
        <h4 style="margin: 0 0 4px; color: #dc2626;">[${out.provider}] ${out.title}</h4>
        <p style="margin: 0 0 4px; font-size: 12px;">${out.description}</p>
        <p style="margin: 0; font-size: 11px; color: #666;">Cartiere: ${(out.affected_areas || []).join(', ')}</p>
      </div>
    `);
    layers.outages.addLayer(marker);
  });

  // Layer Filter Toggles
  document.querySelectorAll('[data-layer-input]').forEach(input => {
    input.addEventListener('change', (e) => {
      const layerName = e.target.getAttribute('data-layer-input');
      if (layers[layerName]) {
        if (e.target.checked) {
          map.addLayer(layers[layerName]);
        } else {
          map.removeLayer(layers[layerName]);
        }
      }
    });
  });
}
