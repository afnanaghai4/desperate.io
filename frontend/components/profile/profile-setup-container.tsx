"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/lib/auth-api';

import ProfileSidebar from './profile-sidebar';
import ProfessionalDetails from './professional-details';
import PersonalDetails from './personal-details';

import { createProfile, type Experience } from '@/lib/users-api';

type ProfileSection = 'personal' | 'professional';

export interface PersonalFormData {
  fullName: string;
  email: string;
  username?: string;
  phone: string;
  address: string;
}

export interface ProfessionalFormData extends Experience {
  id: string;
}

export default function ProfileSetupContainer() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeSection, setActiveSection] = useState<ProfileSection>('personal');

  const [personalData, setPersonalData] = useState<PersonalFormData>({
    fullName: '',
    email: '',
    username: '',
    phone: '',
    address: '',
  });
  const [professionalData, setProfessionalData] = useState<ProfessionalFormData[]>([]);

  // Fetch current user on mount and prefill email/username
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await checkAuth();
        if (user) {
          setPersonalData((prev) => ({
            ...prev,
            email: user.email || '',
            username: user.username || '',
          }));
        }
      } catch (err) {
        // Handle checkAuth() failure - loading will still resolve
        console.error('Failed to fetch user info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  
  const handleSubmit = async () => {
    // Clear previous error
    setError('');
    
    // Validation: require fullName with actual content (not whitespace)
    const fullNameTrimmed = personalData.fullName?.trim() || '';
    if (!fullNameTrimmed) {
      setError('Full name is required to continue');
      return;
    }

    try {
      const filledExperiences = professionalData
        .filter(exp => 
          exp.currentPosition?.trim() || 
          exp.company?.trim() || 
          exp.experience?.trim() || 
          exp.skills?.trim() ||
          exp.startDate ||
          exp.currentlyWorking
        )
        .map(exp => ({
          currentPosition: exp.currentPosition,
          company: exp.company,
          experience: exp.experience,
          skills: exp.skills,
          startDate: exp.startDate,
          endDate: exp.endDate,
          currentlyWorking: exp.currentlyWorking,
        }));
      
      // Build personalInfo with only non-empty values
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
        experiences: filledExperiences,
      });
      setError('');
      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Profile creation failed';
      setError(errorMsg);
    }
  };



  const gotoNextSection = () => {
    setActiveSection('professional');
  };

  const gotoPreviousSection = () => {
    setActiveSection('personal');
  };

  if (loading) {
    return (
      <main className="flex-1 px-6 py-10">
        <div className="text-center">
          <div className="text-lg text-gray-700">Loading profile...</div>
          <div className="mt-2 text-sm text-gray-500">Please wait while we fetch your data</div>
        </div>
      </main>
    );
  }

  
  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl gap-6">
        <div className="w-full md:w-[30%] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <ProfileSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>

        <div className="w-full md:w-[70%] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          {activeSection === "personal" ? (
            <PersonalDetails
              data={personalData}
              setData={setPersonalData}
              onUpdate={handleSubmit}
              onContinue={gotoNextSection}
              error={error}
              readOnlyFields={['email', 'username']}
              buttonText="Continue"
              title="Complete Your Profile"
              subtitle="Add your details to get started."
              isPrimaryActionSubmit={false}
            />
          ) : (
            <ProfessionalDetails
              data={Array.isArray(professionalData) ? professionalData : []}
              setData={setProfessionalData}
              onUpdate={handleSubmit}
              onGoBack={gotoPreviousSection}
              error={error}
              buttonText="Complete"
            />
          )}
        </div>
      </div>
    </main>
  );
}