"use client";

import { useEffect, useState } from "react";

import AcademicDetails from "./academic-details";
import PersonalDetails from "./personal-details";
import ProfessionalDetails from "./professional-details";
import ProfileSidebar from "./profile-sidebar";
import {
  normalizeEducations,
  serializeEducations,
  validateEducations,
} from "./profile-education";
import {
  type AcademicFormData,
  type PersonalFormData,
  type ProfessionalFormData,
  type ProfileSection,
} from "./profile-types";

import { getProfile, updateProfile, type UserProfile } from "@/lib/users-api";

const defaultProfessionalData: ProfessionalFormData[] = [
  {
    id: "0",
    currentPosition: "",
    company: "",
    experience: "",
    skills: "",
    startDate: "",
    endDate: "",
    currentlyWorking: false,
  },
];

export default function ProfileContainer() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [activeSection, setActiveSection] =
    useState<ProfileSection>("personal");

  const [personalData, setPersonalData] = useState<PersonalFormData>({
    fullName: "",
    email: "",
    username: "",
    phone: "",
    address: "",
  });

  const [academicData, setAcademicData] = useState<AcademicFormData[]>(
    normalizeEducations()
  );
  const [professionalData, setProfessionalData] =
    useState<ProfessionalFormData[]>(defaultProfessionalData);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getProfile();
        const profileDetails = response.data.profileDetails;

        if (!profileDetails) {
          setLoading(false);
          return;
        }

        const personalInfo = profileDetails.personalInfo || {};

        setPersonalData({
          fullName: personalInfo.fullName || "",
          email: response.data.email || "",
          username: response.data.username || "",
          phone: personalInfo.phone || "",
          address: personalInfo.address || "",
        });

        setAcademicData(normalizeEducations(profileDetails.educations));

        if (
          Array.isArray(profileDetails.experiences) &&
          profileDetails.experiences.length > 0
        ) {
          setProfessionalData(
            profileDetails.experiences.map((experience, index) => ({
              id: String(index),
              ...experience,
            }))
          );
        }

        setLoading(false);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load profile";
        setLoadError(errorMsg);
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleUpdate = async () => {
    const fullNameTrimmed = personalData.fullName?.trim() || "";
    if (!fullNameTrimmed) {
      setUpdateSuccess(false);
      setUpdateError("Full name is required to continue");
      setActiveSection("personal");
      return;
    }

    const educationError = validateEducations(academicData);
    if (educationError) {
      setUpdateSuccess(false);
      setUpdateError(educationError);
      setActiveSection("academic");
      return;
    }

    try {
      setUpdateError("");

      const filledExperiences = professionalData
        .filter(
          (experience) =>
            experience.currentPosition?.trim() ||
            experience.company?.trim() ||
            experience.experience?.trim() ||
            experience.skills?.trim() ||
            experience.startDate ||
            experience.currentlyWorking
        )
        .map((experience) => ({
          currentPosition: experience.currentPosition,
          company: experience.company,
          experience: experience.experience,
          skills: experience.skills,
          startDate: experience.startDate,
          endDate: experience.endDate,
          currentlyWorking: experience.currentlyWorking,
        }));

      const updateData: UserProfile = {
        personalInfo: {
          fullName: fullNameTrimmed,
          ...(personalData.phone?.trim()
            ? { phone: personalData.phone.trim() }
            : {}),
          ...(personalData.address?.trim()
            ? { address: personalData.address.trim() }
            : {}),
        },
        educations: serializeEducations(academicData),
        experiences: filledExperiences,
      };

      await updateProfile(updateData);
      setUpdateError("");
      setUpdateSuccess(true);

      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Update failed";
      setUpdateError(errorMsg);
      setUpdateSuccess(false);
      alert(`Error: ${errorMsg}`);
    }
  };

  const gotoAcademicSection = () => {
    setActiveSection("academic");
  };

  const gotoProfessionalSection = () => {
    setActiveSection("professional");
  };

  const gotoPersonalSection = () => {
    setActiveSection("personal");
  };

  if (loading) {
    return (
      <main className="flex-1 px-6 py-10">
        <div className="text-center">
          <div className="text-lg text-gray-700">Loading profile...</div>
          <div className="mt-2 text-sm text-gray-500">
            Please wait while we fetch your data
          </div>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex-1 px-6 py-10">
        <div className="rounded-lg bg-red-50 p-4">
          <div className="font-semibold text-red-800">
            Error loading profile:
          </div>
          <div className="mt-2 text-red-700">{loadError}</div>
          <div className="mt-4 text-sm text-red-600">
            <p>Make sure:</p>
            <ul className="ml-4 list-inside list-disc">
              <li>Backend is running on port 4000</li>
              <li>You are logged in</li>
              <li>Check browser console for details</li>
            </ul>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-10">
      {updateSuccess && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            Profile updated successfully!
          </p>
        </div>
      )}
      <div className="mx-auto flex w-full max-w-6xl gap-6">
        <div className="w-full md:w-[30%]">
          <ProfileSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>

        <div className="w-full md:w-[70%]">
          {activeSection === "personal" ? (
            <PersonalDetails
              data={personalData}
              setData={setPersonalData}
              onUpdate={handleUpdate}
              onContinue={gotoAcademicSection}
              error={updateError}
              readOnlyFields={["email", "username"]}
            />
          ) : activeSection === "academic" ? (
            <AcademicDetails
              data={academicData}
              setData={setAcademicData}
              onContinue={gotoProfessionalSection}
              onGoBack={gotoPersonalSection}
              error={updateError}
            />
          ) : (
            <ProfessionalDetails
              data={Array.isArray(professionalData) ? professionalData : []}
              setData={setProfessionalData}
              onUpdate={handleUpdate}
              onGoBack={gotoAcademicSection}
              error={updateError}
            />
          )}
        </div>
      </div>
    </main>
  );
}
