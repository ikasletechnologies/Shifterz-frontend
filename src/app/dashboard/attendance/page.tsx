"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, CheckCircle2, User, Building2, Search, Filter, Calendar, Users, CheckCircle, LogOut, X } from "lucide-react";
import { getAttendance, checkIn, checkOut, getFranchises } from "@/lib/api";
import { toast } from "react-hot-toast";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: string;
  clockIn: string | null;
  clockOut: string | null;
  franchiseId: string | null;
  franchise?: { id: string; name: string; city: string };
  employee?: { id: string; name: string; role: string };
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const roles = useMemo(() => {
    const rawRoles = Array.from(new Set(attendance.map((a) => a.employee?.role).filter((role): role is string => !!role)));
    const predefined = [
      { value: "BILLING_EXECUTIVE", label: "Billing Executive" },
      { value: "RECEPTION_EXECUTIVE", label: "Receptionist" },
      { value: "SERVICE_ADVISOR", label: "Service Advisor" },
      { value: "TECHNICIAN", label: "Technician" },
      { value: "QUALITY_INSPECTOR", label: "Quality Inspector" },
      { value: "INVENTORY_EXECUTIVE", label: "Inventory Executive" },
      { value: "FRANCHISE_ADMIN", label: "Franchise Admin" },
    ];
    // Filter out active roles already covered by predefined list
    const predefinedKeys = [
      "BILLING_EXECUTIVE", "BILLING", "RECEPTION_EXECUTIVE", "RECEPTIONIST", 
      "SERVICE_ADVISOR", "TECHNICIAN", "QUALITY_INSPECTOR", "QC", 
      "INVENTORY_EXECUTIVE", "FRANCHISE_ADMIN"
    ];
    const otherRoles = rawRoles.filter(role => {
      const norm = role.toUpperCase().replace(/[\s_]+/g, "");
      return !predefinedKeys.some(key => key.toUpperCase().replace(/[\s_]+/g, "") === norm);
    });
    // Add other active roles in format
    otherRoles.forEach(role => {
      const label = role
        .replace(/_/g, " ")
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      predefined.push({ value: role, label });
    });
    return predefined;
  }, [attendance]);

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setFromDate(today);
      return;
    }
    setFromDate(selected);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setToDate(today);
      return;
    }
    setToDate(selected);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const userStr = localStorage.getItem("user");
        if (userStr) {
          setCurrentUser(JSON.parse(userStr));
        }

        const attData = await getAttendance();
        let franData = [];
        try {
          franData = await getFranchises();
        } catch (e) {
          // Ignore 403 for non-superadmin users
        }
        setAttendance(Array.isArray(attData) ? attData : []);
        setFranchises(Array.isArray(franData) ? franData : []);
      } catch (err: any) {
        toast.error("Failed to load attendance data: " + (err.message || "Error"));
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCheckIn = async () => {
    if (!currentUser) return;
    try {
      const record = await checkIn(currentUser.id);
      setAttendance([record, ...attendance]);
      toast.success("Successfully checked in for today");
    } catch (err: any) {
      toast.error(err.message || "Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    if (!currentUser) return;
    try {
      const updated = await checkOut(currentUser.id);
      setAttendance(attendance.map(a => a.id === updated.id ? updated : a));
      toast.success("Successfully checked out");
    } catch (err: any) {
      toast.error(err.message || "Failed to check out");
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-";
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "-";
    }
  };

  const calculateHours = (clockIn: string | null, clockOut: string | null) => {
    if (!clockIn || !clockOut) return "-";
    try {
      const start = new Date(clockIn).getTime();
      const end = new Date(clockOut).getTime();
      const diff = end - start;
      if (diff <= 0) return "-";
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${mins}m`;
    } catch {
      return "-";
    }
  };

  const isSameDay = (date1: string, date2: string) => {
    if (!date1 || !date2) return false;
    const d1 = date1.slice(0, 10);
    const d2 = date2.slice(0, 10);
    if (d1 === d2) return true;
    try {
      return new Date(date1).toISOString().slice(0, 10) === new Date(date2).toISOString().slice(0, 10);
    } catch {
      return false;
    }
  };

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filtered attendance list
  const filteredAttendance = useMemo(() => {
    return attendance.filter((rec) => {
      // Search
      const empName = rec.employee?.name || "";
      const empRole = rec.employee?.role || "";
      const matchesSearch =
        searchQuery === "" ||
        empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        empRole.toLowerCase().includes(searchQuery.toLowerCase());

      // Branch
      const matchesBranch =
        selectedBranch === "ALL" ||
        (selectedBranch === "HQ" && !rec.franchiseId) ||
        rec.franchiseId === selectedBranch;

      // Status
      const matchesStatus =
        selectedStatus === "ALL" ||
        rec.status?.toLowerCase() === selectedStatus.toLowerCase();

      // Role
      let matchesRole = true;
      if (selectedRole !== "ALL") {
        const uRole = (rec.employee?.role || "").toUpperCase().replace(/[\s_]+/g, "");
        const sRole = selectedRole.toUpperCase().replace(/[\s_]+/g, "");
        if (sRole === "BILLINGEXECUTIVE") {
          matchesRole = uRole === "BILLINGEXECUTIVE" || uRole === "BILLING";
        } else if (sRole === "RECEPTIONEXECUTIVE") {
          matchesRole = uRole === "RECEPTIONEXECUTIVE" || uRole === "RECEPTIONIST";
        } else if (sRole === "QUALITYINSPECTOR") {
          matchesRole = uRole === "QUALITYINSPECTOR" || uRole === "QC";
        } else {
          matchesRole = uRole === sRole;
        }
      }

      // Date Range (reused from Car In module)
      let matchesDateRange = true;
      const recDateRaw = rec.date || rec.clockIn;
      if (recDateRaw) {
        const recDate = new Date(recDateRaw);
        if (!isNaN(recDate.getTime())) {
          if (fromDate) {
            const start = new Date(fromDate + "T00:00:00");
            if (recDate < start) matchesDateRange = false;
          }
          if (toDate) {
            const end = new Date(toDate + "T23:59:59.999");
            if (recDate > end) matchesDateRange = false;
          }
        }
      }

      return matchesSearch && matchesBranch && matchesStatus && matchesRole && matchesDateRange;
    });
  }, [attendance, searchQuery, selectedBranch, selectedStatus, selectedRole, fromDate, toDate]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const todayRecords = attendance.filter((a) => isSameDay(a.date, todayStr));
    const presentToday = todayRecords.filter((a) => a.status === "Present").length;
    const activeNow = todayRecords.filter((a) => a.clockIn && !a.clockOut).length;
    const completedToday = todayRecords.filter((a) => a.clockIn && a.clockOut).length;
    const totalRecords = attendance.length;

    return {
      presentToday,
      activeNow,
      completedToday,
      totalRecords,
    };
  }, [attendance, todayStr]);

  const myTodayRecord = attendance.find(a => a.employeeId === currentUser?.id && isSameDay(a.date, todayStr));
  const isCheckedIn = !!myTodayRecord;
  const isCheckedOut = !!myTodayRecord?.clockOut;

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 animate-spin text-red-500" />
          <span>Loading attendance records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Track employee check-ins, active duty status, and daily working hours
          </p>
        </div>

        {currentUser && (
          <div className="flex items-center gap-3">
            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-all flex items-center gap-2 shadow-sm shadow-green-200"
              >
                <Clock className="w-4 h-4" />
                Check In Now
              </button>
            ) : !isCheckedOut ? (
              <button
                onClick={handleCheckOut}
                className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition-all flex items-center gap-2 shadow-sm shadow-red-200"
              >
                <LogOut className="w-4 h-4" />
                Check Out
              </button>
            ) : (
              <div className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 border border-gray-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Shift Completed Today
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{metrics.presentToday}</div>
            <div className="text-xs font-medium text-gray-500">Present Today</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{metrics.activeNow}</div>
            <div className="text-xs font-medium text-gray-500">On Active Duty</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{metrics.completedToday}</div>
            <div className="text-xs font-medium text-gray-500">Checked Out Today</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{metrics.totalRecords}</div>
            <div className="text-xs font-medium text-gray-500">Total Attendance Logs</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          />
        </div>

        <div className="flex flex-row flex-nowrap items-center gap-3 w-full lg:w-auto overflow-x-auto scrollbar-hidden py-1">
          {/* Branch Filter */}
          {franchises.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm shrink-0">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent border-none text-sm text-gray-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Branches</option>
                <option value="HQ">Headquarters (HQ)</option>
                {franchises.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm shrink-0">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-none text-sm text-gray-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm shrink-0">
            <User className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent border-none text-sm text-gray-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* From Date Filter (reused from Car In module) */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm shrink-0">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={fromDate}
              max={getTodayISO()}
              onChange={handleFromDateChange}
              className="bg-transparent border-none text-xs text-gray-700 font-medium focus:outline-none cursor-pointer p-0"
            />
            <button
              type="button"
              disabled={!fromDate}
              onClick={() => fromDate && setFromDate("")}
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
                fromDate
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-200 cursor-pointer"
                  : "text-gray-300 cursor-not-allowed opacity-50"
              }`}
              title={fromDate ? "Clear From Date" : ""}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* To Date Filter (reused from Car In module) */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm shrink-0">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">To:</span>
            <input
              type="date"
              value={toDate}
              max={getTodayISO()}
              onChange={handleToDateChange}
              className="bg-transparent border-none text-xs text-gray-700 font-medium focus:outline-none cursor-pointer p-0"
            />
            <button
              type="button"
              disabled={!toDate}
              onClick={() => toDate && setToDate("")}
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
                toDate
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-200 cursor-pointer"
                  : "text-gray-300 cursor-not-allowed opacity-50"
              }`}
              title={toDate ? "Clear To Date" : ""}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAttendance.map((record) => {
                return (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                          {record.employee?.name ? record.employee.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.employee?.name || "Unknown Employee"}</div>
                          <div className="text-xs text-gray-500 capitalize">{record.employee?.role ? record.employee.role.replace(/_/g, " ").toLowerCase() : "No Role"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                        {record.franchise ? record.franchise.name : "Headquarters (HQ)"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 ${
                        record.status === "Present" ? "bg-green-100 text-green-700" :
                        record.status === "Absent" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{formatTime(record.clockIn)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{formatTime(record.clockOut)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {calculateHours(record.clockIn, record.clockOut)}
                    </td>
                  </tr>
                );
              })}
              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock className="w-8 h-8 text-gray-300" />
                      <p className="font-medium text-gray-600">No attendance records found</p>
                      <p className="text-xs text-gray-400">Try adjusting your search query or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
