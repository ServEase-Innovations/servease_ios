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

export function extractSavedLocations(preferenceData: unknown): Array<{ name: string; location: unknown }> {
  if (Array.isArray(preferenceData) && preferenceData[0]?.savedLocations) {
    return preferenceData[0].savedLocations as Array<{ name: string; location: unknown }>;
  }
  if (
    preferenceData &&
    typeof preferenceData === "object" &&
    Array.isArray((preferenceData as { savedLocations?: unknown[] }).savedLocations)
  ) {
    return (preferenceData as { savedLocations: Array<{ name: string; location: unknown }> }).savedLocations;
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
