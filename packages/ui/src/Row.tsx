import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, palette } from './tokens';
import { Text } from './Text';

/**
 * The main list pattern: a hairline list on a plain page, no cards.
 * Compound components, composed by the caller:
 *   <Row onPress={...}>
 *     <Row.Illustration><UtilitiesArt /></Row.Illustration>
 *     <Row.Body><Row.Title>Hot water is off</Row.Title><Row.Detail>Strada Gării 2. Back about 18:00.</Row.Detail></Row.Body>
 *     <Row.Trailing><Row.NewDot /></Row.Trailing>
 *   </Row>
 * Use each illustration at most once per screen.
 */
type RowProps = {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};

function RowRoot({ children, onPress, accessibilityLabel }: RowProps) {
  const content = <View style={styles.row}>{children}</View>;
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => (pressed ? { backgroundColor: colors.hairline } : undefined)}
    >
      {content}
    </Pressable>
  );
}

const Illustration = ({ children }: { children: React.ReactNode }) => <View style={styles.illustration}>{children}</View>;
const Body = ({ children }: { children: React.ReactNode }) => <View style={styles.body}>{children}</View>;
const Title = ({ children }: { children: React.ReactNode }) => <Text variant="rowTitle">{children}</Text>;
const Detail = ({ children }: { children: React.ReactNode }) => (
  <Text variant="rowDetail" color="mutedForeground" style={styles.detail}>
    {children}
  </Text>
);
const Trailing = ({ children }: { children: React.ReactNode }) => <View style={styles.trailing}>{children}</View>;
const Time = ({ children }: { children: React.ReactNode }) => (
  <Text variant="rowDetail" color="mutedForeground" style={styles.time}>
    {children}
  </Text>
);
const NewDot = () => <View accessible accessibilityLabel="New" style={styles.newDot} />;
/** A tiny progress meter, value 0..1. */
const Meter = ({ value, label }: { value: number; label?: string }) => (
  <View accessible accessibilityLabel={label} style={styles.meterTrack}>
    <View style={[styles.meterFill, { width: `${Math.round(Math.min(Math.max(value, 0), 1) * 100)}%` }]} />
  </View>
);
/** Event rows lead with a small date instead of an illustration. */
const DateBlock = ({ day, date }: { day: string; date: string }) => (
  <View style={styles.date}>
    <Text variant="rowDetail" color="mutedForeground" style={{ fontSize: 12, lineHeight: 12 }}>
      {day}
    </Text>
    <Text variant="heading" style={{ fontSize: 26, lineHeight: 30 }}>
      {date}
    </Text>
  </View>
);

export const Row = Object.assign(RowRoot, { Illustration, Body, Title, Detail, Trailing, Time, NewDot, Meter, Date: DateBlock });

/** Stacks rows with a 1px hairline between them. */
export function RowGroup({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  return (
    <View>
      {items.map((child, i) => (
        <View key={i}>
          {i > 0 ? <View style={styles.hairline} /> : null}
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 16, paddingHorizontal: 2 },
  illustration: { width: 44, height: 44 },
  body: { flex: 1, minWidth: 0 },
  detail: { marginTop: 1 },
  trailing: { flexShrink: 0, paddingTop: 1 },
  time: { fontSize: 13, lineHeight: 22 },
  newDot: { width: 9, height: 9, borderRadius: 9, backgroundColor: colors.warningDot, marginTop: 7, marginRight: 4 },
  meterTrack: { width: 44, height: 5, borderRadius: 3, marginTop: 9, backgroundColor: 'rgba(36, 56, 201, 0.16)', overflow: 'hidden' },
  meterFill: { height: 5, borderRadius: 3, backgroundColor: palette.blue700 },
  date: { width: 44, alignItems: 'flex-start', gap: 2 },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline },
});
