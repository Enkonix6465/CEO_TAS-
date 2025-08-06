import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Settings,
  Share2,
  Search,
  Filter,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  TrendingUp,
  Activity,
  Target,
  Briefcase,
  ArrowUpDown,
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
import { PerformanceGraph } from "../components/PerformanceGraph";

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
  
  // Navigation button states
  const [projectOpen, setProjectOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [trackStatus, setTrackStatus] = useState('on-track');

  useEffect(() => {
    const newUnsubscribers = setupRealtimeListeners();
    setUnsubscribers(newUnsubscribers);
    
    // Return cleanup function
    return () => {
      if (Array.isArray(newUnsubscribers)) {
        newUnsubscribers.forEach(unsub => {
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
  }, []);

  const handleRefresh = () => {
    if (connectionStatus === 'connecting') return;
    
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
  };

  const setupRealtimeListeners = () => {
    setConnectionStatus('connecting');

    try {
      // Setup real-time listeners for all collections
      const projectsUnsub = onSnapshot(
        collection(db, "projects"),
        (snapshot) => {
          setProjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setConnectionStatus('connected');
        },
        (error) => {
          console.warn("Projects listener error:", error);
      setConnectionStatus('offline');
        }
      );

      const tasksUnsub = onSnapshot(
        collection(db, "tasks"),
        (snapshot) => {
          setTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        },
        (error) => {
          console.warn("Tasks listener error:", error);
        }
      );

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

      // Store unsubscribers for cleanup
      return [projectsUnsub, tasksUnsub, teamsUnsub, employeesUnsub];
    } catch (error) {
      console.error("Failed to setup Firebase listeners:", error);
      setConnectionStatus('offline');
      return [];
    }
  };

  const getEmployeeName = (empId: string) =>
    employees.find((emp: any) => emp.id === empId)?.name || "-";
  const getTeamName = (teamId: string) =>
    teams.find((team: any) => team.id === teamId)?.teamName || "-";
  const getProjectTasks = (projectId: string) =>
    tasks.filter((t: any) => t.project_id === projectId);

  const filteredTasks = tasks.filter((task: any) => {
    const matchesDate = filterDate ? task.due_date === filterDate : true;
    const matchesProject = selectedProject
      ? task.project_id === selectedProject
      : true;
    const matchesSearch = searchTerm
      ? task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    // Track status filtering
    let matchesTrackStatus = true;
    if (trackStatus !== 'all') {
      const today = new Date().toISOString().split("T")[0];
      const dueDate = task.due_date;
      const daysUntilDue = Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      
      switch (trackStatus) {
        case 'on-track':
          matchesTrackStatus = daysUntilDue > 2 || task.status === 'completed';
          break;
        case 'at-risk':
          matchesTrackStatus = daysUntilDue <= 2 && daysUntilDue > 0 && task.status !== 'completed';
          break;
        case 'behind':
          matchesTrackStatus = daysUntilDue < 0 && task.status !== 'completed';
          break;
        default:
          matchesTrackStatus = true;
      }
    }
    
    return matchesDate && matchesProject && matchesSearch && matchesTrackStatus;
  });

  // Sort tasks based on sortBy
  const sortedTasks = [...filteredTasks].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.created_at?.seconds * 1000).getTime() - new Date(a.created_at?.seconds * 1000).getTime();
      case 'due':
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const pendingTasks = sortedTasks.filter((t: any) => t.status === "pending");
  const completedTasks = sortedTasks.filter((t: any) => t.status === "completed");
  const inProgressTasks = sortedTasks.filter((t: any) => t.status === "in_progress");

  const isOverdue = (task: any) => {
    const today = new Date().toISOString().split("T")[0];
    return task.due_date < today && task.status !== "completed";
  };

  const overdueTasks = sortedTasks.filter(isOverdue);

  const getProjectProgress = (projectId: string) => {
    const projectTasks = getProjectTasks(projectId);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter((t: any) => t.status === "completed").length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  const recentTasks = tasks
    .sort((a: any, b: any) => new Date(b.created_at?.seconds * 1000).getTime() - new Date(a.created_at?.seconds * 1000).getTime())
    .slice(0, 5);

  // Add click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.project-dropdown')) {
        setProjectOpen(false);
      }
      if (!target.closest('.filter-dropdown')) {
        setFilterOpen(false);
      }
      if (!target.closest('.sort-dropdown')) {
        setSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate overall project health
  const calculateProjectHealth = () => {
    if (projects.length === 0) return { status: 'no-projects', text: 'No Projects', color: 'gray' };
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
    const overdueTasks = tasks.filter(isOverdue).length;
    
    if (totalTasks === 0) return { status: 'no-tasks', text: 'No Tasks', color: 'gray' };
    
    const completionRate = (completedTasks / totalTasks) * 100;
    const overdueRate = (overdueTasks / totalTasks) * 100;
    
    if (overdueRate > 20) {
      return { status: 'behind', text: 'Behind Schedule', color: 'red' };
    } else if (overdueRate > 10) {
      return { status: 'at-risk', text: 'At Risk', color: 'yellow' };
    } else if (completionRate > 80) {
      return { status: 'ahead', text: 'Ahead of Schedule', color: 'green' };
    } else {
      return { status: 'on-track', text: 'On Track', color: 'green' };
    }
  };

  const projectHealth = calculateProjectHealth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'behind':
        return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
      case 'at-risk':
        return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      case 'ahead':
        return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400';
      case 'on-track':
        return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20 flex flex-col relative overflow-hidden">


      {/* Header */}
      <div className="liquid-glass border-b border-gray-200 dark:border-purple-500/30 px-6 py-4 shadow-sm dark:shadow-purple-500/20 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-cyan-600 to-orange-600 bg-clip-text text-transparent dark:text-white">
              Dashboard Overview
            </h1>
            <span className={`px-3 py-1 text-xs rounded-full font-medium border flex items-center gap-2 ${
              connectionStatus === 'connected'
                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
                : connectionStatus === 'connecting'
                ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30'
                : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-orange-500'
              }`}></div>
              {connectionStatus === 'connected' ? 'Live Data' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </span>
            <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-purple-500/20">
              <Star className="w-4 h-4 text-gray-400 dark:text-purple-300" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={connectionStatus === 'connecting'}
              className="px-3 py-2 text-sm bg-white dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/30 border border-purple-200 dark:border-purple-500/30 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data"
            >
              <Activity className={`w-4 h-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
            </button>
            <button className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105">
              Share
            </button>
            <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-purple-500/20">
              <Settings className="w-4 h-4 text-gray-600 dark:text-purple-300" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 border-b-2 border-purple-500 pb-2">
              <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-base font-medium text-purple-600 dark:text-purple-400">Overview</span>
            </div>
            
            {/* Project Board Dropdown */}
            <div className="relative project-dropdown">
              <button
                onClick={() => setProjectOpen(!projectOpen)}
                className="flex items-center gap-1 text-xs text-gray-600 dark:text-purple-200 hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded-lg px-2 py-1.5 transition-all duration-200 hover:shadow-sm"
              >
                <span>Project Board</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {projectOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-purple-800/90 border border-gray-200 dark:border-purple-500/30 rounded shadow-lg z-[9999] p-2">
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-purple-200">Recent Projects</div>
                    {projects.slice(0, 3).map((project: any) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setSelectedProject(project.id);
                          setProjectOpen(false);
                        }}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded dark:text-purple-100"
                      >
                        📋 {project.name}
                      </button>
                    ))}
                    <hr className="my-1 border-gray-200 dark:border-purple-500/30" />
                    <button
                      onClick={() => {
                        navigate('/projects');
                        setProjectOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded text-blue-600 dark:text-purple-300"
                    >
                      📊 View All Projects
                    </button>
                    <button
                      onClick={() => {
                        navigate('/raise-project-ticket');
                        setProjectOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded text-blue-600 dark:text-purple-300"
                    >
                      + Create project
                    </button>
                  </div>
                </div>
              )}
          </div>

            {/* On Track Status */}
            <button
              onClick={() => navigate('/kanban-page')}
              className={`px-1 py-0.5 text-xs rounded ${getStatusColor(projectHealth.status)} hover:opacity-80 transition-opacity cursor-pointer`}
            >
              {projectHealth.text}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative search-input">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-purple-300" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-purple-800/60 text-gray-900 dark:text-purple-100 placeholder:dark:text-purple-300/70 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm w-full sm:w-48"
              />
            </div>

            {/* Filter */}
            <div className="relative filter-dropdown">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-purple-800 text-gray-700 dark:text-purple-300 hover:bg-gray-50 dark:hover:bg-purple-700 transition-all duration-200"
              >
                <Filter className="w-4 h-4" />
                Filter
                <ChevronDown className="w-4 h-4" />
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-purple-800 border border-gray-200 dark:border-purple-500/30 rounded z-[9999] p-3">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select 
                        className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-purple-500/30 rounded bg-white dark:bg-purple-800 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        onChange={(e) => setTrackStatus(e.target.value)}
                        value={trackStatus}
                      >
                        <option value="all">All Status</option>
                        <option value="on-track">On Track</option>
                        <option value="at-risk">At Risk</option>
                        <option value="behind">Behind</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-purple-300 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-purple-500/30 rounded bg-white dark:bg-purple-800 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-purple-300 mb-1">
                        Project
                      </label>
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-purple-500/30 rounded bg-white dark:bg-purple-800 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">All Projects</option>
                        {projects.map((project: any) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => {
                          setFilterDate("");
                          setSelectedProject("");
                          setTrackStatus("all");
                          setFilterOpen(false);
                        }}
                        className="px-2 py-1 text-xs text-gray-600 dark:text-purple-400 hover:text-gray-900 dark:hover:text-purple-200"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setFilterOpen(false)}
                        className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative sort-dropdown">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-purple-800 text-gray-700 dark:text-purple-300 hover:bg-gray-50 dark:hover:bg-purple-700 shadow-sm transition-all duration-200 hover:shadow-md dark:shadow-purple-500/20"
              >
                <ArrowUpDown className="w-4 h-4" />
                Sort
                <ChevronDown className="w-4 h-4" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-purple-800 border border-gray-200 dark:border-purple-500/30 rounded shadow-lg z-[9999] p-2">
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setSortBy('date');
                        setSortOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded dark:text-purple-100"
                    >
                      Date Created
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('due');
                        setSortOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded dark:text-purple-100"
                    >
                      Due Date
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('priority');
                        setSortOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded dark:text-purple-100"
                    >
                      Priority
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('alphabetical');
                        setSortOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded dark:text-purple-100"
                    >
                      Alphabetical
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Share */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                // You could add a toast notification here
                alert('Dashboard link copied to clipboard!');
              }}
              className="px-3 py-1.5 text-xs bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 shadow-md transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              title="Copy dashboard link"
            >
              Share
            </button>

            {/* New Task */}
            <button
              onClick={() => navigate('/tasks')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-purple-800 text-gray-700 dark:text-purple-300 hover:bg-gray-50 dark:hover:bg-purple-700 transition-all duration-200"
              title="Create new task"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>

            {/* Create Team */}
            <button
              onClick={() => navigate('/team-manager')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-purple-800 text-gray-700 dark:text-purple-300 hover:bg-gray-50 dark:hover:bg-purple-700 transition-all duration-200"
              title="Create new team"
            >
              <Users className="w-4 h-4" />
              Create Team
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status Banner */}
      {connectionStatus === 'offline' && (
        <div className="mx-4 mt-2 mb-2 px-3 py-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-orange-700 dark:text-orange-400">
              Connection lost: Using cached data
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* Performance Graph */}
        <div className="mb-8">
          <PerformanceGraph
            overallPerformance={20}
            onTimeRate={0}
            overdueTasks={0}
            avgDelay="2d"
            className="mb-6"
          />
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="liquid-glass-stats group cursor-pointer"
          >
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-purple-300/90 mb-2">
                  Total Projects
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {projects.length}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-cyan-100 to-orange-100 dark:bg-gradient-to-br dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl border border-cyan-300 dark:border-purple-500/40">
                <Briefcase className="w-7 h-7 text-cyan-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm relative z-10">
              <div className="flex items-center px-2 py-1 bg-green-500/10 dark:bg-green-500/20 rounded-full border border-green-500/20 dark:border-green-500/30">
                <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  +12%
                </span>
              </div>
              <span className="text-gray-600 dark:text-purple-300/70 ml-2">
                from last month
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="liquid-glass-stats group cursor-pointer"
          >
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-yellow-300/90 mb-1">
                  Pending Tasks
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pendingTasks.length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-500/20 rounded-xl border border-yellow-200 dark:border-yellow-500/30">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs relative z-10">
              <div className="flex items-center px-2 py-1 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-full border border-yellow-500/20 dark:border-yellow-500/30">
                <AlertCircle className="w-3 h-3 text-yellow-500 mr-1" />
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                  {overdueTasks.length} overdue
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="liquid-glass-stats group cursor-pointer"
          >
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-blue-300/90 mb-1">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {inProgressTasks.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl border border-blue-200 dark:border-blue-500/30">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-3 relative z-10">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${tasks.length > 0 ? (inProgressTasks.length / tasks.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="liquid-glass-stats group cursor-pointer"
          >
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-green-300/90 mb-1">
                  Completed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completedTasks.length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-xl border border-green-200 dark:border-green-500/30">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs relative z-10">
              <div className="flex items-center px-2 py-1 bg-green-500/10 dark:bg-green-500/20 rounded-full border border-green-500/20 dark:border-green-500/30">
                <Target className="w-3 h-3 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
                </span>
              </div>
              <span className="text-gray-600 dark:text-green-300/70 ml-2">
                completion rate
              </span>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Task Status Distribution */}
          <div className="liquid-glass-card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Task Status Distribution
            </h3>
            <div className="h-64 flex items-center justify-center">
              <Doughnut
                data={{
                  labels: ['Completed', 'In Progress', 'Pending'],
                  datasets: [
                    {
                      data: [completedTasks.length, inProgressTasks.length, pendingTasks.length],
                      backgroundColor: [
                        'rgba(0, 212, 255, 0.9)', // Neon Blue
                        'rgba(255, 102, 0, 0.9)', // Neon Orange
                        'rgba(0, 212, 255, 0.6)', // Light Neon Blue
                      ],
                      borderColor: [
                        'rgba(0, 212, 255, 1)', // Neon Blue
                        'rgba(255, 102, 0, 1)', // Neon Orange
                        'rgba(0, 212, 255, 1)', // Neon Blue
                      ],
                      borderWidth: 3,
                      hoverBorderWidth: 4,
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
                        color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
                        padding: 20,
                        font: {
                          size: 13,
                          weight: 'bold'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(124, 58, 237, 0.95)',
                      titleColor: '#ffffff',
                      bodyColor: '#ffffff',
                      borderColor: 'rgba(168, 85, 247, 1)',
                      borderWidth: 2,
                      cornerRadius: 12,
                      displayColors: true,
                      boxPadding: 6
                    }
                  },
                  animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1500,
                    easing: 'easeInOutQuart'
                  },
                  cutout: '45%',
                  radius: '90%',
                  hover: {
                    // Remove animationDuration as it's not a valid property
                  }
                }}
              />
            </div>
          </div>

          {/* Project Progress */}
          <div className="liquid-glass-card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Project Progress
            </h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: projects.slice(0, 5).map((p: any) => p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name),
                  datasets: [
                    {
                      label: 'Progress %',
                      data: projects.slice(0, 5).map((p: any) => {
                        const projectTasks = getProjectTasks(p.id);
                        return projectTasks.length > 0
                          ? Math.round((projectTasks.filter((t: any) => t.status === "completed").length / projectTasks.length) * 100)
                          : 0;
                      }),
                      backgroundColor: 'rgba(0, 212, 255, 0.9)',
                      borderColor: 'rgba(0, 212, 255, 1)',
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: {
                        color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
                      },
                      grid: {
                        color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
                      },
                    },
                    x: {
                      ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
                      },
                      grid: {
                        color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>



        {/* Task Completion Trend */}
        <div className="mt-8">
          <div className="liquid-glass-card">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Task Completion Trend (Last 7 Days)
            </h3>
            <div className="h-80">
              <Line
                data={{
                  labels: ['7 days ago', '6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday'],
                  datasets: [
                    {
                      label: 'Tasks Completed',
                      data: [3, 5, 2, 8, 6, 4, 7], // Mock data for demonstration
                      borderColor: 'rgba(0, 212, 255, 1)',
                      backgroundColor: 'rgba(0, 212, 255, 0.15)',
                      borderWidth: 4,
                      fill: true,
                      tension: 0.4,
                      pointBackgroundColor: 'rgba(0, 212, 255, 1)',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 3,
                      pointRadius: 7,
                      pointHoverRadius: 9,
                    },
                    {
                      label: 'Tasks Created',
                      data: [6, 4, 7, 5, 9, 8, 6], // Enhanced mock data
                      borderColor: 'rgba(255, 102, 0, 1)',
                      backgroundColor: 'rgba(255, 102, 0, 0.15)',
                      borderWidth: 4,
                      fill: true,
                      tension: 0.4,
                      pointBackgroundColor: 'rgba(255, 102, 0, 1)',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 3,
                      pointRadius: 7,
                      pointHoverRadius: 9,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
                        padding: 20,
                        usePointStyle: true,
                      },
                    },
                    tooltip: {
                      backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                      titleColor: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
                      bodyColor: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#6b7280',
                      borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
                      borderWidth: 1,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
                      },
                      grid: {
                        color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
                      },
                    },
                    x: {
                      ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
                      },
                      grid: {
                        color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
                      },
                    },
                  },
                  interaction: {
                    intersect: false,
                    mode: 'index',
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
