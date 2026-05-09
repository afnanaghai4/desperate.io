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
}

export interface GetProfileResponse {
  message: string;
  data: {
    profileDetails: UserProfile | null;
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

export interface User {
  userId: number;
  username: string;
  email: string;
  role: string;
  profileDetails: UserProfile | null;
  createdAt: string;  // JSON response arrives as ISO string, not Date object
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

export async function createProfile(profileData: UserProfile): Promise<User> {
  return apiFetch<User>('/users/profile', {
    method: 'POST',
    body: JSON.stringify(profileData),
  });
}


