"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JobCard } from "../types/job-card.types";

interface JobCardNavTabsProps {
  activeTab: "all" | "assign" | "unassign";
  onTabChange?: (tab: "all" | "assign" | "unassign") => void;
  jobCards: JobCard[];
}

export function JobCardNavTabs({ activeTab, onTabChange, jobCards }: JobCardNavTabsProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        setUserRole((JSON.parse(u).role || "").toUpperCase());
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleTabClick = (tab: "all" | "assign" | "unassign", e: React.MouseEvent) => {
    e.preventDefault();
    if (onTabChange) {
      onTabChange(tab);
    } else {
      if (tab === "all") router.push("/dashboard/jobs");
      if (tab === "assign") router.push("/dashboard/jobs/assign");
      if (tab === "unassign") router.push("/dashboard/jobs/unassign");
    }
  };

  const isBillingExecutive = userRole.includes("BILLING") || userRole.includes("ACCOUNTANT");

  if (isBillingExecutive) return null;

  const allCount = jobCards.length;
  const assignedCount = jobCards.filter((j) =>
    Boolean(
      j.technician &&
        j.technician.trim() !== "" &&
        j.technician.toLowerCase() !== "unassigned" &&
        j.technician.toLowerCase() !== "none"
    )
  ).length;
  const unassignedCount = jobCards.filter(
    (j) =>
      !j.technician ||
      j.technician.trim() === "" ||
      j.technician.toLowerCase() === "unassigned" ||
      j.technician.toLowerCase() === "none"
  ).length;

  return (
    <div className="flex items-center gap-6">
      <button
        type="button"
        onClick={(e) => handleTabClick("all", e)}
        className={`text-sm font-bold pb-1 transition-all flex items-center gap-2 cursor-pointer ${
          activeTab === "all"
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-500 hover:text-blue-600"
        }`}
      >
        <span>All</span>
        <span
          className={`px-2 py-0.5 text-xs rounded-full font-bold ${
            activeTab === "all" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {allCount}
        </span>
      </button>

      {!isBillingExecutive && (
        <>
          <button
            type="button"
            onClick={(e) => handleTabClick("assign", e)}
            className={`text-sm font-bold pb-1 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "assign"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-emerald-600"
            }`}
          >
            <span>Assigned</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === "assign" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {assignedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => handleTabClick("unassign", e)}
            className={`text-sm font-bold pb-1 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "unassign"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-500 hover:text-red-600"
            }`}
          >
            <span>Unassigned</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === "unassign" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {unassignedCount}
            </span>
          </button>
        </>
      )}
    </div>
  );
}
