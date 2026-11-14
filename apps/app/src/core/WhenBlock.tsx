import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, colors, icons } from '@hub/ui';

/** "Tonight at 19:30" becomes { day: 'Tonight', time: '19:30' }. Free text without a time keeps the whole text as the day. */
export function splitWhen(dateTime: string) {
  const [day, time] = dateTime.split(' at ');
  return { day: day || dateTime, time: time || '' };
}

/** The small date that leads an event or ticket row: the day in muted text over the time in large type. */
export function WhenBlock({ dateTime }: { dateTime?: string }) {
  const when = splitWhen(dateTime ?? '');
  return (
    <View style={styles.when}>
      {dateTime ? (
        <>
          <Text variant="rowDetail" color="mutedForeground" numberOfLines={1} style={styles.day}>
            {when.day}
          </Text>
          {when.time ? (
            <Text variant="heading" numberOfLines={1} style={styles.time}>
              {when.time}
            </Text>
          ) : (
            <icons.CalendarBlank size={26} weight="bold" color={colors.foreground} />
          )}
        </>
      ) : (
        <icons.Ticket size={28} weight="bold" color={colors.foreground} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  when: { width: 62, gap: 2 },
  day: { fontSize: 12, lineHeight: 14 },
  time: { fontSize: 22, lineHeight: 28 },
});
