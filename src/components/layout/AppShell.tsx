import TopNav from "@/components/layout/TopNav";
import SideNav from "@/components/layout/SideNav";
import BottomNav from "@/components/layout/BottomNav";

export default function AppShell({
  children,
  currentGroupName,
  premiumLabel
}: {
  children: React.ReactNode;
  currentGroupName?: string;
  premiumLabel?: string;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg-base)]">
      <TopNav currentGroupName={currentGroupName} premiumLabel={premiumLabel} />
      <div className="mx-auto flex w-full max-w-6xl min-w-0 gap-6 px-4 pb-32 pt-6 md:px-6">
        <SideNav />
        <main className="min-w-0 flex-1 space-y-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
