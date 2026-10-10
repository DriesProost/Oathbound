import {useId} from 'react';
import { knightAppearance } from './appearance';
import { characterSheet } from './characterSheets';
import {bodyBuilds, type State} from './model';
import type { Attribute } from './config';
export default function KnightArt({ renown = 0, xp = {}, weight, today }: {
  renown?: number; xp?: Partial<Record<Attribute, number>>; weight?: State['weight']; today?: string;
}) {
  const look = knightAppearance(renown, xp, weight, today);
  const sheet = characterSheet(look.stage, look.beard, look.body);
  const id=useId().replace(/:/g,'');
  function artwork(complexion=false) {
    const column = sheet.largeOnly ? look.beard : bodyBuilds.indexOf(look.body);
    const [sourceX, sourceY, sourceWidth, sourceHeight, centerX] = sheet.bounds[Number(look.groomed)*3+column];
    // Keep the person's torso central while fitting all asymmetric equipment.
    const reach=Math.max(centerX-sourceX,sourceX+sourceWidth-centerX);
    const scale=Math.min(320/reach,960/sourceHeight);
    const width=sourceWidth*scale, height=sourceHeight*scale;
    const left=320-(centerX-sourceX)*scale, top=(960-height)/2;
    const clip=`portrait-${id}-${complexion?'face':'base'}`;
    return <svg className={complexion ? 'knight-complexion' : undefined} viewBox="0 0 640 960" aria-hidden="true"
      style={complexion ? {filter:`brightness(${look.faceBrightness}) saturate(${look.faceSaturation})`} : undefined}>
      <defs><clipPath id={clip}><rect x={left} y={top} width={width} height={height} /></clipPath></defs>
      <g clipPath={`url(#${clip})`}><image href={sheet.src}
        x={left-sourceX*scale} y={top-sourceY*scale}
        width={sheet.width*scale} height={sheet.height*scale} /></g>
    </svg>;
  }
  return <div className="knight-illustration" role="img" aria-label={`${look.rank}: ${look.description}`}
    data-body-build={look.body} data-grooming={look.groomed?'well-kept':'untidy'} data-beard={look.beard}>
    <div className="knight-figure" style={{transform:`scaleX(${look.buildScale})`}}>
      {artwork()}{look.vitality>0 && artwork(true)}
    </div>
  </div>;
}
