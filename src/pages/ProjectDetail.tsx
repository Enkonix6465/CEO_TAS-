import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, onSnapshot, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { motion } from "framer-motion";
import { Calendar, Clock, Target, Users, CheckCircle, Play, Pause, Square, MessageSquare } from "lucide-react";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      try {
        const projectDoc = await getDoc(doc(db, "projects", projectId));
        
        if (projectDoc.exists()) {
          setProject({ id: projectDoc.id, ...projectDoc.data() });
        } else {
          setError("Project not found");
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };

    // Setup listeners for teams, tasks, and employees
    const teamsUnsubscribe = onSnapshot(
      collection(db, "teams"),
      (snapshot) => {
        const teamsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTeams(teamsData);
      },
      (error) => {
        console.error("Error fetching teams:", error);
      }
    );

    const employeesUnsubscribe = onSnapshot(
      collection(db, "employees"),
      (snapshot) => {
        const employeesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmployees(employeesData);
      },
      (error) => {
        console.error("Error fetching employees:", error);
      }
    );

    fetchProject();

    return () => {
      teamsUnsubscribe();
      employeesUnsubscribe();
    };
  }, [projectId]);

  // Fetch tasks related to this project when project data is loaded
  useEffect(() => {
    if (!project) return;

    const fetchProjectTasks = async () => {
      try {
        const tasksQuery = query(collection(db, "tasks"), where("project_id", "==", project.id));
        const taskSnapshot = await getDocs(tasksQuery);
        const tasksData = taskSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching project tasks:", error);
      }
    };

    fetchProjectTasks();
  }, [project]);

  // Function to get team name by ID
  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unassigned';
  };

  // Function to get employee name by ID
  const getEmployeeName = (employeeId) => {
    if (!employeeId) return 'Unknown';
    const employee = employees.find(e => e.id === employeeId || e.uid === employeeId);
    if (employee) {
      if (employee.fullName) return employee.fullName;
      if (employee.firstName && employee.lastName) return `${employee.firstName} ${employee.lastName}`;
      if (employee.name) return employee.name;
      if (employee.displayName) return employee.displayName;
      if (employee.email) return employee.email;
      return employee.id || employee.uid || 'User';
    }
    return employeeId === 'admin' ? 'Admin' : employeeId;
  };

  // Function to add a comment to a project
  const handleAddComment = async () => {
    if (!newComment.trim() || !project) return;
    
    setCommentLoading(true);
    try {
      // Get the current project document reference
      const projectRef = doc(db, "projects", project.id);
      
      // Create the new comment object
      const commentObj = {
        userId: auth.currentUser?.uid,
        text: newComment.trim(),
        timestamp: new Date().getTime()
      };
      
      // Prepare the comments array (ensure it exists)
      const comments = Array.isArray(project.comments) 
        ? [...project.comments, commentObj] 
        : [commentObj];
      
      // Update the project document with the new comments array
      await updateDoc(projectRef, { comments });
      
      // Update the local state
      setProject({
        ...project,
        comments
      });
      
      // Clear the comment input
      setNewComment("");
      
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setCommentLoading(false);
    }
  };

  // Function to get status icon
  const getStatusIcon = (status) => {
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

  // Function to get status color
  const getStatusColor = (status) => {
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

  // Calculate task statistics
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(task => task.status === 'pending').length,
    inProgress: tasks.filter(task => task.status === 'in_progress').length,
    completed: tasks.filter(task => task.status === 'completed').length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-gray-500 mb-4">Project not found</div>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(project.status);

  return (
    <div className="h-full bg-gradient-to-br from-slate-100 via-purple-100 to-indigo-200 dark:from-slate-800 dark:via-purple-900/40 dark:to-indigo-900/60 overflow-auto">
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg shadow-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border border-slate-200/50 dark:border-slate-600/30"
        >
          <div className="col-span-2 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                  <StatusIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {project.name}
                  </h2>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                Description
              </h3>
              <div className="bg-gray-50 dark:bg-zinc-800 p-3 rounded border text-sm whitespace-pre-wrap">
                {project.description || "—"}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
              {project.startDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    <strong>Start Date:</strong> {new Date(project.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {project.deadline && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    <strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
              {project.teamId && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    <strong>Team:</strong> {getTeamName(project.teamId)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>
                  <strong>Comments:</strong> {Array.isArray(project.comments) ? project.comments.length : 0}
                </span>
              </div>
            </div>

            {/* Project Tasks */}
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                Project Tasks
              </h3>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                  <div className="text-xl font-bold text-slate-800 dark:text-white">{taskStats.total}</div>
                </div>
                <div className="bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{taskStats.pending}</div>
                </div>
                <div className="bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
                  <div className="text-sm text-gray-500 dark:text-gray-400">In Progress</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{taskStats.inProgress}</div>
                </div>
                <div className="bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">{taskStats.completed}</div>
                </div>
              </div>
              
              {tasks.length > 0 ? (
                <div className="bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-800 text-left">
                        <th className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium">Task ID</th>
                        <th className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium">Title</th>
                        <th className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium">Status</th>
                        <th className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium">Assigned To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map(task => (
                        <tr 
                          key={task.id} 
                          className="border-t border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600/30 cursor-pointer"
                          onClick={() => navigate(`/task/${task.id}`)}
                        >
                          <td className="px-4 py-3 text-violet-600 dark:text-violet-400 font-medium">{task.task_id}</td>
                          <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{task.title}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              task.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' :
                              task.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                              'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            }`}>
                              {task.status === 'pending' ? 'Pending' : 
                               task.status === 'in_progress' ? 'In Progress' : 'Completed'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{getEmployeeName(task.assigned_to)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg text-center text-gray-500 dark:text-gray-400">
                  No tasks found for this project
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 space-y-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg border border-indigo-100 dark:border-indigo-700/30">
              <h3 className="font-medium text-indigo-800 dark:text-indigo-300 mb-2">Project Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {project.created_at ? new Date(project.created_at.seconds * 1000).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Created By:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {getEmployeeName(project.created_by)}
                  </span>
                </div>
                {project.updated_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {new Date(project.updated_at.seconds * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="flex flex-col h-full">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                💬 Comments
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px]">
                {Array.isArray(project.comments) && project.comments.length > 0 ? (
                  project.comments.map((comment, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm rounded-lg p-3 text-sm transition"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                          {getEmployeeName(comment.userId)?.[0] || "U"}
                        </div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {getEmployeeName(comment.userId)}
                        </div>
                      </div>
                      <div className="text-gray-700 dark:text-gray-200">
                        {comment.text}
                      </div>
                      <div className="text-xs text-right text-gray-500 dark:text-gray-400 mt-2">
                        {new Date(comment.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                    No comments yet.
                  </p>
                )}
              </div>

              <div className="mt-4">
                <textarea
                  rows={3}
                  className="w-full p-2 border rounded-md text-sm bg-white dark:bg-zinc-800 dark:border-zinc-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-indigo-300"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  onClick={handleAddComment}
                  disabled={commentLoading || !newComment.trim()}
                  className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded w-full disabled:opacity-50 transition"
                >
                  {commentLoading ? "Saving..." : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectDetail;
