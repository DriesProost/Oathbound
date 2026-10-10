import { ChevronDown, LockKeyhole, MapPin } from "lucide-react";
import { landmarks } from "./journey";
import "./journey-scenes.css";
import { landmarkScene } from "./journeyArt";

type Landmark = (typeof landmarks)[number];

function Scene({ stop, reached }: { stop: Landmark; reached: boolean }) {
  const src = landmarkScene(stop.id);
  return (
    <div className={"postcard-scene" + (reached ? "" : " scene-unrevealed")}>
      {src && <img src={src} alt={reached ? stop.sceneAlt : ""}
        aria-hidden={!reached} width={1440} height={810} decoding="async" loading="lazy" />}
      <span className="scene-status">
        {reached ? <MapPin size={14} aria-hidden="true" /> : <LockKeyhole size={14} aria-hidden="true" />}
        {reached ? "Reached" : "Yet to be revealed"}
      </span>
    </div>
  );
}
function Caption({ stop, interactive = false }: { stop: Landmark; interactive?: boolean }) {
  return (
    <div className="postcard-caption">
      <div><h3>{stop.name}</h3><p>{stop.km} km from the Keep</p></div>
      {interactive && <span className="postcard-action">
        <span className="when-closed">Read chapter</span>
        <span className="when-open">Close chapter</span>
        <ChevronDown size={18} aria-hidden="true" />
      </span>}
    </div>
  );
}
export default function JourneyStories({ distance }: { distance: number }) {
  const current = landmarks.findLast(stop => distance >= stop.km) || landmarks[0];
  return (
    <section className="journey-story" aria-label="Tales of the Oakhaven road">
      <span className="eyebrow">TALES OF THE OAKHAVEN ROAD</span>
      <h2>The road that remembers</h2>
      <p className="muted">Each place holds a chapter. The world reveals itself as you walk. Reached chapters stay here to reread, at your own pace.</p>
      <div className="journey-postcards">
        {landmarks.map(stop => distance >= stop.km ? (
          <details key={stop.id} className="journey-postcard" data-landmark={stop.id}
            open={stop.id === current.id}>
            <summary>
              <Caption stop={stop} interactive />
              <Scene stop={stop} reached />
            </summary>
            <div className="postcard-body">
              <h4>{stop.title}</h4>
              {stop.story.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              <div className="postcard-teaser">
                <strong>The road ahead</strong><p>{stop.teaser}</p>
              </div>
            </div>
          </details>
        ) : (
          <article key={stop.id} className="journey-postcard postcard-unreached"
            data-landmark={stop.id} aria-label={`${stop.name}, unreached`}>
            <Caption stop={stop} />
            <Scene stop={stop} reached={false} />
            <p className="unrevealed-note">Its chapter will be revealed at {stop.km} km.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
