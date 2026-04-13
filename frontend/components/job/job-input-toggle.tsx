"use client";

import {InputType} from '@/lib/job-api';

type Props = {
    value: InputType;
    onChange: (type: InputType) => void;
};

export default function JobInputToggle({ value, onChange }: Props) {
    const isText = value === InputType.TEXT;
    const isLink = value === InputType.LINK;
    
    return (
    <div className="w-full" role="group" aria-label="Job input type selection">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => onChange(InputType.TEXT)}
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
          onClick={() => onChange(InputType.LINK)}
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
