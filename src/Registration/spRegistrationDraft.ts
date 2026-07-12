import AsyncStorage from "@react-native-async-storage/async-storage";

const DRAFT_KEY = "@servease/sp-registration-draft";
const OPEN_FLAG_KEY = "@servease/sp-registration-in-progress";
const DRAFT_VERSION = 1;

export type SpRegistrationDraftPayload = {
  version: typeof DRAFT_VERSION;
  savedAt: number;
  activeStep: number;
  formData: Record<string, unknown>;
  selectedLanguages: string[];
  isCookSelected: boolean;
  isNannySelected: boolean;
  currentLocation: { latitude: number; longitude: number; address: string } | null;
  isSameAddress: boolean;
  kycDocumentUrl: string;
  useCustomPassword: boolean;
  selectedDate: string | null;
};

const FILE_FIELD_KEYS = ["panImage", "documentImage", "profileImage"] as const;

export function sanitizeFormDataForDraft(
  formData: Record<string, unknown>
): Record<string, unknown> {
  const copy = { ...formData };
  for (const key of FILE_FIELD_KEYS) {
    copy[key] = null;
  }
  return copy;
}

export function hasMeaningfulDraft(
  draft: SpRegistrationDraftPayload | null | undefined
): boolean {
  if (!draft) return false;
  if (draft.activeStep > 0) return true;

  const fd = draft.formData ?? {};
  const textFields = [
    "firstName",
    "lastName",
    "emailId",
    "mobileNo",
    "buildingName",
    "locality",
    "kycNumber",
    "description",
    "experience",
  ];
  if (textFields.some((key) => String(fd[key] ?? "").trim() !== "")) {
    return true;
  }

  const roles = fd.housekeepingRole;
  if (Array.isArray(roles) && roles.length > 0) return true;

  const permanent = fd.permanentAddress as Record<string, unknown> | undefined;
  if (permanent && Object.values(permanent).some((v) => String(v ?? "").trim() !== "")) {
    return true;
  }

  return Boolean(draft.kycDocumentUrl || fd.profilePic);
}

export async function saveSpRegistrationDraft(
  draft: Omit<SpRegistrationDraftPayload, "version" | "savedAt">
): Promise<void> {
  const payload: SpRegistrationDraftPayload = {
    version: DRAFT_VERSION,
    savedAt: Date.now(),
    ...draft,
  };
  await AsyncStorage.multiSet([
    [DRAFT_KEY, JSON.stringify(payload)],
    [OPEN_FLAG_KEY, "true"],
  ]);
}

export async function loadSpRegistrationDraft(): Promise<SpRegistrationDraftPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SpRegistrationDraftPayload;
    if (!parsed || parsed.version !== DRAFT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function hasSpRegistrationInProgress(): Promise<boolean> {
  try {
    const flag = await AsyncStorage.getItem(OPEN_FLAG_KEY);
    if (flag === "true") return true;
    const draft = await loadSpRegistrationDraft();
    return hasMeaningfulDraft(draft);
  } catch {
    return false;
  }
}

export async function clearSpRegistrationDraft(): Promise<void> {
  await AsyncStorage.multiRemove([DRAFT_KEY, OPEN_FLAG_KEY]);
}
