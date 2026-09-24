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
  Receipt,
  Hammer,
  Camera,
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
      { label: "Car In", icon: Car, href: "/dashboard/carin", module: "carin" },
      { label: "Job Cards", icon: Briefcase, href: "/dashboard/jobs", module: "jobs" },
      { label: "Vehicle Inspection", icon: Camera, href: "/dashboard/vehicle-inspection", module: "carin" },
      { label: "QC", icon: ShieldCheck, href: "/dashboard/qc", module: "jobs" },
      { label: "Out Pass", icon: Ticket, href: "/dashboard/outpass", module: "outpass" },
      { label: "Workshop", icon: Hammer, href: "/dashboard/workshop", module: "jobs" },
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
    label: "HR & STAFF",
    items: [
      { label: "Employees", icon: UserCheck, href: "/dashboard/employees", module: "employees" },
      { label: "Technicians", icon: HardHat, href: "/dashboard/technicians", module: "employees" },
      { label: "Service Advisors", icon: Headset, href: "/dashboard/service-advisors", module: "employees" },
      { label: "Billing Staff", icon: Receipt, href: "/dashboard/billing-staff", module: "employees" },
      { label: "Receptionists", icon: ConciergeBell, href: "/dashboard/receptionists", module: "employees" },
      { label: "Inventory Staff", icon: PackageSearch, href: "/dashboard/inventory-staff", module: "employees" },
      { label: "Attendance", icon: Clock, href: "/dashboard/attendance", module: "attendance" },
    ],
  },
  {
    label: "FRANCHISE",
    items: franchiseControlChildren,
  },
  {
    label: "MANAGEMENT",
    items: [
      { label: "Services", icon: Wrench, href: "/dashboard/services", module: "services" },
      { label: "Vendor & Purchase Management", icon: ShoppingCart, href: "/dashboard/franchise-control/purchases", module: "inventory" },
      { label: "Masters & Config", icon: Database, href: "/dashboard/masters", module: "settings" },
      { label: "User Management", icon: UserRoundCog, href: "/dashboard/franchise-control/users", module: "employees" },
    ],
  },
  {
    label: "ANALYTICS",
    items: [{ label: "Reports", icon: PieChart, href: "/dashboard/reports", module: "reports" }],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "Company Profile", icon: Settings, href: "/dashboard/settings", module: "settings" },
      { label: "Roles & Permissions", icon: ShieldCheck, href: "/dashboard/roles", module: "roles" },
      { label: "License Management", icon: Key, href: "/dashboard/franchise-control/licenses", module: "settings" },
      { label: "Audit Logs", icon: ScrollText, href: "/dashboard/franchise-control/audit-logs", module: "settings" },
      { label: "Notifications", icon: Bell, href: "/dashboard/franchise-control/notifications", module: "settings" },
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
      { label: "Car In", icon: Car, href: "/dashboard/carin", module: "carin" },
      { label: "Job Cards", icon: Briefcase, href: "/dashboard/jobs", module: "jobs" },
      { label: "Live Status", icon: ActivitySquare, href: "/dashboard/live-status", module: "jobs" },
      { label: "Out Pass", icon: Ticket, href: "/dashboard/outpass", module: "outpass" },
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
      { label: "QC", icon: ShieldCheck, href: "/dashboard/qc", module: "jobs" },
      { label: "Service Advisors", icon: Headset, href: "/dashboard/service-advisors", module: "employees" },
      { label: "Billing Staff", icon: Receipt, href: "/dashboard/billing-staff", module: "employees" },
      { label: "Receptionists", icon: ConciergeBell, href: "/dashboard/receptionists", module: "employees" },
      { label: "Inventory Staff", icon: PackageSearch, href: "/dashboard/inventory-staff", module: "employees" },
      { label: "Attendance", icon: Clock, href: "/dashboard/attendance", module: "attendance" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "Company Profile", icon: Settings, href: "/dashboard/settings", module: "settings" },
      { label: "Roles & Permissions", icon: ShieldCheck, href: "/dashboard/roles", module: "roles" },
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
    label: "SALES & BILLING",
    items: [
      { label: "Billing", icon: FileText, href: "/dashboard/billing", module: "billing" },
      { label: "Payments", icon: CreditCard, href: "/dashboard/payments", module: "payments" },
      { label: "Warranties", icon: Shield, href: "/dashboard/warranties", module: "billing" },
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
// ── Receptionist role sidebar ───────────────────────────────────────────
export const receptionistSidebarSections: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", icon: Grid3x3, href: "/dashboard", module: "dashboard" },
    ],
  },
  {
    label: "FRONT DESK",
    items: [
      { label: "Car In", icon: Car, href: "/dashboard/carin", module: "carin" },
      { label: "Outpass", icon: Ticket, href: "/dashboard/outpass", module: "outpass" },
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
    label: "SETTINGS",
    items: [
      { label: "Profile", icon: User, href: "/dashboard/profile" },
    ],
  },
];


