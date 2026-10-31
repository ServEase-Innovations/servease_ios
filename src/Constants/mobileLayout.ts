/** Shared layout values for docked mobile tab bar + sheets above it */
export const MOBILE_TAB_BAR_CONTENT_HEIGHT = 62;
export const MOBILE_TAB_BAR_EDGE_PAD = 14;
/** Space between the top border and tab icons/labels */
export const MOBILE_TAB_BAR_TOP_PAD = 6;

/** Bottom inset on the tab shell — keep in sync with NavigationFooter mobileNavShell. */
export const getMobileTabBarBottomPad = (safeBottom: number) =>
  safeBottom > 0
    ? Math.max(6, safeBottom - 16)
    : 10;

/** Total height from screen bottom (tab row + top/bottom shell padding). */
export const getMobileTabBarHeight = (safeBottom: number) =>
  MOBILE_TAB_BAR_CONTENT_HEIGHT +
  MOBILE_TAB_BAR_TOP_PAD +
  getMobileTabBarBottomPad(safeBottom);