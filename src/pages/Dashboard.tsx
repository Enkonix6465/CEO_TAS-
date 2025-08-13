import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, auth, isFirebaseConnected } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../styles/animations.css";
import {
  Star,
  Settings,
  Search,
  Filter,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Target,
  Briefcase,
  Zap,
  BarChart3,
  Layers,
  X,
  ListChecks,
  Percent,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Function to get performance label based on percentage
const getPerformanceLabel = (percent: number) => {
  if (percent >= 90) {
    return { label: 'Excellent', color: 'bg-emerald-600 dark:bg-emerald-500' };
  } else if (percent >= 75) {
    return { label: 'Good', color: 'bg-blue-600 dark:bg-blue-500' };
  } else if (percent >= 50) {
    return { label: 'Average', color: 'bg-amber-600 dark:bg-amber-500' };
  } else if (percent >= 25) {
    return { label: 'Below Average', color: 'bg-orange-600 dark:bg-orange-500' };
  } else {
    return { label: 'Poor', color: 'bg-red-600 dark:bg-red-500' };
  }
};

// Function to get employee name by ID
const getEmployeeName = (employeeId: string) => {
  const employee = employees.find(e => e.id === employeeId);
  return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
};

// Function to get team name by ID (will be moved inside component)

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Function to get team name by ID (moved inside component to access teams state)
  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'No Team';
  };
  
  // Function to get project name by ID
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };
  
  // Status title mapping
  const statusTitles = {
    "pending": "Pending",
    "in_progress": "In Progress",
    "completed": "Completed"
  };
  const [filterDate, setFilterDate] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [unsubscribers, setUnsubscribers] = useState<(() => void)[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Navigation button states
  const [projectOpen, setProjectOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const tableRef = React.useRef(null);
  
  // Function to check if a task is overdue
  const isOverdue = (task: any) => {
    if (task.status === "completed") return false;
    const today = new Date();
    const dueDate = typeof task.due_date === "string" 
      ? new Date(task.due_date) 
      : task.due_date?.toDate?.();
    return dueDate && dueDate < today;
  };
  
  // Function to handle task click
  const handleTaskClick = (task: any) => {
    navigate(`/task/${task.id}`);
  };
  
  // Function to add a comment to a task
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    
    setCommentLoading(true);
    try {
      // Get the current task document reference
      const taskRef = doc(db, "tasks", selectedTask.id);
      
      // Create the new comment object
      const commentObj = {
        userId: auth.currentUser?.uid,
        text: newComment.trim(),
        timestamp: new Date().getTime()
      };
      
      // Prepare the comments array (ensure it exists)
      const comments = Array.isArray(selectedTask.comments) 
        ? [...selectedTask.comments, commentObj] 
        : [commentObj];
      
      // Update the task document with the new comments array
      await updateDoc(taskRef, { comments });
      
      // Update the local state
      setSelectedTask({
        ...selectedTask,
        comments
      });
      
      // Clear the comment input
      setNewComment("");
      
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setCommentLoading(false);
    }
  };

  useEffect(() => {
    let retryTimer: NodeJS.Timeout;

    const initializeWithRetry = () => {
      try {
        setHasError(false);
        const newUnsubscribers = setupRealtimeListeners();
        setUnsubscribers(newUnsubscribers);

        // If connection fails, retry after delay
        if (connectionStatus === 'offline' && retryCount < 3) {
          retryTimer = setTimeout(() => {
            console.log(`Retrying Firebase connection (attempt ${retryCount + 1})`);
            setRetryCount(prev => prev + 1);
            initializeWithRetry();
          }, 5000 * (retryCount + 1)); // Exponential backoff
        }
      } catch (error) {
        console.error("Dashboard initialization error:", error);
        setHasError(true);
        setConnectionStatus('offline');
      }
    };

    initializeWithRetry();

    // Return cleanup function
    return () => {
      if (retryTimer) clearTimeout(retryTimer);

      if (Array.isArray(unsubscribers)) {
        unsubscribers.forEach(unsub => {
          try {
            if (typeof unsub === 'function') {
              unsub();
            }
          } catch (error) {
            console.warn("Error unsubscribing:", error);
          }
        });
      }
    };
  }, [retryCount]);

  const handleRefresh = () => {
    if (connectionStatus === 'connecting') return;

    try {
      // Reset error state and retry count
      setHasError(false);
      setRetryCount(0);

      // Clean up existing listeners
      unsubscribers.forEach(unsub => {
        try {
          if (typeof unsub === 'function') {
            unsub();
          }
        } catch (error) {
          console.warn("Error unsubscribing:", error);
        }
      });

      // Setup new listeners
      const newUnsubscribers = setupRealtimeListeners();
      setUnsubscribers(newUnsubscribers);
    } catch (error) {
      console.error("Error during refresh:", error);
      setConnectionStatus('offline');
      setHasError(true);
    }
  };

  const setupRealtimeListeners = () => {
    setConnectionStatus('connecting');

    // Check if Firebase is available
    if (!db) {
      console.warn("Firebase not available");
      setConnectionStatus('offline');
      return [];
    }

    // Set a timeout for connection attempt
    const connectionTimeout = setTimeout(() => {
      if (connectionStatus === 'connecting') {
        console.warn("Firebase connection timeout");
        setConnectionStatus('offline');
      }
    }, 10000); // 10 second timeout

    const unsubscribers: (() => void)[] = [];

    try {
      // Setup real-time listeners with enhanced error handling
      const safeOnSnapshot = (collectionName: string, setter: (data: any[]) => void) => {
        try {
          const unsubscribe = onSnapshot(
            collection(db, collectionName),
            (snapshot) => {
              try {
                const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setter(data);
                if (connectionStatus !== 'connected') {
                  setConnectionStatus('connected');
                  clearTimeout(connectionTimeout);
                }
              } catch (error) {
                console.warn(`Error processing ${collectionName} snapshot:`, error);
                setConnectionStatus('offline');
              }
            },
            (error) => {
              console.warn(`${collectionName} listener error:`, error);
              setConnectionStatus('offline');
              clearTimeout(connectionTimeout);

              // Check if it's a network error
              if (error.code === 'unavailable' || error.message?.includes('Failed to fetch')) {
                console.warn(`Network error for ${collectionName}, will retry connection later`);
              }
            }
          );
          return unsubscribe;
        } catch (error) {
          console.error(`Failed to create listener for ${collectionName}:`, error);
          setConnectionStatus('offline');
          clearTimeout(connectionTimeout);
          return () => {}; // Return empty function as fallback
        }
      };

      // Create listeners with error boundaries
      const projectsUnsub = safeOnSnapshot("projects", setProjects);
      const tasksUnsub = safeOnSnapshot("tasks", setTasks);
      const teamsUnsub = safeOnSnapshot("teams", setTeams);
      const employeesUnsub = safeOnSnapshot("employees", setEmployees);

      unsubscribers.push(projectsUnsub, tasksUnsub, teamsUnsub, employeesUnsub);

      return unsubscribers;
    } catch (error) {
      console.error("Error setting up listeners:", error);
      setConnectionStatus('offline');
      clearTimeout(connectionTimeout);
      return [];
    }
  };

  // State for card filter and project summary modal
  const [cardFilter, setCardFilter] = useState<string | null>(null);
  const [showProjectSummary, setShowProjectSummary] = useState(false);
  
  // Check for filter from Analytics page
  useEffect(() => {
    // Check if there's a filter set from Analytics page
    const savedFilter = localStorage.getItem('dashboardFilter');
    if (savedFilter) {
      setCardFilter(savedFilter);
      localStorage.removeItem('dashboardFilter'); // Clear it after use
    }
  }, []);

  // Filter tasks with enhanced search functionality
  const filteredTasks = tasks.filter((task) => {
    // Apply card filter first
    if (cardFilter && task.status !== cardFilter) return false;
    
    if (selectedProject && task.projectId !== selectedProject) return false;
    if (filterDate && !task.dueDate?.includes(filterDate)) return false;
    
    // Enhanced search functionality
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const taskTitle = task.title?.toLowerCase() || '';
      const taskStatus = task.status?.toLowerCase() || '';
      const taskAssignee = task.assignee?.toLowerCase() || '';
      const taskDescription = task.description?.toLowerCase() || '';
      
      // Search in title, status, assignee, and description
      const matchesSearch = taskTitle.includes(searchLower) ||
                           taskStatus.includes(searchLower) ||
                           taskAssignee.includes(searchLower) ||
                           taskDescription.includes(searchLower);
      
      // Special handling for status keywords
      const statusKeywords = {
        'pending': 'pending',
        'done': 'completed',
        'complete': 'completed',
        'completed': 'completed',
        'progress': 'in-progress',
        'active': 'in-progress',
        'ongoing': 'in-progress'
      };
      
      const statusMatch = Object.entries(statusKeywords).some(([keyword, status]) => 
        searchLower.includes(keyword) && taskStatus === status
      );
      
      return matchesSearch || statusMatch;
    }
    
    return true;
  });

  // Calculate task stats
  const pendingTasks = filteredTasks.filter((task) => task.status === "pending");
  const inProgressTasks = filteredTasks.filter((task) => task.status === "in-progress");
  const completedTasks = filteredTasks.filter((task) => task.status === "completed");
  const overdueTasks = filteredTasks.filter((task) => {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    const now = new Date();
    return due < now && task.status !== "completed";
  });

  // Performance metrics
  const teamEfficiency = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Chart data for pie chart
  const chartData = {
    labels: ["Completed", "In Progress", "Pending"],
    datasets: [
      {
        data: [completedTasks.length, inProgressTasks.length, pendingTasks.length],
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(245, 158, 11, 0.8)",
        ],
        borderColor: [
          "rgba(16, 185, 129, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(245, 158, 11, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Get performance label based on percentage
  const getPerformanceLabel = (percent: number) => {
    if (percent >= 80) {
      return { label: "Excellent", color: "bg-green-500 dark:bg-green-600" };
    } else if (percent >= 60) {
      return { label: "Good", color: "bg-blue-500 dark:bg-blue-600" };
    } else if (percent >= 40) {
      return { label: "Average", color: "bg-yellow-500 dark:bg-yellow-600" };
    } else {
      return { label: "Needs Improvement", color: "bg-red-500 dark:bg-red-600" };
    }
  };

  // Get employee name by ID
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee ? employee.name : "Unknown";
  };
  
  // Get project tasks by project ID
  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.project_id === projectId);
  };

  // Handle card click to filter tasks
  const handleCardClick = (status: string) => {
    setCardFilter(status === cardFilter ? null : status);
    // Store the filter in localStorage for TaskDetail page to use
    localStorage.setItem('taskStatusFilter', status);
    // Navigate to TaskDetail page with the filter
    navigate('/tasks');
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/30';
      case 'in-progress':
        return 'bg-violet-50/80 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200/60 dark:border-violet-500/30';
      case 'pending':
        return 'bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/30';
      case 'overdue':
        return 'bg-red-50/80 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-500/30';
      default:
        return 'bg-gray-50/80 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200/60 dark:border-gray-500/30';
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
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Connection Error</h3>
          <p className="text-sm text-violet-600/70 dark:text-violet-300/70 mb-4">
            Unable to connect to the database. Please check your internet connection.
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

  return (
    <div className="h-full bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex flex-col relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-violet-200/20 to-purple-200/20 dark:from-violet-900/10 dark:to-purple-900/10 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-violet-200/20 dark:from-indigo-900/10 dark:to-violet-900/10 rounded-full blur-3xl opacity-60"></div>
      </div>

      {/* Compact Header */}
      <div className="relative z-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-violet-200/50 dark:border-violet-500/20 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-xs text-violet-600/70 dark:text-violet-300/70 font-medium">
                  Real-time insights
                </p>
              </div>
            </div>
            
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-sm flex items-center gap-2 ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/30'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/30'
                  : 'bg-gray-50/80 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200/60 dark:border-gray-500/30'
              }`}
              title={
                connectionStatus === 'offline' ?
                  `Connection failed${retryCount > 0 ? ` (${retryCount} ${retryCount === 1 ? 'retry' : 'retries'})` : ''}` :
                  ''
              }
            >
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500' :
                connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                'bg-gray-500'
              }`}></div>
              {connectionStatus === 'connected' ? 'Live' :
               connectionStatus === 'connecting' ? 'Connecting' :
               hasError ? 'Error' : 'Offline'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={connectionStatus === 'connecting'}
              className="p-2 bg-white/70 dark:bg-slate-800/70 text-violet-600 dark:text-violet-300 hover:bg-violet-100/70 dark:hover:bg-violet-700/40 border border-violet-200/60 dark:border-violet-500/30 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-sm backdrop-blur-sm"
            >
              <Activity className={`w-4 h-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
            </button>
            
          </div>
        </div>

        {/* Compact Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-violet-100/60 dark:bg-violet-500/10 px-3 py-2 rounded-xl border border-violet-200/60 dark:border-violet-500/30 backdrop-blur-sm">
                <Activity className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span className="text-sm font-bold text-violet-700 dark:text-violet-300">Overview</span>
              </div>
              
             
            
            {/* Compact Project Dropdown */}
            <div className="relative z-20">
              
              <AnimatePresence>
                {projectOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-white/95 dark:bg-slate-800/95 border border-violet-200/60 dark:border-violet-500/30 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-xl"
                  >
                    <div className="p-3 border-b border-violet-100/60 dark:border-violet-700/30">
                      <p className="text-sm font-bold text-violet-800 dark:text-violet-200">Recent Projects</p>
                    </div>
                    <div className="p-2 max-h-48 overflow-y-auto">
                      {projects.slice(0, 3).map((project: any) => (
                        <button
                          key={project.id}
                          onClick={() => {
                            setSelectedProject(project.id);
                            setProjectOpen(false);
                            // Navigate to project dashboard
                            navigate(`/project-dashboard/${project.id}`);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-500/20 dark:to-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Briefcase className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="flex-1">
                              <span className="text-sm text-slate-800 dark:text-white font-medium">{project.name}</span>
                              <p className="text-xs text-violet-600/70 dark:text-violet-300/70 mt-1">
                                {project.description || 'No description'}
                              </p>
                            </div>
                            <ChevronDown className="w-3 h-3 text-violet-400 rotate-[-90deg] group-hover:translate-x-1 transition-transform" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Compact Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-violet-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white/70 dark:bg-slate-800/70 border border-violet-200/60 dark:border-violet-500/30 rounded-xl text-violet-800 dark:text-violet-200 placeholder-violet-400 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm backdrop-blur-sm w-48"
              />
            </div>
            
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="p-2 bg-white/70 dark:bg-slate-800/70 text-violet-700 dark:text-violet-300 hover:bg-violet-100/70 dark:hover:bg-violet-700/40 border border-violet-200/60 dark:border-violet-500/30 rounded-xl transition-all duration-200 shadow-sm backdrop-blur-sm"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6"> 
          {/* Show Total Projects only if not showing completed tasks */} 
          
          

        </div> 
        {showProjectSummary && ( 
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-2 sm:p-4"> 
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-5xl mx-auto overflow-auto max-h-[90vh]"> 
              {/* Header */} 
              <div className="flex justify-between items-center border-b p-3 sm:p-4 sticky top-0 bg-white dark:bg-gray-900 z-10"> 
                <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200"> 
                  Project Summary 
                </h2> 
                <button 
                  onClick={() => setShowProjectSummary(false)} 
                  className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-1" 
                > 
                  ✕ 
                </button> 
              </div> 

              {/* Table */} 
             
            </div> 
          </div> 
        )}
        
        {/* Project Cards */}
        
        {/* Compact Stats Cards */}
        <div className="relative z-10 px-2">
        {cardFilter && (
          <div className="flex justify-end mb-2">
            <button 
              onClick={() => setCardFilter(null)}
              className="px-3 py-1 text-xs font-medium bg-white/70 dark:bg-slate-800/70 text-violet-600 dark:text-violet-300 hover:bg-violet-100/70 dark:hover:bg-violet-700/40 border border-violet-200/60 dark:border-violet-500/30 rounded-lg transition-all duration-200 shadow-sm backdrop-blur-sm flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filter
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            {
              title: "Projects",
              value: projects.length,
              icon: Briefcase,
              color: "violet",
              gradient: "from-violet-500 to-purple-600",
              change: "+12%",
              changeIcon: TrendingUp
            },
            {
              title: "Pending",
              value: pendingTasks.length,
              icon: Clock,
              color: "amber",
              gradient: "from-amber-500 to-orange-600",
              change: `${overdueTasks.length} overdue`,
              changeIcon: AlertCircle
            },
            {
              title: "Total Tasks",
              value: tasks.length,
              icon: ListChecks,
              color: "blue",
              gradient: "from-blue-500 to-cyan-600",
              change: `${tasks.length > 0 ? Math.round((inProgressTasks.length / tasks.length) * 100) : 0}%`,
              changeIcon: Zap
            },
            {
              title: "Done",
              value: completedTasks.length,
              icon: CheckCircle,
              color: "emerald",
              gradient: "from-emerald-500 to-green-600",
              change: `${teamEfficiency}%`,
              changeIcon: Target
            },
            {
              title: "Overdue",
              value: overdueTasks.length,
              icon: AlertCircle,
              color: "red",
              gradient: "from-red-500 to-rose-600",
              change: `${Math.round((overdueTasks.length / tasks.length) * 100)}% of total`,
              changeIcon: Percent
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-2 ${cardFilter === (stat.title === 'Pending' ? 'pending' : stat.title === 'Active' ? 'in-progress' : stat.title === 'Done' ? 'completed' : stat.title === 'Overdue' ? 'overdue' : null) ? `border-${stat.color}-500 dark:border-${stat.color}-400` : 'border-purple-500/50 dark:border-purple-500/30'} rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer`}
              onClick={() => {
                switch (stat.title) {
                  case 'Projects':
                    navigate('/projects');
                    break;
                  case 'Pending':
                    handleCardClick('pending');
                    break;
                  case 'Active':
                    handleCardClick('in-progress');
                    break;
                  case 'Done':
                    handleCardClick('completed');
                    break;
                  case 'Overdue':
                    handleCardClick('overdue');
                    break;
                  default:
                    navigate('/Analytics');
                }
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-md group-hover:shadow-lg transition-shadow`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 bg-${stat.color}-50/80 dark:bg-${stat.color}-500/10 rounded-lg border-2 border-${stat.color}-500/50 dark:border-${stat.color}-500/30`}>
                  <stat.changeIcon className={`w-3 h-3 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  <span className={`text-xs font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-violet-600/70 dark:text-violet-300/70 mb-1">
                    {stat.title}
                  </p>
                  {cardFilter === (stat.title === 'Pending' ? 'pending' : stat.title === 'Active' ? 'in-progress' : stat.title === 'Done' ? 'completed' : null) && (
                    <span className={`text-xs font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>Filtered</span>
                  )}
                </div>
                <p className="text-2xl font-black text-slate-800 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Compact Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Task Distribution - More Compact */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-2 border-purple-500/50 dark:border-purple-500/30 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Task Status</h3>
                <p className="text-xs text-violet-600/70 dark:text-violet-300/70">Distribution</p>
              </div>
            </div>
            <div className="h-40 flex items-center justify-center">
              <Doughnut
                data={{
                  labels: ['Done', 'Active', 'Pending'],
                  datasets: [
                    {
                      data: [completedTasks.length, inProgressTasks.length, pendingTasks.length],
                      backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                      ],
                      borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(245, 158, 11, 1)',
                      ],
                      borderWidth: 2,
                      hoverOffset: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: { size: 11, weight: 'bold' },
                      },
                    },
                  },
                }}
              />
            </div>
          </motion.div>

          {/* Team Performance - Compact */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-2 border-purple-500/50 dark:border-purple-500/30 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Team Metrics</h3>
                <p className="text-xs text-violet-600/70 dark:text-violet-300/70">Performance</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-violet-700 dark:text-violet-300">Efficiency</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">{teamEfficiency}%</span>
                </div>
                <div className="w-full bg-violet-200/40 dark:bg-violet-700/30 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${teamEfficiency}%` }}
                    transition={{ delay: 0.7, duration: 1 }}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full"
                  ></motion.div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-purple-500/50 dark:border-purple-500/30">
                <div className="text-center">
                  <p className="text-lg font-black text-slate-800 dark:text-white">{teams.length}</p>
                  <p className="text-xs text-violet-600/70 dark:text-violet-300/70">Teams</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-slate-800 dark:text-white">{employees.length}</p>
                  <p className="text-xs text-violet-600/70 dark:text-violet-300/70">Members</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity - Compact */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-2 border-purple-500/50 dark:border-purple-500/30 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Activity</h3>
                  <p className="text-xs text-violet-600/70 dark:text-violet-300/70">
                    {cardFilter ? 
                      cardFilter === 'pending' ? 'Pending Tasks' : 
                      cardFilter === 'in-progress' ? 'Active Tasks' : 
                      cardFilter === 'completed' ? 'Completed Tasks' : 'Recent' 
                    : 'Recent'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowAllTasks(!showAllTasks)}
                className="text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
              >
                {showAllTasks ? 'Less' : 'More'}
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(showAllTasks ? filteredTasks : filteredTasks.slice(0, 5)).map((task: any, index) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-gray-50/60 dark:bg-slate-700/40 hover:bg-violet-50/60 dark:hover:bg-violet-500/10 rounded-lg transition-colors group cursor-pointer"
                  onClick={() => navigate(`/task/${task.id}`)}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    task.status === 'completed' ? 'bg-emerald-500' :
                    task.status === 'in-progress' ? 'bg-violet-500' :
                    'bg-amber-500'
                  }`}></div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-white truncate">
                      {task.title || 'Untitled Task'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-violet-600/70 dark:text-violet-300/70">
                        {task.assignee || 'Unassigned'}
                      </p>
                      {task.dueDate && (
                        <span className="text-xs text-amber-600/70 dark:text-amber-400/70">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${getStatusBadgeStyle(task.status)}`}>
                    {task.status === 'in-progress' ? 'Active' : task.status === 'completed' ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

            {filteredTasks.length === 0 && (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                <p className="text-xs text-violet-600/70 dark:text-violet-300/70">No tasks found</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Additional Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Quick Actions</h3>
                <p className="text-xs text-violet-600/70 dark:text-violet-300/70">Common tasks</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/tasks')}
                className="p-3 bg-violet-50/60 dark:bg-violet-500/10 rounded-xl border border-violet-200/60 dark:border-violet-500/30 hover:bg-violet-100/60 dark:hover:bg-violet-500/20 transition-colors group"
              >
                <div className="text-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-violet-700 dark:text-violet-300">View Tasks</p>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/projects')}
                className="p-3 bg-blue-50/60 dark:bg-blue-500/10 rounded-xl border border-blue-200/60 dark:border-blue-500/30 hover:bg-blue-100/60 dark:hover:bg-blue-500/20 transition-colors group"
              >
                <div className="text-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Projects</p>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/analytics')}
                className="p-3 bg-emerald-50/60 dark:bg-emerald-500/10 rounded-xl border border-emerald-200/60 dark:border-emerald-500/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-500/20 transition-colors group"
              >
                <div className="text-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Analytics</p>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/calendar')}
                className="p-3 bg-amber-50/60 dark:bg-amber-500/10 rounded-xl border border-amber-200/60 dark:border-amber-500/30 hover:bg-amber-100/60 dark:hover:bg-amber-500/20 transition-colors group"
              >
                <div className="text-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Calendar</p>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Recent Updates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Updates</h3>
                <p className="text-xs text-violet-600/70 dark:text-violet-300/70">Latest changes</p>
              </div>
            </div>
            
            <div className="space-y-3 max-h-32 overflow-y-auto">
              {[
                { type: 'task', message: `${completedTasks.length} tasks completed this week`, color: 'emerald' },
                { type: 'project', message: `${projects.length} active projects`, color: 'violet' },
                { type: 'team', message: `${teams.length} teams working`, color: 'blue' },
                { type: 'performance', message: `${teamEfficiency}% overall efficiency`, color: 'amber' }
              ].map((update, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50/60 dark:bg-slate-700/40 rounded-lg">
                  <div className={`w-2 h-2 rounded-full bg-${update.color}-500`}></div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{update.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      </div>
      
      {showModal && selectedTask && ( 
        <div className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 flex items-center justify-center z-50 px-4 transition-opacity"> 
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-6xl p-6 relative grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[90vh] overflow-y-auto animate-fadeIn"> 
            <button 
              onClick={() => setSelectedTask(null)} 
              className="absolute top-2 right-4 text-2xl text-gray-500 dark:text-gray-300 hover:text-red-500" 
            > 
              &times; 
            </button> 

            <div className="col-span-2 space-y-4"> 
              <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400"> 
                {selectedTask.title} 
              </h2> 
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300"> 
                <p> 
                  <strong>📁 Project:</strong>{" "} 
                  {getProjectName(selectedTask.project_id)} 
                </p> 
                <p> 
                  <strong>Status:</strong> {statusTitles[selectedTask.status]} 
                </p> 
                <p> 
                  <strong>Due Date:</strong> {selectedTask.due_date} 
                </p> 
                <p> 
                  <strong>Progress:</strong>{" "} 
                  {selectedTask.progress_status || "—"} 
                </p> 
                <p> 
                  <strong>Review:</strong> {selectedTask.reviewpoints || "—"} 
                  <div className="flex mt-1"> 
                    {Array.from({ length: 5 }).map((_, index) => { 
                      const isFilled = 
                        selectedTask.reviewpoints >= (index + 1) * 20; 
                      return ( 
                        <svg 
                          key={index} 
                          className={`w-4 h-4 ${ 
                            isFilled ? "text-yellow-400" : "text-gray-300" 
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20" 
                        > 
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.948a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.443a1 1 0 00-.364 1.118l1.287 3.948c.3.921-.755 1.688-1.538 1.118l-3.36-2.443a1 1 0 00-1.175 0l-3.36 2.443c-.783.57-1.838-.197-1.538-1.118l1.287-3.948a1 1 0 00-.364-1.118L2.075 9.375c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.948z" /> 
                        </svg> 
                      ); 
                    })} 
                  </div> 
                </p> 
                <p> 
                  <strong>Assigned:</strong>{" "} 
                  {getEmployeeName(selectedTask.assigned_to)} 
                </p> 
                <p> 
                  <strong>Created By:</strong>{" "} 
                  {getEmployeeName(selectedTask.created_by)} 
                </p> 
                <p> 
                  <strong>Created At:</strong>{" "} 
                  {new Date( 
                    selectedTask.created_at?.seconds * 1000 
                  ).toLocaleString()} 
                </p> 
                {selectedTask.progress_updated_at && ( 
                  <p> 
                    <strong>Progress Updated:</strong>{" "} 
                    {new Date( 
                      selectedTask.progress_updated_at.seconds * 1000 
                    ).toLocaleString()} 
                  </p> 
                )} 
              </div> 

              <div> 
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1"> 
                  Description 
                </h3> 
                <div className="bg-gray-50 dark:bg-zinc-800 p-3 rounded border text-sm whitespace-pre-wrap"> 
                  {selectedTask.description || "—"} 
                </div> 
              </div> 

              <div> 
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1"> 
                  Progress Notes 
                </h3> 
                <div className="bg-gray-50 dark:bg-zinc-800 p-3 rounded border text-sm whitespace-pre-wrap"> 
                  {selectedTask.progress_description || "—"} 
                </div> 
                {selectedTask.progress_link && ( 
                  <a 
                    href={selectedTask.progress_link} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-600 dark:text-blue-300 underline text-sm mt-2 inline-block" 
                  > 
                    🔗 View Progress Link 
                  </a> 
                )} 
              </div> 
            </div> 
            
            <div className="col-span-1 space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg border border-indigo-100 dark:border-indigo-700/30">
                <h3 className="font-medium text-indigo-800 dark:text-indigo-300 mb-2">Task Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {selectedTask.priority || "Medium"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Task ID:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {selectedTask.task_id}
                    </span>
                  </div>
                  {selectedTask.tags && (
                    <div className="mt-3">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTask.tags.split(',').map((tag, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-indigo-100 dark:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300 rounded text-xs"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700/30">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Created</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(selectedTask.created_at?.seconds * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {selectedTask.progress_updated_at && (
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                      <div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Progress Updated</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(selectedTask.progress_updated_at.seconds * 1000).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5"></div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Due Date</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedTask.due_date}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Comments */} 
              <div className="col-span-1 flex flex-col h-full"> 
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2"> 
                  💬 Comments 
                </h3> 
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px]"> 
                  {Array.isArray(selectedTask.comments) && 
                  selectedTask.comments.length > 0 ? ( 
                    selectedTask.comments.map((comment, index) => ( 
                      <div 
                        key={index} 
                        className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm rounded-lg p-3 text-sm transition" 
                      > 
                        <div className="flex items-center gap-2 mb-1"> 
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs"> 
                            {getEmployeeName(comment.userId)?.[0] || "U"} 
                          </div> 
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-100"> 
                            {getEmployeeName(comment.userId)} 
                          </div> 
                        </div> 
                        <div className="text-gray-700 dark:text-gray-200"> 
                          {comment.text} 
                        </div> 
                        <div className="text-xs text-right text-gray-500 dark:text-gray-400 mt-2"> 
                          {new Date(comment.timestamp).toLocaleString()} 
                        </div> 
                      </div> 
                    )) 
                  ) : ( 
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic"> 
                      No comments yet. 
                    </p> 
                  )} 
                </div> 
  
                <div className="mt-4"> 
                  <textarea 
                    rows={3} 
                    className="w-full p-2 border rounded-md text-sm bg-white dark:bg-zinc-800 dark:border-zinc-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-indigo-300" 
                    placeholder="Write a comment..." 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)} 
                  /> 
                  <button 
                    onClick={handleAddComment} 
                    disabled={commentLoading || !newComment.trim()} 
                    className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded w-full disabled:opacity-50 transition" 
                  > 
                    {commentLoading ? "Saving..." : "Post Comment"} 
                  </button> 
                </div> 
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setNewComment("");
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div> 
        </div> 
      )}
    </div>
  );
};

export default Dashboard;
