"use client";

import Button from '@/components/ui/button';
import { type ProfessionalFormData } from "./profile-types";
import { Trash2 } from "lucide-react";


interface ProfessionalDetailsProps {
    data: ProfessionalFormData[];
    setData: React.Dispatch<React.SetStateAction<ProfessionalFormData[]>>;
    onUpdate: () => void;
    onGoBack: () => void;
    error?: string;
    buttonText?: string;
}

export default function ProfessionalDetails({
    data,
    setData,
    onUpdate,
    onGoBack,
    error,
    buttonText = 'Update',
}: ProfessionalDetailsProps) {
  const handleFieldChange = (
    id: string,
    field: keyof ProfessionalFormData,
    value: string | boolean
  ) => {
    setData((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleCurrentlyWorkingChange = (id: string, value: boolean) => {
    setData((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              currentlyWorking: value,
              endDate: value ? "" : entry.endDate,
            }
          : entry
      )
    );
  };

  const handleAddExperience = () => {
    const newEntry: ProfessionalFormData = {
      id: String(Date.now()),
      currentPosition: "",
      company: "",
      experience: "",
      skills: "",
      startDate: "",
      endDate: "",
      currentlyWorking: false,
    };
    setData((prev) => [...prev, newEntry]);
  }

  const handleDeleteExperience = (id: string) => {
    setData((prev) => prev.filter((entry) => entry.id !== id));
  };
  
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 pb-12 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Professional Details
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Add internships, work, freelance, or practical experience if you have any.
          </p>
        </div>

        <Button variant="primary" onClick={onUpdate}>
          {buttonText}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {!Array.isArray(data) ? (
          <p className="text-gray-500">Loading professional details...</p>
        ) : (
        data.map((entry, index) => {
          const fieldId = (field: string) => `experience-${entry.id}-${field}`;

          return (
            <div
              key={entry.id}
              className="rounded-xl border border-gray-200 p-5 shadow-sm"
            >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Experience {index + 1}
              </h2>

              {data.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteExperience(entry.id)}
                  className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                  aria-label={`Delete experience ${index + 1}`}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor={fieldId("current-position")}
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Current Position
                </label>
                <input
                  id={fieldId("current-position")}
                  type="text"
                  value={entry.currentPosition || ''}
                  onChange={(e) =>
                    handleFieldChange(
                      entry.id,
                      "currentPosition",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
                  placeholder="Enter your current position"
                />
              </div>

              <div>
                <label
                  htmlFor={fieldId("company")}
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Company
                </label>
                <input
                  id={fieldId("company")}
                  type="text"
                  value={entry.company || ''}
                  onChange={(e) =>
                    handleFieldChange(entry.id, "company", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
                  placeholder="Enter your company"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor={fieldId("experience-summary")}
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Experience Summary
                </label>
                <textarea
                  id={fieldId("experience-summary")}
                  value={entry.experience || ''}
                  onChange={(e) =>
                    handleFieldChange(entry.id, "experience", e.target.value)
                  }
                  className="min-h-28 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
                  placeholder="Summarize responsibilities, achievements, tools used, internships, freelance work, or relevant practical experience"
                />
              </div>

              <div>
                <label
                  htmlFor={fieldId("skills")}
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Skills
                </label>
                <input
                  id={fieldId("skills")}
                  type="text"
                  value={entry.skills || ''}
                  onChange={(e) =>
                    handleFieldChange(entry.id, "skills", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
                  placeholder="Enter your skills (comma-separated)"
                />
              </div>

              <div>
                <label
                  htmlFor={fieldId("start-date")}
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Start Date
                </label>
                <input
                  id={fieldId("start-date")}
                  type="date"
                  value={entry.startDate || ''}
                  onChange={(e) =>
                    handleFieldChange(entry.id, "startDate", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor={fieldId("end-date")}
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  End Date
                </label>
                <input
                  id={fieldId("end-date")}
                  type="date"
                  value={entry.endDate || ''}
                  onChange={(e) =>
                    handleFieldChange(entry.id, "endDate", e.target.value)
                  }
                  disabled={entry.currentlyWorking}
                  className={`w-full rounded-lg border px-4 py-3 text-gray-900 outline-none ${
                    entry.currentlyWorking
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={entry.currentlyWorking}
                  onChange={(e) =>
                    handleCurrentlyWorkingChange(entry.id, e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                Currently Working
              </label>
            </div>
          </div>
        );
        })
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="dark" onClick={onGoBack}>
          Go Back
        </Button>

        <Button variant="success" onClick={handleAddExperience}>
          Add Experience
        </Button>
      </div>
    </section>
  );
}
