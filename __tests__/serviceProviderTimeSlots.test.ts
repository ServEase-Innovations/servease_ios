import { parseProviderTimeSlots } from "../src/UserProfile/serviceProviderTimeSlots";

describe("parseProviderTimeSlots", () => {
  it("splits full-day availability at noon for the editor's slider ranges", () => {
    expect(parseProviderTimeSlots("06:00-20:00")).toEqual([
      { start: 6, end: 12, type: "morning" },
      { start: 12, end: 20, type: "evening" },
    ]);
  });

  it("parses AM/PM ranges and clips them to supported hours", () => {
    expect(parseProviderTimeSlots("5:30 AM - 1:15 PM")).toEqual([
      { start: 6, end: 12, type: "morning" },
      { start: 12, end: 13.25, type: "evening" },
    ]);
  });

  it("ignores malformed and reversed ranges", () => {
    expect(parseProviderTimeSlots("bad, 18:00-09:00")).toEqual([]);
  });
});
