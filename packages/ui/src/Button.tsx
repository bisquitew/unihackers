import * as React from 'react';
import { ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { SpringPressable } from './SpringPressable';
import { colors, fonts, minTarget, radii, shadows } from './tokens';
import { Text } from './Text';

export type ButtonSize = 'lg' | 'md';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  size?: ButtonSize;
  disabled?: boolean;
  /** Shows a spinner in place of the label and disables the button. */
  loading?: boolean;
  accessibilityHint?: string;
};

type Variant = 'primary' | 'secondary' | 'text';

const heights: Record<ButtonSize, number> = { lg: 52, md: minTarget };
const labelSizes: Record<ButtonSize, number> = { lg: 17, md: 15 };
const paddingX: Record<ButtonSize, number> = { lg: 28, md: 20 };

function ButtonBase({ variant, label, onPress, size = 'lg', disabled, loading, accessibilityHint }: ButtonProps & { variant: Variant }) {
  const inactive = disabled || loading;
  return (
    <SpringPressable
      scaleTo={0.95}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => {
        const base: ViewStyle = {
          height: heights[size],
          paddingHorizontal: paddingX[size],
          borderRadius: radii.full,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: inactive ? 0.45 : 1,
        };
        if (variant === 'primary') {
          return [base, { backgroundColor: colors.primary, boxShadow: shadows.primaryGlow } as ViewStyle, pressed && { opacity: 0.94 }];
        }
        if (variant === 'secondary') {
          return [base, { backgroundColor: pressed ? colors.secondaryPressed : colors.secondary }];
        }
        return [base, pressed && { backgroundColor: colors.hairline }];
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.primaryForeground} />
      ) : (
        <Text
          color={variant === 'primary' ? 'primaryForeground' : variant === 'secondary' ? 'secondaryForeground' : 'foreground'}
          style={[styles.label, { fontSize: labelSizes[size], lineHeight: labelSizes[size] + 4 }]}
        >
          {label}
        </Text>
      )}
    </SpringPressable>
  );
}

/** The single main action on a screen. Pink fill, ink label. Use at most one per screen. */
export const PrimaryButton = (props: ButtonProps) => <ButtonBase variant="primary" {...props} />;
/** A lesser action next to a primary. */
export const SecondaryButton = (props: ButtonProps) => <ButtonBase variant="secondary" {...props} />;
/** The quietest option ("Not now"). */
export const TextButton = (props: ButtonProps) => <ButtonBase variant="text" {...props} />;

const styles = StyleSheet.create({
  label: { fontFamily: fonts.ui700 },
});
