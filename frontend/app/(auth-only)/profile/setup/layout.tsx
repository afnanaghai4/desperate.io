import ProtectedShell from "@/components/auth/protected-shell";

export default function ProfileSetupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedShell requireProfile={false} showNavbar={false}>
      {children}
    </ProtectedShell>
  );
}
