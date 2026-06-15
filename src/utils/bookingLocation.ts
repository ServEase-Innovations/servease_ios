function readCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "function") {
    try {
      const resolved = value();
      return typeof resolved === "number" && Number.isFinite(resolved) ? resolved : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function readLatLngPoint(point: unknown): { lat: number; lng: number } | null {
  if (!point || typeof point !== "object") return null;
  const p = point as Record<string, unknown>;
  const lat = readCoordinate(p.lat);
  const lng = readCoordinate(p.lng);
  if (lat != null && lng != null) return { lat, lng };
  return null;
}

export function resolveLocationCoords(
  location: unknown
): { lat: number; lng: number } | null {
  if (!location || typeof location !== "object") return null;
  const loc = location as Record<string, unknown>;

  const fromGeometry = readLatLngPoint(
    (loc.geometry as { location?: unknown } | undefined)?.location
  );
  if (fromGeometry) return fromGeometry;

  const fromRoot = readLatLngPoint(loc);
  if (fromRoot) return fromRoot;

  const latitude = readCoordinate(loc.latitude);
  const longitude = readCoordinate(loc.longitude);
  if (latitude != null && longitude != null) {
    return { lat: latitude, lng: longitude };
  }

  return null;
}

export function resolveLocationLat(location: unknown): number | null {
  return resolveLocationCoords(location)?.lat ?? null;
}

export function resolveLocationLng(location: unknown): number | null {
  return resolveLocationCoords(location)?.lng ?? null;
}

export function formatServiceAddressFromGeoLocation(location: unknown): string {
  if (!location || typeof location !== "object") return "";
  const loc = location as Record<string, unknown>;

  if (typeof loc.formatted_address === "string" && loc.formatted_address.trim()) {
    return loc.formatted_address.trim();
  }

  const addressList = loc.address;
  if (Array.isArray(addressList) && addressList[0]?.formatted_address) {
    return String(addressList[0].formatted_address).trim();
  }

  const lat = resolveLocationLat(location);
  const lng = resolveLocationLng(location);
  if (lat != null && lng != null) {
    return `Map location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
  }

  return "";
}

/** Stable key for provider-search invalidation when coordinates change. */
export function buildLocationSearchKey(location: unknown): string {
  const coords = resolveLocationCoords(location);
  if (coords) {
    return `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
  }
  const address = formatServiceAddressFromGeoLocation(location);
  return address || "";
}

export function hasValidBookingLocation(location: unknown): boolean {
  const address = formatServiceAddressFromGeoLocation(location);
  if (address) return true;
  return resolveLocationLat(location) != null && resolveLocationLng(location) != null;
}

export type SavedLocationEntry = {
  name: string;
  location: Record<string, unknown>;
};

export function formatCustomerDisplayName(appUser: unknown): string {
  if (!appUser || typeof appUser !== "object") return "";
  const u = appUser as Record<string, unknown>;
  if (typeof u.name === "string" && u.name.trim()) return u.name.trim();
  const first = String(u.given_name || u.firstname || u.firstName || "").trim();
  const last = String(u.family_name || u.lastname || u.lastName || "").trim();
  return `${first} ${last}`.trim();
}

export function formatCustomerPhone(appUser: unknown): string {
  if (!appUser || typeof appUser !== "object") return "";
  const u = appUser as Record<string, unknown>;
  const phone = u.mobileno ?? u.mobileNo ?? u.mobile ?? u.phone;
  return phone != null ? String(phone).trim() : "";
}

export function formatSavedLocationAddress(saved: SavedLocationEntry): string {
  const named = formatServiceAddressFromGeoLocation(saved?.location);
  if (named) return named;
  return saved?.name ? `${saved.name} location` : "";
}

const KNOWN_SAVED_LABELS: Record<string, string> = {
  home: "home",
  office: "office",
  others: "others",
};

export function formatSavedLocationLabel(
  name: string,
  translate?: (key: string) => string
): string {
  const raw = String(name || "").trim();
  if (!raw) return "Address";

  const knownKey = KNOWN_SAVED_LABELS[raw.toLowerCase()];
  if (knownKey && translate) {
    const translated = translate(knownKey);
    if (translated && translated !== knownKey) return translated;
  }

  if (knownKey === "home") return "Home";
  if (knownKey === "office") return "Office";
  if (knownKey === "others") return "Other";

  return raw
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function locationsMatch(a: unknown, b: unknown): boolean {
  const latA = resolveLocationLat(a);
  const lngA = resolveLocationLng(a);
  const latB = resolveLocationLat(b);
  const lngB = resolveLocationLng(b);

  if (latA != null && lngA != null && latB != null && lngB != null) {
    return Math.abs(latA - latB) < 0.0001 && Math.abs(lngA - lngB) < 0.0001;
  }

  const addrA = formatServiceAddressFromGeoLocation(a);
  const addrB = formatServiceAddressFromGeoLocation(b);
  return addrA.length > 0 && addrA === addrB;
}

export function extractSavedLocations(preferenceData: unknown): SavedLocationEntry[] {
  if (Array.isArray(preferenceData) && preferenceData[0]?.savedLocations) {
    return preferenceData[0].savedLocations as SavedLocationEntry[];
  }
  if (
    preferenceData &&
    typeof preferenceData === "object" &&
    Array.isArray((preferenceData as { savedLocations?: unknown[] }).savedLocations)
  ) {
    return (preferenceData as { savedLocations: SavedLocationEntry[] }).savedLocations;
  }
  return [];
}

/** Normalize any location payload before storing in Redux or sending to APIs. */
export function normalizeGeoLocationPayload(
  raw: unknown
): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const coords = resolveLocationCoords(source);
  const formatted = formatServiceAddressFromGeoLocation(source);

  return {
    ...source,
    ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    ...(formatted && !source.formatted_address
      ? { formatted_address: formatted }
      : {}),
  };
}
