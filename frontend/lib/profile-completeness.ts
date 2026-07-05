import { type Education, type GetProfileResponse, type UserProfile } from "./users-api";

type ProfileData = GetProfileResponse["data"];

function trimValue(value?: string) {
  return value?.trim() || "";
}

function hasEducationContent(education: Education) {
  return Boolean(
    trimValue(education.instituteName) ||
      trimValue(education.degreeName) ||
      trimValue(education.fieldOfStudy) ||
      education.startDate ||
      education.endDate ||
      education.currentlyAttending ||
      trimValue(education.gradeCgpa) ||
      trimValue(education.description),
  );
}

export function hasValidEducation(education: Education) {
  const startDate = education.startDate || "";
  const endDate = education.endDate || "";
  const hasChronologicalDates =
    education.currentlyAttending || !endDate || startDate <= endDate;

  return Boolean(
    trimValue(education.instituteName) &&
      trimValue(education.degreeName) &&
      trimValue(education.fieldOfStudy) &&
      startDate &&
      (education.currentlyAttending || endDate) &&
      hasChronologicalDates,
  );
}

export function hasRequiredAcademicDetails(profileDetails: UserProfile | null) {
  if (!profileDetails || !Array.isArray(profileDetails.educations)) {
    return false;
  }

  return profileDetails.educations
    .filter(hasEducationContent)
    .some(hasValidEducation);
}

export function isProfileComplete(profileData: ProfileData) {
  return Boolean(
    trimValue(profileData.username) &&
      profileData.profileDetails &&
      hasRequiredAcademicDetails(profileData.profileDetails),
  );
}
