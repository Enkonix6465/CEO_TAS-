import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, Timestamp, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Circle,
  Calendar,
  Target,
  Award,
  Activity,
  AlertCircle,
  User,
  Download,
  Star,
  Zap,
  Trophy,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  ChevronDown,
  MessageCircle,
  Flag,
  ArrowRight,
  Eye,
  Layers,
  BarChart3,
  Timer,
  PieChart,
  Gauge,
  Briefcase,
  Map,
  Grid,
  List,
  X,
  Save,
  Edit,
  Trash2
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart as RechartsPieChart,
  Cell
} from "recharts";
import toast from "react-hot-toast";

const DashboardPage = () => {
  const { user } = useAuthStore();
  
  // Dashboard state
  const [activeView, setActiveView] = useState("overview"); // overview, performance, kanban
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState("30"); // 7, 30, 90 days
  
  // Data state
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [performanceData, setPerformanceData] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  
  // Kanban state
  const [draggedTask, setDraggedTask] = useState(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assigned_to: "",
    project_id: "",
    tags: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!user?.uid) {
          setLoading(false);
          return;
        }

        // Load teams first to determine access
        const teamsSnap = await getDocs(collection(db, "teams"));
        if (teamsSnap.empty) {
          setLoading(false);
          return;
        }

        // Load all data in parallel
        const [empSnap, taskSnap, projectSnap] = await Promise.all([
          getDocs(collection(db, "employees")),
          getDocs(collection(db, "tasks")),
          getDocs(collection(db, "projects"))
        ]);

        const allEmployees = empSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const allTasks = taskSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const allProjects = projectSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Group teams with members
        const groupedTeams = teamsSnap.docs.map(teamDoc => {
          const teamData = teamDoc.data();
          const memberIds = teamData.members || [];
          const members = allEmployees.filter(emp => memberIds.includes(emp.id));
          const lead = allEmployees.find(emp => emp.id === teamData.created_by);

          return {
            teamId: teamDoc.id,
            teamName: teamData.teamName || "Unnamed Team",
            teamLead: lead?.name || "Unknown Lead",
            members,
          };
        });

        setTeams(groupedTeams);
        setEmployees(allEmployees);
        setTasks(allTasks);
        setProjects(allProjects);
        
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid]);

  // Calculate performance metrics
  useEffect(() => {
    if (!selectedEmployee || tasks.length === 0) return;

    const empTasks = tasks.filter(task => task.assigned_to === selectedEmployee.id);
    const completed = empTasks.filter(task => task.progress_status === "completed");
    const onTime = completed.filter(task => {
      const due = new Date(task.due_date);
      const completedDate = task.progress_updated_at?.toDate?.() || new Date();
      return completedDate <= due;
    });

    const completionRate = empTasks.length > 0 ? (completed.length / empTasks.length) * 100 : 0;
    const onTimeRate = completed.length > 0 ? (onTime.length / completed.length) * 100 : 0;
    const avgTasksPerWeek = empTasks.length / 4; // Assuming 4 weeks
    
    setPerformanceData({
      totalTasks: empTasks.length,
      completed: completed.length,
      onTime: onTime.length,
      completionRate,
      onTimeRate,
      avgTasksPerWeek,
      productivity: Math.round((completionRate + onTimeRate) / 2)
    });
  }, [selectedEmployee, tasks]);

  // Generate mock analytics data
  const generateAnalyticsData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        tasks: Math.floor(Math.random() * 15) + 5,
        completed: Math.floor(Math.random() * 10) + 2,
        productivity: Math.floor(Math.random() * 40) + 60
      };
    }).reverse();

    return last30Days;
  };

  const analyticsData = generateAnalyticsData();

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm || 
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = !selectedPriority || task.priority === selectedPriority;
    const matchesProject = !selectedProject || task.project_id === selectedProject;
    const matchesAssignee = !selectedAssignee || task.assigned_to === selectedAssignee;
    
    return matchesSearch && matchesPriority && matchesProject && matchesAssignee;
  });

  // Kanban columns
  const columns = [
    {
      id: "pending",
      title: "To Do",
      icon: Circle,
      color: "amber",
      count: filteredTasks.filter(t => t.status === "pending").length
    },
    {
      id: "in_progress",
      title: "In Progress", 
      icon: Clock,
      color: "blue",
      count: filteredTasks.filter(t => t.status === "in_progress").length
    },
    {
      id: "review",
      title: "Review",
      icon: Eye,
      color: "purple",
      count: filteredTasks.filter(t => t.status === "review").length
    },
    {
      id: "completed",
      title: "Done",
      icon: CheckCircle,
      color: "emerald",
      count: filteredTasks.filter(t => t.status === "completed").length
    }
  ];

  // Dashboard metrics
  const dashboardMetrics = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === "completed").length,
    inProgressTasks: tasks.filter(t => t.status === "in_progress").length,
    overdueTasks: tasks.filter(t => {
      if (!t || t.status === 'completed' || t.status === 'cancelled' || t.progress_status === 'completed') {
        return false;
      }
      const dueDate = t.due_date || t.dueDate;
      if (!dueDate) return false;

      try {
        let due;
        if (typeof dueDate === 'string') {
          due = new Date(dueDate);
        } else if (dueDate.seconds) {
          due = new Date(dueDate.seconds * 1000);
        } else if (dueDate.toDate) {
          due = dueDate.toDate();
        } else {
          due = new Date(dueDate);
        }

        if (isNaN(due.getTime())) return false;

        const now = new Date();
        now.setHours(23, 59, 59, 999);
        return due < now;
      } catch (error) {
        return false;
      }
    }).length,
    teamEfficiency: Math.round(
      (tasks.filter(t => t.status === "completed").length / Math.max(tasks.length, 1)) * 100
    ),
    avgCompletionTime: "2.3 days"
  };

  const handleTaskMove = async (task, newStatus) => {
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        status: newStatus,
        progress_status: newStatus,
        progress_updated_at: Timestamp.now(),
        progress: newStatus === "completed" ? 100 : task.progress || 0,
      });
      toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleAddTask = async () => {
    if (!newTaskForm.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      await addDoc(collection(db, "tasks"), {
        ...newTaskForm,
        status: "pending",
        progress_status: "pending",
        created_by: user?.uid || "anonymous",
        created_at: Timestamp.now(),
        task_id: `TASK-${Date.now()}`,
        progress: 0,
        comments: [],
      });

      toast.success("Task created successfully!");
      setNewTaskForm({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        assigned_to: "",
        project_id: "",
        tags: "",
      });
      setShowNewTaskModal(false);
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    }
  };

  const MetricCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="liquid-glass-card group cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-purple-300/90 mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-purple-300/70">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                {trend}
              </span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl bg-${color}-100 dark:bg-${color}-500/20 text-${color}-600 dark:text-${color}-400 border border-${color}-200 dark:border-${color}-500/30`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </motion.div>
  );

  const TaskCard = ({ task }) => {
    const isOverdue = (() => {
      if (!task || task.status === 'completed' || task.status === 'cancelled' || task.progress_status === 'completed') {
        return false;
      }
      const dueDate = task.due_date || task.dueDate;
      if (!dueDate) return false;

      try {
        let due;
        if (typeof dueDate === 'string') {
          due = new Date(dueDate);
        } else if (dueDate.seconds) {
          due = new Date(dueDate.seconds * 1000);
        } else if (dueDate.toDate) {
          due = dueDate.toDate();
        } else {
          due = new Date(dueDate);
        }

        if (isNaN(due.getTime())) return false;

        const now = new Date();
        now.setHours(23, 59, 59, 999);
        return due < now;
      } catch (error) {
        return false;
      }
    })();
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.02 }}
        draggable
        onDragStart={(e) => setDraggedTask(task)}
        className="enhanced-glass-card rounded-2xl p-4 mb-3 cursor-pointer group"
      >
        <div className={`absolute top-0 left-0 w-full h-1 rounded-t-2xl ${
          task.priority === "high" ? "bg-red-500" :
          task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
        }`} />
        
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1">
              {task.title}
            </h4>
            <div className="flex items-center gap-2">
              <Flag className={`w-3 h-3 ${
                task.priority === "high" ? "text-red-500" :
                task.priority === "medium" ? "text-yellow-500" : "text-green-500"
              }`} />
              <span className="text-xs text-gray-500">{task.priority}</span>
              {isOverdue && (
                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                  Overdue
                </span>
              )}
            </div>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-gray-700 dark:text-gray-200 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {task.progress > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Progress</span>
              <span className="font-bold text-blue-600">{task.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 text-xs text-gray-600 dark:text-gray-400">
          {/* Assignee */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-[10px] font-medium border border-blue-200 dark:border-blue-700/50">
              Assignee
            </span>
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assigned_to}`}
              alt="avatar"
              className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
            />
            <span className="text-[11px] font-medium">{employees.find(e => e.id === task.assigned_to)?.name || "Unassigned"}</span>
          </div>
          {/* Reporter */}
          {task.created_by && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-[10px] font-medium border border-green-200 dark:border-green-700/50">
                Reporter
              </span>
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.created_by}`}
                alt="avatar"
                className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
              />
              <span className="text-[11px] font-medium">{employees.find(e => e.id === task.created_by)?.name || "Unknown"}</span>
            </div>
          )}
          {/* Due Date */}
          {task.due_date && (
            <div className="flex items-center gap-1 mt-2">
              <Calendar className="w-3 h-3" />
              <span className="text-[11px]">{new Date(task.due_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 flex flex-col">
      {/* Enhanced Header */}
      <div className="liquid-glass border-b border-gray-200 dark:border-purple-500/30 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Performance Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {tasks.length} tasks • {teams.length} teams • {employees.length} members
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-500/30">
                <Activity className="w-3 h-3 inline mr-1" />
                Live
              </span>
              <span className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-500/30">
                {dashboardMetrics.teamEfficiency}% Efficiency
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-black/60 text-gray-900 dark:text-purple-100"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-black/60 text-gray-900 dark:text-purple-100 w-64"
              />
            </div>

            <button
              onClick={() => setShowNewTaskModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-purple-800/30 rounded-xl p-1">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "performance", label: "Performance", icon: BarChart3 },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
                activeView === view.id
                  ? 'bg-white dark:bg-purple-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-purple-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <view.icon className="w-4 h-4" />
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Overview View */}
        {activeView === "overview" && (
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Tasks"
                value={dashboardMetrics.totalTasks}
                icon={Target}
                color="blue"
                subtitle="All tasks"
                trend="+12% this week"
              />
              <MetricCard
                title="Completed"
                value={dashboardMetrics.completedTasks}
                icon={CheckCircle}
                color="green"
                subtitle={`${dashboardMetrics.teamEfficiency}% completion rate`}
                trend="+8% this week"
              />
              <MetricCard
                title="In Progress"
                value={dashboardMetrics.inProgressTasks}
                icon={Clock}
                color="blue"
                subtitle="Active tasks"
                trend="+5% this week"
              />
              <MetricCard
                title="Overdue"
                value={dashboardMetrics.overdueTasks}
                icon={AlertCircle}
                color="red"
                subtitle="Need attention"
                trend="-3% this week"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task Progress Chart */}
              <div className="liquid-glass-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Task Progress Trends
                  </h3>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.slice(-14)}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#00D4FF"
                      fill="#00D4FF"
                      fillOpacity={0.3}
                      name="Completed Tasks"
                    />
                    <Area
                      type="monotone"
                      dataKey="tasks"
                      stroke="#7c3aed"
                      fill="#7c3aed"
                      fillOpacity={0.2}
                      name="Total Tasks"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Team Performance */}
              <div className="liquid-glass-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Team Performance
                  </h3>
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="space-y-4">
                  {teams.slice(0, 100).map((team, index) => {
                    const teamTasks = tasks.filter(t => 
                      team.members.some(m => m.id === t.assigned_to)
                    );
                    const completedTasks = teamTasks.filter(t => t.status === "completed");
                    const efficiency = teamTasks.length > 0 ? 
                      Math.round((completedTasks.length / teamTasks.length) * 100) : 0;
                    
                    return (
                      <div key={team.teamId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {team.teamName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {team.members.length} members
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {efficiency}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {completedTasks.length}/{teamTasks.length} tasks
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="liquid-glass-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h3>
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task, index) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        task.status === "completed" ? "bg-green-500" :
                        task.status === "in_progress" ? "bg-blue-500" : "bg-gray-400"
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {employees.find(e => e.id === task.assigned_to)?.name || "Unassigned"}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.status === "completed" ? "bg-green-100 text-green-700" :
                      task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {task.status?.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Performance View */}
        {activeView === "performance" && (
          <div className="flex h-full">
            {/* Employee Sidebar */}
            <div className="w-80 border-r border-gray-200 dark:border-purple-500/30 liquid-glass flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-purple-500/30">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Team Members
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {teams.map((team) => (
                  <div key={team.teamId}>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {team.teamName}
                    </h3>
                    <div className="space-y-2">
                      {team.members.map((emp) => (
                        <motion.div
                          key={emp.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedEmployee(emp)}
                          className={`p-3 rounded-xl cursor-pointer border transition-all ${
                            selectedEmployee?.id === emp.id
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-500/20"
                              : "border-gray-200 dark:border-purple-500/20 hover:border-purple-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`}
                              alt="avatar"
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {emp.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {emp.department || "No department"}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Content */}
            <div className="flex-1 overflow-y-auto">
              {selectedEmployee ? (
                <div className="p-6 space-y-6">
                  {/* Employee Header */}
                  <div className="liquid-glass-card">
                    <div className="flex items-center gap-4">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedEmployee.name}`}
                        alt="avatar"
                        className="w-16 h-16 rounded-full border-2 border-purple-200"
                      />
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedEmployee.name}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                          {selectedEmployee.department || "No department"}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>ID: {selectedEmployee.id.slice(-6)}</span>
                          <span>Productivity: {performanceData.productivity || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                      title="Total Tasks"
                      value={performanceData.totalTasks || 0}
                      icon={Target}
                      color="blue"
                    />
                    <MetricCard
                      title="Completed"
                      value={performanceData.completed || 0}
                      icon={CheckCircle}
                      color="green"
                      subtitle={`${performanceData.completionRate?.toFixed(1) || 0}% rate`}
                    />
                    <MetricCard
                      title="On Time"
                      value={performanceData.onTime || 0}
                      icon={Clock}
                      color="blue"
                      subtitle={`${performanceData.onTimeRate?.toFixed(1) || 0}% rate`}
                    />
                    <MetricCard
                      title="Avg/Week"
                      value={performanceData.avgTasksPerWeek?.toFixed(1) || 0}
                      icon={Activity}
                      color="purple"
                    />
                  </div>

                  {/* Performance Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="liquid-glass-card">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Performance Radar
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={[
                          { dimension: 'Completion', value: performanceData.completionRate || 0 },
                          { dimension: 'On-Time', value: performanceData.onTimeRate || 0 },
                          { dimension: 'Quality', value: 85 },
                          { dimension: 'Productivity', value: performanceData.productivity || 0 },
                          { dimension: 'Consistency', value: 78 }
                        ]}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="dimension" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar
                            name="Performance"
                            dataKey="value"
                            stroke="#00D4FF"
                            fill="#00D4FF"
                            fillOpacity={0.3}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="liquid-glass-card">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Weekly Progress
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData.slice(-7)}>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="completed" fill="#00D4FF" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Select a Team Member
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose a member to view their performance analytics
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kanban View */}
        {activeView === "kanban" && (
          <div className="p-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {columns.map((column) => (
                <div key={column.id} className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {column.count}
                  </div>
                  <div className="text-xs text-gray-500">{column.title}</div>
                </div>
              ))}
            </div>

            {/* Kanban Board */}
            <div className="flex gap-6 h-full overflow-x-auto">
              {columns.map((column) => (
                <motion.div
                  key={column.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col w-80 min-w-80 h-full"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedTask && draggedTask.status !== column.id) {
                      handleTaskMove(draggedTask, column.id);
                    }
                    setDraggedTask(null);
                  }}
                >
                  {/* Column Header */}
                  <div className="liquid-glass-card rounded-t-2xl p-4 border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <column.icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {column.title}
                          </h3>
                          <p className="text-xs text-gray-500">{column.count} tasks</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowNewTaskModal(true)}
                        className="w-6 h-6 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-600 hover:bg-purple-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Column Content */}
                  <div className="liquid-glass-card rounded-b-2xl rounded-t-none flex-1 p-4 overflow-y-auto">
                    <AnimatePresence>
                      {filteredTasks
                        .filter(task => task.status === column.id)
                        .map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                    </AnimatePresence>
                    
                    {filteredTasks.filter(task => task.status === column.id).length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <column.icon className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">No tasks yet</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Task Modal */}
      <AnimatePresence>
        {showNewTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowNewTaskModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-black rounded-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Create New Task
                </h2>
                <button
                  onClick={() => setShowNewTaskModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={newTaskForm.title}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter task title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTaskForm.description}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Task description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={newTaskForm.priority}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newTaskForm.due_date}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assignee
                  </label>
                  <select
                    value={newTaskForm.assigned_to}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select assignee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowNewTaskModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;
