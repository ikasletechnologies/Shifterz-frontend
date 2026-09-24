"use client";

import { useState, ReactNode, Children, useEffect } from "react";
import { SidebarContext } from "@/lib/context/SidebarContext";

interface DashboardLayoutClientProps {
  children: ReactNode;
}

export default function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const isSmallScreen = window.innerWidth < 1024;
    setIsSidebarOpen(!isSmallScreen);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const childrenArray = Children.toArray(children);

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Overlay for mobile and tablet with ultra-smooth fade transition */}
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar wrapper with smooth spring-like slide easing */}
        <div
          className={`fixed lg:relative z-40 h-screen shrink-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isSidebarOpen
              ? "translate-x-0 w-64 opacity-100"
              : "-translate-x-full lg:w-0 lg:-translate-x-full overflow-hidden opacity-0"
          }`}
        >
          {childrenArray[0]}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
          {childrenArray[1]}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
