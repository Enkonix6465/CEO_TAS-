import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConnected } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
import { Bar, Doughnut, Line } from 'react-chartjs-2';

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
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

  // Filter tasks with enhanced search functionality
  const filteredTasks = tasks.filter((task) => {
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

      {/* Compact Stats Cards */}
      <div className="relative z-10 px-6 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              change: `${overdueTasks.length}`,
              changeIcon: AlertCircle
            },
            {
              title: "Active",
              value: inProgressTasks.length,
              icon: Activity,
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
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-md group-hover:shadow-lg transition-shadow`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 bg-${stat.color}-50/80 dark:bg-${stat.color}-500/10 rounded-lg border border-${stat.color}-200/60 dark:border-${stat.color}-500/30`}>
                  <stat.changeIcon className={`w-3 h-3 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  <span className={`text-xs font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-medium text-violet-600/70 dark:text-violet-300/70 mb-1">
                  {stat.title}
                </p>
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
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-4 shadow-lg"
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
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-4 shadow-lg"
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

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-violet-200/50 dark:border-violet-500/20">
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
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Activity</h3>
                  <p className="text-xs text-violet-600/70 dark:text-violet-300/70">Recent</p>
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
                  onClick={() => navigate(`/tasks/${task.id}`)}
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
  );
};

export default Dashboard;
