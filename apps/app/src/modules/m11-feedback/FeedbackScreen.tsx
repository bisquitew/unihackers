import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Chip, Field, PrimaryButton, SecondaryButton, Text, TextButton, colors, icons, moduleArt } from '@hub/ui';
import { ModulePage } from '../../core/ModulePage';
import { registeredModuleManifests } from '../index';
import { fetchChangelog, submitFeedback } from './api';
import { FALLBACK_APP_VERSION, SURVEY_URL } from './config';

type Status = 'idle' | 'sending' | 'done' | 'error';

interface Props {
  onOpenChangelog?: () => void;
}

const GENERAL = { id: null as string | null, title: 'The app in general' };
const RATING_WORDS = ['Tap a star', 'Needs work', 'Not great', 'It is okay', 'Good', 'Loving it'];

export function FeedbackScreen({ onOpenChangelog }: Props) {
  const [rating, setRating] = useState(0);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [appVersion, setAppVersion] = useState(FALLBACK_APP_VERSION);

  // The current version is the newest changelog entry, so feedback is grouped per version.
  useEffect(() => {
    fetchChangelog()
      .then((list) => {
        if (list.length) setAppVersion(list[list.length - 1].version);
      })
      .catch(() => {
        /* keep fallback */
      });
  }, []);

  const moduleOptions = useMemo(
    () => [
      GENERAL,
      ...registeredModuleManifests
        .filter((m) => m.status !== 'draft' && m.id !== 'm11-feedback')
        .map((m) => ({ id: m.id as string | null, title: m.title })),
    ],
    [],
  );

  const submit = async () => {
    if (rating === 0) {
      setError('Pick a number of stars first.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await submitFeedback({ rating, moduleId, text: text.trim(), appVersion });
      setStatus('done');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Could not send. Try again.');
    }
  };

  const reset = () => {
    setRating(0);
    setModuleId(null);
    setText('');
    setStatus('idle');
    setError('');
  };

  const extras = (
    <View style={{ gap: 4, marginTop: 8 }}>
      {SURVEY_URL ? <SecondaryButton label="Take the 2 minute survey" size="lg" onPress={() => Linking.openURL(SURVEY_URL)} /> : null}
      {onOpenChangelog ? <TextButton label="See what we changed because of you" size="lg" onPress={onOpenChangelog} /> : null}
    </View>
  );

  if (status === 'done') {
    const Art = moduleArt.feedback;
    return (
      <ModulePage title="Feedback">
        <View style={styles.thanks}>
          <Art size={96} />
          <Text variant="heading" accessibilityRole="header" style={{ textAlign: 'center' }}>
            Thank you!
          </Text>
          <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
            We read every message. What we change because of you shows up in the list of changes.
          </Text>
        </View>
        <View style={{ gap: 4 }}>
          <PrimaryButton label="Send another" size="lg" onPress={reset} />
          {extras}
        </View>
      </ModulePage>
    );
  }

  return (
    <ModulePage title="Feedback">
      <Text variant="body" color="mutedForeground" style={{ marginBottom: 8 }}>
        We are building this app during the hackathon, with your feedback. It takes a minute.
      </Text>

      <View style={styles.block}>
        <Text variant="section" accessibilityRole="header">
          How is the app?
        </Text>
        <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={`Rating: ${rating} out of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} accessibilityRole="button" accessibilityLabel={`${n} ${n === 1 ? 'star' : 'stars'}`} accessibilityState={{ selected: n <= rating }} hitSlop={4} style={styles.star}>
              <icons.Star size={34} weight={n <= rating ? 'fill' : 'regular'} color={n <= rating ? colors.foreground : colors.secondaryPressed} />
            </Pressable>
          ))}
        </View>
        <Text variant="rowDetail" color="mutedForeground">
          {RATING_WORDS[rating]}
        </Text>
      </View>

      <View style={styles.block}>
        <Text variant="section" accessibilityRole="header">
          About which part?
        </Text>
        <View style={styles.chips}>
          {moduleOptions.map((m) => (
            <Chip key={m.id ?? 'general'} label={m.title} selected={m.id === moduleId} onPress={() => setModuleId(m.id)} />
          ))}
        </View>
      </View>

      <View style={styles.block}>
        <Text variant="section" accessibilityRole="header">
          Tell us more
        </Text>
        <Field label="What worked, what did not, what is missing?" value={text} onChangeText={setText} multiline placeholder="Optional" maxLength={2000} />
      </View>

      {error ? (
        <Text variant="label" color="danger" accessibilityRole="alert" style={{ marginTop: 14 }}>
          {error}
        </Text>
      ) : null}

      <View style={{ marginTop: 20, gap: 4 }}>
        <PrimaryButton label="Send feedback" size="lg" loading={status === 'sending'} onPress={submit} />
        {extras}
      </View>
      <Text variant="caption" color="mutedForeground" style={{ textAlign: 'center', marginTop: 12 }}>
        App version {appVersion}
      </Text>
    </ModulePage>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: 22, gap: 10 },
  stars: { flexDirection: 'row', gap: 6 },
  star: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thanks: { alignItems: 'center', gap: 10, paddingVertical: 28, paddingHorizontal: 12 },
});
