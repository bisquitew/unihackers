import * as React from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, durations, radii } from './tokens';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Dim the screen behind and close on tap. Default true. A non-modal sheet (scrim=false) leaves the screen behind usable, e.g. a map. */
  scrim?: boolean;
  /** Reports the sheet's height (0 when closed) so a map can keep its camera clear of it. */
  onHeight?: (height: number) => void;
  /** Lift the sheet above something at the bottom (the floating tab bar). It then floats with all corners rounded. */
  bottomOffset?: number;
  accessibilityLabel: string;
  children: React.ReactNode;
};

/** A bottom sheet: grab handle, soft shadow, slides up on transform only. Respects reduced motion and the bottom safe area. */
export function Sheet({ visible, onClose, scrim = true, onHeight, bottomOffset = 0, accessibilityLabel, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = React.useState(visible);
  const [reduced, setReduced] = React.useState(false);
  const y = React.useRef(new Animated.Value(600)).current;
  const height = React.useRef(0);

  React.useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
  }, []);

  React.useEffect(() => {
    const duration = reduced ? 0 : durations.sheet;
    if (visible) {
      setMounted(true);
      Animated.timing(y, { toValue: 0, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(y, { toValue: height.current || 600, duration: reduced ? 0 : 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
          onHeight?.(0);
        }
      });
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const onLayout = (e: LayoutChangeEvent) => {
    height.current = e.nativeEvent.layout.height;
    if (visible) onHeight?.(height.current);
  };

  if (!mounted) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {scrim ? <Pressable accessibilityLabel="Close" accessibilityRole="button" onPress={onClose} style={styles.scrim} /> : null}
      <Animated.View
        accessibilityViewIsModal={scrim}
        accessibilityLabel={accessibilityLabel}
        onLayout={onLayout}
        style={[
          styles.sheet,
          bottomOffset > 0
            ? { bottom: bottomOffset, left: 12, right: 12, borderRadius: radii.sheet, paddingBottom: 18 }
            : { paddingBottom: Math.max(insets.bottom, 12) + 12 },
          { transform: [{ translateY: y }] },
        ]}
      >
        <View style={styles.grab} />
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26, 16, 51, 0.34)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: 18,
    paddingTop: 10,
    boxShadow: '0 -14px 40px -12px rgba(26, 16, 51, 0.35)',
  } as any,
  grab: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: 'rgba(26, 16, 51, 0.16)', marginBottom: 12 },
});
