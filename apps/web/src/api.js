// API Client for Parkie Backend (services/api on port 8000)

const BASE_URL = window.location.port === '8000' 
  ? '' 
  : 'http://localhost:8000';

export async function fetchLots() {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/parkie/lots`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[Parkie API] Failed to fetch lots:', err);
    return [];
  }
}

export async function fetchLotById(id) {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/parkie/lots/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`[Parkie API] Failed to fetch lot ${id}:`, err);
    return null;
  }
}

export async function saveLotPlots(id, payload) {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/parkie/lots/${id}/plots`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`[Parkie API] Failed to save plots for ${id}:`, err);
    throw err;
  }
}

export async function sendDetection(lotId, detectedCars) {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/parkie/detections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lot_id: lotId, detected_cars: detectedCars }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`[Parkie API] Failed to send detection:`, err);
    throw err;
  }
}
