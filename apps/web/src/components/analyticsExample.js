// Example numbers for the Analytics page, so staff can see what the charts look like before any real feedback exists.
// They are drawn in the browser only and are never sent to or saved by the API; the page labels them as examples.
export const EXAMPLE_ANALYTICS = {
  hasData: true,
  headline: {
    avgAppRating: 4.2,
    avgInstallLikelihood: 4.1,
    mostWantedFeature: { id: 'm05-transit', share: 78 },
    biggestProblem: { id: 'm05-transit', avg: 4.4 },
  },
  topPick: [
    { id: 'm05-transit', share: 31 }, { id: 'm01-events', share: 24 }, { id: 'm10-assistant', share: 16 },
    { id: 'm04-utilities', share: 12 }, { id: 'm03-safety', share: 9 }, { id: 'm07-buddy', share: 8 },
  ],
  wanted: [
    { id: 'm05-transit', share: 78 }, { id: 'm01-events', share: 71 }, { id: 'm04-utilities', share: 58 }, { id: 'm02-visitor-info', share: 52 },
    { id: 'm10-assistant', share: 49 }, { id: 'm03-safety', share: 44 }, { id: 'parkie', share: 41 }, { id: 'm07-buddy', share: 33 },
  ],
  problems: [
    { id: 'm05-transit', avg: 4.4 }, { id: 'm04-utilities', avg: 4.1 }, { id: 'parkie', avg: 3.9 }, { id: 'm03-safety', avg: 3.6 },
    { id: 'm01-events', avg: 3.4 }, { id: 'm06-smell', avg: 3.0 }, { id: 'm07-buddy', avg: 2.8 },
  ],
  ratingSpread: [{ stars: 1, share: 3 }, { stars: 2, share: 6 }, { stars: 3, share: 17 }, { stars: 4, share: 36 }, { stars: 5, share: 38 }],
  ratingByModule: [
    { id: 'm05-transit', avg: 4.6 }, { id: 'm01-events', avg: 4.4 }, { id: 'm10-assistant', avg: 4.1 }, { id: 'm04-utilities', avg: 3.8 }, { id: 'm07-buddy', avg: 3.5 },
  ],
  roles: [
    { id: 'Romanian student', share: 38 }, { id: 'Timișoara resident', share: 27 }, { id: 'International student', share: 19 },
    { id: 'New to the city (under 1 year)', share: 10 }, { id: 'Visitor or tourist', share: 6 },
  ],
  ages: [{ id: '18–24', share: 52 }, { id: '25–34', share: 26 }, { id: '35–49', share: 14 }, { id: '50–64', share: 6 }, { id: 'Under 18', share: 2 }],
  versions: [
    { appVersion: 'v0', avgAppRating: null, avgInstallLikelihood: 3.4 },
    { appVersion: 'v1', avgAppRating: 3.6, avgInstallLikelihood: 3.8 },
    { appVersion: 'v2', avgAppRating: 4.0, avgInstallLikelihood: 4.0 },
    { appVersion: 'v3', avgAppRating: 4.4, avgInstallLikelihood: 4.2 },
  ],
  comments: [
    { kind: 'in-app', moduleId: 'm05-transit', text: 'The detour info for line 5 saved me a long wait.', at: '2026-11-15T09:12:00Z' },
    { kind: 'missing', moduleId: null, text: 'A way to see free parking on the map before I leave.', at: '2026-11-15T08:40:00Z' },
    { kind: 'confusing', moduleId: null, text: 'I did not find where my ticket was at first.', at: '2026-11-14T19:05:00Z' },
    { kind: 'in-app', moduleId: 'm01-events', text: 'Good events, but I would like a filter for free ones.', at: '2026-11-14T17:30:00Z' },
  ],
};
