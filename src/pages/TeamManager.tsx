import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Users, 
  Crown, 
  Star, 
  ChevronDown, 
  ChevronUp,
  Search,
  Filter,
  Grid,
  List,
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
  X
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function TeamManager() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [teamLead, setTeamLead] = useState("");
  const [editId, setEditId] = useState(null);
  const [viewMode, setViewMode] = useState("cards"); // cards, list
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [teamColor, setTeamColor] = useState("#00D4FF");

  const { user } = useAuthStore();

  // Color options for teams - neon blue/orange and purple variations
  const colorOptions = [
    "#00D4FF", "#FF6600", "#7C3AED", "#8B5CF6", "#A855F7",
    "#06B6D4", "#F97316", "#6D28D9", "#5B21B6", "#4C1D95"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empSnap = await getDocs(collection(db, "employees"));
        const employeesData = empSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        
        // If no employees in DB, use mock data
        if (employeesData.length === 0) {
          setEmployees([
            {
              id: "emp1",
              name: "Sarah Chen",
              title: "Senior Tech Lead",
              email: "sarah.chen@company.com",
              phone: "+1 (555) 123-4567",
              department: "Engineering",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
              skills: ["React", "Node.js", "Leadership"],
              joinDate: "2022-01-15",
              performance: 95
            },
            {
              id: "emp2",
              name: "Marcus Johnson",
              title: "Full Stack Developer",
              email: "marcus.johnson@company.com",
              phone: "+1 (555) 234-5678",
              department: "Engineering",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
              skills: ["Python", "React", "AWS"],
              joinDate: "2022-03-20",
              performance: 88
            },
            {
              id: "emp3",
              name: "Elena Rodriguez",
              title: "UI/UX Designer",
              email: "elena.rodriguez@company.com",
              phone: "+1 (555) 345-6789",
              department: "Design",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
              skills: ["Figma", "Adobe XD", "User Research"],
              joinDate: "2021-11-10",
              performance: 92
            },
            {
              id: "emp4",
              name: "David Kim",
              title: "Mobile Developer",
              email: "david.kim@company.com",
              phone: "+1 (555) 456-7890",
              department: "Engineering",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
              skills: ["React Native", "Swift", "Kotlin"],
              joinDate: "2022-06-01",
              performance: 87
            },
            {
              id: "emp5",
              name: "Ashley Turner",
              title: "Backend Developer",
              email: "ashley.turner@company.com",
              phone: "+1 (555) 567-8901",
              department: "Engineering",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ashley",
              skills: ["Java", "Spring", "PostgreSQL"],
              joinDate: "2022-02-28",
              performance: 90
            },
            {
              id: "emp6",
              name: "Ryan Foster",
              title: "DevOps Engineer",
              email: "ryan.foster@company.com",
              phone: "+1 (555) 678-9012",
              department: "Engineering",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan",
              skills: ["Docker", "Kubernetes", "AWS"],
              joinDate: "2021-09-15",
              performance: 94
            }
          ]);
        } else {
          setEmployees(employeesData);
        }
        
        refreshTeams();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error loading data");
      }
    };
    fetchData();
  }, []);

  const refreshTeams = async () => {
    try {
      const teamSnap = await getDocs(collection(db, "teams"));
      const teamsData = teamSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      // If no teams in DB, use mock data
      if (teamsData.length === 0) {
        setTeams([
          {
            id: "team1",
            teamName: "Innovation Squad",
            description: "Cutting-edge technology development team focused on AI and machine learning solutions",
            members: ["emp1", "emp2", "emp3"],
            teamLead: "emp1",
            created_by: user?.uid || "admin",
            color: "#00D4FF",
            department: "Engineering",
            createdAt: "2024-01-15",
            goals: ["Implement AI features", "Improve user experience", "Reduce technical debt"],
            performance: 92
          },
          {
            id: "team2",
            teamName: "Digital Pioneers",
            description: "Mobile and web application specialists creating next-generation user experiences",
            members: ["emp4", "emp5", "emp6"],
            teamLead: "emp4",
            created_by: user?.uid || "admin",
            color: "#FF6600",
            department: "Engineering",
            createdAt: "2024-02-01",
            goals: ["Launch mobile app", "Optimize performance", "Enhance security"],
            performance: 89
          }
        ]);
      } else {
        setTeams(teamsData);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!teamName.trim()) {
      toast.error("Team name is required");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Please select at least one team member");
      return;
    }

    if (!teamLead) {
      toast.error("Please select a team lead");
      return;
    }

    const payload = {
      teamName: teamName.trim(),
      description: teamDescription.trim(),
      members: selectedMembers,
      teamLead,
      created_by: user?.uid,
      color: teamColor,
      department: employees.find(emp => emp.id === teamLead)?.department || "General",
      createdAt: editId ? teams.find(t => t.id === editId)?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      goals: [],
      performance: Math.floor(Math.random() * 20) + 80 // Mock performance data
    };

    try {
      if (editId) {
        await updateDoc(doc(db, "teams", editId), payload);
        toast.success("Team updated successfully! 🎉");
      } else {
        const teamRef = doc(collection(db, "teams"));
        await setDoc(teamRef, payload);
        toast.success("Team created successfully! 🚀");
      }

      resetForm();
      refreshTeams();
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error saving team:", error);
      toast.error("Failed to save team");
    }
  };

  const resetForm = () => {
    setTeamName("");
    setTeamDescription("");
    setSelectedMembers([]);
    setTeamLead("");
    setEditId(null);
    setSearch("");
    setTeamColor("#00D4FF");
  };

  const handleEdit = (team) => {
    setTeamName(team.teamName);
    setTeamDescription(team.description || "");
    setSelectedMembers(team.members || []);
    setTeamLead(team.teamLead || "");
    setTeamColor(team.color || "#00D4FF");
    setEditId(team.id);
    setShowCreateModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        await deleteDoc(doc(db, "teams", id));
        toast.success("Team deleted successfully");
        refreshTeams();
      } catch (error) {
        console.error("Error deleting team:", error);
        toast.error("Failed to delete team");
      }
    }
  };

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const toggleTeamExpansion = (teamId) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || emp.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const getEmployeeName = (id) =>
    employees.find((e) => e.id === id)?.name || "Unknown";

  const getEmployee = (id) =>
    employees.find((e) => e.id === id) || { name: "Unknown", title: "Unknown" };

  // Check if user can create/edit teams (admin or team leader)
  const canManageTeams = () => {
    const userEmployee = employees.find(emp => emp.email === user?.email);
    const isAdmin = user?.email?.toLowerCase().includes('admin') || user?.email === 'ceo@enkonix.in';
    const isTeamLead = teams.some(team => team.teamLead === userEmployee?.id);
    return isAdmin || isTeamLead;
  };

  const TeamCard = ({ team }) => {
    const teamMembers = team.members?.map(id => getEmployee(id)) || [];
    const leadInfo = getEmployee(team.teamLead);
    const isExpanded = expandedTeams.has(team.id);
    const canEdit = team.created_by === user?.uid || canManageTeams();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.02 }}
        className="bg-white dark:bg-black/95 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-cyan-300/50 dark:border-purple-500/40"
      >
        {/* Team Header */}
        <div
          className="p-6 text-white relative overflow-hidden bg-gradient-to-br from-purple-500 to-blue-600 dark:from-purple-700 dark:to-blue-900 cursor-pointer"
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
              
              {canEdit && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(team)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(team.id)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-red-500/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-white/90 text-sm mb-4 line-clamp-2">
              {team.description}
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
              
              <button
                onClick={() => toggleTeamExpansion(team.id)}
                className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors"
              >
                <span className="text-sm">Details</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Team Leader */}
        <div className="p-4 border-b border-cyan-300/50 dark:border-purple-500/40">
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
              className="border-t border-cyan-300/50 dark:border-purple-500/40"
            >
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Members ({teamMembers.length})
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-cyan-50 dark:bg-purple-800/30 rounded-lg">
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
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20">
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-black/95 backdrop-blur-xl border-b border-cyan-300/50 dark:border-purple-500/40 sticky top-0 z-10">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 dark:from-purple-600 dark:to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-orange-600 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
                  Team Galaxy
                </h1>
                <p className="text-gray-600 dark:text-purple-300 font-medium">
                  Manage teams and collaborate effectively
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-cyan-100/50 dark:bg-purple-800/50 rounded-xl p-1">
                {[
                  { id: "cards", icon: Grid, label: "Cards" },
                  { id: "list", icon: List, label: "List" }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
                      viewMode === mode.id
                        ? 'bg-white dark:bg-purple-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-purple-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <mode.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                ))}
              </div>


            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search teams or members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-black/90 border border-cyan-300 dark:border-purple-500/40 rounded-xl focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-3 bg-white dark:bg-black/90 border border-cyan-300 dark:border-purple-500/40 rounded-xl focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Product">Product</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teams Display */}
      <div className="p-6">
        {teams.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-800/50 dark:to-blue-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              No teams created yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first team to start collaborating
            </p>

          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === "cards" ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
          }`}>
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Team Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-black/95 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto border border-cyan-300/50 dark:border-purple-500/40"
            >
              <div className="p-6 border-b border-cyan-300/50 dark:border-purple-500/40">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {editId ? "Edit Team" : "Create New Team"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-cyan-100 dark:hover:bg-purple-700/50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Team Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter team name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-4 py-3 border border-cyan-300 dark:border-purple-500/40 rounded-xl focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent dark:bg-black/90 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Team Color
                    </label>
                    <div className="flex gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          onClick={() => setTeamColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            teamColor === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe the team's purpose and goals"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-cyan-300 dark:border-purple-500/40 rounded-xl focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent dark:bg-black/90 dark:text-white"
                  />
                </div>

                {/* Team Lead Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Team Lead *
                  </label>
                  <select
                    value={teamLead}
                    onChange={(e) => setTeamLead(e.target.value)}
                    className="w-full px-4 py-3 border border-cyan-300 dark:border-purple-500/40 rounded-xl focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent dark:bg-black/90 dark:text-white"
                  >
                    <option value="">Select team lead</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Member Search and Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Search & Select Members *
                  </label>
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-3 border border-cyan-300 dark:border-purple-500/40 rounded-xl focus:ring-2 focus:ring-cyan-500 dark:focus:ring-purple-500 focus:border-transparent dark:bg-black/90 dark:text-white mb-3"
                  />

                  <div className="border border-cyan-300 dark:border-purple-500/40 rounded-xl max-h-60 overflow-y-auto">
                    {filteredEmployees.map((emp) => {
                      const isSelected = selectedMembers.includes(emp.id);
                      return (
                        <div
                          key={emp.id}
                          onClick={() => toggleMember(emp.id)}
                          className={`p-3 cursor-pointer hover:bg-cyan-50 dark:hover:bg-purple-700/50 flex items-center gap-3 border-b border-cyan-300/50 dark:border-purple-500/40 last:border-b-0 transition-colors ${
                            isSelected ? "bg-cyan-100 dark:bg-purple-900/30" : ""
                          }`}
                        >
                          <img
                            src={emp.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`}
                            alt={emp.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {emp.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {emp.title} • {emp.department}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 text-xs bg-cyan-100 dark:bg-purple-100 text-cyan-700 dark:text-purple-700 rounded-full">
                                Selected
                              </span>
                              {teamLead === emp.id && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {filteredEmployees.length === 0 && (
                      <div className="text-gray-500 text-center py-6">
                        No employees found
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Members Preview */}
                {selectedMembers.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Selected Members ({selectedMembers.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((memberId) => {
                        const member = employees.find(emp => emp.id === memberId);
                        return (
                          <div
                            key={memberId}
                            className="flex items-center gap-2 bg-cyan-100 dark:bg-purple-900/30 text-cyan-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm"
                          >
                            <img
                              src={member?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member?.name}`}
                              alt={member?.name || 'Member'}
                              className="w-4 h-4 rounded-full"
                            />
                            <span>{member?.name || 'Unknown'}</span>
                            {teamLead === memberId && (
                              <Crown className="w-3 h-3 text-yellow-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-cyan-300/50 dark:border-purple-500/40 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-cyan-300 dark:border-purple-500/40 text-gray-700 dark:text-purple-300 rounded-xl hover:bg-cyan-50 dark:hover:bg-purple-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrUpdate}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-orange-600 dark:from-purple-600 dark:to-purple-700 text-white rounded-xl hover:from-cyan-700 hover:to-orange-700 dark:hover:from-purple-700 dark:hover:to-purple-800 transition-all shadow-lg hover:shadow-xl"
                >
                  {editId ? "Update Team" : "Create Team"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
