"use client";

import { useState, useEffect } from "react";
import { 
  ConciergeBell, Plus, RefreshCw, Clock, CheckCircle2, 
  XCircle, AlertTriangle, ShieldCheck, Tag 
} from "lucide-react";
import { getServices } from "@/lib/api";
import { toast } from "react-hot-toast";

interface ServiceRequest {
  id: string;
  serviceId?: string;
  name: string;
  category: string;
  proposedPrice: number;
  duration: string;
  reason: string;
  priority: string;
  status: string;
  submittedBy: string;
  branchName: string;
  date: string;
}

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [requestType, setRequestType] = useState<"modify" | "new">("modify");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [customName, setCustomName] = useState("");
  const [category, setCategory] = useState("Labor");
  const [proposedPrice, setProposedPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("Medium");

  const loadData = async () => {
    try {
      setLoading(true);
      const servicesData = await getServices();
      setServices(servicesData || []);

      // Load requests from localStorage
      const localRequests = localStorage.getItem("service_requests");
      if (localRequests) {
        setRequests(JSON.parse(localRequests));
      } else {
        // Seed initial requests if empty
        const initialRequests: ServiceRequest[] = [
          {
            id: "SR-1",
            serviceId: "SERV-01",
            name: "Premium Full Body Wash",
            category: "Detailing",
            proposedPrice: 850,
            duration: "1.5 hrs",
            reason: "Demand is high in monsoon season. Local competitors charge 900.",
            priority: "Medium",
            status: "Approved",
            submittedBy: "Branch Manager",
            branchName: "Kolkata South Branch",
            date: new Date(Date.now() - 86400000 * 3).toISOString()
          },
          {
            id: "SR-2",
            name: "Ceramic Coating (3 Year Warranty)",
            category: "Detailing",
            proposedPrice: 18000,
            duration: "8 hrs",
            reason: "Adding specialized detailing services for luxury segment vehicles.",
            priority: "High",
            status: "Pending",
            submittedBy: "Branch Manager",
            branchName: "Kolkata South Branch",
            date: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        localStorage.setItem("service_requests", JSON.stringify(initialRequests));
        setRequests(initialRequests);
      }
    } catch (err: any) {
      toast.error("Failed to load service requests: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Set up a listener for storage events (allows sync between tabs/pages)
    const handleStorageChange = () => {
      const localRequests = localStorage.getItem("service_requests");
      if (localRequests) setRequests(JSON.parse(localRequests));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    
    let serviceName = customName;
    let serviceId: string | undefined = undefined;

    if (requestType === "modify") {
      const selected = services.find((s) => s.id === selectedServiceId);
      if (!selected) {
        toast.error("Please select a standard service to modify");
        return;
      }
      serviceName = selected.name;
      serviceId = selected.id;
    } else {
      if (!customName) {
        toast.error("Please enter a custom service name");
        return;
      }
    }

    if (!proposedPrice || Number(proposedPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setSubmitting(true);

    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const newRequest: ServiceRequest = {
      id: "SR-" + Math.floor(Math.random() * 10000),
      serviceId,
      name: serviceName,
      category: requestType === "modify" ? (services.find(s => s.id === selectedServiceId)?.category || "General") : category,
      proposedPrice: Number(proposedPrice),
      duration: duration || "1 hr",
      reason,
      priority,
      status: "Pending",
      submittedBy: currentUser.name || "Branch Manager",
      branchName: currentUser.franchiseId ? `Branch [${currentUser.franchiseId}]` : "Kolkata South Branch",
      date: new Date().toISOString()
    };

    const updated = [newRequest, ...requests];
    localStorage.setItem("service_requests", JSON.stringify(updated));
    
    // Dispatch custom event to notify other components in same window
    window.dispatchEvent(new Event("storage"));

    toast.success("Service request submitted successfully!");
    setIsModalOpen(false);
    
    // Reset form fields
    setSelectedServiceId("");
    setCustomName("");
    setProposedPrice("");
    setDuration("");
    setReason("");
    setPriority("Medium");
    setSubmitting(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "Approved":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "Rejected":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6 text-gray-200">
      {/* Table Card */}
      <div className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Custom Service Requests Log</h2>
            <p className="text-sm text-gray-400">Request approvals for custom pricing or new services not defined in the HQ master list</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-xl transition-all shadow-lg shadow-yellow-400/10 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Request</span>
            </button>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <ConciergeBell className="w-12 h-12 mx-auto text-gray-600 mb-2" />
            <p className="text-white font-medium">No service requests found</p>
            <p className="text-sm">Submit pricing deviations or new custom services to HQ for approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Service Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Proposed Price</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Est. Duration</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium text-sm">{req.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {req.serviceId ? `Modify Master ID: ${req.serviceId}` : "New Service Request"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{req.category}</td>
                    <td className="px-6 py-4 text-sm text-yellow-400 font-bold">₹{req.proposedPrice.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{req.duration}</td>
                    <td className="px-6 py-4 text-xs">
                      <span className={req.priority === "High" ? "text-red-400 font-semibold" : "text-gray-400"}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(req.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">New Service Request</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              <div className="flex gap-4 p-1.5 bg-white/5 border border-white/10 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRequestType("modify")}
                  className={`flex-1 py-1.5 text-center text-sm font-semibold rounded-lg transition-all ${
                    requestType === "modify" ? "bg-yellow-400 text-gray-900 shadow-md" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Modify Service Pricing
                </button>
                <button
                  type="button"
                  onClick={() => setRequestType("new")}
                  className={`flex-1 py-1.5 text-center text-sm font-semibold rounded-lg transition-all ${
                    requestType === "new" ? "bg-yellow-400 text-gray-900 shadow-md" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Request New Service
                </button>
              </div>

              {requestType === "modify" ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Select Standard Service</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-400"
                    required
                  >
                    <option value="" disabled className="bg-[#0f172a]">-- Select Service --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0f172a]">
                        {s.name} (Standard Price: ₹{s.price})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Custom Service Name</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Paint Restoration"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Service Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-400"
                    >
                      <option value="Labor" className="bg-[#0f172a]">Labor</option>
                      <option value="Detailing" className="bg-[#0f172a]">Detailing</option>
                      <option value="Repairs" className="bg-[#0f172a]">Repairs</option>
                      <option value="Electrical" className="bg-[#0f172a]">Electrical</option>
                      <option value="Body Wash" className="bg-[#0f172a]">Body Wash</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Proposed Price (₹)</label>
                  <input
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder="e.g. 1200"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Est. Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 2.5 hrs"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Priority</label>
                <div className="grid grid-cols-3 gap-3">
                  {["Low", "Medium", "High"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                        priority === p
                          ? "bg-yellow-400 text-gray-900 border-yellow-400"
                          : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Reason / Business Rationale</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this service pricing or name should be approved by HQ..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 h-24 focus:outline-none focus:border-yellow-400 resize-none"
                  required
                />
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-xl transition-colors shadow-lg shadow-yellow-400/10 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
