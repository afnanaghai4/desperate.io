type AuthButtonProps = {
  text: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

export default function AuthButton({
  text,
  type = "submit",
  disabled,
}: AuthButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:opacity-90"
    >
      {text}
    </button>
  );
}