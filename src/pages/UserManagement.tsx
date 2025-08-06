import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export default function ProjectTasksViewer() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [employeesMap, setEmployeesMap] = useState({});

  // Fetch all projects
  useEffect(() => {
    const fetchProjects = async () => {
      const snap = await getDocs(collection(db, "projects"));
      const projectData = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectData);
    };
    fetchProjects();
  }, []);

  // Fetch employees for name mapping
  useEffect(() => {
    const fetchEmployees = async () => {
      const snap = await getDocs(collection(db, "employees"));
      const empMap = {};
      snap.docs.forEach((doc) => {
        const { name } = doc.data();
        empMap[doc.id] = name;
      });
      setEmployeesMap(empMap);
    };
    fetchEmployees();
  }, []);

  // Fetch tasks when project selected
  useEffect(() => {
    if (!selectedProjectId) return;
    const fetchTasks = async () => {
      const q = query(
        collection(db, "tasks"),
        where("project_id", "==", selectedProjectId)
      );
      const snap = await getDocs(q);
      const taskList = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(taskList);
    };
    fetchTasks();
  }, [selectedProjectId]);

  const getStatusColor = (status, dueDate) => {
    if (status === "completed") return "text-green-600 dark:text-green-400 font-semibold";
    const due = new Date(dueDate);
    const now = new Date();
    if (due < now) return "text-red-600 dark:text-red-400 font-semibold";
    return "text-gray-800 dark:text-purple-200";
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-purple-900/80 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Project</h2>
      <div className="flex flex-wrap gap-3">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => setSelectedProjectId(project.id)}
            className={`px-4 py-2 rounded shadow transition-colors ${
              selectedProjectId === project.id
                ? "bg-purple-600 text-white"
                : "bg-gray-200 dark:bg-purple-800 text-black dark:text-purple-100 hover:bg-gray-300 dark:hover:bg-purple-700"
            }`}
          >
            {project.name}
          </button>
        ))}
      </div>

      {selectedProjectId && (
        <>
          <h3 className="text-xl font-semibold mt-8 text-gray-900 dark:text-white">
            Tasks for:{" "}
            {projects.find((proj) => proj.id === selectedProjectId)?.name}
          </h3>
          <div className="overflow-x-auto mt-4 bg-white dark:bg-purple-800/60 rounded-lg border border-gray-200 dark:border-purple-500/30">
            <table className="min-w-full border border-gray-200 dark:border-purple-500/30 divide-y divide-gray-300 dark:divide-purple-500/30 text-sm">
              <thead className="bg-gray-100 dark:bg-purple-800/80">
                <tr>
                  <th className="p-2 border border-gray-200 dark:border-purple-500/30 text-gray-900 dark:text-white">#</th>
                  <th className="p-2 border border-gray-200 dark:border-purple-500/30 text-gray-900 dark:text-white">Title</th>
                  <th className="p-2 border border-gray-200 dark:border-purple-500/30 text-gray-900 dark:text-white">Description</th>
                  <th className="p-2 border border-gray-200 dark:border-purple-500/30 text-gray-900 dark:text-white">Status</th>
                  <th className="p-2 border border-gray-200 dark:border-purple-500/30 text-gray-900 dark:text-white">Assigned To</th>
                  <th className="p-2 border border-gray-200 dark:border-purple-500/30 text-gray-900 dark:text-white">Created By</th>
                  <th className="p-2 border border-gray-200 dark:border-purple-500/30 text-gray-900 dark:text-white">Created At</th>
                  <th className="p-2 border border-gray-200 dark:border-purple-500/30 text-gray-900 dark:text-white">Due Date</th>
                  <th className="p-2 border border-gray-200 dark:border-purple-500/30 text-gray-900 dark:text-white">Progress Status</th>
                  <th className="p-2 border border-gray-200 dark:border-purple-500/30 text-gray-900 dark:text-white">Progress Description</th>
                  <th className="p-2 border border-gray-200 dark:border-purple-500/30 text-gray-900 dark:text-white">Progress Link</th>
                  <th className="p-2 border border-gray-200 dark:border-purple-500/30 text-gray-900 dark:text-white">Progress Updated At</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, idx) => (
                  <tr key={task.id} className="text-center hover:bg-gray-50 dark:hover:bg-purple-700/40 transition-colors">
                    <td className="border border-gray-200 dark:border-purple-500/30 p-1 text-gray-900 dark:text-white">{idx + 1}</td>
                    <td className="border border-gray-200 dark:border-purple-500/30 p-1 text-gray-900 dark:text-white">{task.title}</td>
                    <td className="border border-gray-200 dark:border-purple-500/30 p-1 text-gray-900 dark:text-white">{task.description}</td>
                    <td
                      className={`border border-gray-200 dark:border-purple-500/30 p-1 ${getStatusColor(
                        task.status,
                        task.due_date
                      )}`}
                    >
                      {task.status}
                    </td>
                    <td className="border border-gray-200 dark:border-purple-500/30 p-1 text-gray-900 dark:text-white">
                      {employeesMap[task.assigned_to] || task.assigned_to}
                    </td>
                    <td className="border border-gray-200 dark:border-purple-500/30 p-1 text-gray-900 dark:text-white">
                      {employeesMap[task.created_by] || task.created_by}
                    </td>
                    <td className="border border-gray-200 dark:border-purple-500/30 p-1 text-gray-900 dark:text-white">
                      {new Date(
                        task.created_at?.seconds * 1000
                      ).toLocaleString()}
                    </td>
                    <td className="border border-gray-200 dark:border-purple-500/30 p-1 text-gray-900 dark:text-white">{task.due_date}</td>
                    <td className="border border-gray-200 dark:border-purple-500/30 p-1 text-gray-900 dark:text-white">{task.progress_status}</td>
                    <td className="border border-gray-200 dark:border-purple-500/30 p-1 text-gray-900 dark:text-white">
                      {task.progress_description || "-"}
                    </td>
                    <td className="border border-gray-200 dark:border-purple-500/30 p-1 text-gray-900 dark:text-white">
                      {task.progress_link ? (
                        <a
                          href={task.progress_link}
                          className="text-blue-600 dark:text-purple-300 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Link
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="border border-gray-200 dark:border-purple-500/30 p-1 text-gray-900 dark:text-white">
                      {task.progress_updated_at
                        ? new Date(
                            task.progress_updated_at?.seconds * 1000
                          ).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
