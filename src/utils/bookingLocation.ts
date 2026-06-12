function readCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function readLatLngPoint(point: unknown): { lat: number; lng: number } | null {
  if (!point || typeof point !== "object") return null;
  const p = point as Record<string, unknown>;
  const lat = readCoordinate(p.lat);
  const lng = readCoordinate(p.lng);
  if (lat != null && lng != null) return { lat, lng };
  return null;
}

export function formatServiceAddressFromGeoLocation(location: unknown): string {
  if (!location || typeof location !== "object") return "";
  const loc = location as Record<string, unknown>;

  if (typeof loc.formatted_address === "string" && loc.formatted_address.trim()) {
    return loc.formatted_address.trim();
  }

  const coords = resolveLocationCoords(location);
  if (coords) {
    return `Map location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`;
  }

  return "";
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
