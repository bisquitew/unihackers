import * as React from 'react';
import { SvgXml } from 'react-native-svg';
import { PIN_ART, type PinArtKey } from './engine.generated';
import { pinKinds } from './kinds';
import type { PinKind } from './types';

/** The illustration of a pin kind, drawn outside the map (kind picker, sheet header, lists). Decorative. */
export function PinArt({ kind, size = 44 }: { kind: PinKind; size?: number }) {
  return <PinArtByKey art={pinKinds[kind].art} size={size} />;
}

export function PinArtByKey({ art, size = 44 }: { art: PinArtKey; size?: number }) {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56">${PIN_ART[art]}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}
