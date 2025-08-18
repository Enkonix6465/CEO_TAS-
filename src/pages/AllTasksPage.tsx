import React, { useState, useEffect } from "react";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  Play,
  Pause,
  Flag,
  Filter,
  Search,
  Download,
  User,
  Target,
  TrendingUp,
  Activity,
  AlertCircle,
  Grid,
  Table,
  List,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import toast from "react-hot-toast";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to: string;
  created_by: string;
  due_date: string;
  created_at: any;
  progress?: number;
  project_id?: string;
  tags?: string;
  task_id?: string;
}

interface Team {
  id: string;
  teamName: string;
  members: string[];
  created_by: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
}

const AllTasksPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch teams
        const teamsSnap = await getDocs(collection(db, "teams"));
        const teamsData = teamsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Team[];
        setTeams(teamsData);

        // Fetch employees
        const employeesSnap = await getDocs(collection(db, "employees"));
        const employeesData = employeesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Employee[];
        setEmployees(employeesData);

        // Set up real-time listener for tasks
        const unsubscribe = onSnapshot(
          collection(db, "tasks"),
          (snapshot) => {
            const tasksData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Task[];
            setTasks(tasksData);
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching tasks:", error);
            toast.error("Failed to load tasks");
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee?.name || "Unknown User";
  };

  const getEmployeeAvatar = (employeeId: string) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${employeeId}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Play className="w-4 h-4 text-blue-500" />;
      case "pending":
        return <Circle className="w-4 h-4 text-gray-500" />;
      case "review":
        return <Pause className="w-4 h-4 text-purple-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700/50 dark:text-red-400";
      case "medium":
        return "text-yellow-500 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700/50 dark:text-yellow-400";
      case "low":
        return "text-green-500 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700/50 dark:text-green-400";
      default:
        return "text-gray-500 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700/50 dark:text-gray-400";
    }
  };

  const groupTasksByTeam = () => {
    const filteredTasks = tasks.filter((task) => {
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    if (selectedTeam === "all") {
      // Group by all teams
      return teams.map((team) => {
        const teamTasks = filteredTasks.filter((task) =>
          team.members.includes(task.assigned_to)
        );
        return {
          team,
          tasks: teamTasks,
        };
      });
    } else {
      // Show only selected team
      const team = teams.find((t) => t.id === selectedTeam);
      if (!team) return [];
      
      const teamTasks = filteredTasks.filter((task) =>
        team.members.includes(task.assigned_to)
      );
      
      return [{ team, tasks: teamTasks }];
    }
  };

  const getTaskStats = (tasks: Task[]) => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const overdue = tasks.filter((t) => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed"
    ).length;
    
    return { total, completed, inProgress, pending, overdue };
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, scale: 1.01 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={() => navigate(`/task/${task.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(task.status)}
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                {task.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs rounded-full border font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority?.toUpperCase() || "LOW"}
              </span>
              {isOverdue && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full border border-red-200 dark:border-red-700/50 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Overdue
                </span>
              )}
              {task.task_id && (
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full border border-purple-200 dark:border-purple-700/50">
                  #{task.task_id}
                </span>
              )}
            </div>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-col gap-2 text-xs">
          {/* Assignee */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-[10px] font-medium border border-blue-200 dark:border-blue-700/50">
              Assignee
            </span>
            <img
              src={getEmployeeAvatar(task.assigned_to)}
              alt="avatar"
              className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
            />
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {getEmployeeName(task.assigned_to)}
            </span>
          </div>

          {/* Reporter */}
          {task.created_by && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-[10px] font-medium border border-green-200 dark:border-green-700/50">
                Reporter
              </span>
              <img
                src={getEmployeeAvatar(task.created_by)}
                alt="avatar"
                className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
              />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {getEmployeeName(task.created_by)}
              </span>
            </div>
          )}

          {/* Due Date */}
          {task.due_date && (
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3 text-gray-500" />
              <span className={`text-gray-600 dark:text-gray-400 ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                Due: {new Date(task.due_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading all tasks...
          </p>
        </div>
      </div>
    );
  }

  const groupedTasks = groupTasksByTeam();
  const allTasks = tasks.filter((task) => {
    const matchesSearch = !searchTerm || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  const overallStats = getTaskStats(allTasks);

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <PageHeader
        title="All Tasks"
        subtitle="Overview of tasks across all teams"
        showActions={true}
      />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>

            {/* Team Filter */}
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.teamName}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                  viewMode === 'card'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Grid className="w-4 h-4" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Table className="w-4 h-4" />
                Table
              </button>
            </div>
          </div>

          {/* Overall Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Total: {overallStats.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Completed: {overallStats.completed}</span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">In Progress: {overallStats.inProgress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Pending: {overallStats.pending}</span>
            </div>
            {overallStats.overdue > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400">Overdue: {overallStats.overdue}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-8">
          <AnimatePresence>
            {groupedTasks.map(({ team, tasks: teamTasks }) => {
              const teamStats = getTaskStats(teamTasks);
              
              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Team Header */}
                  <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {team.teamName}
                          </h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {team.members.length} members • {teamStats.total} tasks
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Completed: {teamStats.completed}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            In Progress: {teamStats.inProgress}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Pending: {teamStats.pending}
                          </span>
                        </div>
                        {teamStats.overdue > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-red-600 dark:text-red-400">
                              Overdue: {teamStats.overdue}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team Tasks */}
                  <div className="p-6">
                    {teamTasks.length > 0 ? (
                      viewMode === 'card' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {teamTasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Task
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Priority
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Assignee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Reporter
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Due Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                              {teamTasks.map((task) => {
                                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";
                                return (
                                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        {getStatusIcon(task.status)}
                                        <div className="ml-3">
                                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {task.title}
                                          </div>
                                          {task.task_id && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                              #{task.task_id}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                        task.status === 'pending' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' :
                                        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                      }`}>
                                        {task.status.replace('_', ' ').toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                                        getPriorityColor(task.priority)
                                      }`}>
                                        {task.priority?.toUpperCase() || 'LOW'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <img
                                          src={getEmployeeAvatar(task.assigned_to)}
                                          alt="avatar"
                                          className="w-6 h-6 rounded-full mr-2"
                                        />
                                        <span className="text-sm text-gray-900 dark:text-white">
                                          {getEmployeeName(task.assigned_to)}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {task.created_by && (
                                        <div className="flex items-center">
                                          <img
                                            src={getEmployeeAvatar(task.created_by)}
                                            alt="avatar"
                                            className="w-6 h-6 rounded-full mr-2"
                                          />
                                          <span className="text-sm text-gray-900 dark:text-white">
                                            {getEmployeeName(task.created_by)}
                                          </span>
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                      {task.due_date ? (
                                        <span className={isOverdue ? 'text-red-600 dark:text-red-400' : ''}>
                                          {new Date(task.due_date).toLocaleDateString()}
                                          {isOverdue && (
                                            <span className="ml-1 text-xs">(Overdue)</span>
                                          )}
                                        </span>
                                      ) : (
                                        'No due date'
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <button
                                        onClick={() => navigate(`/task/${task.id}`)}
                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                      >
                                        View
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8">
                        <Circle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No tasks found for this team
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {groupedTasks.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No tasks found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters or search criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllTasksPage;
