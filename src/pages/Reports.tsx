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
    let retryTimer: NodeJS.Timeout;
    
    const initializeWithRetry = () => {
      try {
        setHasError(false);
        fetchReportData();
        
        if (connectionStatus === 'offline' && retryCount < 3) {
          retryTimer = setTimeout(() => {
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
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [retryCount]);

  const fetchReportData = async () => {
    if (!db) {
      console.warn("Firebase not available for Reports");
      setConnectionStatus('offline');
      setLoading(false);
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      const [tasksSnapshot, projectsSnapshot, usersSnapshot] = await Promise.all([
        getDocs(collection(db, "tasks")).catch(() => ({ docs: [] })),
        getDocs(collection(db, "projects")).catch(() => ({ docs: [] })),
        getDocs(collection(db, "users")).catch(() => ({ docs: [] })),
      ]);

      const tasks = tasksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const projects = projectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Generate report data
      const data = {
        performance: {
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          overdueTasks: tasks.filter(t => new Date(t.dueDate || '') < new Date() && t.status !== 'completed').length,
          efficiency: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
        },
        projects: {
          total: projects.length,
          active: projects.filter(p => p.status === 'active').length,
          completed: projects.filter(p => p.status === 'completed').length,
          delayed: projects.filter(p => p.status === 'delayed').length,
        },
        team: {
          totalMembers: users.length,
          activeDevelopers: users.filter(u => u.role === 'developer').length,
          teamLeads: users.filter(u => u.role === 'team_lead').length,
          productivity: Math.round(Math.random() * 100), // Mock productivity score
        },
        trends: [
          { name: "Week 1", tasks: Math.floor(Math.random() * 50), projects: Math.floor(Math.random() * 10) },
          { name: "Week 2", tasks: Math.floor(Math.random() * 50), projects: Math.floor(Math.random() * 10) },
          { name: "Week 3", tasks: Math.floor(Math.random() * 50), projects: Math.floor(Math.random() * 10) },
          { name: "Week 4", tasks: Math.floor(Math.random() * 50), projects: Math.floor(Math.random() * 10) },
        ]
      };

      setReportData(data);
      setConnectionStatus('connected');
    } catch (error) {
      console.error("Error fetching report data:", error);
      setConnectionStatus('offline');
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setHasError(false);
    setRetryCount(0);
    setLoading(true);
    fetchReportData();
  };

  const exportReport = () => {
    // Mock export functionality
    console.log("Exporting report...");
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
                  Performance analytics
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
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Total Tasks",
                  value: reportData.performance.totalTasks,
                  icon: Target,
                  color: "violet"
                },
                {
                  title: "Completed",
                  value: reportData.performance.completedTasks,
                  icon: CheckCircle,
                  color: "emerald"
                },
                {
                  title: "Overdue",
                  value: reportData.performance.overdueTasks,
                  icon: Clock,
                  color: "red"
                },
                {
                  title: "Efficiency",
                  value: `${reportData.performance.efficiency}%`,
                  icon: Award,
                  color: "amber"
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 rounded-xl`}>
                      <stat.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-violet-600/70 dark:text-violet-300/70">
                        {stat.title}
                      </p>
                      <p className="text-xl font-black text-slate-800 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Performance Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tasks"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        )}

        {/* Other report types can be added here with similar patterns */}
        {selectedReport !== 'performance' && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="p-4 bg-violet-100 dark:bg-violet-500/20 rounded-xl mb-4 inline-block">
                <FileText className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report
              </h3>
              <p className="text-sm text-violet-600/70 dark:text-violet-300/70">
                This report section is being prepared
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
