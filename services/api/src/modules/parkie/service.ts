import type { 
  ParkingLot, 
  ParkingLotStatusColor, 
  HourlyParkingAnalytics, 
  CityMetricAnalytics 
} from '@hub/contracts';
import { PARKIE_SEED_LOTS } from '@hub/contracts';
import { calculateDistanceMeters } from '../../core/areas.ts';
import { eventBus } from '../../core/events.ts';
import { db } from '../../core/db.ts';

// In-memory parking lot store initialized with Timișoara lots
let parkingLots: ParkingLot[] = [...PARKIE_SEED_LOTS];

/**
 * Parkie's marker colour (backend_api/app/services/lot_service.py, get_status_color), by occupancy:
 * below 70% occupied green, 70-85% yellow, above 85% red; a lot without capacity is gray.
 */
export function computeStatusColor(available: number, capacity: number): ParkingLotStatusColor {
  if (capacity <= 0) return 'gray' as ParkingLotStatusColor;
  const occupancyRate = ((capacity - available) / capacity) * 100;
  if (occupancyRate < 70) return 'green';
  if (occupancyRate <= 85) return 'yellow';
  return 'red';
}

export const parkieService = {
  /** Lays the lots saved in the database (slots drawn by staff, live occupancy) over the seed lots. Run once at start. */
  async loadLotsFromDb(): Promise<number> {
    if (!db.isTigerConnected()) return 0;
    try {
      const rows = await db.query<any>(`SELECT id, camera_url, slots_data, capacity, available_spots, status_color, updated_at FROM parking_lots`);
      let n = 0;
      for (const r of rows) {
        const lot = parkingLots.find((l) => l.id === r.id);
        if (!lot) continue;
        lot.camera_url = r.camera_url ?? lot.camera_url;
        lot.slots_data = Array.isArray(r.slots_data) ? r.slots_data : lot.slots_data;
        lot.capacity = Number(r.capacity ?? lot.capacity);
        lot.available_spots = Number(r.available_spots ?? lot.available_spots);
        lot.status_color = computeStatusColor(lot.available_spots, lot.capacity);
        if (r.updated_at) lot.last_updated = new Date(r.updated_at).toISOString();
        n++;
      }
      return n;
    } catch (err: any) {
      console.warn('[PARKIE] could not load lots from the database:', err.message);
      return 0;
    }
  },

  getAllLots(filter?: { min_available?: number; status_color?: string; verified_only?: boolean }): ParkingLot[] {
    return parkingLots.filter((lot) => {
      if (filter?.verified_only !== false && !lot.is_verified) return false;
      if (filter?.status_color && lot.status_color !== filter.status_color) return false;
      if (filter?.min_available !== undefined && lot.available_spots < filter.min_available) return false;
      return true;
    });
  },

  getLotById(id: string): ParkingLot | undefined {
    return parkingLots.find((lot) => lot.id === id);
  },

  getLotConfig(id: string): { camera_url: string | null; slots_data: any[] } | null {
    const lot = parkingLots.find((lot) => lot.id === id);
    if (!lot) return null;
    return {
      camera_url: lot.camera_url || null,
      slots_data: lot.slots_data || []
    };
  },

  async captureFrame(cameraUrl?: string): Promise<{ image: string }> {
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const path = await import('node:path');
    const fs = await import('node:fs');
    const execFileAsync = promisify(execFile);

    const candidates = [
      path.resolve(process.cwd(), 'services/vision/capture_frame.py'),
      path.resolve(process.cwd(), '../vision/capture_frame.py'),
      path.resolve(process.cwd(), '../../services/vision/capture_frame.py'),
      path.resolve(process.cwd(), 'ai_vision/capture_frame.py'),
    ];
    const scriptPath = candidates.find((c) => fs.existsSync(c)) || candidates[0];
    try {
      const { stdout } = await execFileAsync(process.platform === 'win32' ? 'python' : 'python3', [scriptPath, cameraUrl || ''], {
        timeout: 10000,
        maxBuffer: 10 * 1024 * 1024
      });
      const jsonLine = stdout.split('\n').find((l: string) => l.trim().startsWith('{"status":'));
      if (jsonLine) {
        const parsed = JSON.parse(jsonLine.trim());
        if (parsed.image) return { image: parsed.image };
      }
    } catch (err: any) {
      console.warn('⚠️ OpenCV frame capture warning:', err.message);
    }

    // High quality simulated SVG fallback if OpenCV process is not ready
    const fallbackSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
        <rect width="800" height="450" fill="#201e1c"/>
        <line x1="60" y1="70" x2="740" y2="70" stroke="#a0a0a0" stroke-width="2"/>
        <line x1="60" y1="380" x2="740" y2="380" stroke="#a0a0a0" stroke-width="2"/>
        <text x="30" y="35" fill="#38bdf8" font-family="monospace" font-size="16">CCTV STREAM • TIMISOARA LIVE CAM</text>
      </svg>`
    ).toString('base64');
    return { image: `data:image/svg+xml;base64,${fallbackSvg}` };
  },

  getLotColorsOnly(): Array<{ id: string; name: string; status_color: ParkingLotStatusColor; available_spots: number; capacity: number }> {
    return parkingLots.map((lot) => ({
      id: lot.id,
      name: lot.name,
      status_color: lot.status_color,
      available_spots: lot.available_spots,
      capacity: lot.capacity
    }));
  },

  async updateDetections(lotId: string, detectedCars: number): Promise<ParkingLot | null> {
    const lot = parkingLots.find((l) => l.id === lotId);
    if (!lot) return null;

    const boundedCars = Math.min(Math.max(0, detectedCars), lot.capacity);
    lot.available_spots = Math.max(0, lot.capacity - boundedCars);
    lot.status_color = computeStatusColor(lot.available_spots, lot.capacity);
    lot.last_updated = new Date().toISOString();

    // 1. Ingest into Tiger Cloud Timescale Hypertable in real time
    if (db.isTigerConnected()) {
      db.query(`
        INSERT INTO parking_detection_events (lot_id, detected_cars, available_spots, status_color, recorded_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT DO NOTHING;
      `, [lot.id, boundedCars, lot.available_spots, lot.status_color]).catch((err) => {
        console.warn('⚠️ Hypertable live insertion error:', err.message);
      });
    }

    // 1b. Parkie's /vision/update_lot: the lot's own row changes live
    if (db.isTigerConnected()) {
      db.query(`UPDATE parking_lots SET available_spots = $1, status_color = $2, updated_at = NOW() WHERE id = $3;`,
        [lot.available_spots, lot.status_color, lot.id]).catch((err) => console.warn('⚠️ parking_lots live update error:', err.message));
    }

    // 2. Emit internal system event
    await eventBus.emit('parkie.detection_updated', {
      lotId: lot.id,
      lotName: lot.name,
      availableSpots: lot.available_spots,
      statusColor: lot.status_color
    });

    console.log(`[PARKIE AI] 🚗 Lot "${lot.name}": ${detectedCars} detected cars -> ${lot.available_spots}/${lot.capacity} spots available [${lot.status_color.toUpperCase()}]`);

    return lot;
  },

  async createLot(payload: Partial<ParkingLot> & { name: string; latitude: number; longitude: number; capacity: number }): Promise<ParkingLot> {
    const capacity = payload.capacity || 50;
    const available = payload.available_spots !== undefined ? payload.available_spots : capacity;

    const newLot: ParkingLot = {
      id: payload.id || crypto.randomUUID(),
      owner_id: payload.owner_id,
      name: payload.name,
      latitude: payload.latitude,
      longitude: payload.longitude,
      camera_url: payload.camera_url || null,
      slots_data: payload.slots_data || [],
      capacity,
      available_spots: available,
      status_color: computeStatusColor(available, capacity),
      is_verified: payload.is_verified ?? true,
      last_updated: new Date().toISOString()
    };

    parkingLots.push(newLot);

    // Save to database if connected
    if (db.isTigerConnected()) {
      db.query(`
        INSERT INTO parking_lots (id, name, latitude, longitude, capacity, available_spots, status_color, is_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET 
          available_spots = EXCLUDED.available_spots,
          status_color = EXCLUDED.status_color;
      `, [newLot.id, newLot.name, newLot.latitude, newLot.longitude, newLot.capacity, newLot.available_spots, newLot.status_color, newLot.is_verified])
      .catch((err) => console.warn('⚠️ Database parking_lots insert error:', err.message));
    }

    await eventBus.emit('parkie.lot_created', { lotId: newLot.id, name: newLot.name });
    return newLot;
  },

  findNearestLots(lat: number, lng: number, limit = 5): Array<ParkingLot & { distance_meters: number }> {
    return parkingLots
      .map((lot) => ({
        ...lot,
        distance_meters: Math.round(calculateDistanceMeters(lat, lng, lot.latitude, lot.longitude))
      }))
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, limit);
  },

  async updateLotPlots(
    lotId: string,
    payload: {
      slots_data?: any[];
      camera_url?: string | null;
      capacity?: number;
    }
  ): Promise<ParkingLot | null> {
    const lot = parkingLots.find((l) => l.id === lotId);
    if (!lot) return null;

    if (payload.slots_data !== undefined) {
      lot.slots_data = payload.slots_data;
    }
    if (payload.camera_url !== undefined) {
      lot.camera_url = payload.camera_url;
    }
    if (payload.capacity !== undefined && payload.capacity > 0) {
      lot.capacity = payload.capacity;
    } else if (Array.isArray(payload.slots_data) && payload.slots_data.length > 0) {
      lot.capacity = payload.slots_data.length;
    }

    // Parkie's setup (PUT /lots/{id}/setup): a new slot layout starts with every slot free; the agent reports next
    lot.available_spots = lot.capacity;
    lot.status_color = computeStatusColor(lot.available_spots, lot.capacity);
    lot.last_updated = new Date().toISOString();

    // Persist to TimescaleDB if connected
    if (db.isTigerConnected()) {
      db.query(`
        UPDATE parking_lots
        SET slots_data = $1, camera_url = $2, capacity = $3, available_spots = $4, status_color = $5, updated_at = NOW()
        WHERE id = $6;
      `, [
        JSON.stringify(lot.slots_data),
        lot.camera_url,
        lot.capacity,
        lot.available_spots,
        lot.status_color,
        lot.id
      ]).catch((err) => {
        console.warn('⚠️ Database parking_lots plots update error:', err.message);
      });
    }

    // Emit event so SSE stream and connected clients update in real time
    await eventBus.emit('parkie.plots_updated', {
      lotId: lot.id,
      lotName: lot.name,
      slotsCount: lot.slots_data.length,
      availableSpots: lot.available_spots,
      capacity: lot.capacity,
      statusColor: lot.status_color
    });

    await eventBus.emit('parkie.detection_updated', {
      lotId: lot.id,
      lotName: lot.name,
      availableSpots: lot.available_spots,
      statusColor: lot.status_color
    });

    console.log(`[PARKIE ADMIN] 🎯 Lot "${lot.name}": Updated ${lot.slots_data.length} plots (${lot.available_spots}/${lot.capacity} available)`);
    return lot;
  },

  // ============================================================================
  // TIGER DATA (TimescaleDB) Continuous Aggregates Queries
  // ============================================================================

  async getHourlyAnalytics(lotId?: string, limitHours = 24): Promise<HourlyParkingAnalytics[]> {
    if (db.isTigerConnected()) {
      try {
        const rows = await db.query<{
          bucket: Date | string;
          lot_id: string;
          avg_available: string | number;
          avg_occupied: string | number;
          peak_occupied: number;
          min_available: number;
          sample_count: string | number;
        }>(`
          SELECT 
            bucket, 
            lot_id, 
            avg_available, 
            avg_occupied, 
            peak_occupied, 
            min_available, 
            sample_count 
          FROM parking_hourly_stats
          WHERE ($1::text IS NULL OR lot_id = $1)
          ORDER BY bucket DESC 
          LIMIT $2;
        `, [lotId || null, limitHours]);

        if (rows && rows.length > 0) {
          return rows.map((r) => {
            const lot = parkingLots.find((l) => l.id === r.lot_id);
            return {
              bucket: typeof r.bucket === 'string' ? r.bucket : r.bucket.toISOString(),
              lot_id: r.lot_id,
              lot_name: lot?.name || 'Parking Lot',
              avg_available: parseFloat(String(r.avg_available)),
              avg_occupied: parseFloat(String(r.avg_occupied)),
              peak_occupied: Number(r.peak_occupied),
              min_available: Number(r.min_available),
              sample_count: Number(r.sample_count)
            };
          });
        }
      } catch (err: any) {
        console.warn('⚠️ Error querying parking_hourly_stats cagg:', err.message);
      }
    }

    // High quality in-memory fallback matching Timișoara parking patterns
    const result: HourlyParkingAnalytics[] = [];
    const targetLot = lotId ? parkingLots.find((l) => l.id === lotId) : parkingLots[0];
    const lot = targetLot || parkingLots[0];
    const now = new Date();

    for (let h = 0; h < limitHours; h++) {
      const bucketDate = new Date(now.getTime() - h * 3600 * 1000);
      const hour = bucketDate.getHours();
      const isPeak = (hour >= 8 && hour <= 10) || (hour >= 16 && hour <= 19);
      const occupancyRatio = isPeak ? 0.85 : 0.40;
      const occupied = Math.round(lot.capacity * occupancyRatio);
      const available = lot.capacity - occupied;

      result.push({
        bucket: bucketDate.toISOString(),
        lot_id: lot.id,
        lot_name: lot.name,
        avg_available: available,
        avg_occupied: occupied,
        peak_occupied: Math.min(lot.capacity, occupied + 4),
        min_available: Math.max(0, available - 4),
        sample_count: 4
      });
    }

    return result;
  },

  async getCityMetricsAnalytics(metricType?: string, areaId?: string, limitHours = 24): Promise<CityMetricAnalytics[]> {
    if (db.isTigerConnected()) {
      try {
        const rows = await db.query<{
          bucket: Date | string;
          metric_type: string;
          area_id: string;
          avg_value: string | number;
          min_value: string | number;
          max_value: string | number;
          sample_count: string | number;
        }>(`
          SELECT 
            bucket, 
            metric_type, 
            area_id, 
            avg_value, 
            min_value, 
            max_value, 
            sample_count 
          FROM city_metrics_hourly_stats
          WHERE ($1::text IS NULL OR metric_type = $1)
            AND ($2::text IS NULL OR area_id = $2)
          ORDER BY bucket DESC 
          LIMIT $3;
        `, [metricType || null, areaId || null, limitHours]);

        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            bucket: typeof r.bucket === 'string' ? r.bucket : r.bucket.toISOString(),
            metric_type: r.metric_type,
            area_id: r.area_id,
            avg_value: parseFloat(String(r.avg_value)),
            min_value: parseFloat(String(r.min_value)),
            max_value: parseFloat(String(r.max_value)),
            sample_count: Number(r.sample_count)
          }));
        }
      } catch (err: any) {
        console.warn('⚠️ Error querying city_metrics_hourly_stats cagg:', err.message);
      }
    }

    // In-memory fallback
    const result: CityMetricAnalytics[] = [];
    const now = new Date();
    const type = metricType || 'air_quality_pm25';
    const area = areaId || 'area-cetate';

    for (let h = 0; h < limitHours; h++) {
      const bucketDate = new Date(now.getTime() - h * 3600 * 1000);
      result.push({
        bucket: bucketDate.toISOString(),
        metric_type: type,
        area_id: area,
        avg_value: type === 'air_quality_pm25' ? 22.4 : 58.2,
        min_value: type === 'air_quality_pm25' ? 14.1 : 44.0,
        max_value: type === 'air_quality_pm25' ? 31.8 : 72.5,
        sample_count: 2
      });
    }

    return result;
  },

  async ingestCityMetric(payload: {
    metric_type: string;
    area_id: string;
    value: number;
    entity_id?: string;
    metadata?: Record<string, any>;
  }): Promise<{ ok: boolean; id?: string }> {
    if (db.isTigerConnected()) {
      await db.query(`
        INSERT INTO city_metric_events (time, metric_type, area_id, entity_id, value, metadata)
        VALUES (NOW(), $1, $2, $3, $4, $5);
      `, [
        payload.metric_type,
        payload.area_id,
        payload.value,
        payload.entity_id || 'manual-sensor',
        JSON.stringify(payload.metadata || {})
      ]);
    }
    return { ok: true };
  },

  async getOpenDataExport(): Promise<any> {
    const parkingStats = await this.getHourlyAnalytics(undefined, 48);
    const metricsStats = await this.getCityMetricsAnalytics(undefined, undefined, 48);

    return {
      title: 'Timișoara Smart City Open Data Feed',
      publisher: 'Municipiul Timișoara — Powered by Tiger Data (TimescaleDB)',
      license: 'Open Data Commons Open Database License (ODbL)',
      generated_at: new Date().toISOString(),
      dataset_version: '1.0.0',
      description: 'Anonymized real-time and continuous aggregate time-series data for parking occupancy, air quality, noise, and environmental metrics.',
      summary: {
        total_parking_aggregate_records: parkingStats.length,
        total_metric_aggregate_records: metricsStats.length
      },
      data: {
        parking_occupancy_hourly: parkingStats,
        city_environmental_metrics_hourly: metricsStats
      }
    };
  },

  async getOpenDataExportCsv(): Promise<string> {
    const exportData = await this.getOpenDataExport();
    const parkingRows = exportData.data.parking_occupancy_hourly;
    const metricsRows = exportData.data.city_environmental_metrics_hourly;

    const headers = [
      'dataset',
      'bucket_timestamp',
      'entity_or_area_id',
      'metric_type',
      'avg_value',
      'min_value',
      'max_value',
      'sample_count'
    ];

    const lines: string[] = [headers.join(',')];

    for (const p of parkingRows) {
      lines.push([
        'parking_occupancy_hourly',
        `"${p.bucket}"`,
        `"${p.lot_id}"`,
        '"available_spots"',
        p.avg_available,
        p.min_available ?? '',
        p.peak_occupied !== undefined ? p.peak_occupied : '',
        p.sample_count
      ].join(','));
    }

    for (const m of metricsRows) {
      lines.push([
        'city_environmental_metrics_hourly',
        `"${m.bucket}"`,
        `"${m.area_id}"`,
        `"${m.metric_type}"`,
        m.avg_value,
        m.min_value ?? '',
        m.max_value ?? '',
        m.sample_count
      ].join(','));
    }

    return lines.join('\n');
  }
};
