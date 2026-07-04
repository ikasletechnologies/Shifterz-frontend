"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import AddEmployeeDialog from "@/components/employees/AddEmployeeDialog";
import EditEmployeeDialog from "@/components/employees/EditEmployeeDialog";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getFranchises } from "@/lib/api";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const userStr = localStorage.getItem("user");
        if (userStr) {
          setCurrentUser(JSON.parse(userStr));
        }
        
        const empData = await getEmployees();
        let franData = [];
        try {
          franData = await getFranchises();
        } catch (e) {
          // Ignore 403 for franchise users
        }
        setEmployees(empData);
        setFranchises(franData);
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
      const updated = await updateEmployee(id, data);
      setEmployees(employees.map(emp => emp.id === id ? updated : emp));
      toast.success("Employee updated successfully");
      setIsEditOpen(false);
    } catch (err: any) {
      toast.error("Failed to update employee: " + err.message);
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
        {canManageEmployees && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                {canManageEmployees && <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => {
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
                    {canManageEmployees && (
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
                    )}
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No employees found
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
    </div>
  );
}
