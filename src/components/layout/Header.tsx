"use client";

import { useState, useEffect, useContext } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Settings, User, LogOut, Clock, Menu } from "lucide-react";
import { getSettings } from "@/lib/api";
import { SidebarContext } from "@/lib/context/SidebarContext";

const pageHeaders: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Welcome to Shifterz Pro Suite",
  },
  "/carin": {
    title: "Car In",
    description: "Manage vehicle check-in and check-out",
  },
  "/outpass": {
    title: "Out Pass",
    description: "Manage vehicle out passes",
  },
  "/leads": {
    title: "Leads",
    description: "Manage your sales leads",
  },
  "/billing": {
    title: "Billing",
    description: "Manage billing documents",
  },
  "/payments": {
    title: "Payments",
    description: "Track and manage payments",
  },
  "/services": {
    title: "Services",
    description: "Manage services offered",
  },
  "/inventory": {
    title: "Inventory",
    description: "Manage inventory items",
  },
  "/jobs": {
    title: "Job Cards",
    description: "Manage job cards",
  },
  "/franchise": {
    title: "Franchise",
    description: "Manage franchise locations",
  },
  "/customers": {
    title: "Customers",
    description: "Manage customer information",
  },
  "/reports": {
    title: "Reports",
    description: "View business reports",
  },
  "/settings": {
    title: "Settings",
    description: "Configure your settings",
  },
  "/technician": {
    title: "Technician Portal",
    description: "Manage your assigned jobs",
  },
};

function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export default function Header() {
  const pathname = usePathname();
  const sidebarContext = useContext(SidebarContext);
  const toggleSidebar = sidebarContext?.toggleSidebar || (() => {});
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [companyInitials, setCompanyInitials] = useState("AD");
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.username);
        setUserRole(user.role);
      } catch (e) {}
    }

    setCurrentTime(getCurrentTime());
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    async function loadCompany() {
      try {
        const data = await getSettings();
        const companyName = data?.companyInfo?.name || data?.companyName;
        if (companyName) {
          const words = companyName.trim().split(/\s+/);
          if (words.length > 1) {
            setCompanyInitials((words[0][0] + words[1][0]).toUpperCase());
          } else if (words[0].length >= 2) {
            setCompanyInitials(words[0].substring(0, 2).toUpperCase());
          } else {
            setCompanyInitials(words[0].toUpperCase());
          }
        }
      } catch (err) {
        console.error("Failed to load company info for header", err);
      }
    }
    loadCompany();

    return () => clearInterval(timer);
  }, []);

  const pageInfo = pageHeaders[pathname] || {
    title: "Dashboard",
    description: "Welcome to Shifterz Pro Suite",
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageInfo.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{pageInfo.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Current Time Display */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 hidden md:flex">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">{currentTime}</span>
          </div>

          <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

          <div className="flex items-center text-right hidden md:block">
            <p className="text-sm font-bold text-gray-900 capitalize">{userName || "User"}</p>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              {userRole === "SUPER_ADMIN" ? "Headquarters" : userRole === "FRANCHISE_ADMIN" ? "Franchise Admin" : userRole?.replace("_", " ")}
            </p>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              onBlur={() => setTimeout(() => setIsProfileOpen(false), 200)}
              className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-gray-900 ml-2 hover:ring-2 hover:ring-yellow-500 hover:ring-offset-2 transition-all focus:outline-none"
            >
              {companyInitials}
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <Link 
                  href="/dashboard/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                  onMouseDown={(e) => {
                    // Prevent default to avoid blur, or just let it redirect
                    setIsProfileOpen(false);
                  }}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <div className="h-px bg-gray-100 my-1"></div>
                <button 
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevents the button from losing focus immediately
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    sessionStorage.clear();
                    document.cookie = "token=; path=/; max-age=0";
                    window.location.href = '/login';
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
