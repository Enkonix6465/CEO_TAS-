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
    <div className="h-full bg-gradient-to-br from-cyan-100/95 to-orange-100/95 dark:bg-gradient-to-br dark:from-black/95 dark:to-black/90 p-6">
      <h1 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">All Tickets</h1>

      <div className="flex gap-4 mb-4 flex-wrap">
        <select
          className="border border-cyan-300 dark:border-orange-500/40 p-2 rounded bg-white dark:bg-black/95 text-gray-900 dark:text-white"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="">Filter by Project</option>
          {uniqueProjectNames.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>

        <select
          className="border border-cyan-300 dark:border-orange-500/40 p-2 rounded bg-white dark:bg-black/95 text-gray-900 dark:text-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Filter by Status</option>
          {uniqueStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>

        <select
          className="border border-cyan-300 dark:border-orange-500/40 p-2 rounded bg-white dark:bg-black/95 text-gray-900 dark:text-white"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
        >
          <option value="">Filter by User</option>
          {uniqueUsers.map((user) => (
            <option key={user}>{user}</option>
          ))}
        </select>

        <select
          className="border border-cyan-300 dark:border-orange-500/40 p-2 rounded bg-white dark:bg-black/95 text-gray-900 dark:text-white"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      <div className="liquid-glass-card overflow-auto">
        <table className="min-w-[1200px] w-full border-collapse text-sm text-left">
          <thead className="bg-white/50 dark:bg-black/50">
            <tr>
              <th className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">Ticket ID</th>
              <th className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">Title</th>
              <th className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">Description</th>
              <th className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">Priority</th>
              <th className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">Status</th>
              <th className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">Due Date</th>
              <th className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">Project</th>
              <th className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">Created By</th>
              <th className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">Created At</th>
              <th className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">Team Lead</th>
              <th className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">Review</th>
              <th className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-cyan-50 dark:hover:bg-orange-900/20">
                <td className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">{ticket.projectTicketId}</td>
                <td className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">{ticket.title}</td>
                <td className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">{ticket.description}</td>
                <td className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">{ticket.priority}</td>
                <td className="px-4 py-2 border border-cyan-300 dark:border-orange-500/40">
                  <span
                    className={`px-2 py-1 rounded-full text-white text-xs font-medium ${
                      ticket.status === "Done"
                        ? "bg-green-500"
                        : ticket.status === "Pending"
                        ? "bg-red-500"
                        : ticket.status === "Progress"
                        ? "bg-purple-500"
                        : "bg-gray-400"
                    }`}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td
                  className={`p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white ${
                    isPastDue(ticket.dueDate)
                      ? "text-red-600 dark:text-red-400 font-semibold"
                      : ""
                  }`}
                >
                  {ticket.dueDate || "N/A"}
                </td>
                <td className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">
                  {projectsMap[ticket.projectId] || ticket.projectId}
                </td>
                <td className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">{ticket.createdByName}</td>
                <td className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">
                  {ticket.createdAt?.seconds
                    ? format(
                        new Date(ticket.createdAt.seconds * 1000),
                        "yyyy-MM-dd HH:mm"
                      )
                    : "N/A"}
                </td>
                <td className="p-2 border border-cyan-300 dark:border-orange-500/40 text-gray-900 dark:text-white">
                  {teamLeadMap[ticket.teamLeadId] || ticket.teamLeadId}
                </td>
                <td className="p-2 border border-cyan-300 dark:border-orange-500/40">
                  <select
                    className={`border border-cyan-300 dark:border-orange-500/40 px-2 py-1 w-full rounded bg-white dark:bg-black/95 text-gray-900 dark:text-white ${getReviewColor(
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
                <td className="p-2 border border-cyan-300 dark:border-orange-500/40 space-x-2">
                  <button
                    className="text-cyan-600 dark:text-cyan-400 underline"
                    onClick={() => handleEditClick(ticket)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 dark:text-red-400 underline"
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="liquid-glass-card w-[400px] shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Edit Ticket</h2>
            <label className="block mb-2 text-gray-900 dark:text-white">
              Title:
              <input
                type="text"
                className="w-full border border-gray-200 dark:border-purple-500/30 p-2 rounded mt-1 bg-white dark:bg-purple-800 text-gray-900 dark:text-purple-100"
                value={editValues.title}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </label>
            <label className="block mb-2 text-gray-900 dark:text-white">
              Description:
              <textarea
                className="w-full border border-gray-200 dark:border-purple-500/30 p-2 rounded mt-1 bg-white dark:bg-purple-800 text-gray-900 dark:text-purple-100"
                value={editValues.description}
                onChange={(e) =>
                  setEditValues((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </label>
            <label className="block mb-4 text-gray-900 dark:text-white">
              Due Date:
              <input
                type="date"
                className="w-full border border-gray-200 dark:border-purple-500/30 p-2 rounded mt-1 bg-white dark:bg-purple-800 text-gray-900 dark:text-purple-100"
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
                className="px-4 py-2 bg-gray-300 dark:bg-purple-700 text-gray-900 dark:text-white rounded"
                onClick={() => setEditingTicket(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded"
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
