"use client";

import {InputType} from '@/types/job';

type Props = {
    value: InputType;
    onChange: (type: InputType) => void;
};

export default function JobInputToggle({ value, onChange }: Props) {
    const isText = value === "TEXT";
    const isLink = value === "LINK";
    
    return (
    <div className="w-full" role="group" aria-label="Job input type selection">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => onChange("TEXT")}
          aria-pressed={isText}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            isText
              ? "bg-white shadow text-black"
              : "text-gray-600 hover:text-black"
          }`}
        >
          Paste Text
        </button>

        <button
          type="button"
          onClick={() => onChange("LINK")}
          aria-pressed={isLink}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            isLink
              ? "bg-white shadow text-black"
              : "text-gray-600 hover:text-black"
          }`}
        >
          Job Link
        </button>
      </div>
    </div>
  );
}
