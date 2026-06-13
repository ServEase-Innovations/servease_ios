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

/** Stable key for provider-search invalidation when coordinates change. */
export function buildLocationSearchKey(location: unknown): string {
  const coords = resolveLocationCoords(location);
  if (coords) {
    return `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
  }
  return "";
}
