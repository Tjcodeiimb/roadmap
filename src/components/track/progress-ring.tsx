// Circular progress ring — shown in the course header next to Leave Course.
// SVG donut with a numeric pct in the center and tick marks at each topic slot.
export function ProgressRing({
  pct,
  done,
  total,
  color,
}: {
  pct: number;
  done: number;
  total: number;
  color: string;
}) {
  const size = 56;
  const cx = size / 2;
  const cy = size / 2;
  const strokeW = 4;
  const r = (size - strokeW) / 2 - 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative shrink-0" title={`${done} of ${total} topics complete`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={strokeW}
          strokeOpacity={0.12}
        />
        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        {/* Tick marks around ring for each topic */}
        {total > 0 && Array.from({ length: total }).map((_, i) => {
          const angle = (i / total) * 2 * Math.PI;
          const outerR = r + strokeW / 2 + 1;
          const innerR = r - strokeW / 2 - 1;
          const x1 = cx + outerR * Math.cos(angle);
          const y1 = cy + outerR * Math.sin(angle);
          const x2 = cx + innerR * Math.cos(angle);
          const y2 = cy + innerR * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="var(--ink)"
              strokeWidth={1.5}
              strokeOpacity={0.35}
            />
          );
        })}
      </svg>
      {/* Center label — upright (counter-rotate the SVG's -90deg) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[13px] font-extrabold leading-none" style={{ color }}>
          {pct}
        </span>
        <span className="text-[8px] font-bold uppercase tracking-wider text-ink-3">%</span>
      </div>
    </div>
  );
}
