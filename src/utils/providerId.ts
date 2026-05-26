/** Treat null, undefined, and blank strings as missing. */
function nonEmptyId(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  return String(value);
}

/** Resolve provider id from API / Redux shapes (camelCase or legacy lowercase). */
export function resolveProviderId(
  source: Record<string, unknown> | null | undefined
): string | undefined {
  if (!source) return undefined;
  return (
    nonEmptyId(source.serviceproviderid) ??
    nonEmptyId(source.serviceProviderId) ??
    nonEmptyId(source.serviceproviderId) ??
    nonEmptyId(source.id)
  );
}
