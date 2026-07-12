/** Shared layout values for docked mobile tab bar + sheets above it */
export const MOBILE_TAB_BAR_CONTENT_HEIGHT = 52;
export const MOBILE_TAB_BAR_EDGE_PAD = 4;
/** Space between the top border and tab icons/labels */
export const MOBILE_TAB_BAR_TOP_PAD = 8;

/** Bottom inset on the tab shell — keep in sync with NavigationFooter mobileNavShell. */
export const getMobileTabBarBottomPad = (safeBottom: number) =>
  safeBottom > 0
    ? Math.max(MOBILE_TAB_BAR_EDGE_PAD, safeBottom - 18)
    : MOBILE_TAB_BAR_EDGE_PAD;

/** Total height from screen bottom (tab row + top/bottom shell padding). */
export const getMobileTabBarHeight = (safeBottom: number) =>
  MOBILE_TAB_BAR_CONTENT_HEIGHT +
  MOBILE_TAB_BAR_TOP_PAD +
  getMobileTabBarBottomPad(safeBottom);