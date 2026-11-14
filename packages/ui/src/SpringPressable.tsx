import * as React from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  /** Like Pressable's style, a function gets { pressed }. */
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  /** How small it gets while held. */
  scaleTo?: number;
};

/**
 * A Pressable that squishes while held and springs back with a little overshoot when let go, the same on iOS and Android.
 * The scale runs on the native driver, so it stays smooth while the JS thread is busy.
 */
export function SpringPressable({ style, scaleTo = 0.93, onPressIn, onPressOut, ...rest }: Props) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = React.useState(false);
  const spring = (toValue: number) => Animated.spring(scale, { toValue, useNativeDriver: true, speed: 34, bounciness: toValue === 1 ? 16 : 0 }).start();
  const resolved = typeof style === 'function' ? style({ pressed }) : style;
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        setPressed(true);
        spring(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        spring(1);
        onPressOut?.(e);
      }}
      style={[resolved, { transform: [{ scale }] }]}
    />
  );
}
