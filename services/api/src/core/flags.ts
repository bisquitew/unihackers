import type { FeatureFlag, FeatureFlagStatus, UserRole } from '@hub/contracts';

const FLAGS_STORE: Record<string, FeatureFlag> = {
  'm01-events': { module_id: 'm01-events', status: 'live', enabled: true, min_role: 'resident' },
  'm02-visitor-info': { module_id: 'm02-visitor-info', status: 'live', enabled: true, min_role: 'resident' },
  'm03-safety': { module_id: 'm03-safety', status: 'beta', enabled: true, min_role: 'resident' },
  'm04-utilities': { module_id: 'm04-utilities', status: 'live', enabled: true, min_role: 'resident' },
  'm05-transit': { module_id: 'm05-transit', status: 'live', enabled: true, min_role: 'resident' },
  'm06-smell': { module_id: 'm06-smell', status: 'beta', enabled: true, min_role: 'resident' },
  'm07-buddy': { module_id: 'm07-buddy', status: 'beta', enabled: true, min_role: 'resident' },
  'm08-forum': { module_id: 'm08-forum', status: 'draft', enabled: true, min_role: 'resident' },
  'm09-wallet': { module_id: 'm09-wallet', status: 'draft', enabled: true, min_role: 'resident' },
  'm10-assistant': { module_id: 'm10-assistant', status: 'beta', enabled: true, min_role: 'resident' },
  'm11-feedback': { module_id: 'm11-feedback', status: 'live', enabled: true, min_role: 'resident' },
  'm12-dashboard': { module_id: 'm12-dashboard', status: 'beta', enabled: true, min_role: 'admin' },
  'parkie': { module_id: 'parkie', status: 'live', enabled: true, min_role: 'resident' }
};

export function isModuleEnabled(moduleId: string, userRole: UserRole = 'resident'): boolean {
  const flag = FLAGS_STORE[moduleId];
  if (!flag || !flag.enabled) return false;

  // If status is draft, only staff/admins can see it in prod
  if (flag.status === 'draft' && userRole === 'resident') {
    return false;
  }

  return true;
}

export function getAllFlags(): FeatureFlag[] {
  return Object.values(FLAGS_STORE);
}

export function setModuleFlag(moduleId: string, status: FeatureFlagStatus, enabled: boolean): FeatureFlag {
  FLAGS_STORE[moduleId] = {
    module_id: moduleId,
    status,
    enabled,
    min_role: FLAGS_STORE[moduleId]?.min_role || 'resident'
  };
  return FLAGS_STORE[moduleId];
}
