import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { ScrollView, StyleSheet, Switch, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePersonalPins, type MapTheme } from '@hub/map';
import { Avatar, Field, PrimaryButton, Row, RowGroup, Screen, Section, Segmented, Sheet, Text, TextButton, colors, icons, setThemeMode, themeMode, type ThemeMode } from '@hub/ui';
import { useAuth } from '../../src/core/auth';
import { WebAccessGate } from '../../src/core/WebAccessGate';
import { initialsOf, toneFor } from '../../src/core/people';
import { setPrefs, usePrefs } from '../../src/core/prefs';
import { chatStore } from '../../src/modules/m07-buddy/chatStore';
import { ticketStore } from '../../src/modules/m09-wallet/ticketStore';

const ROLE_LABEL: Record<string, string> = { resident: 'Resident', organizer: 'Organizer', moderator: 'Moderator', admin: 'Admin', ai_agent: 'AI agent' };
const SIGN_IN_LABEL: Record<string, string> = { 'email-passwordless': 'Email link', 'google-oauth2': 'Google', passkey: 'Passkey' };
const ABILITY_LABEL: Record<string, string> = {
  'read:city-alerts': 'See city alerts',
  'read:parking': 'Check parking',
  'read:transit': 'See transit times',
  'create:reports': 'Report problems',
  'rsvp:events': 'Join events',
  'create:events': 'Host events',
  'manage:tickets': 'Manage tickets',
  'moderate:forum': 'Moderate the forum',
  'resolve:reports': 'Resolve reports',
  'publish:outages': 'Publish outage notices',
  'manage:detours': 'Manage transit detours',
  'manage:lots': 'Manage parking lots',
  'view:audit-log': 'View the audit log',
  'admin:system': 'Administer the system',
};
const MAP_LOOKS: { id: MapTheme; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'day', label: 'Day' },
  { id: 'golden', label: 'Golden' },
  { id: 'night', label: 'Night' },
];
const APPEARANCE: { id: ThemeMode; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

type Part = 'overview' | 'settings';

/**
 * Profile: two sections of one white page. Overview is who you are and what you have done in the app; Settings is
 * appearance, the map, alerts and your account. Every row goes somewhere or changes something.
 */
export default function ProfileTab() {
  return (
    <WebAccessGate featureName="your profile and account settings">
      <ProfileContent />
    </WebAccessGate>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const { user, logout } = useAuth();
  const prefs = usePrefs();
  const { pins } = usePersonalPins();
  useSyncExternalStore(
    (cb) => chatStore.subscribe(cb),
    () => chatStore.getVersion(),
  );
  const [wallet, setWallet] = useState(ticketStore.getState());
  useEffect(() => ticketStore.subscribe(() => setWallet({ ...ticketStore.getState() })), []);

  const params = useLocalSearchParams<{ part?: string }>();
  const [part, setPart] = useState<Part>(params.part === 'settings' ? 'settings' : 'overview');
  useEffect(() => {
    if (params.part === 'settings' || params.part === 'overview') setPart(params.part);
  }, [params.part]);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [security, setSecurity] = useState(false);

  const accountName = user?.name ?? 'Guest';
  const name = prefs.displayName.trim() || accountName;
  const tickets = wallet.tickets.length;
  const badges = wallet.poaps.length;
  const chats = chatStore.list().length;
  const myPins = pins.length;
  const go = (href: string) => router.push(href as any);
  const sheetMax = Math.round(windowHeight * 0.78);

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        Profile
      </Text>
      <View style={{ marginTop: 14 }}>
        <Segmented
          accessibilityLabel="Profile sections"
          value={part}
          onChange={setPart}
          options={[
            { id: 'overview', label: 'Overview' },
            { id: 'settings', label: 'Settings' },
          ]}
        />
      </View>

      {part === 'overview' ? (
        <>
          <View style={styles.head}>
            <Avatar initials={initialsOf(name)} tone={toneFor(user?.id ?? name)} size={72} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="heading" numberOfLines={1} style={{ fontSize: 24, lineHeight: 30 }}>
                {name}
              </Text>
              <Text variant="rowDetail" color="mutedForeground" numberOfLines={1}>
                {user?.email ?? 'Not signed in'}
              </Text>
              <Text variant="label" color="info">
                {user ? (ROLE_LABEL[user.role] ?? user.role) : 'Guest'}
              </Text>
            </View>
            <TextButton
              label="Edit"
              size="md"
              onPress={() => {
                setNameDraft(prefs.displayName || accountName);
                setEditing(true);
              }}
            />
          </View>

          <View style={styles.stats}>
            <Stat value={tickets} label="Tickets" />
            <View style={styles.divider} />
            <Stat value={badges} label="Badges" />
            <View style={styles.divider} />
            <Stat value={chats} label="Chats" />
            <View style={styles.divider} />
            <Stat value={myPins} label="Places" />
          </View>

          <Section title="Your things">
            <RowGroup>
              <LinkRow icon={<icons.Ticket size={22} color={colors.foreground} />} title="Tickets and badges" detail={`${tickets} ticket${tickets === 1 ? '' : 's'}, ${badges} badge${badges === 1 ? '' : 's'}`} onPress={() => go('/community?tab=wallet')} />
              <LinkRow icon={<icons.ChatCircle size={22} color={colors.foreground} />} title="Chats" detail={chats ? `${chats} conversation${chats === 1 ? '' : 's'}` : 'Find someone to go with'} onPress={() => go('/community?tab=buddies&view=chats')} />
              <LinkRow icon={<icons.MapPin size={22} color={colors.foreground} />} title="Your places on the map" detail={myPins ? `${myPins} saved` : 'Pin Home, Work or a spot you like'} onPress={() => go('/map')} />
            </RowGroup>
          </Section>

          <Section title="Help">
            <RowGroup>
              <LinkRow icon={<icons.PaperPlaneTilt size={22} color={colors.foreground} />} title="Send feedback" detail="Tell the team what to fix" onPress={() => go('/m/feedback')} />
            </RowGroup>
          </Section>
        </>
      ) : (
        <>
          <Section title="Appearance">
            <Segmented
              options={APPEARANCE}
              value={themeMode}
              onChange={(mode) => {
                if (mode !== themeMode) setThemeMode(mode, '/profile?part=settings');
              }}
              accessibilityLabel="Appearance"
            />
            <Text variant="rowDetail" color="mutedForeground" style={{ marginTop: 8 }}>
              System follows your phone's setting.
            </Text>
          </Section>

          <Section title="Map look">
            <Segmented options={MAP_LOOKS} value={prefs.mapTheme} onChange={(mapTheme) => setPrefs({ mapTheme })} accessibilityLabel="Map look" />
            <Text variant="rowDetail" color="mutedForeground" style={{ marginTop: 8 }}>
              Auto follows the time of day, and Night in dark mode.
            </Text>
          </Section>

          <Section title="Alerts">
            <RowGroup>
              <ToggleRow title="Safety and city alerts" detail="Water, traffic and warnings near you" value={prefs.notifySafety} onChange={(notifySafety) => setPrefs({ notifySafety })} />
              <ToggleRow title="Event reminders" detail="Before an event you have a ticket for" value={prefs.notifyEvents} onChange={(notifyEvents) => setPrefs({ notifyEvents })} />
              <ToggleRow title="Community replies" detail="Answers to your posts and messages" value={prefs.notifyCommunity} onChange={(notifyCommunity) => setPrefs({ notifyCommunity })} />
            </RowGroup>
          </Section>

          <Section title="Account">
            <RowGroup>
              <LinkRow icon={<icons.ShieldCheck size={22} color={colors.foreground} />} title="Sign-in and security" detail={user ? `Signed in with ${SIGN_IN_LABEL[user.idp] ?? user.idp}` : 'Not signed in'} onPress={() => setSecurity(true)} />
            </RowGroup>
            <View style={{ marginTop: 16, alignItems: 'flex-start' }}>
              <TextButton label="Sign out" size="lg" onPress={logout} />
            </View>
          </Section>
        </>
      )}

      <Sheet modal visible={editing} onClose={() => setEditing(false)} accessibilityLabel="Edit your name">
        <View style={{ gap: 14 }}>
          <Text variant="heading" accessibilityRole="header">
            Your name
          </Text>
          <Text variant="body" color="mutedForeground">
            This is how you appear to other people. It does not change your account.
          </Text>
          <Field label="Name" value={nameDraft} onChangeText={setNameDraft} placeholder={accountName} maxLength={40} />
          <PrimaryButton
            label="Save"
            size="lg"
            onPress={() => {
              const next = nameDraft.trim();
              setPrefs({ displayName: next === accountName ? '' : next });
              setEditing(false);
            }}
          />
        </View>
      </Sheet>

      <Sheet modal visible={security} onClose={() => setSecurity(false)} accessibilityLabel="Sign-in and security">
        {user ? (
          <ScrollView style={{ maxHeight: sheetMax }} contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false}>
            <Text variant="heading" accessibilityRole="header">
              Sign-in and security
            </Text>
            <RowGroup>
              <Row>
                <Row.Body>
                  <Row.Title>{user.email}</Row.Title>
                  <Row.Detail>Your account</Row.Detail>
                </Row.Body>
              </Row>
              <Row>
                <Row.Body>
                  <Row.Title>{SIGN_IN_LABEL[user.idp] ?? user.idp}</Row.Title>
                  <Row.Detail>How you sign in</Row.Detail>
                </Row.Body>
              </Row>
              <Row>
                <Row.Body>
                  <Row.Title>{ROLE_LABEL[user.role] ?? user.role}</Row.Title>
                  <Row.Detail>Account type</Row.Detail>
                </Row.Body>
              </Row>
              {user.neighbourhood ? (
                <Row>
                  <Row.Body>
                    <Row.Title>{user.neighbourhood}</Row.Title>
                    <Row.Detail>Your neighbourhood</Row.Detail>
                  </Row.Body>
                </Row>
              ) : null}
            </RowGroup>

            <View style={{ gap: 8 }}>
              <Text variant="subheading">What you can do</Text>
              <Text variant="body" color="mutedForeground">
                {user.permissions.map((p) => ABILITY_LABEL[p] ?? p).join(', ')}.
              </Text>
            </View>

            <TextButton label="Sign out" size="lg" onPress={logout} />
          </ScrollView>
        ) : null}
      </Sheet>

    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <Text variant="heading" style={{ fontSize: 24, lineHeight: 28 }}>
        {value}
      </Text>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
    </View>
  );
}

function LinkRow({ icon, title, detail, onPress }: { icon: React.ReactNode; title: string; detail: string; onPress: () => void }) {
  return (
    <Row onPress={onPress} accessibilityLabel={`${title}. ${detail}`}>
      <Row.Illustration>{icon}</Row.Illustration>
      <Row.Body>
        <Row.Title>{title}</Row.Title>
        <Row.Detail>{detail}</Row.Detail>
      </Row.Body>
      <Row.Trailing>
        <icons.CaretRight size={18} color={colors.mutedForeground} />
      </Row.Trailing>
    </Row>
  );
}

function ToggleRow({ title, detail, value, onChange }: { title: string; detail: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row>
      <Row.Body>
        <Row.Title>{title}</Row.Title>
        <Row.Detail>{detail}</Row.Detail>
      </Row.Body>
      <Row.Trailing>
        <Switch value={value} onValueChange={onChange} accessibilityLabel={title} trackColor={{ false: colors.secondaryPressed, true: colors.success }} thumbColor="#FFFFFF" />
      </Row.Trailing>
    </Row>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, lineHeight: 34, paddingHorizontal: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18, paddingHorizontal: 4 },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.hairline },
});
