import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { db } from "../lib/firebase";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function RaiseProjectTicket() {
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [projects, setProjects] = useState<Array<any>>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectDetails, setProjectDetails] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, [auth]);

  // Fetch all projects
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "projects"));
        setProjects(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      } catch (e) {
        console.error(e);
        toast.error("Failed to load projects");
      }
    })();
  }, []);

  // Fetch selected project details
  useEffect(() => {
    if (!selectedProjectId) {
      setProjectDetails(null);
      return;
    }
    (async () => {
      try {
        const ref = doc(db, "projects", selectedProjectId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProjectDetails({ id: snap.id, ...snap.data() });
        } else {
          toast.error("Project not found");
        }
      } catch (e) {
        console.error(e);
        toast.error("Error loading project details");
      }
    })();
  }, [selectedProjectId]);

  // Submit ticket
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("You must be signed in to raise a ticket.");
      return;
    }
    if (!title || !description || !dueDate || !selectedProjectId) {
      toast.error("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      // Extract initials from project name (e.g., "Exam Portal" -> "EP")
      const initials =
        projectDetails?.name
          ?.split(" ")
          .map((word) => word[0]?.toUpperCase())
          .join("") || "XX";

      // Fetch existing tickets with the same projectTicketId prefix
      const ticketSnap = await getDocs(collection(db, "raiseTickets"));
      const matchingTickets = ticketSnap.docs.filter((doc) =>
        doc.data().projectTicketId?.startsWith(initials + "-")
      );

      // Determine next sequence number
      const sequenceNumber = matchingTickets.length + 1;
      const projectTicketId = `${initials}-${sequenceNumber}`;

      // Create the ticket
      const docRef = await addDoc(collection(db, "raiseTickets"), {
        title,
        description,
        priority,
        status: "Pending",
        dueDate,
        createdAt: serverTimestamp(),
        createdById: currentUser.uid,
        createdByName:
          currentUser.displayName || currentUser.email || "Unknown",
        projectId: selectedProjectId,
        teamLeadId: projectDetails?.created_by || null,
        comments: [],
        review: "",
        projectTicketId, // ✅ include the custom ticket id
      });

      // Now update the ticket with its auto-generated ID
      await updateDoc(doc(db, "raiseTickets", docRef.id), {
        ticketId: docRef.id,
      });

      toast.success("Ticket raised successfully.");

      // reset form
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setDueDate("");
      setSelectedProjectId("");
      setProjectDetails(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to raise ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 p-6">
      <motion.div
        className="max-w-3xl mx-auto liquid-glass-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-purple-100">Raise Project Ticket</h2>

        {/* Project Selector */}
        <div className="mb-4">
          <label className="block font-medium text-gray-900 dark:text-purple-100">Select Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full border border-gray-200 dark:border-purple-500/30 px-3 py-2 rounded mt-1 bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100"
          >
            <option value="">-- Select a project --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project Details Preview */}
        {projectDetails && (
          <div className="mb-4 p-4 border border-purple-200 dark:border-purple-500/30 rounded bg-purple-50 dark:bg-black/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-purple-100">{projectDetails.name}</h3>
            <p className="text-gray-700 dark:text-purple-300/80">{projectDetails.description}</p>
            {projectDetails.deadline && (
              <p className="text-sm text-gray-500 dark:text-purple-300/70">
                Deadline: {projectDetails.deadline}
              </p>
            )}
          </div>
        )}

        {/* Ticket Form */}
        {selectedProjectId && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-900 dark:text-purple-100">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-200 dark:border-purple-500/30 px-3 py-2 rounded mt-1 bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-gray-900 dark:text-purple-100">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-200 dark:border-purple-500/30 px-3 py-2 rounded mt-1 bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block font-medium text-gray-900 dark:text-purple-100">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-gray-200 dark:border-purple-500/30 px-3 py-2 rounded mt-1 bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-900 dark:text-purple-100">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-200 dark:border-purple-500/30 px-3 py-2 rounded mt-1 bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg"
            >
              {loading ? "Submitting..." : "Raise Ticket"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
