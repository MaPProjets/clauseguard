interface ScoreCircleProps {
  score: number;
  size?: number;
}

const ScoreCircle = ({ score, size = 140 }: ScoreCircleProps) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let color = "hsl(var(--destructive))";
  let label = "Contrat à risque";
  let bgColor = "hsl(var(--destructive) / 0.1)";

  if (score > 70) {
    color = "hsl(var(--success))";
    label = "Contrat favorable";
    bgColor = "hsl(var(--success) / 0.1)";
  } else if (score > 40) {
    color = "hsl(var(--warning))";
    label = "À négocier";
    bgColor = "hsl(var(--warning) / 0.1)";
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <span
        className="rounded-full px-3 py-1 text-sm font-semibold"
        style={{ backgroundColor: bgColor, color }}
      >
        {label}
      </span>
    </div>
  );
};

export default ScoreCircle;
