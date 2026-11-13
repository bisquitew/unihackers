import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AvatarStack, BackLink, PrimaryButton, Screen, Text, TextButton, Timeline } from '@hub/ui';
import { alertById } from '../../src/core/mock/alerts';

export default function AlertDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const alert = alertById(String(id));

  if (!alert) {
    return (
      <Screen tabBar={false}>
        <BackLink label="Alerts" onPress={() => router.back()} />
        <Text variant="heading" accessibilityRole="header">
          Alert not found
        </Text>
        <Text variant="body" color="mutedForeground" style={{ marginTop: 8 }}>
          It may have been resolved. Go back to your alerts.
        </Text>
      </Screen>
    );
  }

  const isUtility = alert.module === 'utilities';
  return (
    <Screen
      tabBar={false}
      footer={
        <>
          <PrimaryButton label={isUtility ? 'Tell me when it’s back' : 'Tell me about updates'} size="lg" />
          <TextButton label={isUtility ? 'My building has it too' : 'This affects me too'} size="lg" />
        </>
      }
    >
      <BackLink label="Alerts" onPress={() => router.back()} />
      {/* The answer is the headline. No repeated illustration: the row the user tapped already carried it. */}
      <Text variant="heading" accessibilityRole="header">
        {alert.headline}
      </Text>
      <Text variant="body" color="mutedForeground" style={styles.context}>
        {alert.context}
      </Text>
      <Timeline steps={alert.steps} />
      <View style={styles.confirm}>
        <AvatarStack
          label={`${alert.confirmedBy} neighbours confirmed this`}
          people={[{ initials: 'MA', tone: 'apricot' }, { initials: 'DR', tone: 'blue' }, { initials: 'IO', tone: 'mint' }]}
        />
        <Text variant="body" style={{ fontSize: 15, lineHeight: 20 }}>
          {alert.confirmedBy} neighbours confirmed this
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  context: { marginTop: 8, marginBottom: 18 },
  confirm: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
});
