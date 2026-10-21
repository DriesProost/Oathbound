import {useId} from 'react';
import {campaignArt} from './assets';
import type {State} from '../model';
import {retinue} from '../retinue';
import type {KeepArea} from '../keep';
import {keepStageNames} from '../keep';
import './living.css';
export function Landscape({location='forest',weather='Pale light',dusk=false}:{location?:string;weather?:string;dusk?:boolean}){
 const id=useId().replace(/:/g,''),art=campaignArt.journey[location as keyof typeof campaignArt.journey],rain=/rain/i.test(weather);
 return <div className={`campaign-landscape ${rain?'with-rain':''} ${dusk?'at-dusk':''}`} role="img" aria-label={`${location}, ${weather}`}>
 {art?.image?<img src={art.image} alt=""/>:<svg viewBox="0 0 900 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id={`sky-${id}`} x2="0" y2="1"><stop stopColor={dusk?'#71707a':'#9dada7'}/><stop offset="1" stopColor="#d5c8a4"/></linearGradient></defs><path d="M0 0H900V400H0Z" fill={`url(#sky-${id})`}/><circle cx="700" cy="85" r="36" fill="#e7d4a5" opacity=".55"/><path d="M0 220Q140 120 300 205T610 180T900 210V400H0Z" fill="#7b8b7a"/><path d="M0 270Q200 190 420 235T900 245V400H0Z" fill="#506554"/><path d="M405 400Q380 300 535 240Q460 295 550 400" fill="#a29578"/>
 {['forest','fields'].includes(location)?<>{[50,150,735,840].map((x,i)=><g key={x} transform={`translate(${x} ${80+i%2*30})`}><path d="M-9 300L-4 55H5L13 300" fill="#394b3d"/><path d="M0 0L-65 140L-38 140L-85 235H85L38 140H65Z" fill="#455c49"/></g>)}</>:<g fill="#78796b" stroke="#404b43" strokeWidth="3"><path d="M540 245V110H620V245M530 110V90H550V104H570V90H590V104H610V90H630V110Z"/><path d="M563 245V205Q580 180 597 205V245" fill="#313f36"/><path d="M555 130H566V155H555ZM594 130H605V155H594Z" fill="#303b33"/>{location==='monastery'&&<path d="M330 245V175L420 125L510 175V245M350 245V190Q370 170 390 190V245M410 245V190Q430 170 450 190V245M470 245V190Q490 170 510 190V245"/>}</g>}
 <path d="M0 365Q190 340 350 370T900 350V400H0Z" fill="#354b3a" opacity=".9"/><path className="distant-birds" d="M170 65q10-10 20 0q10-10 20 0m60 15q8-8 16 0q8-8 16 0" fill="none" stroke="#3e4a44" strokeWidth="2"/></svg>}
 <div className="scene-mist" aria-hidden="true"/>{rain&&<div className="scene-rain" aria-hidden="true"/>}<span className="scene-caption">{location.replaceAll('-',' ')} · {weather}</span></div>;
}
export function KeepAtmosphere({state}:{state:State}){
 const present=retinue.filter(r=>state.world.milestones.some(m=>m.kind==='retinue'&&m.id===r.id));
 return <div className="keep-atmosphere"><Landscape location="keep" weather={state.living.story.weather} dusk/><div className="hearth-glow" aria-hidden="true"/><p>{present.length?`${present[0].name} is about the ${present[0].location.toLowerCase()}.`:'A place by the hearth, and a road beyond the door.'}</p></div>;
}
export function RoomVignette({state,area,stage}:{state:State;area:KeepArea;stage:number}){
 const residents=retinue.filter(m=>m.location===area.title&&state.world.milestones.some(r=>r.kind==='retinue'&&r.id===m.id)),relics=state.world.milestones.filter(m=>m.kind==='relic'&&m.location===area.title),art=area.artwork?.[stage]??campaignArt.rooms[area.id]?.[stage]?.image;
 if(art)return <img className="keep-room-image" src={art} alt={`${area.title}, ${keepStageNames[stage]}`}/>;
 return <svg className={`keep-room-image room-vignette room-stage-${stage}`} viewBox="0 0 360 180" role="img" aria-label={`${keepStageNames[stage]} ${area.title}. ${residents.map(m=>m.name).join(', ')}. ${relics.map(r=>r.title).join(', ')}`}>
 <path d="M0 0H360V180H0Z" fill="#4b5149"/><path d="M15 160V35L90 10H270L345 35V160Z" fill="#817b65"/><path d="M30 156V48H330V156Z" fill="#a49776"/><path d="M140 120V45Q180-5 220 45V120Z" fill="#4f625a" stroke="#b7ad8e" strokeWidth="6"/><path d="M180 18V118M140 70H220" stroke="#c0b394" strokeWidth="4"/><path d="M0 158H360V180H0Z" fill="#5d5140"/>
 {stage>0&&Array.from({length:stage+1},(_,i)=><g key={i} transform={`translate(${30+i*27} 78)`}><path d="M0 58V0H21V58M0 28H21" stroke="#594b35" fill="#796949" strokeWidth="3"/>{area.id==='library'&&<path d="M4 4V24M10 4V24M16 4V24M4 32V52M12 32V52" stroke="#c8b690" strokeWidth="4"/>}</g>)}
 <path d="M95 145V123H270V145M112 145V164M254 145V164" fill="#705638" stroke="#4e412f" strokeWidth="4"/>
 {area.id==='garden'&&[110,145,185,225,260].map(x=><g key={x}><path d={`M${x} 132V96m0 20q-25-20-15-25q18 0 15 25m0-10q22-25 28-12q-5 15-28 12`} fill="#57674b" stroke="#3c513c" strokeWidth="2"/></g>)}
 {area.id==='scout-post'&&<path d="M115 126L145 104L183 117L210 101L249 121L224 136L180 124L149 140Z" fill="#d4c59c" stroke="#87764e"/>}
 {['gatehouse','yard'].includes(area.id)&&<g stroke="#cdc6ae" strokeWidth="4"><path d="M267 125V44m-13 21h26M300 140V62m-12 18h24"/><path d="M245 80H278L274 110L262 126L249 110Z" fill="#4c655d"/></g>}
 <g className="scene-candle"><path d="M237 120V100H245V120Z" fill="#d4c5a1"/><path d="M241 100Q230 88 241 80Q251 91 241 100" fill="#ecc37b"/></g>
 {relics.map((r,i)=><g key={r.id} transform={`translate(${120+i*21} 115)`}><title>{r.title}</title><path d="M-5 3V-10L0-15L5-10V3Z" fill="#c3a260" stroke="#514831"/></g>)}
 {residents.map((m,i)=><g key={m.id} transform={`translate(${285-i*37} 120)`}><title>{m.name}</title><circle cy="-23" r="8" fill="#c2b394"/><path d="M-9-12H9L16 25H-16Z" fill={m.id==='scholar'?'#5e6151':'#5d4d42'}/><path d="M-8 22L-10 43M8 22L10 43" stroke="#413b30" strokeWidth="6"/></g>)}
 </svg>;
}
