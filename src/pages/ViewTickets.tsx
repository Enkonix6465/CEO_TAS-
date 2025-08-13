import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { format } from "date-fns";

const ViewTicket = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [projectMap, setProjectMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  // Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch project names
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!db) throw new Error("Firestore is not initialized");
        const projectSnap = await getDocs(collection(db, "projects"));
        const map: { [key: string]: string } = {};
        projectSnap.forEach((docSnap) => {
          const data = docSnap.data();
          map[docSnap.id] = data.name || "Unnamed Project";
        });
        setProjectMap(map);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, []);

  // Fetch and filter tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        if (!db) throw new Error("Firestore is not initialized");

        console.log("Fetching tickets for user:", userId);

        // Try multiple collection names that might contain tickets
        const collectionNames = ["raiseTickets", "tickets", "projectTickets"];
        let allTickets: any[] = [];

        for (const collectionName of collectionNames) {
          try {
            const ticketSnap = await getDocs(collection(db, collectionName));
            const collectionTickets: any[] = [];
            ticketSnap.forEach((docSnap) => {
              const ticketData = { id: docSnap.id, ...docSnap.data(), _collection: collectionName };
              collectionTickets.push(ticketData);
            });
            allTickets = [...allTickets, ...collectionTickets];
            console.log(`Found ${collectionTickets.length} tickets in ${collectionName}`);
          } catch (collectionError) {
            console.warn(`Error fetching from ${collectionName}:`, collectionError);
          }
        }

        console.log("Total tickets found:", allTickets.length);

        if (userId && allTickets.length > 0) {
          // More flexible filtering - check multiple possible fields
          const filtered = allTickets.filter((ticket) => {
            return ticket.teamLeadId === userId ||
                   ticket.assigned_to === userId ||
                   ticket.assignee === userId ||
                   ticket.created_by === userId ||
                   ticket.teamLead === userId;
          });

          console.log("Filtered tickets for user:", filtered.length);
          setTickets(filtered);
        } else {
          // If no user ID or no tickets found, show all tickets for debugging
          console.log("No user ID or no tickets found, showing all tickets");
          setTickets(allTickets);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setLoading(false);
      }
    };

    if (userId) {
      fetchTickets();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      if (!db) throw new Error("Firestore is not initialized");
      const ticketRef = doc(db, "raiseTickets", id);
      await updateDoc(ticketRef, {
        status: newStatus,
      });
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === id ? { ...ticket, status: newStatus } : ticket
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading || userId === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 dark:border-violet-400 border-t-violet-600 dark:border-t-violet-300 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-violet-600 dark:bg-violet-500 rounded-full"></div>
            </div>
          </div>
          <p className="text-violet-600 dark:text-violet-400 font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-violet-800 dark:text-violet-200 mb-3">
            🎫 No Tickets Found
          </h2>
          <p className="text-violet-600/70 dark:text-violet-300/70 text-lg mb-4">
            No tickets are currently assigned to you.
          </p>
          <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
            <p className="mb-2"><strong>Debug Info:</strong></p>
            <p>User ID: {userId || 'Not authenticated'}</p>
            <p>Check the browser console for more details.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 p-6 overflow-auto">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-violet-200/20 to-purple-200/20 dark:from-violet-900/10 dark:to-purple-900/10 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-violet-200/20 dark:from-indigo-900/10 dark:to-violet-900/10 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-500 dark:to-indigo-500 bg-clip-text text-transparent mb-2">
            🎫 View & Manage Tickets
          </h1>
          <p className="text-violet-600/70 dark:text-violet-300/70">
            Monitor and update tickets assigned to your team
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-violet-600/70 dark:text-violet-300/70">
            <span className="px-3 py-1 bg-violet-100/80 dark:bg-violet-600/30 text-violet-700 dark:text-violet-300 rounded-full font-medium">
              {tickets.length} tickets assigned
            </span>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-blue-100/80 dark:bg-blue-600/30 text-blue-700 dark:text-blue-300 rounded-full font-medium hover:bg-blue-200/80 dark:hover:bg-blue-600/50 transition-colors text-xs"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-violet-200/50 dark:border-violet-500/20 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-violet-100/80 to-purple-100/80 dark:from-violet-800/50 dark:to-purple-700/50 text-sm text-left">
                  <th className="p-4 font-semibold text-violet-800 dark:text-violet-200">🆔 Ticket ID</th>
                  <th className="p-4 font-semibold text-violet-800 dark:text-violet-200">📝 Title</th>
                  <th className="p-4 font-semibold text-violet-800 dark:text-violet-200">📄 Description</th>
                  <th className="p-4 font-semibold text-violet-800 dark:text-violet-200">⚡ Priority</th>
                  <th className="p-4 font-semibold text-violet-800 dark:text-violet-200">📅 Due Date</th>
                  <th className="p-4 font-semibold text-violet-800 dark:text-violet-200">📊 Status</th>
                  <th className="p-4 font-semibold text-violet-800 dark:text-violet-200">📋 Review</th>
                  <th className="p-4 font-semibold text-violet-800 dark:text-violet-200">🏢 Project</th>
                  <th className="p-4 font-semibold text-violet-800 dark:text-violet-200">👤 Created By</th>
                  <th className="p-4 font-semibold text-violet-800 dark:text-violet-200">🕒 Created At</th>
                  <th className="p-4 font-semibold text-violet-800 dark:text-violet-200">⚙️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket, index) => {
                  const getPriorityColor = (priority: string) => {
                    switch(priority?.toLowerCase()) {
                      case 'high': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
                      case 'medium': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
                      case 'low': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
                      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
                    }
                  };

                  const getStatusColor = (status: string) => {
                    switch(status?.toLowerCase()) {
                      case 'done': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
                      case 'in progress': return 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300';
                      case 'pending': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
                      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
                    }
                  };

                  return (
                    <tr key={ticket.id} className={`border-t border-violet-200/30 dark:border-violet-500/20 text-sm hover:bg-violet-50/50 dark:hover:bg-violet-900/20 transition-colors ${
                      index % 2 === 0 ? 'bg-white/50 dark:bg-slate-800/30' : 'bg-violet-50/30 dark:bg-slate-900/30'
                    }`}>
                      <td className="p-4">
                        <span className="font-mono text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                          {ticket.projectTicketId}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-900 dark:text-slate-200">
                          {ticket.title}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-600 dark:text-slate-400 max-w-xs truncate" title={ticket.description}>
                          {ticket.description}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{ticket.dueDate}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{ticket.review || "—"}</td>
                      <td className="p-4">
                        <span className="text-violet-600 dark:text-violet-400 font-medium">
                          {projectMap[ticket.projectId] || "Loading..."}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{ticket.createdByName}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {ticket.createdAt?.seconds
                          ? format(
                              new Date(ticket.createdAt.seconds * 1000),
                              "dd MMM yyyy, hh:mm a"
                            )
                          : "N/A"}
                      </td>
                      <td className="p-4">
                        <select
                          className="border border-violet-200/50 dark:border-violet-500/30 rounded-lg px-3 py-2 text-sm bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-transparent transition-all"
                          value={ticket.status}
                          onChange={(e) =>
                            handleStatusChange(ticket.id, e.target.value)
                          }
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTicket;
