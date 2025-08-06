import React, { useState, useEffect } from "react";
import { useMutation } from "react-query";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";

function Projects() {
  const [taskForms, setTaskForms] = useState({});
  const [selectedTeamMembers, setSelectedTeamMembers] = useState({});
  const [projectTasks, setProjectTasks] = useState({});
  const [expandedProject, setExpandedProject] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editedTask, setEditedTask] = useState({});

  const { user } = useAuthStore();

  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Setup real-time listeners
    const teamsUnsub = onSnapshot(
      collection(db, "teams"),
      (snapshot) => {
        setTeams(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.warn("Teams listener error:", error);
      }
    );

    const employeesUnsub = onSnapshot(
      collection(db, "employees"),
      (snapshot) => {
        setEmployees(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.warn("Employees listener error:", error);
      }
    );

    // Projects listener with user filter
    let projectsUnsub;
    if (user?.uid) {
      const q = query(
        collection(db, "projects"),
        where("created_by", "==", user.uid)
      );
      projectsUnsub = onSnapshot(
        q,
        (snapshot) => {
          setProjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        },
        (error) => {
          console.warn("Projects listener error:", error);
        }
      );
    }

    return () => {
      teamsUnsub();
      employeesUnsub();
      if (projectsUnsub) projectsUnsub();
    };
  }, [user?.uid]);

  const getEmployeeName = (id) =>
    employees.find((e) => e.id === id)?.name || id;

  const createTask = useMutation(
    async (taskData) => {
      await addDoc(collection(db, "tasks"), taskData);
    },
    {
      onSuccess: () => toast.success("Task(s) assigned successfully"),
      onError: () => toast.error("Failed to assign task"),
    }
  );

  const updateStatus = useMutation(
    async ({ id, status }) => {
      await updateDoc(doc(db, "tasks", id), { status });
    },
    {
      onSuccess: () => toast.success("Task updated"),
      onError: () => toast.error("Failed to update task"),
    }
  );

  useEffect(() => {
    // Setup real-time listeners for project tasks
    const unsubscribers = [];

    projects.forEach((project) => {
      const q = query(
        collection(db, "tasks"),
        where("project_id", "==", project.id)
      );
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          setProjectTasks((prev) => ({
            ...prev,
            [project.id]: snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
          }));
        },
        (error) => {
          console.warn(`Tasks listener error for project ${project.id}:`, error);
        }
      );
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [projects]);

  const getTaskForm = (projectId) => {
    return (
      taskForms[projectId] || {
        title: "",
        description: "",
        dueDate: "",
        assignToAll: false,
        assignToMember: "",
      }
    );
  };

  const updateTaskForm = (projectId, field, value) => {
    setTaskForms((prev) => ({
      ...prev,
      [projectId]: {
        ...getTaskForm(projectId),
        [field]: value,
      },
    }));
  };

  const handleAssignTask = async (projectId, teamId) => {
    const form = getTaskForm(projectId);
    if (!form.title || !form.dueDate)
      return toast.error("Title and Due Date required");

    let members = selectedTeamMembers[teamId];
    if (!members) {
      const teamDoc = await getDoc(doc(db, "teams", teamId));
      const data = teamDoc.data();
      members = data?.members || [];
      setSelectedTeamMembers((prev) => ({ ...prev, [teamId]: members }));
    }

    const commonTask = {
      title: form.title,
      description: form.description,
      due_date: form.dueDate,
      project_id: projectId,
      created_by: user?.uid,
      created_at: serverTimestamp(),
      status: "pending",
      progress_status: "pending",
      progress_description: "",
      progress_link: "",
      progress_updated_at: null,
    };

    if (form.assignToAll) {
      members.forEach((memberId) => {
        createTask.mutate({ ...commonTask, assigned_to: memberId });
      });
    } else if (form.assignToMember) {
      createTask.mutate({ ...commonTask, assigned_to: form.assignToMember });
    } else {
      toast.error("Select member or choose assign to all");
    }

    setTaskForms((prev) => ({
      ...prev,
      [projectId]: {
        title: "",
        description: "",
        dueDate: "",
        assignToAll: false,
        assignToMember: "",
      },
    }));

    getProjectTasks(projectId);
  };

  const handleEditClick = (task) => {
    setEditingTaskId(task.id);
    setEditedTask({
      title: task.title,
      due_date: task.due_date,
      description: task.description,
    });
  };

  const handleEditSave = async (taskId, projectId) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), editedTask);
      toast.success("Task updated");
      setEditingTaskId(null);
      getProjectTasks(projectId);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (taskId, projectId) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      toast.success("Task deleted");
      getProjectTasks(projectId);
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-cyan-100/95 to-orange-100/95 dark:bg-gradient-to-br dark:from-black/95 dark:to-black/90 p-4 space-y-6">
      {teams.map((team) => {
        const teamProjects = projects.filter((p) => p.teamId === team.id);

        return (
          <div key={team.id} className="liquid-glass-card">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-purple-100">
              Team: {team.teamName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-purple-300/80 mb-3">
              Members: {team.members.map(getEmployeeName).join(", ")}
            </p>
            {teamProjects.map((project) => {
              const form = getTaskForm(project.id);
              const tasks = projectTasks[project.id] || [];

              return (
                <div key={project.id} className="mb-6 border-t border-gray-200 dark:border-purple-500/20 pt-4">
                  <h3
                    className="text-lg font-semibold cursor-pointer hover:underline text-gray-900 dark:text-purple-100 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                    onClick={() =>
                      setExpandedProject((p) =>
                        p === project.id ? null : project.id
                      )
                    }
                  >
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-purple-300/80">{project.description}</p>
                  {expandedProject === project.id && (
                    <>
                      <div className="mt-3 grid gap-2">
                        <input
                          placeholder="Task Title"
                          value={form.title}
                          onChange={(e) =>
                            updateTaskForm(project.id, "title", e.target.value)
                          }
                          className="border border-gray-200 dark:border-purple-500/30 p-3 rounded-lg bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100 placeholder:dark:text-purple-300/70 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm dark:shadow-purple-500/20"
                        />
                        <textarea
                          placeholder="Task Description"
                          value={form.description}
                          onChange={(e) =>
                            updateTaskForm(
                              project.id,
                              "description",
                              e.target.value
                            )
                          }
                          className="border p-2 rounded"
                        />
                        <input
                          type="date"
                          value={form.dueDate}
                          onChange={(e) =>
                            updateTaskForm(
                              project.id,
                              "dueDate",
                              e.target.value
                            )
                          }
                          className="border p-2 rounded"
                        />
                        <label className="flex gap-2 items-center">
                          <input
                            type="checkbox"
                            checked={form.assignToAll}
                            onChange={() =>
                              updateTaskForm(
                                project.id,
                                "assignToAll",
                                !form.assignToAll
                              )
                            }
                          />
                          Assign to all
                        </label>
                        {!form.assignToAll && (
                          <select
                            value={form.assignToMember}
                            onChange={(e) =>
                              updateTaskForm(
                                project.id,
                                "assignToMember",
                                e.target.value
                              )
                            }
                            className="border p-2 rounded"
                          >
                            <option value="">Select Member</option>
                            {team.members.map((id) => (
                              <option key={id} value={id}>
                                {getEmployeeName(id)}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          onClick={() => handleAssignTask(project.id, team.id)}
                          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                        >
                          Assign Task
                        </button>
                      </div>
                      {tasks.length > 0 && (
                        <div className="overflow-x-auto mt-5">
                          <table className="w-full text-sm border border-gray-300 rounded">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2 border">Title</th>
                                <th className="p-2 border">Assigned To</th>
                                <th className="p-2 border">Due Date</th>
                                <th className="p-2 border">Status</th>
                                <th className="p-2 border">Progress</th>
                                <th className="p-2 border">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tasks.map((task) => {
                                const isOverdue =
                                  new Date(task.due_date) < new Date();
                                const isEditing = editingTaskId === task.id;

                                return (
                                  <tr key={task.id}>
                                    <td className="p-2 border">
                                      {isEditing ? (
                                        <input
                                          className="border p-1 w-full"
                                          value={editedTask.title}
                                          onChange={(e) =>
                                            setEditedTask((prev) => ({
                                              ...prev,
                                              title: e.target.value,
                                            }))
                                          }
                                        />
                                      ) : (
                                        task.title
                                      )}
                                    </td>
                                    <td className="p-2 border">
                                      {getEmployeeName(task.assigned_to)}
                                    </td>
                                    <td
                                      className={`p-2 border ${
                                        isOverdue
                                          ? "text-red-600 font-semibold"
                                          : ""
                                      }`}
                                    >
                                      {isEditing ? (
                                        <input
                                          type="date"
                                          className="border p-1"
                                          value={editedTask.due_date}
                                          onChange={(e) =>
                                            setEditedTask((prev) => ({
                                              ...prev,
                                              due_date: e.target.value,
                                            }))
                                          }
                                        />
                                      ) : (
                                        task.due_date
                                      )}
                                    </td>
                                    <td className="p-2 border">
                                      <select
                                        value={task.status}
                                        onChange={(e) =>
                                          updateStatus.mutate({
                                            id: task.id,
                                            status: e.target.value,
                                          })
                                        }
                                        className="text-sm border rounded px-1"
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">
                                          In Progress
                                        </option>
                                        <option value="completed">
                                          Completed
                                        </option>
                                        <option value="overdue">Overdue</option>
                                      </select>
                                    </td>
                                    <td className="p-2 border text-xs">
                                      {task.progress_status || (
                                        <span className="italic text-gray-400">
                                          Not submitted
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-2 border text-center flex gap-2 items-center justify-center">
                                      {isEditing ? (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleEditSave(
                                                task.id,
                                                project.id
                                              )
                                            }
                                            className="text-green-600 font-medium hover:underline"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() =>
                                              setEditingTaskId(null)
                                            }
                                            className="text-gray-500 hover:underline"
                                          >
                                            Cancel
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <Pencil
                                            onClick={() =>
                                              handleEditClick(task)
                                            }
                                            className="text-blue-500 cursor-pointer hover:text-blue-700"
                                            size={18}
                                          />
                                          <Trash2
                                            onClick={() =>
                                              handleDelete(task.id, project.id)
                                            }
                                            className="text-red-500 cursor-pointer hover:text-red-700"
                                            size={18}
                                          />
                                        </>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default Projects;
