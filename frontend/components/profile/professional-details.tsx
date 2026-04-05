"use client";

import Button from '@/components/ui/button';
import { ProfessionalFormData } from "./profile-container";
import { Trash2 } from "lucide-react";


interface ProfessionalDetailsProps {
    data: ProfessionalFormData[];
    setData: React.Dispatch<React.SetStateAction<ProfessionalFormData[]>>;
    onUpdate: () => void;
    onGoBack: () => void;
}

export default function ProfessionalDetails({
    data,
    setData,
    onUpdate,
    onGoBack,
}: ProfessionalDetailsProps) {
  const handleFieldChange = (
    id: number,
    field: keyof ProfessionalFormData,
    value: string | boolean
  ) => {
    setData((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleCurrentlyWorkingChange = (id: number, value: boolean) => {
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
      id: Date.now(),
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

  const handleDeleteExperience = (id: number) => {
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
            Update your professional information here.
          </p>
        </div>

        <Button variant="primary" onClick={onUpdate}>
          Update
        </Button>
      </div>

      <div className="space-y-6">
        {!Array.isArray(data) ? (
          <p className="text-gray-500">Loading professional details...</p>
        ) : (
        data.map((entry, index) => (
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
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Current Position
                </label>
                <input
                  type="text"
                  value={entry.currentPosition}
                  onChange={(e) =>
                    handleFieldChange(
                      entry.id,
                      "currentPosition",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="Enter your current position"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Company
                </label>
                <input
                  type="text"
                  value={entry.company}
                  onChange={(e) =>
                    handleFieldChange(entry.id, "company", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="Enter your company"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Experience
                </label>
                <input
                  type="text"
                  value={entry.experience}
                  onChange={(e) =>
                    handleFieldChange(entry.id, "experience", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="Enter your experience"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Skills
                </label>
                <input
                  type="text"
                  value={entry.skills}
                  onChange={(e) =>
                    handleFieldChange(entry.id, "skills", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="Enter your skills (comma-separated)"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  value={entry.startDate}
                  onChange={(e) =>
                    handleFieldChange(entry.id, "startDate", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  value={entry.endDate}
                  onChange={(e) =>
                    handleFieldChange(entry.id, "endDate", e.target.value)
                  }
                  disabled={entry.currentlyWorking}
                  className={`w-full rounded-lg border px-4 py-3 outline-none ${
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
        ))
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