"use client";

import Button from "@/components/ui/button";
import { type AcademicFormData } from "./profile-types";
import { createEmptyAcademicEntry } from "./profile-education";
import { Trash2 } from "lucide-react";

interface AcademicDetailsProps {
  data: AcademicFormData[];
  setData: React.Dispatch<React.SetStateAction<AcademicFormData[]>>;
  onContinue: () => void;
  onGoBack: () => void;
  error?: string;
  buttonText?: string;
  title?: string;
  subtitle?: string;
}

export default function AcademicDetails({
  data,
  setData,
  onContinue,
  onGoBack,
  error,
  buttonText = "Continue",
  title = "Academic Details",
  subtitle = "Add your academic background here.",
}: AcademicDetailsProps) {
  const entries = Array.isArray(data) ? data : [];

  const handleFieldChange = (
    id: string,
    field: keyof AcademicFormData,
    value: string | boolean
  ) => {
    setData((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleCurrentlyAttendingChange = (id: string, value: boolean) => {
    setData((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              currentlyAttending: value,
              endDate: value ? "" : entry.endDate,
            }
          : entry
      )
    );
  };

  const handleAddEducation = () => {
    setData((prev) => [...prev, createEmptyAcademicEntry()]);
  };

  const handleDeleteEducation = (id: string) => {
    setData((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 pb-12 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>

        <Button variant="primary" onClick={onContinue}>
          {buttonText}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {entries.map((entry, index) => {
          const fieldId = (field: string) => `education-${entry.id}-${field}`;

          return (
            <div
              key={entry.id}
              className="rounded-xl border border-gray-200 p-5 shadow-sm"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Education {index + 1}
                </h2>

                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteEducation(entry.id)}
                    className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete education ${index + 1}`}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor={fieldId("institute-name")}
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Institute Name
                  </label>
                  <input
                    id={fieldId("institute-name")}
                    type="text"
                    value={entry.instituteName || ""}
                    onChange={(e) =>
                      handleFieldChange(entry.id, "instituteName", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
                    placeholder="Enter your institute name"
                  />
                </div>

                <div>
                  <label
                    htmlFor={fieldId("degree-name")}
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Degree Name
                  </label>
                  <input
                    id={fieldId("degree-name")}
                    type="text"
                    value={entry.degreeName || ""}
                    onChange={(e) =>
                      handleFieldChange(entry.id, "degreeName", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
                    placeholder="Enter your degree name"
                  />
                </div>

                <div>
                  <label
                    htmlFor={fieldId("field-of-study")}
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Field of Study
                  </label>
                  <input
                    id={fieldId("field-of-study")}
                    type="text"
                    value={entry.fieldOfStudy || ""}
                    onChange={(e) =>
                      handleFieldChange(entry.id, "fieldOfStudy", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
                    placeholder="Enter your field of study"
                  />
                </div>

                <div>
                  <label
                    htmlFor={fieldId("grade-cgpa")}
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Grade/CGPA
                  </label>
                  <input
                    id={fieldId("grade-cgpa")}
                    type="text"
                    value={entry.gradeCgpa || ""}
                    onChange={(e) =>
                      handleFieldChange(entry.id, "gradeCgpa", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
                    placeholder="Enter your grade or CGPA"
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
                    value={entry.startDate || ""}
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
                    value={entry.endDate || ""}
                    onChange={(e) =>
                      handleFieldChange(entry.id, "endDate", e.target.value)
                    }
                    disabled={entry.currentlyAttending}
                    className={`w-full rounded-lg border px-4 py-3 text-gray-900 outline-none ${
                      entry.currentlyAttending
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
                    checked={entry.currentlyAttending}
                    onChange={(e) =>
                      handleCurrentlyAttendingChange(entry.id, e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Currently Attending
                </label>
              </div>

              <div className="mt-5">
                <label
                  htmlFor={fieldId("description")}
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id={fieldId("description")}
                  value={entry.description || ""}
                  onChange={(e) =>
                    handleFieldChange(entry.id, "description", e.target.value)
                  }
                  className="min-h-28 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
                  placeholder="Add relevant coursework, thesis, or achievements"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="dark" onClick={onGoBack}>
          Go Back
        </Button>

        <Button variant="success" onClick={handleAddEducation}>
          Add Education
        </Button>
      </div>
    </section>
  );
}
