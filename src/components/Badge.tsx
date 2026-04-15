import { type ReactNode } from "react";

type Variant = "default" | "accent" | "win" | "loss" | "muted";

const variants: Record<Variant, string> = {
  default: "bg-surface-raised text-text-secondary border-surface-border",
  accent:  "bg-accent/10 text-accent border-accent/30",
  win:     "bg-win/10 text-win border-win/30",
  loss:    "bg-loss/10 text-loss border-loss/30",
  muted:   "bg-surface-raised text-text-muted border-surface-border",
};

interface Props {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: Props) {
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-pill",
        "text-2xs font-medium border",
        variants[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
