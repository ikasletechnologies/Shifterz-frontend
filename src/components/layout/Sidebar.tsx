"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import {
  Car,
  Ticket,
  Users,
  FileText,
  CreditCard,
  Package,
  Briefcase,
  Building2,
  Users2,
  PieChart,
  Settings,
  Grid3x3,
  LogOut,
  Lock,
  X,
  UserCheck,
  Clock,
  User,
  Wrench,
  ShieldCheck,
  GitPullRequest,
  CheckSquare,
  LayoutList,
  PlusSquare,
  UsersRound,
  UserCog,
  PackageSearch,
  PackageCheck,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  ClipboardCheck,
  ConciergeBell,
  BadgeCheck,
  UserRoundCog,
  Bell,
  ActivitySquare,
  ScrollText,
  Shield,
  Database,
  ChevronDown,
  ChevronRight,
  HardHat,
  Headset,
  Key,
} from "lucide-react";
import { SidebarContext } from "@/lib/context/SidebarContext";

// ── Types ─────────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  module?: string;
  children?: Omit<NavItem, "children">[];
}
interface NavSection {
  label: string;
  items: NavItem[];
}

// ── FRANCHISE CONTROL sub-items ───────────────────────────────────────────────
const franchiseControlChildren: Omit<NavItem, "children">[] = [
  // { label: "Franchise Requests", icon: GitPullRequest, href: "/dashboard/franchise-control/requests" },
  // { label: "Franchise Approval", icon: CheckSquare, href: "/dashboard/franchise-control/approval" },
  // { label: "Franchise Management", icon: LayoutList, href: "/dashboard/franchise-control/management" },
  { label: "All Franchises", icon: Building2, href: "/dashboard/franchise-control/all" },
  { label: "Add Franchise", icon: PlusSquare, href: "/dashboard/franchise-control/add" },
  { label: "Franchise Employees", icon: UsersRound, href: "/dashboard/franchise-control/users" },
  { label: "Employee Approval", icon: UserCog, href: "/dashboard/franchise-control/employee-approval" },
];

// ── HQ sidebar (Super Admin & HQ User) ───────────────────────────────────────
export const hqSidebarSections: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [{ label: "Dashboard", icon: Grid3x3, href: "/dashboard", module: "dashboard" }],
  },
  {
    label: "WORKSHOP",
    items: [
      { label: "Car In / Out", icon: Car, href: "/dashboard/carin", module: "carin" },
      { label: "Job Cards", icon: Briefcase, href: "/dashboard/jobs", module: "jobs" },
      { label: "Live Status", icon: ActivitySquare, href: "/dashboard/live-status", module: "jobs" },
    ],
  },
  {
    label: "CRM",
    items: [
      { label: "Leads", icon: Users, href: "/dashboard/leads", module: "leads" },
      { label: "Customers", icon: Users2, href: "/dashboard/customers", module: "customers" },
    ],
  },
  {
    label: "SALES & BILLING",
    items: [
      { label: "Billing", icon: FileText, href: "/dashboard/billing", module: "billing" },
      { label: "Payments", icon: CreditCard, href: "/dashboard/payments", module: "payments" },
      { label: "Warranties", icon: Shield, href: "/dashboard/warranties", module: "billing" },
    ],
  },
  {
    label: "INVENTORY",
    items: [{ label: "Inventory", icon: Package, href: "/dashboard/inventory", module: "inventory" }],
  },
  {
    label: "ANALYTICS",
    items: [{ label: "Reports", icon: PieChart, href: "/dashboard/reports", module: "reports" }],
  },
  {
    label: "HR & STAFF",
    items: [
      { label: "Employees", icon: UserCheck, href: "/dashboard/employees", module: "employees" },
      { label: "Technicians", icon: HardHat, href: "/dashboard/technicians", module: "employees" },
      { label: "QC Inspection", icon: ShieldCheck, href: "/dashboard/qc", module: "jobs" },
      { label: "Service Advisors", icon: Headset, href: "/dashboard/service-advisors", module: "employees" },
      { label: "Attendance", icon: Clock, href: "/dashboard/attendance", module: "attendance" },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      {
        label: "Franchises",
        icon: Building2,
        href: "/dashboard/franchise",
        children: franchiseControlChildren,
        module: "franchise"
      },
      { label: "Services", icon: Wrench, href: "/dashboard/services", module: "services" },
      { label: "Vendor & Purchase Management", icon: ShoppingCart, href: "/dashboard/franchise-control/purchases", module: "inventory" },
      { label: "Masters & Config", icon: Database, href: "/dashboard/masters", module: "settings" },
      { label: "User Management", icon: UserRoundCog, href: "/dashboard/franchise-control/users", module: "employees" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "Settings", icon: Settings, href: "/dashboard/settings", module: "settings" },
      { label: "Roles & Permissions", icon: ShieldCheck, href: "/dashboard/roles", module: "roles" },
      { label: "License Management", icon: Key, href: "/dashboard/franchise-control/licenses", module: "settings" },
      { label: "Audit Logs", icon: ScrollText, href: "/dashboard/franchise-control/audit-logs", module: "settings" },
      { label: "Notifications", icon: Bell, href: "/dashboard/franchise-control/notifications", module: "settings" },
      { label: "Profile", icon: User, href: "/dashboard/profile" },
    ],
  },
];

