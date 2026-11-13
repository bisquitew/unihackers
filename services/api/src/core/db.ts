import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import type { TigerStatusResponse, TigerHypertableInfo, TigerContinuousAggregateInfo, TigerCompressionStats } from '@hub/contracts';

// Ensure environment variables from root .env are loaded
const rootEnvPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const dbUrl = process.env.DATABASE_URL;

let pool: pg.Pool | null = null;
let isConnected = false;
let connectionError: string | null = null;
let initPromise: Promise<boolean> | null = null;

if (dbUrl) {
  try {
    const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    let connectionString = dbUrl;
    if (!isLocalhost) {
      try {
        const u = new URL(dbUrl);
        u.searchParams.delete('sslmode');
        connectionString = u.toString();
      } catch {
        connectionString = dbUrl;
      }
    }

    pool = new pg.Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    pool.on('error', (err) => {
      console.warn('⚠️ Tiger Cloud pool background error:', err.message);
    });

    // Test connection asynchronously with promise tracking
    initPromise = pool.query('SELECT extversion FROM pg_extension WHERE extname = $1;', ['timescaledb'])
      .then((res) => {
        isConnected = true;
        const version = res.rows[0]?.extversion || 'unknown';
        console.log(`🐅 Connected to Tiger Cloud TimescaleDB v${version}!`);
        return true;
      })
      .catch((err) => {
        connectionError = err.message;
        console.warn(`⚠️ Tiger Cloud connection deferred/offline: ${err.message}. Using fallback.`);
        return false;
      });
  } catch (err: any) {
    connectionError = err.message;
    console.warn(`⚠️ Tiger Cloud pool init warning: ${err.message}`);
  }
} else {
  console.log('ℹ️ No DATABASE_URL provided. Operating in in-memory mode.');
}

async function ensureConnected(): Promise<boolean> {
  if (isConnected) return true;
  if (initPromise) {
    try {
      return await initPromise;
    } catch {
      return false;
    }
  }
  return false;
}

