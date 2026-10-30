import React from "react";
import Svg, { Circle, Line, Path, Polygon, Rect } from "react-native-svg";

// Small, dependency-free icon set drawn with react-native-svg so the tab bar
// never depends on an icon font being loaded (a missing font renders as tofu
// boxes, which is what the bar showed before).
function Base({ size = 24, color }: { size?: number; color: string }) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export function HomeIcon({ size, color }: { size?: number; color: string }) {
  return (
    <Svg {...Base({ size, color })}>
      <Path d="M3 10.6 12 3.4l9 7.2" />
      <Path d="M5.6 9.4V20.6h12.8V9.4" />
      <Path d="M9.8 20.6v-6h4.4v6" />
    </Svg>
  );
}

export function SearchIcon({ size, color }: { size?: number; color: string }) {
  return (
    <Svg {...Base({ size, color })}>
      <Circle cx="10.6" cy="10.6" r="6.6" />
      <Line x1="15.4" y1="15.4" x2="20.6" y2="20.6" />
    </Svg>
  );
}

export function PortfolioIcon({ size, color }: { size?: number; color: string }) {
  return (
    <Svg {...Base({ size, color })}>
      <Rect x="3.4" y="12.4" width="4.2" height="8.2" rx="1.2" />
      <Rect x="9.9" y="7.4" width="4.2" height="13.2" rx="1.2" />
      <Rect x="16.4" y="3.4" width="4.2" height="17.2" rx="1.2" />
    </Svg>
  );
}

export function WatchlistIcon({ size, color }: { size?: number; color: string }) {
  return (
    <Svg {...Base({ size, color })}>
      <Polygon points="12,3.2 14.7,8.9 21,9.8 16.5,14.1 17.6,20.4 12,17.4 6.4,20.4 7.5,14.1 3,9.8 9.3,8.9" />
    </Svg>
  );
}

export function PicksIcon({ size, color }: { size?: number; color: string }) {
  return (
    <Svg {...Base({ size, color })}>
      <Path d="M12 3.2a6 6 0 0 0-3.4 10.9c.6.4.9 1 .9 1.7v.6h5v-.6c0-.7.3-1.3.9-1.7A6 6 0 0 0 12 3.2Z" />
      <Line x1="9.8" y1="19.4" x2="14.2" y2="19.4" />
      <Line x1="10.6" y1="21.4" x2="13.4" y2="21.4" />
    </Svg>
  );
}

export function EyeIcon({ size, color }: { size?: number; color: string }) {
  return (
    <Svg {...Base({ size, color })}>
      <Path d="M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12Z" />
      <Circle cx="12" cy="12" r="2.9" />
    </Svg>
  );
}

export function EyeOffIcon({ size, color }: { size?: number; color: string }) {
  return (
    <Svg {...Base({ size, color })}>
      <Path d="M3 3l18 18" />
      <Path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.4 6 9.4 6a17 17 0 0 1-2.6 3.4" />
      <Path d="M6.3 7.5A16.6 16.6 0 0 0 2.6 12S6 18 12 18a9.4 9.4 0 0 0 3.6-.7" />
      <Path d="M9.9 10a2.9 2.9 0 0 0 4.1 4.1" />
    </Svg>
  );
}
