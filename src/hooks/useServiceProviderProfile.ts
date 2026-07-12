import { useEffect, useState } from "react";
import providerInstance from "../services/providerInstance";

export type ServiceProviderProfileState = {
  housekeepingRoles: string[];
  isAccountActive: boolean;
  loading: boolean;
};

const CANONICAL_SERVICE_ROLES = new Set(["COOK", "MAID", "NANNY"]);

function normalizeServiceRole(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    if (record.role != null) return normalizeServiceRole(record.role);
    if (record.housekeepingRole != null) return normalizeServiceRole(record.housekeepingRole);
    if (record.serviceType != null) return normalizeServiceRole(record.serviceType);
    return null;
  }

  const upper = String(raw).trim().toUpperCase();
  if (!upper) return null;

  if (upper === "HOME_COOK" || upper === "CHEF" || upper === "HOME COOK") return "COOK";
  if (upper === "CLEANING" || upper === "CLEANING_HELP" || upper === "MAID_SERVICE") return "MAID";
  if (
    upper === "CAREGIVER" ||
    upper === "BABYCARE" ||
    upper === "BABY_CARE" ||
    upper === "NANNY_CARE"
  ) {
    return "NANNY";
  }

  return upper;
}

function parseHousekeepingRoles(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((role) => normalizeServiceRole(role))
      .filter((role): role is string => !!role && CANONICAL_SERVICE_ROLES.has(role));
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.includes(",")) {
      return trimmed
        .split(",")
        .map((role) => normalizeServiceRole(role))
        .filter((role): role is string => !!role && CANONICAL_SERVICE_ROLES.has(role));
    }
    const single = normalizeServiceRole(trimmed);
    return single && CANONICAL_SERVICE_ROLES.has(single) ? [single] : [];
  }
  return [];
}

/**
 * Canonical offered roles from GET /serviceprovider/:id.
 * Uses junction `housekeepingRoles` when present; falls back to legacy
 * `housekeepingRole` only when the junction list is empty (matches nearby search).
 */
export function extractOfferedHousekeepingRoles(
  data: Record<string, unknown> | null | undefined
): string[] {
  if (!data) return [];

  const fromJunction = parseHousekeepingRoles(data.housekeepingRoles);
  if (fromJunction.length > 0) {
    return [...new Set(fromJunction)];
  }

  const legacy = normalizeServiceRole(data.housekeepingRole);
  return legacy && CANONICAL_SERVICE_ROLES.has(legacy) ? [legacy] : [];
}

function readAccountActive(data: Record<string, unknown> | null | undefined): boolean {
  if (!data) return true;
  if (data.isactive === false || data.isActive === false) return false;
  return true;
}

export function useServiceProviderProfile(
  serviceProviderId: number | null | undefined,
  isServiceProvider: boolean
): ServiceProviderProfileState {
  const [housekeepingRoles, setHousekeepingRoles] = useState<string[]>([]);
  const [isAccountActive, setIsAccountActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isServiceProvider || !serviceProviderId) {
      setHousekeepingRoles([]);
      setIsAccountActive(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    providerInstance
      .get(`/api/service-providers/serviceprovider/${serviceProviderId}`)
      .then((response) => {
        if (cancelled) return;
        const data = response?.data?.data as Record<string, unknown> | undefined;
        setHousekeepingRoles(extractOfferedHousekeepingRoles(data));
        setIsAccountActive(readAccountActive(data));
      })
      .catch(() => {
        if (cancelled) return;
        setHousekeepingRoles([]);
        setIsAccountActive(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isServiceProvider, serviceProviderId]);

  return { housekeepingRoles, isAccountActive, loading };
}

export function isServiceOfferedByProvider(
  serviceKey: string,
  housekeepingRoles: string[],
  isAccountActive: boolean
): boolean {
  if (!isAccountActive) return false;
  const normalizedKey = normalizeServiceRole(serviceKey);
  if (!normalizedKey || !CANONICAL_SERVICE_ROLES.has(normalizedKey)) return false;
  return housekeepingRoles.includes(normalizedKey);
}
