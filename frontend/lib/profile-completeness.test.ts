import { describe, expect, it } from "vitest";

import {
  hasRequiredAcademicDetails,
  hasValidEducation,
  isProfileComplete,
} from "./profile-completeness";
import { type GetProfileResponse } from "./users-api";

const validEducation = {
  instituteName: "TU Berlin",
  degreeName: "MSc",
  fieldOfStudy: "Computer Science",
  startDate: "2021-10-01",
  endDate: "2023-09-30",
  currentlyAttending: false,
};

function profileData(
  overrides: Partial<GetProfileResponse["data"]> = {},
): GetProfileResponse["data"] {
  return {
    email: "afnan@example.com",
    username: "afnan",
    profileDetails: {
      personalInfo: {
        fullName: "Afnan Aghai",
      },
      educations: [validEducation],
      experiences: [],
    },
    ...overrides,
  };
}

describe("profile completeness helpers", () => {
  it("treats null profile details as incomplete", () => {
    expect(isProfileComplete(profileData({ profileDetails: null }))).toBe(false);
  });

  it("requires a username", () => {
    expect(isProfileComplete(profileData({ username: " " }))).toBe(false);
  });

  it("requires at least one education", () => {
    expect(
      hasRequiredAcademicDetails({
        personalInfo: { fullName: "Afnan Aghai" },
        educations: [],
      }),
    ).toBe(false);
  });

  it("rejects incomplete education details", () => {
    expect(
      hasValidEducation({
        instituteName: "TU Berlin",
        degreeName: "MSc",
        fieldOfStudy: "",
        startDate: "2021-10-01",
        endDate: "2023-09-30",
        currentlyAttending: false,
      }),
    ).toBe(false);
  });

  it("accepts a completed education", () => {
    expect(isProfileComplete(profileData())).toBe(true);
  });

  it("accepts current attendance without an end date", () => {
    expect(
      hasValidEducation({
        instituteName: "TU Berlin",
        degreeName: "MSc",
        fieldOfStudy: "Computer Science",
        startDate: "2021-10-01",
        currentlyAttending: true,
      }),
    ).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    expect(
      hasValidEducation({
        instituteName: "TU Berlin",
        degreeName: "MSc",
        fieldOfStudy: "Computer Science",
        startDate: "2024-10-01",
        endDate: "2023-09-30",
        currentlyAttending: false,
      }),
    ).toBe(false);
  });
});
