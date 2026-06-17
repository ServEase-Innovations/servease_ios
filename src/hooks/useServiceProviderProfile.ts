import { useEffect, useState } from "react";
import providerInstance from "../services/providerInstance";

export type ServiceProviderProfileState = {
  housekeepingRoles: string[];
  isAccountActive: boolean;
  loading: boolean;
};

function parseHousekeepingRoles(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((role) => String(role).trim().toUpperCase()).filter(Boolean);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.includes(",")) {
      return trimmed.split(",").map((role) => role.trim().toUpperCase()).filter(Boolean);
    }
    return [trimmed.toUpperCase()];
  }
  return [];
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
        const data = response?.data?.data;
        setHousekeepingRoles(parseHousekeepingRoles(data?.housekeepingRoles));
        setIsAccountActive(data?.isactive !== false);
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
  return housekeepingRoles.includes(String(serviceKey).toUpperCase());
}
