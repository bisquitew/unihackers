import type { ChangelogEntry, FeedbackEntry } from './types';

/**
 * Intentionally empty: these numbers are Living Labs evidence, so they must come from real
 * people only. Never add sample entries here.
 */
export const seedFeedback: FeedbackEntry[] = [];

/**
 * Add a row every time a change that came from feedback ships, and use the same version
 * string as APP_VERSION in the survey sheet (docs/living-labs/living-labs-log.md).
 */
export const seedChangelog: ChangelogEntry[] = [
  {
    version: 'v0',
    hour: 0,
    changed: 'Idea only, no app yet (baseline survey)',
    becauseOf: [],
  },
];
