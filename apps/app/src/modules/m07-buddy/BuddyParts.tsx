import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Chip, Field, PrimaryButton, Row, Text, colors } from '@hub/ui';
import { initialsOf, toneFor } from '../../core/people';
import type { EventItem } from '../m01-events/eventsStore';
import type { BuddyListing } from './buddyStore';

/** One buddy request as a list row. */
export function BuddyRow({ buddy, onPress }: { buddy: BuddyListing; onPress: () => void }) {
  return (
    <Row onPress={onPress} accessibilityLabel={`${buddy.userName}, going to ${buddy.eventTitle}${buddy.matchScore ? `, ${buddy.matchScore} percent match` : ''}`}>
      <Avatar initials={initialsOf(buddy.userName)} tone={toneFor(buddy.id)} size={44} />
      <Row.Body>
        <Row.Title>{buddy.userName}</Row.Title>
        <Row.Detail>{buddy.eventTitle}</Row.Detail>
        <Text variant="rowDetail" color="mutedForeground" numberOfLines={2} style={{ marginTop: 2 }}>
          {buddy.bio}
        </Text>
      </Row.Body>
      <Row.Trailing>
        {buddy.matchScore ? (
          <Text variant="label" color="success">
            {buddy.matchScore}% match
          </Text>
        ) : null}
      </Row.Trailing>
    </Row>
  );
}

/** The buddy's profile: who they are, what they like, and an opener to start the conversation. */
export function BuddyProfile({ buddy }: { buddy: BuddyListing }) {
  return (
    <View style={styles.stack}>
      <View style={styles.profileHead}>
        <Avatar initials={initialsOf(buddy.userName)} tone={toneFor(buddy.id)} size={52} />
        <View style={{ flex: 1 }}>
          <Text variant="heading" accessibilityRole="header" style={{ fontSize: 22, lineHeight: 28 }}>
            {buddy.userName}
          </Text>
          <Text variant="rowDetail" color="mutedForeground">
            {buddy.university}
          </Text>
        </View>
        {buddy.matchScore ? (
          <Text variant="label" color="success">
            {buddy.matchScore}% match
          </Text>
        ) : null}
      </View>
      <Text variant="rowDetail" color="mutedForeground">
        Going to {buddy.eventTitle}
      </Text>
      <Text variant="body">{buddy.bio}</Text>
      <View style={styles.tags}>
        {buddy.interests.map((tag) => (
          <Text key={tag} variant="label" color="info">
            #{tag}
          </Text>
        ))}
      </View>
      <View style={styles.opener}>
        <Text variant="caption" color="mutedForeground">
          A good way to start
        </Text>
        <Text variant="body" style={{ fontStyle: 'italic' }}>
          “{buddy.icebreakerPrompt}”
        </Text>
      </View>
    </View>
  );
}

/** The "find company" request form. With `fixedEvent` the event is already known (opened from an event). */
export function BuddyRequestForm({ events, fixedEvent, onSubmit }: { events: EventItem[]; fixedEvent?: { id: string; title: string }; onSubmit: (v: { eventId: string; eventTitle: string; userName: string; bio: string; interests: string[] }) => void }) {
  const [eventId, setEventId] = useState(fixedEvent?.id ?? events[0]?.id ?? '');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const chosen = fixedEvent ?? events.find((e) => e.id === eventId);
  const canPost = name.trim().length > 0 && !!chosen;
  return (
    <View style={styles.stack}>
      <Text variant="heading" accessibilityRole="header">
        Find company
      </Text>
      <Text variant="body" color="mutedForeground">
        Tell others who you are and which event you are going to. They can start a chat with you.
      </Text>
      {fixedEvent ? (
        <Text variant="label">Going to {fixedEvent.title}</Text>
      ) : (
        <View style={{ gap: 8 }}>
          <Text variant="subheading">Which event?</Text>
          <View style={styles.tags}>
            {events.map((e) => (
              <Chip key={e.id} label={e.title} selected={eventId === e.id} onPress={() => setEventId(e.id)} />
            ))}
          </View>
        </View>
      )}
      <Field label="Your name" value={name} onChangeText={setName} placeholder="Elena" maxLength={40} />
      <Field label="About you" value={bio} onChangeText={setBio} multiline placeholder="What do you study or like to talk about?" maxLength={200} />
      <Field label="Interests, separated by commas" value={interests} onChangeText={setInterests} placeholder="cinema, jazz, photography" maxLength={80} />
      <PrimaryButton
        label="Post request"
        size="lg"
        disabled={!canPost}
        onPress={() =>
          chosen &&
          onSubmit({
            eventId: chosen.id,
            eventTitle: chosen.title,
            userName: name,
            bio,
            interests: interests
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  profileHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opener: { gap: 2, paddingLeft: 12, borderLeftWidth: 3, borderLeftColor: colors.secondaryPressed },
});
