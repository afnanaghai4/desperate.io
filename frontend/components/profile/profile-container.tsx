"use client";

import { useState } from 'react';
import ProfileSidebar from './profile-sidebar';
import ProfessionalDetails from './professional-details';
import PersonalDetails from './personal-details';

type ProfileSection = 'personal' | 'professional';

export interface PersonalFormData {
    fullName: string;
    email: string;
    phone: string;
    address: string;
}

export interface ProfessionalFormData {
    id: number;
  currentPosition: string;
  company: string;
  experience: string;
  skills: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
}

export default function ProfileContainer() {
    const [activeSection, setActiveSection] = useState<ProfileSection>('personal');

    const [personalData, setPersonalData] = useState<PersonalFormData>({
        fullName: '',
        email: '',
        phone: '',
        address: '',
    });

    const [professionalData, setProfessionalData] = useState<ProfessionalFormData[]>(() => [
    {
      id: Date.now(),
      currentPosition: "",
      company: "",
      experience: "",
      skills: "",
      startDate: "",
      endDate: "",
      currentlyWorking: false,
    },
  ]);

    const handleUpdate = () => {
        if(activeSection === 'personal') {
            console.log('Updating personal details:', personalData);
        } else {
            console.log('Updating professional details:', professionalData);
        }
    };
    const gotoNextSection = () => {
        setActiveSection('professional');
    };

    const gotoPreviousSection = () => {
        setActiveSection('personal');
    };

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