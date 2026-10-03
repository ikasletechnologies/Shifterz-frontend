"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { usePermissions } from "@/lib/permissions";

// ── Types ─────────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  module?: string;
  superAdminOnly?: boolean;
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
      { label: "Vehicle Inspection", icon: Camera, href: "/dashboard/vehicle-inspection", module: "vehicle-inspection" },
      { label: "QC", icon: ShieldCheck, href: "/dashboard/qc", module: "qc" },
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
      { label: "Vendor Management", icon: Building2, href: "/dashboard/management/vendors", module: "inventory", superAdminOnly: true },
      { label: "Purchase Orders", icon: ShoppingCart, href: "/dashboard/franchise-control/purchases", module: "inventory" },
      { label: "Services", icon: Wrench, href: "/dashboard/services", module: "services" },
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
    items: [
      { label: "Inventory", icon: Package, href: "/dashboard/inventory", module: "inventory" },
      { label: "Purchases", icon: ShoppingCart, href: "/dashboard/franchise-control/purchases", module: "inventory" },
    ],
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
      { label: "QC", icon: ShieldCheck, href: "/dashboard/qc", module: "qc" },
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
    label: "HR & STAFF",
    items: [
      { label: "Attendance", icon: Clock, href: "/dashboard/attendance", module: "attendance" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "Profile", icon: User, href: "/dashboard/profile" },
    ],
  },
];

// ── Service Advisor role sidebar ─────────────────────────────────────────────
// Default shows 3 core SA modules (Dashboard, Car In, Live Status).
// Extra modules appear automatically as Super Admin grants additional permissions.
export const serviceAdvisorSidebarSections: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [{ label: "Dashboard", icon: Grid3x3, href: "/dashboard", module: "dashboard" }],
  },
  {
    label: "WORKSHOP",
    items: [
      { label: "Car In", icon: Car, href: "/dashboard/carin", module: "carin" },
      { label: "Live Status", icon: ActivitySquare, href: "/dashboard/live-status", module: "jobs" },
      { label: "Job Cards", icon: Briefcase, href: "/dashboard/jobs", module: "jobs" },
      { label: "Vehicle Inspection", icon: Camera, href: "/dashboard/vehicle-inspection", module: "vehicle-inspection" },
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
    label: "HR & STAFF",
    items: [
      { label: "Attendance", icon: Clock, href: "/dashboard/attendance", module: "attendance" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "Profile", icon: User, href: "/dashboard/profile" },
    ],
  },
];

