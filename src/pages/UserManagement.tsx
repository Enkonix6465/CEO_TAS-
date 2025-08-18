import React, { useState, useEffect } from "react";
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db, isFirebaseConnected } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Shield,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Settings,
  MoreHorizontal,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX,
  Crown,
} from "lucide-react";
import toast from "react-hot-toast";

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "member",
    department: "",
    status: "active",
    phone: "",
    location: "",
  });

  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    
    const initializeWithRetry = () => {
      try {
        setHasError(false);
        setupUserListeners();
        
        if (connectionStatus === 'offline' && retryCount < 3) {
          retryTimer = setTimeout(() => {
            console.log(`Retrying UserManagement connection (attempt ${retryCount + 1})`);
            setRetryCount(prev => prev + 1);
            initializeWithRetry();
          }, 5000 * (retryCount + 1));
        }
      } catch (error) {
        console.error("UserManagement initialization error:", error);
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

  const setupUserListeners = () => {
    if (!db) {
      console.warn("Firebase not available for UserManagement");
      setConnectionStatus('offline');
      setLoading(false);
      return;
    }

    setConnectionStatus('connecting');

    try {
      const usersUnsub = onSnapshot(
        collection(db, "users"),
        (snapshot) => {
          try {
            const usersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setUsers(usersData);
            setConnectionStatus('connected');
          } catch (error) {
            console.warn("Error processing users:", error);
          }
        },
        (error) => {
          console.warn("Users listener error:", error);
          setConnectionStatus('offline');
        }
      );

      setLoading(false);
      return () => {
        usersUnsub();
      };
    } catch (error) {
      console.error("Error setting up user listeners:", error);
      setConnectionStatus('offline');
      setHasError(true);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setHasError(false);
    setRetryCount(0);
    setLoading(true);
    setupUserListeners();
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role || "member",
      department: user.department || "",
      status: user.status || "active",
      phone: user.phone || "",
      location: user.location || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingUser) {
      toast.error("Database not available");
      return;
    }

    try {
      await updateDoc(doc(db, "users", editingUser.id), formData);
      toast.success("User updated successfully");
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        fullName: "",
        email: "",
        role: "member",
        department: "",
        status: "active",
        phone: "",
        location: "",
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!db) {
      toast.error("Database not available");
      return;
    }

    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteDoc(doc(db, "users", userId));
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    if (!db) return;
    
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await updateDoc(doc(db, "users", userId), { status: newStatus });
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30';
      case 'project_manager':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
      case 'team_lead':
        return 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30';
      case 'developer':
        return 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30';
      default:
        return 'bg-gray-50 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-500/30';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Crown;
      case 'project_manager':
        return Shield;
      case 'team_lead':
        return Users;
      default:
        return User;
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
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Users Unavailable</h3>
          <p className="text-sm text-violet-600/70 dark:text-violet-300/70 mb-4">
            Unable to load user data. Please check your connection.
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
          <p className="text-violet-600 dark:text-violet-400 font-medium">Loading Users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-violet-200/20 to-purple-200/20 dark:from-violet-900/10 dark:to-purple-900/10 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-violet-200/20 dark:from-indigo-900/10 dark:to-violet-900/10 rounded-full blur-3xl opacity-60"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-violet-200/50 dark:border-violet-500/20 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-xs text-violet-600/70 dark:text-violet-300/70 font-medium">
                  Manage team members
                </p>
              </div>
            </div>
            
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
              {users.length} Users
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
            
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-sm text-sm font-medium">
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-violet-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/70 dark:bg-slate-800/70 border border-violet-200/60 dark:border-violet-500/30 rounded-xl text-violet-800 dark:text-violet-200 placeholder-violet-400 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm backdrop-blur-sm"
            />
          </div>
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 bg-white/70 dark:bg-slate-800/70 border border-violet-200/60 dark:border-violet-500/30 rounded-xl text-violet-800 dark:text-violet-200 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm backdrop-blur-sm"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="project_manager">Project Manager</option>
            <option value="team_lead">Team Lead</option>
            <option value="developer">Developer</option>
            <option value="member">Member</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white/70 dark:bg-slate-800/70 border border-violet-200/60 dark:border-violet-500/30 rounded-xl text-violet-800 dark:text-violet-200 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm backdrop-blur-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-auto px-6 py-4">
        {filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="p-4 bg-violet-100 dark:bg-violet-500/20 rounded-xl mb-4 inline-block">
                <Users className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Users Found</h3>
              <p className="text-sm text-violet-600/70 dark:text-violet-300/70">
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'No users available'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user, index) => {
              const RoleIcon = getRoleIcon(user.role);
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                        {user.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">{user.fullName || 'Unknown User'}</h3>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getRoleColor(user.role)}`}>
                          <RoleIcon className="w-3 h-3 inline mr-1" />
                          {user.role?.replace('_', ' ') || 'member'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.status)}
                        className="p-1 hover:bg-violet-100 dark:hover:bg-violet-500/20 rounded-lg transition-colors"
                        title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.status === 'active' ? (
                          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-1 hover:bg-violet-100 dark:hover:bg-violet-500/20 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-violet-600/70 dark:text-violet-300/70">
                    {user.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}
                    
                    {user.department && (
                      <div className="flex items-center gap-2">
                        <Settings className="w-3 h-3" />
                        <span>{user.department}</span>
                      </div>
                    )}
                    
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    
                    {user.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{user.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-violet-200/50 dark:border-violet-500/20">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                      user.status === 'active' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showModal && editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
                setEditingUser(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                Edit User
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="member">Member</option>
                      <option value="developer">Developer</option>
                      <option value="team_lead">Team Lead</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="admin">Admin</option>
                    </select>
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
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-violet-200 dark:border-violet-500/30 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                    }}
                    className="flex-1 px-4 py-2 border border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg font-medium"
                  >
                    Update
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
