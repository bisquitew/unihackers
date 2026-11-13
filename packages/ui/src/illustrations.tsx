// GENERATED from docs/brand/brand-board.html by a script. Do not edit by hand; redraw on the board and regenerate.
// Flat spot illustrations: filled shapes only, palette colours, no outlines. Decorative, hidden from assistive tech.
import * as React from 'react';
import { Platform } from 'react-native';
import Svg, { Path, Rect, Circle, Ellipse } from 'react-native-svg';

export type ArtProps = { size?: number };

// Decorative: hidden from assistive tech. The native-only props would be invalid DOM attributes on web.
const hidden: Record<string, unknown> =
  Platform.OS === 'web'
    ? { 'aria-hidden': true }
    : { accessible: false, importantForAccessibility: 'no-hide-descendants', accessibilityElementsHidden: true };

type ArtFrameProps = { size?: number; width?: number; height?: number; viewBox: string; children: React.ReactNode };
function Art({ size, width, height, viewBox, children }: ArtFrameProps) {
  return (
    <Svg width={width ?? size} height={height ?? size} viewBox={viewBox} {...(hidden as object)}>
      {children}
    </Svg>
  );
}

export const EventsArt = ({ size = 44 }: ArtProps) => (
  <Art size={size} viewBox="0 0 56 56">
      <Path d="M6 16Q28 30 50 16" fill="none" stroke="#3A2F5C" strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 18L16 21L12 30Z" fill="#3D5BFF" />
      <Path d="M19 22.2L27 23L23 32Z" fill="#12C99B" />
      <Path d="M29 23L37 22.2L33 32Z" fill="#FF7A2F" />
      <Path d="M40 21L48 18L44 30Z" fill="#8FA3FF" />
      <Circle cx="14" cy="44" r="2.5" fill="#FF7A2F" />
      <Circle cx="28" cy="46" r="2" fill="#3D5BFF" />
      <Circle cx="42" cy="43" r="2.5" fill="#12C99B" />
  </Art>
);

export const BuddyArt = ({ size = 44 }: ArtProps) => (
  <Art size={size} viewBox="0 0 56 56">
      <Circle cx="37" cy="23" r="6" fill="#FF7A2F" />
      <Path d="M26 46a11 11 0 0 1 22 0Z" fill="#FF7A2F" />
      <Circle cx="20" cy="22" r="6" fill="#3D5BFF" stroke="#EFEDF5" strokeWidth="2" />
      <Path d="M9 46a11 11 0 0 1 22 0Z" fill="#3D5BFF" stroke="#EFEDF5" strokeWidth="2" />
  </Art>
);

export const ForumArt = ({ size = 44 }: ArtProps) => (
  <Art size={size} viewBox="0 0 56 56">
      <Rect x="22" y="10" width="26" height="20" rx="8" fill="#FFB88A" />
      <Path d="M40 28l6 6v-8Z" fill="#FFB88A" />
      <Rect x="8" y="22" width="30" height="22" rx="9" fill="#3D5BFF" />
      <Path d="M16 42l-4 7 10-5Z" fill="#3D5BFF" />
      <Circle cx="17" cy="33" r="2.2" fill="#fff" />
      <Circle cx="23" cy="33" r="2.2" fill="#fff" />
      <Circle cx="29" cy="33" r="2.2" fill="#fff" />
  </Art>
);

export const TransitArt = ({ size = 44 }: ArtProps) => (
  <Art size={size} viewBox="0 0 56 56">
      <Path d="M22 8h12M28 8v6" fill="none" stroke="#3A2F5C" strokeWidth="2.4" strokeLinecap="round" />
      <Rect x="13" y="14" width="30" height="26" rx="8" fill="#3D5BFF" />
      <Rect x="18" y="18" width="20" height="11" rx="4" fill="#8FA3FF" />
      <Circle cx="21" cy="35" r="2.6" fill="#FF7A2F" />
      <Circle cx="35" cy="35" r="2.6" fill="#FF7A2F" />
      <Path d="M16 49l4-9M40 49l-4-9M10 49h36" fill="none" stroke="#3A2F5C" strokeWidth="2.4" strokeLinecap="round" />
  </Art>
);

export const ParkieArt = ({ size = 44 }: ArtProps) => (
  <Art size={size} viewBox="0 0 56 56">
      <Ellipse cx="28" cy="50" rx="13" ry="2.4" fill="#8FA3FF" />
      <Rect x="26" y="38" width="4" height="12" rx="2" fill="#3A2F5C" />
      <Rect x="11" y="8" width="34" height="32" rx="10" fill="#3D5BFF" />
      <Path d="M22 32V16h6.500a5 5 0 0 1 0 10H22" fill="none" stroke="#fff" strokeWidth="4.500" strokeLinecap="round" strokeLinejoin="round" />
  </Art>
);

export const VisitorInfoArt = ({ size = 44 }: ArtProps) => (
  <Art size={size} viewBox="0 0 56 56">
      <Path d="M8 24l13-4v26L8 50Z" fill="#8FA3FF" />
      <Path d="M21 20l14 4v26l-14-4Z" fill="#6C84FF" />
      <Path d="M35 24l13-4v26l-13 4Z" fill="#8FA3FF" />
      <Path d="M28 10a8 8 0 0 0-8 8c0 6 8 13 8 13s8-7 8-13a8 8 0 0 0-8-8Z" fill="#FF7A2F" />
      <Circle cx="28" cy="18" r="3" fill="#fff" />
  </Art>
);

