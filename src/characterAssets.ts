import squire from './assets/knight/squire.webp';
import manAtArms from './assets/knight/man-at-arms.webp';
import knightErrant from './assets/knight/knight-errant.webp';
import knight from './assets/knight/knight.webp';
import banneret from './assets/knight/knight-banneret.webp';
import squireShort from './assets/knight/squire-wisdom1.webp';
import manShort from './assets/knight/man-at-arms-wisdom1.webp';
import errantShort from './assets/knight/knight-errant-wisdom1.webp';
import knightShort from './assets/knight/knight-wisdom1.webp';
import banneretShort from './assets/knight/knight-banneret-wisdom1.webp';
import squireFull from './assets/knight/squire-wisdom2.webp';
import manFull from './assets/knight/man-at-arms-wisdom2.webp';
import errantFull from './assets/knight/knight-errant-wisdom2.webp';
import knightFull from './assets/knight/knight-wisdom2.webp';
import banneretFull from './assets/knight/knight-banneret-wisdom2.webp';
// Imports are fingerprinted by Vite and included in the existing offline shell.
export const characterAssets = [
  [squire, squireShort, squireFull],
  [manAtArms, manShort, manFull],
  [knightErrant, errantShort, errantFull],
  [knight, knightShort, knightFull],
  [banneret, banneretShort, banneretFull],
] as const;
