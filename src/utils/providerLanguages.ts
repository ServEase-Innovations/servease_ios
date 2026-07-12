/** Normalize provider language fields from API / legacy payloads. */
export function normalizeProviderLanguages(
  value: unknown,
  ...fallbacks: unknown[]
): string[] {
  const candidates = [value, ...fallbacks];

  for (const candidate of candidates) {
    if (candidate == null || candidate === "") continue;

    if (Array.isArray(candidate)) {
      const parts = candidate
        .map((item) => String(item).trim())
        .filter(Boolean);
      if (parts.length) return parts;
      continue;
    }

    if (typeof candidate === "string") {
      const parts = candidate
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (parts.length) return parts;
    }
  }

  return [];
}

export function readProviderLanguages(provider: {
  languageKnown?: string | string[] | null;
  languageknown?: string | string[] | null;
  languages?: string | string[] | null;
} | null | undefined): string[] {
  if (!provider) return [];
  return normalizeProviderLanguages(
    provider.languageKnown,
    provider.languageknown,
    provider.languages
  );
}
