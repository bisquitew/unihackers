import { feedbackService } from './service.ts';

export const feedbackAssistantTools = [
  {
    name: 'get_feedback_summary',
    description:
      'Returns what real users said about this city app during testing: number of responses, average install likelihood and app rating per app version, and which modules people want most.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
    handler: async () => {
      const s = await feedbackService.getSummary();
      return {
        totals: s.totals,
        byVersion: s.byVersion.map((v) => ({
          appVersion: v.appVersion,
          responses: v.responses,
          avgInstallLikelihood: v.avgInstallLikelihood,
          avgAppRating: v.avgAppRating,
        })),
        topModules: s.modules.slice(0, 5).map((m) => ({
          moduleId: m.moduleId,
          wanted: m.wanted,
          topPick: m.topPick,
          inAppFeedback: m.inAppFeedback,
        })),
      };
    },
  },
];
