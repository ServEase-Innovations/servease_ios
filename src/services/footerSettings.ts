import utilsInstance from "./utilsInstance";

export type FooterSocialKey = "x" | "instagram" | "youtube" | "linkedin" | "facebook";

export type FooterSocialLinks = Record<FooterSocialKey, string>;

export type FooterSettings = {
  helplinePhone: string;
  joinUsPhone: string;
  social: FooterSocialLinks;
};

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  helplinePhone: "+918792827744",
  joinUsPhone: "+918792827754",
  social: {
    x: "https://x.com/ServEaso",
    instagram: "https://www.instagram.com/serveaso?igsh=cHQxdmdubnZocjRn",
    youtube: "https://www.youtube.com/@ServEaso",
    linkedin: "https://www.linkedin.com/in/serveaso-media-7b7719381/",
    facebook: "https://www.facebook.com/profile.php?id=61572701168852",
  },
};

export const FOOTER_SOCIAL_ORDER: FooterSocialKey[] = [
  "x",
  "instagram",
  "youtube",
  "linkedin",
  "facebook",
];

function normalizeSocial(raw: unknown): FooterSocialLinks {
  const base = { ...DEFAULT_FOOTER_SETTINGS.social };
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Record<string, unknown>;
  for (const key of FOOTER_SOCIAL_ORDER) {
    const url = s[key];
    if (typeof url === "string" && /^https?:\/\//i.test(url.trim())) {
      base[key] = url.trim();
    }
  }
  return base;
}

export function normalizeFooterSettings(raw: unknown): FooterSettings {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_FOOTER_SETTINGS, social: { ...DEFAULT_FOOTER_SETTINGS.social } };
  }
  const f = raw as Record<string, unknown>;
  const helpline =
    typeof f.helplinePhone === "string" && f.helplinePhone.trim()
      ? f.helplinePhone.trim()
      : DEFAULT_FOOTER_SETTINGS.helplinePhone;
  const joinUs =
    typeof f.joinUsPhone === "string" && f.joinUsPhone.trim()
      ? f.joinUsPhone.trim()
      : DEFAULT_FOOTER_SETTINGS.joinUsPhone;
  return {
    helplinePhone: helpline,
    joinUsPhone: joinUs,
    social: normalizeSocial(f.social),
  };
}

let cachedFooter: FooterSettings | null = null;
let inFlight: Promise<FooterSettings> | null = null;

/** Footer contact + social links from utils public platform settings. */
export async function fetchPublicFooterSettings(): Promise<FooterSettings> {
  if (cachedFooter) return cachedFooter;
  if (inFlight) return inFlight;

  inFlight = utilsInstance
    .get<{ success?: boolean; settings?: { footer?: unknown } }>(
      "/api/platform-settings/public"
    )
    .then((res) => {
      const footer = normalizeFooterSettings(res.data?.settings?.footer);
      cachedFooter = footer;
      return footer;
    })
    .catch(() => {
      cachedFooter = {
        ...DEFAULT_FOOTER_SETTINGS,
        social: { ...DEFAULT_FOOTER_SETTINGS.social },
      };
      return cachedFooter;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return phone;
}
