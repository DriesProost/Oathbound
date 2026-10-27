import {landmarks} from './journey';
import {Landscape} from './living/Atmosphere';
import {landmarkScene} from './journeyArt';
import {routeSteps} from './walking';
import './journey-scenes.css';
export default function JourneyStories({distance}:{distance:number}) {
 return <section className="journey-story" aria-label="Visited places"><h3>Places visited</h3><div className="journey-postcards">{landmarks.filter(stop=>distance>=stop.km).map(stop=><details key={stop.id} className="journey-postcard" data-landmark={stop.id}><summary><div className="postcard-caption"><div><h3>{stop.name}</h3><p>{routeSteps(stop.km)} route steps</p></div><span className="postcard-action">Reread visit</span></div></summary><div className="postcard-scene">{landmarkScene(stop.id)&&<img src={landmarkScene(stop.id)} alt={stop.sceneAlt} width={1440} height={810} loading="lazy"/>}{!landmarkScene(stop.id)&&<Landscape location={'art' in stop?stop.art as string:stop.id} label={stop.name}/>}</div><div className="postcard-body"><h4>{stop.title}</h4>{stop.story.map((p,i)=><p key={i}>{p}</p>)}</div></details>)}</div></section>;
}
