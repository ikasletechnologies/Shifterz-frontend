"use client";

import { PhoneInput } from "@/components/common/PhoneInput";
import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, ArrowLeftRight, X, Eye, EyeOff } from "lucide-react";
import AddEmployeeDialog from "@/components/employees/AddEmployeeDialog";
import EditEmployeeDialog from "@/components/employees/EditEmployeeDialog";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getFranchises, createMemberTransfer, uploadFile, getMemberTransfers, updateMemberTransfer, deleteMemberTransfer } from "@/lib/api";
import { toast } from "react-hot-toast";

interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  username: string;
  role: string;
  status: string;
  franchiseId: string | null;
  franchise?: { id: string; name: string; city: string };
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [memberRequests, setMemberRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [showPassword, setShowPassword] = useState(false);

  // States for Request Member (Recruitment) Form
  const [newMemberForm, setNewMemberForm] = useState({
    name: "",
    phone: "",
    email: "",
    panNumber: "",
    aadharNumber: "",
    address: "",
    role: "TECHNICIAN",
    username: "",
    password: ""
  });
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);

  // States for Editing Pending Request
  const [isEditRequest, setIsEditRequest] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const userStr = localStorage.getItem("user");
        let user: any = null;
        if (userStr) {
          user = JSON.parse(userStr);
          setCurrentUser(user);
        }
        
        const canManage = user?.role === "SUPER_ADMIN" || user?.role === "HQ_USER";
        if (canManage) {
          const empData = await getEmployees();
          let franData = [];
          try {
            franData = await getFranchises();
          } catch (e) {
            // Ignore 403 for franchise users
          }
          setEmployees(empData);
          setFranchises(franData);
        } else if (user?.franchiseId) {
          const data = await getMemberTransfers();
          const filtered = data.filter((r: any) => r.toFranchiseId === user.franchiseId);
          setMemberRequests(filtered);
        }
      } catch (err: any) {
        toast.error("Failed to load data: " + err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAdd = async (data: any) => {
    try {
      const newEmp = await createEmployee(data);
      setEmployees([...employees, newEmp]);
      toast.success("Employee created successfully");
      setIsAddOpen(false);
    } catch (err: any) {
      toast.error("Failed to create employee: " + err.message);
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      const result = await updateEmployee(id, data);
      setEmployees(employees.map(emp => emp.id === id ? result : emp));
      if (result.transferPending) {
        toast.success("Employee details updated. Branch transfer request is pending approval.");
      } else {
        toast.success("Employee updated successfully");
      }
      setIsEditOpen(false);
    } catch (err: any) {
      toast.error("Failed to update employee: " + err.message);
    }
  };

  const handleRequestMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name || !newMemberForm.phone || !newMemberForm.email || !newMemberForm.panNumber || !newMemberForm.aadharNumber || !newMemberForm.username || !newMemberForm.password) {
      toast.error("Required fields (Name, Phone, Email, PAN Number, Aadhar Number, Username, Password) must be filled.");
      return;
    }

    setTransferLoading(true);
    try {
      // 1. Upload documents conditionally if selected
      let panDocUrl = null;
      let aadharDocUrl = null;

      if (panFile) {
        const panRes = await uploadFile(panFile);
        panDocUrl = panRes.url;
      }
      if (aadharFile) {
        const aadharRes = await uploadFile(aadharFile);
        aadharDocUrl = aadharRes.url;
      }

      // 2. Submit payload
      const payload: any = {
        toFranchiseId: currentUser.franchiseId,
        newMemberName: newMemberForm.name,
        newMemberPhone: newMemberForm.phone,
        newMemberEmail: newMemberForm.email,
        panNumber: newMemberForm.panNumber,
        aadharNumber: newMemberForm.aadharNumber,
        address: newMemberForm.address || null,
        panDocUrl,
        aadharDocUrl,
        role: newMemberForm.role,
        username: newMemberForm.username,
        password: newMemberForm.password
      };
      
      if (isEditRequest && editingRequestId) {
        await updateMemberTransfer(editingRequestId, payload);
        toast.success("Member request updated successfully!");
      } else {
        await createMemberTransfer(payload);
        toast.success("Member request submitted successfully! Pending approval.");
      }

      setIsTransferOpen(false);
      setIsEditRequest(false);
      setEditingRequestId("");

      // Refresh requested member queue
      const latestReqs = await getMemberTransfers();
      const filtered = latestReqs.filter((r: any) => r.toFranchiseId === currentUser.franchiseId);
      setMemberRequests(filtered);

      setNewMemberForm({
        name: "",
        phone: "",
        email: "",
        panNumber: "",
        aadharNumber: "",
        address: "",
        role: "TECHNICIAN",
        username: "",
        password: ""
      });
      setPanFile(null);
      setAadharFile(null);
    } catch (err: any) {
      toast.error("Failed to process member request: " + err.message);
    } finally {
      setTransferLoading(false);
    }
  };

  const handleEditRequest = (r: any) => {
    setIsEditRequest(true);
    setEditingRequestId(r.id);
    setNewMemberForm({
      name: r.newMemberName || "",
      phone: r.newMemberPhone || "",
      email: r.newMemberEmail || "",
      panNumber: r.panNumber || "",
      aadharNumber: r.aadharNumber || "",
      address: r.address || "",
      role: r.role || "TECHNICIAN",
      username: r.username || "",
      password: r.password || ""
    });
    setIsTransferOpen(true);
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    try {
      await deleteMemberTransfer(id);
      toast.success("Request deleted successfully!");
      // Refresh requests list
      const latestReqs = await getMemberTransfers();
      const filtered = latestReqs.filter((r: any) => r.toFranchiseId === currentUser.franchiseId);
      setMemberRequests(filtered);
    } catch (err: any) {
      toast.error("Failed to delete request: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      await deleteEmployee(id);
      setEmployees(employees.filter(emp => emp.id !== id));
      toast.success("Employee deleted successfully");
    } catch (err: any) {
      toast.error("Failed to delete employee: " + err.message);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading employees...</div>;
  }

  const canManageEmployees = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "HQ_USER";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage staff, roles, and access</p>
        </div>
        <div className="flex items-center gap-2">
          {canManageEmployees && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </button>
          )}
          {!canManageEmployees && currentUser?.franchiseId && (
            <button
              onClick={() => setIsTransferOpen(true)}
              className="bg-yellow-400 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center shadow-sm"
            >
              Request members
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                {canManageEmployees ? (
                  <>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {canManageEmployees ? (
                employees.map((emp) => {
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{emp.id}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                        {emp.username && <div className="text-xs text-gray-500">@{emp.username}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{emp.phone || "-"}</div>
                        <div className="text-xs text-gray-500">{emp.email || "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                          {emp.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {emp.franchise ? `${emp.franchise.name} (${emp.franchise.city})` : "HQ"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${emp.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsEditOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                memberRequests.map((r) => {
                  const statusColors = 
                    r.status === "Approved" 
                      ? "bg-green-100 text-green-700" 
                      : r.status === "Rejected" 
                      ? "bg-red-100 text-red-700" 
                      : "bg-yellow-50 text-yellow-700";

                  // Display branch name only 1 time (avoid tenkasi (tenkasi) if city is same as name)
                  const branchDisplay = 
                    r.toFranchiseName === r.toFranchiseCity 
                      ? r.toFranchiseName 
                      : `${r.toFranchiseName} (${r.toFranchiseCity})`;

                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{r.employeeName || r.newMemberName}</div>
                        {!r.employeeId && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-semibold">New Recruit</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {r.newMemberPhone || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {r.newMemberEmail || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                          {r.employeeRole.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {branchDisplay}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusColors}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {r.status === "Pending" ? (
                          <>
                            <button
                              onClick={() => handleEditRequest(r)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Request"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(r.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Locked</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}

              {((canManageEmployees && employees.length === 0) || (!canManageEmployees && memberRequests.length === 0)) && (
                <tr>
                  <td colSpan={canManageEmployees ? 7 : 7} className="px-6 py-8 text-center text-gray-500">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddEmployeeDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAdd}
        franchises={franchises}
      />

      {selectedEmployee && (
        <EditEmployeeDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onEdit={handleEdit}
          employee={selectedEmployee}
          franchises={franchises}
        />
      )}

      {/* Request Member Modal Dialog */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsTransferOpen(false); setIsEditRequest(false); setEditingRequestId(""); }} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-bold text-gray-900">{isEditRequest ? "Edit Member Request" : "Request New Member"}</h2>
              </div>
              <button onClick={() => { setIsTransferOpen(false); setIsEditRequest(false); setEditingRequestId(""); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleRequestMemberSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
              {/* Scrollable Form Body */}
              {/* Scrollable Form Body */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newMemberForm.name}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                      placeholder="Vijay Kumar"
                      className="w-full px-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Mobile Number *</label>
                    <PhoneInput
                      name="phone"
                      required
                      value={newMemberForm.phone}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={newMemberForm.email}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                      placeholder="vijay@gmail.com"
                      className="w-full px-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Address</label>
                    <input
                      type="text"
                      value={newMemberForm.address}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, address: e.target.value })}
                      placeholder="Enter full address here..."
                      className="w-full px-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Role *</label>
                    <select
                      required
                      value={newMemberForm.role}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-colors"
                    >
                      <option value="TECHNICIAN">Technician</option>
                      <option value="FRANCHISE_ADMIN">Franchise Admin</option>
                      <option value="RECEPTIONIST">Receptionist</option>
                      <option value="SERVICE_ADVISOR">Service Advisor</option>
                      <option value="BILLING">Billing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">PAN Number *</label>
                    <input
                      type="text"
                      required
                      value={newMemberForm.panNumber}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, panNumber: e.target.value.toUpperCase().slice(0, 10) })}
                      placeholder="ABCDE1234F"
                      className="w-full px-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Aadhar Number *</label>
                    <input
                      type="text"
                      required
                      value={newMemberForm.aadharNumber}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, aadharNumber: e.target.value.replace(/\D/g, "").slice(0, 12) })}
                      placeholder="123456789012"
                      className="w-full px-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Username *</label>
                    <input
                      type="text"
                      required
                      value={newMemberForm.username}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, username: e.target.value })}
                      placeholder="username123"
                      className="w-full px-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newMemberForm.password}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 pr-10 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">PAN Card Document</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setPanFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 transition-all cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Aadhar Card Document</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setAadharFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                <button
                  type="button"
                  onClick={() => { setIsTransferOpen(false); setIsEditRequest(false); setEditingRequestId(""); }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-400 text-gray-900 font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {transferLoading ? "Processing..." : (isEditRequest ? "Save Changes" : "Submit Request")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