export const db = {
  isTigerConnected(): boolean {
    return isConnected;
  },

  getConnectionError(): string | null {
    return connectionError;
  },

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await ensureConnected();
    if (!pool || !isConnected) {
      return [];
    }
    try {
      const res = await pool.query(sql, params);
      return res.rows as T[];
    } catch (err: any) {
      console.warn(`Database query warning [${sql.slice(0, 40)}...]:`, err.message);
      return [];
    }
  },

  async getTigerStatus(): Promise<TigerStatusResponse> {
    await ensureConnected();
    const host = dbUrl ? new URL(dbUrl).hostname : 'tsdb.cloud.timescale.com';
    const now = new Date().toISOString();

    if (!pool || !isConnected) {
      return {
        status: 'mock',
        engine: 'TimescaleDB (PostgreSQL)',
        version: '2.32.0 (simulated)',
        cloud_provider: 'Tiger Data Cloud',
        host: host || 'localhost',
        hypertables: [
          {
            schema: 'public',
            table_name: 'parking_detection_events',
            num_chunks: 3,
            compression_enabled: true,
            num_dimensions: 1,
            primary_dimension: 'recorded_at'
          },
          {
            schema: 'public',
            table_name: 'city_metric_events',
            num_chunks: 3,
            compression_enabled: true,
            num_dimensions: 1,
            primary_dimension: 'time'
          },
          {
            schema: 'public',
            table_name: 'utility_outage_metrics',
            num_chunks: 1,
            compression_enabled: false,
            num_dimensions: 1,
            primary_dimension: 'recorded_at'
          }
        ],
        continuous_aggregates: [
          {
            view_name: 'parking_hourly_stats',
            materialization_hypertable: '_materialized_hypertable_3',
            schedule_interval: '15 minutes',
            real_time_enabled: true
          },
          {
            view_name: 'city_metrics_hourly_stats',
            materialization_hypertable: '_materialized_hypertable_5',
            schedule_interval: '15 minutes',
            real_time_enabled: true
          }
        ],
        compression: [
          {
            hypertable_name: 'parking_detection_events',
            total_chunks: 3,
            compressed_chunks: 3,
            before_compression_bytes: 974848,
            after_compression_bytes: 442368,
            compression_ratio_percent: 54.6
          },
          {
            hypertable_name: 'city_metric_events',
            total_chunks: 3,
            compressed_chunks: 3,
            before_compression_bytes: 1318912,
            after_compression_bytes: 294912,
            compression_ratio_percent: 77.6
          }
        ],
        timestamp: now
      };
    }

    try {
      // 1. Version
      const vRes = await pool.query<{ extversion: string }>('SELECT extversion FROM pg_extension WHERE extname = $1;', ['timescaledb']);
      const version = vRes.rows[0]?.extversion || '2.32.0';

      // 2. Hypertables
      const hRes = await pool.query<{
        hypertable_schema: string;
        hypertable_name: string;
        num_chunks: string;
        compression_enabled: boolean;
        num_dimensions: number;
        primary_dimension: string;
      }>(`
        SELECT 
          hypertable_schema, 
          hypertable_name, 
          num_chunks, 
          compression_enabled, 
          num_dimensions, 
          primary_dimension 
        FROM timescaledb_information.hypertables
        ORDER BY hypertable_name;
      `);

      const hypertables: TigerHypertableInfo[] = hRes.rows.map(r => ({
        schema: r.hypertable_schema,
        table_name: r.hypertable_name,
        num_chunks: parseInt(r.num_chunks || '0', 10),
        compression_enabled: Boolean(r.compression_enabled),
        num_dimensions: r.num_dimensions || 1,
        primary_dimension: r.primary_dimension || 'time'
      }));

      // 3. Continuous aggregates
      const cRes = await pool.query<{
        view_name: string;
        materialization_hypertable_name: string;
      }>(`
        SELECT view_name, materialization_hypertable_name 
        FROM timescaledb_information.continuous_aggregates
        ORDER BY view_name;
      `);

      const continuous_aggregates: TigerContinuousAggregateInfo[] = cRes.rows.map(r => ({
        view_name: r.view_name,
        materialization_hypertable: r.materialization_hypertable_name,
        schedule_interval: '15 minutes',
        real_time_enabled: true
      }));

      // 4. Compression stats
      const compression: TigerCompressionStats[] = [];
      for (const h of ['parking_detection_events', 'city_metric_events']) {
        try {
          const sRes = await pool.query<{
            total_chunks: string;
            number_compressed_chunks: string;
            before_compression_total_bytes: string;
            after_compression_total_bytes: string;
            before_compression_table_bytes: string;
            after_compression_table_bytes: string;
            before_compression_index_bytes: string;
            after_compression_index_bytes: string;
          }>(`SELECT * FROM hypertable_compression_stats($1);`, [h]);

          if (sRes.rows.length > 0) {
            const row = sRes.rows[0];
            const before = parseInt(row.before_compression_total_bytes || '0', 10);
            const after = parseInt(row.after_compression_total_bytes || '0', 10);
            const ratio = before > 0 ? Math.round(((1.0 - after / before) * 100) * 10) / 10 : 0;

            const tableBefore = parseInt(row.before_compression_table_bytes || '0', 10);
            const tableAfter = parseInt(row.after_compression_table_bytes || '0', 10);
            const tableRatio = tableBefore > 0 ? Math.round(((1.0 - tableAfter / tableBefore) * 100) * 10) / 10 : 0;

            const indexBefore = parseInt(row.before_compression_index_bytes || '0', 10);
            const indexAfter = parseInt(row.after_compression_index_bytes || '0', 10);
            const indexRatio = indexBefore > 0 ? Math.round(((1.0 - indexAfter / indexBefore) * 100) * 10) / 10 : 0;

            compression.push({
              hypertable_name: h,
              total_chunks: parseInt(row.total_chunks || '0', 10),
              compressed_chunks: parseInt(row.number_compressed_chunks || '0', 10),
              before_compression_bytes: before,
              after_compression_bytes: after,
              compression_ratio_percent: ratio,
              table_before_bytes: tableBefore,
              table_after_bytes: tableAfter,
              table_compression_ratio_percent: tableRatio,
              index_compression_ratio_percent: indexRatio
            });
          }
        } catch {
          // ignore table if compression stats not applicable
        }
      }

      return {
        status: 'connected',
        engine: 'TimescaleDB (PostgreSQL)',
        version,
        cloud_provider: 'Tiger Data Cloud',
        host,
        hypertables,
        continuous_aggregates,
        compression,
        timestamp: now
      };
    } catch (err: any) {
      console.warn('Error reading live Tiger stats, returning fallback:', err.message);
      return {
        status: 'mock',
        engine: 'TimescaleDB (PostgreSQL)',
        version: '2.32.0',
        cloud_provider: 'Tiger Data Cloud',
        host,
        hypertables: [],
        continuous_aggregates: [],
        compression: [],
        timestamp: now
      };
    }
  }
};
