"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuth } from "@/lib/auth-api";

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

import { createProfile } from "@/lib/users-api";

export default function ProfileSetupContainer() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  const [professionalData, setProfessionalData] = useState<
    ProfessionalFormData[]
  >([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await checkAuth();
        if (user) {
          setPersonalData((prev) => ({
            ...prev,
            email: user.email || "",
            username: user.username || "",
          }));
        }
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSubmit = async () => {
    setError("");

    const fullNameTrimmed = personalData.fullName?.trim() || "";
    if (!fullNameTrimmed) {
      setError("Full name is required to continue");
      setActiveSection("personal");
      return;
    }

    const educationError = validateEducations(academicData);
    if (educationError) {
      setError(educationError);
      setActiveSection("academic");
      return;
    }

    try {
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

      const personalInfo: Record<string, string> = {
        fullName: fullNameTrimmed,
      };

      const phoneTrimmed = personalData.phone?.trim();
      if (phoneTrimmed) {
        personalInfo.phone = phoneTrimmed;
      }

      const addressTrimmed = personalData.address?.trim();
      if (addressTrimmed) {
        personalInfo.address = addressTrimmed;
      }

      await createProfile({
        personalInfo,
        educations: serializeEducations(academicData),
        experiences: filledExperiences,
      });
      setError("");
      router.push("/dashboard");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Profile creation failed";
      setError(errorMsg);
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

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl gap-6">
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 md:w-[30%]">
          <ProfileSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>

        <div className="w-full animate-in fade-in slide-in-from-bottom-8 delay-200 duration-700 md:w-[70%]">
          {activeSection === "personal" ? (
            <PersonalDetails
              data={personalData}
              setData={setPersonalData}
              onUpdate={handleSubmit}
              onContinue={gotoAcademicSection}
              error={error}
              readOnlyFields={["email", "username"]}
              buttonText="Continue"
              title="Complete Your Profile"
              subtitle="Add your details to get started."
              isPrimaryActionSubmit={false}
            />
          ) : activeSection === "academic" ? (
            <AcademicDetails
              data={academicData}
              setData={setAcademicData}
              onContinue={gotoProfessionalSection}
              onGoBack={gotoPersonalSection}
              error={error}
            />
          ) : (
            <ProfessionalDetails
              data={Array.isArray(professionalData) ? professionalData : []}
              setData={setProfessionalData}
              onUpdate={handleSubmit}
              onGoBack={gotoAcademicSection}
              error={error}
              buttonText="Complete"
            />
          )}
        </div>
      </div>
    </main>
  );
}
