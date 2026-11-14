import { apiBaseUrl as defaultApiBase } from './api';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, PrimaryButton, SecondaryButton, colors, radii, shadows } from '@hub/ui';
import { useAuth, type AuthUser } from './auth';

interface AuditItem {
  id: string;
  timestamp: string;
  email: string;
  role: string;
  action: string;
  outcome: 'ALLOW' | 'CHALLENGE_MFA_REQUIRED' | 'DENIED_INSUFFICIENT_ROLE';
  mfa_verified: boolean;
  ip: string;
}

const PERSONAS = [
  { key: 'dev_resident', label: 'Resident', icon: '👤', tier: 'Tier 1' },
  { key: 'dev_organizer', label: 'Organizer', icon: '🎟️', tier: 'Tier 1' },
  { key: 'dev_moderator_no_mfa', label: 'Mod (No MFA)', icon: '⚠️', tier: 'Tier 1' },
  { key: 'dev_moderator_mfa', label: 'Mod (MFA)', icon: '🛡️', tier: 'Tier 2' },
  { key: 'dev_admin_no_mfa', label: 'Admin (No MFA)', icon: '🔒', tier: 'Tier 1' },
  { key: 'dev_admin_mfa', label: 'Admin (Passkey)', icon: '🔐', tier: 'Tier 2' },
  { key: 'dev_ai_agent', label: 'AI Agent (M2M)', icon: '🤖', tier: 'Tier 3' },
];

