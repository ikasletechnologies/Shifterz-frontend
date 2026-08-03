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
  "/dashboard/carin": {
    title: "Car In / Out",
    description: "Manage vehicle check-in and check-out",
  },
  "/dashboard/jobs": {
    title: "Job Card",
    description: "Manage job cards and workshop activities",
  },
  "/dashboard/outpass": {
    title: "Outpass",
    description: "Manage vehicle out passes",
  },
  "/dashboard/leads": {
    title: "Leads",
    description: "Manage your sales leads",
  },
  "/dashboard/customers": {
    title: "Customers",
    description: "Manage customer information",
  },
  "/dashboard/billing": {
    title: "Billing",
    description: "Manage billing documents and invoices",
  },
  "/dashboard/payments": {
    title: "Payments",
    description: "Track and manage payments",
  },
  "/dashboard/inventory": {
    title: "Inventory",
    description: "Manage inventory items and stock",
  },
  "/dashboard/reports": {
    title: "Reports",
    description: "View business reports and analytics",
  },
  "/dashboard/employees": {
    title: "Employees",
    description: "Manage employees and staff records",
  },
  "/dashboard/attendance": {
    title: "Attendance",
    description: "Track staff attendance",
  },
  "/dashboard/franchise": {
    title: "Franchise",
    description: "Manage franchise locations and performance",
  },
  "/dashboard/services": {
    title: "Services",
    description: "Manage services offered",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Configure system settings",
  },
  "/dashboard/roles": {
    title: "Roles & Permissions",
    description: "Manage user roles and access control",
  },
  "/dashboard/profile": {
    title: "Profile",
    description: "View and update your profile",
  },
  "/dashboard/franchise-control/users": {
    title: "User Management",
    description: "Manage user accounts and permissions",
  },
  "/dashboard/franchise-control/service-approval": {
    title: "Service Approval",
    description: "Review and approve service requests",
  },
  "/dashboard/franchise-control/roles": {
    title: "Roles & Permissions",
    description: "Configure system permissions",
  },
  "/dashboard/franchise-control/notifications": {
    title: "Notifications",
    description: "System alerts and notifications",
  },
  "/dashboard/franchise-control/activity-logs": {
    title: "Activity Logs",
    description: "View system activity history",
  },
  "/dashboard/franchise-control/audit-logs": {
    title: "Audit Logs",
    description: "View security audit trails",
  },
  "/technician": {
    title: "Technician Portal",
    description: "Manage your assigned jobs",
  },
  "/technician/my-jobs": {
    title: "My Jobs",
    description: "View and update your assigned workshop tasks",
  },
  "/technician/attendance": {
    title: "Attendance",
    description: "View your attendance record",
  },
  "/technician/profile": {
    title: "Profile",
    description: "Manage technician profile",
  },
};

// Also support routes without /dashboard prefix for fallback
Object.keys(pageHeaders).forEach((key) => {
  if (key.startsWith("/dashboard/")) {
    const shortKey = key.replace("/dashboard", "");
    if (!pageHeaders[shortKey]) {
      pageHeaders[shortKey] = pageHeaders[key];
    }
  }
});

function getPageHeader(pathname: string): { title: string; description: string } {
  if (!pathname) {
    return { title: "Dashboard", description: "Welcome to Shifterz Pro Suite" };
  }

  // 1. Direct match
  if (pageHeaders[pathname]) {
    return pageHeaders[pathname];
  }

  // 2. Normalized match (with or without /dashboard prefix)
  const normalizedPath = pathname.startsWith("/dashboard")
    ? pathname
    : `/dashboard${pathname.startsWith("/") ? "" : "/"}${pathname}`;

  if (pageHeaders[normalizedPath]) {
    return pageHeaders[normalizedPath];
  }

  // 3. Prefix matching for sub-routes
  const sortedKeys = Object.keys(pageHeaders).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (key !== "/dashboard" && (pathname.startsWith(key) || normalizedPath.startsWith(key))) {
      return pageHeaders[key];
    }
  }

  // 4. Dynamic fallback from URL route segment
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] || "dashboard";
  const title = lastSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: title || "Dashboard",
    description: "Welcome to Shifterz Pro Suite",
  };
}

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
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

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

  const pageInfo = getPageHeader(pathname);

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
