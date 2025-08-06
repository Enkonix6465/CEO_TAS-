import React, { useEffect, useState } from "react";
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
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    dashboard: true,
    projects: false,
    tickets: false,
    administration: false,
  });

  useEffect(() => {
    // Apply theme from store
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;
      const target = event.target as Element;

      if (filterOpen && !target.closest('.filter-dropdown')) {
        setFilterOpen(false);
      }
      if (sortOpen && !target.closest('.sort-dropdown')) {
        setSortOpen(false);
      }
      if (workspaceOpen && !target.closest('.workspace-dropdown')) {
        setWorkspaceOpen(false);
      }
      if (projectOpen && !target.closest('.project-dropdown')) {
        setProjectOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen, sortOpen, workspaceOpen, projectOpen]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  const isActive = (path: string) => location.pathname === path;
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };



  return (
    <div className="min-h-screen h-screen bg-gradient-to-br from-cyan-50 to-orange-50 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20 flex overflow-hidden">
      <FirebaseConnectionStatus />
      {/* Compact Sidebar */}
      <div className={`${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-[200px] lg:w-[220px] bg-gradient-to-b from-cyan-100/95 to-orange-100/95 dark:bg-gradient-to-b dark:from-black/95 dark:to-black/90 backdrop-blur-xl border-r border-cyan-300 dark:border-purple-500/40 transition-all duration-300 ease-in-out flex flex-col`}>

        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-300 dark:border-purple-500/40 bg-gradient-to-r from-cyan-50 to-orange-50 dark:from-black/95 dark:to-black/90">
          <div className="relative workspace-dropdown">
            <button
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-purple-500/20 rounded-lg px-3 py-2 transition-all duration-200"
            >
              <span className="text-base font-semibold text-gray-900 dark:text-purple-200">Task Board</span>
              <ChevronDown className="w-4 h-4 text-gray-400 dark:text-purple-300" />
            </button>
            {workspaceOpen && (
              <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-black/95 border border-gray-200 dark:border-purple-500/30 rounded-lg backdrop-blur-xl z-[9999] p-2">
                <div className="space-y-1">
                  <div className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-purple-200">Workspaces</div>
                  <button
                    onClick={() => setWorkspaceOpen(false)}
                    className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-500/20 rounded"
                  >
                   
                    + Create workspace
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="md:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>


        {/* Navigation - Compact */}
        <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
          <nav className="space-y-2">

            {/* Dashboard Section */}
            <div>
              <button
                onClick={() => toggleSection('dashboard')}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-700 dark:text-purple-200 hover:bg-gray-100 dark:hover:bg-purple-500/20 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Grid3X3 className="w-4 h-4" />
                  Dashboard
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.dashboard ? 'rotate-0' : '-rotate-90'}`} />
              </button>
              {expandedSections.dashboard && (
                <div className="ml-6 mt-2 space-y-1">
                  <Link
                    to="/"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                      isActive("/")
                        ? "bg-purple-50 dark:bg-purple-500/30 text-purple-700 dark:text-purple-200 font-medium"
                        : "text-gray-600 dark:text-purple-300 hover:bg-gray-100 dark:hover:bg-purple-500/15 hover:text-gray-900 dark:hover:text-purple-200"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                    Overview
                  </Link>
                  <Link
                    to="/PerformMatrix"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${
                      isActive("/PerformMatrix")
                        ? "bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-cyan-900/30 dark:to-orange-900/30 text-black dark:text-white font-medium border border-cyan-300 dark:border-orange-500/40"
                        : "text-black dark:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-orange-50 dark:hover:bg-gradient-to-r dark:hover:from-cyan-900/20 dark:hover:to-orange-900/20"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Performance
                  </Link>
                  <Link
                    to="/KanbanPage"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${
                      isActive("/KanbanPage")
                        ? "bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-cyan-900/30 dark:to-orange-900/30 text-black dark:text-white font-medium border border-cyan-300 dark:border-orange-500/40"
                        : "text-black dark:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-orange-50 dark:hover:bg-gradient-to-r dark:hover:from-cyan-900/20 dark:hover:to-orange-900/20"
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    Kanban Board
                  </Link>
                  <Link
                    to="/Analytics"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${
                      isActive("/Analytics")
                        ? "bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-cyan-900/30 dark:to-orange-900/30 text-black dark:text-white font-medium border border-cyan-300 dark:border-orange-500/40"
                        : "text-black dark:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-orange-50 dark:hover:bg-gradient-to-r dark:hover:from-cyan-900/20 dark:hover:to-orange-900/20"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </Link>
                  <Link
                    to="/Reports"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${
                      isActive("/Reports")
                        ? "bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-cyan-900/30 dark:to-orange-900/30 text-black dark:text-white font-medium border border-cyan-300 dark:border-orange-500/40"
                        : "text-black dark:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-orange-50 dark:hover:bg-gradient-to-r dark:hover:from-cyan-900/20 dark:hover:to-orange-900/20"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Reports
                  </Link>
                  <Link
                    to="/calendar"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${
                      isActive("/calendar")
                        ? "bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-cyan-900/30 dark:to-orange-900/30 text-black dark:text-white font-medium border border-cyan-300 dark:border-orange-500/40"
                        : "text-black dark:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-orange-50 dark:hover:bg-gradient-to-r dark:hover:from-cyan-900/20 dark:hover:to-orange-900/20"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Calendar
                  </Link>
                </div>
              )}
            </div>

            {/* Projects Section */}
            <div>
              <button
                onClick={() => toggleSection('projects')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Projects
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform ${expandedSections.projects ? 'rotate-0' : '-rotate-90'}`} />
              </button>
              {expandedSections.projects && (
                <div className="ml-5 mt-1 space-y-1">
                  <Link
                    to="/ProjectTasksViewer"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${
                      isActive("/ProjectTasksViewer")
                        ? "bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-cyan-900/30 dark:to-orange-900/30 text-black dark:text-white font-medium border border-cyan-300 dark:border-orange-500/40"
                        : "text-black dark:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-orange-50 dark:hover:bg-gradient-to-r dark:hover:from-cyan-900/20 dark:hover:to-orange-900/20"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Project Tasks
                  </Link>
                  <Link
                    to="/ProjectDashboard"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${
                      isActive("/ProjectDashboard")
                        ? "bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-cyan-900/30 dark:to-orange-900/30 text-black dark:text-white font-medium border border-cyan-300 dark:border-orange-500/40"
                        : "text-black dark:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-orange-50 dark:hover:bg-gradient-to-r dark:hover:from-cyan-900/20 dark:hover:to-orange-900/20"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    Project Dashboard
                  </Link>
                  <Link
                    to="/ProjectDocCreator"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${
                      isActive("/ProjectDocCreator")
                        ? "bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-cyan-900/30 dark:to-orange-900/30 text-black dark:text-white font-medium border border-cyan-300 dark:border-orange-500/40"
                        : "text-black dark:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-orange-50 dark:hover:bg-gradient-to-r dark:hover:from-cyan-900/20 dark:hover:to-orange-900/20"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Document Creator
                  </Link>
                </div>
              )}
            </div>

            {/* Tickets Section */}
            <div>
              <button
                onClick={() => toggleSection('tickets')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Tickets
                </div>
                <ChevronRight className={`w-3 h-3 transition-transform ${expandedSections.tickets ? 'rotate-90' : 'rotate-0'}`} />
              </button>
              {expandedSections.tickets && (
                <div className="ml-5 mt-1 space-y-1">
                  <Link
                    to="/RaiseProjectTicket"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${
                      isActive("/RaiseProjectTicket")
                        ? "bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-cyan-900/30 dark:to-orange-900/30 text-black dark:text-white font-medium border border-cyan-300 dark:border-orange-500/40"
                        : "text-black dark:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-orange-50 dark:hover:bg-gradient-to-r dark:hover:from-cyan-900/20 dark:hover:to-orange-900/20"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Raise Ticket
                  </Link>
                  <Link
                    to="/ViewTickets"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${
                      isActive("/ViewTickets")
                        ? "bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-cyan-900/30 dark:to-orange-900/30 text-black dark:text-white font-medium border border-cyan-300 dark:border-orange-500/40"
                        : "text-black dark:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-orange-50 dark:hover:bg-gradient-to-r dark:hover:from-cyan-900/20 dark:hover:to-orange-900/20"
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    View Tickets
                  </Link>
                </div>
              )}
            </div>

            {/* Administration Section */}
            <div>
              <button
                onClick={() => toggleSection('administration')}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Administration
                </div>
                <ChevronRight className={`w-3 h-3 transition-transform ${expandedSections.administration ? 'rotate-90' : 'rotate-0'}`} />
              </button>
              {expandedSections.administration && (
                <div className="ml-5 mt-1 space-y-1">
                  <Link
                    to="/AddUsers"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${
                      isActive("/AddUsers")
                        ? "bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-cyan-900/30 dark:to-orange-900/30 text-black dark:text-white font-medium border border-cyan-300 dark:border-orange-500/40"
                        : "text-black dark:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-orange-50 dark:hover:bg-gradient-to-r dark:hover:from-cyan-900/20 dark:hover:to-orange-900/20"
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Users
                  </Link>
                  <Link
                    to="/Makeleader"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${
                      isActive("/Makeleader")
                        ? "bg-gradient-to-r from-cyan-100 to-orange-100 dark:bg-gradient-to-r dark:from-cyan-900/30 dark:to-orange-900/30 text-black dark:text-white font-medium border border-cyan-300 dark:border-orange-500/40"
                        : "text-black dark:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-orange-50 dark:hover:bg-gradient-to-r dark:hover:from-cyan-900/20 dark:hover:to-orange-900/20"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Make Team Lead
                  </Link>
                </div>
              )}
            </div>


          </nav>
        </div>

        {/* User Profile */}
        <div className="border-t border-gray-200 dark:border-purple-500/30 px-4 py-3 bg-gradient-to-r from-gray-50 to-white dark:from-black/95 dark:to-black/90">
          <div className="flex items-center gap-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-black/90 dark:to-black/80 rounded-lg px-3 py-2 shadow-sm dark:shadow-purple-500/20 border dark:border-purple-500/20">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-purple-200">
                Admin
              </p>
              <p className="text-xs text-gray-500 dark:text-purple-300/70 truncate">
                Project Manager
              </p>
            </div>
            <button
              onClick={signOut}
              className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-purple-500/20"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3 text-gray-500 dark:text-purple-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Compact Top Header */}
        <header className="bg-gradient-to-r from-cyan-100/95 to-orange-100/95 dark:bg-gradient-to-r dark:from-black/95 dark:to-black/90 backdrop-blur-xl border-b border-cyan-300 dark:border-purple-500/40 px-4 py-2 shadow-lg shadow-cyan-500/20 dark:shadow-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className="md:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="relative project-dropdown">
                <button
                  onClick={() => setProjectOpen(!projectOpen)}
                  className="flex items-center gap-1 text-xs text-gray-600 dark:text-purple-200 hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded-lg px-2 py-1.5 transition-all duration-200 hover:shadow-sm"
                >
                  <span>Project Board </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {projectOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-black/95 border border-gray-200 dark:border-purple-500/30 rounded shadow-lg z-[9999] p-2">
                    <div className="space-y-1">
                      <div className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-purple-200">Recent Projects</div>
                      <Link
                        to="/KanbanPage"
                        onClick={() => setProjectOpen(false)}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded dark:text-purple-100 block"
                      >
                        📋 Project Board
                      </Link>
                      <Link
                        to="/ProjectDashboard"
                        onClick={() => setProjectOpen(false)}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded dark:text-purple-100 block"
                      >
                        🚀 Product Dashboard
                      </Link>
                      <Link
                        to="/ProjectTasksViewer"
                        onClick={() => setProjectOpen(false)}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded dark:text-purple-100 block"
                      >
                        💼 Project Tasks
                      </Link>
                      <hr className="my-1 border-gray-200 dark:border-purple-500/30" />
                      <Link
                        to="/ProjectDashboard"
                        onClick={() => setProjectOpen(false)}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded text-blue-600 dark:text-purple-300 block"
                      >
                        + Create project
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <span className="px-1 py-0.5 text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded">On track</span>
            </div>

            <div className="flex items-center gap-2">

              <div className="relative filter-dropdown">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-black/90 text-gray-700 dark:text-purple-300 hover:bg-gray-50 dark:hover:bg-black/80 shadow-sm transition-all duration-200 hover:shadow-md dark:shadow-purple-500/20"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                  <ChevronDown className="w-4 h-4" />
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-black/95 border border-gray-200 dark:border-purple-500/30 rounded shadow-lg z-[99999] p-3">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status
                        </label>
                        <select className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-purple-500/30 rounded bg-white dark:bg-black/90 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500">
                          <option>All Status</option>
                          <option>Active</option>
                          <option>Completed</option>
                          <option>On Hold</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-purple-300 mb-1">
                          Assignee
                        </label>
                        <select className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-purple-500/30 rounded bg-white dark:bg-black/90 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500">
                          <option>All Members</option>
                          <option>Me</option>
                          <option>Team Lead</option>
                          <option>Unassigned</option>
                        </select>
                      </div>
                      <div className="flex justify-between pt-2">
                        <button
                          onClick={() => setFilterOpen(false)}
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

              <div className="relative sort-dropdown">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-purple-500/30 rounded-lg bg-white dark:bg-black/90 text-gray-700 dark:text-purple-300 hover:bg-gray-50 dark:hover:bg-black/80 shadow-sm transition-all duration-200 hover:shadow-md dark:shadow-purple-500/20"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  Sort
                  <ChevronDown className="w-4 h-4" />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-black/95 border border-gray-200 dark:border-purple-500/30 rounded shadow-lg z-[99999] p-2">
                    <div className="space-y-1">
                      <button
                        onClick={() => setSortOpen(false)}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded dark:text-purple-100"
                      >
                        Date Created
                      </button>
                      <button
                        onClick={() => setSortOpen(false)}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded dark:text-purple-100"
                      >
                        Due Date
                      </button>
                      <button
                        onClick={() => setSortOpen(false)}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded dark:text-purple-100"
                      >
                        Priority
                      </button>
                      <button
                        onClick={() => setSortOpen(false)}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-purple-700/40 rounded dark:text-purple-100"
                      >
                        Alphabetical
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/TeamManager"
                className="px-3 py-1.5 text-xs bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 shadow-md transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                title="View created teams"
              >
                Created Teams
              </Link>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  // You could add a toast notification here
                }}
                className="px-3 py-1.5 text-xs bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 shadow-md transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                title="Copy project link"
              >
                Share
              </button>

              {/* Settings Button */}
              <Link
                to="/settings"
                className="p-2 rounded-lg bg-white dark:bg-black/90 text-gray-700 dark:text-purple-300 hover:bg-gray-50 dark:hover:bg-black/80 border border-gray-200 dark:border-purple-500/30 shadow-sm transition-all duration-200 hover:shadow-md dark:shadow-purple-500/20"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white dark:bg-black/90 text-gray-700 dark:text-purple-300 hover:bg-gray-50 dark:hover:bg-black/80 border border-gray-200 dark:border-purple-500/30 shadow-sm transition-all duration-200 hover:shadow-md dark:shadow-purple-500/20"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </button>

            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 flex flex-col min-h-0 bg-stone-50/50 dark:bg-gradient-to-br dark:from-black/90 dark:via-black/80 dark:to-black/90 m-2 rounded-xl backdrop-blur-sm border dark:border-purple-500/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="flex-1 min-h-0 overflow-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Create New Task</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Add task creation logic here
                  setShowNewTaskModal(false);
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Create New Team</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team Lead
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter team lead email"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Add team creation logic here
                  setShowCreateTeamModal(false);
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Layout;
