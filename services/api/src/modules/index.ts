import m01Events from './m01-events';
import m07Buddy from './m07-buddy';
import m08Forum from './m08-forum';
import m09Wallet from './m09-wallet';
import type { ApiModule } from '../types';

export const registeredApiModules: ApiModule[] = [
  m01Events,
  m07Buddy,
  m08Forum,
  m09Wallet,
];

export {
  m01Events,
  m07Buddy,
  m08Forum,
  m09Wallet,
};
