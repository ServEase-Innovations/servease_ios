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
  primary: "#0099CC", // Deep vibrant cyan (brand color)
  primaryContainer: "#0088BB", // Deeper cyan
  onPrimary: "#ffffff", // White text on cyan
  onPrimaryContainer: "#F0FDFF", // Very light cyan text
  secondary: "#0077AA", // Rich deep cyan
  secondaryContainer: "#D5F2FF", // Very light cyan container
  onSecondary: "#ffffff",
  onSecondaryContainer: "#005580", // Dark cyan text
  secondaryFixed: "#EBF8FF", // Barely-there cyan tint
  onSecondaryFixedVariant: "#006699", // Medium-dark cyan
  surface: "#FAFBFC", // Subtle cool gray
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F8FAFC", // Very light cool gray
  onSurface: "#1E293B", // Slate gray text
  onSurfaceVariant: "#475569", // Medium slate
  outline: "#94A3B8", // Muted slate for borders
  outlineVariant: "#E2E8F0", // Very light slate
  error: "#DC2626",
  
  // Service card colors using deeper cyan variations (vibrant yet professional)
  cookCard: "#0099CC", // Deep cyan (matches hero)
  cookCardLight: "#D5F2FF", // Very light cyan
  maidCard: "#0088BB", // Rich deeper cyan
  maidCardLight: "#E0F6FF", // Barely cyan
  nannyCard: "#0077AA", // Medium-deep cyan
  nannyCardLight: "#EBF8FF", // Light cyan
} as const;

// Brand cyan gradient from JustLife t-shirt (deeper, more saturated)
export const HOME_HERO_GRADIENT = ["#0099CC", "#0088BB"] as const;

/** MaidBtnPrimary gradient (135deg) */
export const PRIMARY_BUTTON_GRADIENT = [BRAND.accent, "#2563eb"] as const;
