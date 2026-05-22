/** Shared layout values for docked mobile tab bar + sheets above it */
export const MOBILE_TAB_BAR_CONTENT_HEIGHT = 52;
export const MOBILE_TAB_BAR_EDGE_PAD = 4;

/** Total height from screen bottom (tab content + bottom safe inset applied once inside the bar). */
export const getMobileTabBarHeight = (safeBottom: number) =>
  MOBILE_TAB_BAR_EDGE_PAD +
  MOBILE_TAB_BAR_CONTENT_HEIGHT +
  Math.max(safeBottom, MOBILE_TAB_BAR_EDGE_PAD);
