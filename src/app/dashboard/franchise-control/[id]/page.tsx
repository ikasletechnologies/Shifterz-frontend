"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEmployees, getFranchises } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Building2, User, Phone, Mail, ArrowLeft, ChevronLeft } from "lucide-react";

export default function FranchiseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [employees, setEmployees] = useState<any[]>([]);
  const [franchise, setFranchise] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const franchises = await getFranchises();
        const currentFranchise = franchises.find((f: any) => f.id === id);
        
        if (currentFranchise) {
          setFranchise(currentFranchise);
        } else {
          toast.error("Franchise not found");
        }

        const allEmployees = await getEmployees();
        const franchiseEmployees = allEmployees.filter((emp: any) => emp.franchiseId === id);
        setEmployees(franchiseEmployees);
      } catch (err: any) {
        toast.error("Failed to load details: " + err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  // Categorize employees
  const categories: Record<string, any[]> = {};
  employees.forEach((emp) => {
    const role = emp.role || "UNKNOWN";
    if (!categories[role]) {
      categories[role] = [];
    }
    categories[role].push(emp);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-yellow-600 hover:border-yellow-300 hover:bg-yellow-50 transition-all shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-yellow-500" />
            {franchise ? `${franchise.name} Details` : "Franchise Details"}
          </h1>
          <p className="text-gray-500 mt-1">View employees for this specific franchise</p>
        </div>
      </div>

      {franchise && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-1 space-y-2">
            <p className="text-sm text-gray-500 uppercase font-semibold">Location</p>
            <p className="text-lg font-medium text-gray-900">{franchise.city || "Not Specified"}</p>
            {franchise.address && <p className="text-sm text-gray-600">{franchise.address}</p>}
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-gray-500 uppercase font-semibold">Owner / Manager</p>
            <p className="text-lg font-medium text-gray-900">{franchise.owner || "Not Assigned"}</p>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-gray-500 uppercase font-semibold">Contact</p>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-900">{franchise.phone || "N/A"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-900">{franchise.email || "N/A"}</p>
            </div>
          </div>
        </div>
      )}

      {Object.keys(categories).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Employees Found</h3>
          <p className="text-gray-500">There are no employees associated with this franchise.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="data-table w-full min-w-[800px] text-left">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(categories).flatMap(([role, emps]) =>
                emps.map((emp) => (
                  <tr key={emp.id}>
                    <td className="max-w-[200px] truncate" title={emp.name}>{emp.name}</td>
                    <td className="whitespace-nowrap">@{emp.username}</td>
                    <td className="whitespace-nowrap capitalize">{role.replace("_", " ").toLowerCase()}</td>
                    <td className="whitespace-nowrap">{emp.phone || "—"}</td>
                    <td className="max-w-[220px] truncate" title={emp.email}>{emp.email || "—"}</td>
                    <td className="whitespace-nowrap">{emp.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
