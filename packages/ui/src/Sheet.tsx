import * as React from 'react';
import { AccessibilityInfo, Animated, Dimensions, Easing, Keyboard, Modal, PanResponder, Platform, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
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
  /** Draw the sheet in a full-screen modal layer. Use it when the sheet is opened from inside a scrolling page. */
  modal?: boolean;
  accessibilityLabel: string;
  children: React.ReactNode;
};

/**
 * How tall the on-screen keyboard is right now (0 when hidden). Neither platform moves a bottom-anchored layer for us:
 * iOS draws the keyboard over the app, and Android's window resize does not reach a Modal on an edge-to-edge screen.
 * So anything docked to the bottom (sheets, chat composers) lifts itself by this amount.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = React.useState(0);
  React.useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillChangeFrame' : 'keyboardDidShow', (e) => {
      setHeight(ios ? Math.max(0, Dimensions.get('window').height - e.endCoordinates.screenY) : e.endCoordinates.height);
    });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

/**
 * A bottom sheet: grab handle, soft shadow, slides up on transform only. Respects reduced motion and the bottom safe area.
 * The handle is the way to dismiss it: drag it down (or flick), or tap it. So a sheet needs no Cancel or X button.
 */
export function Sheet({ visible, onClose, scrim = true, onHeight, bottomOffset = 0, modal = false, accessibilityLabel, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = React.useState(visible);
  const [reduced, setReduced] = React.useState(false);
  const y = React.useRef(new Animated.Value(600)).current;
  const drag = React.useRef(new Animated.Value(0)).current; // how far the user has pulled the sheet down
  const height = React.useRef(0);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  const reducedRef = React.useRef(false);
  reducedRef.current = reduced;

  React.useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
  }, []);

  const keyboard = useKeyboardHeight();

  React.useEffect(() => {
    const duration = reduced ? 0 : durations.sheet;
    if (visible) {
      drag.setValue(0);
      setMounted(true);
      Animated.timing(y, { toValue: 0, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(y, { toValue: height.current || 600, duration: reduced ? 0 : 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished) {
          drag.setValue(0);
          setMounted(false);
          onHeight?.(0);
        }
      });
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dragging the handle down: follow the finger, then either close (far enough, or flicked) or spring back.
  const pan = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          if (g.dy > 70 || g.vy > 0.8) {
            Animated.timing(drag, { toValue: height.current || 400, duration: reducedRef.current ? 0 : 150, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => closeRef.current());
          } else {
            Animated.spring(drag, { toValue: 0, bounciness: 5, useNativeDriver: true }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [drag],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    height.current = e.nativeEvent.layout.height;
    if (visible) onHeight?.(height.current);
  };

  if (!mounted) return null;
  const body = (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {scrim ? <Pressable accessibilityLabel="Close" accessibilityRole="button" onPress={onClose} style={styles.scrim} /> : null}
      <Animated.View
        accessibilityViewIsModal={scrim}
        accessibilityLabel={accessibilityLabel}
        onLayout={onLayout}
        style={[
          styles.sheet,
          bottomOffset > 0
            ? { bottom: keyboard > 0 ? keyboard + 8 : bottomOffset, left: 12, right: 12, borderRadius: radii.sheet, paddingBottom: 18 }
            : keyboard > 0
              ? { bottom: keyboard, paddingBottom: 12 }
              : { paddingBottom: Math.max(insets.bottom, 12) + 12 },
          { transform: [{ translateY: Animated.add(y, drag) }] },
        ]}
      >
        <View {...pan.panHandlers} style={styles.handleArea}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" accessibilityHint="Drag down to close" onPress={onClose} style={styles.handleHit}>
            <View style={styles.grab} />
          </Pressable>
        </View>
        {children}
      </Animated.View>
    </View>
  );
  // A modal sheet is drawn above everything (tab bar included) and does not depend on where it is rendered, so it can be
  // used from inside a scrolling page. The keyboard pushes it up on iOS.
  if (modal) {
    return (
      <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {body}
        </View>
      </Modal>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(26, 16, 51, 0.34)' },
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
  // a wide, easy-to-grab strip across the top of the sheet; the visible notch sits in the middle of it
  handleArea: { marginHorizontal: -18, marginTop: -10 },
  handleHit: { height: 36, alignItems: 'center', justifyContent: 'center' },
  grab: { width: 36, height: 5, borderRadius: 3, backgroundColor: 'rgba(26, 16, 51, 0.16)' },
});
