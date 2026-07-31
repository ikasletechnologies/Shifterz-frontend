"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JobCard } from "../types/job-card.types";

interface JobCardNavTabsProps {
  activeTab: "all" | "assign" | "unassign";
  jobCards: JobCard[];
}

export function JobCardNavTabs({ activeTab, jobCards }: JobCardNavTabsProps) {
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

  const isBillingExecutive = userRole.includes("BILLING") || userRole.includes("ACCOUNTANT");

  if (isBillingExecutive) return null;

  const allCount = jobCards.length;
  const assignedCount = jobCards.filter((j) =>
    Boolean(j.technician && j.technician.trim() !== "" && j.technician.toLowerCase() !== "unassigned")
  ).length;
  const unassignedCount = jobCards.filter(
    (j) => !j.technician || j.technician.trim() === "" || j.technician.toLowerCase() === "unassigned"
  ).length;

  return (
    <div className="flex items-center gap-6">
      <button
        onClick={() => router.push("/dashboard/jobs")}
        className={`text-sm font-bold pb-1 transition-all flex items-center gap-2 ${
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
            onClick={() => router.push("/dashboard/jobs/assign")}
            className={`text-sm font-bold pb-1 transition-all flex items-center gap-2 ${
              activeTab === "assign"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-emerald-600"
            }`}
          >
            <span>Assign Job</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === "assign" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {assignedCount}
            </span>
          </button>

          <button
            onClick={() => router.push("/dashboard/jobs/unassign")}
            className={`text-sm font-bold pb-1 transition-all flex items-center gap-2 ${
              activeTab === "unassign"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-500 hover:text-red-600"
            }`}
          >
            <span>Unassign Job</span>
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
