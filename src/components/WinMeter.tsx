interface Props {
  prob: number; // 0.0 – 1.0
  className?: string;
}

export function WinMeter({ prob, className = "" }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, prob)) * 100);
  const barColor =
    pct >= 56 ? "bg-win" : pct <= 44 ? "bg-loss" : "bg-accent";
  const labelColor =
    pct >= 56 ? "text-win" : pct <= 44 ? "text-loss" : "text-accent";

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between items-baseline">
        <span className="text-2xs text-text-secondary">Win probability</span>
        <span className={`text-xs font-mono font-semibold ${labelColor}`}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-surface-border rounded-pill overflow-hidden">
        <div
          className={`h-full rounded-pill transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
