import { parkieService } from '../parkie/service.ts';
import { utilitiesService } from '../m04-utilities/service.ts';
import { transitService } from '../m05-transit/service.ts';
import { smellService } from '../m06-smell/service.ts';
import { safetyService } from '../m03-safety/service.ts';
import { TIMISOARA_AREAS } from '../../core/areas.ts';
import { db } from '../../core/db.ts';

/** Fallback values when Tiger Cloud is not connected; always sent with source: 'simulated'. */
const SIMULATED_ENV = { air_quality_pm25: 22.4, noise_db: 58.2 };

interface EnvMetric {
  value: number;
  source: 'tiger' | 'simulated';
  /** Newest hourly bucket the value is built from (ISO), null when simulated. */
  latest_bucket: string | null;
  areas: number;
}

/**
 * Average of the last 24 hourly buckets per metric, read from P2's `city_metrics_hourly_stats`
 * continuous aggregate. The window ends at the newest bucket, so seeded data that stopped a while ago still shows.
 */
async function environmentFromTiger(): Promise<Record<keyof typeof SIMULATED_ENV, EnvMetric>> {
  const simulated = (type: keyof typeof SIMULATED_ENV): EnvMetric => ({ value: SIMULATED_ENV[type], source: 'simulated', latest_bucket: null, areas: 0 });
  const out = { air_quality_pm25: simulated('air_quality_pm25'), noise_db: simulated('noise_db') };
  if (!db.isTigerConnected()) return out;
  const rows = await db.query<{ metric_type: keyof typeof SIMULATED_ENV; avg_24h: string; latest: Date | string; areas: string }>(
    `SELECT c.metric_type,
            ROUND(AVG(c.avg_value)::numeric, 1) AS avg_24h,
            MAX(c.bucket) AS latest,
            COUNT(DISTINCT c.area_id) AS areas
     FROM city_metrics_hourly_stats c
     WHERE c.metric_type IN ('air_quality_pm25', 'noise_db')
       AND c.bucket > (SELECT MAX(bucket) FROM city_metrics_hourly_stats WHERE metric_type = c.metric_type) - INTERVAL '24 hours'
     GROUP BY c.metric_type;`,
  );
  for (const r of rows) {
    if (!(r.metric_type in out)) continue;
    out[r.metric_type] = {
      value: Number(r.avg_24h),
      source: 'tiger',
      latest_bucket: typeof r.latest === 'string' ? r.latest : r.latest.toISOString(),
      areas: Number(r.areas),
    };
  }
  return out;
}

/** Live numbers from Tiger Cloud's own catalogue (hypertables, continuous aggregates, compression). */
async function tigerSummary() {
  const t = await db.getTigerStatus();
  const before = t.compression.reduce((s, c) => s + c.before_compression_bytes, 0);
  const after = t.compression.reduce((s, c) => s + c.after_compression_bytes, 0);
  const ratio = before > 0 ? Math.round((1 - after / before) * 1000) / 10 : null;
  return {
    // kept for older clients
    continuous_aggregates_active: t.continuous_aggregates.length,
    compression_ratio: ratio === null ? '—' : `${ratio}%`,
    real_time_aggregates_enabled: true,
    // new: where the numbers come from
    status: t.status,
    simulated: t.status !== 'connected',
    timescale_version: t.version,
    hypertables: t.hypertables.length,
    hypertable_names: t.hypertables.map((h) => (h.schema && h.schema !== 'public' ? `${h.schema}.${h.table_name}` : h.table_name)),
    compressed_bytes_saved: Math.max(0, before - after),
  };
}

/** Residents' smell (m06) and safety (m03) reports in the last 7 days; real ones are stored in Tiger Cloud hypertables. */
async function communityReports() {
  const week = { hours: 24 * 7, includeDemo: true };
  const [smell, safety] = await Promise.all([smellService.window(week), safetyService.window(week)]);
  const part = (w: { reports: unknown[]; demoCount: number }, status: { active: string }) => ({
    last_7_days: w.reports.length,
    real: w.reports.length - w.demoCount,
    demo: w.demoCount,
    storage: status.active,
  });
  return {
    smell: part(smell, smellService.status()),
    safety: part(safety, safetyService.status()),
  };
}

