import dayjs from "dayjs";

export type EpochLike = number | string | null | undefined;

export function toEpochOrNull(value: EpochLike): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function dateToEpochStartOrNull(value?: string | null): number | null {
  if (!value) return null;
  const d = dayjs(value);
  return d.isValid() ? d.startOf("day").unix() : null;
}

export function coalesceStartEpoch(
  startEpoch?: EpochLike,
  startDate?: string | null
): number | null {
  return toEpochOrNull(startEpoch) ?? dateToEpochStartOrNull(startDate ?? null);
}

export function coalesceEndEpoch(
  endEpoch?: EpochLike,
  endDate?: string | null
): number | null {
  const ep = toEpochOrNull(endEpoch);
  if (ep != null) return ep;
  if (!endDate) return null;
  const d = dayjs(endDate);
  return d.isValid() ? d.endOf("day").unix() : null;
}
