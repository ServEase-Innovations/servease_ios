/**
 * Brand tokens aligned with servase-ui:
 * - MaidServiceDialog.styles.ts (booking accent, text, surfaces)
 * - chromeBar.ts (header/footer chrome gradient)
 * - Header.css / BookingSuccessDialog (logo blues)
 */
export const BRAND = {
  accent: "#00BFFF", // Cyan - main brand color
  accentSoft: "#E0F2FE", // Light cyan
  accentDark: "#0891B2", // Dark cyan
  logoLight: "#00BFFF",
  logoDark: "#0891B2",
  bookingNavy: "#0c1e3d",
  bookingSky: "#00BFFF", // Cyan
  skyCta: "#00BFFF", // Cyan
  text: "#0f172a",
  textMuted: "#64748b",
  line: "#e2e8f0",
  canvas: "#f1f5f9",
  surface: "#ffffff",
  chromeStart: "#020617",
  chromeMid: "#0b2a5c",
  chromeEnd: "#082f49",
  headerTint: "#E0F2FE", // Light cyan
  footerTint: "#E0F2FE", // Light cyan
} as const;

/** LinearGradient color stops (left → right unless noted). */
export const GRADIENTS = {
  chrome: [BRAND.chromeStart, BRAND.chromeMid, BRAND.chromeEnd] as const,
  bookingHeader: [BRAND.bookingNavy, BRAND.accent, BRAND.bookingSky] as const,
  hero: [BRAND.bookingNavy, BRAND.accent, BRAND.bookingSky] as const,
  login: ["#00BFFF", "#06B6D4"] as const, // Cyan gradient
  success: ["#00BFFF", "#06B6D4", "#0891B2"] as const, // Cyan gradient
  walletLight: ["#051a4a", BRAND.accent, BRAND.bookingSky] as const,
  walletDark: ["#041433", BRAND.bookingNavy, BRAND.accent] as const,
  serviceCardCook: ["#00BFFF", "#06B6D4"] as const, // Cyan gradient
  serviceCardMaid: ["#00BFFF", "#06B6D4"] as const, // Cyan gradient
  serviceCardNanny: ["#00BFFF", "#06B6D4"] as const, // Cyan gradient
} as const;

export const BOOKING_HEADER_GRADIENT = [...GRADIENTS.bookingHeader];

/** Material-style tokens for customer home (HTML mockup). */
export const HOME_M3 = {
  primary: "#00BFFF", // Cyan primary (bright cyan)
  primaryContainer: "#0891B2", // Dark cyan
  onPrimary: "#ffffff",
  onPrimaryContainer: "#E0F2FE", // Light cyan
  secondary: "#00BFFF", // Cyan
  secondaryContainer: "#E0F2FE", // Light cyan
  onSecondary: "#ffffff",
  onSecondaryContainer: "#0891B2", // Dark cyan
  secondaryFixed: "#E0F2FE", // Light cyan
  onSecondaryFixedVariant: "#0891B2", // Dark cyan
  surface: "#f7f9fb",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f2f4f6",
  onSurface: "#191c1e",
  onSurfaceVariant: "#43474e",
  outline: "#74777f",
  outlineVariant: "#c4c6cf",
  error: "#ba1a1a",
  
  // Service card colors using cyan variations
  cookCard: "#00BFFF", // Bright cyan (matches hero)
  cookCardLight: "#E0F2FE", // Light cyan
  maidCard: "#06B6D4", // Medium cyan
  maidCardLight: "#E0F6FF", // Very light cyan
  nannyCard: "#0891B2", // Dark cyan
  nannyCardLight: "#EBF8FF", // Light cyan
} as const;

export const HOME_HERO_GRADIENT = ["#00BFFF", "#0891B2"] as const; // Cyan gradient

/** MaidBtnPrimary gradient (135deg) */
export const PRIMARY_BUTTON_GRADIENT = ["#00BFFF", "#06B6D4"] as const; // Cyan gradient
