import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, isFirebaseConnected } from "../lib/firebase";
import { format } from "date-fns";

const AdminTicketsPage = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [projectsMap, setProjectsMap] = useState<any>({});
  const [teamLeadMap, setTeamLeadMap] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("");
  const [usersMap, setUsersMap] = useState<any>({});
  const [editingTicket, setEditingTicket] = useState<any>(null);
  const [editValues, setEditValues] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  useEffect(() => {
    const fetchTickets = async () => {
      if (!isFirebaseConnected()) {
        console.warn("Firebase not connected - skipping ticket fetch");
        return;
      }

      try {
        const ticketSnapshot = await getDocs(collection(db, "raiseTickets"));
        const fetchedTickets: any[] = [];
        const projectIds = new Set<string>();
        const teamLeadIds = new Set<string>();

        ticketSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedTickets.push({ id: doc.id, ...data });
          if (data.projectId) projectIds.add(data.projectId);
          if (data.teamLeadId) teamLeadIds.add(data.teamLeadId);
        });

        const projectMap: any = {};
        await Promise.all(
          Array.from(projectIds).map(async (id) => {
            const projRef = doc(db, "projects", id);
            const projSnap = await getDoc(projRef);
            projectMap[id] = projSnap.exists()
              ? projSnap.data().name || id
              : "Unknown Project";
          })
        );

        const leadMap: any = {};
        await Promise.all(
          Array.from(teamLeadIds).map(async (id) => {
            const leadRef = doc(db, "employees", id);
            const leadSnap = await getDoc(leadRef);
            const data = leadSnap.data();
            leadMap[id] = leadSnap.exists() ? data?.name || id : "Unknown";
          })
        );

        // Fetch users for filtering
        const userMap: any = {};
        const userSnapshot = await getDocs(collection(db, "employees"));
        userSnapshot.forEach((doc) => {
          const data = doc.data();
          userMap[doc.id] = data.name || data.email || doc.id;
        });

        setProjectsMap(projectMap);
        setTeamLeadMap(leadMap);
        setUsersMap(userMap);
        setTickets(fetchedTickets);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        // Set empty fallback data
        setProjectsMap({});
        setTeamLeadMap({});
        setUsersMap({});
        setTickets([]);
      }
    };

    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter ? ticket.status === statusFilter : true;
    const matchesProject = projectFilter
      ? projectsMap[ticket.projectId] === projectFilter
      : true;
    const matchesUser = userFilter ? ticket.createdByName === userFilter : true;

    // Date filtering
    const matchesDate = (() => {
      if (dateFilter === "all") return true;

      const ticketDate = ticket.createdAt?.seconds
        ? new Date(ticket.createdAt.seconds * 1000)
        : null;

      if (!ticketDate) return false;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      switch (dateFilter) {
        case "today":
          return ticketDate >= today;
        case "week":
          return ticketDate >= weekAgo;
        case "month":
          return ticketDate >= monthAgo;
        default:
          return true;
      }
    })();

    return matchesStatus && matchesProject && matchesUser && matchesDate;
  });

  const uniqueProjectNames = Array.from(new Set(Object.values(projectsMap)));
  const uniqueStatuses = Array.from(new Set(tickets.map((t) => t.status)));
  const uniqueUsers = Array.from(new Set(tickets.map((t) => t.createdByName).filter(Boolean)));

  const getReviewColor = (review: string) => {
    switch (review?.toLowerCase()) {
      case "done":
        return "text-green-600 font-semibold";
      case "pending":
        return "text-red-600 font-semibold";
      case "in progress":
        return "text-blue-600 font-semibold";
      default:
        return "text-gray-600";
    }
  };

  const isPastDue = (dueDate: string) => {
    try {
      return new Date(dueDate) < new Date();
    } catch {
      return false;
    }
  };

  const handleReviewChange = async (ticketId: string, newReview: string) => {
    try {
      await updateDoc(doc(db, "raiseTickets", ticketId), { review: newReview });
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, review: newReview } : ticket
        )
      );
    } catch (error) {
      console.error("Failed to update review:", error);
    }
  };

  const handleEditClick = (ticket: any) => {
    setEditingTicket(ticket);
    setEditValues({
      title: ticket.title || "",
      description: ticket.description || "",
      dueDate: ticket.dueDate || "",
    });
  };

  const handleEditSave = async () => {
    try {
      await updateDoc(doc(db, "raiseTickets", editingTicket.id), {
        ...editValues,
      });
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === editingTicket.id ? { ...ticket, ...editValues } : ticket
        )
      );
      setEditingTicket(null);
    } catch (error) {
      console.error("Failed to save edits:", error);
    }
  };

  const handleDelete = async (ticketId: string) => {
    try {
      await deleteDoc(doc(db, "raiseTickets", ticketId));
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch (error) {
      console.error("Failed to delete ticket:", error);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-100 via-purple-100 to-indigo-200 dark:from-slate-800 dark:via-purple-900/40 dark:to-indigo-900/60 p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-slate-200/30 via-purple-200/40 to-indigo-300/50 dark:from-slate-700/20 dark:via-purple-800/30 dark:to-indigo-900/40 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-br from-purple-200/30 via-indigo-200/40 to-slate-300/50 dark:from-purple-800/20 dark:via-indigo-900/30 dark:to-slate-700/40 rounded-full blur-3xl opacity-70"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-indigo-500/20 rounded-2xl p-6 mb-6 shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-slate-600 via-purple-600 to-indigo-700 rounded-2xl shadow-lg ring-2 ring-white/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 via-purple-700 to-indigo-800 dark:from-slate-300 dark:via-purple-300 dark:to-indigo-200 bg-clip-text text-transparent tracking-tight">Support Tickets</h1>
            <p className="text-sm text-slate-600/80 dark:text-slate-300/80 font-medium tracking-wide">View and manage all raised support tickets</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <select
            className="px-4 py-3 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-500/30 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-lg backdrop-blur-sm transition-all duration-300"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">Filter by Project</option>
            {uniqueProjectNames.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>

          <select
            className="px-4 py-3 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-500/30 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-lg backdrop-blur-sm transition-all duration-300"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Filter by Status</option>
            {uniqueStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>

          <select
            className="px-4 py-3 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-500/30 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-lg backdrop-blur-sm transition-all duration-300"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="">Filter by User</option>
            {uniqueUsers.map((user) => (
              <option key={user}>{user}</option>
            ))}
          </select>

          <select
            className="px-4 py-3 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-500/30 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-lg backdrop-blur-sm transition-all duration-300"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-600/30 rounded-2xl shadow-xl ring-1 ring-white/20 dark:ring-slate-700/30 overflow-auto">
        <table className="min-w-[1200px] w-full border-collapse text-sm text-left">
          <thead className="bg-slate-50/80 dark:bg-slate-700/50 backdrop-blur-sm">
            <tr>
              <th className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200 font-semibold">Ticket ID</th>
              <th className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200 font-semibold">Title</th>
              <th className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200 font-semibold">Description</th>
              <th className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200 font-semibold">Priority</th>
              <th className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200 font-semibold">Status</th>
              <th className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200 font-semibold">Due Date</th>
              <th className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200 font-semibold">Project</th>
              <th className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200 font-semibold">Created By</th>
              <th className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200 font-semibold">Created At</th>
              <th className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200 font-semibold">Team Lead</th>
              <th className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200 font-semibold">Review</th>
              <th className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors duration-200">
                <td className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200">{ticket.projectTicketId}</td>
                <td className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200 font-medium">{ticket.title}</td>
                <td className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-600 dark:text-slate-300">{ticket.description}</td>
                <td className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200">{ticket.priority}</td>
                <td className="px-4 py-4 border border-slate-300/40 dark:border-slate-500/40">
                  <span
                    className={`px-3 py-1 rounded-full text-white text-xs font-medium ${
                      ticket.status === "Done"
                        ? "bg-emerald-500"
                        : ticket.status === "Pending"
                        ? "bg-amber-500"
                        : ticket.status === "Progress"
                        ? "bg-indigo-500"
                        : "bg-slate-400"
                    }`}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td
                  className={`p-4 border border-slate-300/40 dark:border-slate-500/40 ${
                    isPastDue(ticket.dueDate)
                      ? "text-red-600 dark:text-red-400 font-semibold"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {ticket.dueDate || "N/A"}
                </td>
                <td className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200">
                  {projectsMap[ticket.projectId] || ticket.projectId}
                </td>
                <td className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200">{ticket.createdByName}</td>
                <td className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200">
                  {ticket.createdAt?.seconds
                    ? format(
                        new Date(ticket.createdAt.seconds * 1000),
                        "yyyy-MM-dd HH:mm"
                      )
                    : "N/A"}
                </td>
                <td className="p-4 border border-slate-300/40 dark:border-slate-500/40 text-slate-700 dark:text-slate-200">
                  {teamLeadMap[ticket.teamLeadId] || ticket.teamLeadId}
                </td>
                <td className="p-4 border border-slate-300/40 dark:border-slate-500/40">
                  <select
                    className={`border border-slate-300/40 dark:border-slate-500/40 px-3 py-2 w-full rounded-lg bg-white/90 dark:bg-slate-700/90 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 shadow-sm ${getReviewColor(
                      ticket.review
                    )}`}
                    value={ticket.review || ""}
                    onChange={(e) =>
                      handleReviewChange(ticket.id, e.target.value)
                    }
                  >
                    <option value="">Select Review</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </td>
                <td className="p-4 border border-slate-300/40 dark:border-slate-500/40 space-x-2">
                  <button
                    className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200 font-medium"
                    onClick={() => handleEditClick(ticket)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 dark:text-red-400 underline hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200 font-medium"
                    onClick={() => handleDelete(ticket.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-600/30 rounded-2xl p-6 w-[400px] shadow-2xl ring-1 ring-white/20">
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">Edit Ticket</h2>
            <label className="block mb-3 text-slate-700 dark:text-slate-300">
              Title:
              <input
                type="text"
                className="w-full border border-slate-200 dark:border-slate-500/30 p-3 rounded-xl mt-1 bg-white/90 dark:bg-slate-700/90 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 shadow-sm"
                value={editValues.title}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </label>
            <label className="block mb-3 text-slate-700 dark:text-slate-300">
              Description:
              <textarea
                className="w-full border border-slate-200 dark:border-slate-500/30 p-3 rounded-xl mt-1 bg-white/90 dark:bg-slate-700/90 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 shadow-sm"
                value={editValues.description}
                onChange={(e) =>
                  setEditValues((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </label>
            <label className="block mb-4 text-slate-700 dark:text-slate-300">
              Due Date:
              <input
                type="date"
                className="w-full border border-slate-200 dark:border-slate-500/30 p-3 rounded-xl mt-1 bg-white/90 dark:bg-slate-700/90 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 shadow-sm"
                value={editValues.dueDate}
                onChange={(e) =>
                  setEditValues((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
              />
            </label>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-3 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-500 transition-all duration-300 shadow-sm"
                onClick={() => setEditingTicket(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-3 bg-gradient-to-r from-slate-600 via-purple-600 to-indigo-700 text-white rounded-xl hover:from-slate-700 hover:via-purple-700 hover:to-indigo-800 transition-all duration-300 shadow-xl font-semibold"
                onClick={handleEditSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTicketsPage;
