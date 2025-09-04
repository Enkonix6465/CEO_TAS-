import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { format } from "date-fns";

const ViewTickets = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [projectsMap, setProjectsMap] = useState<any>({});
  const [teamLeadMap, setTeamLeadMap] = useState<any>({});
  const [usersMap, setUsersMap] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [editingTicket, setEditingTicket] = useState<any>(null);
  const [editValues, setEditValues] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
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

        // Fetch project data
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

        // Fetch team lead data from both users and employees collections
        const leadMap: any = {};
        const allUserIds = new Set([...teamLeadIds, ...fetchedTickets.map(t => t.createdById || t.created_by || t.createdByName).filter(Boolean)]);

        // First try users collection
        await Promise.all(
          Array.from(allUserIds).map(async (id) => {
            try {
              const userRef = doc(db, "users", id);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                leadMap[id] = userData?.fullName || userData?.name || userData?.displayName || userData?.email || id;
              } else {
                // Try employees collection as fallback
                const empRef = doc(db, "employees", id);
                const empSnap = await getDoc(empRef);
                if (empSnap.exists()) {
                  const empData = empSnap.data();
                  leadMap[id] = empData?.fullName || empData?.name || empData?.displayName || empData?.email || id;
                } else {
                  leadMap[id] = id === 'admin' ? 'Admin' : 'Unknown User';
                }
              }
            } catch (error) {
              console.error(`Error fetching user data for ${id}:`, error);
              leadMap[id] = id === 'admin' ? 'Admin' : 'Unknown User';
            }
          })
        );

        setProjectsMap(projectMap);
        setTeamLeadMap(leadMap);
        setUsersMap(leadMap); // Use the same map for all user lookups
        setTickets(fetchedTickets);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter ? ticket.status === statusFilter : true;
    const matchesProject = projectFilter
      ? projectsMap[ticket.projectId] === projectFilter
      : true;
    const matchesPriority = priorityFilter
      ? ticket.priority === priorityFilter
      : true;
    return matchesStatus && matchesProject && matchesPriority;
  });

  const uniqueProjectNames = Array.from(new Set(Object.values(projectsMap)));
  const uniqueStatuses = Array.from(new Set(tickets.map((t) => t.status)));
  const uniquePriorities = Array.from(new Set(tickets.map((t) => t.priority)));

  const getReviewColor = (review: string) => {
    switch (review?.toLowerCase()) {
      case "done":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30";
      case "pending":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
      case "in progress":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
      case "medium":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
      case "low":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
      default:
        return "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "done":
        return "bg-emerald-500 text-white";
      case "pending":
        return "bg-red-500 text-white";
      case "progress":
      case "in progress":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-400 text-white";
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
      priority: ticket.priority || "",
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
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        await deleteDoc(doc(db, "raiseTickets", ticketId));
        setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      } catch (error) {
        console.error("Failed to delete ticket:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 dark:border-violet-400 border-t-violet-600 dark:border-t-violet-300 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-violet-600 dark:bg-violet-500 rounded-full"></div>
            </div>
          </div>
          <p className="text-violet-600 dark:text-violet-400 font-medium">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 p-4 lg:p-6">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-violet-200/20 to-purple-200/20 dark:from-violet-900/10 dark:to-purple-900/10 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-violet-200/20 dark:from-indigo-900/10 dark:to-violet-900/10 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-500 dark:to-indigo-500 bg-clip-text text-transparent mb-2">
            🎫 View & Manage Tickets
          </h1>
          <p className="text-violet-600/70 dark:text-violet-300/70 text-sm lg:text-base">
            Monitor and update tickets across all projects
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-violet-600/70 dark:text-violet-300/70">
            <span className="px-3 py-1 bg-violet-100/80 dark:bg-violet-600/30 text-violet-700 dark:text-violet-300 rounded-full font-medium">
              {filteredTickets.length} tickets displayed
            </span>
            <span className="px-3 py-1 bg-blue-100/80 dark:bg-blue-600/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
              {tickets.length} total tickets
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-violet-200/50 dark:border-violet-500/20 shadow-lg p-4 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-violet-800 dark:text-violet-200 mb-2">Filter by Project</label>
              <select
                className="w-full border border-violet-200/50 dark:border-violet-500/30 rounded-lg px-3 py-2 text-sm bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent transition-all"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="">All Projects</option>
                {uniqueProjectNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-violet-800 dark:text-violet-200 mb-2">Filter by Status</label>
              <select
                className="w-full border border-violet-200/50 dark:border-violet-500/30 rounded-lg px-3 py-2 text-sm bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent transition-all"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-violet-800 dark:text-violet-200 mb-2">Filter by Priority</label>
              <select
                className="w-full border border-violet-200/50 dark:border-violet-500/30 rounded-lg px-3 py-2 text-sm bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent transition-all"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                {uniquePriorities.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setProjectFilter("");
                  setStatusFilter("");
                  setPriorityFilter("");
                }}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 text-white px-4 py-2 rounded-lg hover:from-violet-600 hover:to-purple-700 dark:hover:from-violet-700 dark:hover:to-purple-800 transition-all duration-200 font-medium text-sm"
              >
                🔄 Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Table - Mobile Responsive */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-violet-200/50 dark:border-violet-500/20 shadow-lg overflow-hidden">
          {/* Mobile Cards View */}
          <div className="lg:hidden">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="p-4 border-b border-violet-200/30 dark:border-violet-500/20 last:border-b-0">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-200 mb-1">{ticket.title}</h3>
                    <span className="text-xs font-mono px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-400">
                      {ticket.projectTicketId}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{ticket.description}</p>
                
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400 mb-3">
                  <div>
                    <span className="font-medium">Due Date:</span>
                    <span className={isPastDue(ticket.dueDate) ? "text-red-600 dark:text-red-400 font-semibold ml-1" : "ml-1"}>
                      {ticket.dueDate || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Project:</span>
                    <span className="ml-1">{projectsMap[ticket.projectId] || ticket.projectId}</span>
                  </div>
                  <div>
                    <span className="font-medium">Created By:</span>
                    <span className="ml-1">{usersMap[ticket.createdById || ticket.created_by] || ticket.createdByName || 'Unknown User'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Team Lead:</span>
                    <span className="ml-1">{teamLeadMap[ticket.teamLeadId] || usersMap[ticket.teamLeadId] || 'Unknown User'}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    className={`flex-1 text-xs px-2 py-1 rounded border ${getReviewColor(ticket.review)} focus:outline-none focus:ring-1 focus:ring-violet-400`}
                    value={ticket.review || ""}
                    onChange={(e) => handleReviewChange(ticket.id, e.target.value)}
                  >
                    <option value="">Select Review</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                  <button
                    className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    onClick={() => handleEditClick(ticket)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    onClick={() => handleDelete(ticket.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-violet-100/80 to-purple-100/80 dark:from-violet-800/50 dark:to-purple-700/50 text-sm text-left">
                  <th className="p-3 font-semibold text-violet-800 dark:text-violet-200">🆔 Ticket ID</th>
                  <th className="p-3 font-semibold text-violet-800 dark:text-violet-200">📝 Title</th>
                  <th className="p-3 font-semibold text-violet-800 dark:text-violet-200">📄 Description</th>
                  <th className="p-3 font-semibold text-violet-800 dark:text-violet-200">⚡ Priority</th>
                  <th className="p-3 font-semibold text-violet-800 dark:text-violet-200">📊 Status</th>
                  <th className="p-3 font-semibold text-violet-800 dark:text-violet-200">📅 Due Date</th>
                  <th className="p-3 font-semibold text-violet-800 dark:text-violet-200">🏢 Project</th>
                  <th className="p-3 font-semibold text-violet-800 dark:text-violet-200">👤 Created By</th>
                  <th className="p-3 font-semibold text-violet-800 dark:text-violet-200">🕒 Created At</th>
                  <th className="p-3 font-semibold text-violet-800 dark:text-violet-200">👥 Team Lead</th>
                  <th className="p-3 font-semibold text-violet-800 dark:text-violet-200">📋 Review</th>
                  <th className="p-3 font-semibold text-violet-800 dark:text-violet-200">⚙️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket, index) => (
                  <tr key={ticket.id} className={`border-t border-violet-200/30 dark:border-violet-500/20 text-sm hover:bg-violet-50/50 dark:hover:bg-violet-900/20 transition-colors ${
                    index % 2 === 0 ? 'bg-white/50 dark:bg-slate-800/30' : 'bg-violet-50/30 dark:bg-slate-900/30'
                  }`}>
                    <td className="p-3">
                      <span className="font-mono text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                        {ticket.projectTicketId}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="font-medium text-slate-900 dark:text-slate-200 truncate" title={ticket.title}>
                        {ticket.title}
                      </div>
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="text-slate-600 dark:text-slate-400 truncate" title={ticket.description}>
                        {ticket.description}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className={`p-3 ${isPastDue(ticket.dueDate) ? "text-red-600 dark:text-red-400 font-semibold" : "text-slate-600 dark:text-slate-400"}`}>
                      {ticket.dueDate || "N/A"}
                    </td>
                    <td className="p-3">
                      <span className="text-violet-600 dark:text-violet-400 font-medium">
                        {projectsMap[ticket.projectId] || ticket.projectId}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{usersMap[ticket.createdById || ticket.created_by] || ticket.createdByName || 'Unknown User'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {ticket.createdAt?.seconds
                        ? format(
                            new Date(ticket.createdAt.seconds * 1000),
                            "yyyy-MM-dd HH:mm"
                          )
                        : "N/A"}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {teamLeadMap[ticket.teamLeadId] || usersMap[ticket.teamLeadId] || 'Unknown User'}
                    </td>
                    <td className="p-3">
                      <select
                        className={`border px-2 py-1 w-full rounded text-xs ${getReviewColor(ticket.review)} focus:outline-none focus:ring-1 focus:ring-violet-400`}
                        value={ticket.review || ""}
                        onChange={(e) => handleReviewChange(ticket.id, e.target.value)}
                      >
                        <option value="">Select Review</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </td>
                    <td className="p-3 space-x-2">
                      <button
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm font-medium"
                        onClick={() => handleEditClick(ticket)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm font-medium"
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

          {filteredTickets.length === 0 && (
            <div className="p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-violet-800 dark:text-violet-200 mb-3">
                🎫 No Tickets Found
              </h2>
              <p className="text-violet-600/70 dark:text-violet-300/70 text-lg">
                No tickets match the current filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-6 rounded-2xl w-full max-w-md shadow-2xl border border-violet-200/50 dark:border-violet-500/20">
            <h2 className="text-xl font-bold text-violet-800 dark:text-violet-200 mb-6">✏️ Edit Ticket</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-violet-700 dark:text-violet-300 mb-2">Title</label>
                <input
                  type="text"
                  className="w-full border border-violet-200/50 dark:border-violet-500/30 rounded-lg px-3 py-2 text-sm bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent transition-all"
                  value={editValues.title}
                  onChange={(e) =>
                    setEditValues((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-violet-700 dark:text-violet-300 mb-2">Description</label>
                <textarea
                  rows={3}
                  className="w-full border border-violet-200/50 dark:border-violet-500/30 rounded-lg px-3 py-2 text-sm bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent transition-all resize-none"
                  value={editValues.description}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-violet-700 dark:text-violet-300 mb-2">Due Date</label>
                <input
                  type="date"
                  className="w-full border border-violet-200/50 dark:border-violet-500/30 rounded-lg px-3 py-2 text-sm bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent transition-all"
                  value={editValues.dueDate}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-violet-700 dark:text-violet-300 mb-2">Priority</label>
                <select
                  className="w-full border border-violet-200/50 dark:border-violet-500/30 rounded-lg px-3 py-2 text-sm bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent transition-all"
                  value={editValues.priority}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                >
                  <option value="">Select Priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                onClick={() => setEditingTicket(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 dark:hover:from-violet-700 dark:hover:to-purple-800 transition-all duration-200 font-medium"
                onClick={handleEditSave}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewTickets;
