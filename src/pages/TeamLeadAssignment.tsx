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
            await setDoc(doc(db, "teamLeaders", emp.id), {
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
    <div className="p-6 min-h-screen bg-gradient-to-br from-cyan-100/95 to-orange-100/95 dark:bg-gradient-to-br dark:from-black/95 dark:to-black/90">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
        Assign Team Leads
      </h1>

      {/* Live Search Input */}
      <Input
        placeholder="Search by name, email or phone"
        className="mb-4 max-w-md"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <p className="text-gray-500">Loading employees...</p>
      ) : (
        <>
          <div className="overflow-x-auto liquid-glass-card">
            <table className="min-w-full text-sm">
              <thead className="bg-white/50 dark:bg-black/50">
                <tr>
                  <th className="p-3 text-left text-gray-800 dark:text-purple-100">Select</th>
                  <th className="p-3 text-left text-gray-800 dark:text-purple-100">Name</th>
                  <th className="p-3 text-left text-gray-800 dark:text-purple-100">Email</th>
                  <th className="p-3 text-left text-gray-800 dark:text-purple-100">Phone</th>
                  <th className="p-3 text-left text-gray-800 dark:text-purple-100">Location</th>
                  <th className="p-3 text-left text-gray-800 dark:text-purple-100">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className={`border-t border-gray-200 dark:border-purple-500/30 ${selectedIds.includes(emp.id) ? "bg-blue-50 dark:bg-purple-700/40" : ""}`}
                  >
                    <td className="p-3 text-gray-800 dark:text-purple-100">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(emp.id)}
                        onChange={() => toggleSelection(emp.id)}
                      />
                    </td>
                    <td className="p-3 text-gray-800 dark:text-purple-100">{emp.name}</td>
                    <td className="p-3 text-gray-800 dark:text-purple-100">{emp.email}</td>
                    <td className="p-3 text-gray-800 dark:text-purple-100">{emp.phone as any}</td>
                    <td className="p-3 text-gray-800 dark:text-purple-100">{emp.location}</td>
                    <td className="p-3 text-gray-800 dark:text-purple-100">{emp.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <Button
              type="primary"
              className="bg-blue-600"
              onClick={assignTeamLeads}
              disabled={selectedIds.length === 0}
            >
              Assign as Team Lead
            </Button>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
              Already Assigned Team Leads
            </h2>
            <div className="overflow-x-auto liquid-glass-card">
              <table className="min-w-full text-sm">
                <thead className="bg-white/50 dark:bg-black/50">
                  <tr>
                    <th className="p-3 text-left text-gray-800 dark:text-purple-100">Name</th>
                    <th className="p-3 text-left text-gray-800 dark:text-purple-100">Email</th>
                    <th className="p-3 text-left text-gray-800 dark:text-purple-100">Phone</th>
                    <th className="p-3 text-left text-gray-800 dark:text-purple-100">Location</th>
                    <th className="p-3 text-left text-gray-800 dark:text-purple-100">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teamLeads.map((lead) => (
                    <tr key={lead.id} className="border-t border-gray-200 dark:border-purple-500/30">
                      <td className="p-3 text-gray-800 dark:text-purple-100">{lead.name}</td>
                      <td className="p-3 text-gray-800 dark:text-purple-100">{lead.email}</td>
                      <td className="p-3 text-gray-800 dark:text-purple-100">{lead.phone as any}</td>
                      <td className="p-3 text-gray-800 dark:text-purple-100">{lead.location}</td>
                      <td className="p-3 text-gray-800 dark:text-purple-100">{lead.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


