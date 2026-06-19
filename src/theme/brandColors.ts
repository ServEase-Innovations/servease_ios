/**
 * Brand tokens aligned with servase-ui:
 * - MaidServiceDialog.styles.ts (booking accent, text, surfaces)
 * - chromeBar.ts (header/footer chrome gradient)
 * - Header.css / BookingSuccessDialog (logo blues)
 */
export const BRAND = {
  accent: "#193f79",
  accentSoft: "#e8f1ff",
  accentDark: "#0848b0",
  logoLight: "#246097",
  logoDark: "#0b375f",
  bookingNavy: "#0c1e3d",
  bookingSky: "#4f8ff7",
  skyCta: "#0ea5e9",
  text: "#0f172a",
  textMuted: "#64748b",
  line: "#e2e8f0",
  canvas: "#f1f5f9",
  surface: "#ffffff",
  chromeStart: "#020617",
  chromeMid: "#0b2a5c",
  chromeEnd: "#082f49",
  headerTint: "#c8e4ff",
  footerTint: "#b8dbfc",
} as const;

/** LinearGradient color stops (left → right unless noted). */
export const GRADIENTS = {
  chrome: [BRAND.chromeStart, BRAND.chromeMid, BRAND.chromeEnd] as const,
  bookingHeader: [BRAND.bookingNavy, BRAND.accent, BRAND.bookingSky] as const,
  hero: [BRAND.bookingNavy, BRAND.accent, BRAND.bookingSky] as const,
  login: ["#4f8ad5", "#7b56bb"] as const,
  success: ["#0a2a66", "#3b4cca", "#575aff"] as const,
  walletLight: ["#051a4a", BRAND.accent, BRAND.bookingSky] as const,
  walletDark: ["#041433", BRAND.bookingNavy, BRAND.accent] as const,
  serviceCardCook: ["#1e3a8a", BRAND.bookingSky] as const,
  serviceCardMaid: ["#1e40af", BRAND.bookingSky] as const,
  serviceCardNanny: ["#1e3a8a", "#2563eb"] as const,
} as const;

export const BOOKING_HEADER_GRADIENT = [...GRADIENTS.bookingHeader];

/** Material-style tokens for customer home (HTML mockup). */
export const HOME_M3 = {
  primary: "#001630",
  primaryContainer: "#0d2b4d",
  onPrimary: "#ffffff",
  onPrimaryContainer: "#7993bb",
  secondary: "#335baf",
  secondaryContainer: "#82a6ff",
  onSecondary: "#ffffff",
  onSecondaryContainer: "#00388b",
  secondaryFixed: "#dae2ff",
  onSecondaryFixedVariant: "#124296",
  surface: "#f7f9fb",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f2f4f6",
  onSurface: "#191c1e",
  onSurfaceVariant: "#43474e",
  outline: "#74777f",
  outlineVariant: "#c4c6cf",
  error: "#ba1a1a",
} as const;

export const HOME_HERO_GRADIENT = [HOME_M3.primary, HOME_M3.primaryContainer] as const;

/** MaidBtnPrimary gradient (135deg) */
export const PRIMARY_BUTTON_GRADIENT = [BRAND.accent, "#2563eb"] as const;
