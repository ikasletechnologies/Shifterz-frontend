"use client";

import { useState, useEffect, useContext } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Settings, User, LogOut, Clock, Menu, CheckCheck } from "lucide-react";
import { getSettings, getNotifications, markAllNotificationsRead } from "@/lib/api";
import { SidebarContext } from "@/lib/context/SidebarContext";
import {
  hqSidebarSections,
  franchiseSidebarSections,
  billingSidebarSections,
  technicianSidebarSections,
  receptionistSidebarSections,
} from "./Sidebar";

function getPageHeaderTitle(pathname: string): string {
  if (!pathname) {
    return "Dashboard";
  }

  const allSections = [
    ...hqSidebarSections,
    ...franchiseSidebarSections,
    ...billingSidebarSections,
    ...technicianSidebarSections,
    ...receptionistSidebarSections,
  ];

  const allItems: { label: string; href: string }[] = [];
  allSections.forEach((section) => {
    section.items.forEach((item) => {
      allItems.push({ label: item.label, href: item.href });
      if (item.children) {
        item.children.forEach((child) => {
          allItems.push({ label: child.label, href: child.href });
        });
      }
    });
  });

  // Sort by length descending for best match
  allItems.sort((a, b) => b.href.length - a.href.length);

  for (const item of allItems) {
    if (item.href === "/dashboard" || item.href === "/technician") {
      if (pathname === item.href) return item.label;
    } else if (pathname.startsWith(item.href)) {
      return item.label;
    }
  }

  // Fallback
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] || "dashboard";
  const title = lastSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return title || "Dashboard";
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

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

    async function loadNotifs() {
      try {
        const notifs = await getNotifications();
        if (Array.isArray(notifs)) {
          setNotifications(notifs);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    }
    loadNotifs();

    return () => clearInterval(timer);
  }, []);

  const pageTitle = getPageHeaderTitle(pathname);

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
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Current Time Display */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 hidden md:flex">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">{currentTime}</span>
          </div>

          <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

          {/* Notification Bell (§17.6) */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              onBlur={() => setTimeout(() => setIsNotifOpen(false), 200)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifications.filter((n) => !n.read).length > 9 ? "9+" : notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-900">
                    Notifications ({notifications.filter((n) => !n.read).length} unread)
                  </span>
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <button
                      onMouseDown={async (e) => {
                        e.preventDefault();
                        await markAllNotificationsRead();
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: true }))
                        );
                      }}
                      className="text-xs text-blue-600 font-semibold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((n: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 text-left transition-colors ${
                          n.read ? "bg-white text-gray-600" : "bg-blue-50/40 text-gray-900"
                        }`}
                      >
                        <p className="text-xs font-bold truncate">{n.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="pt-2 px-4 border-t border-gray-100 text-center">
                  <Link
                    href="/dashboard/franchise-control/notifications"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 block py-1"
                  >
                    View All in Notification Center →
                  </Link>
                </div>
              </div>
            )}
          </div>

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
