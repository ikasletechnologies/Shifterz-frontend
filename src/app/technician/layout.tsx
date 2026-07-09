import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import DashboardLayoutClient from "@/components/layout/DashboardLayoutClient";

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutClient>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </DashboardLayoutClient>
  );
}
