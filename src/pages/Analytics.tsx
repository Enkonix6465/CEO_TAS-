import React, { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  CheckCircle,
  Filter,
  Download,
  Search,
  ChevronDown,
  BarChart3,
  AlertCircle,
  Clock,
  Target,
  Zap,
  Star,
  Calendar,
  Eye,
  FileText,
  ArrowRight,
  User,
  Award,
  Timer,
  RefreshCw,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
const CustomTooltip = ({ performanceData, children }) => {
  const [show, setShow] = useState(false);

  console.log("Tooltip performanceData:", performanceData); // Debugging

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-[320px] whitespace-pre-line text-sm p-4 bg-white border border-gray-200 rounded-xl shadow-xl">
          <div className="font-semibold mb-2">
            ⭐️ Performance Score Breakdown
          </div>
          <div className="space-y-1 text-gray-800">
            <p>
              🟦 <strong>Productivity Score:</strong>{" "}
              {performanceData?.productivityScore ?? "0"} / 100
            </p>
            <p>
              🟩 <strong>Completion Rate:</strong>{" "}
              {performanceData?.completionRate?.toFixed(1) ?? "0.0"}% / 100%
            </p>
            <p>
              🟨 <strong>On-Time Delivery:</strong>{" "}
              {performanceData?.onTimeRate?.toFixed(1) ?? "0.0"}% / 100%
            </p>
            <p>
              🟪 <strong>Review Score:</strong>{" "}
              {performanceData?.reviewScore ?? "0"} / 100
            </p>
            <p>
              🔵 <strong>HR Score:</strong>{" "}
              {performanceData?.hrFeedbackScore !== undefined
                ? Number(performanceData.hrFeedbackScore).toFixed(1)
                : "0.0"}{" "}
              / 100
            </p>
          </div>
          <hr className="my-2" />
          <p className="font-bold text-gray-900">
            🏁 Final Score: {performanceData?.totalPerformanceScore ?? "0"}% /
            100%
          </p>
        </div>
      )}
    </div>
  );
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("30");
  const [selectedView, setSelectedView] = useState("overview");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [groupedEmployees, setGroupedEmployees] = useState([]);

  const [performanceData, setPerformanceData] = useState({});
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "offline"
  >("connecting");

  // Pleasant color palette
  const colors = {
    primary: "#00D4FF", // Neon Blue
    secondary: "#06B6D4", // Cyan
    success: "#FF6600", // Neon Orange
    warning: "#F59E0B", // Amber
    info: "#00D4FF", // Neon Blue
    light: "#F3F4F6", // Gray-100
    dark: "#1F2937", // Gray-800
    accent1: "#EC4899", // Pink
    accent2: "#00D4FF", // Neon Blue
    accent3: "#06B6D4", // Cyan
    accent4: "#FF6600", // Neon Orange
  };

  useEffect(() => {
    const unsubscribers: any[] = [];
    let mounted = true;

    const setupRealtimeListeners = async () => {
      try {
        setLoading(true);
        setConnectionStatus("connecting");

        // Real-time listener for tasks
        const tasksUnsub = onSnapshot(
          collection(db, "tasks"),
          (snapshot) => {
            if (mounted) {
              const tasksData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setTasks(tasksData);
              setConnectionStatus("connected");
              if (tasksData.length > 0) {
                toast.success(
                  `📊 Analytics updated! (${tasksData.length} tasks)`
                );
              }
            }
          },
          (error) => {
            console.warn("Tasks listener error:", error);
            setConnectionStatus("offline");
            if (mounted) {
              // Fallback to mock data
              setTasks([
                {
                  id: "1",
                  title: "Design System",
                  status: "completed",
                  assigned_to: "emp-1",
                  created_at: { toDate: () => new Date(2024, 0, 15) },
                  progress_updated_at: { toDate: () => new Date(2024, 0, 18) },
                  due_date: "2024-01-20",
                  priority: "high",
                },
                {
                  id: "2",
                  title: "API Integration",
                  status: "overdue",
                  assigned_to: "emp-2",
                  created_at: { toDate: () => new Date(2024, 0, 10) },
                  due_date: "2024-01-15",
                  priority: "high",
                },
                {
                  id: "3",
                  title: "Testing",
                  status: "in_progress",
                  assigned_to: "emp-3",
                  created_at: { toDate: () => new Date(2024, 0, 12) },
                  due_date: "2024-01-25",
                  priority: "medium",
                },
              ]);
            }
          }
        );

        // Real-time listener for projects
        const projectsUnsub = onSnapshot(
          collection(db, "projects"),
          (snapshot) => {
            if (mounted) {
              const projectsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setProjects(projectsData);
            }
          },
          (error) => {
            console.warn("Projects listener error:", error);
          }
        );

        // Real-time listener for employees
        const employeesUnsub = onSnapshot(
          collection(db, "employees"),
          (snapshot) => {
            if (mounted) {
              const employeesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setEmployees(employeesData);
            }
          },
          (error) => {
            console.warn("Employees listener error:", error);
          }
        );

        // Real-time listener for teams
        const teamsUnsub = onSnapshot(
          collection(db, "teams"),
          (snapshot) => {
            if (mounted) {
              const teamsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setTeams(teamsData);
            }
          },
          (error) => {
            console.warn("Teams listener error:", error);
          }
        );

        unsubscribers.push(
          tasksUnsub,
          projectsUnsub,
          employeesUnsub,
          teamsUnsub
        );
        setLoading(false);
      } catch (error) {
        console.error("Failed to setup Firebase listeners:", error);
        setConnectionStatus("offline");
        setLoading(false);
      }
    };

    setupRealtimeListeners();

    return () => {
      mounted = false;
      unsubscribers.forEach((unsub) => {
        if (typeof unsub === "function") {
          unsub();
        }
      });
    };
  }, []);
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
      if (!dateMap[dateKey])
        dateMap[dateKey] = {
          Completed: 0,
          Reassigned: 0,
          completedTaskIds: [],
          reassignedTaskIds: [],
        };

      if (progress_status === "completed") {
        perf.completed++;

        const due = new Date(due_date);
        if (completeDate <= due) {
          perf.onTime++;
        }

        dateMap[dateKey].Completed++;
        dateMap[dateKey].completedTaskIds.push(task.id);
        monthMap[monthKey].Completed++;
      }

      if (reassign_history.length > 0) {
        const count = reassign_history.length;
        perf.reassigned += count;
        dateMap[dateKey].Reassigned += count;
        dateMap[dateKey].reassignedTaskIds.push(task.id);
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

    let penalty = perf.reassigned * 0.5; // 🔁 Each reassigned task deducts 0.5%

    // 👇 Move reviewScore calculation here
    const empReviews = empTasks
      .map((t) => t.reviewpoints)
      .filter((p) => typeof p === "number");

    const avgReviewScore =
      empReviews.length > 0
        ? empReviews.reduce((a, b) => a + b, 0) / empReviews.length
        : 0;

    // 👇 Move productivity calculation here
    const empProductivity = empTasks
      .map((task) => {
        const assignedAt = task.created_at?.toDate?.();
        const dueAt = new Date(task.due_date);
        const completedAt = task.progress_updated_at?.toDate?.();

        if (!assignedAt || !dueAt || !completedAt) return null;

        const totalTime = dueAt.getTime() - assignedAt.getTime();
        const timeLeft = dueAt.getTime() - completedAt.getTime();
        const timeOverdue = completedAt.getTime() - dueAt.getTime();

        if (completedAt <= dueAt) {
          const leftRatio = timeLeft / totalTime;
          if (leftRatio >= 0.5) return 100;
          if (leftRatio >= 0 && leftRatio < 0.1) return 70;
          return 60;
        } else {
          const overdueRatio = timeOverdue / totalTime;
          if (overdueRatio <= 0.1) return 50;
          if (overdueRatio <= 0.5) return 30;
          return 10;
        }
      })
      .filter((s) => s !== null);

    const avgProductivityScore =
      empProductivity.length > 0
        ? empProductivity.reduce((a, b) => a + b, 0) / empProductivity.length
        : 0;

    // ✅ Now safe to use these in score calculation
    const fetchHRFeedbackAndCalculate = async () => {
      const empId = selectedEmployee.id;
      let hrFeedbackScore = 0; // default if none found

      try {
        // Get all docs for this employee
        const q = query(
          collection(db, "HR_feedback"),
          where("employeeId", "==", empId)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          let latestDoc = null;
          let latestDate = null;

          snap.forEach((docSnap) => {
            const docId = docSnap.id; // e.g., GECHBrETQWcBmSAK1LS0rYKzmrk1_2025-08-07
            const datePart = docId.split("_")[1]; // YYYY-MM-DD
            const docDate = new Date(datePart);

            // Compare with latest date found
            if (!latestDate || docDate > latestDate) {
              latestDate = docDate;
              latestDoc = docSnap;
            }
          });

          if (latestDoc) {
            const data = latestDoc.data();
            if (typeof data.score === "number") {
              hrFeedbackScore = data.score;
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch HR feedback:", error);
      }

      const hrWeighted = hrFeedbackScore * 0.1;

      const totalPerformanceScore = Math.max(
        (
          avgProductivityScore * 0.2 +
          completionRate * 0.25 +
          onTimeRate * 0.25 +
          avgReviewScore * 0.2 +
          hrWeighted
        ).toFixed(2),
        0
      );

      setPerformanceData({
        ...perf,
        completionRate,
        onTimeRate,
        workloadComparison: {
          employee: perf.total,
          average: avgWorkload.toFixed(1),
        },
        reviewScore: avgReviewScore.toFixed(1),
        productivityScore: avgProductivityScore.toFixed(1),
        hrFeedbackScore: hrFeedbackScore.toFixed(1),
        totalPerformanceScore,
      });

      const dateData = Object.entries(dateMap).map(([date, val]) => ({
        date,
        Completed: val.Completed,
        Reassigned: val.Reassigned,
        completedTaskIds: val.completedTaskIds,
        reassignedTaskIds: val.reassignedTaskIds,
      }));

      const monthData = Object.entries(monthMap).map(([month, val]) => ({
        month,
        ...val,
      }));

      setDateChartData(dateData);
      setMonthChartData(monthData);
    };
    fetchHRFeedbackAndCalculate();
  }, [selectedEmployee, tasks, groupedEmployees]);
  // Generate individual performance analytics
  const generateIndividualPerformance = () => {
    return employees.map((employee) => {
      const empTasks = tasks.filter((t) => t.assigned_to === employee.id);
      const completedTasks = empTasks.filter((t) => t.status === "completed");
      const overdueTasks = empTasks.filter((t) => {
        if (!t.due_date || t.status === "completed") return false;
        return new Date(t.due_date) < new Date();
      });

      const lateTasks = completedTasks.filter((t) => {
        if (!t.progress_updated_at || !t.due_date) return false;
        const completedDate = t.progress_updated_at.toDate
          ? t.progress_updated_at.toDate()
          : new Date(t.progress_updated_at);
        const dueDate = new Date(t.due_date);
        return completedDate > dueDate;
      });

      const onTimeTasks = completedTasks.filter((t) => {
        if (!t.progress_updated_at || !t.due_date) return false;
        const completedDate = t.progress_updated_at.toDate
          ? t.progress_updated_at.toDate()
          : new Date(t.progress_updated_at);
        const dueDate = new Date(t.due_date);
        return completedDate <= dueDate;
      });

      const avgDelayDays =
        lateTasks.length > 0
          ? lateTasks.reduce((acc, task) => {
              const completedDate = task.progress_updated_at.toDate
                ? task.progress_updated_at.toDate()
                : new Date(task.progress_updated_at);
              const dueDate = new Date(task.due_date);
              const delayDays = Math.ceil(
                (completedDate - dueDate) / (1000 * 60 * 60 * 24)
              );
              return acc + delayDays;
            }, 0) / lateTasks.length
          : 0;

      const performanceScore =
        empTasks.length > 0
          ? (onTimeTasks.length / empTasks.length) * 40 +
            (completedTasks.length / empTasks.length) * 35 -
            (overdueTasks.length / empTasks.length) * 25 -
            (lateTasks.length / empTasks.length) * 15
          : 0;

      const performanceLevel =
        performanceScore >= 80
          ? {
              level: "excellent",
              color: "green",
              description: "Excellent Performance",
            }
          : performanceScore >= 60
          ? { level: "good", color: "blue", description: "Good Performance" }
          : performanceScore >= 40
          ? {
              level: "average",
              color: "yellow",
              description: "Average Performance",
            }
          : performanceScore >= 20
          ? {
              level: "needs_improvement",
              color: "orange",
              description: "Needs Improvement",
            }
          : {
              level: "critical",
              color: "red",
              description: "Critical - Urgent Action Required",
            };

      return {
        ...employee,
        totalTasks: empTasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        lateTasks: lateTasks.length,
        onTimeTasks: onTimeTasks.length,
        completionRate:
          empTasks.length > 0
            ? (completedTasks.length / empTasks.length) * 100
            : 0,
        onTimeRate:
          completedTasks.length > 0
            ? (onTimeTasks.length / completedTasks.length) * 100
            : 0,
        lateRate:
          completedTasks.length > 0
            ? (lateTasks.length / completedTasks.length) * 100
            : 0,
        overdueRate:
          empTasks.length > 0
            ? (overdueTasks.length / empTasks.length) * 100
            : 0,
        avgDelayDays: Math.round(avgDelayDays * 10) / 10,
        performanceScore: Math.max(0, Math.min(100, performanceScore)),
        performanceLevel,
        recentTasks: empTasks.slice(-5),
      };
    });
  };

  const individualPerformance = generateIndividualPerformance();

  // Generate chart data
  const taskStatusData = [
    {
      name: "Completed",
      value: tasks.filter((t: any) => t.status === "completed").length || 24,
      color: colors.success,
    },
    {
      name: "In Progress",
      value: tasks.filter((t: any) => t.status === "in_progress").length || 8,
      color: colors.info,
    },
    {
      name: "Pending",
      value: tasks.filter((t: any) => t.status === "pending").length || 12,
      color: colors.warning,
    },
    {
      name: "Overdue",
      value:
        tasks.filter(
          (t: any) =>
            t.status === "overdue" ||
            (t.due_date &&
              new Date(t.due_date) < new Date() &&
              t.status !== "completed")
        ).length || 5,
      color: colors.accent1,
    },
  ];

  // Performance trends over last 30 days
  const performanceTrends = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(new Date().getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];

    const dayCompleted = tasks.filter((t) => {
      const completedAt = t.progress_updated_at?.toDate
        ? t.progress_updated_at.toDate()
        : null;
      return (
        completedAt &&
        completedAt.toISOString().split("T")[0] === dateStr &&
        t.status === "completed"
      );
    }).length;

    const dayCreated = tasks.filter((t) => {
      const createdAt = t.created_at?.toDate
        ? t.created_at.toDate()
        : new Date(t.created_at);
      return createdAt.toISOString().split("T")[0] === dateStr;
    }).length;

    performanceTrends.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      completed: dayCompleted,
      created: dayCreated,
      efficiency:
        dayCreated > 0 ? Math.round((dayCompleted / dayCreated) * 100) : 0,
    });
  }

  // Department performance
  const departmentData = {};
  individualPerformance.forEach((emp) => {
    if (!departmentData[emp.department]) {
      departmentData[emp.department] = {
        name: emp.department,
        employees: 0,
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        avgPerformance: 0,
      };
    }

    departmentData[emp.department].employees += 1;
    departmentData[emp.department].totalTasks += emp.totalTasks;
    departmentData[emp.department].completedTasks += emp.completedTasks;
    departmentData[emp.department].overdueTasks += emp.overdueTasks;
    departmentData[emp.department].avgPerformance += emp.performanceScore;
  });

  Object.values(departmentData).forEach((dept: any) => {
    if (dept.employees > 0) {
      dept.avgPerformance = Math.round(dept.avgPerformance / dept.employees);
      dept.completionRate =
        dept.totalTasks > 0
          ? Math.round((dept.completedTasks / dept.totalTasks) * 100)
          : 0;
    }
  });

  const departmentPerformance = Object.values(departmentData);

  // Generate mock employee reports (would come from admin/team lead inputs)
  const generateEmployeeReport = (employeeId) => {
    const mockReports = {
      "emp-1": {
        adminReport: {
          author: "Admin",
          date: "2024-01-15",
          rating: 4.5,
          strengths: [
            "Excellent design skills",
            "Creative problem solving",
            "Team collaboration",
          ],
          improvements: ["Time management", "Meeting deadlines"],
          goals: [
            "Complete design system by Q2",
            "Reduce project delays by 50%",
          ],
          comments:
            "Sarah is a talented designer but needs to improve deadline adherence. Recent projects have been delayed by an average of 3 days.",
        },
        teamLeadReport: {
          author: "Design Team Lead",
          date: "2024-01-10",
          rating: 4.0,
          strengths: [
            "High quality work",
            "Attention to detail",
            "User experience focus",
          ],
          improvements: ["Task prioritization", "Communication of delays"],
          goals: [
            "Implement project tracking system",
            "Weekly progress updates",
          ],
          comments:
            "Sarah produces exceptional work quality but struggles with time estimation. Recommend time management training.",
        },
      },
      "emp-2": {
        adminReport: {
          author: "Admin",
          date: "2024-01-12",
          rating: 3.5,
          strengths: ["Technical expertise", "Problem solving"],
          improvements: ["Project completion rate", "Code delivery timing"],
          goals: [
            "Improve on-time delivery to 90%",
            "Complete current backlog",
          ],
          comments:
            "Mike has strong technical skills but has multiple overdue tasks. Needs immediate support with workload management.",
        },
        teamLeadReport: {
          author: "Engineering Team Lead",
          date: "2024-01-08",
          rating: 3.8,
          strengths: [
            "Code quality",
            "Technical knowledge",
            "Mentoring junior developers",
          ],
          improvements: ["Deadline management", "Task estimation"],
          goals: [
            "Complete overdue tasks by month end",
            "Implement better estimation practices",
          ],
          comments:
            "Mike is technically competent but consistently underestimates task complexity. Regular check-ins recommended.",
        },
      },
      "emp-3": {
        adminReport: {
          author: "Admin",
          date: "2024-01-14",
          rating: 4.8,
          strengths: [
            "Consistent delivery",
            "Quality assurance",
            "Process improvement",
          ],
          improvements: ["Cross-team collaboration"],
          goals: ["Lead QA process optimization", "Mentor new QA team members"],
          comments:
            "Emily is our most reliable team member with excellent on-time delivery. Perfect candidate for team lead role.",
        },
        teamLeadReport: {
          author: "QA Team Lead",
          date: "2024-01-11",
          rating: 4.9,
          strengths: ["Thorough testing", "Documentation", "Process adherence"],
          improvements: ["Automation skills"],
          goals: [
            "Complete automation training",
            "Implement automated testing",
          ],
          comments:
            "Emily consistently delivers high-quality work on time. Excellent team player and process follower.",
        },
      },
    };

    return (
      mockReports[employeeId] || {
        adminReport: {
          author: "Admin",
          rating: 3.0,
          comments: "No report available",
        },
        teamLeadReport: {
          author: "Team Lead",
          rating: 3.0,
          comments: "No report available",
        },
      }
    );
  };

  const exportAnalytics = () => {
    const data = {
      summary: {
        totalTasks: tasks.length,
        completed: taskStatusData[0].value,
        teamMembers: employees.length,
        projects: projects.length,
        overdueTasks: taskStatusData[3].value,
      },
      individualPerformance,
      departmentPerformance,
      performanceTrends,
      taskBreakdown: taskStatusData,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comprehensive-analytics-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("📊 Analytics report exported successfully!");
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:from-black dark:via-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-cyan-50 via-orange-50/30 to-cyan-100 dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20 overflow-y-auto">
      {/* Enhanced Header */}
      <div className="liquid-glass border-b border-gray-200 dark:border-purple-500/30 p-4 sm:p-6 shadow-sm dark:shadow-purple-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-orange-600 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-purple-100">
                **Advanced Analytics Dashboard**
              </h1>
              <p className="text-sm text-gray-500 dark:text-purple-300/70">
                **Real-time performance insights & individual metrics**
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Selector */}
            <div className="flex bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-cyan-900/20 dark:to-orange-900/20 rounded-lg p-1">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "individual", label: "Individual", icon: User },
                { id: "trends", label: "Trends", icon: TrendingUp },
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setSelectedView(view.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedView === view.id
                      ? "bg-white dark:bg-purple-500/30 text-purple-600 dark:text-purple-300 shadow-sm"
                      : "text-gray-600 dark:text-purple-400 hover:text-gray-900 dark:hover:text-purple-200"
                  }`}
                >
                  <view.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{view.label}</span>
                </button>
              ))}
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-purple-300" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-purple-500/20 text-gray-900 dark:text-purple-100 placeholder:dark:text-purple-300/70 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm dark:shadow-purple-500/20 backdrop-blur-sm w-48"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-purple-500/20 text-gray-700 dark:text-purple-300 hover:bg-gray-50 dark:hover:bg-purple-500/30 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>{dateRange} days</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {filterOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-purple-500/20 border border-gray-200 dark:border-purple-500/30 rounded-xl shadow-xl z-[9999] py-2">
                    {["7", "30", "90", "365"].map((days) => (
                      <button
                        key={days}
                        onClick={() => {
                          setDateRange(days);
                          setFilterOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-purple-500/30 text-gray-700 dark:text-purple-300"
                      >
                        Last {days} days
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={exportAnalytics}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg transform hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {selectedView === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                  {
                    icon: Activity,
                    label: "Total Tasks",
                    value: tasks.length || 44,
                    change: "+12%",
                    color: "blue",
                    description: "All active tasks",
                  },
                  {
                    icon: CheckCircle,
                    label: "Completed",
                    value: taskStatusData[0].value,
                    change: "+8%",
                    color: "green",
                    description: "Successfully completed",
                  },
                  {
                    icon: AlertCircle,
                    label: "Overdue",
                    value: taskStatusData[3].value,
                    change: "-15%",
                    color: "red",
                    description: "Needs immediate attention",
                  },
                  {
                    icon: Users,
                    label: "Team Members",
                    value: employees.length || 12,
                    change: "+2",
                    color: "purple",
                    description: "Active team members",
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-3 bg-gradient-to-r ${
                          stat.color === "blue"
                            ? "from-blue-500 to-blue-600"
                            : stat.color === "green"
                            ? "from-green-500 to-green-600"
                            : stat.color === "red"
                            ? "from-red-500 to-red-600"
                            : "from-purple-500 to-purple-600"
                        } rounded-xl shadow-lg group-hover:scale-110 transition-transform`}
                      >
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div
                        className={`text-sm font-semibold px-2 py-1 rounded-full ${
                          stat.change.startsWith("+")
                            ? "text-green-600 bg-green-100"
                            : "text-red-600 bg-red-100"
                        }`}
                      >
                        {stat.change}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Task Status Distribution */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="liquid-glass-card"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Task Status Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, value, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {taskStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {taskStatusData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {item.name}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100 ml-auto">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Performance Trends */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="liquid-glass-card"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Performance Trends
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceTrends.slice(-14)}>
                        <defs>
                          <linearGradient
                            id="completedGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={colors.success}
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor={colors.success}
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                          <linearGradient
                            id="createdGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={colors.info}
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor={colors.info}
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          stroke="#6b7280"
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "none",
                            borderRadius: "12px",
                            color: "#f9fafb",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="completed"
                          stroke={colors.success}
                          fillOpacity={1}
                          fill="url(#completedGradient)"
                          strokeWidth={2}
                          name="Completed"
                        />
                        <Area
                          type="monotone"
                          dataKey="created"
                          stroke={colors.info}
                          fillOpacity={0.6}
                          fill="url(#createdGradient)"
                          strokeWidth={2}
                          name="Created"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Department Performance */}
                
              </div>
            </motion.div>
          )}

          {selectedView === "individual" && (
            <motion.div
              key="individual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Individual Performance Header */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
                  <User className="w-7 h-7 text-blue-600" />
                  **Individual Performance Analytics**
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  **Detailed timing-based performance metrics for each team
                  member**
                </p>
              </div>

              {/* Performance Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {individualPerformance
                  .filter((emp) =>
                    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .sort((a, b) => a.performanceScore - b.performanceScore) // Show lowest performers first
                  .map((emp, index) => (
                    <motion.div
                      key={emp.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                        emp.performanceLevel.level === "critical"
                          ? "border-red-300 dark:border-red-700"
                          : emp.performanceLevel.level === "needs_improvement"
                          ? "border-orange-300 dark:border-orange-700"
                          : "border-gray-200/50 dark:border-gray-700/50"
                      }`}
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      <div className="p-6">
                        {/* Employee Header */}
                        <div className="flex items-center gap-4 mb-4">
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              {emp.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {emp.role}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {emp.department}
                            </p>
                          </div>
                          <div
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              emp.performanceLevel.level === "critical"
                                ? "bg-red-100 text-red-800"
                                : emp.performanceLevel.level ===
                                  "needs_improvement"
                                ? "bg-orange-100 text-orange-800"
                                : emp.performanceLevel.level === "average"
                                ? "bg-yellow-100 text-yellow-800"
                                : emp.performanceLevel.level === "good"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                emp.performanceLevel.level === "critical"
                                  ? "bg-red-500"
                                  : emp.performanceLevel.level ===
                                    "needs_improvement"
                                  ? "bg-orange-500"
                                  : emp.performanceLevel.level === "average"
                                  ? "bg-yellow-500"
                                  : emp.performanceLevel.level === "good"
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                              }`}
                            ></div>
                            {emp.performanceLevel.description}
                          </div>
                        </div>

                        {/* Performance Score */}

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-lg font-bold text-green-700 dark:text-green-300">
                              {emp.onTimeTasks}
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-400">
                              On-Time
                            </div>
                          </div>
                          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="text-lg font-bold text-red-700 dark:text-red-300">
                              {emp.overdueTasks}
                            </div>
                            <div className="text-xs text-red-600 dark:text-red-400">
                              Overdue
                            </div>
                          </div>
                          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
                              {emp.lateTasks}
                            </div>
                            <div className="text-xs text-orange-600 dark:text-orange-400">
                              Late
                            </div>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                              {emp.avgDelayDays}d
                            </div>
                            <div className="text-xs text-yellow-600 dark:text-yellow-400">
                              Avg Delay
                            </div>
                          </div>
                        </div>

                        {/* Critical Issues */}
                        {(emp.overdueTasks > 0 || emp.lateRate > 30) && (
                          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-semibold text-red-800 dark:text-red-200">
                                **Critical Issues**
                              </span>
                            </div>
                            <div className="space-y-1">
                              {emp.overdueTasks > 0 && (
                                <div className="text-xs text-red-700 dark:text-red-300">
                                  • {emp.overdueTasks} tasks overdue
                                </div>
                              )}
                              {emp.lateRate > 30 && (
                                <div className="text-xs text-red-700 dark:text-red-300">
                                  • {emp.lateRate.toFixed(1)}% late completion
                                  rate
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all group-hover:scale-105 flex items-center justify-center gap-2">
                          <Eye className="w-4 h-4" />
                          **View Detailed Report**
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          )}

          {selectedView === "trends" && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Trends Header */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
                  <TrendingUp className="w-7 h-7 text-green-600" />
                  **Performance Trends & Insights**
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  **Long-term performance analysis and productivity trends**
                </p>
              </div>

              {/* Comprehensive Trends Chart */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  **30-Day Performance Trends**
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={performanceTrends}>
                      <XAxis dataKey="date" stroke="#6b7280" tick={false} />
                      <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "none",
                          borderRadius: "12px",
                          color: "#f9fafb",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        fill="url(#completedGradient)"
                        stroke={colors.success}
                        strokeWidth={2}
                        name="Tasks Completed"
                      />
                      <Bar
                        dataKey="created"
                        fill={colors.info}
                        name="Tasks Created"
                      />
                      <Line
                        type="monotone"
                        dataKey="efficiency"
                        stroke={colors.warning}
                        strokeWidth={3}
                        name="Efficiency %"
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Team Radar Chart */}
              
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Employee Detail Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEmployee(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedEmployee.avatar}
                      alt={selectedEmployee.name}
                      className="w-20 h-20 rounded-full border-4 border-blue-200"
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {selectedEmployee.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedEmployee.role} • {selectedEmployee.department}
                      </p>
                      <div
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                          selectedEmployee.performanceLevel.level === "critical"
                            ? "bg-red-100 text-red-800"
                            : selectedEmployee.performanceLevel.level ===
                              "needs_improvement"
                            ? "bg-orange-100 text-orange-800"
                            : selectedEmployee.performanceLevel.level ===
                              "average"
                            ? "bg-yellow-100 text-yellow-800"
                            : selectedEmployee.performanceLevel.level === "good"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            selectedEmployee.performanceLevel.level ===
                            "critical"
                              ? "bg-red-500"
                              : selectedEmployee.performanceLevel.level ===
                                "needs_improvement"
                              ? "bg-orange-500"
                              : selectedEmployee.performanceLevel.level ===
                                "average"
                              ? "bg-yellow-500"
                              : selectedEmployee.performanceLevel.level ===
                                "good"
                              ? "bg-blue-500"
                              : "bg-green-500"
                          }`}
                        ></div>
                        **{selectedEmployee.performanceLevel.description}**
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Performance Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                    <CustomTooltip performanceData={performanceData}>
                      <div className="flex items-center gap-1 cursor-pointer">
                        Performance Matrix:{" "}
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {performanceData.totalPerformanceScore}%
                        </span>
                      </div>
                    </CustomTooltip>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      Overall Performance
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {Math.round(selectedEmployee.onTimeRate)}%
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      On-Time Rate
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl">
                    <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                      {selectedEmployee.overdueTasks}
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400">
                      Overdue Tasks
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl">
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                      {selectedEmployee.avgDelayDays}d
                    </div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">
                      Avg Delay
                    </div>
                  </div>
                </div>

                {/* Reports Section */}

                {/* Recent Tasks */}
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-gray-600" />
                    **Recent Tasks**
                  </h3>
                  <div className="space-y-2">
                    {selectedEmployee.recentTasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Due: {task.due_date} • Priority: {task.priority}
                          </p>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            task.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : task.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : task.status === "overdue"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {task.status.replace("_", " ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside handler for filter dropdown */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setFilterOpen(false)}
        />
      )}
    </div>
  );
};

export default Analytics;