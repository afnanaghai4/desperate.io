import { type Education } from "@/lib/users-api";
import { type AcademicFormData } from "./profile-types";

export const REQUIRED_EDUCATION_ERROR =
  "At least one education is required to continue.";

export const INVALID_EDUCATION_ERROR =
  "Institute name, degree name, field of study, start date, and end date are required for each education.";

export function createEmptyAcademicEntry(id = String(Date.now())): AcademicFormData {
  return {
    id,
    instituteName: "",
    degreeName: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    currentlyAttending: false,
    gradeCgpa: "",
    description: "",
  };
}

export function normalizeEducations(
  educations?: Education[]
): AcademicFormData[] {
  if (!Array.isArray(educations) || educations.length === 0) {
    return [createEmptyAcademicEntry("0")];
  }

  return educations.map((education, index) => ({
    id: String(index),
    instituteName: education.instituteName || "",
    degreeName: education.degreeName || "",
    fieldOfStudy: education.fieldOfStudy || "",
    startDate: education.startDate || "",
    endDate: education.endDate || "",
    currentlyAttending: Boolean(education.currentlyAttending),
    gradeCgpa: education.gradeCgpa || "",
    description: education.description || "",
  }));
}

function trimValue(value?: string) {
  return value?.trim() || "";
}

function hasEducationContent(education: AcademicFormData) {
  return Boolean(
    trimValue(education.instituteName) ||
      trimValue(education.degreeName) ||
      trimValue(education.fieldOfStudy) ||
      education.startDate ||
      education.endDate ||
      education.currentlyAttending ||
      trimValue(education.gradeCgpa) ||
      trimValue(education.description)
  );
}

function isValidEducation(education: AcademicFormData) {
  return Boolean(
    trimValue(education.instituteName) &&
      trimValue(education.degreeName) &&
      trimValue(education.fieldOfStudy) &&
      education.startDate &&
      (education.currentlyAttending || education.endDate)
  );
}

export function validateEducations(educations: AcademicFormData[]) {
  const filledEducations = educations.filter(hasEducationContent);

  if (filledEducations.length === 0) {
    return REQUIRED_EDUCATION_ERROR;
  }

  if (filledEducations.some((education) => !isValidEducation(education))) {
    return INVALID_EDUCATION_ERROR;
  }

  return "";
}

export function serializeEducations(
  educations: AcademicFormData[]
): Education[] {
  return educations.filter(hasEducationContent).map((education) => ({
    instituteName: trimValue(education.instituteName),
    degreeName: trimValue(education.degreeName),
    fieldOfStudy: trimValue(education.fieldOfStudy),
    startDate: education.startDate,
    endDate: education.currentlyAttending ? "" : education.endDate,
    currentlyAttending: Boolean(education.currentlyAttending),
    gradeCgpa: trimValue(education.gradeCgpa),
    description: trimValue(education.description),
  }));
}
