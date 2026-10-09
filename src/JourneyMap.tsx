import { useFeedbackPulse } from "./feedback/Feedback";
import { useEffect, useRef, useState } from "react";
import { Trees, Flag } from "lucide-react";
import { landmarks as stops } from "./journey";
const routes = [
  "M70 260 C60 180 145 260 195 165",
  "M195 165 C255 60 355 290 425 230",
  "M425 230 C485 180 460 70 560 100",
];
export default function JourneyMap({ distance }: { distance: number }) {
  const [pulse] = useFeedbackPulse(1800);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const [marker, setMarker] = useState({ x: 70, y: 260 });
  const routeDistance = stops.at(-1)!.km;
  const travelled = Math.min(Math.max(distance, 0), routeDistance);
  const currentIndex = stops.findLastIndex((stop) => distance >= stop.km);
  const current = stops[Math.max(0, currentIndex)],
    next = stops[currentIndex + 1];
  useEffect(() => {
    const index = Math.max(
      0,
      Math.min(
        stops.length - 2,
        stops.findLastIndex((stop) => travelled >= stop.km),
      ),
    );
    const path = paths.current[index];
    if (path) {
      const t =
        (travelled - stops[index].km) / (stops[index + 1].km - stops[index].km);
      const point = path.getPointAtLength(path.getTotalLength() * t);
      setMarker({ x: point.x, y: point.y });
    }
  }, [travelled]);
  return (
    <div
      className={
        "journey-atlas" +
        (pulse?.events.some((e) => e.kind === "landmark")
          ? " journey-just-reached"
          : "")
      }
    >
      <div className="map-sheet">
        <span className="map-caption">A SURVEY OF THE OAKHAVEN ROAD</span>
        <svg
          viewBox="0 0 640 340"
          role="img"
          aria-label={`Route from Your Keep through Old Mill and Wayfarer’s Inn to Oakhaven. ${travelled} of ${routeDistance} km travelled.`}
        >
          <path
            d="M0 128Q140 96 214 225T430 318T640 282"
            fill="none"
            stroke="#8baca7"
            strokeWidth="5"
            opacity=".38"
          />
          <path
            d="M0 135Q140 103 207 232T430 325T640 289"
            fill="none"
            stroke="#8baca7"
            strokeWidth="1"
            opacity=".35"
          />
          <g fill="none" stroke="#a69773" strokeWidth="1" opacity=".3">
            <path d="M300 70q65-30 120 0M308 82q55-23 104 0M470 292q40-22 90-9M482 304q28-13 65-5" />
          </g>
          <g color="#7e8b69" opacity=".5">
            <Trees x={103} y={72} width={35} height={35} />
            <Trees x={122} y={101} width={26} height={26} />
            <Trees x={313} y={225} width={34} height={34} />
            <Trees x={348} y={242} width={25} height={25} />
            <Trees x={481} y={24} width={32} height={32} />
          </g>
          {routes.map((path, i) => {
            const length = stops[i + 1].km - stops[i].km,
              covered = Math.max(0, Math.min(travelled - stops[i].km, length));
            return (
              <g key={path}>
                <path
                  ref={(node) => {
                    paths.current[i] = node;
                  }}
                  d={path}
                  fill="none"
                  stroke="#9b8460"
                  strokeWidth="3"
                  strokeDasharray="4 6"
                />
                <path
                  d={path}
                  fill="none"
                  stroke="#4e6745"
                  strokeWidth="3"
                  pathLength={length}
                  strokeDasharray={`${covered} ${length + 1}`}
                />
              </g>
            );
          })}
          {stops.map((stop) => {
            const Icon = stop.icon,
              reached = distance >= stop.km;
            return (
              <g key={stop.name} color={reached ? "#425d39" : "#988b6c"}>
                <circle
                  cx={stop.x}
                  cy={stop.y}
                  r="19"
                  fill="#f2e9d2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <Icon x={stop.x - 12} y={stop.y - 12} width={24} height={24} />
                <text
                  className="map-place-name"
                  x={stop.x}
                  y={stop.y + 39}
                  textAnchor="middle"
                >
                  {stop.name === "Your Keep" ? "The Keep" : stop.name}
                </text>
              </g>
            );
          })}
          <g
            className="map-marker"
            transform={`translate(${marker.x},${marker.y})`}
          >
            <circle r="9" fill="#884c3b" stroke="#f8efdb" strokeWidth="3" />
            <circle r="3" fill="#e4c992" />
          </g>
          <g
            transform="translate(590,280)"
            stroke="#a38b5b"
            strokeWidth="1"
            fill="none"
          >
            <path d="M0-22V22M-22 0H22M-11-11L11 11M-11 11L11-11" />
            <path d="M0-22L5-6 0-9-5-6Z" fill="#a38b5b" />
          </g>
        </svg>
        <div className="map-key">
          <span>
            <i />
            Your position · {travelled.toFixed(1)} km
          </span>
          <span>{routeDistance} km route</span>
        </div>
      </div>
      <ol className="route-landmarks">
        {stops.map((stop) => {
          const Icon = stop.icon,
            reached = distance >= stop.km;
          return (
            <li
              key={stop.name}
              className={
                (reached ? "reached " : "") +
                (stop.name === next?.name ? "next-destination" : "")
              }
              aria-current={stop.name === current.name ? "step" : undefined}
            >
              <Icon size={19} />
              <strong>{stop.name}</strong>
              <span>
                {stop.km} km ·{" "}
                {reached
                  ? "Reached"
                  : stop.name === next?.name
                    ? "Next destination"
                    : "Ahead"}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="route-inscription">
        <Flag size={19} />
        <div>
          <span className="route-note-label">
            {next ? "THE ROAD AHEAD" : "A DESTINATION REACHED"}
          </span>
          <strong>
            {next
              ? `${(next.km - distance).toFixed(1)} km to ${next.name}`
              : "Oakhaven reached"}
          </strong>
          <p>{current.inscription}</p>
        </div>
      </div>
    </div>
  );
}