// ── Quality Inspector role sidebar ──────────────────────────────────────────
// Default shows 3 core QI modules (Dashboard, Vehicle Inspection, QC) and Profile.
// Extra modules appear automatically if Super Admin grants additional permissions.
export const qualityInspectorSidebarSections: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", icon: Grid3x3, href: "/dashboard", module: "dashboard" },
    ],
  },
  {
    label: "WORKSHOP / INSPECTION",
    items: [
      { label: "Vehicle Inspection", icon: Camera, href: "/dashboard/vehicle-inspection", module: "vehicle-inspection" },
      { label: "QC", icon: ShieldCheck, href: "/dashboard/qc", module: "qc" },
      { label: "Car In", icon: Car, href: "/dashboard/carin", module: "carin" },
      { label: "Job Cards", icon: Briefcase, href: "/dashboard/jobs", module: "jobs" },
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
    ],
  },
  {
    label: "INVENTORY",
    items: [
      { label: "Inventory", icon: Package, href: "/dashboard/inventory", module: "inventory" },
    ],
  },
  {
    label: "ANALYTICS",
    items: [
      { label: "Reports", icon: PieChart, href: "/dashboard/reports", module: "reports" },
    ],
  },
  {
    label: "HR & STAFF",
    items: [
      { label: "Attendance", icon: Clock, href: "/dashboard/attendance", module: "attendance" },
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
      { label: "Attendance", icon: Clock, href: "/technician/attendance", module: "attendance" },
      { label: "My Jobs", icon: Briefcase, href: "/technician/my-jobs", module: "jobs" },
    ],
  },
  {
    label: "WORKSHOP",
    items: [
      { label: "Workshop", icon: Hammer, href: "/dashboard/workshop", module: "jobs" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "Profile", icon: User, href: "/technician/profile" },
    ],
  },
];
// ── Inventory Executive role sidebar ──────────────────────────────────────────
export const inventoryExecutiveSidebarSections: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", icon: Grid3x3, href: "/dashboard", module: "dashboard" },
    ],
  },
  {
    label: "INVENTORY",
    items: [
      { label: "Inventory", icon: Package, href: "/dashboard/inventory", module: "inventory" },
      { label: "Purchase Orders", icon: ShoppingCart, href: "/dashboard/purchases", module: "inventory" },
    ],
  },
  {
    label: "ANALYTICS",
    items: [
      { label: "Reports", icon: PieChart, href: "/dashboard/reports", module: "reports" },
    ],
  },
  {
    label: "HR & STAFF",
    items: [
      { label: "Attendance", icon: Clock, href: "/dashboard/attendance", module: "attendance" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "Profile", icon: User, href: "/dashboard/profile" },
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
    label: "HR & STAFF",
    items: [
      { label: "Attendance", icon: Clock, href: "/dashboard/attendance", module: "attendance" },
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
  if (
    (href === "/dashboard/purchases" || href === "/dashboard/franchise-control/purchases") &&
    (pathname === "/dashboard/purchases" || pathname === "/dashboard/franchise-control/purchases")
  ) {
    return true;
  }
  if (href === "/dashboard/workshop" && (pathname === "/dashboard/workshop" || pathname === "/technician/workshop")) {
    return true;
  }
  if (href === "/technician/workshop" && (pathname === "/dashboard/workshop" || pathname === "/technician/workshop")) {
    return true;
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
                  data-nav-link
                  data-active={childActive || undefined}
                  className={`
                    relative z-10 flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium border border-transparent
                    transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group active:scale-[0.98]
                    ${childActive
                      ? "text-white font-semibold"
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
      data-nav-link
      data-active={isActive || undefined}
      className={`
        relative z-10 flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium border border-transparent
        transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group select-none active:scale-[0.98]
        ${isActive
          ? "text-white font-semibold"
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
  const { role, isSuperAdmin, canAccess, permissions } = usePermissions();

  const baseRole = role;

  // 1. Choose root list
  let rawSections =
    baseRole === "SUPER_ADMIN" || baseRole === "HQ_USER"
      ? hqSidebarSections
      : franchiseSidebarSections;

  if (baseRole === "TECHNICIAN" || baseRole === "EMPLOYEE") {
    rawSections = technicianSidebarSections;
  } else if (baseRole === "BILLING" || baseRole === "BILLING_EXECUTIVE") {
    rawSections = billingSidebarSections;
  } else if (baseRole === "INVENTORY" || baseRole === "INVENTORY_EXECUTIVE") {
    rawSections = inventoryExecutiveSidebarSections;
  } else if (baseRole === "RECEPTIONIST" || baseRole === "RECEPTION_EXECUTIVE") {
    rawSections = receptionistSidebarSections;
  } else if (baseRole === "QUALITY_INSPECTOR" || baseRole === "QC") {
    rawSections = qualityInspectorSidebarSections;
  } else if (baseRole === "SERVICE_ADVISOR") {
    rawSections = serviceAdvisorSidebarSections;
  }

  // 2. Filter list based on centralized permission system
  const sections = useMemo<NavSection[]>(() => {
    return rawSections
      .map((sec) => {
        const filteredItems = sec.items
          .filter((item) => {
            if (item.superAdminOnly && !isSuperAdmin) return false;
            if (isSuperAdmin) return true;
            if (item.children && item.children.length > 0) {
              const visibleChildren = item.children.filter(
                (child) => !child.module || canAccess(child.module)
              );
              return visibleChildren.length > 0;
            }
            if (!item.module) return true;
            return canAccess(item.module);
          })
          .map((item) => {
            if (item.children && item.children.length > 0) {
              return {
                ...item,
                children: item.children.filter(
                  (child) => !child.module || canAccess(child.module)
                ),
              };
            }
            return item;
          });
        return {
          ...sec,
          items: filteredItems,
        };
      })
      .filter((sec) => sec.items.length > 0);
  }, [rawSections, isSuperAdmin, canAccess]);

  // ── Sliding active indicator ──
  // One highlight pill that glides between links instead of each link
  // toggling its own background.
  const navRef = useRef<HTMLElement>(null);
  const navContentRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [animateIndicator, setAnimateIndicator] = useState(false);

  const moveIndicatorTo = useCallback((el: HTMLElement | null) => {
    const nav = navRef.current;
    if (!nav || !el || el.offsetHeight === 0) {
      setIndicator((prev) => (prev === null ? null : null));
      return;
    }
    const navRect = nav.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const nextTop = Math.round(rect.top - navRect.top + nav.scrollTop);
    const nextLeft = Math.round(rect.left - navRect.left + nav.scrollLeft);
    const nextWidth = Math.round(rect.width);
    const nextHeight = Math.round(rect.height);

    setIndicator((prev) => {
      if (
        prev &&
        prev.top === nextTop &&
        prev.left === nextLeft &&
        prev.width === nextWidth &&
        prev.height === nextHeight
      ) {
        return prev;
      }
      return { top: nextTop, left: nextLeft, width: nextWidth, height: nextHeight };
    });
  }, []);

  const syncIndicator = useCallback(() => {
    const activeEl = navRef.current?.querySelector<HTMLElement>('[data-nav-link][data-active="true"]');
    moveIndicatorTo(activeEl ?? null);
  }, [moveIndicatorTo]);

  useLayoutEffect(() => {
    syncIndicator();
  }, [pathname, syncIndicator]);

  // Enable the transition only after the first placement, so it doesn't slide in from the top on load.
  useEffect(() => {
    if (indicator && !animateIndicator) {
      const id = requestAnimationFrame(() => setAnimateIndicator(true));
      return () => cancelAnimationFrame(id);
    }
  }, [indicator, animateIndicator]);

  // Re-measure when layout shifts (collapsible groups opening, window resize).
  useEffect(() => {
    const content = navContentRef.current;
    if (!content) return;
    let rafId: number | null = null;
    const ro = new ResizeObserver(() => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        syncIndicator();
      });
    });
    ro.observe(content);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [syncIndicator]);

  const handleNavClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const link = (e.target as HTMLElement).closest<HTMLElement>("[data-nav-link]");
    if (link && link.getAttribute("data-active") !== "true") {
      moveIndicatorTo(link);
    }
  };

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
      <nav
        ref={navRef}
        onClickCapture={handleNavClick}
        className="relative flex-1 px-3.5 py-4 overflow-y-auto scrollbar-hidden"
      >
        <div
          aria-hidden
          className={`absolute top-0 left-0 z-0 rounded-lg bg-[#182235] border border-slate-700/60 shadow-sm pointer-events-none will-change-transform ${animateIndicator
            ? "transition-[transform,width,height,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            : ""
            }`}
          style={{
            transform: `translate(${indicator?.left ?? 0}px, ${indicator?.top ?? 0}px)`,
            width: indicator?.width ?? 0,
            height: indicator?.height ?? 0,
            opacity: indicator ? 1 : 0,
          }}
        />
        <div ref={navContentRef} className="space-y-5">
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
        </div>
      </nav>
    </aside>
  );
}
