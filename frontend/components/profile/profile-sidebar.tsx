import { type ProfileSection } from "./profile-types";

interface ProfileSidebarProps {
  activeSection: ProfileSection;
  onSectionChange: (section: ProfileSection) => void;
}

const profileSections: Array<{ id: ProfileSection; label: string }> = [
  { id: "personal", label: "Personal Details" },
  { id: "academic", label: "Academic Details" },
  { id: "professional", label: "Professional Details" },
];

export default function ProfileSidebar({
  activeSection,
  onSectionChange,
}: ProfileSidebarProps) {
  const getItemClasses = (section: ProfileSection) => {
    return activeSection === section
      ? "bg-blue-600 text-white shadow-md"
      : "bg-white text-gray-700 hover:bg-gray-100";
  };

  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Edit Profile
      </h2>

      <div className="space-y-3">
        {profileSections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSectionChange(section.id)}
            aria-current={activeSection === section.id ? "step" : undefined}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left font-medium transition ${getItemClasses(
              section.id
            )}`}
          >
            <span>{section.label}</span>
            {activeSection === section.id && <span aria-hidden="true">&gt;</span>}
          </button>
        ))}
      </div>
    </aside>
  );
}
