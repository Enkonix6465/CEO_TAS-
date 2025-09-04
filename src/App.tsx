import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import UserManagement from "./pages/UserManagement";
import { Toaster } from "react-hot-toast";
import MyTasks from "./pages/MyTasks";
import TeamManager from "./pages/TeamManager";
import AddUsers from "./pages/AddUsers";
import RaiseProjectTicket from "./pages/RaiseProjectTicket";
import ProjectTasksViewer from "./pages/ProjectTasksViewer";
import ProjectDashboard from "./pages/ProjectDashboard";
import ViewTickets from "./pages/ViewTickets";
import Kanbanpage from "./pages/KanbanPage";
import ProjectDocCreator from "./pages/ProjectDocCreator";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import { View } from "lucide-react";
import PerformMatrix from "./pages/PerformMatrix";
import DashboardPage from "./pages/DashboardPage";
import Makeleader from "./pages/Makeleader";
import TeamLeadAssignment from "./pages/TeamLeadAssignment";
import FeedbackPage from "./pages/FeedbackPage";
import TaskDetail from "./pages/TaskDetail";
import ProjectDetail from "./pages/ProjectDetail";
import { ConnectionStatusIndicator } from "./components/ConnectionStatusIndicator";
import ErrorBoundary from "./components/ErrorBoundary";
import BugReportPage from "./pages/BugReportPage";
import AllTasksPage from "./pages/AllTasksPage";
function App() {
  const { user, loading } = useAuthStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      <ConnectionStatusIndicator />
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="AddUsers" element={<AddUsers />} />
          <Route path="PerformMatrix" element={<PerformMatrix />} />
          <Route path="DashboardPage" element={<DashboardPage />} />
          <Route path="TeamManager" element={<TeamManager />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="projects" element={<Projects />} />
          <Route path="project/:projectId" element={<ProjectDetail />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="Makeleader" element={<Makeleader />} />
          <Route path="team-lead-assignment" element={<TeamLeadAssignment />} />
          <Route path="FeedbackPage" element={<FeedbackPage />} />
          <Route path="mytasks" element={<MyTasks />} />
          <Route path="ProjectDashboard" element={<ProjectDashboard />} />
          <Route path="ProjectTasksViewer" element={<ProjectTasksViewer />} />
          <Route path="RaiseProjectTicket" element={<RaiseProjectTicket />} />
          <Route path="ViewTickets" element={<ViewTickets />} />
          <Route path="ProjectDocCreator" element={<ProjectDocCreator />} />
          <Route path="Analytics" element={<Analytics />} />
          <Route path="Reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="KanbanPage" element={<Kanbanpage />} />
          <Route path="task/:taskId" element={<TaskDetail />} />
          <Route path="BugReportPage" element={<BugReportPage />}/>
          <Route path="AllTasks" element={<AllTasksPage />}/>
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
