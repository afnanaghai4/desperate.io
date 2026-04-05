type ProfileSection = "personal" | "professional";

interface ProfileSidebarProps {
    activeSection: ProfileSection;
    onSectionChange: (section: ProfileSection) => void;
}

export default function ProfileSidebar({ activeSection, onSectionChange }: ProfileSidebarProps) {
    const getItemClasses = (section: ProfileSection) => {
        return activeSection === section
        ? "bg-blue-600 text-white shadow-md"
        : "bg-white text-gray-700 hover:bg-gray-100";
    };

    return(
           <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Edit Profile</h2>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onSectionChange("personal")}
          className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left font-medium transition ${getItemClasses(
            "personal"
          )}`}
        >
          <span>Personal Details</span>
          {activeSection === "personal" && <span>➜</span>}
        </button>

        <button
          type="button"
          onClick={() => onSectionChange("professional")}
          className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left font-medium transition ${getItemClasses(
            "professional"
          )}`}
        >
          <span>Professional Details</span>
          {activeSection === "professional" && <span>➜</span>}
        </button>
      </div>
    </aside>
  );
}
