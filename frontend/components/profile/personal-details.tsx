import Button from '@/components/ui/button';
import { type PersonalFormData } from './profile-types';
import React from 'react';

interface PersonalDetailsProps {
    data: PersonalFormData;
    setData: React.Dispatch<React.SetStateAction<PersonalFormData>>;
    onUpdate: () => void;
    onContinue : () => void;
    error?: string;
    readOnlyFields?: string[];
    buttonText?: string;
    title?: string;
    subtitle?: string;
    isPrimaryActionSubmit?: boolean;
}

export default function PersonalDetails({ 
    data, 
    setData, 
    onUpdate, 
    onContinue, 
    error, 
    readOnlyFields = [],
    buttonText = 'Update',
    title = 'Personal Details',
    subtitle = 'Update your personal information here.',
    isPrimaryActionSubmit = true
}: PersonalDetailsProps) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {subtitle}
          </p>
        </div>
        <Button variant="primary" onClick={isPrimaryActionSubmit ? onUpdate : onContinue}>
            {buttonText}
        </Button>
      </div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Full Name
          </label>
            <input
                type="text"
                value={data.fullName || ''}
                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                required
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
            value={data.email || ''}
            readOnly={readOnlyFields.includes('email')}
            onChange={(e) => !readOnlyFields.includes('email') && setData({ ...data, email: e.target.value })}
            className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ${readOnlyFields.includes('email') ? 'bg-gray-100 cursor-not-allowed' : 'focus:border-blue-500'}`}
            placeholder="Enter your email"
          />
          {readOnlyFields.includes('email') && (
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed. Contact support to change email.</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            value={data.username || ''}
            readOnly={readOnlyFields.includes('username')}
            onChange={(e) => !readOnlyFields.includes('username') && setData({ ...data, username: e.target.value })}
            className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ${readOnlyFields.includes('username') ? 'bg-gray-100 cursor-not-allowed' : 'focus:border-blue-500'}`}
            placeholder="Your username"
          />
          {readOnlyFields.includes('username') && (
            <p className="mt-1 text-xs text-gray-500">Username cannot be changed. Contact support to change username.</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="text"
            value={data.phone || ''}
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
            value={data.address || ''}
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
