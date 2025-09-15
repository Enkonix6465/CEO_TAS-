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
  if (!employeeId) return 'Unknown';
  const employee = employees.find(e => e.id === employeeId || e.uid === employeeId);
  if (employee) {
    if (employee.fullName) return employee.fullName;
    if (employee.firstName && employee.lastName) return `${employee.firstName} ${employee.lastName}`;
    if (employee.name) return employee.name;
    if (employee.displayName) return employee.displayName;
    if (employee.email) return employee.email;
    return employee.id || employee.uid || 'User';
  }
  return employeeId === 'admin' ? 'Admin' : employeeId;
};

// Function to get team name by ID (will be moved inside component)

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showProjectSummary, setShowProjectSummary] = useState(false);
  const [detailedProject, setDetailedProject] = useState<any>(null);

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

  // Function to get employee name by ID
  const getEmployeeName = (empId: string) => {
    if (!empId) return 'Unknown';
    const employee = employees.find(emp => emp.id === empId || emp.uid === empId);
    if (employee) {
      if (employee.fullName) return employee.fullName;
      if (employee.firstName && employee.lastName) return `${employee.firstName} ${employee.lastName}`;
      if (employee.name) return employee.name;
      if (employee.displayName) return employee.displayName;
      if (employee.email) return employee.email;
      return employee.id || employee.uid || 'User';
    }
    return empId === 'admin' ? 'Admin' : empId;
  };

  // Function to get performance label
  const getPerformanceLabel = (percent: number) => {
    if (percent >= 90) return { label: "Excellent", color: "bg-green-600" };
    if (percent >= 70) return { label: "Good", color: "bg-yellow-500" };
    if (percent >= 50) return { label: "Average", color: "bg-orange-500" };
    return { label: "Poor", color: "bg-red-600" };
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
  
  // Import overdue utility functions
  const { isTaskOverdue, getOverdueTasks, getOverdueCount } = (() => {
    // Inline utility functions to maintain consistency
    const isTaskOverdue = (task: any): boolean => {
      if (!task || task.status === 'completed' || task.status === 'cancelled' || task.progress_status === 'completed') {
        return false;
      }

      const dueDate = task.due_date || task.dueDate;
      if (!dueDate) return false;

      try {
        let due: Date;
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
        console.warn('Error parsing due date:', dueDate, error);
        return false;
      }
    };

    const getOverdueTasks = (tasks: any[]): any[] => {
      return Array.isArray(tasks) ? tasks.filter(isTaskOverdue) : [];
    };

    const getOverdueCount = (tasks: any[]): number => {
      return getOverdueTasks(tasks).length;
    };

    return { isTaskOverdue, getOverdueTasks, getOverdueCount };
  })();
  
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

      // Also fetch users collection and merge with employees
      const usersUnsub = safeOnSnapshot("users", (users) => {
        setEmployees(prev => {
          // Merge users with employees, avoid duplicates
          const existingIds = prev.map(emp => emp.id);
          const newUsers = users.filter(user => !existingIds.includes(user.id) && !existingIds.includes(user.uid));
          return [...prev, ...newUsers];
        });
      });

      unsubscribers.push(projectsUnsub, tasksUnsub, teamsUnsub, employeesUnsub, usersUnsub);

      return unsubscribers;
    } catch (error) {
      console.error("Error setting up listeners:", error);
      setConnectionStatus('offline');
      clearTimeout(connectionTimeout);
      return [];
    }
  };

  // State for card filter
  const [cardFilter, setCardFilter] = useState<string | null>(null);
  
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
  const inProgressTasks = filteredTasks.filter((task) => task.status === "in-progress" || task.status === "in_progress");
  const completedTasks = filteredTasks.filter((task) => task.status === "completed");
  const overdueTasks = getOverdueTasks(filteredTasks);

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

  
 
  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.project_id === projectId);
  };

 
  const handleCardClick = (status: string) => {
    setCardFilter(status === cardFilter ? null : status);

    // Use both localStorage and React Router state for better reliability
    localStorage.setItem('taskStatusFilter', status);

    navigate('/tasks', {
      state: {
        filterStatus: status,
        fromDashboard: true
      }
    });
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
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
              title: "In Progress",
              value: inProgressTasks.length,
              icon: Activity,
              color: "blue",
              gradient: "from-blue-500 to-indigo-600",
              change: `${tasks.length > 0 ? Math.round((inProgressTasks.length / tasks.length) * 100) : 0}% of total`,
              changeIcon: TrendingUp
            },
            {
              title: "Total Tasks",
              value: tasks.length,
              icon: ListChecks,
              color: "cyan",
              gradient: "from-cyan-500 to-blue-600",
              change: `${tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}% done`,
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
              className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-2 ${cardFilter === (stat.title === 'Pending' ? 'pending' : stat.title === 'Active' ? 'in-progress' : stat.title === 'Done' ? 'completed' : stat.title === 'Overdue' ? 'overdue' : null) ? `border-${stat.color}-500 dark:border-${stat.color}-400` : 'border-violet-200/50 dark:border-violet-500/30'} rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer`}
              onClick={() => {
                switch (stat.title) {
                  case 'Projects':
                    setShowProjectSummary(true);
                    break;
                  case 'Pending':
                    handleCardClick('pending');
                    break;
                  case 'In Progress':
                    handleCardClick('in-progress');
                    break;
                  case 'Total Tasks':
                    handleCardClick('all');
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
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-2 border-violet-200/50 dark:border-violet-500/30 rounded-2xl p-4 shadow-lg"
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
                  labels: ['Done', 'In Progress', 'Pending'],
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
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-2 border-violet-200/50 dark:border-violet-500/30 rounded-2xl p-4 shadow-lg"
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
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-2 border-violet-200/50 dark:border-violet-500/30 rounded-2xl p-4 shadow-lg"
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
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-2 border-violet-200/50 dark:border-violet-500/30 rounded-2xl p-4 shadow-lg"
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
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-2 border-violet-200/50 dark:border-violet-500/30 rounded-2xl p-4 shadow-lg"
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

      {/* Project Summary Modal */}
      {showProjectSummary && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-5xl mx-4">
            {/* Header */}
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Project Summary
              </h2>
              <button
                onClick={() => setShowProjectSummary(false)}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Table */}
            <div className="p-6">
  <div className="overflow-x-auto overflow-y-auto max-h-[400px] rounded-lg border border-gray-200 dark:border-gray-700">
    <table className="min-w-full text-base text-left border-collapse">

                <thead className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-lg">
                  <tr>
                    <th className="p-4 border border-gray-300 dark:border-gray-600">Project Name</th>
                    <th className="p-4 border border-gray-300 dark:border-gray-600">Team Leader</th>
                    <th className="p-4 border border-gray-300 dark:border-gray-600">Total Tasks</th>
                    <th className="p-4 border border-gray-300 dark:border-gray-600">Completed</th>
                    <th className="p-4 border border-gray-300 dark:border-gray-600">Pending</th>
                    <th className="p-4 border border-gray-300 dark:border-gray-600">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => {
                    const projectTasks = tasks.filter(
                      (t) => t.project_id === project.id || t.projectId === project.id
                    );
                    const completed = projectTasks.filter(
                      (t) => t.status === "completed"
                    ).length;
                    const pending = projectTasks.filter(
                      (t) => t.status === "pending"
                    ).length;
                    const total = projectTasks.length;
                    const percent =
                      total > 0 ? Math.round((completed / total) * 100) : 0;
                    const performance = getPerformanceLabel(percent);

                    return (
                      <tr
                        key={project.id}
                        className="border-t hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td
                          className="p-4 text-blue-600 underline cursor-pointer font-semibold border border-gray-300 dark:border-gray-600"
                          onClick={() => setDetailedProject(project)}
                        >
                          {project.name}
                        </td>
                        <td
                          className="p-4 font-medium border border-gray-300 dark:border-gray-600 cursor-pointer text-blue-600 hover:underline"
                          onClick={() => navigate(`/PerformMatrix?empId=${project.created_by || project.teamLeader}`)}
                        >
                          {getEmployeeName(project.created_by || project.teamLeader)}
                        </td>

                        {/* Clickable Cells */}
                        <td
                          className="p-4 cursor-pointer text-blue-600 hover:underline border border-gray-300 dark:border-gray-600"
                          onClick={() =>
                            navigate("/tasks", {
                              state: {
                                projectFilter: project.id,
                                defaultFilter: "all",
                              },
                            })
                          }
                        >
                          {total}
                        </td>
                        <td
                          className="p-4 cursor-pointer text-blue-600 hover:underline border border-gray-300 dark:border-gray-600"
                          onClick={() =>
                            navigate("/tasks", {
                              state: {
                                projectFilter: project.id,
                                defaultFilter: "completed",
                              },
                            })
                          }
                        >
                          {completed}
                        </td>

                        <td
                          className="p-4 cursor-pointer text-blue-600 hover:underline border border-gray-300 dark:border-gray-600"
                          onClick={() =>
                            navigate("/tasks", {
                              state: {
                                projectFilter: project.id,
                                defaultFilter: "pending",
                              },
                            })
                          }
                        >
                          {pending}
                        </td>

                        <td className="p-4 border border-gray-300 dark:border-gray-600">
                          <span
                            className={`px-3 py-1 rounded-full text-white text-sm ${performance.color}`}
                          >
                            {performance.label} ({percent}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Detailed Project Modal */}
              {detailedProject && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-auto">
                  <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-8 relative border border-violet-200/50 dark:border-violet-500/30">
                    <button
                      onClick={() => setDetailedProject(null)}
                      className="absolute top-4 right-6 text-gray-600 dark:text-gray-300 hover:text-red-500 text-3xl font-bold"
                      aria-label="Close details modal"
                    >
                      &times;
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m5 0v-4a1 1 0 011-1h2a1 1 0 011 1v4M7 7h10M7 11h6" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                          {detailedProject.name}
                        </h2>
                        <p className="text-violet-600/70 dark:text-violet-300/70 text-sm mt-1">
                          Project Details & Team Overview
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-violet-50/50 dark:bg-violet-900/20 rounded-2xl p-6 border border-violet-200/50 dark:border-violet-500/30">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Project Information
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Description:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{detailedProject.description || 'No description'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Start Date:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{detailedProject.startDate || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Deadline:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{detailedProject.deadline || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Created By:</span>
                            <span
                              className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline"
                              onClick={() => navigate(`/PerformMatrix?empId=${detailedProject.created_by}`)}
                            >
                              {getEmployeeName(detailedProject.created_by)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Team:</span>
                            <span className="text-slate-800 dark:text-white font-medium">{getTeamName(detailedProject.teamId)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-500/30">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Task Statistics
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tasks.filter(t => t.project_id === detailedProject.id || t.projectId === detailedProject.id).length}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Total Tasks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{tasks.filter(t => (t.project_id === detailedProject.id || t.projectId === detailedProject.id) && t.status === 'completed').length}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{tasks.filter(t => (t.project_id === detailedProject.id || t.projectId === detailedProject.id) && t.status === 'pending').length}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Pending</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{tasks.filter(t => (t.project_id === detailedProject.id || t.projectId === detailedProject.id) && t.status === 'in_progress').length}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">In Progress</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-500/30">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Team Members
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {teams
                          .find((t) => t.id === detailedProject.teamId)
                          ?.members?.map((memberId: string) => (
                            <div
                              key={memberId}
                              className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-800/30 transition-colors group border border-emerald-200/30 dark:border-emerald-500/20"
                              onClick={() => navigate(`/PerformMatrix?empId=${memberId}`)}
                            >
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                {getEmployeeName(memberId).charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                  {getEmployeeName(memberId)}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  Click to view performance
                                </div>
                              </div>
                              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          )) || (
                            <div className="col-span-2 text-center py-8 text-slate-500 dark:text-slate-400">
                              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              No team members found
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
            </div>  
        </div>
      )}
    </div>
  );
};

export default Dashboard;
