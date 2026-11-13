import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { colors, fonts, type ColorName } from './tokens';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'section'
  | 'subheading'
  | 'bodyLarge'
  | 'body'
  | 'rowTitle'
  | 'rowDetail'
  | 'label'
  | 'caption';

export const typeScale: Record<TextVariant, TextStyle> = {
  display: { fontFamily: fonts.display800, fontSize: 52, lineHeight: 58 },
  title: { fontFamily: fonts.display800, fontSize: 36, lineHeight: 42 },
  heading: { fontFamily: fonts.display800, fontSize: 26, lineHeight: 32 },
  section: { fontFamily: fonts.display800, fontSize: 19, lineHeight: 24 },
  subheading: { fontFamily: fonts.display700, fontSize: 20, lineHeight: 26 },
  bodyLarge: { fontFamily: fonts.ui500, fontSize: 18, lineHeight: 26 },
  body: { fontFamily: fonts.ui400, fontSize: 16, lineHeight: 24 },
  rowTitle: { fontFamily: fonts.ui700, fontSize: 16, lineHeight: 22 },
  rowDetail: { fontFamily: fonts.ui500, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.ui600, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.ui500, fontSize: 12, lineHeight: 16 },
};

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: ColorName;
};

/** The only way text is drawn in the app: a variant from the type scale and a semantic colour. */
export function Text({ variant = 'body', color = 'foreground', style, ...rest }: TextProps) {
  return <RNText {...rest} style={[typeScale[variant], { color: colors[color] }, style]} />;
}
