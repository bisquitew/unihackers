import React, { useEffect, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { PrimaryButton, RowGroup, Sheet, Text, TextButton } from '@hub/ui';
import { eventsStore } from '../m01-events/eventsStore';
import { BuddyProfile, BuddyRequestForm, BuddyRow } from './BuddyParts';
import { chatStore } from './chatStore';
import { buddyStore, type BuddyListing } from './buddyStore';

interface BuddyModalProps {
  visible: boolean;
  eventId: string;
  eventTitle: string;
  onClose: () => void;
  /** Called when the person taps Message. The caller closes this sheet and shows the chat full screen. */
  onChat: (buddy: BuddyListing) => void;
}

type Step = { kind: 'list' } | { kind: 'profile'; buddy: BuddyListing } | { kind: 'post' };

/** Opened from an event: the people going to that event who want company, one step at a time in a single sheet. */
export function BuddyModal({ visible, eventId, eventTitle, onClose, onChat }: BuddyModalProps) {
  const { height: windowHeight } = useWindowDimensions();
  const sheetMax = Math.round(windowHeight * 0.72);
  const [buddies, setBuddies] = useState<BuddyListing[]>(buddyStore.forEvent(eventId));
  useEffect(() => {
    const sync = () => setBuddies(buddyStore.forEvent(eventId));
    sync();
    return buddyStore.subscribe(sync);
  }, [eventId]);
  const [step, setStep] = useState<Step>({ kind: 'list' });
  useEffect(() => {
    if (visible) setStep({ kind: 'list' });
  }, [visible]);

  return (
    <Sheet modal visible={visible} onClose={onClose} accessibilityLabel="Find someone to go with">
      <ScrollView style={{ maxHeight: sheetMax }} contentContainerStyle={{ gap: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step.kind === 'list' ? (
          <>
            <View style={{ gap: 4 }}>
              <Text variant="heading" accessibilityRole="header">
                Go together
              </Text>
              <Text variant="body" color="mutedForeground">
                People going to {eventTitle} who would like company.
              </Text>
            </View>
            {buddies.length === 0 ? (
              <Text variant="body" color="mutedForeground">
                No one has asked yet. Be the first.
              </Text>
            ) : (
              <RowGroup>
                {buddies.map((b) => (
                  <BuddyRow key={b.id} buddy={b} onPress={() => setStep({ kind: 'profile', buddy: b })} />
                ))}
              </RowGroup>
            )}
            <PrimaryButton label="Find company" size="lg" onPress={() => setStep({ kind: 'post' })} />
          </>
        ) : null}

        {step.kind === 'profile' ? (
          <>
            <BuddyProfile buddy={step.buddy} />
            <PrimaryButton label={chatStore.get(step.buddy.id) ? 'Open chat' : `Message ${step.buddy.userName.split(' ')[0]}`} size="lg" onPress={() => onChat(step.buddy)} />
            <TextButton label="Back to the list" size="lg" onPress={() => setStep({ kind: 'list' })} />
          </>
        ) : null}


        {step.kind === 'post' ? (
          <>
            <BuddyRequestForm
              events={eventsStore.getEvents()}
              fixedEvent={{ id: eventId, title: eventTitle }}
              onSubmit={(v) => {
                buddyStore.add(v);
                setStep({ kind: 'list' });
              }}
            />
            <TextButton label="Back to the list" size="lg" onPress={() => setStep({ kind: 'list' })} />
          </>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}

