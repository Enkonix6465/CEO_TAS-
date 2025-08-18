import React, { useState, useEffect } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConnected } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Calendar,
  Users,
  Target,
  Clock,
  Filter,
  Search,
  Eye,
  Share2,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  User,
  Award,
  Zap,
  Star,
  ChevronDown,
  ArrowRight,
  TrendingDown,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from "recharts";

const Reports = () => {
  const [reportData, setReportData] = useState<any>({});
  const [selectedReport, setSelectedReport] = useState("performance");
  const [selectedTimeframe, setSelectedTimeframe] = useState("month");
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const initializeWithRetry = () => {
      try {
        setHasError(false);
        cleanup = setupRealTimeListeners();
        
        if (connectionStatus === 'offline' && retryCount < 3) {
          setTimeout(() => {
            console.log(`Retrying Reports connection (attempt ${retryCount + 1})`);
            setRetryCount(prev => prev + 1);
            initializeWithRetry();
          }, 5000 * (retryCount + 1));
        }
      } catch (error) {
        console.error("Reports initialization error:", error);
        setHasError(true);
        setConnectionStatus('offline');
        setLoading(false);
      }
    };

    initializeWithRetry();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [retryCount]);

  const setupRealTimeListeners = () => {
    if (!db) {
      console.warn("Firebase not available for Reports");
      setConnectionStatus('offline');
      setLoading(false);
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      // Set up real-time listeners
      const unsubscribeTasks = onSnapshot(
        collection(db, "tasks"),
        (snapshot) => {
          const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          updateReportData('tasks', tasks);
        },
        (error) => console.error("Tasks listener error:", error)
      );

      const unsubscribeProjects = onSnapshot(
        collection(db, "projects"),
        (snapshot) => {
          const projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          updateReportData('projects', projects);
        },
        (error) => console.error("Projects listener error:", error)
      );

      const unsubscribeEmployees = onSnapshot(
        collection(db, "employees"),
        (snapshot) => {
          const employees = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          updateReportData('employees', employees);
        },
        (error) => console.error("Employees listener error:", error)
      );

      const unsubscribeTeams = onSnapshot(
        collection(db, "teams"),
        (snapshot) => {
          const teams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          updateReportData('teams', teams);
        },
        (error) => console.error("Teams listener error:", error)
      );

      setConnectionStatus('connected');
      setLoading(false);

      return () => {
        unsubscribeTasks();
        unsubscribeProjects();
        unsubscribeEmployees();
        unsubscribeTeams();
      };
    } catch (error) {
      console.error("Error setting up listeners:", error);
      setConnectionStatus('offline');
      setHasError(true);
      setLoading(false);
    }
  };

  const updateReportData = (type: string, data: any[]) => {
    setReportData((prev: any) => {
      const newData = { ...prev };
      
      if (type === 'tasks') {
        const now = new Date();
        newData.performance = {
          totalTasks: data.length,
          completedTasks: data.filter(t => t.status === 'completed' || t.progress_status === 'completed').length,
          inProgressTasks: data.filter(t => t.status === 'in_progress' || t.progress_status === 'in_progress').length,
          overdueTasks: data.filter(t => {
            // Use consistent overdue logic
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

              const currentTime = new Date();
              currentTime.setHours(23, 59, 59, 999);
              return due < currentTime;
            } catch (error) {
              return false;
            }
          }).length,
          efficiency: data.length > 0 ? Math.round((data.filter(t => t.status === 'completed' || t.progress_status === 'completed').length / data.length) * 100) : 0,
        };

        // Generate trends based on task creation/completion dates
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        newData.trends = last7Days.map((date, index) => {
          const dayTasks = data.filter(t => {
            const taskDate = new Date(t.created_at?.toDate?.() || t.created_at || date);
            return taskDate.toISOString().split('T')[0] === date;
          });
          return {
            name: `Day ${index + 1}`,
            date,
            tasks: dayTasks.length,
            completed: dayTasks.filter(t => t.status === 'completed' || t.progress_status === 'completed').length,
          };
        });
      }
      
      if (type === 'projects') {
        newData.projects = {
          total: data.length,
          active: data.filter(p => p.status === 'active' || p.status === 'in_progress').length,
          completed: data.filter(p => p.status === 'completed').length,
          planning: data.filter(p => p.status === 'planning' || p.status === 'pending').length,
          delayed: data.filter(p => {
            const dueDate = new Date(p.endDate || p.due_date || '');
            return dueDate < new Date() && p.status !== 'completed';
          }).length,
        };
      }
      
      if (type === 'employees') {
        newData.team = {
          totalMembers: data.length,
          activeMembers: data.filter(e => e.status === 'Active').length,
          departments: [...new Set(data.map(e => e.department).filter(Boolean))].length,
          newJoiners: data.filter(e => {
            if (!e.joiningDate) return false;
            const joinDate = new Date(e.joiningDate);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return joinDate > thirtyDaysAgo;
          }).length,
        };
      }
      
      if (type === 'teams') {
        newData.teams = {
          total: data.length,
          active: data.filter(t => t.status === 'active').length,
          totalMembers: data.reduce((sum, team) => sum + (team.members?.length || 0), 0),
          avgTeamSize: data.length > 0 ? Math.round(data.reduce((sum, team) => sum + (team.members?.length || 0), 0) / data.length) : 0,
        };
      }
      
      return newData;
    });
  };

  const handleRefresh = () => {
    setHasError(false);
    setRetryCount(0);
    setLoading(true);
    setupRealTimeListeners();
  };

  const exportReport = () => {
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `report-${selectedReport}-${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Error boundary fallback
  if (hasError && connectionStatus === 'offline') {
    return (
      <div className="h-full bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex items-center justify-center">
        <div className="text-center p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl shadow-lg max-w-md">
          <div className="p-4 bg-orange-100 dark:bg-orange-500/20 rounded-xl mb-4 inline-block">
            <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Reports Unavailable</h3>
          <p className="text-sm text-violet-600/70 dark:text-violet-300/70 mb-4">
            Unable to load report data. Please check your connection.
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
          <p className="text-violet-600 dark:text-violet-400 font-medium">Loading Reports...</p>
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
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Reports
                </h1>
                <p className="text-xs text-violet-600/70 dark:text-violet-300/70 font-medium">
                  Real-time performance analytics
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
              {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Loading' : 'Offline'}
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
              onClick={exportReport}
              className="p-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-sm"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="flex items-center gap-3">
          {[
            { id: 'performance', label: 'Performance', icon: Target },
            { id: 'projects', label: 'Projects', icon: BarChart3 },
            { id: 'team', label: 'Team', icon: Users },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
          ].map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                selectedReport === report.id
                  ? 'bg-violet-100/60 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-500/30'
                  : 'text-violet-600/70 dark:text-violet-300/70 hover:bg-violet-50/60 dark:hover:bg-violet-500/5'
              }`}
            >
              <report.icon className="w-4 h-4" />
              {report.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-auto px-6 py-4">
        {/* Performance Report */}
        {selectedReport === 'performance' && reportData.performance && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Total Tasks",
                  value: reportData.performance.totalTasks || 0,
                  icon: Target,
                  color: "violet",
                  change: "+12%"
                },
                {
                  title: "Completed",
                  value: reportData.performance.completedTasks || 0,
                  icon: CheckCircle,
                  color: "emerald",
                  change: "+8%"
                },
                {
                  title: "In Progress",
                  value: reportData.performance.inProgressTasks || 0,
                  icon: Clock,
                  color: "blue",
                  change: "-3%"
                },
                {
                  title: "Overdue",
                  value: reportData.performance.overdueTasks || 0,
                  icon: AlertCircle,
                  color: "red",
                  change: "-15%"
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl ${
                      stat.color === 'violet' ? 'bg-violet-100 dark:bg-violet-500/20' :
                      stat.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-500/20' :
                      stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-500/20' :
                      'bg-red-100 dark:bg-red-500/20'
                    }`}>
                      <stat.icon className={`w-5 h-5 ${
                        stat.color === 'violet' ? 'text-violet-600 dark:text-violet-400' :
                        stat.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                        stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                        'text-red-600 dark:text-red-400'
                      }`} />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stat.change.startsWith('+') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                      'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Task Completion Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} />
                    <Line type="monotone" dataKey="tasks" stroke="#8b5cf6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Efficiency Rate</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-violet-600 dark:text-violet-400 mb-2">
                    {reportData.performance.efficiency || 0}%
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Overall task completion efficiency
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-violet-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${reportData.performance.efficiency || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects Report */}
        {selectedReport === 'projects' && reportData.projects && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Total Projects", value: reportData.projects.total || 0, icon: BarChart3, color: "blue" },
                { title: "Active", value: reportData.projects.active || 0, icon: Activity, color: "green" },
                { title: "Completed", value: reportData.projects.completed || 0, icon: CheckCircle, color: "emerald" },
                { title: "Planning", value: reportData.projects.planning || 0, icon: Clock, color: "yellow" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-4 shadow-lg"
                >
                  <div className={`p-2 rounded-xl mb-3 inline-block ${
                    stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-500/20' :
                    stat.color === 'green' ? 'bg-green-100 dark:bg-green-500/20' :
                    stat.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-500/20' :
                    'bg-yellow-100 dark:bg-yellow-500/20'
                  }`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      stat.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`} />
                  </div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{stat.title}</div>
                </motion.div>
              ))}
            </div>
            
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Project Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: reportData.projects.active || 0, fill: '#10b981' },
                      { name: 'Completed', value: reportData.projects.completed || 0, fill: '#8b5cf6' },
                      { name: 'Planning', value: reportData.projects.planning || 0, fill: '#f59e0b' },
                      { name: 'Delayed', value: reportData.projects.delayed || 0, fill: '#ef4444' },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                  >
                    {[
                      { name: 'Active', value: reportData.projects.active || 0, fill: '#10b981' },
                      { name: 'Completed', value: reportData.projects.completed || 0, fill: '#8b5cf6' },
                      { name: 'Planning', value: reportData.projects.planning || 0, fill: '#f59e0b' },
                      { name: 'Delayed', value: reportData.projects.delayed || 0, fill: '#ef4444' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Team Report */}
        {selectedReport === 'team' && reportData.team && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Total Members", value: reportData.team.totalMembers || 0, icon: Users, color: "blue" },
                { title: "Active Members", value: reportData.team.activeMembers || 0, icon: User, color: "green" },
                { title: "Departments", value: reportData.team.departments || 0, icon: BarChart3, color: "purple" },
                { title: "New Joiners", value: reportData.team.newJoiners || 0, icon: Star, color: "yellow" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-4 shadow-lg"
                >
                  <div className={`p-2 rounded-xl mb-3 inline-block ${
                    stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-500/20' :
                    stat.color === 'green' ? 'bg-green-100 dark:bg-green-500/20' :
                    stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-500/20' :
                    'bg-yellow-100 dark:bg-yellow-500/20'
                  }`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`} />
                  </div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{stat.title}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Trends Report */}
        {selectedReport === 'trends' && reportData.trends && (
          <div className="space-y-6">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">7-Day Task Trends</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={reportData.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="tasks"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stackId="2"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
