import { AGENT_DASHBOARD, DASHBOARD, HOME } from "../Constants/pagesConstants";

export function resolveRoleHomeView(role?: string | null): string {
  const normalized = String(role ?? "").toUpperCase();
  if (normalized === "SERVICE_PROVIDER") return DASHBOARD;
  if (normalized === "VENDOR") return AGENT_DASHBOARD;
  return HOME;
}
