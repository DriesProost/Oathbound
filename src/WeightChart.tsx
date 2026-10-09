import { orderedMeasurements, weightTrend, formatKg } from "./weight";
import { formatDay } from "./presentation";
import type { WeighIn } from "./model";
const ordinal = (date: string) => Date.parse(date + "T00:00:00Z") / 86400000;
const axisDate = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
export default function WeightChart({
  measurements,
}: {
  measurements: WeighIn[];
}) {
  const raw = orderedMeasurements(measurements),
    trend = weightTrend(raw);
  if (!raw.length)
    return (
      <div className="weight-chart-empty">
        <p>A dated entry begins your weight ledger.</p>
        <small>No missing dates are filled in.</small>
      </div>
    );
  const width = 440,
    height = 230,
    left = 65,
    right = 18,
    top = 16,
    bottom = 40;
  const first = ordinal(raw[0].date),
    last = ordinal(raw.at(-1)!.date);
  const low = Math.min(...raw.map((m) => m.grams)),
    high = Math.max(...raw.map((m) => m.grams)),
    padding = Math.max(1000, (high - low) * 0.15),
    min = Math.max(0, low - padding),
    max = high + padding;
  const x = (date: string) =>
    last === first
      ? (left + width - right) / 2
      : left +
        ((ordinal(date) - first) / (last - first)) * (width - left - right);
  const y = (grams: number) =>
    top + ((max - grams) / (max - min)) * (height - top - bottom);
  const ticks = [...new Set([first, Math.floor((first + last) / 2), last])].map(
    (n) => new Date(n * 86400000).toISOString().slice(0, 10),
  );
  const groups: (typeof trend)[] = [];
  for (const point of trend) {
    const prior = groups.at(-1)?.at(-1);
    if (
      !prior ||
      ordinal(point.date) - ordinal(prior.date) > 7 ||
      raw.findIndex((m) => m.date === point.date) -
        raw.findIndex((m) => m.date === prior.date) >
        1
    )
      groups.push([point]);
    else groups.at(-1)!.push(point);
  }
  return (
    <figure className="weight-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Recorded body weight and seven-day average in kilograms"
      >
        <title>Weight in kilograms by date</title>
        <desc>
          Filled circles are actual measurements. Dashed lines and hollow
          squares show seven-day averages with at least three actual
          measurements. Gaps do not create weigh-ins.
        </desc>
        {[min, (min + max) / 2, max].map((value) => (
          <g key={value}>
            <line
              x1={left}
              x2={width - right}
              y1={y(value)}
              y2={y(value)}
              className="weight-grid"
            />
            <text x={left - 8} y={y(value) + 4} textAnchor="end">
              {formatKg(value)}
            </text>
          </g>
        ))}
        {ticks.map((date) => (
          <text
            key={date}
            x={x(date)}
            y={height - 13}
            textAnchor={
              first === last
                ? "middle"
                : ordinal(date) === first
                  ? "start"
                  : ordinal(date) === last
                    ? "end"
                    : "middle"
            }
          >
            {axisDate(date)}
          </text>
        ))}
        {raw.length > 1 && (
          <polyline
            points={raw.map((m) => `${x(m.date)},${y(m.grams)}`).join(" ")}
            className="weight-raw-line"
          />
        )}
        {groups.map(
          (group, i) =>
            group.length > 1 && (
              <polyline
                key={i}
                points={group
                  .map((p) => `${x(p.date)},${y(p.meanGrams)}`)
                  .join(" ")}
                className="weight-average-line"
              />
            ),
        )}
        {trend.map((p) => (
          <rect
            key={p.date}
            x={x(p.date) - 3}
            y={y(p.meanGrams) - 3}
            width={6}
            height={6}
            className="weight-average-point"
          >
            <title>
              {formatDay(p.date, true)} · seven-day average{" "}
              {formatKg(p.meanGrams)} · {p.count} actual measurements
            </title>
          </rect>
        ))}{" "}
        {raw.map((m) => (
          <circle
            key={m.id}
            cx={x(m.date)}
            cy={y(m.grams)}
            r={3.8}
            className="weight-point"
            tabIndex={0}
            role="img"
            aria-label={`${formatDay(m.date, true)}: ${formatKg(m.grams)}, recorded measurement`}
          >
            <title>
              {formatDay(m.date, true)} · {formatKg(m.grams)}
            </title>
          </circle>
        ))}
      </svg>
      <figcaption>
        <span>
          <i className="raw-key" />
          Recorded measurements
        </span>
        {trend.length > 0 && (
          <span>
            <i className="average-key" />
            7-day average · at least 3 measurements
          </span>
        )}
      </figcaption>
      <p className="target-help">
        Points are actual entries. Averages use only measurements in the
        trailing seven calendar days; missing dates stay unrecorded.
      </p>
    </figure>
  );
}
