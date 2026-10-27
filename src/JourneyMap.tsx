import {useState} from 'react';
import {landmarks,routePosition} from './journey';
import {routeSteps} from './walking';
const points=[{x:70,y:180},{x:230,y:80},{x:405,y:175},{x:565,y:85}];
export default function JourneyMap({distance}:{distance:number}) {
 const position=routePosition(distance),[selected,setSelected]=useState<number|null>(null);
 const regions=Math.ceil((landmarks.length-1)/3),region=selected??position.region,stops=landmarks.slice(region*3,region*3+4);
 return <div className="journey-atlas">
 <div className="map-sheet"><div className="route-map-heading"><span className="map-caption">YOUR ROAD</span><label><span className="sr-only">Map region</span><select value={region} onChange={e=>setSelected(Number(e.target.value))}>{Array.from({length:regions},(_,i)=><option key={i} value={i}>{landmarks[i*3].name} → {landmarks[Math.min(i*3+3,landmarks.length-1)].name}</option>)}</select></label></div>
 <svg viewBox="0 0 640 250" role="img" aria-label={`Route from ${stops[0].name} to ${stops.at(-1)!.name}. Your position: ${position.current.name}. ${routeSteps(distance)} estimated route steps.`}>
 <path d="M0 140Q140 100 280 185T640 140" stroke="#8baca7" strokeWidth="5" opacity=".35" fill="none"/>
 {stops.slice(1).map((stop,i)=>{const a=points[i],b=points[i+1],length=stop.km-stops[i].km,covered=Math.max(0,Math.min(distance-stops[i].km,length));return <g key={stop.id}><path d={`M${a.x} ${a.y} C${a.x+60} ${a.y} ${b.x-60} ${b.y} ${b.x} ${b.y}`} stroke="#9b8460" strokeWidth="3" strokeDasharray="4 6" fill="none"/><path d={`M${a.x} ${a.y} C${a.x+60} ${a.y} ${b.x-60} ${b.y} ${b.x} ${b.y}`} stroke="#4e6745" strokeWidth="4" pathLength={length} strokeDasharray={`${covered} ${length+1}`} fill="none"/></g>;})}
 {stops.map((stop,i)=>{const Icon=stop.icon,p=points[i],current=stop.id===position.current.id;return <g key={stop.id} color={distance>=stop.km?'#425d39':'#988b6c'}><circle cx={p.x} cy={p.y} r={current?24:19} fill={current?'#d6dfbd':'#f2e9d2'} stroke="currentColor" strokeWidth={current?3:1.5}/><Icon x={p.x-12} y={p.y-12} width={24} height={24}/><text x={p.x} y={p.y+42} textAnchor="middle" className="map-place-name">{stop.name==='Your Keep'?'The Keep':stop.name}</text>{current&&<text x={p.x} y={p.y-34} textAnchor="middle" className="map-place-name">You are here</text>}</g>;})}
 </svg><div className="map-key"><span>{routeSteps(distance)} route steps travelled</span>{selected!==null&&region!==position.region&&<button className="text-button" onClick={()=>setSelected(null)}>Back to my position</button>}</div></div>
 </div>;
}
