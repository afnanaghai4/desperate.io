type AuthButtonProps = {
  text: string;
  type?: "button" | "submit" | "reset";
};

export default function AuthButton({
  text,
  type = "submit",
}: AuthButtonProps) {
  return (
    <button
      type={type}
      className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:opacity-90"
    >
      {text}
    </button>
  );
}