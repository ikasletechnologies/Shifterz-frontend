"use client";

import React, { useMemo, useState } from "react";
import {
  User,
  Phone,
  Mail,
  Car,
  Calendar,
  Tag,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  HelpCircle,
  Briefcase,
  Layers,
} from "lucide-react";

export interface Lead {
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
  franchiseId?: string;
  franchiseName?: string;
}

interface LeadsTabsProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  renderStatus?: (lead: Lead) => React.ReactNode;
}

export function LeadsTabs({ leads, onEdit, onDelete, renderStatus }: LeadsTabsProps) {
  const [activeTab, setActiveTab] = useState<"All" | "New" | "Follow Up" | "Converted" | "Lost">("All");

  const newLeads = useMemo(() => leads.filter((l) => l.status === "New"), [leads]);
  const followUpLeads = useMemo(() => leads.filter((l) => l.status === "Follow Up"), [leads]);
  const convertedLeads = useMemo(() => leads.filter((l) => l.status === "Converted"), [leads]);
  const lostLeads = useMemo(() => leads.filter((l) => l.status === "Lost"), [leads]);

  const displayedLeads = useMemo(() => {
    if (activeTab === "New") return newLeads;
    if (activeTab === "Follow Up") return followUpLeads;
    if (activeTab === "Converted") return convertedLeads;
    if (activeTab === "Lost") return lostLeads;
    return leads;
  }, [activeTab, leads, newLeads, followUpLeads, convertedLeads, lostLeads]);

  if (leads.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs">
        <User className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-700">No leads found</p>
        <p className="text-xs text-slate-400 mt-1">Add inquiries and potential customer leads to start tracking.</p>
      </div>
    );
  }

  const getSourceBadge = (source: string) => {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded">
        <Tag className="w-3 h-3 text-slate-400" />
        {source || "Direct"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Category Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab("All")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "All"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span>All Leads</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{leads.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("New")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "New"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
          <span>New</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{newLeads.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Follow Up")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Follow Up"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Follow Up</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{followUpLeads.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Converted")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Converted"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Converted</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{convertedLeads.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Lost")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Lost"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span>Lost</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{lostLeads.length}</span>
        </button>
      </div>

      {/* Cards Grid */}
      {displayedLeads.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-sm">
          No leads in this status category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedLeads.map((lead) => {
            return (
              <div
                key={lead.id}
                className="bg-white rounded-xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-yellow-400 transition-all p-4 flex flex-col justify-between gap-3"
              >
                {/* Header: Lead ID + Source Badge + Status Dropdown/Badge */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {lead.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getSourceBadge(lead.source)}
                      {renderStatus ? (
                        renderStatus(lead)
                      ) : (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                          {lead.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer / Contact Name */}
                  <div>
                    <h4 className="font-bold text-base text-gray-900 truncate" title={lead.name}>
                      {lead.name || "Unnamed Lead"}
                    </h4>

                    <div className="space-y-1 pt-1 text-xs">
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-gray-500 truncate" title={lead.email}>
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle & Desired Service */}
                  <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs">
                    {lead.vehicle && (
                      <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                        <Car className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate uppercase tracking-wide">{lead.vehicle}</span>
                      </div>
                    )}
                    {lead.service && (
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="text-gray-500 text-[11px]">Service:</span>
                        <strong className="text-gray-800 text-[11px] truncate max-w-[140px]" title={lead.service}>
                          {lead.service}
                        </strong>
                      </div>
                    )}
                    {lead.budget && (
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="text-gray-500 text-[11px]">Budget:</span>
                        <strong className="text-gray-900 text-[11px] font-mono">₹{lead.budget}</strong>
                      </div>
                    )}
                  </div>

                  {/* Assignment & Created Date */}
                  <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-gray-400" />
                        Assigned To:
                      </span>
                      <strong className="text-gray-700 font-medium truncate max-w-[120px]">
                        {lead.assignedTo || "Unassigned"}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        Date:
                      </span>
                      <span className="text-gray-600 font-medium">
                        {lead.date ? new Date(lead.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1.5 mt-auto">
                  <button
                    type="button"
                    onClick={() => onEdit(lead)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Lead</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(lead.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Lead"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LeadsTabs;
