import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../components/PageHeader";
import {
  FileText,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  User,
  ExternalLink,
  Filter,
  Search,
  MoreHorizontal,
  Plus,
  ArrowRight,
  ChevronRight,
  Flag,
  Briefcase,
} from "lucide-react";

export default function ProjectTasksViewer() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [employeesMap, setEmployeesMap] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("table");

  const handleTabChange = (tabId: string) => {
    console.log('Tab changed to:', tabId);
    setActiveTab(tabId);
  };

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

  useEffect(() => {
    const fetchEmployees = async () => {
      const snap = await getDocs(collection(db, "employees"));
      const empMap = {};
      snap.docs.forEach((doc) => {
        const data = doc.data();
        empMap[doc.id] = {
          name: data.name,
          email: data.email,
        };
      });
      setEmployeesMap(empMap);
    };
    fetchEmployees();
  }, []);

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

  const calculatePerformance = (createdAt: any, dueDate: string, updatedAt: any) => {
    if (!updatedAt || !createdAt || !dueDate) return "-";

    const start = new Date(createdAt.seconds * 1000);
    const end = new Date(`${dueDate}T23:59:59`);
    const done = new Date(updatedAt.seconds * 1000);

    const totalTime = end.getTime() - start.getTime();
    const usedTime = done.getTime() - start.getTime();

    if (totalTime <= 0 || usedTime <= 0) return "0%";

    const rawPercent = ((1 - usedTime / totalTime) * 100).toFixed(1);
    const clamped = Math.max(0, Math.min(100, Number(rawPercent)));
    return `${clamped}%`;
  };

  const isLateSubmission = (task: any) => {
    if (
      task.status !== "completed" ||
      !task.progress_updated_at ||
      !task.due_date
    )
      return false;

    const updated = new Date(task.progress_updated_at.seconds * 1000);
    const due = new Date(`${task.due_date}T23:59:59`);

    return updated > due;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "pending":
        return <Circle className="w-4 h-4 text-gray-400" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "pending":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const filteredTasks =
    statusFilter === "all"
      ? tasks
      : statusFilter === "late"
      ? tasks.filter((task) => isLateSubmission(task))
      : tasks.filter((task) => task.status === statusFilter);

  const searchedTasks = filteredTasks.filter((task) =>
    searchTerm
      ? task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const selectedProject = projects.find((proj: any) => proj.id === selectedProjectId);

  // Board View Component
  const BoardView = () => {
    const columns = [
      { id: "pending", title: "To Do", tasks: searchedTasks.filter(t => t.status === "pending") },
      { id: "in_progress", title: "In Progress", tasks: searchedTasks.filter(t => t.status === "in_progress") },
      { id: "completed", title: "Done", tasks: searchedTasks.filter(t => t.status === "completed") },
    ];

    const TaskCard = ({ task }: { task: any }) => (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="enhanced-glass-card p-3 mb-3 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm line-clamp-2">
            {task.title}
          </h4>
          <button className="text-gray-400 hover:text-gray-600 p-0.5">
            <MoreHorizontal className="w-3 h-3" />
          </button>
        </div>

        {task.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                employeesMap[task.assigned_to]?.name || task.assigned_to
              )}`}
              alt="avatar"
              className="w-5 h-5 rounded-full"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {employeesMap[task.assigned_to]?.name || task.assigned_to}
            </span>
          </div>

          {task.due_date && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              {task.due_date}
            </div>
          )}
        </div>

        {task.priority === "high" && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
              <Flag className="w-2 h-2" />
              High Priority
            </span>
          </div>
        )}
      </motion.div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 p-3 bg-white/80 dark:bg-black/95 border border-gray-200/50 dark:border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  column.id === "pending" ? "bg-gray-400" :
                  column.id === "in_progress" ? "bg-blue-500" : "bg-green-500"
                }`} />
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {column.title}
                </h3>
                <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full">
                  {column.tasks.length}
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-1">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {column.tasks.map((task: any) => (
                <TaskCard key={task.id} task={task} />
              ))}

              {column.tasks.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Timeline View Component
  const TimelineView = () => {
    const sortedTasks = [...searchedTasks].sort((a, b) => {
      const dateA = new Date(a.due_date || a.created_at?.seconds * 1000 || Date.now());
      const dateB = new Date(b.due_date || b.created_at?.seconds * 1000 || Date.now());
      return dateA.getTime() - dateB.getTime();
    });

    const getMonthYear = (dateStr: string | any) => {
      let date;
      if (typeof dateStr === 'string') {
        date = new Date(dateStr);
      } else if (dateStr?.seconds) {
        date = new Date(dateStr.seconds * 1000);
      } else {
        date = new Date();
      }
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const groupedTasks = sortedTasks.reduce((acc, task) => {
      const monthYear = getMonthYear(task.due_date || task.created_at);
      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(task);
      return acc;
    }, {} as Record<string, any[]>);

    return (
      <div className="space-y-6 overflow-y-auto max-h-full">
        {Object.entries(groupedTasks).map(([monthYear, tasks]) => (
          <div key={monthYear} className="relative">
            <div className="sticky top-0 bg-white/80 dark:bg-black/95 backdrop-blur-sm py-2 z-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {monthYear}
              </h3>
            </div>

            <div className="relative pl-8">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

              <div className="space-y-4">
                {tasks.map((task: any, index: number) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <div className={`absolute -left-5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                      task.status === "completed" ? "bg-green-500" :
                      task.status === "in_progress" ? "bg-blue-500" : "bg-gray-400"
                    }`} />

                    <div className="liquid-glass-card p-4 ml-2">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              employeesMap[task.assigned_to]?.name || task.assigned_to
                            )}`}
                            alt="avatar"
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-gray-600 dark:text-gray-400">
                            {employeesMap[task.assigned_to]?.name || task.assigned_to}
                          </span>
                        </div>

                        {task.due_date && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            Due {task.due_date}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {sortedTasks.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No tasks to display
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Select a project to view its timeline
            </p>
          </div>
        )}
      </div>
    );
  };

  const filterContent = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <select
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-purple-500/30 rounded-md bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={statusFilter}
          onChange={(e) => {
            console.log('Status filter changed to:', e.target.value);
            setStatusFilter(e.target.value);
            setFilterOpen(false);
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="late">Late Submissions</option>
        </select>
      </div>
    </div>
  );

  const tabs = [
    {
      id: "table",
      label: "Table",
      icon: FileText,
      active: activeTab === "table",
    },
    {
      id: "board",
      label: "Board",
      icon: Users,
      active: activeTab === "board",
    },
    {
      id: "timeline",
      label: "Timeline",
      icon: Calendar,
      active: activeTab === "timeline",
    },
  ];

  console.log('Current activeTab:', activeTab);

  return (
    <div className="h-full bg-gradient-to-br from-slate-100 via-purple-100 to-indigo-200 dark:bg-gradient-to-br dark:from-slate-800 dark:via-purple-900/40 dark:to-indigo-900/60 flex flex-col relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-200/10 dark:bg-slate-600/5 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
      </div>
      <PageHeader
        title="Project Tasks"
        subtitle={selectedProject ? `• ${selectedProject.name}` : ""}
        status="On track"
        statusColor="bg-green-100 text-green-700"
        tabs={tabs}
        onTabChange={handleTabChange}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search tasks..."
        showFilters={true}
        filterOpen={filterOpen}
        onFilterToggle={() => setFilterOpen(!filterOpen)}
        filterContent={filterContent}
      />

      <div className="flex-1 overflow-y-auto p-4">
        {/* Project Selection */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Select Project
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((project: any) => (
              <motion.button
                key={project.id}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedProjectId(project.id)}
                className={`group relative p-6 enhanced-glass-card text-left transition-all duration-300 overflow-hidden ${
                  selectedProjectId === project.id
                    ? "border-purple-500 bg-gradient-to-br from-purple-50/90 via-indigo-50/80 to-slate-50/90 dark:from-purple-900/30 dark:via-indigo-900/20 dark:to-slate-800/30 ring-2 ring-purple-300 dark:ring-purple-400/40 shadow-lg"
                    : "hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-xl hover:from-slate-50/80 hover:to-purple-50/60 dark:hover:from-slate-800/50 dark:hover:to-purple-900/20"
                }`}
              >
                {/* Header with Icon and Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 via-purple-100 to-indigo-200 dark:from-slate-700/60 dark:via-purple-800/50 dark:to-indigo-800/60 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <Briefcase className="w-6 h-6 text-slate-600 dark:text-purple-300" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full border border-purple-200/50 dark:border-purple-500/30">
                          Active Project
                        </span>
                      </div>
                    </div>
                  </div>
                  {selectedProjectId === project.id && (
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-500 rounded-full">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                  {project.description || "No description available for this project."}
                </p>

                {/* Project Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Deadline</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {project.deadline || "Not set"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Team Size</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {Math.floor(Math.random() * 8) + 3} members
                    </span>
                  </div>
                </div>

                {/* Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-50/10 to-indigo-100/20 dark:from-transparent dark:via-purple-900/5 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"></div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content Views */}
        <AnimatePresence mode="wait">
          {selectedProjectId && (
            <motion.div
              key={`${selectedProjectId}-${activeTab}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {/* Table View */}
              {activeTab === 'table' && (
                <div className="enhanced-glass-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-purple-500/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Tasks for {selectedProject?.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {searchedTasks.length} tasks
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/50 dark:bg-black/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Task
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Assignee
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Progress
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Performance
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/80 dark:bg-black/80 divide-y divide-gray-200 dark:divide-purple-500/30">
                        {searchedTasks.map((task: any, index: number) => (
                          <motion.tr
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-white/90 dark:hover:bg-purple-500/10 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-start gap-3">
                                {getStatusIcon(task.status)}
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {task.title}
                                  </div>
                                  {task.description && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                      {task.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                  task.status
                                )}`}
                              >
                                {task.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                    employeesMap[task.assigned_to]?.name ||
                                      employeesMap[task.assigned_to]?.email ||
                                      task.assigned_to
                                  )}`}
                                  alt="avatar"
                                  className="w-6 h-6 rounded-full"
                                />
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                  {employeesMap[task.assigned_to]?.name ||
                                    employeesMap[task.assigned_to]?.email ||
                                    task.assigned_to}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {task.due_date}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-full">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {task.progress_status || "Not started"}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      task.progress_status === "completed"
                                        ? "bg-green-500"
                                        : task.progress_status === "in progress"
                                        ? "bg-blue-500"
                                        : "bg-gray-400"
                                    }`}
                                    style={{
                                      width:
                                        task.progress_status === "completed"
                                          ? "100%"
                                          : task.progress_status === "in progress"
                                          ? "50%"
                                          : "10%",
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {task.status === "completed"
                                  ? calculatePerformance(
                                      task.created_at,
                                      task.due_date,
                                      task.progress_updated_at
                                    )
                                  : "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {task.progress_link && (
                                  <a
                                    href={task.progress_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                    title="View progress link"
                                  >
                                    <ExternalLink className="w-4 h-4 text-blue-600" />
                                  </a>
                                )}
                                <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                  <User className="w-4 h-4 text-gray-400" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {searchedTasks.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        No tasks found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {statusFilter === "all"
                          ? "This project doesn't have any tasks yet."
                          : `No tasks with status "${statusFilter}" found.`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Board View */}
              {activeTab === 'board' && (
                <div key="board-view" className="h-full">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedProject?.name} - Board View
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {searchedTasks.length} tasks • Active Tab: {activeTab}
                    </p>
                  </div>
                  <BoardView />
                </div>
              )}

              {/* Timeline View */}
              {activeTab === 'timeline' && (
                <div key="timeline-view" className="h-full">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedProject?.name} - Timeline View
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {searchedTasks.length} tasks • Active Tab: {activeTab}
                    </p>
                  </div>
                  <TimelineView />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
