import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  doc,
  getDoc,
  deleteDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConnected } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Users,
  Clock,
  User,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Star,
  Target,
  Activity,
  Search,
  Filter,
  Plus,
  Grid,
  List,
  Eye,
  MoreHorizontal,
  Building2,
  Layers3,
} from "lucide-react";

export default function ProjectDashboard() {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    startDate: '',
    deadline: '',
    teamId: ''
  });

  const { currentUser } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if Firebase is available
        if (!db) {
          throw new Error("Firebase not available");
        }

        const projSnap = await getDocs(query(collection(db, "projects")));
        const teamSnap = await getDocs(query(collection(db, "teams")));
        const empSnap = await getDocs(query(collection(db, "employees")));

        setProjects(projSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setTeams(teamSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setEmployees(empSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        setError("Connection failed. Using demo data.");

        // Fallback to mock data
        setProjects([
          {
            id: "1",
            name: "Website Redesign Project",
            description: "Complete redesign of company website with modern UI/UX principles and responsive design for all devices.",
            startDate: "2024-01-15",
            deadline: "2024-03-30",
            created_by: "emp1",
            teamId: "team1",
          },
          {
            id: "2",
            name: "Mobile App Development",
            description: "Development of native mobile application for iOS and Android platforms with real-time features.",
            startDate: "2024-02-01",
            deadline: "2024-05-15",
            created_by: "emp2",
            teamId: "team2",
          },
          {
            id: "3",
            name: "Database Migration",
            description: "Migration of legacy database systems to modern cloud infrastructure with improved performance.",
            startDate: "2024-01-10",
            deadline: "2024-04-20",
            created_by: "emp1",
            teamId: "team1",
          },
          {
            id: "4",
            name: "AI Integration Platform",
            description: "Implementation of machine learning algorithms and AI features into existing business processes.",
            startDate: "2024-02-15",
            deadline: "2024-06-30",
            created_by: "emp3",
            teamId: "team3",
          },
          {
            id: "5",
            name: "Security Audit & Enhancement",
            description: "Comprehensive security review and implementation of enhanced security measures across all systems.",
            startDate: "2024-01-20",
            deadline: "2024-04-10",
            created_by: "emp2",
            teamId: "team2",
          }
        ]);

        setTeams([
          {
            id: "team1",
            teamName: "Frontend Development Team",
            description: "Specializes in user interface and user experience development",
            members: ["emp1", "emp2", "emp3"],
            teamLead: "emp1"
          },
          {
            id: "team2",
            teamName: "Backend Development Team",
            description: "Focuses on server-side development and database management",
            members: ["emp2", "emp4", "emp5"],
            teamLead: "emp2"
          },
          {
            id: "team3",
            teamName: "DevOps & Infrastructure",
            description: "Manages deployment, monitoring, and infrastructure",
            members: ["emp3", "emp5", "emp6"],
            teamLead: "emp3"
          }
        ]);

        setEmployees([
          { id: "emp1", name: "Sarah Johnson", title: "Senior Frontend Developer" },
          { id: "emp2", name: "Michael Chen", title: "Backend Team Lead" },
          { id: "emp3", name: "Emily Rodriguez", title: "DevOps Engineer" },
          { id: "emp4", name: "David Kim", title: "Full Stack Developer" },
          { id: "emp5", name: "Lisa Wang", title: "Database Specialist" },
          { id: "emp6", name: "James Wilson", title: "Infrastructure Architect" }
        ]);

        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getEmployeeName = (id) =>
    employees.find((emp) => emp.id === id)?.name || "Unknown";

  const getTeamName = (id) =>
    teams.find((team) => team.id === id)?.teamName || "Unknown";

  const handleTeamClick = (teamId) => {
    setSelectedTeam(selectedTeam === teamId ? null : teamId);
  };

  const getProjectProgress = (project) => {
    // Mock progress calculation based on project data
    const today = new Date();
    const start = new Date(project.startDate);
    const end = new Date(project.deadline);
    const total = end - start;
    const elapsed = today - start;
    return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
  };

  const getDaysRemaining = (deadline) => {
    const today = new Date();
    const end = new Date(deadline);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProject = async () => {
    if (!isFirebaseConnected()) {
      setError("Cannot create project - Firebase connection unavailable");
      return;
    }

    try {
      const newProjectData = {
        ...newProject,
        created_by: currentUser?.uid || 'admin',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "projects"), newProjectData);
      setProjects(prev => [...prev, { id: docRef.id, ...newProjectData }]);
      setShowNewProjectModal(false);
      setNewProject({
        name: '',
        description: '',
        startDate: '',
        deadline: '',
        teamId: ''
      });
    } catch (error) {
      console.error("Error creating project:", error);
      setError("Failed to create project. Please check your connection and try again.");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Projects</h2>
          <p className="text-gray-600 dark:text-gray-400">Fetching your project data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100/95 to-orange-100/95 dark:bg-gradient-to-br dark:from-black/95 dark:to-black/90">
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-black/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-purple-500/30 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Briefcase className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                  Project Dashboard
                </h1>
                <p className="text-stone-600 dark:text-gray-400 font-medium">
                  Manage and track all your projects
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-stone-100/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl p-1 shadow-inner">
                {[
                  { id: "grid", icon: Grid, label: "Grid" },
                  { id: "list", icon: List, label: "List" }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                      viewMode === mode.id
                        ? 'bg-white/90 dark:bg-gray-600 text-gray-900 dark:text-white shadow-lg backdrop-blur-sm transform scale-105'
                      : 'text-stone-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50'
                    }`}
                  >
                    <mode.icon className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">{mode.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowNewProjectModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">New Project</span>
              </button>
            </div>
          </div>

          {/* Enhanced Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects, descriptions, or team names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-stone-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <button className="p-4 border border-stone-200/50 dark:border-gray-700/50 rounded-xl hover:bg-stone-50/50 dark:hover:bg-gray-700/50 transition-all shadow-sm backdrop-blur-sm">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-6 mb-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Connection Issue</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="liquid-glass-card p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl flex items-center justify-center">
                <Layers3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-purple-100">{projects.length}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-purple-100">Total Projects</h3>
            <p className="text-sm text-gray-600 dark:text-purple-300/80">Active and completed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="liquid-glass-card p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-purple-100">{teams.length}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-purple-100">Active Teams</h3>
            <p className="text-sm text-gray-600 dark:text-purple-300/80">Working on projects</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="liquid-glass-card p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-purple-100">{employees.length}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-purple-100">Team Members</h3>
            <p className="text-sm text-gray-600 dark:text-purple-300/80">Across all teams</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="liquid-glass-card p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-purple-100">
                {projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + getProjectProgress(p), 0) / projects.length) : 0}%
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-purple-100">Avg Progress</h3>
            <p className="text-sm text-gray-600 dark:text-purple-300/80">Across all projects</p>
          </motion.div>
        </div>

        {/* Projects Grid */}
        <div className={`grid gap-6 ${
          viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
        }`}>
          <AnimatePresence>
            {filteredProjects.map((project, index) => {
              const progress = getProjectProgress(project);
              const daysRemaining = getDaysRemaining(project.deadline);
              const isExpanded = selectedTeam === project.teamId;

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onHoverStart={() => setHoveredCard(project.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className="group relative liquid-glass-card overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                          <Building2 className="w-6 h-6 text-stone-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold bg-stone-100/80 dark:bg-gray-700/80 text-stone-600 dark:text-gray-300 px-3 py-1 rounded-full border border-stone-200/50 dark:border-gray-600/50 backdrop-blur-sm">
                              #{index + 1}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              daysRemaining > 30 ? 'bg-stone-100/80 text-stone-600 dark:bg-gray-700/80 dark:text-gray-300 backdrop-blur-sm' :
                              daysRemaining > 7 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button className="p-2 bg-stone-50/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-lg hover:bg-stone-100/80 dark:hover:bg-gray-600/80 transition-colors group-hover:scale-110">
                          <Eye className="w-4 h-4 text-stone-600 dark:text-gray-400" />
                        </button>
                        <button className="p-2 bg-stone-50/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-lg hover:bg-stone-100/80 dark:hover:bg-gray-600/80 transition-colors group-hover:scale-110">
                          <MoreHorizontal className="w-4 h-4 text-stone-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                      {project.name}
                    </h2>

                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{progress}%</span>
                      </div>
                      <div className="w-full bg-stone-200/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-stone-400" />
                        <div>
                          <p className="text-stone-500 dark:text-gray-400 text-xs">Start Date</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{project.startDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-stone-400" />
                        <div>
                          <p className="text-stone-500 dark:text-gray-400 text-xs">Deadline</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{project.deadline}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm mb-4">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Created By</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{getEmployeeName(project.created_by)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Team Section */}
                  <div className="px-6 pb-6">
                    <button
                      onClick={() => handleTeamClick(project.teamId)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all group-hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{getTeamName(project.teamId)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {teams.find(t => t.id === project.teamId)?.members?.length || 0} members
                          </p>
                        </div>
                      </div>
                      {isExpanded ?
                        <ChevronUp className="w-5 h-5 text-gray-400 transform transition-transform" /> :
                        <ChevronDown className="w-5 h-5 text-gray-400 transform transition-transform" />
                      }
                    </button>

                    {/* Team Members Expansion */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 overflow-hidden"
                        >
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Star className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">Team Members</span>
                            </div>
                            <div className="space-y-3">
                              {teams
                                .find((t) => t.id === selectedTeam)
                                ?.members.map((memberId, memberIndex) => (
                                  <motion.div
                                    key={memberId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: memberIndex * 0.1 }}
                                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-600 rounded-lg shadow-sm"
                                  >
                                    <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-500 dark:to-gray-400 rounded-full flex items-center justify-center">
                                      <User className="w-4 h-4 text-gray-600 dark:text-gray-200" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                        {getEmployeeName(memberId)}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Team Member</p>
                                    </div>
                                  </motion.div>
                                ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-100/20 dark:to-gray-700/20 rounded-2xl transition-opacity duration-300 pointer-events-none ${
                    hoveredCard === project.id ? 'opacity-100' : 'opacity-0'
                  }`} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No projects found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your search terms
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-lg"
            >
              Clear Search
            </button>
          </motion.div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Create New Project</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team
                </label>
                <select
                  value={newProject.teamId}
                  onChange={(e) => setNewProject({...newProject, teamId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.teamName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.name.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
