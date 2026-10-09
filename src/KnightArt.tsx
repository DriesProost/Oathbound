import { knightAppearance } from './appearance';
import { characterAssets } from './characterAssets';
import type { Attribute } from './config';
export default function KnightArt({ renown = 0, xp = {} }: { renown?: number; xp?: Partial<Record<Attribute, number>> }) {
  const look = knightAppearance(renown, xp);
  const src = characterAssets[look.stage][look.beard];
  return (
    <div className="knight-illustration" role="img" aria-label={`${look.rank}: ${look.description}`}>
      <div className="knight-figure" style={{transform: `scaleX(${look.buildScale})`}}>
        <img src={src} alt="" width="640" height="960" decoding="async" />
        {look.vitality > 0 && <img className="knight-complexion" src={src} alt="" aria-hidden="true" width="640" height="960" decoding="async"
          style={{filter: `brightness(${look.faceBrightness}) saturate(${look.faceSaturation})`}} />}
      </div>
    </div>
  );
}
