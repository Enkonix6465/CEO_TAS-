import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, onSnapshot, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { motion } from "framer-motion";
import { ExternalLink, Calendar, Clock, User, Flag, CheckCircle, Circle, Edit2, Target, AlertCircle, RefreshCw, Play, Square, MessageSquare, X } from "lucide-react";
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
  }, [taskId]);

  // Function to get project name by ID
  const getProjectName = (projectId) => {
    if (!projectId) return 'No Project';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Function to get employee name by ID
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

  const getEmployeeAvatar = (empId) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${empId}`;
  };

  // Function to add a comment to a task
  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;
    
    setCommentLoading(true);
    try {
      const comment = {
        text: newComment.trim(),
        timestamp: new Date().toISOString(),
        userId: auth.currentUser?.uid || 'anonymous',
      };

      if (db) {
        const taskRef = doc(db, "tasks", task.id);
        await updateDoc(taskRef, {
          comments: arrayUnion(comment)
        });
      }

      // Update local state
      setTask((prev) => ({
        ...prev,
        comments: [...(prev?.comments || []), comment]
      }));

      setNewComment("");
      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
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
    <div className="h-full bg-gray-50 dark:bg-slate-900 p-6 overflow-auto">
      <div className="container mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Circle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {task.title}
                </h2>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Project:</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {getProjectName(task.project_id || task.projectId)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1 capitalize">
                        {task.status?.replace('_', ' ') || "Pending"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Date:</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {task.due_date || task.dueDate ? new Date(task.due_date || task.dueDate).toLocaleDateString() : "Not set"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress:</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {task.status?.replace('_', ' ') || "pending"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned:</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {getEmployeeName(task.assigned_to || task.assignee)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created By:</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {getEmployeeName(task.created_by)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Review:</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">—</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created:</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {task.created_at?.seconds ? 
                          new Date(task.created_at.seconds * 1000).toLocaleDateString() : 
                          "Unknown"
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress Updated:</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {task.progress_updated_at?.seconds ? 
                        new Date(task.progress_updated_at.seconds * 1000).toLocaleDateString() : 
                        "Not updated"
                      }
                    </p>
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                  <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {task.description || "—"}
                    </p>
                  </div>
                </div>
                
                {/* Progress Notes */}
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress Notes</label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {task.progress_description || "—"}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                {/* Details Panel */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Details</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Assignee:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{getEmployeeName(task.assigned_to || task.assignee)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Reporter:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{getEmployeeName(task.created_by)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium capitalize">
                        {task.status?.replace('_', ' ') || "Pending"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority:</span>
                      <span className="text-sm text-gray-900 dark:text-white capitalize">
                        {task.priority || "Medium"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Labels:</span>
                      <span className="text-sm text-gray-900 dark:text-white">None</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Due date:</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {task.due_date || task.dueDate ? new Date(task.due_date || task.dueDate).toLocaleDateString() : "Not set"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Start date:</span>
                      <span className="text-sm text-gray-900 dark:text-white">None</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress Updated:</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {task.progress_updated_at?.seconds ? 
                          new Date(task.progress_updated_at.seconds * 1000).toLocaleString() : 
                          "Not updated"
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Review:</span>
                      <span className="text-sm text-gray-900 dark:text-white">—</span>
                    </div>
                  </div>
                </div>
                
                {/* Comments Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comments
                  </h3>
                  
                  <div className="p-4">
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {task.comments?.length > 0 ? (
                        task.comments.map((comment, index) => (
                          <div key={index} className="flex gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <img
                              src={getEmployeeAvatar(comment.userId || 'default')}
                              alt="avatar"
                              className="w-8 h-8 rounded-full flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {getEmployeeName(comment.userId) || "User"} • {new Date(comment.timestamp).toLocaleDateString()}
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {comment.text || comment}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex gap-3">
                        <img
                          src={getEmployeeAvatar(auth.currentUser?.uid || 'current')}
                          alt="avatar"
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1">
                          <textarea
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full p-2 text-sm border-0 bg-transparent text-gray-900 dark:text-white resize-none focus:outline-none placeholder:text-gray-500"
                            rows={2}
                          />
                          <div className="flex justify-end mt-2">
                            <button 
                              onClick={handleAddComment}
                              disabled={commentLoading || !newComment.trim()}
                              className="px-4 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                              {commentLoading ? "Posting..." : "Post Comment"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TaskDetail;
