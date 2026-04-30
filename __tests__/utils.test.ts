import { parseTimeFromIso } from "@/app/(protected)/keys/[id]/edit/page"; // Veendu, et ekspordid selle funktsiooni

describe("EditKeycardPage helpers", () => {
  test("parseTimeFromIso returns correct time", () => {
    const iso = "2026-04-30T14:45:00";
    expect(parseTimeFromIso(iso)).toBe("14:45");
  });

  test("parseTimeFromIso returns 00:00 for null", () => {
    expect(parseTimeFromIso(null)).toBe("00:00");
  });
});
