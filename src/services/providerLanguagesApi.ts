import providerInstance from './providerInstance';

/** Fallback when the languages API is unavailable (matches providers service). */
const FALLBACK_LANGUAGES = [
  'Assamese',
  'Bengali',
  'Gujarati',
  'Hindi',
  'Kannada',
  'Kashmiri',
  'Marathi',
  'Malayalam',
  'Oriya',
  'Punjabi',
  'Sanskrit',
  'Tamil',
  'Telugu',
  'Urdu',
  'Sindhi',
  'Konkani',
  'Nepali',
  'Manipuri',
  'Bodo',
  'Dogri',
  'Maithili',
  'Santhali',
  'English',
];

let cachedLanguages: string[] | null = null;
let inFlight: Promise<string[]> | null = null;

function normalizeLanguages(payload: unknown): string[] {
  const raw = (payload as { languages?: unknown })?.languages;
  if (!Array.isArray(raw)) return [];
  return raw.map((lang) => String(lang).trim()).filter(Boolean);
}

/** Languages for provider registration and search filters (providers service). */
export async function fetchProviderLanguages(): Promise<string[]> {
  if (cachedLanguages?.length) return cachedLanguages;
  if (inFlight) return inFlight;

  inFlight = providerInstance
    .get<{ languages?: string[] }>('/api/service-providers/languages')
    .then((response) => {
      const languages = normalizeLanguages(response.data);
      cachedLanguages = languages.length ? languages : [...FALLBACK_LANGUAGES];
      return cachedLanguages;
    })
    .catch(() => {
      cachedLanguages = [...FALLBACK_LANGUAGES];
      return cachedLanguages;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export { FALLBACK_LANGUAGES as PROVIDER_REGISTRATION_LANGUAGES_FALLBACK };
