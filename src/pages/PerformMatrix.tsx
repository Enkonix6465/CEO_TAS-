import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
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
  ScatterChart,
  Scatter,
} from "recharts";
import { useAuthStore } from "../store/authStore";
import PageHeader from "../components/PageHeader";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3,
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
} from "lucide-react";

export default function EmployeePerformancePage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [groupedEmployees, setGroupedEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noTeam, setNoTeam] = useState(false);
  const [performanceData, setPerformanceData] = useState({});
  const [monthChartData, setMonthChartData] = useState([]);
  const [dateChartData, setDateChartData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [bestDay, setBestDay] = useState(null);
  const [qualityProductivityData, setQualityProductivityData] = useState([]);
  const [performanceTrends, setPerformanceTrends] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.uid) {
          setLoading(false);
          return;
        }

        const teamsSnap = await getDocs(collection(db, "teams"));

        if (teamsSnap.empty) {
          setEmployees([]);
          setGroupedEmployees([]);
          setNoTeam(true);
          setLoading(false);
          return;
        }

        const empSnap = await getDocs(collection(db, "employees"));
        const allEmployees = empSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const grouped = teamsSnap.docs.map((teamDoc) => {
          const teamData = teamDoc.data();
          const memberIds = teamData.members || [];
          const members = allEmployees.filter((emp) =>
            memberIds.includes(emp.id)
          );
          const lead = allEmployees.find(
            (emp) => emp.id === teamData.created_by
          );

          return {
            teamId: teamDoc.id,
            teamName: teamData.teamName || "Unnamed Team",
            teamLead: lead?.name || "Unknown Lead",
            members,
          };
        });

        setGroupedEmployees(grouped);
        setEmployees(allEmployees);

        const taskSnap = await getDocs(collection(db, "tasks"));
        const tasksData = taskSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTasks(tasksData);
      } catch (error) {
        console.error("Error loading data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid]);

  useEffect(() => {
    if (!selectedEmployee || tasks.length === 0) return;

    const empTasks = tasks.filter(
      (task) => task.assigned_to === selectedEmployee.id
    );
    const perf = {
      total: empTasks.length,
      completed: 0,
      onTime: 0,
      reassigned: 0,
    };

    const dateMap = {};
    const monthMap = {};

    empTasks.forEach((task) => {
      const {
        progress_status,
        due_date,
        progress_updated_at,
        reassign_history = [],
      } = task;

      const completeDate = progress_updated_at?.toDate?.() || new Date();
      const dateKey = completeDate.toISOString().split("T")[0];
      const monthKey = completeDate.toISOString().slice(0, 7);

      if (!monthMap[monthKey])
        monthMap[monthKey] = { Completed: 0, Reassigned: 0 };
      if (!dateMap[dateKey]) dateMap[dateKey] = { Completed: 0, Reassigned: 0 };

      if (progress_status === "completed") {
        perf.completed++;
        const due = new Date(due_date);
        if (completeDate <= due) {
          perf.onTime++;
        }
        dateMap[dateKey].Completed++;
        monthMap[monthKey].Completed++;
      }

      if (reassign_history.length > 0) {
        const count = reassign_history.length;
        perf.reassigned += count;
        dateMap[dateKey].Reassigned += count;
        monthMap[monthKey].Reassigned += count;
      }
    });

    const completionRate = (perf.completed / perf.total) * 100 || 0;
    const onTimeRate =
      perf.completed > 0 ? (perf.onTime / perf.completed) * 100 : 0;

    const team = groupedEmployees.find((g) =>
      g.members.some((m) => m.id === selectedEmployee.id)
    );

    const peerMembers =
      team?.members?.filter((m) => m.id !== selectedEmployee.id) || [];
    const peerTasks = tasks.filter((t) =>
      peerMembers.some((m) => m.id === t.assigned_to)
    );

    const avgWorkload =
      peerMembers.length > 0 ? peerTasks.length / peerMembers.length : 0;

    const totalPerformanceScore = (
      ((completionRate * 0.6 + onTimeRate * 0.4) / 100) *
      100
    ).toFixed(2);

    setPerformanceData({
      ...perf,
      completionRate,
      onTimeRate,
      workloadComparison: {
        employee: perf.total,
        average: avgWorkload.toFixed(1),
      },
      totalPerformanceScore,
    });

    const dateData = Object.entries(dateMap).map(([date, val]) => ({
      date,
      ...val,
    }));

    const monthData = Object.entries(monthMap).map(([month, val]) => ({
      month,
      ...val,
    }));

    setDateChartData(dateData);
    setMonthChartData(monthData);

    // Calculate best performing day
    const dayPerformance = dateData.reduce((acc, item) => {
      const dayOfWeek = new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' });
      if (!acc[dayOfWeek]) acc[dayOfWeek] = { completed: 0, total: 0 };
      acc[dayOfWeek].completed += item.Completed;
      acc[dayOfWeek].total += item.Completed + item.Reassigned;
      return acc;
    }, {});

    const bestPerformingDay = Object.entries(dayPerformance)
      .map(([day, data]) => ({
        day,
        performance: data.total > 0 ? (data.completed / data.total) * 100 : 0,
        completed: data.completed
      }))
      .sort((a, b) => b.performance - a.performance)[0];

    setBestDay(bestPerformingDay);

    // Performance trends for last 30 days
    const last30Days = dateData.slice(-30).map(item => ({
      date: item.date,
      performance: item.Completed > 0 ? (item.Completed / (item.Completed + item.Reassigned)) * 100 : 0,
      quality: Math.random() * 40 + 60, // Mock quality score
      productivity: item.Completed * 2 + Math.random() * 20
    }));
    setPerformanceTrends(last30Days);

    // Quality vs Productivity matrix
    const qualityProd = empTasks.map((task, index) => ({
      quality: Math.random() * 40 + 60, // Mock quality score
      productivity: (task.progress || 0) + Math.random() * 20,
      taskId: task.id,
      title: task.title?.substring(0, 20) + '...'
    }));
    setQualityProductivityData(qualityProd);
  }, [selectedEmployee, tasks, groupedEmployees]);

  const filteredEmployees = groupedEmployees.map(team => ({
    ...team,
    members: team.members.filter(emp => 
      searchTerm
        ? emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    )
  })).filter(team => team.members.length > 0);

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      active: true,
    },
    
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (noTeam) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
        <PageHeader
          title="Performance Matrix"
          status="No Access"
          statusColor="bg-red-100 text-red-700"
          tabs={tabs}
          showActions={false}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Access Restricted
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You are not a team leader and cannot access performance data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-transparent flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="liquid-glass border-b border-gray-200 dark:border-purple-500/30 px-6 py-4 shadow-sm dark:shadow-purple-500/20 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-purple-100">
              Performance Matrix
            </h1>
            <span className="px-3 py-1 text-xs rounded-full font-medium bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              Live Analytics
            </span>
            {selectedEmployee && (
              <span className="px-3 py-1 text-xs rounded-full font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                {selectedEmployee.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (selectedEmployee && performanceData) {
                  const exportData = {
                    employee: selectedEmployee,
                    performance: performanceData,
                    bestDay: bestDay,
                    trends: performanceTrends,
                    qualityProductivity: qualityProductivityData,
                    exportDate: new Date().toISOString()
                  };

                  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `performance-${selectedEmployee.name?.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success(`Performance report exported for ${selectedEmployee.name}! 📊`);
                }
              }}
              disabled={!selectedEmployee}
              className="px-4 py-2 text-sm bg-white dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/30 border border-purple-200 dark:border-purple-500/30 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2 inline" />
              Export
            </button>

          </div>
        </div>

        {/* Search and Best Day Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 border-b-2 border-purple-500 pb-2">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-base font-medium text-purple-600 dark:text-purple-400">Performance Analytics</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-purple-300" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-[rgba(15,17,41,0.6)] text-gray-900 dark:text-purple-100 placeholder:dark:text-purple-300/70 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm dark:shadow-purple-500/20 backdrop-blur-sm w-full sm:w-48"
              />
            </div>
            {bestDay && (
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30 rounded-lg text-sm">
                <Star className="w-4 h-4" />
                <span className="font-medium">Best Day: {bestDay.day}</span>
                <span className="text-xs">({bestDay.performance?.toFixed(1)}%)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="px-6 py-3 liquid-glass border-b border-gray-200 dark:border-purple-500/30 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {bestDay && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400">Best Day:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{bestDay.day}</span>
              <span className="text-xs text-gray-500">({bestDay.performance?.toFixed(1)}% success)</span>
            </div>
          )}
        </div>

      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Employee Sidebar */}
        <div className="w-80 border-r border-gray-200 dark:border-purple-500/30 liquid-glass flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-purple-500/30">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-purple-100">
              Team Members
            </h2>
            <p className="text-sm text-gray-500 dark:text-purple-300/70 mt-1">
              Select a member to view analytics
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {filteredEmployees.map((team) => (
              <div key={team.teamId}>
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-purple-100 mb-1">
                    {team.teamName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-purple-300/70">
                    Lead: {team.teamLead}
                  </p>
                </div>

                <div className="space-y-2">
                  {team.members.map((emp) => {
                    const empTasks = tasks.filter(t => t.assigned_to === emp.id);
                    const completedTasks = empTasks.filter(t => t.progress_status === "completed");
                    const completionRate = empTasks.length > 0 ? (completedTasks.length / empTasks.length) * 100 : 0;
                    
                    return (
                      <motion.div
                        key={emp.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedEmployee(emp)}
                        className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 ${
                          selectedEmployee?.id === emp.id
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-500/20 shadow-lg dark:shadow-purple-500/20"
                            : "border-gray-200 dark:border-purple-500/20 hover:border-purple-300 dark:hover:border-purple-500/40 hover:bg-gray-50 dark:hover:bg-purple-500/10 hover:shadow-md dark:hover:shadow-purple-500/10"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              emp.name || emp.email
                            )}`}
                            alt="avatar"
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-purple-100 text-sm truncate">
                              {emp.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-purple-300/70 truncate">
                              {emp.department}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-purple-300/70">
                            {empTasks.length} tasks
                          </span>
                          <span className="font-medium text-gray-900 dark:text-purple-100">
                            {completionRate.toFixed(0)}% performance
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-purple-900/30 rounded-full h-2 mt-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedEmployee ? (
            <div className="p-6 space-y-6">
              {/* Employee Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="liquid-glass-card group"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        selectedEmployee.name || selectedEmployee.email
                      )}`}
                      alt="avatar"
                      className="w-16 h-16 rounded-full border-2 border-purple-200 dark:border-purple-500/30"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Award className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-purple-100">
                      {selectedEmployee.name}
                    </h2>
                    <p className="text-gray-600 dark:text-purple-300/80">
                      {selectedEmployee.department}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-purple-300/70">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Employee ID: {selectedEmployee.id.slice(-6)}
                      </div>
                      <div className="flex items-center gap-1">
                        Performance Matrix: <span className="font-bold text-purple-600 dark:text-purple-400">{performanceData.totalPerformanceScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  label="Tasks Assigned"
                  value={performanceData.total}
                  icon={Target}
                  color="blue"
                />
                <StatCard
                  label="Tasks Completed"
                  value={performanceData.completed}
                  icon={CheckCircle}
                  color="green"
                  subtitle={`${performanceData.completionRate?.toFixed(1)}% completion rate`}
                />
                <StatCard
                  label="On-Time Completion"
                  value={performanceData.onTime}
                  icon={Clock}
                  color="blue"
                  subtitle={`${performanceData.onTimeRate?.toFixed(1)}% on-time rate`}
                />
                <StatCard
                  label="Reassignments"
                  value={performanceData.reassigned}
                  icon={Activity}
                  color="yellow"
                />
              </div>

              {/* Enhanced Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Trends (Last 30 Days) */}
                <div className="liquid-glass-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Performance & Productivity Trends
                    </h3>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">
                        {performanceTrends.length > 0 ? `${performanceTrends[performanceTrends.length - 1]?.performance?.toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceTrends.slice(-10)}>
                      <XAxis
                        dataKey="date"
                        tick={false}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 10, fill: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="performance"
                        name="Performance %"
                        fill="#00D4FF"
                        radius={[4, 4, 0, 0]}
                        stroke="#7c3aed"
                        strokeWidth={1}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="productivity"
                        name="Productivity Score"
                        fill="#06b6d4"
                        radius={[4, 4, 0, 0]}
                        stroke="#0891b2"
                        strokeWidth={1}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Performance Dimensions Radar */}
                <div className="liquid-glass-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Performance Dimensions
                    </h3>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Multi-dimensional analysis
                      </span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={[
                      {
                        dimension: 'Task Completion',
                        value: performanceData.completionRate || 0,
                        fullMark: 100
                      },
                      {
                        dimension: 'On-Time Delivery',
                        value: performanceData.onTimeRate || 0,
                        fullMark: 100
                      },
                      {
                        dimension: 'Quality Score',
                        value: qualityProductivityData.length > 0 ?
                          qualityProductivityData.reduce((acc, item) => acc + item.quality, 0) / qualityProductivityData.length : 0,
                        fullMark: 100
                      },
                      {
                        dimension: 'Productivity',
                        value: qualityProductivityData.length > 0 ?
                          (qualityProductivityData.reduce((acc, item) => acc + item.productivity, 0) / qualityProductivityData.length) * 100 / 120 : 0,
                        fullMark: 100
                      },
                      {
                        dimension: 'Reliability',
                        value: performanceData.total > 0 ?
                          Math.max(0, 100 - (performanceData.reassigned / performanceData.total * 100)) : 0,
                        fullMark: 100
                      },
                      {
                        dimension: 'Consistency',
                        value: performanceTrends.length > 0 ?
                          100 - (Math.max(...performanceTrends.map(t => t.performance)) - Math.min(...performanceTrends.map(t => t.performance))) : 0,
                        fullMark: 100
                      }
                    ]}>
                      <PolarAngleAxis
                        dataKey="dimension"
                        tick={{
                          fontSize: 11,
                          fill: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151',
                          fontWeight: 500
                        }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fontSize: 9, fill: '#9ca3af' }}
                        tickCount={5}
                      />
                      <Radar
                        name="Performance Score"
                        dataKey="value"
                        stroke="#00D4FF"
                        fill="#00D4FF"
                        fillOpacity={0.3}
                        strokeWidth={3}
                        dot={{ fill: '#00D4FF', strokeWidth: 2, r: 4 }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload[0]) {
                            return (
                              <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
                                <p className="text-sm text-purple-600 dark:text-purple-400">
                                  Score: {payload[0].value?.toFixed(1)}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>


              </div>

              {/* Task Details Table */}
              <div className="liquid-glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-purple-500/30">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Task Details
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Task
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Completion
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Reassigned
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {tasks
                        .filter((t) => t.assigned_to === selectedEmployee.id)
                        .map((task, index) => {
                          const due = new Date(task.due_date);
                          const completed = task.progress_updated_at?.toDate?.();
                          const isOnTime = completed && completed <= due;
                          const isLate = completed && completed > due;
                          
                          return (
                            <motion.tr
                              key={task.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {task.title}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {task.task_id}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    task.progress_status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : task.progress_status === "in_progress"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {task.progress_status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                {task.due_date}
                              </td>
                              <td className="px-6 py-4">
                                {task.progress_status === "completed" ? (
                                  <span
                                    className={`text-sm font-medium ${
                                      isOnTime
                                        ? "text-green-600"
                                        : isLate
                                        ? "text-red-600"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {isOnTime ? "On Time" : isLate ? "Late" : "On Time"}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-500">Pending</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                {task.reassign_history?.length || 0}
                              </td>
                            </motion.tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Select an Employee
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a team member from the sidebar to view their performance metrics.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, icon: Icon, color = "blue", subtitle }) => {
  const colorMap = {
    blue: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30",
    green: "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30",
    yellow: "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30",
    red: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="liquid-glass-stats group cursor-pointer"
    >
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-purple-300/90 mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-purple-300/70 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </motion.div>
  );
};