// Matches href exactly, or as a path segment (so "/dashboard/inventory" doesn't
// falsely match "/dashboard/inventory-staff").
function isPathActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/technician") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(href + "/");
}

// ── NavLink component ────────────────────────────────────────────────────────
function NavLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const hasChildren = item.children && item.children.length > 0;

  const anyChildActive =
    hasChildren &&
    item.children!.some((c) => isPathActive(pathname, c.href));

  const [open, setOpen] = useState(anyChildActive ?? false);

  useEffect(() => {
    if (anyChildActive) {
      setOpen(true);
    }
  }, [anyChildActive]);

  const isActive = !hasChildren && isPathActive(pathname, item.href);

  const Icon = item.icon;

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`
            w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] select-none group active:scale-[0.98]
            ${open || anyChildActive
              ? "bg-[#162032] text-white shadow-xs"
              : "text-slate-400 hover:bg-[#162032]/80 hover:text-white"
            }
          `}
        >
          {Icon && (
            <Icon
              className={`w-5 h-5 shrink-0 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 ${anyChildActive || open ? "text-slate-300" : "text-slate-400 group-hover:text-slate-200"
                }`}
            />
          )}
          <span className="flex-1 text-left truncate">{item.label}</span>
          <ChevronDown
            className={`w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-200 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "rotate-180 text-slate-300" : ""
              }`}
          />
        </button>

        <div
          className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 pointer-events-none"
            }`}
        >
          <div className="overflow-hidden space-y-1 pl-4 border-l border-slate-800/80 ml-3.5">
            {item.children!.map((child) => {
              const childActive = isPathActive(pathname, child.href);
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium
                    transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group active:scale-[0.98]
                    ${childActive
                      ? "bg-[#182235] text-white font-semibold border border-slate-700/60 shadow-sm"
                      : "text-slate-400 hover:bg-[#162032]/80 hover:text-white"
                    }
                  `}
                >
                  {ChildIcon ? (
                    <ChildIcon
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 ${childActive ? "text-slate-300" : "text-slate-400 group-hover:text-slate-200"
                        }`}
                    />
                  ) : (
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${childActive ? "bg-slate-300 scale-125" : "bg-slate-500 group-hover:bg-slate-300"
                        }`}
                    />
                  )}
                  <span className="truncate">{child.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`
        flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] group select-none active:scale-[0.98]
        ${isActive
          ? "bg-[#182235] text-white font-semibold border border-slate-700/60 shadow-sm"
          : "text-slate-400 hover:bg-[#162032]/80 hover:text-white"
        }
      `}
    >
      {Icon && (
        <Icon
          className={`w-5 h-5 shrink-0 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 ${isActive
              ? "text-slate-300"
              : "text-slate-400 group-hover:text-slate-200"
            }`}
        />
      )}
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const { toggleSidebar } = useContext(SidebarContext);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
        setUserPermissions(user.permissions || null);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

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
  } else if (baseRole === "BILLING" || baseRole === "BILLING_EXECUTIVE") {
    rawSections = billingSidebarSections;
  } else if (baseRole === "RECEPTIONIST" || baseRole === "RECEPTION_EXECUTIVE") {
    rawSections = receptionistSidebarSections;
  }

  // 2. Filter list based on custom modules (if present)
  const sections = rawSections
    .map((sec) => {
      const filteredItems = sec.items.filter((item) => {
        if (baseRole === "SUPER_ADMIN") return true;
        if ((item.module === "outpass" || item.module === "attendance") && (baseRole === "SERVICE_ADVISOR" || baseRole.includes("SERVICE_ADVISOR"))) return true;
        if (!item.module || !allowedModules) return true;
        return allowedModules.includes(item.module);
      });
      return {
        ...sec,
        items: filteredItems,
      };
    })
    .filter((sec) => sec.items.length > 0);

  return (
    <aside className="w-64 h-screen bg-[#0B0E17] border-r border-slate-800/70 flex flex-col select-none">
      {/* ── Logo ── */}
      <div className="p-4 border-b border-slate-800/60 flex items-center justify-between min-h-[72px] shrink-0">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Shifterz Logo"
            width={160}
            height={52}
            className="h-10 w-auto"
            priority
          />
          <span className="font-outfit font-bold text-lg text-white tracking-wide">
            SHIFTERS ERP
          </span>
        </div>

        {/* Close button – mobile only */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors duration-200"
          title="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3.5 py-4 overflow-y-auto space-y-5 scrollbar-hidden">
        {sections.map((section, idx) => (
          <div key={idx} className={idx > 0 ? "pt-4 border-t border-slate-800/60" : ""}>
            {/* Section heading */}
            {section.label && (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {section.label}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
