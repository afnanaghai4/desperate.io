import Button from '@/components/ui/button';
import { PersonalFormData } from './profile-container';
import React from 'react';

interface PersonalDetailsProps {
    data: PersonalFormData;
    setData: React.Dispatch<React.SetStateAction<PersonalFormData>>;
    onUpdate: () => void;
    onContinue : () => void;
}

export default function PersonalDetails({ data, setData, onUpdate, onContinue }: PersonalDetailsProps) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Personal Details
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Update your personal information here.
          </p>
        </div>
        <Button variant="primary" onClick={onUpdate}>
            Update
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Full Name
          </label>
            <input
                type="text"
                value={data.fullName}
                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={data.email}
            readOnly
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 bg-gray-100 cursor-not-allowed"
            placeholder="Enter your email"
          />
          <p className="mt-1 text-xs text-gray-500">Email cannot be changed from profile. Contact support to change email.</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="text"
            value={data.phone}
            onChange={(e) =>
              setData((prev) => ({ ...prev, phone: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            type="text"
            value={data.address}
            onChange={(e) =>
              setData((prev) => ({ ...prev, address: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
            placeholder="Enter your address"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="success" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </section>
  );
}