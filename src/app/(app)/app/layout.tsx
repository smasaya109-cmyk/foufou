import AppShell from "@/components/layout/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell currentGroupName={undefined} premiumLabel="Free">
      {children}
    </AppShell>
  );
}