// ── Franchise / Branch / Customized role sidebar master list ──────────────────
export const franchiseSidebarSections: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [{ label: "Dashboard", icon: Grid3x3, href: "/dashboard", module: "dashboard" }],
  },
  {
    label: "WORKSHOP",
    items: [
      { label: "Car In / Out", icon: Car, href: "/dashboard/carin", module: "carin" },
      { label: "Job Cards", icon: Briefcase, href: "/dashboard/jobs", module: "jobs" },
      { label: "Live Status", icon: ActivitySquare, href: "/dashboard/live-status", module: "jobs" },
    ],
  },
  {
    label: "CRM",
    items: [
      { label: "Leads", icon: Users, href: "/dashboard/leads", module: "leads" },
      { label: "Customers", icon: Users2, href: "/dashboard/customers", module: "customers" },
    ],
  },
  {
    label: "SALES & BILLING",
    items: [
      { label: "Billing", icon: FileText, href: "/dashboard/billing", module: "billing" },
      { label: "Payments", icon: CreditCard, href: "/dashboard/payments", module: "payments" },
      { label: "Warranties", icon: Shield, href: "/dashboard/warranties", module: "billing" },
    ],
  },
  {
    label: "INVENTORY",
    items: [{ label: "Inventory", icon: Package, href: "/dashboard/inventory", module: "inventory" }],
  },
  {
    label: "ANALYTICS",
    items: [{ label: "Reports", icon: PieChart, href: "/dashboard/reports", module: "reports" }],
  },
  {
    label: "HR & STAFF",
    items: [
      { label: "Employees", icon: UserCheck, href: "/dashboard/employees", module: "employees" },
      { label: "Technicians", icon: HardHat, href: "/dashboard/technicians", module: "employees" },
      { label: "QC Inspection", icon: ShieldCheck, href: "/dashboard/qc", module: "jobs" },
      { label: "Service Advisors", icon: Headset, href: "/dashboard/service-advisors", module: "employees" },
      { label: "Attendance", icon: Clock, href: "/dashboard/attendance", module: "attendance" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "Settings", icon: Settings, href: "/dashboard/settings", module: "settings" },
      { label: "Roles & Permissions", icon: ShieldCheck, href: "/dashboard/roles", module: "roles" },
      { label: "Profile", icon: User, href: "/dashboard/profile" },
    ],
  },
];

// ── Billing role sidebar ──────────────────────────────────────────────────────
export const billingSidebarSections: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", icon: Grid3x3, href: "/dashboard", module: "dashboard" },
    ],
  },
  {
    label: "WORKSHOP",
    items: [
      { label: "Ready For Billing", icon: Briefcase, href: "/dashboard/jobs?status=Ready For Billing", module: "jobs" },
    ],
  },
  {
    label: "SALES & BILLING",
    items: [
      { label: "Billing", icon: FileText, href: "/dashboard/billing", module: "billing" },
      { label: "Payments", icon: CreditCard, href: "/dashboard/payments", module: "payments" },
    ],
  },
  {
    label: "ANALYTICS",
    items: [
      { label: "Reports", icon: PieChart, href: "/dashboard/reports", module: "reports" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "Profile", icon: User, href: "/dashboard/profile" },
    ],
  },
];

