type InputFieldProps = {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
};

export default function InputField({
  id,
  label,
  type = "text",
  placeholder,
}: InputFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-black"
      />
    </div>
  );
}