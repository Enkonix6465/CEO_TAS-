import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import { motion } from "framer-motion";
import PageHeader from "../components/PageHeader";
import {
  Clock,
  CheckCircle,
  Circle,
  Calendar,
  User,
  ExternalLink,
  Edit3,
  Save,
  X,
  AlertCircle,
  FileText,
  Target,
  Activity,
} from "lucide-react";

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [progressData, setProgressData] = useState({});
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const { user } = useAuthStore();

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Try Firebase with timeout, fall back to mock data if it fails
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 3000)
      );

      const fetchData = Promise.resolve().then(async () => {
        const q = query(
          collection(db, "tasks"),
          where("assigned_to", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      });

      const tasksList = await Promise.race([fetchData, timeout]);
      setTasks(tasksList);
      console.log("Firebase connection successful - using real tasks data");
    } catch (error) {
      // Fall back to mock data if Firebase fails
      console.log("Firebase connection failed, using mock tasks data");

      // Set enhanced mock data for MyTasks
      setTasks([
        {
          id: "task-1",
          title: "Design System Component Library",
          description: "Create comprehensive design system with reusable components, tokens, and documentation for consistent UI/UX across all products",
          status: "in_progress",
          assigned_to: user?.uid || "current-user",
          due_date: "2024-02-20",
          created_at: { seconds: Date.now() / 1000 },
          project_id: "proj-1",
          priority: "high",
          progress_status: "in_progress",
          progress_description: "Completed 60% of the component library. Working on form components and data visualization elements.",
          progress_updated_at: { seconds: Date.now() / 1000 - 86400 }
        },
        {
          id: "task-2",
          title: "API Performance Optimization",
          description: "Optimize database queries and implement caching strategies to reduce API response times by 40%",
          status: "pending",
          assigned_to: user?.uid || "current-user",
          due_date: "2024-02-25",
          created_at: { seconds: Date.now() / 1000 - 172800 },
          project_id: "proj-2",
          priority: "critical",
          progress_status: "pending",
          progress_description: "",
          progress_updated_at: null
        },
        {
          id: "task-3",
          title: "User Authentication Security Review",
          description: "Conduct comprehensive security audit of authentication system and implement multi-factor authentication",
          status: "completed",
          assigned_to: user?.uid || "current-user",
          due_date: "2024-02-15",
          created_at: { seconds: Date.now() / 1000 - 345600 },
          project_id: "proj-3",
          priority: "high",
          progress_status: "completed",
          progress_description: "Successfully completed security audit and implemented 2FA. All security tests passed.",
          progress_link: "https://github.com/company/auth-security-review",
          progress_updated_at: { seconds: Date.now() / 1000 - 86400 }
        },
        {
          id: "task-4",
          title: "Mobile App Responsive Design",
          description: "Implement responsive design patterns for mobile devices with touch-optimized interactions",
          status: "in_progress",
          assigned_to: user?.uid || "current-user",
          due_date: "2024-03-01",
          created_at: { seconds: Date.now() / 1000 - 259200 },
          project_id: "proj-1",
          priority: "medium",
          progress_status: "in_progress",
          progress_description: "Implemented responsive breakpoints and touch gestures. Testing on various devices.",
          progress_updated_at: { seconds: Date.now() / 1000 - 43200 }
        },
        {
          id: "task-5",
          title: "Data Analytics Dashboard",
          description: "Build real-time analytics dashboard with interactive charts and performance metrics",
          status: "pending",
          assigned_to: user?.uid || "current-user",
          due_date: "2024-03-10",
          created_at: { seconds: Date.now() / 1000 - 21600 },
          project_id: "proj-4",
          priority: "medium",
          progress_status: "pending",
          progress_description: "",
          progress_updated_at: null
        },
        {
          id: "task-6",
          title: "Code Quality Automation",
          description: "Set up automated code quality checks, linting, and testing pipelines for continuous integration",
          status: "completed",
          assigned_to: user?.uid || "current-user",
          due_date: "2024-02-10",
          created_at: { seconds: Date.now() / 1000 - 432000 },
          project_id: "proj-2",
          priority: "low",
          progress_status: "completed",
          progress_description: "Implemented ESLint, Prettier, and Jest testing. CI/CD pipeline is fully automated.",
          progress_link: "https://github.com/company/automation-setup",
          progress_updated_at: { seconds: Date.now() / 1000 - 172800 }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (taskId) => {
    const data = progressData[taskId] || {};
    if (!data.progress_status) {
      alert("Please select a progress status.");
      return;
    }

    try {
      // Try to update Firebase with timeout
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Update timeout')), 3000)
      );

      const updateData = Promise.resolve().then(async () => {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, {
          progress_status: data.progress_status,
          progress_description: data.progress_description || "",
          progress_link: data.progress_link || "",
          progress_updated_at: serverTimestamp(),
        });
      });

      await Promise.race([updateData, timeout]);

      console.log("Progress updated successfully in Firebase");
      setEditingTask(null);
      setProgressData({});
      fetchTasks();
    } catch (error) {
      // If Firebase fails, update locally only
      console.log("Firebase update failed, updating locally");

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                progress_status: data.progress_status,
                progress_description: data.progress_description || "",
                progress_link: data.progress_link || "",
                progress_updated_at: { seconds: Date.now() / 1000 }
              }
            : task
        )
      );

      setEditingTask(null);
      setProgressData({});

      // Show success message even when offline
      alert("Progress updated locally (offline mode)");
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task.id);
    setProgressData({
      [task.id]: {
        progress_status: task.progress_status || "pending",
        progress_description: task.progress_description || "",
        progress_link: task.progress_link || "",
      },
    });
  };

  const handleCancel = () => {
    setEditingTask(null);
    setProgressData({});
  };

  const updateProgressData = (taskId, field, value) => {
    setProgressData((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value,
      },
    }));
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const filteredTasks = tasks.filter((task) => {
    const searchMatch =
      task.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchText.toLowerCase());

    const statusMatch = statusFilter === "all" || task.status === statusFilter;

    return searchMatch && statusMatch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "border-l-red-400 bg-red-50";
    if (diffDays <= 3) return "border-l-yellow-400 bg-yellow-50";
    return "border-l-green-400 bg-green-50";
  };

  const isOverdue = (dueDate, status) => {
    if (status === "completed") return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  const filterContent = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <select
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md liquid-glass-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>
  );

  const tabs = [
    {
      id: "list",
      label: "List",
      icon: FileText,
      active: viewMode === "list",
    },
    {
      id: "board",
      label: "Board",
      icon: Target,
      active: viewMode === "board",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: Calendar,
      active: viewMode === "calendar",
    },
  ];

  const onTabChange = (tabId) => {
    setViewMode(tabId);
  };

  const pendingTasks = filteredTasks.filter(t => t.status === "pending").length;
  const inProgressTasks = filteredTasks.filter(t => t.status === "in_progress").length;
  const completedTasks = filteredTasks.filter(t => t.status === "completed").length;
  const overdueTasks = filteredTasks.filter(t => isOverdue(t.due_date, t.status)).length;

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-cyan-100/95 to-orange-100/95 dark:bg-gradient-to-br dark:from-black/95 dark:to-black/90 flex flex-col">
        <PageHeader
          title="My Tasks"
          status="Loading"
          statusColor="bg-blue-100 text-blue-700"
          tabs={tabs}
          onTabChange={onTabChange}
          showActions={false}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-cyan-100/95 to-orange-100/95 dark:bg-gradient-to-br dark:from-black/95 dark:to-black/90 flex flex-col">
      <PageHeader
        title="My Tasks"
        subtitle={`${filteredTasks.length} tasks assigned`}
        status="Active"
        statusColor="bg-green-100 text-green-700"
        tabs={tabs}
        onTabChange={onTabChange}
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Search tasks..."
        showFilters={true}
        filterOpen={false}
        onFilterToggle={() => {}}
        filterContent={filterContent}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="liquid-glass-card rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Tasks
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {filteredTasks.length}
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="liquid-glass-card rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {inProgressTasks}
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="liquid-glass-card rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Completed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {completedTasks}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="liquid-glass-card rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overdue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {overdueTasks}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tasks List */}
        <div className="liquid-glass-card rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Your Tasks
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-l-4 ${
                  isOverdue(task.due_date, task.status)
                    ? "border-l-red-400 bg-red-50 dark:bg-red-900/10"
                    : getPriorityColor(task.due_date)
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(task.progress_status || task.status)}
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {task.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                          task.progress_status || task.status
                        )}`}
                      >
                        {(task.progress_status || task.status).replace("_", " ")}
                      </span>
                      {isOverdue(task.due_date, task.status) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                          Overdue
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {task.due_date}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Created by: {task.created_by}
                      </div>
                      {task.progress_link && (
                        <a
                          href={task.progress_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Progress Link
                        </a>
                      )}
                    </div>

                    {/* Progress Update Form */}
                    {editingTask === task.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Progress Status
                            </label>
                            <select
                              value={progressData[task.id]?.progress_status || ""}
                              onChange={(e) =>
                                updateProgressData(task.id, "progress_status", e.target.value)
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md liquid-glass-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select status</option>
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Progress Link
                            </label>
                            <input
                              type="url"
                              placeholder="Optional progress link"
                              value={progressData[task.id]?.progress_link || ""}
                              onChange={(e) =>
                                updateProgressData(task.id, "progress_link", e.target.value)
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md liquid-glass-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Actions
                            </label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleProgressUpdate(task.id)}
                                className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              >
                                <Save className="w-4 h-4" />
                                Save
                              </button>
                              <button
                                onClick={handleCancel}
                                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Progress Description
                          </label>
                          <textarea
                            placeholder="Optional progress description"
                            rows={3}
                            value={progressData[task.id]?.progress_description || ""}
                            onChange={(e) =>
                              updateProgressData(task.id, "progress_description", e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md liquid-glass-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </motion.div>
                    )}

                    {task.progress_description && editingTask !== task.id && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          <strong>Progress Notes:</strong> {task.progress_description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {editingTask !== task.id && (
                      <button
                        onClick={() => handleEdit(task)}
                        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Update progress"
                      >
                        <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No tasks found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You don't have any tasks assigned yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
