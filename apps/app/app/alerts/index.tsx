import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BackLink, Row, RowGroup, Screen, Section, Text, colors, icons, minTarget, moduleArt } from '@hub/ui';
import { useAlerts } from '../../src/core/alerts';
import type { AlertItem } from '../../src/core/mock/alerts';

function AlertRow({ alert, onPress }: { alert: AlertItem; onPress: () => void }) {
  const Art = moduleArt[alert.module];
  return (
    <Row onPress={onPress} accessibilityLabel={`${alert.title}. ${alert.detail}`}>
      <Row.Illustration>
        <Art size={44} />
      </Row.Illustration>
      <Row.Body>
        <Row.Title>{alert.title}</Row.Title>
        <Row.Detail>{alert.detail}</Row.Detail>
      </Row.Body>
      <Row.Trailing>{alert.trailing.kind === 'new' ? <Row.NewDot /> : <Row.Time>{alert.trailing.text}</Row.Time>}</Row.Trailing>
    </Row>
  );
}

export default function AlertsScreen() {
  const router = useRouter();
  const all = useAlerts();
  const alertsFor = (group: AlertItem['group']) => all.filter((a) => a.group === group);
  const open = (id: string) => router.push({ pathname: '/alerts/[id]', params: { id } } as any);
  return (
    <Screen tabBar={false}>
      <BackLink label="Home" onPress={() => router.back()} />
      <View style={styles.titleRow}>
        <Text variant="heading" accessibilityRole="header" style={{ paddingHorizontal: 4 }}>
          Alerts
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Alert settings" style={styles.settings}>
          <icons.SlidersHorizontal size={24} weight="bold" color={colors.foreground} />
        </Pressable>
      </View>

      <Section title="For your places">
        <RowGroup>
          {alertsFor('places').map((a) => (
            <AlertRow key={a.id} alert={a} onPress={() => open(a.id)} />
          ))}
        </RowGroup>
      </Section>

      <Section title="Around the city">
        <RowGroup>
          {alertsFor('city').map((a) => (
            <AlertRow key={a.id} alert={a} onPress={() => open(a.id)} />
          ))}
        </RowGroup>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settings: { width: minTarget, height: minTarget, alignItems: 'center', justifyContent: 'center' },
});
