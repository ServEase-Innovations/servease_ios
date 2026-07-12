export interface AvailabilitySlot {
  id: string;
  startMinutes: number;
  endMinutes: number;
}

export type AvailabilityPreset = {
  id: string;
  label: string;
  startMinutes: number;
  endMinutes: number;
};

export const AVAILABILITY_MIN_MINUTES = 6 * 60;
export const AVAILABILITY_MAX_MINUTES = 20 * 60;
export const FULL_DAY_TIMESLOT = "06:00-20:00";

export const AVAILABILITY_PRESETS: AvailabilityPreset[] = [
  { id: "morning", label: "Morning", startMinutes: 6 * 60, endMinutes: 12 * 60 },
  { id: "afternoon", label: "Afternoon", startMinutes: 12 * 60, endMinutes: 16 * 60 },
  { id: "evening", label: "Evening", startMinutes: 16 * 60, endMinutes: 20 * 60 },
];

export function createSlotId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function minutesToStorage(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function storageToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function formatMinutesDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return m > 0
    ? `${displayH}:${m.toString().padStart(2, "0")} ${period}`
    : `${displayH} ${period}`;
}

export function generateTimeOptions(
  minMinutes = AVAILABILITY_MIN_MINUTES,
  maxMinutes = AVAILABILITY_MAX_MINUTES,
  stepMinutes = 30
): number[] {
  const options: number[] = [];
  for (let minutes = minMinutes; minutes <= maxMinutes; minutes += stepMinutes) {
    options.push(minutes);
  }
  return options;
}

export function slotsToTimeslotString(slots: AvailabilitySlot[]): string {
  return slots
    .slice()
    .sort((a, b) => a.startMinutes - b.startMinutes)
    .map(
      (slot) =>
        `${minutesToStorage(slot.startMinutes)}-${minutesToStorage(slot.endMinutes)}`
    )
    .join(",");
}

export function formatSlotsSummary(slots: AvailabilitySlot[]): string {
  if (!slots.length) return "";
  return slots
    .slice()
    .sort((a, b) => a.startMinutes - b.startMinutes)
    .map(
      (slot) =>
        `${formatMinutesDisplay(slot.startMinutes)} - ${formatMinutesDisplay(slot.endMinutes)}`
    )
    .join(", ");
}

export function isDuplicateSlot(
  slots: AvailabilitySlot[],
  candidate: AvailabilitySlot
): boolean {
  return slots.some(
    (slot) =>
      slot.id !== candidate.id &&
      slot.startMinutes === candidate.startMinutes &&
      slot.endMinutes === candidate.endMinutes
  );
}

export function parseTimeslotString(value?: string): {
  mode: "full" | "custom";
  slots: AvailabilitySlot[];
} {
  const defaultSlot: AvailabilitySlot = {
    id: createSlotId(),
    startMinutes: 9 * 60,
    endMinutes: 17 * 60,
  };

  if (!value || value === FULL_DAY_TIMESLOT) {
    return {
      mode: "full",
      slots: [defaultSlot],
    };
  }

  const slots = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [start, end] = part.split("-");
      return {
        id: createSlotId(),
        startMinutes: storageToMinutes(start),
        endMinutes: storageToMinutes(end),
      };
    })
    .filter((slot) => slot.endMinutes > slot.startMinutes);

  return {
    mode: "custom",
    slots: slots.length ? slots : [defaultSlot],
  };
}