export function Auth0SecurityCard({ apiBaseUrl = defaultApiBase() }: { apiBaseUrl?: string }) {
  const { user, token, login, simulateMfaStepUp, isLoading } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [mfaSuccessMsg, setMfaSuccessMsg] = useState<string | null>(null);
  const [locationAlert, setLocationAlert] = useState<{
    isNew: boolean;
    city: string;
    country: string;
    ip: string;
    emailSent: boolean;
    pushSent: boolean;
    emailPreview?: string;
  } | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);

  const simulateLocationLogin = async (city: string, country: string, ip: string) => {
    setIsCheckingLocation(true);
    try {
      const res = await fetch(`${apiBaseUrl}/v1/core/auth/simulate-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token || 'dev_resident',
          city,
          country,
          ip,
          device: 'Expo Mobile App on iOS / Android'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLocationAlert({
          isNew: data.is_new_location,
          city,
          country,
          ip,
          emailSent: data.email_alert_sent,
          pushSent: data.push_notification_sent,
          emailPreview: data.security_email?.body_text
        });
      }
    } catch {
      // Local fallback simulation
      const isNew = city !== 'Timișoara';
      setLocationAlert({
        isNew,
        city,
        country,
        ip,
        emailSent: isNew,
        pushSent: isNew,
        emailPreview: isNew
          ? `[Alertă de Securitate]\nConectare nouă din ${city}, ${country} (IP: ${ip}).\nUn email de avertizare și o notificare push au fost expediate.`
          : undefined
      });
    } finally {
      setIsCheckingLocation(false);
    }
  };

  const handleStepUp = async () => {
    setIsUpgrading(true);
    setMfaSuccessMsg(null);
    try {
      await simulateMfaStepUp('fido2_webauthn_passkey');
      setMfaSuccessMsg('Biometric / FIDO2 Passkey verified! Upgraded to Tier 2 (MFA Verified).');
      setTimeout(() => setMfaSuccessMsg(null), 5000);
    } finally {
      setIsUpgrading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch(`${apiBaseUrl}/v1/core/auth/audit-log`, {
        headers: { Authorization: `Bearer ${token || 'dev_admin_mfa'}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data) ? data : (data.audit_records || []));
        setShowLogs(true);
      }
    } catch {
      // In-app offline fallback display
      setAuditLogs([
        {
          id: 'sample-01',
          timestamp: new Date().toISOString(),
          email: user?.email || 'admin@timisoara-hub.ro',
          role: user?.role || 'admin',
          action: 'utilities.outages_create',
          outcome: user?.mfa_verified ? 'ALLOW' : 'CHALLENGE_MFA_REQUIRED',
          mfa_verified: !!user?.mfa_verified,
          ip: '127.0.0.1'
        }
      ]);
      setShowLogs(true);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const getTierBadgeColor = (tier?: string) => {
    if (tier === 'tier_3_ai_agent_m2m') return '#8b5cf6'; // Violet / AI
    if (tier === 'tier_2_mfa_verified') return '#10b981'; // Green / MFA Secure
    return '#f59e0b'; // Amber / Standard
  };

  const getTierLabel = (tier?: string) => {
    if (tier === 'tier_3_ai_agent_m2m') return '🤖 Tier 3: Autonomous AI Agent (M2M)';
    if (tier === 'tier_2_mfa_verified') return '🔐 Tier 2: MFA Verified (Passkey / TOTP)';
    return '🛡️ Tier 1: Standard Citizen Access';
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text variant="heading" color="foreground">Auth0 Identity & Security</Text>
          <Text variant="caption" color="mutedForeground">Sponsor Challenge • RFC 9470 Step-Up MFA & AI Agents</Text>
        </View>
        <View style={[styles.tierBadge, { backgroundColor: getTierBadgeColor(user?.security_tier) }]}>
          <Text variant="caption" style={styles.tierText}>
            {user?.security_tier === 'tier_3_ai_agent_m2m' ? 'M2M' : user?.mfa_verified ? 'MFA VERIFIED' : 'TIER 1'}
          </Text>
        </View>
      </View>

      {/* Current Identity Box */}
      <View style={styles.userBox}>
        <View style={styles.userInfo}>
          <Text variant="rowTitle" color="foreground">{user?.name || 'Anonymous'}</Text>
          <Text variant="caption" color="mutedForeground">{user?.email} • Role: {user?.role}</Text>
          <Text variant="caption" style={{ color: getTierBadgeColor(user?.security_tier), marginTop: 2, fontWeight: '600' }}>
            {getTierLabel(user?.security_tier)}
          </Text>
        </View>
        <View style={styles.amrRow}>
          {user?.amr?.map((factor, idx) => (
            <View key={idx} style={styles.amrChip}>
              <Text variant="caption" color="foreground" style={{ fontSize: 10 }}>{factor}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Persona Switcher for Hackathon Judges */}
      <View style={styles.section}>
        <Text variant="label" color="foreground" style={{ marginBottom: 6 }}>
          Judge Persona Switcher (Select to test RBAC & MFA):
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.personaRow}>
          {PERSONAS.map((p) => {
            const isSelected = token === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => login(p.key)}
                style={[styles.personaPill, isSelected && styles.personaPillActive]}
              >
                <Text variant="caption" style={isSelected ? styles.personaTextActive : styles.personaText}>
                  {p.icon} {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Step-Up Challenge Action Required Banner */}
      {(user?.role === 'admin' || user?.role === 'moderator') && !user?.mfa_verified && (
        <View style={styles.challengeBox}>
          <Text variant="label" style={{ color: '#b45309', fontWeight: '700' }}>
            ⚠️ Step-Up MFA Challenge Required
          </Text>
          <Text variant="caption" style={{ color: '#92400e', marginVertical: 4 }}>
            Publishing city utility alerts and transit detours requires step-up authentication (RFC 9470).
          </Text>
          <PrimaryButton
            label={isUpgrading ? 'Verifying Passkey...' : 'Simulate FIDO2 Passkey Step-Up'}
            onPress={handleStepUp}
            disabled={isUpgrading}
            size="md"
          />
        </View>
      )}

      {/* Success Notification */}
      {mfaSuccessMsg && (
        <View style={styles.successBox}>
          <Text variant="caption" style={{ color: '#065f46', fontWeight: '600' }}>
            ✅ {mfaSuccessMsg}
          </Text>
        </View>
      )}

      {/* Adaptive Geolocation & New Location Anomaly Shield */}
      <View style={styles.section}>
        <Text variant="label" color="foreground" style={{ marginBottom: 6 }}>
          Adaptive Geolocation & New Location Alert:
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <TouchableOpacity
            style={[styles.testLocButton, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}
            onPress={() => simulateLocationLogin('București', 'România', '86.120.45.12')}
            disabled={isCheckingLocation}
          >
            <Text variant="caption" style={{ color: '#991b1b', fontWeight: '700' }}>
              🚨 Test Anomaly: Login from București
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.testLocButton, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
            onPress={() => simulateLocationLogin('Timișoara', 'România', '86.120.10.1')}
            disabled={isCheckingLocation}
          >
            <Text variant="caption" style={{ color: '#065f46', fontWeight: '600' }}>
              ✓ Test Known: Timișoara
            </Text>
          </TouchableOpacity>
        </View>

        {/* Anomaly Result Banner */}
        {locationAlert && (
          <View style={[
            styles.locResultBox,
            { backgroundColor: locationAlert.isNew ? '#fef2f2' : '#f0fdf4', borderColor: locationAlert.isNew ? '#fecaca' : '#bbf7d0' }
          ]}>
            <Text variant="caption" style={{ color: locationAlert.isNew ? '#991b1b' : '#166534', fontWeight: '700' }}>
              {locationAlert.isNew
                ? `🚨 NOUĂ LOCAȚIE DETECTATĂ: ${locationAlert.city}, ${locationAlert.country} (IP: ${locationAlert.ip})`
                : `✓ Locație Cunoscută: ${locationAlert.city}, ${locationAlert.country}`}
            </Text>
            {locationAlert.isNew && (
              <View style={{ marginTop: 4 }}>
                <Text variant="caption" style={{ color: '#7f1d1d' }}>
                  • Notificare Push emisă pe dispozitivul utilizatorului
                </Text>
                <Text variant="caption" style={{ color: '#7f1d1d' }}>
                  • Email de securitate expediat la {user?.email}
                </Text>
                <Text variant="caption" style={{ color: '#7f1d1d' }}>
                  • Verificarea în doi pași (MFA) impusă preventiv
                </Text>
                {locationAlert.emailPreview && (
                  <View style={styles.emailPreviewBox}>
                    <Text variant="caption" color="mutedForeground" style={{ fontFamily: 'monospace', fontSize: 10 }}>
                      {locationAlert.emailPreview.slice(0, 180)}...
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Live Audit Log Section */}
      <View style={styles.auditActions}>
        <SecondaryButton
          label={showLogs ? 'Refresh Security Audit Trail' : 'Inspect Security Audit Log (Tiger Cloud)'}
          onPress={fetchAuditLogs}
          loading={isLoadingLogs}
          size="md"
        />
      </View>

      {showLogs && (
        <View style={styles.logContainer}>
          <Text variant="label" color="foreground" style={{ marginBottom: 4 }}>
            Real-Time Audit Records ({auditLogs.length}):
          </Text>
          {auditLogs.slice(0, 5).map((log, i) => (
            <View key={log.id || i} style={styles.logRow}>
              <View style={[styles.dot, { backgroundColor: log.outcome === 'ALLOW' ? '#10b981' : '#ef4444' }]} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text variant="caption" color="foreground" style={{ fontWeight: '600' }}>
                  [{log.outcome}] {log.action}
                </Text>
                <Text variant="caption" color="mutedForeground" style={{ fontSize: 11 }}>
                  {log.email} ({log.role}) • MFA: {log.mfa_verified ? 'Yes' : 'No'} • {new Date(log.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: radii.group,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#1A1033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  tierText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 10,
  },
  userBox: {
    backgroundColor: '#f9fafb',
    borderRadius: radii.input,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  userInfo: {
    marginBottom: 6,
  },
  amrRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  amrChip: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  section: {
    marginBottom: 12,
  },
  personaRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  personaPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  personaPillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  personaText: {
    color: '#374151',
    fontWeight: '500',
  },
  personaTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  challengeBox: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
    borderWidth: 1,
    borderRadius: radii.input,
    padding: 12,
    marginBottom: 12,
  },
  successBox: {
    backgroundColor: '#d1fae5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: radii.input,
    padding: 10,
    marginBottom: 12,
  },
  auditActions: {
    marginTop: 4,
  },
  logContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  testLocButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radii.input,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locResultBox: {
    borderWidth: 1,
    borderRadius: radii.input,
    padding: 10,
    marginTop: 4,
  },
  emailPreviewBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 6,
    marginTop: 6,
  },
});
