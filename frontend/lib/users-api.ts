import { apiFetch } from "./api";

// Personal information interface
export interface PersonalInfo {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Professional experience interface
export interface Experience {
  currentPosition?: string;
  company?: string;
  experience?: string;
  skills?: string;
  startDate?: string;
  endDate?: string;
  currentlyWorking?: boolean;
}

// Complete user profile interface
export interface UserProfile {
  personalInfo?: PersonalInfo;
  experiences?: Experience[];
  [key: string]: any;
}

export interface GetProfileResponse {
  message: string;
  data: {
    profileDetails: UserProfile;
    email: string;
    username: string;
  };
}

export interface UpdateProfileResponse {
  message: string;
  data: {
    profileDetails: UserProfile;
    email: string;
    username: string;
  };
}

export async function getProfile(): Promise<GetProfileResponse> {
  return apiFetch<GetProfileResponse>('/users/profile');
}

export async function updateProfile(
  profileData: UserProfile
): Promise<UpdateProfileResponse> {
  return apiFetch<UpdateProfileResponse>('/users/profile', {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
}


