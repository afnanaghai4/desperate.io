import { type Education, type Experience } from "@/lib/users-api";

export type ProfileSection = "personal" | "academic" | "professional";

export interface PersonalFormData {
  fullName: string;
  email: string;
  username?: string;
  phone: string;
  address: string;
}

export interface AcademicFormData extends Education {
  id: string;
}

export interface ProfessionalFormData extends Experience {
  id: string;
}
