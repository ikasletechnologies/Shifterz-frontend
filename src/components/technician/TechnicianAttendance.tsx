"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle2, User, Building2 } from "lucide-react";
import { getAttendance, checkIn, checkOut } from "@/lib/api";
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

export default function TechnicianAttendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const userStr = localStorage.getItem("user");
      let user = null;
      if (userStr) {
        user = JSON.parse(userStr);
        setCurrentUser(user);
      }

      if (user && user.id) {
        const attData = await getAttendance();
        // Filter attendance records to only show the logged-in technician's records
        const myAttendance = attData.filter((record: AttendanceRecord) => record.employeeId === user.id);
        
        // Sort by date descending (assuming date is ISO string)
        myAttendance.sort((a: AttendanceRecord, b: AttendanceRecord) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
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
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateHours = (clockIn: string | null, clockOut: string | null) => {
    if (!clockIn || !clockOut) return "-";
    const start = new Date(clockIn).getTime();
    const end = new Date(clockOut).getTime();
    const diff = end - start;
    if (diff < 0) return "-";
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

  // Check if current user has checked in today
  const today = new Date().toISOString().slice(0, 10);
  const myTodayRecord = attendance.find(a => a.date === today);
  const isCheckedIn = !!myTodayRecord;
  const isCheckedOut = !!myTodayRecord?.clockOut;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-500 mt-1">Track your daily check-ins and working hours</p>
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
                className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-sm shadow-orange-200"
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
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendance.map((record) => {
                return (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
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
