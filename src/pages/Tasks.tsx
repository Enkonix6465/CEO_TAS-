import React, { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConnected } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Flag,
  CheckCircle,
  Circle,
  Edit2,
  Trash2,
  Target,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  Square,
  MoreHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";

function Tasks() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    assignee: "",
    projectId: "",
    dueDate: "",
  });

  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    
    const initializeWithRetry = () => {
      try {
        setHasError(false);
        setupTaskListeners();
        
        // Check if there's a filter from Dashboard page (Router state takes priority)
        const routerState = location.state as any;
        if (routerState?.filterStatus && routerState?.fromDashboard) {
          setFilterStatus(routerState.filterStatus);
          // Clear the router state after using it
          window.history.replaceState({}, document.title);
        } else {
          // Fallback to localStorage
          const statusFilter = localStorage.getItem('taskStatusFilter');
          if (statusFilter) {
            setFilterStatus(statusFilter);
            // Clear the filter after using it
            localStorage.removeItem('taskStatusFilter');
          }
        }
        
        if (connectionStatus === 'offline' && retryCount < 3) {
          retryTimer = setTimeout(() => {
            console.log(`Retrying Tasks connection (attempt ${retryCount + 1})`);
            setRetryCount(prev => prev + 1);
            initializeWithRetry();
          }, 5000 * (retryCount + 1));
        }
      } catch (error) {
        console.error("Tasks initialization error:", error);
        setHasError(true);
        setConnectionStatus('offline');
        setLoading(false);
      }
    };

    initializeWithRetry();
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [retryCount]);

  const setupTaskListeners = () => {
    if (!db) {
      console.warn("Firebase not available for Tasks");
      setConnectionStatus('offline');
      setLoading(false);
      return;
    }

    setConnectionStatus('connecting');

    try {
      const tasksUnsub = onSnapshot(
        collection(db, "tasks"),
        (snapshot) => {
          try {
            const tasksData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setTasks(tasksData);
            setConnectionStatus('connected');
          } catch (error) {
            console.warn("Error processing tasks:", error);
          }
        },
        (error) => {
          console.warn("Tasks listener error:", error);
          setConnectionStatus('offline');
        }
      );

      const projectsUnsub = onSnapshot(
        collection(db, "projects"),
        (snapshot) => {
          try {
            setProjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          } catch (error) {
            console.warn("Error processing projects:", error);
          }
        },
        (error) => console.warn("Projects listener error:", error)
      );

      const usersUnsub = onSnapshot(
        collection(db, "users"),
        (snapshot) => {
          try {
            setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          } catch (error) {
            console.warn("Error processing users:", error);
          }
        },
        (error) => console.warn("Users listener error:", error)
      );

      setLoading(false);
      return () => {
        tasksUnsub();
        projectsUnsub();
        usersUnsub();
      };
    } catch (error) {
      console.error("Error setting up task listeners:", error);
      setConnectionStatus('offline');
      setHasError(true);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setHasError(false);
    setRetryCount(0);
    setLoading(true);
    setupTaskListeners();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      toast.error("Database not available");
      return;
    }

    try {
      if (editingTask) {
        await updateDoc(doc(db, "tasks", editingTask.id), {
          ...formData,
          updated_at: serverTimestamp(),
        });
        toast.success("Task updated successfully");
      } else {
        await addDoc(collection(db, "tasks"), {
          ...formData,
          created_by: user?.uid,
          created_at: serverTimestamp(),
        });
        toast.success("Task created successfully");
      }
      
      setShowModal(false);
      setEditingTask(null);
      setFormData({
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        assignee: "",
        projectId: "",
        dueDate: "",
      });
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) {
      toast.error("Database not available");
      return;
    }

    try {
      await deleteDoc(doc(db, "tasks", id));
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setFormData({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "pending",
      priority: task.priority || "medium",
      assignee: task.assignee || "",
      projectId: task.projectId || "",
      dueDate: task.dueDate || "",
    });
    setShowModal(true);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    if (!db) return;
    
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        status: newStatus,
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  // Function to check if a task is overdue
  const isTaskOverdue = (task) => {
    if (!task || task.status === 'completed' || task.status === 'cancelled') return false;

    // Handle different date field names and formats
    const dueDate = task.dueDate || task.due_date;
    if (!dueDate) return false;

    let due;
    if (typeof dueDate === 'string') {
      due = new Date(dueDate);
    } else if (dueDate.seconds) {
      // Firestore timestamp
      due = new Date(dueDate.seconds * 1000);
    } else {
      due = new Date(dueDate);
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return due < today;
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Special handling for overdue filter
    let matchesStatus = true;
    if (filterStatus === "overdue") {
      matchesStatus = isTaskOverdue(task);
    } else {
      // Fixed: Handle both underscore and hyphen formats consistently
      const taskStatus = task.status;
      let filterStatusNormalized = filterStatus;
      
      // Convert filter status to match data format
      if (filterStatus === "in-progress") {
        filterStatusNormalized = "in_progress";
      }
      
      matchesStatus = filterStatus === "all" || taskStatus === filterStatusNormalized;
    }
    
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30';
      case 'in_progress':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
      case 'pending':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
      default:
        return 'bg-gray-50 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400';
      default:
        return 'bg-gray-50 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  // Function to get task row border color based on status and overdue state
  const getTaskRowColor = (task: any) => {
    if (isTaskOverdue(task)) {
      return 'bg-white/60 dark:bg-slate-800/60 border-l-4 border-red-500';
    }

    switch (task.status) {
      case 'completed':
        return 'bg-white/60 dark:bg-slate-800/60 border-l-4 border-green-500';
      case 'in_progress':
        return 'bg-white/60 dark:bg-slate-800/60 border-l-4 border-blue-500';
      case 'pending':
        return 'bg-white/60 dark:bg-slate-800/60 border-l-4 border-yellow-500';
      default:
        return 'bg-white/60 dark:bg-slate-800/60 border-l-4 border-gray-300';
    }
  };

  // Fixed: Consistent status handling in getStatusIcon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress': // Fixed: Use underscore instead of hyphen
        return Play;
      case 'pending':
        return Circle;
      default:
        return Square;
    }
  };

  // Function to format status for display
  const formatStatusForDisplay = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Error boundary fallback
  if (hasError && connectionStatus === 'offline') {
    return (
      <div className="h-full bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex items-center justify-center">
        <div className="text-center p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl shadow-lg max-w-md">
          <div className="p-4 bg-orange-100 dark:bg-orange-500/20 rounded-xl mb-4 inline-block">
            <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Tasks Unavailable</h3>
          <p className="text-sm text-violet-600/70 dark:text-violet-300/70 mb-4">
            Unable to load tasks. Please check your connection.
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-violet-600 dark:text-violet-400 font-medium">Loading Tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-violet-200/20 to-purple-200/20 dark:from-violet-900/10 dark:to-purple-900/10 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-violet-200/20 dark:from-indigo-900/10 dark:to-violet-900/10 rounded-full blur-3xl opacity-60"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-violet-200/50 dark:border-violet-500/20 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Tasks
                </h1>
                <p className="text-xs text-violet-600/70 dark:text-violet-300/70 font-medium">
                  Manage your tasks
                </p>
              </div>
            </div>
            
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-sm flex items-center gap-2 ${
              connectionStatus === 'connected'
                ? 'bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/30'
                : connectionStatus === 'connecting'
                ? 'bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/30'
                : 'bg-gray-50/80 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200/60 dark:border-gray-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500' :
                connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                'bg-gray-500'
              }`}></div>
              {tasks.length} Tasks
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 bg-white/70 dark:bg-slate-800/70 text-violet-600 dark:text-violet-300 hover:bg-violet-100/70 dark:hover:bg-violet-700/40 border border-violet-200/60 dark:border-violet-500/30 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-sm backdrop-blur-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-sm text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-violet-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/70 dark:bg-slate-800/70 border border-violet-200/60 dark:border-violet-500/30 rounded-xl text-violet-800 dark:text-violet-200 placeholder-violet-400 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm backdrop-blur-sm"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white/70 dark:bg-slate-800/70 border border-violet-200/60 dark:border-violet-500/30 rounded-xl text-violet-800 dark:text-violet-200 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm backdrop-blur-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-white/70 dark:bg-slate-800/70 border border-violet-200/60 dark:border-violet-500/30 rounded-xl text-violet-800 dark:text-violet-200 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm backdrop-blur-sm"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-auto px-6 py-4">
        {filteredTasks.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="p-4 bg-violet-100 dark:bg-violet-500/20 rounded-xl mb-4 inline-block">
                <Target className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Tasks Found</h3>
              <p className="text-sm text-violet-600/70 dark:text-violet-300/70 mb-4">
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first task to get started'}
              </p>
              {!searchTerm && filterStatus === 'all' && filterPriority === 'all' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg text-sm font-medium"
                >
                  Create Task
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTasks.map((task, index) => {
              const StatusIcon = getStatusIcon(task.status);
              const project = projects.find(p => p.id === task.projectId);
              const assigneeUser = users.find(u => u.id === task.assignee);
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${getTaskRowColor(task)} backdrop-blur-xl border rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 group h-full flex flex-col cursor-pointer`}
                  onClick={() => navigate(`/task/${task.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed');
                        }}
                        className="p-1.5 hover:bg-violet-100 dark:hover:bg-violet-500/20 rounded-lg transition-colors"
                      >
                        <StatusIcon className={`w-5 h-5 ${
                          task.status === 'completed' ? 'text-green-600' :
                          task.status === 'in_progress' ? 'text-blue-600' :
                          isTaskOverdue(task) ? 'text-red-600' :
                          'text-yellow-600'
                        }`} />
                      </button>
                      
                      <h3 className={`font-bold text-lg truncate ${
                        task.status === 'completed' 
                          ? 'line-through text-gray-500 dark:text-gray-400' 
                          : 'text-slate-800 dark:text-white'
                      }`}>
                        {task.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(task);
                        }}
                        className="p-1 hover:bg-violet-100 dark:hover:bg-violet-500/20 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(task.id);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(task.status)}`}>
                      {formatStatusForDisplay(task.status)}
                    </span>
                    
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    
                    {isTaskOverdue(task) && (
                      <span className="px-2 py-1 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Overdue
                      </span>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-violet-600/70 dark:text-violet-300/70 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-3 border-t border-violet-100/50 dark:border-violet-500/20">
                    <div className="grid grid-cols-1 gap-2 text-xs text-violet-600/70 dark:text-violet-300/70">
                      {project && (
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{project.name}</span>
                        </div>
                      )}
                      
                      {assigneeUser && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{assigneeUser.fullName || assigneeUser.name}</span>
                        </div>
                      )}
                      
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
                setEditingTask(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                {editingTask ? 'Edit Task' : 'Create Task'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Assignee
                  </label>
                  <select
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Select Assignee</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName || user.name || user.email}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Project
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTask(null);
                      setFormData({
                        title: "",
                        description: "",
                        status: "pending",
                        priority: "medium",
                        assignee: "",
                        projectId: "",
                        dueDate: "",
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg font-medium"
                  >
                    {editingTask ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Tasks;
