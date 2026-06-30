import { describe, expect, it } from "vitest";

import {
  INVALID_EDUCATION_ERROR,
  normalizeEducations,
  validateEducations,
} from "./profile-education";

describe("profile education helpers", () => {
  it("clears hydrated end dates for current studies", () => {
    expect(
      normalizeEducations([
        {
          instituteName: "TU Berlin",
          degreeName: "MSc",
          fieldOfStudy: "Computer Science",
          startDate: "2021-10-01",
          endDate: "2025-09-30",
          currentlyAttending: true,
        },
      ])
    ).toEqual([
      expect.objectContaining({
        endDate: "",
        currentlyAttending: true,
      }),
    ]);
  });

  it("rejects education entries whose end date is before the start date", () => {
    expect(
      validateEducations([
        {
          id: "0",
          instituteName: "TU Berlin",
          degreeName: "MSc",
          fieldOfStudy: "Computer Science",
          startDate: "2024-10-01",
          endDate: "2023-09-30",
          currentlyAttending: false,
        },
      ])
    ).toBe(INVALID_EDUCATION_ERROR);
  });
});