// ── Technician role sidebar ────────────────────────────────────────────
export const technicianSidebarSections: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", icon: Grid3x3, href: "/technician", module: "dashboard" },
    ],
  },
  {
    label: "HR & STAFF",
    items: [
      { label: "Attendance", icon: Clock, href: "/technician/attendance" },
      { label: "My Jobs", icon: Briefcase, href: "/technician/my-jobs" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "Profile", icon: User, href: "/technician/profile" },
    ],
  },
];

// ── Service Advisor role sidebar ──────────────────────────────────────
export const serviceAdvisorSidebarSections: NavSection[] = [
  {
    label: "MAIN MENU",
    items: [
      { label: "Dashboard", icon: Grid3x3, href: "/dashboard", module: "dashboard" },
      { label: "Customers", icon: Users2, href: "/dashboard/customers", module: "customers" },
      { label: "Car In / Out", icon: Car, href: "/dashboard/carin", module: "carin" },
      { label: "Job Cards", icon: Briefcase, href: "/dashboard/jobs", module: "jobs" },
      { label: "My Assigned Jobs", icon: ClipboardCheck, href: "/technician/my-jobs" },
      { label: "My  Profile", icon: User, href: "/dashboard/profile" },
    ],
  }
];

// ── NavLink component ────────────────────────────────────────────────────────
function NavLink({
  item,
  pathname,
  depth = 0,
}: {
  item: NavItem;
  pathname: string;
  depth?: number;
}) {
  const hasChildren = item.children && item.children.length > 0;

  const anyChildActive =
    hasChildren &&
    item.children!.some((c) => pathname.startsWith(c.href));

  const [open, setOpen] = useState(anyChildActive ?? false);

  const isActive =
    item.href === "/dashboard" || item.href === "/technician"
      ? pathname === item.href
      : pathname.startsWith(item.href) && !hasChildren;

  const Icon = item.icon;
  const Chevron = open ? ChevronDown : ChevronRight;

  const activeStyle = {
    background: "linear-gradient(90deg, rgba(250,204,21,0.18) 0%, rgba(250,204,21,0.06) 100%)",
    borderLeft: "3px solid #facc15",
    color: "#facc15",
  };
  const inactiveStyle = {
    borderLeft: "3px solid transparent",
    color: "rgba(255,255,255,0.6)",
  };
  const parentOpenStyle = {
    borderLeft: "3px solid rgba(250,204,21,0.4)",
    color: "rgba(255,255,255,0.85)",
  };

  const paddingLeft = depth === 0 ? "12px" : "20px";

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            ...(open ? parentOpenStyle : inactiveStyle),
            paddingLeft,
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            paddingTop: "10px",
            paddingBottom: "10px",
            paddingRight: "12px",
            borderRadius: "0 8px 8px 0",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            background: open ? "rgba(250,204,21,0.06)" : "transparent",
            transition: "all 150ms",
          }}
          className="hover:bg-white/5 hover:text-white"
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <Chevron className="w-3.5 h-3.5 shrink-0 opacity-60" />
        </button>

        <div
          style={{
            overflow: "hidden",
            maxHeight: open ? `${item.children!.length * 44}px` : "0px",
            transition: "max-height 280ms cubic-bezier(0.4,0,0.2,1)",
            borderLeft: "2px solid rgba(250,204,21,0.15)",
            marginLeft: "23px",
          }}
        >
          {item.children!.map((child) => {
            const childActive = pathname.startsWith(child.href);
            const ChildIcon = child.icon;
            return (
              <Link
                key={child.href}
                href={child.href}
                style={
                  childActive
                    ? {
                      background: "linear-gradient(90deg, rgba(250,204,21,0.14) 0%, rgba(250,204,21,0.04) 100%)",
                      borderLeft: "2px solid #facc15",
                      color: "#facc15",
                      marginLeft: "-2px",
                    }
                    : {
                      borderLeft: "2px solid transparent",
                      color: "rgba(255,255,255,0.5)",
                      marginLeft: "-2px",
                    }
                }
                className={`
                  flex items-center gap-2.5 px-3 py-2 rounded-r-lg
                  text-xs font-medium transition-all duration-150
                  ${!childActive ? "hover:bg-white/5 hover:text-white" : ""}
                `}
              >
                <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{child.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      style={{ ...(isActive ? activeStyle : inactiveStyle), paddingLeft }}
      className={`
        flex items-center gap-3 py-2.5 pr-3 rounded-r-lg rounded-l-none
        text-sm font-medium transition-all duration-150
        ${!isActive ? "hover:bg-white/5 hover:text-white" : ""}
      `}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const { toggleSidebar } = useContext(SidebarContext);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[] | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
        setUserPermissions(user.permissions || null);
        setUserName(user.name || user.username || "");
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();
    document.cookie = "token=; path=/; max-age=0";
    window.location.href = "/login";
  };

  // Filter sections dynamically based on role + optional custom modules
  let baseRole = userRole || "";
  let allowedModules: string[] | null = userPermissions;
  
  // Fallback for legacy database rows without permissions column:
  if (!allowedModules && baseRole.includes("|")) {
    const parts = baseRole.split("|");
    baseRole = parts[0];
    allowedModules = parts[1].split(",").filter(Boolean);
  }

  // 1. Choose root list
  let rawSections =
    baseRole === "SUPER_ADMIN" || baseRole === "HQ_USER"
      ? hqSidebarSections
      : franchiseSidebarSections;

  if (baseRole === "TECHNICIAN" || baseRole === "EMPLOYEE") {
    rawSections = technicianSidebarSections;
  } else if (baseRole === "BILLING") {
    rawSections = billingSidebarSections;
  } else if (baseRole === "SERVICE_ADVISOR") {
    rawSections = serviceAdvisorSidebarSections;
  }

  // 2. Filter list based on custom modules (if present)
  const sections = rawSections
    .map((sec) => {
      const filteredItems = sec.items.filter((item) => {
        if (baseRole === "SUPER_ADMIN") return true;
        if (!item.module || !allowedModules) return true;
        return allowedModules.includes(item.module);
      });
      return {
        ...sec,
        items: filteredItems,
      };
    })
    .filter((sec) => sec.items.length > 0);

  const cleanRoleName = baseRole.replace(/_/g, " ");

  return (
    <aside
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
      className="w-64 h-screen flex flex-col select-none"
    >
      {/* ── Logo ── */}
      <div
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        className="p-5 flex items-center justify-between min-h-[76px]"
      >
        <div className="flex flex-col items-start">
          <Image
            src="/logo.svg"
            alt="Shifterz Logo"
            width={160}
            height={52}
            className="h-12 w-auto"
            priority
          />
          <span
            style={{ color: "#facc15", letterSpacing: "0.2em" }}
            className="text-[9px] font-bold mt-1 ml-0.5"
          >
            PRO SUITE
          </span>
        </div>

        {/* Close button – mobile only */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-1.5 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          title="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── User badge ── */}
      {userName && (
        <div
          style={{
            background: "rgba(250,204,21,0.08)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
          className="px-5 py-3 flex items-center gap-3"
        >
          <div
            style={{
              background: "linear-gradient(135deg, #facc15, #f59e0b)",
              flexShrink: 0,
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-900 font-bold text-sm"
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-semibold truncate">{userName}</p>
            <p style={{ color: "rgba(255,255,255,0.4)" }} className="text-[10px] uppercase tracking-wide truncate">
              {cleanRoleName}
            </p>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto scrollbar-hidden">
        {sections.map((section, idx) => (
          <div key={idx} className="mb-2">
            {/* Section heading */}
            <p
              style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em" }}
              className="px-3 text-[10px] font-bold uppercase mb-1 mt-4 first:mt-0"
            >
              {section.label}
            </p>

            {section.items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        ))}
      </nav>

      {/* ── Logout ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} className="p-3">
        <button
          onClick={handleLogout}
          style={{ color: "rgba(255,255,255,0.5)", borderLeft: "3px solid transparent" }}
          className="
            flex items-center gap-3 px-3 py-2.5 w-full rounded-r-lg rounded-l-none
            text-sm font-medium transition-all duration-150
            hover:bg-red-500/10 hover:text-red-400
          "
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
