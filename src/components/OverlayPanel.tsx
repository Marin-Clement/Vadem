import { type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  /** When true the panel has no padding (use for full-bleed layouts) */
  flush?: boolean;
}

export function OverlayPanel({ children, className = "", flush }: Props) {
  return (
    <div
      className={[
        "bg-surface/80 backdrop-blur-md border border-surface-border",
        "rounded-xl shadow-panel animate-slide-up",
        flush ? "" : "p-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
