"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle2, LogOut, AlertCircle } from "lucide-react";
import { getAttendance, getTodayAttendance, checkIn, checkOut } from "@/lib/api";
import { toast } from "react-hot-toast";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: string;
  clockIn: string | null;
  clockOut: string | null;
  workingHours?: number | null;
  franchiseId: string | null;
  franchise?: { id: string; name: string; city: string };
  employee?: { id: string; name: string; employeeId?: string; role: string };
}

export default function TechnicianAttendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Today's state – sourced from /attendance/today to persist across refresh/login
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [checkInPending, setCheckInPending] = useState(false);
  const [checkOutPending, setCheckOutPending] = useState(false);

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const userStr = localStorage.getItem("user");
      let user: any = null;
      if (userStr) {
        user = JSON.parse(userStr);
        setCurrentUser(user);
      }

      // Load today's status from dedicated endpoint (fast + accurate after refresh)
      try {
        const todayStatus = await getTodayAttendance();
        setIsCheckedIn(todayStatus.isCheckedIn);
        setIsCheckedOut(todayStatus.isCheckedOut);
        setTodayRecord(todayStatus.record);
      } catch {
        // fallback: derive from attendance list below
      }

      if (user && user.id) {
        const attData = await getAttendance();
        // Backend already scopes to the authenticated employee for non-admin roles
        const myAttendance = Array.isArray(attData)
          ? attData.filter((record: AttendanceRecord) => record.employeeId === user.id)
          : [];

        myAttendance.sort((a: AttendanceRecord, b: AttendanceRecord) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setAttendance(myAttendance);
      }
    } catch (err: any) {
      toast.error("Failed to load attendance data: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleCheckIn = async () => {
    if (!currentUser || checkInPending) return;
    setCheckInPending(true);
    try {
      const record = await checkIn(currentUser.id);
      setAttendance(prev => [record, ...prev]);
      setIsCheckedIn(true);
      setIsCheckedOut(false);
      setTodayRecord(record);
      toast.success("Successfully checked in for today");
    } catch (err: any) {
      toast.error(err.message || "Failed to check in");
    } finally {
      setCheckInPending(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentUser || checkOutPending) return;
    setCheckOutPending(true);
    try {
      const updated = await checkOut(currentUser.id);
      setAttendance(prev => prev.map(a => a.id === updated.id ? updated : a));
      setIsCheckedIn(true);
      setIsCheckedOut(true);
      setTodayRecord(updated);
      toast.success("Successfully checked out");
    } catch (err: any) {
      toast.error(err.message || "Failed to check out");
    } finally {
      setCheckOutPending(false);
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "–";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatWorkingHours = (record: AttendanceRecord) => {
    if (record.workingHours != null && record.workingHours > 0) {
      const h = Math.floor(record.workingHours);
      const m = Math.round((record.workingHours - h) * 60);
      return `${h}h ${m}m`;
    }
    if (!record.clockIn || !record.clockOut) return "–";
    const diff = new Date(record.clockOut).getTime() - new Date(record.clockIn).getTime();
    if (diff < 0) return "–";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  const todayCheckInTime = todayRecord?.clockIn ? formatTime(todayRecord.clockIn) : null;
  const todayCheckOutTime = todayRecord?.clockOut ? formatTime(todayRecord.clockOut) : null;
  const todayHours = todayRecord ? formatWorkingHours(todayRecord) : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Today's Attendance Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-5">Today's Attendance</h3>

        {/* Status & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              !isCheckedIn ? "bg-gray-100" : !isCheckedOut ? "bg-green-100" : "bg-blue-100"
            }`}>
              {!isCheckedIn ? (
                <Clock className="w-5 h-5 text-gray-500" />
              ) : !isCheckedOut ? (
                <Clock className="w-5 h-5 text-green-600 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {!isCheckedIn ? "Not Checked In" : !isCheckedOut ? "On Duty" : "Shift Completed"}
              </div>
              <div className="text-xs text-gray-500">
                {!isCheckedIn
                  ? "Tap 'Check In' to start your shift"
                  : !isCheckedOut
                  ? `Since ${todayCheckInTime ?? "–"}`
                  : `${todayCheckInTime} → ${todayCheckOutTime} · ${todayHours}`}
              </div>
            </div>
          </div>

          {currentUser && (
            <div className="flex gap-3">
              {!isCheckedIn ? (
                <button
                  onClick={handleCheckIn}
                  disabled={checkInPending}
                  className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors flex items-center gap-2 shadow-sm shadow-green-200"
                >
                  <Clock className="w-4 h-4" />
                  {checkInPending ? "Checking In..." : "Check In"}
                </button>
              ) : !isCheckedOut ? (
                <button
                  onClick={handleCheckOut}
                  disabled={checkOutPending}
                  className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center gap-2 shadow-sm shadow-red-200"
                >
                  <LogOut className="w-4 h-4" />
                  {checkOutPending ? "Checking Out..." : "Check Out"}
                </button>
              ) : (
                <div className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Completed for Today
                </div>
              )}
            </div>
          )}
        </div>

        {/* Today's detail row */}
        <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Check In</p>
            <p className="text-sm font-semibold text-gray-900 font-mono">{todayCheckInTime ?? "–"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Check Out</p>
            <p className="text-sm font-semibold text-gray-900 font-mono">{todayCheckOutTime ?? "–"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Working Hours</p>
            <p className="text-sm font-semibold text-gray-900">{todayHours ?? "–"}</p>
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Attendance History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {new Date(record.date).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      record.status === "Present" ? "bg-green-100 text-green-700" :
                      record.status === "Checked Out" ? "bg-blue-100 text-blue-700" :
                      record.status === "Absent" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">{formatTime(record.clockIn)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">{formatTime(record.clockOut)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {formatWorkingHours(record)}
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No attendance records found
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
