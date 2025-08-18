import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button, message, Input } from "antd";

type Employee = {
  id: string;
  name?: string;
  email?: string;
  phone?: string | number;
  location?: string;
  status?: string;
  type?: string;
};

type TeamLead = Employee;

export default function TeamLeadAssignmentPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teamLeads, setTeamLeads] = useState<TeamLead[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!db) throw new Error("Firestore is not initialized");

        const empSnap = await getDocs(collection(db, "employees"));
        const allEmployees = empSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Employee, "id">),
        }));

        const leadsSnap = await getDocs(collection(db, "teamLeaders"));
        const allLeads = leadsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<TeamLead, "id">),
        }));

        setEmployees(allEmployees);
        setTeamLeads(allLeads);
      } catch (err) {
        console.error("Error fetching data:", err);
        message.error("Failed to load employees/team leads.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const assignTeamLeads = async () => {
    if (selectedIds.length === 0) {
      message.warning("Please select at least one employee.");
      return;
    }

    try {
      if (!db) throw new Error("Firestore is not initialized");

      await Promise.all(
        selectedIds.map(async (empId) => {
          const emp = employees.find((e) => e.id === empId);
          if (emp) {
            await setDoc(doc(db as any, "teamLeaders", emp.id), {
              id: emp.id,
              name: emp.name || "",
              email: emp.email || "",
              phone: emp.phone || "",
              location: emp.location || "",
              status: emp.status || "",
              type: emp.type || "",
              createdAt: serverTimestamp(),
            });
          }
        })
      );

      message.success("Selected employees assigned as team leads.");
      setSelectedIds([]);
      const updatedLeads = await getDocs(collection(db, "teamLeaders"));
      setTeamLeads(
        updatedLeads.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      );
    } catch (err) {
      console.error("Error assigning team leads:", err);
      message.error("Failed to assign team leads.");
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(lowerSearch) ||
      emp.email?.toLowerCase().includes(lowerSearch) ||
      emp.phone?.toString().toLowerCase().includes(lowerSearch)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 p-6 overflow-auto">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-violet-200/20 to-purple-200/20 dark:from-violet-900/10 dark:to-purple-900/10 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-violet-200/20 dark:from-indigo-900/10 dark:to-violet-900/10 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-violet-200/50 dark:border-violet-500/20 p-6 shadow-lg">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-500 dark:to-indigo-500 bg-clip-text text-transparent mb-2">
            👥 Team Lead Assignment
          </h1>
          <p className="text-violet-600/70 dark:text-violet-300/70">
            Assign employees as team leads to manage projects and teams
          </p>
        </div>

        {/* Search Input */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-violet-200/50 dark:border-violet-500/20 p-6 shadow-lg">
          <Input
            placeholder="Search by name, email or phone"
            className="max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="large"
          />
        </div>

        {loading ? (
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-violet-200/50 dark:border-violet-500/20 p-12 shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 dark:border-violet-400 border-t-violet-600 dark:border-t-violet-300 mx-auto mb-4"></div>
            <p className="text-violet-600 dark:text-violet-400 font-medium">Loading employees...</p>
          </div>
        ) : (
          <>
            {/* Employees Table */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-violet-200/50 dark:border-violet-500/20 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-violet-200/30 dark:border-violet-500/20">
                <h2 className="text-xl font-semibold text-violet-800 dark:text-violet-200 mb-2">
                  Available Employees
                </h2>
                <p className="text-violet-600/70 dark:text-violet-300/70">
                  Select employees to assign as team leads
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-violet-100/80 to-purple-100/80 dark:from-violet-800/50 dark:to-purple-700/50">
                    <tr>
                      <th className="p-4 text-left font-semibold text-violet-800 dark:text-violet-200">Select</th>
                      <th className="p-4 text-left font-semibold text-violet-800 dark:text-violet-200">Name</th>
                      <th className="p-4 text-left font-semibold text-violet-800 dark:text-violet-200">Email</th>
                      <th className="p-4 text-left font-semibold text-violet-800 dark:text-violet-200">Phone</th>
                      <th className="p-4 text-left font-semibold text-violet-800 dark:text-violet-200">Location</th>
                      <th className="p-4 text-left font-semibold text-violet-800 dark:text-violet-200">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-100/50 dark:divide-violet-500/20">
                    {filteredEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        className={`hover:bg-violet-50/50 dark:hover:bg-violet-900/20 transition-colors ${
                          selectedIds.includes(emp.id) ? "bg-violet-100/50 dark:bg-violet-800/30" : ""
                        }`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(emp.id)}
                            onChange={() => toggleSelection(emp.id)}
                            className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 dark:focus:ring-violet-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                        </td>
                        <td className="p-4 font-medium text-slate-900 dark:text-slate-200">{emp.name}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">{emp.email}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">{emp.phone}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">{emp.location}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            emp.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Assign Button */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-violet-200/50 dark:border-violet-500/20 p-6 shadow-lg">
              <Button
                type="primary"
                size="large"
                onClick={assignTeamLeads}
                disabled={selectedIds.length === 0}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 border-0 shadow-lg"
              >
                Assign as Team Lead ({selectedIds.length} selected)
              </Button>
            </div>

            {/* Current Team Leads */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-violet-200/50 dark:border-violet-500/20 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-violet-200/30 dark:border-violet-500/20">
                <h2 className="text-xl font-semibold text-violet-800 dark:text-violet-200 mb-2">
                  Current Team Leads
                </h2>
                <p className="text-violet-600/70 dark:text-violet-300/70">
                  Employees currently assigned as team leads
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-violet-100/80 to-purple-100/80 dark:from-violet-800/50 dark:to-purple-700/50">
                    <tr>
                      <th className="p-4 text-left font-semibold text-violet-800 dark:text-violet-200">Name</th>
                      <th className="p-4 text-left font-semibold text-violet-800 dark:text-violet-200">Email</th>
                      <th className="p-4 text-left font-semibold text-violet-800 dark:text-violet-200">Phone</th>
                      <th className="p-4 text-left font-semibold text-violet-800 dark:text-violet-200">Location</th>
                      <th className="p-4 text-left font-semibold text-violet-800 dark:text-violet-200">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-100/50 dark:divide-violet-500/20">
                    {teamLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-violet-50/50 dark:hover:bg-violet-900/20 transition-colors">
                        <td className="p-4 font-medium text-slate-900 dark:text-slate-200">{lead.name}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">{lead.email}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">{lead.phone}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">{lead.location}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Team Lead
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
