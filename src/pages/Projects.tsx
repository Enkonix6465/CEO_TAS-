import React, { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConnected } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  Edit2,
  Trash2,
  Calendar,
  Users,
  Clock,
  Target,
  Search,
  Filter,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  Play,
  Pause,
  Square,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  deadline: string;
  teamId: string;
  status: string;
  created_by: string;
  created_at: any;
}

function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    deadline: "",
    teamId: "",
    status: "planning"
  });

  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    
    const initializeWithRetry = () => {
      try {
        setHasError(false);
        fetchProjects();
        
        if (connectionStatus === 'offline' && retryCount < 3) {
          retryTimer = setTimeout(() => {
            console.log(`Retrying Projects connection (attempt ${retryCount + 1})`);
            setRetryCount(prev => prev + 1);
            initializeWithRetry();
          }, 5000 * (retryCount + 1));
        }
      } catch (error) {
        console.error("Projects initialization error:", error);
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

  const fetchProjects = async () => {
    if (!db) {
      console.warn("Firebase not available for Projects");
      setConnectionStatus('offline');
      setLoading(false);
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      const snapshot = await getDocs(collection(db, "projects"));
      const projectsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
      
      setProjects(projectsData);
      setConnectionStatus('connected');
    } catch (error) {
      console.error("Error fetching projects:", error);
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
    fetchProjects();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      toast.error("Database not available");
      return;
    }

    try {
      if (editingProject) {
        await updateDoc(doc(db, "projects", editingProject.id), {
          ...formData,
          updated_at: serverTimestamp(),
        });
        toast.success("Project updated successfully");
      } else {
        await addDoc(collection(db, "projects"), {
          ...formData,
          created_by: user?.uid,
          created_at: serverTimestamp(),
        });
        toast.success("Project created successfully");
      }
      
      setShowModal(false);
      setEditingProject(null);
      setFormData({ name: "", description: "", startDate: "", deadline: "", teamId: "", status: "planning" });
      fetchProjects();
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to save project");
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) {
      toast.error("Database not available");
      return;
    }

    try {
      await deleteDoc(doc(db, "projects", id));
      toast.success("Project deleted successfully");
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      deadline: project.deadline,
      teamId: project.teamId,
      status: project.status || "planning"
    });
    setShowModal(true);
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
      case 'completed':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
      case 'on-hold':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
      case 'planning':
        return 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/30';
      default:
        return 'bg-gray-50 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return Play;
      case 'completed':
        return CheckCircle;
      case 'on-hold':
        return Pause;
      case 'planning':
        return Target;
      default:
        return Square;
    }
  };

  // Error boundary fallback
  if (hasError && connectionStatus === 'offline') {
    return (
      <div className="h-full bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex items-center justify-center">
        <div className="text-center p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl shadow-lg max-w-md">
          <div className="p-4 bg-orange-100 dark:bg-orange-500/20 rounded-xl mb-4 inline-block">
            <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Projects Unavailable</h3>
          <p className="text-sm text-violet-600/70 dark:text-violet-300/70 mb-4">
            Unable to load projects. Please check your connection.
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
          <p className="text-violet-600 dark:text-violet-400 font-medium">Loading Projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-100 via-purple-100 to-indigo-200 dark:from-slate-800 dark:via-purple-900/40 dark:to-indigo-900/60 flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-slate-200/30 via-purple-200/40 to-indigo-300/50 dark:from-slate-700/20 dark:via-purple-800/30 dark:to-indigo-900/40 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-br from-purple-200/30 via-indigo-200/40 to-slate-300/50 dark:from-purple-800/20 dark:via-indigo-900/30 dark:to-slate-700/40 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-200/20 via-purple-200/30 to-slate-200/40 dark:from-indigo-800/15 dark:via-purple-900/25 dark:to-slate-800/35 rounded-full blur-2xl opacity-60"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-indigo-500/20 px-6 py-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-slate-600 via-purple-600 to-indigo-700 rounded-2xl shadow-lg ring-2 ring-white/20">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 via-purple-700 to-indigo-800 dark:from-slate-300 dark:via-purple-300 dark:to-indigo-200 bg-clip-text text-transparent tracking-tight">
                  Projects
                </h1>
                <p className="text-sm text-slate-600/80 dark:text-slate-300/80 font-medium tracking-wide">
                  Manage your projects
                </p>
              </div>
            </div>
            
            <div className={`px-4 py-2 rounded-2xl text-sm font-semibold border backdrop-blur-sm flex items-center gap-2 shadow-sm ${
              connectionStatus === 'connected'
                ? 'bg-emerald-50/90 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/30 ring-1 ring-emerald-200/50'
                : connectionStatus === 'connecting'
                ? 'bg-amber-50/90 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-500/30 ring-1 ring-amber-200/50'
                : 'bg-slate-50/90 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-500/30 ring-1 ring-slate-200/50'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500' :
                connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                'bg-gray-500'
              }`}></div>
              {projects.length} Projects
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
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-600 via-purple-600 to-indigo-700 hover:from-slate-700 hover:via-purple-700 hover:to-indigo-800 text-white rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl text-sm font-semibold ring-2 ring-white/20 hover:ring-white/30"
            >
              <PlusCircle className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-500/30 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-lg backdrop-blur-sm transition-all duration-300"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
           
            {/* Clear Filters Button */}
            {(searchTerm || filterStatus !== 'all') && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="flex items-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-all duration-200 text-xs font-medium"
              >
                <X className="w-3 h-3" />
                Clear
              </motion.button>
            )}
          </div>
        </div>

        {/* Filter Summary */}
        {(searchTerm || filterStatus !== 'all') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/30 rounded-lg backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                <Filter className="w-4 h-4" />
                <span>
                  Showing {filteredProjects.length} of {projects.length} projects
                  {searchTerm && ` matching "${searchTerm}"`}
                  {filterStatus !== 'all' && ` with status "${filterStatus}"`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {searchTerm && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded text-xs">
                    Search: "{searchTerm}"
                  </span>
                )}
                {filterStatus !== 'all' && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded text-xs capitalize">
                    {filterStatus === 'on-hold' ? 'On Hold' : filterStatus}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-auto px-6 py-4">
        {filteredProjects.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="p-4 bg-violet-100 dark:bg-violet-500/20 rounded-xl mb-4 inline-block">
                <Target className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Projects Found</h3>
              <p className="text-sm text-violet-600/70 dark:text-violet-300/70 mb-4">
                {searchTerm || filterStatus !== 'all'
                  ? `No projects found ${searchTerm ? `matching "${searchTerm}"` : ''} ${filterStatus !== 'all' ? `with status "${filterStatus}"` : ''}. Try adjusting your filters.`
                  : 'Create your first project to get started'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg text-sm font-medium"
                >
                  Create Project
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project, index) => {
              const StatusIcon = getStatusIcon(project.status);
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-600/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2 ring-1 ring-white/20 dark:ring-slate-700/30 cursor-pointer"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                        <StatusIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{project.name}</h3>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(project)}
                        className="p-1 hover:bg-violet-100 dark:hover:bg-violet-500/20 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-violet-600/70 dark:text-violet-300/70 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="space-y-2 text-xs text-violet-600/70 dark:text-violet-300/70">
                    {project.startDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {project.deadline && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
                setEditingProject(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="liquid-glass-card max-w-md w-full shadow-2xl"
            >
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                {editingProject ? 'Edit Project' : 'Create Project'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProject(null);
                      setFormData({ name: "", description: "", startDate: "", deadline: "", teamId: "", status: "planning" });
                    }}
                    className="flex-1 px-4 py-2 border border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg font-medium"
                  >
                    {editingProject ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Projects;
