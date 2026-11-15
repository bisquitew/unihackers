import type {
  ChangelogEntry,
  FeedbackEntry,
  FeedbackSource,
  FeedbackSummary,
  InAppFeedbackInput,
  ModuleVotes,
  RatingStats,
  SurveyPayload,
} from './types.ts';
import { seedChangelog, seedFeedback } from './seed.ts';
import { db } from '../../core/db.ts';
import { buildAnalytics, type FeedbackAnalytics } from './analytics.ts';

const newId = () => `fb-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

function avg(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number');
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

function stats(entries: FeedbackEntry[]): RatingStats {
  return {
    responses: entries.length,
    avgInstallLikelihood: avg(entries.map((e) => e.installLikelihood)),
    avgAppRating: avg(entries.map((e) => e.appRating)),
  };
}

export class FeedbackService {
  private entries: FeedbackEntry[] = [...seedFeedback];
  private changelog: ChangelogEntry[] = [...seedChangelog];
  private loaded: Promise<void> | null = null;

  /**
   * Reads what was saved before a restart: in-app feedback from m11_feedback and survey answers from
   * m11_survey_entries (created when missing). Runs once, on first use.
   */
  private load(): Promise<void> {
    this.loaded ??= (async () => {
      if (!db.isTigerConnected()) return;
      try {
        await db.query(`CREATE TABLE IF NOT EXISTS m11_survey_entries (
          external_id VARCHAR(100) PRIMARY KEY, data JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
        const inApp = await db.query<any>(`SELECT id, rating, text, app_version, module_id, created_at FROM m11_feedback ORDER BY created_at`);
        for (const r of inApp) {
          if (this.entries.some((e) => e.id === r.id)) continue;
          const at = new Date(r.created_at).toISOString();
          this.entries.push({
            id: r.id, source: 'in-app', externalId: null, submittedAt: at, receivedAt: at, appVersion: r.app_version ?? 'unknown',
            appRating: r.rating ?? null, installLikelihood: null, moduleId: r.module_id ?? null, text: r.text ?? '',
            role: null, ageRange: null, topFeature: null, wantedFeatures: [], triedApp: null, triedParts: [], problemScores: {}, surveyComments: null,
          });
        }
        const surveys = await db.query<any>(`SELECT data FROM m11_survey_entries ORDER BY created_at`);
        for (const r of surveys) if (!this.entries.some((e) => e.id === r.data.id)) this.entries.push(r.data);
      } catch (err: any) {
        console.warn('[m11-feedback] could not load saved feedback:', err.message);
      }
    })();
    return this.loaded;
  }

  async addInApp(input: InAppFeedbackInput): Promise<FeedbackEntry> {
    await this.load();
    const now = new Date().toISOString();
    const entry: FeedbackEntry = {
      id: newId(),
      source: 'in-app',
      externalId: null,
      submittedAt: now,
      receivedAt: now,
      appVersion: input.appVersion,
      appRating: input.rating,
      installLikelihood: null,
      moduleId: input.moduleId,
      text: input.text,
      role: null,
      ageRange: null,
      topFeature: null,
      wantedFeatures: [],
      triedApp: null,
      triedParts: [],
      problemScores: {},
      surveyComments: null,
    };
    this.entries.push(entry);

    if (db.isTigerConnected()) {
      try {
        await db.query(`
          INSERT INTO m11_feedback (id, rating, text, app_version, module_id, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW());
        `, [entry.id, entry.appRating, entry.text, entry.appVersion, entry.moduleId]);
      } catch (err: any) {
        console.warn('FeedbackService TimescaleDB error:', err.message);
      }
    }

    return entry;
  }

  /** Idempotent on externalId: a retry from the sheet returns the existing entry. */
  async ingestSurvey(p: SurveyPayload): Promise<{ entry: FeedbackEntry; duplicate: boolean }> {
    await this.load();
    const existing = this.entries.find((e) => e.source === 'survey' && e.externalId === p.externalId);
    if (existing) return { entry: existing, duplicate: true };

    const entry: FeedbackEntry = {
      id: newId(),
      source: 'survey',
      externalId: p.externalId,
      submittedAt: new Date(p.submittedAt).toISOString(),
      receivedAt: new Date().toISOString(),
      appVersion: p.appVersion,
      appRating: p.appRating,
      installLikelihood: p.installLikelihood,
      moduleId: null,
      text: '',
      role: p.role,
      ageRange: p.ageRange,
      topFeature: p.topFeature,
      wantedFeatures: p.wantedFeatures,
      triedApp: p.triedApp,
      triedParts: p.triedParts,
      problemScores: p.problemScores,
      surveyComments: { confusing: p.text.confusing, missing: p.text.missing },
    };
    this.entries.push(entry);
    if (db.isTigerConnected()) {
      try {
        await db.query(`INSERT INTO m11_survey_entries (external_id, data) VALUES ($1, $2) ON CONFLICT DO NOTHING;`, [p.externalId, JSON.stringify(entry)]);
      } catch (err: any) {
        console.warn('FeedbackService survey save error:', err.message);
      }
    }
    return { entry, duplicate: false };
  }

  /** The feedback summed up for the staff dashboard: averages and shares, never how many people answered. */
  async getAnalytics(): Promise<FeedbackAnalytics> {
    await this.load();
    return buildAnalytics(this.entries);
  }

  async getSummary(): Promise<FeedbackSummary> {
    await this.load();
    const all = this.entries;
    const bySource = (list: FeedbackEntry[], s: FeedbackSource) => list.filter((e) => e.source === s);

    // Versions in the order they first received feedback
    const versions: string[] = [];
    [...all]
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
      .forEach((e) => { if (!versions.includes(e.appVersion)) versions.push(e.appVersion); });

    const byVersion = versions.map((v) => {
      const list = all.filter((e) => e.appVersion === v);
      return {
        appVersion: v,
        ...stats(list),
        bySource: { survey: stats(bySource(list, 'survey')), 'in-app': stats(bySource(list, 'in-app')) },
      };
    });

    const modules = new Map<string, ModuleVotes & { ratings: number[] }>();
    const mod = (id: string) => {
      if (!modules.has(id)) {
        modules.set(id, { moduleId: id, wanted: 0, topPick: 0, tried: 0, inAppFeedback: 0, avgInAppRating: null, ratings: [] });
      }
      return modules.get(id)!;
    };
    for (const e of all) {
      e.wantedFeatures.forEach((id) => mod(id).wanted++);
      e.triedParts.forEach((id) => mod(id).tried++);
      if (e.topFeature) mod(e.topFeature).topPick++;
      if (e.source === 'in-app' && e.moduleId) {
        const m = mod(e.moduleId);
        m.inAppFeedback++;
        if (e.appRating !== null) m.ratings.push(e.appRating);
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      totals: { ...stats(all), survey: bySource(all, 'survey').length, inApp: bySource(all, 'in-app').length },
      byVersion,
      modules: [...modules.values()]
        .map(({ ratings, ...m }) => ({ ...m, avgInAppRating: avg(ratings) }))
        .sort((a, b) => b.wanted + b.topPick + b.inAppFeedback - (a.wanted + a.topPick + a.inAppFeedback)),
    };
  }

  /** Oldest first; the last entry is the current app version. */
  async getChangelog(): Promise<ChangelogEntry[]> {
    return [...this.changelog].sort((a, b) => a.hour - b.hour);
  }
}

export const feedbackService = new FeedbackService();
