import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import { PlusCircle, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  deadline: string;
  teamId: string;
  created_by: string;
  created_at: any;
}

function Projects() {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [sortBy, setSortBy] = useState<"deadline" | "status">("deadline");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    deadline: "",
    teamId: "",
  });
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: projects = [] } = useQuery("projects", async () => {
    const q = query(
      collection(db, "projects"),
      where("created_by", "==", user?.uid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  });

  const { data: teams = [] } = useQuery("teams", async () => {
    const snap = await getDocs(collection(db, "teams"));
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  });

  const { data: employees = [] } = useQuery("employees", async () => {
    const snap = await getDocs(collection(db, "employees"));
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  });

  const getEmployeeName = (id: string) =>
    employees.find((e: any) => e.id === id)?.name || id;

  const getEmployeeNameById = (uid: string) =>
    employees.find((e: any) => e.id === uid)?.name || "Unknown";

  const createProject = useMutation(
    async (data: typeof formData) => {
      await addDoc(collection(db, "projects"), {
        ...data,
        created_by: user?.uid,
        created_at: serverTimestamp(),
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("projects");
        toast.success("Project created");
        setShowModal(false);
      },
    }
  );

  const updateProject = useMutation(
    async ({ id, data }: { id: string; data: Partial<Project> }) => {
      await updateDoc(doc(db, "projects", id), data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("projects");
        toast.success("Project updated");
        setShowModal(false);
      },
    }
  );

  const deleteProject = useMutation(
    async (id: string) => {
      await deleteDoc(doc(db, "projects", id));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("projects");
        toast.success("Project deleted");
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      updateProject.mutate({ id: editingProject.id, data: formData });
    } else {
      createProject.mutate(formData);
    }
  };

  const sortedProjects = [...projects]
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a: any, b: any) => {
      if (sortBy === "deadline") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="h-full bg-gradient-to-br from-cyan-100/95 to-orange-100/95 dark:bg-gradient-to-br dark:from-black/95 dark:to-black/90 p-6">
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-purple-100">Projects</h1>
          <input
            type="text"
            placeholder="Search Projects..."
            className="mt-2 border border-gray-200 dark:border-purple-500/30 px-3 py-2 rounded-lg bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100 placeholder:dark:text-purple-300/70 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm dark:shadow-purple-500/20 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 items-end">
          <select
            className="border border-gray-200 dark:border-purple-500/30 px-3 py-2 rounded-lg bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "deadline" | "status")}
          >
            <option value="deadline">Sort by Deadline</option>
            <option value="status">Sort by Name</option>
          </select>
          <button
            className="flex items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg transform hover:scale-105"
            onClick={() => {
              setEditingProject(null);
              setFormData({
                name: "",
                description: "",
                startDate: "",
                deadline: "",
                teamId: "",
              });
              setShowModal(true);
            }}
          >
            <PlusCircle className="mr-2" /> New Project
          </button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {sortedProjects.map((project: any) => {
          const team = teams.find((t) => t.id === project.teamId);
          return (
            <div key={project.id} className="liquid-glass-card group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <h2 className="font-semibold text-lg text-gray-900 dark:text-purple-100">{project.name}</h2>
              <p className="text-sm text-gray-500 dark:text-purple-300/80">{project.description}</p>
              <p className="text-sm text-gray-500 dark:text-purple-300/80 mt-1">
                Team: {team?.teamName || "N/A"}
              </p>
              {team?.members && (
                <ul className="text-xs text-gray-500 dark:text-purple-300/70 list-disc ml-4 mt-1 max-h-20 overflow-auto custom-scrollbar">
                  {team.members.map((member: string, idx: number) => (
                    <li key={idx}>{getEmployeeName(member)}</li>
                  ))}
                </ul>
              )}
              <p className="text-sm text-gray-500 dark:text-purple-300/80">
                Start: {project.startDate}
              </p>
              <p className="text-sm text-gray-500 dark:text-purple-300/80">
                Deadline: {project.deadline}
              </p>
              <p className="text-xs text-gray-400 dark:text-purple-300/60 mt-1">
                Created by: {getEmployeeNameById(project.created_by)}
              </p>
              <div className="mt-3 flex justify-end space-x-2">
                {project.created_by === user?.uid && (
                  <>
                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setFormData({
                          name: project.name,
                          description: project.description,
                          startDate: project.startDate,
                          deadline: project.deadline,
                          teamId: project.teamId,
                        });
                        setShowModal(true);
                      }}
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors p-2 rounded hover:bg-purple-100 dark:hover:bg-purple-500/20"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProject.mutate(project.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors p-2 rounded hover:bg-red-100 dark:hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="liquid-glass-card max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-purple-100">
              {editingProject ? "Edit Project" : "Create Project"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-purple-100">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-purple-500/30 bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-purple-100">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-purple-500/30 bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-purple-100">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-purple-500/30 bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-purple-100">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-purple-500/30 bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-purple-100">
                  Assign to Team
                </label>
                <select
                  value={formData.teamId}
                  onChange={(e) =>
                    setFormData({ ...formData, teamId: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-purple-500/30 bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select team</option>
                  {teams.map((team: any) => (
                    <option key={team.id} value={team.id}>
                      {team.teamName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-purple-500/30 bg-white dark:bg-black/50 text-gray-900 dark:text-purple-100 rounded-lg hover:bg-gray-50 dark:hover:bg-purple-500/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  {editingProject ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
