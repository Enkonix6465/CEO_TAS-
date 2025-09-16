import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import PortalTooltip from "../components/PortalTooltip";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase"; // adjust path to match your project
import { doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { query, where, orderBy, limit } from "firebase/firestore";
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
import { Modal } from "antd";
import { Input } from "antd";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";


const formatServerTime = (date) => {
  const istOffset = 5.5 * 60; // minutes
  const istDate = new Date(date.getTime() + istOffset * 60 * 1000);

  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");

  let hours = istDate.getUTCHours();
  const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const hourStr = String(hours).padStart(2, "0");

  return `${year}-${month}-${day} ${hourStr}:${minutes} ${ampm}`;
};

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
  const [mailModalOpen, setMailModalOpen] = useState(false);
  const [mailTarget, setMailTarget] = useState(null);
  // At top of component

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tableRef = useRef<HTMLDivElement | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const handleCardClick = (filterType: string) => {
    setFilterStatus(filterType); // store the filter
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

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

  const filteredEmployees = groupedEmployees
    .map((team) => ({
      ...team,
      members: team.members.filter((emp) =>
        searchTerm
          ? emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
          : true
      ),
    }))
    .filter((team) => team.members.length > 0);

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      active: true,
    },
  ];
  useEffect(() => {
    const empIdFromUrl = searchParams.get("empId");
    if (empIdFromUrl && filteredEmployees.length > 0) {
      const foundEmp = filteredEmployees
        .flatMap((team) => team.members || [])
        .find((emp) => String(emp.id) === String(empIdFromUrl));
      if (foundEmp) {
        setSelectedEmployee(foundEmp);
        console.log("✅ Auto-selected from URL:", foundEmp);
      }
    }
  }, [searchParams, filteredEmployees]);

  const MailModal = ({ open, onClose, employee, score, sendMailAPI }) => {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (!employee) return;

      let defaultSubject = "Performance Feedback";
      let defaultMessage = `Dear ${employee.name},\n\n`;

      if (score < 50) {
        defaultSubject = "⚠️ Poor Performance Alert";
        defaultMessage +=
          "Your performance has been rated as poor. The company is closely monitoring your improvement. Continued performance at this level may have consequences.";
      } else if (score < 70) {
        defaultSubject = "🟡 Average Performance";
        defaultMessage +=
          "Your performance has been average. While acceptable, there is room for improvement. The company encourages you to strive for better results.";
      } else if (score < 90) {
        defaultSubject = "✅ Good Job!";
        defaultMessage +=
          "Your performance has been good. Keep up the solid work and continue improving.";
      } else {
        defaultSubject = "🎉 Excellent Performance!";
        defaultMessage +=
          "Your performance has been excellent! Thank you for your hard work and dedication.";
      }

      defaultMessage += "\n\nRegards,\nHR Team";

      setSubject(defaultSubject);
      setBody(defaultMessage);
    }, [employee, score]);

    const handleSend = async () => {
      setLoading(true);
      try {
        // 1. Send email via API
        const res = await fetch(sendMailAPI, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: employee.email,
            subject,
            text: body,
            totalPerformance: score,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to send email: ${res.status} - ${errorText}`);
        }

        // 2. Save email log in Firestore
        await addDoc(collection(db, "sendmails"), {
          uid: employee.id, // ✅ Save UID
          to: employee.email,
          name: employee.name,
          subject,
          body,
          totalPerformance: score,
          sentAt: serverTimestamp(),
        });

        toast.success("Email sent successfully!");
        onClose();
      } catch (error) {
        console.error("Email Error:", error);
        toast.error("Failed to send email.");
      } finally {
        setLoading(false);
      }
    };

    if (!employee) return null;

    return (
      <Modal
        title={<span className="text-gray-900 dark:text-gray-100">{`Send Mail to ${employee.name}`}</span>}
        open={open}
        onCancel={onClose}
        onOk={handleSend}
        okText="Send Email"
        confirmLoading={loading}
        className="dark:bg-gray-800"
        styles={{
          content: {
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)'
          },
          header: {
            backgroundColor: 'var(--background)',
            borderBottom: '1px solid var(--border)'
          }
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
            <Input.TextArea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email body"
              className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>
        </div>
      </Modal>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading performance data...
          </p>
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
                    exportDate: new Date().toISOString(),
                  };

                  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `performance-${selectedEmployee.name?.replace(
                    /\s+/g,
                    "-"
                  )}-${new Date().toISOString().split("T")[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success(
                    `Performance report exported for ${selectedEmployee.name}! 📊`
                  );
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
              <span className="text-base font-medium text-purple-600 dark:text-purple-400">
                Performance Analytics
              </span>
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
                <span className="text-xs">
                  ({bestDay.performance?.toFixed(1)}%)
                </span>
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
              <span className="text-gray-600 dark:text-gray-400">
                Best Day:
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {bestDay.day}
              </span>
              <span className="text-xs text-gray-500">
                ({bestDay.performance?.toFixed(1)}% success)
              </span>
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
                    const empTasks = tasks.filter(
                      (t) => t.assigned_to === emp.id
                    );
                    const completedTasks = empTasks.filter(
                      (t) => t.progress_status === "completed"
                    );
                    const completionRate =
                      empTasks.length > 0
                        ? (completedTasks.length / empTasks.length) * 100
                        : 0;

                    return (
                      <motion.div
                        key={emp.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => {
                          setSelectedEmployee(emp);
                          navigate(`?empId=${emp.id}`, { replace: true }); // updates URL so refresh works
                        }}
                        className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 ${selectedEmployee?.id === emp.id
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
                            {completionRate.toFixed(0)}% completionRate
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
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        {selectedEmployee.name}
                      </h2>
                      <button
                        onClick={() => {
                          setMailModalOpen(true);
                          setMailTarget(selectedEmployee);
                        }}
                        className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Send Mail
                      </button>
                    </div>
                    <p className="text-gray-600 dark:text-purple-300/80">
                      {selectedEmployee.department}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-purple-300/70">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Employee ID: {selectedEmployee.id.slice(-6)}
                      </div>
                      
                      <PortalTooltip 
    triggerContent={
     <div className="flex items-center gap-2">
  <div className="flex items-center gap-1">
    Performance Matrix:{" "}
    <span className="font-bold text-purple-600 dark:text-purple-400">
      {performanceData.totalPerformanceScore}%
    </span>
  </div>
  
  <button
    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
    onClick={() => console.log("Button clicked")}
  >
    View Details
  </button>
</div>

    }
  >
    <div className="whitespace-pre-line text-sm">
      <div className="font-semibold mb-2">
        ⭐️ Performance Score Breakdown
      </div>
      <div className="space-y-1 text-gray-800 dark:text-gray-200">
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
      <p className="font-bold text-gray-900 dark:text-gray-100">
        🏁 Final Score: {performanceData?.totalPerformanceScore ?? "0"}% /
        100%
      </p>
    </div>
  </PortalTooltip>

                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div onClick={() => handleCardClick("all")}>
                  <StatCard
                    label="Tasks Assigned"
                    value={performanceData.total}
                    icon={Target}
                    color="blue"
                  />
                </div>
                <div onClick={() => handleCardClick("completed")}>
                  <StatCard
                    label="Tasks Completed"
                    value={performanceData.completed}
                    icon={CheckCircle}
                    color="green"
                    subtitle={`${performanceData.completionRate?.toFixed(
                      1
                    )}% completion rate`}
                  />
                </div>
                <div onClick={() => handleCardClick("onTime")}>
                  <StatCard
                    label="On-Time Completion"
                    value={performanceData.onTime}
                    icon={Clock}
                    color="blue"
                    subtitle={`${performanceData.onTimeRate?.toFixed(
                      1
                    )}% on-time rate`}
                  />
                </div>
                <div onClick={() => handleCardClick("reassigned")}>
                  <StatCard
                    label="Reassignments"
                    value={performanceData.reassigned}
                    icon={Activity}
                    color="yellow"
                  />
                </div>
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
                        {dateChartData.length > 0
                          ? `${dateChartData[dateChartData.length - 1]
                            ?.Completed ?? 0
                          }%`
                          : "0%"}
                      </span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dateChartData.slice(-10)}>
                      <XAxis
                        dataKey="date"
                        tick={false}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{
                          fontSize: 10,
                          fill: document.documentElement.classList.contains(
                            "dark"
                          )
                            ? "#9ca3af"
                            : "#6b7280",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{
                          fontSize: 10,
                          fill: document.documentElement.classList.contains(
                            "dark"
                          )
                            ? "#9ca3af"
                            : "#6b7280",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor:
                            document.documentElement.classList.contains("dark")
                              ? "#1f2937"
                              : "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="Completed"
                        name="Tasks Completed"
                        fill="#4ade80"
                        radius={[4, 4, 0, 0]}
                        stroke="#22c55e"
                        strokeWidth={1}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="Reassigned"
                        name="Tasks Reassigned"
                        fill="#facc15"
                        radius={[4, 4, 0, 0]}
                        stroke="#eab308"
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
                    <RadarChart
                      data={[
                        {
                          dimension: "Task Completion",
                          value: performanceData.completionRate || 0,
                          fullMark: 100,
                        },
                        {
                          dimension: "On-Time Delivery",
                          value: performanceData.onTimeRate || 0,
                          fullMark: 100,
                        },
                        {
                          dimension: "Quality Score",
                          value:
                            qualityProductivityData.length > 0
                              ? qualityProductivityData.reduce(
                                (acc, item) => acc + item.quality,
                                0
                              ) / qualityProductivityData.length
                              : 0,
                          fullMark: 100,
                        },
                        {
                          dimension: "Productivity",
                          value:
                            qualityProductivityData.length > 0
                              ? ((qualityProductivityData.reduce(
                                (acc, item) => acc + item.productivity,
                                0
                              ) /
                                qualityProductivityData.length) *
                                100) /
                              120
                              : 0,
                          fullMark: 100,
                        },
                        {
                          dimension: "Reliability",
                          value:
                            performanceData.total > 0
                              ? Math.max(
                                0,
                                100 -
                                (performanceData.reassigned /
                                  performanceData.total) *
                                100
                              )
                              : 0,
                          fullMark: 100,
                        },
                        {
                          dimension: "Consistency",
                          value:
                            performanceTrends.length > 0
                              ? 100 -
                              (Math.max(
                                ...performanceTrends.map((t) => t.performance)
                              ) -
                                Math.min(
                                  ...performanceTrends.map(
                                    (t) => t.performance
                                  )
                                ))
                              : 0,
                          fullMark: 100,
                        },
                      ]}
                    >
                      <PolarAngleAxis
                        dataKey="dimension"
                        tick={{
                          fontSize: 11,
                          fill: document.documentElement.classList.contains(
                            "dark"
                          )
                            ? "#d1d5db"
                            : "#374151",
                          fontWeight: 500,
                        }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fontSize: 9, fill: "#9ca3af" }}
                        tickCount={5}
                      />
                      <Radar
                        name="Performance Score"
                        dataKey="value"
                        stroke="#00D4FF"
                        fill="#00D4FF"
                        fillOpacity={0.3}
                        strokeWidth={3}
                        dot={{ fill: "#00D4FF", strokeWidth: 2, r: 4 }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload[0]) {
                            return (
                              <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {label}
                                </p>
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
              <div ref={tableRef}>
                <h3 className="font-semibold text-lg mb-2">
                  Detailed Task Information
                </h3>
                <div className="overflow-x-auto max-h-[400px] border rounded shadow-inner">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Ticket ID
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Title
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Description
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Due Date
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Created At
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Updated At
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Reassigned
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Completion Status
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Created By
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Review
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Productivity
                        </th>

                        <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                          Comments
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {tasks
                        .filter((t) => t.assigned_to === selectedEmployee.id)
                        .filter((t) => {
                          if (!filterStatus) return true;
                          if (filterStatus === "completed")
                            return t.progress_status === "completed";
                          if (filterStatus === "onTime") {
                            const due = new Date(t.due_date);
                            const completed = t.progress_updated_at?.toDate?.();
                            if (!completed || isNaN(due)) return false;
                            const diffDays = Math.floor(
                              (completed - due) / (1000 * 60 * 60 * 24)
                            );
                            return diffDays <= 0;
                          }
                          if (filterStatus === "reassigned")
                            return (t.reassign_history?.length || 0) > 0;
                          return true;
                        })
                        .map((task) => (
                          <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">
                              {task.task_id}
                            </td>

                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                              {task.title}
                            </td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                              {task.description || "-"}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${task.progress_status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                  }`}
                              >
                                {task.progress_status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                              {task.due_date
                                ? formatServerTime(new Date(task.due_date))
                                : "-"}
                            </td>
                            <td className="px-4 py-2 text-gray-500 dark:text-gray-500">
                              {task.created_at
                                ? formatServerTime(task.created_at.toDate())
                                : "-"}
                            </td>

                            <td className="px-4 py-2 text-gray-500 dark:text-gray-500">
                              {task.progress_updated_at
                                ? formatServerTime(
                                  task.progress_updated_at.toDate()
                                )
                                : "-"}
                            </td>

                            <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                              {task.reassign_history?.length || 0}
                            </td>
                            <td className="p-2 border">
                              {(() => {
                                if (!task.progress_updated_at || !task.due_date)
                                  return "Not Completed";

                                const dueDate = new Date(task.due_date);
                                const completedDate = task.progress_updated_at
                                  .toDate
                                  ? task.progress_updated_at.toDate()
                                  : new Date(task.progress_updated_at);

                                const diffMs = completedDate - dueDate;
                                const diffSeconds = Math.floor(
                                  Math.abs(diffMs) / 1000
                                );
                                const hours = Math.floor(diffSeconds / 3600);
                                const minutes = Math.floor(
                                  (diffSeconds % 3600) / 60
                                );
                                const seconds = diffSeconds % 60;

                                if (diffMs <= 0) {
                                  // Early / On Time → Blue
                                  return (
                                    <span className="text-blue-500">
                                      {hours}h {minutes}m {seconds}s early
                                    </span>
                                  );
                                } else {
                                  // Late → Red
                                  return (
                                    <span className="text-red-500">
                                      {hours}h {minutes}m {seconds}s late
                                    </span>
                                  );
                                }
                              })()}
                            </td>

                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300 text-sm">
                              {(() => {
                                const creator = employees.find(
                                  (emp) =>
                                    emp.id?.trim() === task.created_by?.trim()
                                );
                                return creator?.name || task.created_by || "-";
                              })()}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center space-x-2">
                                {/* Status badge */}
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === "completed"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700"
                                    }`}
                                >
                                  {task.status}
                                </span>

                                {/* Small score beside status */}
                                <span className="text-xs text-gray-500">
                                  {task.reviewpoints} / 100
                                </span>
                              </div>

                              {/* Star rating below */}
                              <div className="flex mt-1">
                                {Array.from({ length: 5 }).map((_, index) => {
                                  const isFilled =
                                    task.reviewpoints >= (index + 1) * 20;
                                  return (
                                    <svg
                                      key={index}
                                      className={`w-4 h-4 ${isFilled
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                        }`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.948a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.443a1 1 0 00-.364 1.118l1.287 3.948c.3.921-.755 1.688-1.538 1.118l-3.36-2.443a1 1 0 00-1.175 0l-3.36 2.443c-.783.57-1.838-.197-1.538-1.118l1.287-3.948a1 1 0 00-.364-1.118L2.075 9.375c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.948z" />
                                    </svg>
                                  );
                                })}
                              </div>
                            </td>

                            <td className="px-4 py-2 text-sm font-semibold">
                              {(() => {
                                const assignedAt = task.created_at?.toDate?.();
                                const dueAt = new Date(task.due_date);
                                const completedAt =
                                  task.progress_updated_at?.toDate?.();

                                if (!assignedAt || !dueAt || !completedAt)
                                  return "-";

                                const totalTime =
                                  dueAt.getTime() - assignedAt.getTime();
                                const timeLeft =
                                  dueAt.getTime() - completedAt.getTime();
                                const timeOverdue =
                                  completedAt.getTime() - dueAt.getTime();

                                let score = "-";
                                let explanation = "";

                                if (completedAt <= dueAt) {
                                  const leftRatio = timeLeft / totalTime;
                                  if (leftRatio >= 0.5) {
                                    score = 100;
                                    explanation = `Task completed early — approximately ${(
                                      timeLeft /
                                      (1000 * 60 * 60)
                                    ).toFixed(
                                      1
                                    )} hours ahead of schedule.\nMore than 50% of the time was left unused, reflecting excellent time management.`;
                                  } else if (
                                    leftRatio >= 0 &&
                                    leftRatio < 0.1
                                  ) {
                                    score = 70;
                                    explanation = `Task was completed just before the deadline with ~${(
                                      leftRatio * 100
                                    ).toFixed(
                                      1
                                    )}% of time remaining.\nThis shows timely execution with minimal buffer.`;
                                  } else {
                                    explanation = `Task completed on time but with less than 10% of the total time remaining.\nNo penalty, but little margin left — consider earlier completion next time.`;
                                  }
                                } else {
                                  const overdueRatio = timeOverdue / totalTime;
                                  if (overdueRatio <= 0.1) {
                                    score = 50;
                                    explanation = `Task completed slightly late — by ${(
                                      timeOverdue /
                                      (1000 * 60 * 60)
                                    ).toFixed(1)} hours (~${(
                                      overdueRatio * 100
                                    ).toFixed(
                                      1
                                    )}% past deadline).\nMinor delay, but still acceptable.`;
                                  } else if (overdueRatio <= 0.5) {
                                    score = 30;
                                    explanation = `Task moderately late by ${(
                                      timeOverdue /
                                      (1000 * 60 * 60)
                                    ).toFixed(1)} hours (~${(
                                      overdueRatio * 100
                                    ).toFixed(
                                      1
                                    )}% overdue).\nShows room for improvement in time handling.`;
                                  } else {
                                    score = 10;
                                    explanation = `Task completed severely late by ${(
                                      timeOverdue /
                                      (1000 * 60 * 60)
                                    ).toFixed(1)} hours (~${(
                                      overdueRatio * 100
                                    ).toFixed(
                                      1
                                    )}% beyond deadline).\nSignificant delay — strongly affects productivity score.`;
                                  }
                                }

                                const colorClass =
                                  score === 100
                                    ? "text-green-600"
                                    : score === 70
                                      ? "text-yellow-600"
                                      : score === 50
                                        ? "text-orange-500"
                                        : score === 30
                                          ? "text-yellow-800"
                                          : score === 10
                                            ? "text-red-600"
                                            : "text-gray-600";

                                return (
                                  <div className="relative group cursor-pointer inline-block">
                                    <span className={`${colorClass}`}>
                                      {score}
                                    </span>
                                    <div className="absolute z-50 hidden group-hover:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg rounded-lg px-4 py-2 text-xs max-w-xs w-fit min-w-[200px] whitespace-pre-wrap left-1/2 -translate-x-1/2 top-full mt-2 transition-all duration-200 text-gray-800 dark:text-gray-200">
                                      {explanation}
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>

                            <td className="px-4 py-2 text-gray-500 dark:text-gray-500">
                              {task.comments?.length > 0 ? (
                                <div className="relative group cursor-pointer">
                                  <span className="underline text-blue-500 dark:text-blue-400">
                                    {task.comments.length} comment(s)
                                  </span>
                                  <div className="absolute z-20 hidden group-hover:block bg-white dark:bg-gray-800 border dark:border-gray-600 rounded shadow p-2 text-xs w-64 mt-1">
                                    {task.comments.map((c, i) => (
                                      <div key={i} className="mb-1">
                                        <p className="text-gray-700 dark:text-gray-300">
                                          • {c.text}
                                        </p>
                                        <p className="text-gray-400 dark:text-gray-500 text-[10px]">
                                          {c.timestamp
                                            ? formatServerTime(
                                              new Date(c.timestamp)
                                            )
                                            : "-"}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {mailModalOpen && (
                    <MailModal
                      open={mailModalOpen}
                      onClose={() => {
                        setMailModalOpen(false);
                        setMailTarget(null);
                      }}
                      employee={mailTarget}
                      score={performanceData.totalPerformanceScore || 0}
                      sendMailAPI="https://tas-email-next.vercel.app/api/send-email"
                    />
                  )}
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
                  Choose a team member from the sidebar to view their
                  performance metrics.
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
    green:
      "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30",
    yellow:
      "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30",
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
