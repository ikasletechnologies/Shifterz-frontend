"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Megaphone,
  AlertCircle,
  Clock,
  Send,
  Filter,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Info,
  RefreshCw,
} from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead, broadcastNotification } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function NotificationCenterPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "ANNOUNCEMENTS">("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [authorizedHQ, setAuthorizedHQ] = useState(false);

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",
    type: "SYSTEM_ANNOUNCEMENT",
    link: "/dashboard",
  });
  const [broadcasting, setBroadcasting] = useState(false);

  async function loadNotifs() {
    setLoading(true);
    try {
      const data = await getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (e: any) {
      toast.error("Failed to load notifications: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setAuthorizedHQ(u.role === "SUPER_ADMIN" || u.role === "HQ_USER");
      } catch {
        setAuthorizedHQ(false);
      }
    }
    loadNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e: any) {
      toast.error("Failed to mark as read: " + e.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (e: any) {
      toast.error("Failed to mark all read: " + e.message);
    }
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) {
      toast.error("Please provide title and message");
      return;
    }
    setBroadcasting(true);
    try {
      await broadcastNotification(broadcastForm);
      toast.success("System announcement broadcasted!");
      setShowBroadcastModal(false);
      setBroadcastForm({
        title: "",
        message: "",
        type: "SYSTEM_ANNOUNCEMENT",
        link: "/dashboard",
      });
      await loadNotifs();
    } catch (e: any) {
      toast.error("Failed to broadcast: " + e.message);
    } finally {
      setBroadcasting(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "UNREAD" && n.read) return false;
    if (activeTab === "ANNOUNCEMENTS" && n.type !== "SYSTEM_ANNOUNCEMENT") return false;
    if (filterType !== "ALL" && n.type !== filterType) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" /> System Administration & Security (§17.6)
          </div>
          <h1 className="text-2xl font-black">Notification Center</h1>
          <p className="text-sm text-slate-300 mt-1">
            Manage system alerts, operational reminders, and headquarters announcements across all branches.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadNotifs}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-600/30"
            >
              <CheckCheck className="w-4 h-4" /> Mark All as Read
            </button>
          )}
          {authorizedHQ && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/30"
            >
              <Megaphone className="w-4 h-4" /> Send Announcement
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === "ALL"
                ? "bg-blue-50 text-blue-600 border border-blue-200"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab("UNREAD")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${
              activeTab === "UNREAD"
                ? "bg-red-50 text-red-600 border border-red-200"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("ANNOUNCEMENTS")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === "ANNOUNCEMENTS"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            System Announcements
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            <option value="JOB_ASSIGNED">Job Card Assignments</option>
            <option value="PRIORITY_CHANGE">Priority Changes</option>
            <option value="UPCOMING_DELIVERY">Vehicle Deliveries</option>
            <option value="SYSTEM_ANNOUNCEMENT">System Announcements</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-16 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-700">No notifications found</h3>
            <p className="text-xs text-gray-500 mt-1">
              You have caught up with all alerts and announcements.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((n, idx) => (
              <div
                key={idx}
                className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                  n.read ? "bg-white hover:bg-slate-50/50" : "bg-blue-50/50 hover:bg-blue-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2.5 rounded-xl ${
                      n.type === "SYSTEM_ANNOUNCEMENT"
                        ? "bg-amber-100 text-amber-700"
                        : n.type === "JOB_ASSIGNED"
                        ? "bg-blue-100 text-blue-700"
                        : n.type === "UPCOMING_DELIVERY"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {n.type === "SYSTEM_ANNOUNCEMENT" ? (
                      <Megaphone className="w-5 h-5" />
                    ) : n.type === "JOB_ASSIGNED" ? (
                      <Info className="w-5 h-5" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                      {!n.read && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold uppercase rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(n.createdAt).toLocaleString("en-IN")}
                      </span>
                      {n.link && (
                        <a
                          href={n.link}
                          className="flex items-center gap-1 text-blue-600 font-bold hover:underline"
                        >
                          Open Link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Broadcast Modal (§17.6) */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Broadcast System Announcement (§17.6)</h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled System Maintenance / Q2 Target Alert"
                  value={broadcastForm.title}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Message Body
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter detailed message to notify all employees across HQ and Franchise branches..."
                  value={broadcastForm.message}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, message: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Notification Type
                  </label>
                  <select
                    value={broadcastForm.type}
                    onChange={(e) =>
                      setBroadcastForm({ ...broadcastForm, type: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-900"
                  >
                    <option value="SYSTEM_ANNOUNCEMENT">System Announcement</option>
                    <option value="ALERT">Security Alert</option>
                    <option value="REMINDER">Operational Reminder</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Action URL / Deep Link
                  </label>
                  <input
                    type="text"
                    placeholder="/dashboard"
                    value={broadcastForm.link}
                    onChange={(e) =>
                      setBroadcastForm({ ...broadcastForm, link: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {broadcasting ? "Broadcasting..." : "Send Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
