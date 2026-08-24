export default function WeightChart({
  points,
}: {
  points: { date: string; weight: number }[];
}) {
  if (points.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-mute">
        Registra al menos dos días para ver tu curva de progreso.
      </p>
    );
  }

  const W = 340;
  const H = 140;
  const PAD_X = 10;
  const PAD_Y = 16;

  const weights = points.map((p) => p.weight);
  let min = Math.min(...weights);
  let max = Math.max(...weights);
  if (max - min < 1) {
    min -= 0.5;
    max += 0.5;
  } else {
    min -= (max - min) * 0.1;
    max += (max - min) * 0.1;
  }

  const x = (i: number) => PAD_X + (i * (W - PAD_X * 2)) / (points.length - 1);
  const y = (w: number) => PAD_Y + ((max - w) * (H - PAD_Y * 2)) / (max - min);

  const line = points
    .map((p, i) => `${x(i).toFixed(1)},${y(p.weight).toFixed(1)}`)
    .join(" ");
  const area = `M${x(0)},${H - PAD_Y} L${line.split(" ").join(" L")} L${x(points.length - 1)},${H - PAD_Y} Z`;

  const last = points[points.length - 1];
  const first = points[0];

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Curva de peso"
      >
        <defs>
          <linearGradient id="wc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d7f542" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#d7f542" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_Y + f * (H - PAD_Y * 2)}
            y2={PAD_Y + f * (H - PAD_Y * 2)}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="3 5"
          />
        ))}
        <path d={area} fill="url(#wc-fill)" />
        <polyline
          points={line}
          fill="none"
          stroke="#d7f542"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={x(points.length - 1)}
          cy={y(last.weight)}
          r="4"
          fill="#d7f542"
        />
        <circle
          cx={x(points.length - 1)}
          cy={y(last.weight)}
          r="7.5"
          fill="none"
          stroke="#d7f542"
          strokeOpacity="0.35"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] font-semibold text-mute">
        <span>{first.weight.toFixed(1)} kg</span>
        <span className="text-accent">{last.weight.toFixed(1)} kg</span>
      </div>
    </div>
  );
}
