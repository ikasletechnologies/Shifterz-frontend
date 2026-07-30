"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle2, User, Building2 } from "lucide-react";
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
          // Ignore 403 for franchise users
        }
        setAttendance(attData);
        setFranchises(franData);
      } catch (err: any) {
        toast.error("Failed to load attendance data: " + err.message);
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
      toast.error(err.message);
    }
  };

  const handleCheckOut = async () => {
    if (!currentUser) return;
    try {
      const updated = await checkOut(currentUser.id);
      setAttendance(attendance.map(a => a.id === updated.id ? updated : a));
      toast.success("Successfully checked out");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateHours = (clockIn: string | null, clockOut: string | null) => {
    if (!clockIn || !clockOut) return "-";
    const start = new Date(clockIn).getTime();
    const end = new Date(clockOut).getTime();
    const diff = end - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
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

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading attendance records...</div>;
  }

  // Check if current user has checked in today
  const today = new Date().toISOString().slice(0, 10);
  const myTodayRecord = attendance.find(a => a.employeeId === currentUser?.id && isSameDay(a.date, today));
  const isCheckedIn = !!myTodayRecord;
  const isCheckedOut = !!myTodayRecord?.clockOut;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 mt-1">Track employee check-ins and working hours</p>
        </div>
        
        {currentUser && (
          <div className="flex gap-3">
            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm shadow-green-200"
              >
                <Clock className="w-4 h-4" />
                Check In Now
              </button>
            ) : !isCheckedOut ? (
              <button
                onClick={handleCheckOut}
                className="bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-sm shadow-orange-200"
              >
                <CheckCircle2 className="w-4 h-4" />
                Check Out
              </button>
            ) : (
              <div className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Completed for Today
              </div>
            )}
          </div>
        )}
      </div>

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
              {attendance.map((record) => {
                return (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.employee?.name || "Unknown"}</div>
                          <div className="text-xs text-gray-500">{record.employee?.role.replace("_", " ") || "No Role"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {record.franchise ? record.franchise.name : "HQ"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                        record.status === "Present" ? "bg-green-100 text-green-700" :
                        record.status === "Absent" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatTime(record.clockIn)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatTime(record.clockOut)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {calculateHours(record.clockIn, record.clockOut)}
                    </td>
                  </tr>
                );
              })}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
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
