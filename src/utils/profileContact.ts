/** Map customer / provider API payloads to form-friendly contact strings. */

export const parsePrimaryContact = (data: Record<string, unknown> | null | undefined): string => {
  if (!data) return "";
  const raw = String(
    data.mobileNo ?? data.mobileno ?? data.mobile ?? data.contactNumber ?? data.contact ?? ""
  ).trim();
  if (!raw || raw === "0") return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
};

export const parseAlternateContact = (data: Record<string, unknown> | null | undefined): string => {
  if (!data) return "";
  const raw = String(data.alternateNo ?? data.alternateno ?? data.altContactNumber ?? "").trim();
  if (!raw || raw === "0") return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
};

export const extractContactFromPayload = (
  data: Record<string, unknown> | null | undefined
): string => {
  const primary = parsePrimaryContact(data);
  if (primary) return primary;
  if (!data) return "";
  const candidates = [data.phone, data.phoneNo];
  for (const raw of candidates) {
    if (raw == null) continue;
    const value = String(raw).trim();
    if (!value || value === "0") continue;
    return value;
  }
  return "";
};

export const isValidContact = (value: string) => value.replace(/\D/g, "").length >= 10;

export const formatContactDisplay = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length > 10) {
    return `+${digits}`;
  }
  return value;
};
