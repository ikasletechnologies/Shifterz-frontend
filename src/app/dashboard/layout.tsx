import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import DashboardLayoutClient from "@/components/layout/DashboardLayoutClient";
import { SetupGate } from "@/modules/setup/components/SetupGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SetupGate>
      <DashboardLayoutClient>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </DashboardLayoutClient>
    </SetupGate>
  );
}
