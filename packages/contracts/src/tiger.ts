import { z } from './zod-shim.ts';

export const TigerHypertableInfoSchema = z.object({
  schema: z.string(),
  table_name: z.string(),
  num_chunks: z.number(),
  compression_enabled: z.boolean(),
  num_dimensions: z.number(),
  primary_dimension: z.string()
});
export interface TigerHypertableInfo {
  schema: string;
  table_name: string;
  num_chunks: number;
  compression_enabled: boolean;
  num_dimensions: number;
  primary_dimension: string;
}

export const TigerContinuousAggregateInfoSchema = z.object({
  view_name: z.string(),
  materialization_hypertable: z.string(),
  schedule_interval: z.string().optional(),
  real_time_enabled: z.boolean().default(true)
});
export interface TigerContinuousAggregateInfo {
  view_name: string;
  materialization_hypertable: string;
  schedule_interval?: string;
  real_time_enabled: boolean;
}

export const TigerCompressionStatsSchema = z.object({
  hypertable_name: z.string(),
  total_chunks: z.number(),
  compressed_chunks: z.number(),
  before_compression_bytes: z.number(),
  after_compression_bytes: z.number(),
  compression_ratio_percent: z.number(),
  table_before_bytes: z.number().optional(),
  table_after_bytes: z.number().optional(),
  table_compression_ratio_percent: z.number().optional(),
  index_compression_ratio_percent: z.number().optional()
});
export interface TigerCompressionStats {
  hypertable_name: string;
  total_chunks: number;
  compressed_chunks: number;
  before_compression_bytes: number;
  after_compression_bytes: number;
  compression_ratio_percent: number;
  table_before_bytes?: number;
  table_after_bytes?: number;
  table_compression_ratio_percent?: number;
  index_compression_ratio_percent?: number;
}

export const TigerStatusResponseSchema = z.object({
  status: z.enum(['connected', 'offline', 'mock'] as const),
  engine: z.literal('TimescaleDB (PostgreSQL)'),
  version: z.string(),
  cloud_provider: z.literal('Tiger Data Cloud'),
  host: z.string(),
  hypertables: z.array(TigerHypertableInfoSchema),
  continuous_aggregates: z.array(TigerContinuousAggregateInfoSchema),
  compression: z.array(TigerCompressionStatsSchema),
  timestamp: z.string()
});
export interface TigerStatusResponse {
  status: 'connected' | 'offline' | 'mock';
  engine: 'TimescaleDB (PostgreSQL)';
  version: string;
  cloud_provider: 'Tiger Data Cloud';
  host: string;
  hypertables: TigerHypertableInfo[];
  continuous_aggregates: TigerContinuousAggregateInfo[];
  compression: TigerCompressionStats[];
  timestamp: string;
}

export const HourlyParkingAnalyticsSchema = z.object({
  bucket: z.string(),
  lot_id: z.string(),
  lot_name: z.string().optional(),
  avg_available: z.number(),
  avg_occupied: z.number(),
  peak_occupied: z.number(),
  min_available: z.number(),
  sample_count: z.number()
});
export interface HourlyParkingAnalytics {
  bucket: string;
  lot_id: string;
  lot_name?: string;
  avg_available: number;
  avg_occupied: number;
  peak_occupied: number;
  min_available: number;
  sample_count: number;
}

export const CityMetricAnalyticsSchema = z.object({
  bucket: z.string(),
  metric_type: z.string(),
  area_id: z.string(),
  avg_value: z.number(),
  min_value: z.number(),
  max_value: z.number(),
  sample_count: z.number()
});
export interface CityMetricAnalytics {
  bucket: string;
  metric_type: string;
  area_id: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  sample_count: number;
}