export const AssistantArt = ({ size = 44 }: ArtProps) => (
  <Art size={size} viewBox="0 0 56 56">
      <Path d="M24 8c1.500 10 7 16 17 17-10 1-15.500 7-17 17-1.500-10-7-16-17-17 10-1 15.500-7 17-17Z" fill="#3D5BFF" />
      <Path d="M43 6c.6 4 2.500 6 6.500 6.500-4 .5-5.900 2.500-6.500 6.500-.6-4-2.500-6-6.500-6.500 4-.5 5.900-2.500 6.500-6.500Z" fill="#FF7A2F" />
      <Circle cx="44" cy="40" r="3" fill="#12C99B" />
      <Circle cx="12" cy="46" r="2" fill="#8FA3FF" />
  </Art>
);

export const UtilitiesArt = ({ size = 44 }: ArtProps) => (
  <Art size={size} viewBox="0 0 56 56">
      <Ellipse cx="28" cy="50" rx="14" ry="2.500" fill="#7EE6C8" />
      <Path d="M28 7S14 23 14 33a14 14 0 0 0 28 0C42 23 28 7 28 7Z" fill="#12C99B" />
      <Path d="M20 34a8 8 0 0 0 6 7" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".85" />
  </Art>
);

export const WalletArt = ({ size = 44 }: ArtProps) => (
  <Art size={size} viewBox="0 0 56 56">
      <Circle cx="36" cy="14" r="7" fill="#FF7A2F" />
      <Circle cx="36" cy="14" r="3.500" fill="#FFB88A" />
      <Rect x="8" y="20" width="40" height="28" rx="9" fill="#12C99B" />
      <Path d="M8 29a9 9 0 0 1 9-9h22a9 9 0 0 1 9 9Z" fill="#0BB58C" />
      <Rect x="33" y="31" width="15" height="10" rx="5" fill="#00704F" />
      <Circle cx="39" cy="36" r="2" fill="#fff" />
  </Art>
);

export const FeedbackArt = ({ size = 44 }: ArtProps) => (
  <Art size={size} viewBox="0 0 56 56">
      <Path d="M28 47C12 36 9 25 15 18c4.500-4.500 10-2 13 3 3-5 8.500-7.500 13-3 6 7 3 18-13 29Z" fill="#12C99B" />
      <Path d="M17 24a6 6 0 0 1 5-4" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".75" />
      <Circle cx="46" cy="12" r="3" fill="#FF7A2F" />
      <Circle cx="10" cy="10" r="2" fill="#3D5BFF" />
  </Art>
);

export const SafetyArt = ({ size = 44 }: ArtProps) => (
  <Art size={size} viewBox="0 0 56 56">
      <Circle cx="28" cy="20" r="15" fill="#FFB88A" />
      <Path d="M19.500 15.500L28 8l8.500 7.500Z" fill="#3A2F5C" />
      <Rect x="20.500" y="15" width="15" height="14" rx="5" fill="#FF7A2F" />
      <Rect x="26.500" y="27" width="3" height="19" fill="#3A2F5C" />
      <Rect x="20" y="45" width="16" height="4" rx="2" fill="#3A2F5C" />
  </Art>
);

export const SmellArt = ({ size = 44 }: ArtProps) => (
  <Art size={size} viewBox="0 0 56 56">
      <Path d="M16 33a8 8 0 0 1 1.500-15.800A10 10 0 0 1 36 15a9 9 0 0 1 2 18Z" fill="#FFB88A" />
      <Path d="M8 41h24a4.500 4.500 0 1 0-4.500-4.500" fill="none" stroke="#A84300" strokeWidth="3" strokeLinecap="round" />
      <Path d="M16 48h20a3.500 3.500 0 1 1-3.500 3.500" fill="none" stroke="#A84300" strokeWidth="3" strokeLinecap="round" />
  </Art>
);

export const DashboardArt = ({ size = 44 }: ArtProps) => (
  <Art size={size} viewBox="0 0 56 56">
      <Rect x="10" y="28" width="10" height="18" rx="4" fill="#3D5BFF" />
      <Rect x="23" y="12" width="10" height="34" rx="4" fill="#12C99B" />
      <Rect x="36" y="21" width="10" height="25" rx="4" fill="#FF7A2F" />
      <Rect x="7" y="48" width="42" height="3" rx="1.500" fill="#3A2F5C" />
  </Art>
);

export const CinemaScene = ({ width = 92 }: { width?: number }) => (
  <Art width={width} height={Math.round((width * 84) / 72)} viewBox="0 0 72 84">
      <Path d="M0 84V36a36 36 0 0 1 72 0v48Z" fill="#1A1033" />
      <Path d="M36 4l1.2 3.300 3.300 1.200-3.300 1.200L36 13l-1.200-3.300-3.300-1.200 3.300-1.200Z" fill="#fff" opacity=".9" />
      <Circle cx="14" cy="22" r="1.400" fill="#fff" opacity=".8" />
      <Circle cx="58" cy="20" r="1.200" fill="#fff" opacity=".7" />
      <Circle cx="52" cy="30" r="1" fill="#fff" opacity=".6" />
      <Rect x="12" y="28" width="48" height="28" rx="4" fill="#fff" />
      <Path d="M0 84v-10a7 7 0 0 1 13-3.500A7 7 0 0 1 24 69a7 7 0 0 1 12-2 7 7 0 0 1 12 2 7 7 0 0 1 11 2.500A7 7 0 0 1 72 74v10Z" fill="#4B3F7A" />
  </Art>
);

export const moduleArt = {
  events: EventsArt,
  buddy: BuddyArt,
  forum: ForumArt,
  transit: TransitArt,
  parkie: ParkieArt,
  visitorInfo: VisitorInfoArt,
  assistant: AssistantArt,
  utilities: UtilitiesArt,
  wallet: WalletArt,
  feedback: FeedbackArt,
  safety: SafetyArt,
  smell: SmellArt,
  dashboard: DashboardArt,
} as const;

export type ModuleArtId = keyof typeof moduleArt;
