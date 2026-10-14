/** Tree that grows with `progress` (0 -> 1). Pure SVG, no dependencies. */
export function GrowingTree({ progress }: { progress: number }) {
  const p = Math.max(0, Math.min(1, progress));
  const trunkHeight = 20 + p * 90;
  const leafStage = (min: number) => Math.max(0, Math.min(1, (p - min) / 0.22));

  const canopy = [
    { cx: 100, cy: 92, r: 34, at: 0.2 },
    { cx: 68, cy: 112, r: 24, at: 0.38 },
    { cx: 132, cy: 112, r: 24, at: 0.5 },
    { cx: 84, cy: 70, r: 20, at: 0.66 },
    { cx: 118, cy: 68, r: 18, at: 0.78 },
  ];

  return (
    <svg viewBox="0 0 200 200" className="h-56 w-56" role="img" aria-label="Growing tree">
      <ellipse cx="100" cy="182" rx={30 + p * 22} ry="7" className="fill-muted" />
      <rect
        x="96"
        y={178 - trunkHeight}
        width="8"
        height={trunkHeight}
        rx="4"
        className="fill-accent"
      />
      {p > 0.34 && (
        <path
          d={`M100 ${150 - p * 20} L74 ${128 - p * 16}`}
          className="stroke-accent"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {p > 0.46 && (
        <path
          d={`M100 ${142 - p * 20} L128 ${122 - p * 14}`}
          className="stroke-accent"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {canopy.map((c, i) => {
        const s = leafStage(c.at);
        if (s <= 0) return null;
        return (
          <circle
            key={i}
            cx={c.cx}
            cy={c.cy + (1 - s) * 12}
            r={c.r * s}
            className="fill-primary"
            opacity={0.55 + 0.45 * s}
          />
        );
      })}
      {p >= 1 && <circle cx="100" cy="96" r="58" className="fill-primary" opacity="0.12" />}
    </svg>
  );
}
