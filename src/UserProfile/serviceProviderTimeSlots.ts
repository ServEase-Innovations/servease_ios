export interface ParsedProviderTimeSlot {
  start: number;
  end: number;
  type: "morning" | "evening";
}

const parseTimeToMinutes = (value: string): number | null => {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const period = match[3]?.toUpperCase();

  if (minute > 59 || (period ? hour < 1 || hour > 12 : hour > 23)) {
    return null;
  }

  if (period) {
    hour %= 12;
    if (period === "PM") hour += 12;
  }

  return hour * 60 + minute;
};

export const parseProviderTimeSlots = (value: unknown): ParsedProviderTimeSlot[] => {
  if (typeof value !== "string" || !value.trim()) return [];

  const slots: ParsedProviderTimeSlot[] = [];
  const minMinutes = 6 * 60;
  const noonMinutes = 12 * 60;
  const maxMinutes = 20 * 60;

  value.split(",").forEach((range) => {
    const [startValue, endValue, ...extra] = range.split("-");
    if (!startValue || !endValue || extra.length > 0) return;

    const start = parseTimeToMinutes(startValue);
    const end = parseTimeToMinutes(endValue);
    if (start == null || end == null || end <= start) return;

    const clippedStart = Math.max(start, minMinutes);
    const clippedEnd = Math.min(end, maxMinutes);
    if (clippedEnd <= clippedStart) return;

    const morningEnd = Math.min(clippedEnd, noonMinutes);
    if (clippedStart < morningEnd) {
      slots.push({
        start: clippedStart / 60,
        end: morningEnd / 60,
        type: "morning",
      });
    }

    const eveningStart = Math.max(clippedStart, noonMinutes);
    if (eveningStart < clippedEnd) {
      slots.push({
        start: eveningStart / 60,
        end: clippedEnd / 60,
        type: "evening",
      });
    }
  });

  return slots;
};
