/**
 * 🏛️ UNIHACK 2026 — Timișoara City Hub
 * Auth0 Post-Login Action: Step-Up Multi-Factor Authentication (RFC 9470) & Custom Claims
 * 
 * Target Sponsor: Auth0 (Wireless Headphones Challenge)
 * 
 * Features:
 *  1. Enforces mandatory MFA step-up for Admin and Moderator roles.
 *  2. Bypasses human MFA for Machine-to-Machine (M2M) Autonomous AI Agent service principals.
 *  3. Computes granular Security Tiers:
 *     - Tier 1: Standard Citizen Access (Passwordless / Google)
 *     - Tier 2: Verified High-Privilege Staff (Passkeys / FIDO2 / Authenticator TOTP)
 *     - Tier 3: Autonomous AI Agent (OAuth2 Client-Credentials M2M)
 *  4. Injects namespaced custom claims into Access Tokens and ID Tokens.
 *  5. Integrates with Auth0 Attack Protection / Risk Assessment.
 * 
 * @param {Event} event - Details about the user and context in which they are logging in.
 * @param {PostLoginAPI} api - Interface to affect the login flow.
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://timisoara-hub.ro';

  // 1. Resolve User Roles from Auth0 app_metadata (default to 'resident')
  const roles = (event.user.app_metadata && event.user.app_metadata.roles) || ['resident'];
  const primaryRole = roles[0] || 'resident';

  // 2. Inspect Authentication Methods References (AMR)
  const methods = (event.authentication && event.authentication.methods) || [];
  const amrNames = methods.map((m) => m.name);

  const hasMfa = amrNames.includes('mfa') || 
                 amrNames.includes('otp') || 
                 amrNames.includes('webauthn') || 
                 amrNames.includes('fido2');

  const isM2M = event.client && event.client.client_type === 'non_interactive';

  // 3. Step-Up MFA Policy: High-Privilege Staff MUST complete MFA
  const isStaff = roles.includes('admin') || roles.includes('moderator');
  if (isStaff && !hasMfa && !isM2M) {
    // Challenge the user for multi-factor authentication
    api.multifactor.enable('any', {
      allowRememberBrowser: false // Municipal staff requires per-session step-up verification
    });
  }

  // 4. Assign Security Tier
  let securityTier = 'tier_1_standard';
  if (isM2M) {
    securityTier = 'tier_3_ai_agent_m2m';
  } else if (hasMfa) {
    securityTier = 'tier_2_mfa_verified';
  }

  // 5. Inject Namespaced Claims into Access Token & ID Token
  api.accessToken.setCustomClaim(`${namespace}/role`, primaryRole);
  api.accessToken.setCustomClaim(`${namespace}/roles`, roles);
  api.accessToken.setCustomClaim(`${namespace}/mfa_verified`, hasMfa || isM2M);
  api.accessToken.setCustomClaim(`${namespace}/security_tier`, securityTier);
  api.accessToken.setCustomClaim(`${namespace}/email`, event.user.email);
  api.accessToken.setCustomClaim(`${namespace}/name`, event.user.name || event.user.nickname);

  api.idToken.setCustomClaim(`${namespace}/role`, primaryRole);
  api.idToken.setCustomClaim(`${namespace}/roles`, roles);
  api.idToken.setCustomClaim(`${namespace}/mfa_verified`, hasMfa || isM2M);
  api.idToken.setCustomClaim(`${namespace}/security_tier`, securityTier);

  // 6. Adaptive Geolocation & New Location Anomaly Detection
  const geoip = event.request && event.request.geoip;
  const currentCity = geoip ? geoip.cityName : 'Timișoara';
  const currentCountry = geoip ? geoip.countryName : 'România';
  const knownLocations = (event.user.user_metadata && event.user.user_metadata.known_locations) || ['Timișoara'];

  const isNewLocation = geoip && !knownLocations.includes(currentCity);

  if (isNewLocation) {
    // Flag new location in token claims so client and backend can react
    api.accessToken.setCustomClaim(`${namespace}/is_new_location`, true);
    api.idToken.setCustomClaim(`${namespace}/is_new_location`, true);

    // Enforce step-up MFA challenge on unrecognized location
    api.multifactor.enable('any', { allowRememberBrowser: false });
  }

  // 7. Auth0 Attack Protection / Risk Assessment Check
  if ((event.riskAssessment && event.riskAssessment.confidence === 'low') || isNewLocation) {
    // Escalate security: trigger MFA even for standard accounts if anomaly is detected
    api.multifactor.enable('any');
  }
};
