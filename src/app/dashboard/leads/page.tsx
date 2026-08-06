"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from "react";
import { Plus, ChevronDown, Trash2, Pencil, Search, X, Car, User, Phone, Wrench, Tag, Calendar, UserCheck } from "lucide-react";
import AddLeadDialog from "@/components/leads/AddLeadDialog";
import EditLeadDialog from "@/components/leads/EditLeadDialog";
import { getLeads, createLead, deleteLead, updateLead, createCustomer } from "@/lib/api";
import { toast } from "react-hot-toast";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  service: string;
  vehicle: string;
  assignedTo: string;
  budget: string;
  date: string;
  status: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "New":
      return "bg-blue-100 text-blue-700";
    case "Follow Up":
      return "bg-yellow-100 text-yellow-700";
    case "Converted":
      return "bg-green-100 text-green-700";
    case "Lost":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case "JustDial":
      return "bg-blue-100 text-blue-700";
    case "Instagram":
      return "bg-purple-100 text-purple-700";
    case "Referral":
      return "bg-green-100 text-green-700";
    case "Facebook":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const StatusDropdown = ({ lead, handleStatusChange, dropUp }: { lead: Lead, handleStatusChange: (id: string, newStatus: string, lead: Lead) => void, dropUp?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statuses = ["New", "Follow Up", "Converted", "Lost"];

  const getDotColor = (status: string) => {
    switch (status) {
      case "New": return "bg-blue-500";
      case "Follow Up": return "bg-yellow-500";
      case "Converted": return "bg-green-500";
      case "Lost": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between w-[105px] transition-all shadow-sm border border-transparent hover:border-gray-200 ${getStatusColor(lead.status)}`}
      >
        <span>{lead.status}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 w-36 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] bg-white border border-gray-100 py-1.5 overflow-hidden -left-2 animate-in fade-in duration-150 ${dropUp ? "bottom-full mb-2 slide-in-from-bottom-2" : "mt-2 slide-in-from-top-2"
          }`}>
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => {
                handleStatusChange(lead.id, status, lead);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-2.5 ${status === lead.status ? "bg-gray-50 text-gray-900" : "text-gray-600"
                }`}
            >
              <span className={`w-2 h-2 rounded-full shadow-sm ${getDotColor(status)}`} />
              {status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string; newStatus: string; lead: Lead } | null>(null);

  // Load leads from backend
  useEffect(() => {
    async function fetchLeads() {
      try {
        setIsLoading(true);
        const data = await getLeads();
        setLeads(data);
      } catch (err: any) {
        setError("Failed to load leads: " + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeads();
  }, []);

  // Add new lead
  const handleAddLead = async (newLead: any) => {
    try {
      const created = await createLead(newLead);
      setLeads([...leads, created]);
      setIsDialogOpen(false);
    } catch (err: any) {
      alert("Failed to create lead: " + err.message);
      console.error(err);
    }
  };

  // Delete lead
  const handleDeleteLead = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    try {
      await deleteLead(id);
      setLeads(leads.filter((lead) => lead.id !== id));
    } catch (err: any) {
      alert("Failed to delete lead: " + err.message);
      console.error(err);
    }
  };

  // Edit lead
  const handleEditLead = async (id: string, updatedLead: any) => {
    try {
      const currentLead = leads.find(l => l.id === id);
      const updated = await updateLead(id, updatedLead);
      setLeads(leads.map(lead => lead.id === id ? updated : lead));

      if (currentLead && currentLead.status !== "Converted" && updatedLead.status === "Converted") {
        try {
          await createCustomer({
            name: updatedLead.name,
            phone: updatedLead.phone,
            email: updatedLead.email || "",
            address: "",
            type: "Retail",
            source: updatedLead.source,
            status: "Active"
          });
          toast.success("Lead converted! Customer profile created successfully.");
        } catch (err: any) {
          toast.error("Lead converted, but failed to create customer: " + err.message);
        }
      }
    } catch (err: any) {
      alert("Failed to update lead: " + err.message);
      console.error(err);
    }
  };

  // Change Status
  const executeStatusChange = async (id: string, newStatus: string, currentLead: Lead) => {
    try {
      const updatedLead = { 
        ...currentLead,
        name: currentLead.name || "",
        email: currentLead.email || "",
        phone: currentLead.phone || "",
        vehicle: currentLead.vehicle || "",
        source: currentLead.source || "JustDial",
        service: currentLead.service || "PPF Full Body",
        budget: currentLead.budget || "₹0",
        status: newStatus,
        assignedTo: currentLead.assignedTo || (currentLead as any).assigned || "Unassigned",
        assigned: (currentLead as any).assigned || currentLead.assignedTo || "Unassigned"
      };
      const updated = await updateLead(id, updatedLead);
      setLeads((prevLeads) => prevLeads.map(lead => lead.id === id ? { ...lead, ...updated, status: newStatus } : lead));
      toast.success(`Lead status updated to ${newStatus}`);

      if (newStatus === "Converted" && currentLead.status !== "Converted") {
        try {
          await createCustomer({
            name: currentLead.name,
            phone: currentLead.phone,
            email: currentLead.email || "",
            address: "",
            type: "Retail",
            source: currentLead.source,
            status: "Active"
          });
          toast.success("Lead converted! Customer profile created successfully.");
        } catch (err: any) {
          toast.error("Lead converted, but failed to create customer: " + err.message);
        }
      }
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message);
      console.error(err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string, currentLead: Lead) => {
    if (newStatus === "Converted") {
      setPendingStatusChange({ id, newStatus, lead: currentLead });
      setShowConfirmModal(true);
      return;
    }
    await executeStatusChange(id, newStatus, currentLead);
  };

  const filteredLeads = leads.filter((lead) => {
    const statusMatch = filter === "All" || lead.status === filter;
    const sourceMatch =
      sourceFilter === "All Sources" || lead.source === sourceFilter;
    const searchMatch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return statusMatch && sourceMatch && searchMatch;
  });

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "New").length;
  const followUp = leads.filter((l) => l.status === "Follow Up").length;
  const closed = leads.filter((l) => l.status === "Converted").length;
  const lostLeads = leads.filter((l) => l.status === "Lost").length;

  // Color helper functions have been hoisted

  return (
    <div className="p-8">
      {/* Loading & Error States */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-blue-700">
          Loading leads...
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Total Leads
          </p>
          <p className="text-4xl font-bold text-gray-900">{totalLeads}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            New
          </p>
          <p className="text-4xl font-bold text-gray-900">{newLeads}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Follow Up
          </p>
          <p className="text-4xl font-bold text-gray-900">{followUp}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Converted
          </p>
          <p className="text-4xl font-bold text-gray-900">{closed}</p>
        </div>
        <div className="bg-white rounded-lg border border-red-100 p-6">
          <p className="text-xs text-red-400 uppercase tracking-wide mb-2">
            Lost
          </p>
          <p className="text-4xl font-bold text-red-500">{lostLeads}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
          <div className="rounded-lg px-2 py-1.5 flex items-center gap-1 w-fit" style={{ backgroundColor: "#ebebebff" }}>
            {["All", "New", "Follow Up", "Converted", "Lost"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`text-sm px-3 py-1 rounded-md transition-colors ${filter === tab
                  ? "bg-white text-gray-900 font-bold shadow-sm"
                  : "text-gray-600 hover:text-gray-900 font-medium"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name, phone, or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex items-center">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="appearance-none px-6 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center w-36"
              style={{ textAlignLast: "center" }}
            >
              <option className="text-center" style={{ textAlign: "center" }}>All Sources</option>
              <option className="text-center" style={{ textAlign: "center" }}>JustDial</option>
              <option className="text-center" style={{ textAlign: "center" }}>Instagram</option>
              <option className="text-center" style={{ textAlign: "center" }}>Referral</option>
              <option className="text-center" style={{ textAlign: "center" }}>Facebook</option>
              <option className="text-center" style={{ textAlign: "center" }}>Walk-in</option>
            </select>
            <ChevronDown className="absolute right-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsDialogOpen(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No leads found</h3>
          <p className="text-gray-500">Try adjusting your search or filters, or create a new lead.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead, index) => (
            <div
              key={lead.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header: Lead ID (Left) & Status Dropdown + Source Badge (Right) */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-base font-black text-slate-900 tracking-tight font-mono truncate" style={{ color: "#F0B100" }}>
                      {lead.id}
                    </h3>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${getSourceColor(lead.source)}`}>
                      {lead.source}
                    </span>
                  </div>
                  <StatusDropdown lead={lead} handleStatusChange={handleStatusChange} dropUp={index >= filteredLeads.length - 2} />
                </div>

                {/* Details List (Left label + icon, Right value text-right) */}
                <div className="space-y-2.5 text-xs">
                  {/* Name */}
                  <div className="flex justify-between items-center py-1 border-b border-slate-50 gap-2">
                    <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Name</span>
                    </div>
                    <div className="text-right truncate max-w-[170px]">
                      <p className="font-bold text-slate-900 truncate">{lead.name || "—"}</p>
                      {lead.email && <p className="text-[11px] text-slate-400 truncate">{lead.email}</p>}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex justify-between items-center py-1 border-b border-slate-50 gap-2">
                    <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Phone</span>
                    </div>
                    <p className="font-bold text-blue-600 font-mono tracking-wider text-right truncate">{lead.phone || "—"}</p>
                  </div>

                  {/* Vehicle */}
                  <div className="flex justify-between items-center py-1 border-b border-slate-50 gap-2">
                    <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                      <Car className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Vehicle</span>
                    </div>
                    <p className="font-bold text-slate-900 uppercase font-mono tracking-wider text-right truncate">{lead.vehicle || "—"}</p>
                  </div>

                  {/* Service */}
                  <div className="flex justify-between items-center py-1 border-b border-slate-50 gap-2">
                    <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                      <Wrench className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Service</span>
                    </div>
                    <p className="font-bold text-slate-900 text-right truncate max-w-[170px]">{lead.service || "—"}</p>
                  </div>

                  {/* Source */}
                  <div className="flex justify-between items-center py-1 border-b border-slate-50 gap-2">
                    <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                      <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Source</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSourceColor(lead.source)}`}>
                      {lead.source}
                    </span>
                  </div>

                  {/* Date (if present) */}
                  {lead.date && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-50 gap-2">
                      <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Date</span>
                      </div>
                      <p className="font-bold text-slate-900 text-right">{lead.date}</p>
                    </div>
                  )}

                  {/* Assigned To (if present) */}
                  {lead.assignedTo && (
                    <div className="flex justify-between items-center py-1 gap-2">
                      <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                        <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Assigned To</span>
                      </div>
                      <p className="font-bold text-slate-900 text-right truncate max-w-[150px]">{lead.assignedTo}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setLeadToEdit(lead);
                    setIsEditDialogOpen(true);
                  }}
                  className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg border border-blue-100 transition-colors shadow-sm"
                  title="Edit Lead"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteLead(lead.id)}
                  className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg border border-red-100 transition-colors shadow-sm"
                  title="Delete Lead"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <AddLeadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleAddLead}
      />
      <EditLeadDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setLeadToEdit(null);
        }}
        onSubmit={handleEditLead}
        lead={leadToEdit}
      />

      {/* Confirmation Dialog for Converted Status */}
      {showConfirmModal && pendingStatusChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 text-gray-900">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Convert Lead to Customer?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to convert <strong className="text-gray-800">{pendingStatusChange.lead.name}</strong> to a customer? This will create a customer profile automatically.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingStatusChange(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowConfirmModal(false);
                  if (pendingStatusChange) {
                    await executeStatusChange(pendingStatusChange.id, pendingStatusChange.newStatus, pendingStatusChange.lead);
                  }
                  setPendingStatusChange(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-900 bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-colors shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
