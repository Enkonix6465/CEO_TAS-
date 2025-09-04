import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Briefcase,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Search,
  Bell,
  Plus,
  Star,
  MoreHorizontal,
  ChevronRight,
  Folder,
  FileText,
  UserPlus,
  Shield,
  BarChart3,
  Clock,
  Filter,
  ArrowUpDown,
  Grid3X3,
  TrendingUp,
  Target,
  Activity,
  MessageSquare,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import FirebaseConnectionStatus from "./FirebaseConnectionStatus";

function Layout() {
  const { signOut, user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    dashboard: true,
    projects: false,
    tickets: false,
    administration: false,
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  return (
    <div className="min-h-screen h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/20 dark:to-indigo-900/10 flex overflow-hidden">
      <FirebaseConnectionStatus />
      {/* Enhanced Sidebar */}
      <div className={`${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-[220px] lg:w-[240px] bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-r border-violet-200/50 dark:border-violet-500/20 transition-all duration-300 ease-in-out flex flex-col shadow-xl`}>

        {/* Enhanced Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-violet-200/50 dark:border-violet-500/20 bg-gradient-to-r from-violet-50/80 via-purple-50/80 to-indigo-50/80 dark:from-slate-800/80 dark:to-violet-900/80 backdrop-blur-sm">
          <div className="relative workspace-dropdown">
            <button
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className="flex items-center gap-3 hover:bg-violet-100/60 dark:hover:bg-violet-700/30 rounded-xl px-4 py-3 transition-all duration-200 group"
            >
             
              <div className="text-left">
                <span className="text-base font-bold text-slate-800 dark:text-white block">TAS ENKONIX</span>
              </div>
            </button>
           
          </div>
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-700/30 transition-colors"
          >
            <X className="h-4 w-4 text-violet-600 dark:text-violet-300" />
          </button>
        </div>

        {/* Enhanced Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          <nav className="space-y-3">
            {/* Dashboard Section */}
            <div>
              <button
                onClick={() => toggleSection('dashboard')}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-bold text-slate-700 dark:text-violet-200 hover:bg-violet-100/60 dark:hover:bg-violet-700/30 rounded-xl transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  <span>Dashboard</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.dashboard ? 'rotate-0' : '-rotate-90'} text-violet-500`} />
              </button>
              {expandedSections.dashboard && (
                <div className="ml-6 mt-3 space-y-2">
                  <Link
                    to="/"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-200 group ${
                      isActive("/")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                    <span>Overview</span>
                  </Link>
                  
                  <Link
                    to="/PerformMatrix"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:shadow-md ${
                      isActive("/PerformMatrix")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Performance</span>
                  </Link>
                  <Link
                    to="/KanbanPage"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:shadow-md ${
                      isActive("/KanbanPage")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Kanban Board</span>
                  </Link>
                  <Link
                    to="/Analytics"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:shadow-md ${
                      isActive("/Analytics")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </Link>
                  <Link
                    to="/Reports"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:shadow-md ${
                      isActive("/Reports")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Reports</span>
                  </Link>
                  <Link
                    to="/calendar"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:shadow-md ${
                      isActive("/calendar")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Calendar</span>
                  </Link>
                  <Link
                    to="/AllTasks"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:shadow-md ${
                      isActive("/AllTasks")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    <span>All Tasks</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Projects Section */}
            <div>
              <button
                onClick={() => toggleSection('projects')}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-bold text-slate-700 dark:text-violet-200 hover:bg-violet-100/60 dark:hover:bg-violet-700/30 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  <span>Projects</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${expandedSections.projects ? 'rotate-90' : 'rotate-0'} text-violet-500`} />
              </button>
              {expandedSections.projects && (
                <div className="ml-6 mt-3 space-y-2">
                  <Link
                    to="/ProjectTasksViewer"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:shadow-md ${
                      isActive("/ProjectTasksViewer")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <Folder className="w-4 h-4" />
                    <span>Project Tasks</span>
                  </Link>
                  <Link
                    to="/ProjectDashboard"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:shadow-md ${
                      isActive("/ProjectDashboard")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Project Dashboard</span>
                  </Link>
                  <Link
                    to="/ProjectDocCreator"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:shadow-md ${
                      isActive("/ProjectDocCreator")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Documentation</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Tickets Section */}
            <div>
              <button
                onClick={() => toggleSection('tickets')}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-bold text-slate-700 dark:text-violet-200 hover:bg-violet-100/60 dark:hover:bg-violet-700/30 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  <span>Tickets</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${expandedSections.tickets ? 'rotate-90' : 'rotate-0'} text-violet-500`} />
              </button>
              {expandedSections.tickets && (
                <div className="ml-6 mt-3 space-y-2">
                  <Link
                    to="/RaiseProjectTicket"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:shadow-md ${
                      isActive("/RaiseProjectTicket")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Raise Ticket</span>
                  </Link>
                  <Link
                    to="/ViewTickets"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:shadow-md ${
                      isActive("/ViewTickets")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Tickets</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Administration Section */}
            <div>
              <button
                onClick={() => toggleSection('administration')}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-bold text-slate-700 dark:text-violet-200 hover:bg-violet-100/60 dark:hover:bg-violet-700/30 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  <span>Administration</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${expandedSections.administration ? 'rotate-90' : 'rotate-0'} text-violet-500`} />
              </button>
              {expandedSections.administration && (
                <div className="ml-6 mt-3 space-y-2">
                  <Link
                    to="/AddUsers"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:shadow-md ${
                      isActive("/AddUsers")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Users</span>
                  </Link>
                  <Link
                    to="/Makeleader"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:shadow-md ${
                      isActive("/Makeleader")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Team Lead Assignment</span>
                  </Link>
                  
                  <Link
                    to="/FeedbackPage"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:shadow-md ${
                      isActive("/FeedbackPage")
                        ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:bg-gradient-to-r dark:from-violet-800/40 dark:to-purple-800/40 text-violet-700 dark:text-violet-200 font-semibold shadow-lg border border-violet-200 dark:border-violet-600/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-violet-800/20 dark:hover:to-purple-800/20 hover:text-violet-700 dark:hover:text-violet-200"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>HR Feedback</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Enhanced User Profile */}
        <div className="border-t border-violet-200/50 dark:border-violet-500/20 px-6 py-4 bg-gradient-to-r from-violet-50/60 to-purple-50/60 dark:from-slate-800/60 dark:to-violet-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-4 bg-gradient-to-r from-violet-100/80 to-purple-100/80 dark:from-slate-700/80 dark:to-violet-800/80 rounded-xl px-4 py-3 shadow-lg border border-violet-200/50 dark:border-violet-600/30">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Admin
              </p>
              <p className="text-xs text-violet-600 dark:text-violet-300 truncate">
                Project Manager
              </p>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-lg hover:bg-violet-200/60 dark:hover:bg-violet-700/40 transition-colors group"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-violet-600 dark:text-violet-300 group-hover:text-violet-700 dark:group-hover:text-violet-200" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Top Header */}
        <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-violet-200/50 dark:border-violet-500/20 px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-700/30 transition-colors"
              >
                <Menu className="h-5 w-5 text-violet-600 dark:text-violet-300" />
              </button>
              
              {/* Enhanced Project Dropdown */}
              <div className="relative">
               
                {projectOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-white/95 dark:bg-slate-800/95 border border-violet-200/50 dark:border-violet-500/30 rounded-xl shadow-xl z-50 backdrop-blur-xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-violet-100 dark:border-violet-700">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Recent Projects</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => setProjectOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-700/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-500/20 dark:to-purple-500/20 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-200">View All Projects</span>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              
            </div>

            <div className="flex items-center gap-3">
           
              
              <Link
                to="/settings"
                className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 text-violet-600 dark:text-violet-300 hover:bg-violet-100/60 dark:hover:bg-violet-700/40 border border-violet-200/50 dark:border-violet-500/30 shadow-md transition-all duration-200 backdrop-blur-sm"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
              
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 text-violet-600 dark:text-violet-300 hover:bg-violet-100/60 dark:hover:bg-violet-700/40 border border-violet-200/50 dark:border-violet-500/30 shadow-md transition-all duration-200 backdrop-blur-sm"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* Enhanced Page Content */}
        <main className="flex-1 flex flex-col min-h-0 bg-white/40 dark:bg-slate-900/40 m-3 rounded-2xl backdrop-blur-sm border border-violet-200/50 dark:border-violet-500/20 shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-h-0 overflow-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default Layout;
