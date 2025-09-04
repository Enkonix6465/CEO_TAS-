import React, { useState, useEffect, useRef } from "react";
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
  const commentsEndRef = useRef(null);
  const commentsContainerRef = useRef(null);

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

        // Setup listeners for both users and employees collections
        const usersUnsubscribe = onSnapshot(
          collection(db, "users"),
          (snapshot) => {
            const usersData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setEmployees(prev => {
              // Merge users data with existing employees
              const existingEmployees = prev.filter(emp => !usersData.find(user => user.id === emp.id || user.uid === emp.id));
              return [...usersData, ...existingEmployees];
            });
          },
          (error) => {
            console.error("Error fetching users:", error);
          }
        );

        // Also fetch from employees collection for legacy data
        const employeesUnsubscribe = onSnapshot(
          collection(db, "employees"),
          (snapshot) => {
            const employeesData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setEmployees(prev => {
              // Merge employees data with existing users
              const existingUsers = prev.filter(user => !employeesData.find(emp => emp.id === user.id || emp.id === user.uid));
              return [...existingUsers, ...employeesData];
            });
          },
          (error) => {
            console.error("Error fetching employees:", error);
          }
        );

        return () => {
          taskUnsubscribe();
          projectsUnsubscribe();
          usersUnsubscribe();
          employeesUnsubscribe();
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

    // Check users collection first (from users setup)
    const user = employees.find(e => e.id === employeeId || e.uid === employeeId);
    if (user) {
      // Return the most descriptive name available
      if (user.fullName) return user.fullName;
      if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
      if (user.name) return user.name;
      if (user.email) return user.email;
      if (user.displayName) return user.displayName;
      return user.id || user.uid || 'User';
    }

    // Return employeeId if no user found but it exists
    return employeeId || 'Unknown User';
  };

  const getEmployeeAvatar = (empId) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${empId}`;
  };

  // Function to scroll to bottom of comments
  const scrollToBottomOfComments = () => {
    setTimeout(() => {
      if (commentsEndRef.current) {
        commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
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

      // Auto-scroll to the new comment
      scrollToBottomOfComments();
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

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
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
                      <div className="flex items-center mt-1">
                        {task.reviewpoints ? (
                          <>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, index) => {
                                const isFilled = task.reviewpoints >= (index + 1) * 20;
                                return (
                                  <svg
                                    key={index}
                                    className={`w-4 h-4 ${isFilled ? "text-yellow-400" : "text-gray-300"}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.948a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.443a1 1 0 00-.364 1.118l1.287 3.948c.3.921-.755 1.688-1.538 1.118l-3.36-2.443a1 1 0 00-1.175 0l-3.36 2.443c-.783.57-1.838-.197-1.538-1.118l1.287-3.948a1 1 0 00-.364-1.118l-3.36-2.443c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.948z" />
                                  </svg>
                                );
                              })}
                            </div>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              {task.reviewpoints}/100
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-900 dark:text-white">—</span>
                        )}
                      </div>
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
                      {task.reviewpoints ? (
                        <div className="flex items-center">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, index) => {
                              const isFilled = task.reviewpoints >= (index + 1) * 20;
                              return (
                                <svg
                                  key={index}
                                  className={`w-3 h-3 ${isFilled ? "text-yellow-400" : "text-gray-300"}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.948a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.443a1 1 0 00-.364 1.118l1.287 3.948c.3.921-.755 1.688-1.538 1.118l-3.36-2.443a1 1 0 00-1.175 0l-3.36 2.443c-.783.57-1.838-.197-1.538-1.118l1.287-3.948a1 1 0 00-.364-1.118l-3.36-2.443c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.948z" />
                                </svg>
                              );
                            })}
                          </div>
                          <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
                            {task.reviewpoints}/100
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-900 dark:text-white">—</span>
                      )}
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
                    <div ref={commentsContainerRef} className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar scroll-smooth">
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
                      <div ref={commentsEndRef} />
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
