import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, onSnapshot, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { motion } from "framer-motion";
import { ExternalLink, Calendar, Clock, User, Flag, CheckCircle, Circle, Edit2, Target, AlertCircle, RefreshCw, Play, Square, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Status title mapping
  const statusTitles = {
    "pending": "Pending",
    "in_progress": "In Progress",
    "completed": "Completed"
  };

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;
      
      try {
        // Set up real-time listener for the task
        const taskUnsubscribe = onSnapshot(
          doc(db, "tasks", taskId),
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              setTask({ id: docSnapshot.id, ...docSnapshot.data() });
            } else {
              setError("Task not found");
            }
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching task:", err);
            setError("Failed to load task details");
            setLoading(false);
          }
        );

        // Setup listeners for projects
        const projectsUnsubscribe = onSnapshot(
          collection(db, "projects"),
          (snapshot) => {
            const projectsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setProjects(projectsData);
          },
          (error) => {
            console.error("Error fetching projects:", error);
          }
        );

        // Setup listeners for users instead of employees
        const usersUnsubscribe = onSnapshot(
          collection(db, "users"),
          (snapshot) => {
            const usersData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setEmployees(usersData);
          },
          (error) => {
            console.error("Error fetching users:", error);
          }
        );

        return () => {
          taskUnsubscribe();
          projectsUnsubscribe();
          usersUnsubscribe();
        };
      } catch (err) {
        console.error("Error setting up listeners:", err);
        setError("Failed to load task details");
        setLoading(false);
        return () => {};
      }
    };

    fetchTask();
    // No need for a return cleanup here as fetchTask handles its own cleanup
  }, [taskId]);

  // Function to get project name by ID with additional details
  const getProjectName = (projectId) => {
    if (!projectId) return 'No Project';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Function to get project details
  const getProjectDetails = (projectId) => {
    if (!projectId) return null;
    return projects.find(p => p.id === projectId);
  };

  // Function to get employee/user name by ID with improved fallback
  const getEmployeeName = (employeeId) => {
    if (!employeeId) return 'Unassigned';
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return 'Unknown User';
    
    // Return the most descriptive name available
    if (employee.fullName) return employee.fullName;
    if (employee.firstName && employee.lastName) return `${employee.firstName} ${employee.lastName}`;
    if (employee.name) return employee.name;
    if (employee.email) return employee.email;
    return 'Unknown User';
  };
  
  // Function to get employee/user details
  const getEmployeeDetails = (employeeId) => {
    if (!employeeId) return null;
    return employees.find(e => e.id === employeeId);
  };
  
  // Function to get status icon with overdue indicator
  const getStatusIcon = (status, dueDate) => {
    // Check if task is overdue
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'completed';
    
    if (isOverdue) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'in_progress':
        return <Play className="w-5 h-5 text-blue-500" />;
      case 'pending':
        return <Circle className="w-5 h-5 text-amber-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Square className="w-5 h-5 text-gray-400" />;
    }
  };
  
  // Function to check if a task is overdue
  const isTaskOverdue = (task) => {
    if (!task || !task.dueDate || task.status === 'completed' || task.status === 'cancelled') return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };
  
  // Function to format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not set';
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  // Function to add a comment to a task
  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;
    
    setCommentLoading(true);
    try {
      // Get the current task document reference
      const taskRef = doc(db, "tasks", task.id);
      
      // Create the new comment object
      const commentObj = {
        userId: auth.currentUser?.uid,
        text: newComment.trim(),
        timestamp: serverTimestamp()
      };
      
      // Prepare the comments array (ensure it exists)
      const comments = Array.isArray(task.comments) 
        ? [...task.comments, commentObj] 
        : [commentObj];
      
      // Update the task document with the new comments array
      await updateDoc(taskRef, { comments });
      
      // Clear the comment input
      setNewComment("");
      toast.success("Comment added successfully");
      
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };
  
  // Function to extract and validate URLs from text
  const extractLinks = (text) => {
    if (!text) return [];
    
    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };
  
  // Function to handle link clicks
  const handleLinkClick = (url) => {
    if (!url) return;
    
    // Open the link in a new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-gray-500 mb-4">Task not found</div>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-900/10 dark:to-purple-900/5 p-6 overflow-auto">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-purple-200/20 to-pink-200/20 dark:from-purple-900/10 dark:to-pink-900/10 rounded-full blur-3xl opacity-60"></div>
      </div>
      
      <div className="container mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border border-indigo-200/50 dark:border-indigo-500/20"
        >
          <div className="col-span-2 space-y-5">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  {getStatusIcon(task.status, task.dueDate)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                    {task.title}
                  </h2>
                  {isTaskOverdue(task) && (
                    <div className="flex items-center mt-1 text-red-500 text-xs font-medium">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Overdue
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-white/70 dark:bg-slate-700/70 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100/70 dark:hover:bg-indigo-700/40 border border-indigo-200/60 dark:border-indigo-500/30 rounded-xl transition-all duration-200 shadow-sm backdrop-blur-sm text-sm"
              >
                Back
              </button>
            </div>

            {/* Project Information Card */}
            {task.projectId && (
              <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-500/20 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-medium text-indigo-700 dark:text-indigo-300">Project Information</h3>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">{getProjectName(task.projectId)}</span>
                </div>
                {getProjectDetails(task.projectId)?.description && (
                  <p className="text-xs text-indigo-600/70 dark:text-indigo-300/70 mt-1">
                    {getProjectDetails(task.projectId)?.description}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* Left Column */}
              <div className="space-y-3 bg-white/60 dark:bg-slate-700/60 p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-500/20 shadow-sm">
                <h3 className="font-medium text-indigo-700 dark:text-indigo-300 mb-2">Task Details</h3>
                
                <div className="flex items-center gap-2 text-indigo-600/80 dark:text-indigo-300/80">
                  <div className="w-4 h-4 flex-shrink-0">{getStatusIcon(task.status, task.dueDate)}</div>
                  <span><strong>Status:</strong> {task.status}</span>
                </div>
                
                <div className="flex items-center gap-2 text-indigo-600/80 dark:text-indigo-300/80">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span><strong>Due Date:</strong> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-indigo-600/80 dark:text-indigo-300/80">
                  <Flag className="w-4 h-4 flex-shrink-0" />
                  <span><strong>Priority:</strong> {task.priority || 'Medium'}</span>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-3 bg-white/60 dark:bg-slate-700/60 p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-500/20 shadow-sm">
                <h3 className="font-medium text-indigo-700 dark:text-indigo-300 mb-2">Assignment</h3>
                
                <div className="flex items-center gap-2 text-indigo-600/80 dark:text-indigo-300/80">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span><strong>Assigned To:</strong> {getEmployeeName(task.assignee)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-indigo-600/80 dark:text-indigo-300/80">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span><strong>Created By:</strong> {getEmployeeName(task.created_by)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-indigo-600/80 dark:text-indigo-300/80">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span><strong>Created:</strong> {formatDate(task.created_at)}</span>
                </div>
                
                {task.updated_at && (
                  <div className="flex items-center gap-2 text-indigo-600/80 dark:text-indigo-300/80">
                    <RefreshCw className="w-4 h-4 flex-shrink-0" />
                    <span><strong>Updated:</strong> {formatDate(task.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                  Description
                </h3>
                <button 
                  onClick={() => navigate(`/tasks?filter=overdue`)} 
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg border border-red-200 transition-colors duration-200 shadow-sm"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  View All Overdue Tasks
                </button>
              </div>
              <div className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm p-4 rounded-xl border border-violet-200/50 dark:border-violet-500/20 text-sm text-violet-600/90 dark:text-violet-300/90 whitespace-pre-wrap">
                {task.description || "No description provided."}
              </div>
              
              {/* Extract and display links from description */}
              {task.description && extractLinks(task.description).length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-slate-800 dark:text-white mb-2">Links:</h4>
                  <div className="flex flex-wrap gap-2">
                    {extractLinks(task.description).map((link, index) => (
                      <button
                        key={index}
                        onClick={() => handleLinkClick(link)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white/70 dark:bg-slate-700/70 text-violet-600 dark:text-violet-300 hover:bg-violet-100/70 dark:hover:bg-violet-700/40 border border-violet-200/60 dark:border-violet-500/30 rounded-lg transition-all duration-200 shadow-sm backdrop-blur-sm text-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.length > 30 ? link.substring(0, 30) + '...' : link}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Documents or Attachments Section */}
            {task.attachments && task.attachments.length > 0 && (
              <div>
                <h3 className="font-medium text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                  Attachments
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.attachments.map((attachment, index) => (
                    <div 
                      key={index}
                      className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm p-3 rounded-xl border border-violet-200/50 dark:border-violet-500/20 flex items-center justify-between"
                    >
                      <div className="truncate text-sm text-violet-600/90 dark:text-violet-300/90">
                        {attachment.name || 'Document'}
                      </div>
                      <button
                        onClick={() => handleLinkClick(attachment.url)}
                        className="p-1.5 bg-white/70 dark:bg-slate-600/70 text-violet-600 dark:text-violet-300 hover:bg-violet-100/70 dark:hover:bg-violet-700/40 border border-violet-200/60 dark:border-violet-500/30 rounded-lg transition-all duration-200 shadow-sm backdrop-blur-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="col-span-1 space-y-4">
            {/* Task Details Card */}
            <div className="bg-gradient-to-br from-indigo-50/80 to-violet-50/80 dark:from-indigo-900/20 dark:to-violet-900/20 backdrop-blur-xl p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-500/20 shadow-sm">
              <h3 className="font-medium text-slate-800 dark:text-white mb-3">Task Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-600/70 dark:text-indigo-300/70">Task ID:</span>
                  <span className="font-medium text-indigo-800 dark:text-indigo-200">
                    {task.id.substring(0, 8)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-600/70 dark:text-indigo-300/70">Status:</span>
                  <span className="font-medium text-indigo-800 dark:text-indigo-200 flex items-center gap-1">
                    {getStatusIcon(task.status)}
                    {task.status}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-600/70 dark:text-indigo-300/70">Priority:</span>
                  <span className="font-medium text-indigo-800 dark:text-indigo-200">
                    {task.priority || "Medium"}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-500/20 shadow-sm">
              <h3 className="font-medium text-slate-800 dark:text-white mb-3">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                  <div>
                    <p className="text-xs font-medium text-indigo-800 dark:text-indigo-200">Created</p>
                    <p className="text-xs text-indigo-600/70 dark:text-indigo-300/70">
                      {formatDate(task.created_at)}
                    </p>
                  </div>
                </div>

                {task.updated_at && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                    <div>
                      <p className="text-xs font-medium text-indigo-800 dark:text-indigo-200">Updated</p>
                      <p className="text-xs text-indigo-600/70 dark:text-indigo-300/70">
                        {formatDate(task.updated_at)}
                      </p>
                    </div>
                  </div>
                )}

                {task.dueDate && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5"></div>
                    <div>
                      <p className="text-xs font-medium text-indigo-800 dark:text-indigo-200">Due Date</p>
                      <p className="text-xs text-indigo-600/70 dark:text-indigo-300/70">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-500/20 shadow-sm flex flex-col h-full">
              <h3 className="font-medium text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Comments
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px]">
                {Array.isArray(task.comments) && task.comments.length > 0 ? (
                  task.comments.map((comment, index) => (
                    <div
                      key={index}
                      className="bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-500/20 shadow-sm rounded-xl p-3 text-sm transition"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {getEmployeeName(comment.userId)?.[0] || "U"}
                        </div>
                        <div className="text-sm font-medium text-slate-800 dark:text-white">
                          {getEmployeeName(comment.userId)}
                        </div>
                      </div>
                      <div className="text-indigo-600/90 dark:text-indigo-300/90 mb-2">
                        {comment.text}
                      </div>
                      
                      {/* Extract and display links from comment */}
                      {extractLinks(comment.text).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {extractLinks(comment.text).map((link, linkIndex) => (
                            <button
                              key={linkIndex}
                              onClick={() => handleLinkClick(link)}
                              className="flex items-center gap-1 px-2 py-1 bg-white/70 dark:bg-slate-600/70 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100/70 dark:hover:bg-indigo-700/40 border border-indigo-200/60 dark:border-indigo-500/30 rounded-lg transition-all duration-200 shadow-sm backdrop-blur-sm text-xs"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {link.length > 20 ? link.substring(0, 20) + '...' : link}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-xs text-right text-indigo-600/50 dark:text-indigo-300/50">
                        {formatDate(comment.timestamp)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-indigo-600/50 dark:text-indigo-300/50 italic text-center py-4">
                    No comments yet.
                  </p>
                )}
              </div>

              <div className="mt-4">
                <textarea
                  rows={3}
                  className="w-full p-3 border border-indigo-200/60 dark:border-indigo-500/30 rounded-xl text-sm bg-white/70 dark:bg-slate-700/70 text-indigo-800 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-sm"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  onClick={handleAddComment}
                  disabled={commentLoading || !newComment.trim()}
                  className="mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl w-full disabled:opacity-50 transition-all duration-200 shadow-sm text-sm font-medium"
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

export default TaskDetail;
