"use client";

import { useState, useEffect } from 'react';

import ProfileSidebar from './profile-sidebar';
import ProfessionalDetails from './professional-details';
import PersonalDetails from './personal-details';

import { getProfile, updateProfile, type UserProfile, type Experience } from '@/lib/users-api';

type ProfileSection = 'personal' | 'professional';

export interface PersonalFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

export interface ProfessionalFormData extends Experience {
  id: string;
}

export default function ProfileContainer() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeSection, setActiveSection] = useState<ProfileSection>('personal');

  const [personalData, setPersonalData] = useState<PersonalFormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });

  const [professionalData, setProfessionalData] = useState<ProfessionalFormData[]>([
    {
      id: '0',
      currentPosition: '',
      company: '',
      experience: '',
      skills: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
    },
  ]);
  
  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('📥 Fetching profile...');
        const response = await getProfile();
        console.log('✓ Profile loaded:', response);
        
        const profileDetails = response.data.profileDetails;
        
        // Check if profileDetails exists and is not null
        if (!profileDetails) {
          console.log('ℹ️ No profile data found - new account, using empty defaults');
          setLoading(false);
          return;
        }

        // Extract personal info from nested structure
        const personalInfo = profileDetails.personalInfo || {};
        console.log('📝 Extracted personal info:', personalInfo);
        
        const emailFromResponse = response.data.email || '';
        console.log('📧 Email from response:', emailFromResponse);
        
        const newPersonalData = {
          fullName: personalInfo.fullName || '',
          email: emailFromResponse,  
          phone: personalInfo.phone || '',
          address: personalInfo.address || '',
        };
        console.log('📝 Setting personalData to:', newPersonalData);
        setPersonalData(newPersonalData);

        // Extract experiences array
        if (profileDetails.experiences && Array.isArray(profileDetails.experiences) && profileDetails.experiences.length > 0) {
          console.log('📝 Setting professional data from experiences array');
          setProfessionalData(
            profileDetails.experiences.map((exp, idx) => ({
              id: String(idx),
              ...exp,
            }))
          );
        } else {
          console.log('ℹ️ No existing experiences found');
        }

        setLoading(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load profile';
        console.error('❌ Error loading profile:', err);
        setError(errorMsg);
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleUpdate = async () => {
    try {
      setError(''); // Clear previous errors
      const updateData: UserProfile = {
        personalInfo: {
          fullName: personalData.fullName,
          phone: personalData.phone,
          address: personalData.address,
          // ← Exclude email (it's a separate DB column)
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        experiences: professionalData.map(({ id: _id, ...rest }) => rest),
      };
      const response = await updateProfile(updateData);
      console.log('Profile updated:', response);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Update failed';
      setError(errorMsg);
      alert(`✗ Error: ${errorMsg}`);
      console.error('Update error:', err);
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

  if (error) {
    return (
      <main className="flex-1 px-6 py-10">
        <div className="rounded-lg bg-red-50 p-4">
          <div className="font-semibold text-red-800">Error loading profile:</div>
          <div className="mt-2 text-red-700">{error}</div>
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
              onContinue={gotoNextSection}
            />
          ) : (
            <ProfessionalDetails
              data={Array.isArray(professionalData) ? professionalData : []}
              setData={setProfessionalData}
              onUpdate={handleUpdate}
              onGoBack={gotoPreviousSection}
            />
          )}
        </div>
      </div>
    </main>
  );
}