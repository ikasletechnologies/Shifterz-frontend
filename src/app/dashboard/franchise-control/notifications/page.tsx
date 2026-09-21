"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Megaphone,
  Clock,
  Send,
  CheckCircle2,
  ExternalLink,
  Info,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead, clearAllNotifications, broadcastNotification } from "@/lib/api";
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

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications? This action cannot be undone.")) return;
    try {
      await clearAllNotifications();
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (e: any) {
      toast.error("Failed to clear notifications: " + e.message);
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
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">View system alerts and announcements.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadNotifs}
            className="p-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-md transition"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm rounded-md transition flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" /> Mark All as Read
            </button>
          )}
          {authorizedHQ && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium text-sm rounded-md transition flex items-center gap-2"
            >
              <Megaphone className="w-4 h-4" /> Send Announcement
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-4 py-3 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "ALL"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab("UNREAD")}
            className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${
              activeTab === "UNREAD"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-gray-700 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("ANNOUNCEMENTS")}
            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "ANNOUNCEMENTS"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            System Announcements
          </button>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-2 text-red-600 hover:bg-red-50 font-medium text-xs rounded-md transition flex items-center gap-2"
              title="Clear all notifications"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-800">No notifications</h3>
            <p className="text-xs text-gray-500 mt-1">There are no alerts or announcements to show.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((n, idx) => (
              <div
                key={idx}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  n.read ? "bg-white hover:bg-gray-50" : "bg-yellow-50/50 hover:bg-yellow-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-md ${
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
                        <span className="px-1.5 py-0.5 bg-gray-800 text-white text-[10px] font-medium uppercase rounded">
                          New
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-base text-gray-900">Send Announcement</h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-gray-400 hover:text-gray-700"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-md transition flex items-center gap-2"
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
