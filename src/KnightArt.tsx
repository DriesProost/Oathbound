import {useId} from 'react';
import { knightAppearance } from './appearance';
import { characterSheet } from './characterSheets';
import {bodyBuilds, type State} from './model';
import type { Attribute } from './config';
export default function KnightArt({ renown = 0, xp = {}, weight, today, portrait = 'classic', placement }: {
  renown?: number; xp?: Partial<Record<Attribute, number>>; weight?: State['weight']; today?: string; portrait?: State['portrait'];
  placement?: 'keep';
}) {
  const look = knightAppearance(renown, xp, weight, today, portrait);
  const sheet = characterSheet(look.stage, look.beard, look.body, portrait);
  const id=useId().replace(/:/g,'');
  function artwork(complexion=false) {
    const column = sheet.largeOnly ? look.beard : bodyBuilds.indexOf(look.body);
    const index = Number(look.groomed)*3+column;
    const [sourceX, sourceY, sourceWidth, sourceHeight, centerX] = sheet.bounds[index];
    // Keep the person's torso central while fitting all asymmetric equipment.
    const reach=Math.max(centerX-sourceX,sourceX+sourceWidth-centerX);
    const scale=Math.min(320/reach,960/sourceHeight);
    const width=sourceWidth*scale, height=sourceHeight*scale;
    const left=320-(centerX-sourceX)*scale, top=(960-height)/2;
    const clip=`portrait-${id}-${complexion?'face':'base'}`;
    return <svg className={complexion ? 'knight-complexion' : undefined} viewBox="0 0 640 960" aria-hidden="true"
      style={{...(placement === 'keep' ? {position:'absolute', inset:0, display:'block', width:'100%', height:'100%', maxWidth:'100%', margin:0} as const : {}),
        ...(complexion ? {filter:`brightness(${look.faceBrightness}) saturate(${look.faceSaturation})`} : {})}}>
      <defs><clipPath id={clip}>{sheet.clips?.[index]
        ? <path d={sheet.clips[index]} transform={`translate(${left-sourceX*scale} ${top-sourceY*scale}) scale(${scale})`} />
        : <rect x={left} y={top} width={width} height={height} />}</clipPath></defs>
      <g clipPath={`url(#${clip})`}><image href={sheet.src}
        x={left-sourceX*scale} y={top-sourceY*scale}
        width={sheet.width*scale} height={sheet.height*scale} /></g>
    </svg>;
  }
  return <div className="knight-illustration" role="img" aria-label={`${look.rank}: ${look.description}`}
    style={placement === 'keep' ? {width:'calc(100% - 16px)', maxWidth:203, height:'auto', maxHeight:'none', aspectRatio:'2 / 3', flexShrink:0} : undefined}
    data-portrait={portrait}
    data-body-build={look.body} data-grooming={look.groomed?'well-kept':'untidy'} data-beard={look.beard}>
    <div className="knight-figure" style={{transform:`scaleX(${look.buildScale})`}}>
      {artwork()}{look.vitality>0 && artwork(true)}
    </div>
  </div>;
}
