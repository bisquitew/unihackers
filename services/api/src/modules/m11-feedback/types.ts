export type FeedbackSource = 'survey' | 'in-app';

/** One piece of feedback, from the in-app form or from the Google Form survey. */
export interface FeedbackEntry {
  id: string;
  source: FeedbackSource;
  /** Survey only: id from the Google Sheet ("survey-<row>"), used to de-duplicate retries. */
  externalId: string | null;
  submittedAt: string;
  receivedAt: string;
  appVersion: string;
  /** In-app: the star rating. Survey: "How good is the app so far?" (testers only). */
  appRating: number | null;
  /** Survey only. */
  installLikelihood: number | null;
  /** In-app only: which module the feedback is about (null = the app in general). */
  moduleId: string | null;
  /** In-app free text. Empty for survey entries (see surveyComments). */
  text: string;
  // Survey-only fields (null / empty for in-app entries)
  role: string | null;
  ageRange: string | null;
  topFeature: string | null;
  wantedFeatures: string[];
  triedApp: boolean | null;
  triedParts: string[];
  problemScores: Record<string, number>;
  surveyComments: { confusing: string; missing: string } | null;
}

export interface InAppFeedbackInput {
  rating: number;
  moduleId: string | null;
  text: string;
  appVersion: string;
}

/** Exactly the JSON built by toPayload_ in docs/living-labs/feedback-sheet.gs. */
export interface SurveyPayload {
  source: 'survey';
  externalId: string;
  submittedAt: string;
  appVersion: string;
  role: string;
  ageRange: string | null;
  installLikelihood: number | null;
  topFeature: string | null;
  wantedFeatures: string[];
  triedApp: boolean;
  triedParts: string[];
  appRating: number | null;
  problemScores: Record<string, number>;
  text: { confusing: string; missing: string };
}

export interface ChangelogEntry {
  version: string;
  /** Hackathon hour (0–48) when the version shipped. */
  hour: number;
  changed: string;
  /** Feedback that caused the change, e.g. { ref: 'LL-03', summary: '4 of 6 testers ...' }. */
  becauseOf: { ref: string; summary: string }[];
}

export interface RatingStats {
  responses: number;
  avgInstallLikelihood: number | null;
  avgAppRating: number | null;
}

export interface VersionSummary extends RatingStats {
  appVersion: string;
  bySource: Record<FeedbackSource, RatingStats>;
}

export interface ModuleVotes {
  moduleId: string;
  /** Survey: "Which features would you use?" */
  wanted: number;
  /** Survey: "Which ONE would you use most?" */
  topPick: number;
  /** Survey: "Which part did you try?" */
  tried: number;
  /** In-app feedback entries about this module. */
  inAppFeedback: number;
  avgInAppRating: number | null;
}

export interface FeedbackSummary {
  generatedAt: string;
  totals: RatingStats & { survey: number; inApp: number };
  byVersion: VersionSummary[];
  modules: ModuleVotes[];
}