export const dashboardService = {
  async getCityOverview() {
    const lots = parkieService.getAllLots();
    const totalCapacity = lots.reduce((acc, l) => acc + l.capacity, 0);
    const totalAvailable = lots.reduce((acc, l) => acc + l.available_spots, 0);
    const avgOccupancyRate = totalCapacity > 0 ? (totalCapacity - totalAvailable) / totalCapacity : 0;

    // Most congested lots (highest occupancy ratio)
    const congestedLots = [...lots]
      .sort((a, b) => a.available_spots / a.capacity - b.available_spots / b.capacity)
      .slice(0, 3)
      .map((l) => ({
        id: l.id,
        name: l.name,
        available_spots: l.available_spots,
        capacity: l.capacity,
        status_color: l.status_color,
        occupancy_pct: Math.round(((l.capacity - l.available_spots) / l.capacity) * 100)
      }));

    // Environmental metrics, Tiger status and community reports, all read live (or labelled simulated)
    const [env, tiger, community] = await Promise.all([environmentFromTiger(), tigerSummary(), communityReports()]);
    const pm25 = env.air_quality_pm25.value;

    // Utilities & Transit disruptions
    const outages = utilitiesService.getAllOutages();
    const detours = transitService.getAllDetours();

    return {
      generated_at: new Date().toISOString(),
      city: 'Timișoara',
      kpis: {
        parking: {
          total_lots: lots.length,
          total_capacity: totalCapacity,
          total_available_spots: totalAvailable,
          occupancy_rate_pct: Math.round(avgOccupancyRate * 100),
          most_congested_lots: congestedLots
        },
        environment: {
          air_quality_avg_pm25: pm25,
          air_quality_status: pm25 <= 25 ? 'good' : 'moderate',
          avg_noise_db: env.noise_db.value,
          monitored_neighbourhoods: TIMISOARA_AREAS.length,
          source: env.air_quality_pm25.source === 'tiger' && env.noise_db.source === 'tiger' ? 'tiger' : 'simulated',
          latest_bucket: env.air_quality_pm25.latest_bucket,
          sensor_areas: env.air_quality_pm25.areas
        },
        infrastructure_alerts: {
          active_utility_outages: outages.length,
          active_transit_detours: detours.length,
          tram_line_5_status: detours.some((d) => d.line_number === '5') ? 'suspended_replacement_active' : 'normal'
        },
        timescale_tiger_cloud: tiger,
        community_reports: community
      }
    };
  },

  getHeatmapData() {
    const lots = parkieService.getAllLots();
    const parkingHeatpoints = lots.map((lot) => {
      const occupied = lot.capacity - lot.available_spots;
      const intensity = lot.capacity > 0 ? occupied / lot.capacity : 0;
      return {
        type: 'parking',
        id: lot.id,
        name: lot.name,
        latitude: lot.latitude,
        longitude: lot.longitude,
        intensity: parseFloat(intensity.toFixed(2)),
        status_color: lot.status_color
      };
    });

    const areaCoordinates: Record<string, { lat: number; lng: number; name: string }> = {
      'area-cetate': { lat: 45.7573, lng: 21.229, name: 'Cetate' },
      'area-circumvalatiunii': { lat: 45.7645, lng: 21.218, name: 'Circumvalațiunii' },
      'area-complex': { lat: 45.7485, lng: 21.2395, name: 'Complex Studențesc' },
      'area-sagului': { lat: 45.733, lng: 21.205, name: 'Calea Șagului' },
      'area-aradului': { lat: 45.776, lng: 21.226, name: 'Calea Aradului' },
      'area-iosefin': { lat: 45.744, lng: 21.208, name: 'Iosefin' }
    };

    const environmentalHeatpoints = Object.entries(areaCoordinates).map(([areaId, coords]) => ({
      type: 'environmental',
      id: areaId,
      name: coords.name,
      latitude: coords.lat,
      longitude: coords.lng,
      pm25_intensity: 0.42,
      noise_intensity: areaId === 'area-complex' ? 0.85 : 0.5,
      // fixed illustration values, not read from Tiger Cloud
      source: 'simulated' as const
    }));

    return {
      parking_heatpoints: parkingHeatpoints,
      environmental_heatpoints: environmentalHeatpoints
    };
  }
};
