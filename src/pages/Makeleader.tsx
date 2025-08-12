import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Crown,
  Star,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Mail,
  Phone,
  MapPin,
  Award,
  Target,
  Zap,
  Heart,
  Shield,
  Calendar,
  Activity,
  TrendingUp,
  BarChart3,
  UserPlus,
  Settings,
  Sparkles,
  Building,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Briefcase,
  GraduationCap,
  Trophy,
  Flag,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function TeamLeadPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [viewMode, setViewMode] = useState("cards"); // cards, list
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { user } = useAuthStore();

  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    
    const initializeWithRetry = () => {
      try {
        setHasError(false);
        setupTeamLeadListeners();
        
        if (connectionStatus === 'offline' && retryCount < 3) {
          retryTimer = setTimeout(() => {
            console.log(`Retrying Team Lead connection (attempt ${retryCount + 1})`);
            setRetryCount(prev => prev + 1);
            initializeWithRetry();
          }, 5000 * (retryCount + 1));
        }
      } catch (error) {
        console.error("Team Lead initialization error:", error);
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

  const setupTeamLeadListeners = () => {
    if (!db) {
      console.warn("Firebase not available for Team Lead");
      setConnectionStatus('offline');
      setLoading(false);
      return;
    }

    setConnectionStatus('connecting');

    try {
      // Setup real-time listeners
      const employeesUnsub = onSnapshot(
        collection(db, "employees"),
        (snapshot) => {
          try {
            const employeesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setEmployees(employeesData);
            setConnectionStatus('connected');
          } catch (error) {
            console.warn("Error processing employees:", error);
          }
        },
        (error) => {
          console.warn("Employees listener error:", error);
          setConnectionStatus('offline');
        }
      );

      const teamsUnsub = onSnapshot(
        collection(db, "teams"),
        (snapshot) => {
          try {
            const teamsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setTeams(teamsData);
          } catch (error) {
            console.warn("Error processing teams:", error);
          }
        },
        (error) => {
          console.warn("Teams listener error:", error);
        }
      );

      setLoading(false);
      return () => {
        employeesUnsub();
        teamsUnsub();
      };
    } catch (error) {
      console.error("Error setting up team lead listeners:", error);
      setConnectionStatus('offline');
      setHasError(true);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setHasError(false);
    setRetryCount(0);
    setLoading(true);
    setupTeamLeadListeners();
  };

  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const getEmployee = (id: string) => {
    return employees.find(emp => emp.id === id) || { name: 'Unknown', title: 'Unknown', email: 'unknown@company.com' };
  };

  const canManageTeams = () => {
    return user?.role === 'admin' || user?.role === 'manager';
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = !search || 
      team.teamName?.toLowerCase().includes(search.toLowerCase()) ||
      team.department?.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || team.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const TeamCard = ({ team }) => {
    const teamMembers = team.members?.map(id => getEmployee(id)) || [];
    const leadInfo = getEmployee(team.teamLead);
    const isExpanded = expandedTeams.has(team.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.02 }}
        className="bg-white dark:bg-black/95 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-violet-300/50 dark:border-violet-500/40"
      >
        {/* Team Header */}
        <div
          className="p-6 text-white relative overflow-hidden bg-gradient-to-br from-violet-400 to-purple-600 dark:from-violet-500 dark:to-purple-700 cursor-pointer"
          onClick={() => navigate(`/team-details/${team.id}`)}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{team.teamName}</h3>
                  <p className="text-white/80 text-sm">{team.department}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTeamExpansion(team.id);
                  }}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-white/90 text-sm mb-4 line-clamp-2">
              {team.description || 'No description available'}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{teamMembers.length} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{team.performance || 90}%</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <Crown className="w-4 h-4" />
                <span className="text-sm">Team Lead</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Leader */}
        <div className="p-4 border-b border-violet-300/50 dark:border-violet-500/40">
          <div className="flex items-center gap-3">
            <img
              src={leadInfo.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leadInfo.name}`}
              alt={leadInfo.name}
              className="w-10 h-10 rounded-full border-2 border-yellow-400"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">Team Lead</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {leadInfo.name} • {leadInfo.title}
              </p>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-violet-300/50 dark:border-violet-500/40"
            >
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Members ({teamMembers.length})
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-800/30 rounded-lg">
                      <img
                        src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                        alt={member.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.title}
                        </p>
                      </div>
                      {member.skills && (
                        <div className="flex gap-1">
                          {member.skills.slice(0, 2).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-violet-100 text-violet-700 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      {team.teamLead === member.id && (
                        <Star className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Error boundary fallback
  if (hasError && connectionStatus === 'offline') {
    return (
      <div className="h-full bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex items-center justify-center">
        <div className="text-center p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl shadow-lg max-w-md">
          <div className="p-4 bg-orange-100 dark:bg-orange-500/20 rounded-xl mb-4 inline-block">
            <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Team Lead Unavailable</h3>
          <p className="text-sm text-violet-600/70 dark:text-violet-300/70 mb-4">
            Unable to load team lead data. Please check your connection.
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
          <p className="text-violet-600 dark:text-violet-400 font-medium">Loading Team Lead...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5">
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-black/95 backdrop-blur-xl border-b border-violet-300/50 dark:border-violet-500/40 sticky top-0 z-10">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-800 rounded-2xl flex items-center justify-center shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Team Leadership
                </h1>
                <p className="text-gray-600 dark:text-violet-300 font-medium">
                  Manage teams and lead effectively
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Connection Status */}
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

              {/* View Mode Toggle */}
              <div className="flex items-center bg-violet-100/50 dark:bg-violet-800/50 rounded-xl p-1">
                {[
                  { id: "cards", icon: Users, label: "Cards" },
                  { id: "list", icon: BarChart3, label: "List" }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-all ${
                      viewMode === mode.id
                        ? 'bg-white dark:bg-violet-700 text-violet-900 dark:text-violet-100 shadow-lg backdrop-blur-sm'
                        : 'text-violet-600 dark:text-violet-400 hover:text-violet-900 dark:hover:text-violet-200 hover:bg-white/50 dark:hover:bg-violet-700/50'
                    }`}
                  >
                    <mode.icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 bg-white/70 dark:bg-slate-800/70 text-violet-600 dark:text-violet-300 hover:bg-violet-100/70 dark:hover:bg-violet-700/40 border border-violet-200/60 dark:border-violet-500/30 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-sm backdrop-blur-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search teams or members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-black/90 border border-violet-300 dark:border-violet-500/40 rounded-xl focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
         
          </div>
        </div>
      </div>

      {/* Teams Display */}
      <div className="p-6">
        {teams.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-800/50 dark:to-purple-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Crown className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              No teams available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Teams will appear here when they are created
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === "cards" ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
          }`}>
            {filteredTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
