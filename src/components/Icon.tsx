interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
}

export function Icon({ name, size = 16, stroke = 1.6 }: IconProps) {
  const props = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none" as const, stroke: "currentColor", strokeWidth: stroke,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":       return <svg {...props}><path d="M3 11l9-8 9 8" /><path d="M5 9v11h14V9" /></svg>;
    case "user":       return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>;
    case "history":    return <svg {...props}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>;
    case "draft":      return <svg {...props}><rect x="3" y="4" width="7" height="7"/><rect x="14" y="4" width="7" height="7"/><rect x="3" y="13" width="7" height="7"/><rect x="14" y="13" width="7" height="7"/></svg>;
    case "build":      return <svg {...props}><path d="M14 4l6 6-10 10H4v-6z"/><path d="M13 5l6 6"/></svg>;
    case "macro":      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5 5l14 14M19 5L5 19"/></svg>;
    case "overlay":    return <svg {...props}><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M3 21h18"/><circle cx="17" cy="10" r="2"/></svg>;
    case "settings":   return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a7.97 7.97 0 0 0 0-6l1.6-2-2-2-2 1.6a7.97 7.97 0 0 0-6 0L9 5 7 7l1.6 2a7.97 7.97 0 0 0 0 6L7 17l2 2 2-1.6a7.97 7.97 0 0 0 6 0L19 19l2-2z"/></svg>;
    case "search":     return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>;
    case "minus":      return <svg {...props}><path d="M5 12h14"/></svg>;
    case "square":     return <svg {...props}><rect x="5" y="5" width="14" height="14" rx="1"/></svg>;
    case "x":          return <svg {...props}><path d="M18 6L6 18M6 6l12 12"/></svg>;
    case "trend-up":   return <svg {...props}><path d="M3 17l6-6 4 4 7-7"/><path d="M14 8h6v6"/></svg>;
    case "trend-down": return <svg {...props}><path d="M3 7l6 6 4-4 7 7"/><path d="M14 16h6v-6"/></svg>;
    case "chevron-right": return <svg {...props}><path d="M9 6l6 6-6 6"/></svg>;
    case "chevron-left":  return <svg {...props}><path d="M15 6l-6 6 6 6"/></svg>;
    case "chevron-down":  return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
    case "play":       return <svg {...props} fill="currentColor" stroke="none"><path d="M6 4l14 8-14 8z"/></svg>;
    case "alert":      return <svg {...props}><path d="M12 3l10 17H2z"/><path d="M12 9v5"/><circle cx="12" cy="17.5" r="0.6" fill="currentColor"/></svg>;
    case "spark":      return <svg {...props}><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>;
    case "shield":     return <svg {...props}><path d="M12 2l8 3v7c0 5-3.5 9-8 10-4.5-1-8-5-8-10V5z"/></svg>;
    case "crosshair":  return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>;
    case "filter":     return <svg {...props}><path d="M3 4h18l-7 8v7l-4-2v-5z"/></svg>;
    case "calendar":   return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case "trophy":     return <svg {...props}><path d="M6 4h12v3a6 6 0 1 1-12 0z"/><path d="M6 7H3v2a3 3 0 0 0 3 3M18 7h3v2a3 3 0 0 1-3 3"/><path d="M9 17h6v3H9z"/></svg>;
    case "swap":       return <svg {...props}><path d="M7 4l-4 4 4 4M3 8h14M17 12l4 4-4 4M21 16H7"/></svg>;
    case "lock":       return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>;
    case "spinner":    return <svg {...props} style={{animation: "spin-slow 1.4s linear infinite"}}><path d="M12 3a9 9 0 1 1-9 9" /></svg>;
    default:           return null;
  }
}
