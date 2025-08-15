import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, Timestamp, onSnapshot, query, where, orderBy, getDoc } from "firebase/firestore";
import { db, isFirebaseConnected } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bug,
  Filter,
  Search,
  MoreHorizontal,
  Calendar,
  MessageCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Save,
  User,
  Flag,
  ArrowRight,
  Star,
  Edit,
  Trash2,
  Eye,
  Users,
  Layers,
  Target,
  Zap,
  TrendingUp,
  Activity,
  Timer,
  Plus,
  FileText,
  Code,
  Laptop,
  Server,
  Database,
  RefreshCw,
  Link,
  ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";

const BugReportPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [bugReports, setBugReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewBugModal, setShowNewBugModal] = useState(false);
  const [showBugDetailModal, setShowBugDetailModal] = useState(false);
  const [selectedBug, setSelectedBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedTask, setRelatedTask] = useState<any>(null);
  const [newBugForm, setNewBugForm] = useState({
    title: "",
    description: "",
    steps_to_reproduce: "",
    expected_behavior: "",
    actual_behavior: "",
    severity: "medium",
    status: "open",
    assigned_to: "",
    project_id: "",
    related_task_id: "",
    environment: "",
    browser: "",
    os: "",
  });

  // Check for task ID in URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const taskId = params.get('taskId');
    
    if (taskId) {
      fetchTaskDetails(taskId);
    }
  }, [location]);

  // Fetch task details if coming from Kanban board
  const fetchTaskDetails = async (taskId: string) => {
    try {
      if (!db) {
        console.warn("Firebase not available");
        return;
      }

      const taskDoc = await getDoc(doc(db, "tasks", taskId));
      if (taskDoc.exists()) {
        const taskData = { id: taskDoc.id, ...taskDoc.data() };
        setRelatedTask(taskData);
        
        // Pre-fill some form fields
        setNewBugForm(prev => ({
          ...prev,
          project_id: taskData.project_id || "",
          related_task_id: taskId
        }));
        
        // Open the new bug modal
        setShowNewBugModal(true);
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
    }
  };

  useEffect(() => {
    const unsubscribers: any[] = [];
    let mounted = true;
    let connectionTimeout: NodeJS.Timeout;

    const setupFirebaseWithTimeout = async () => {
      try {
        // Set a timeout for Firebase connection
        connectionTimeout = setTimeout(() => {
          if (mounted) {
            console.warn("Firebase connection timeout");
            setLoading(false);
            // Use mock data
            setBugReports(getMockBugReports());
            setProjects(getMockProjects());
            setEmployees(getMockEmployees());
            setTasks(getMockTasks());
          }
        }, 5000);

        // Check if Firebase is available
        if (!db) {
          throw new Error("Firebase not available");
        }

        // Set up real-time listeners
        const bugReportsRef = collection(db, "bug_reports");
        const projectsRef = collection(db, "projects");
        const employeesRef = collection(db, "employees");
        const tasksRef = collection(db, "tasks");

        // Bug reports listener
        const bugReportsUnsubscribe = onSnapshot(
          query(bugReportsRef, orderBy("created_at", "desc")),
          (snapshot) => {
            if (mounted) {
              const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setBugReports(data);
              clearTimeout(connectionTimeout);
            }
          },
          (error) => {
            console.error("Error fetching bug reports:", error);
            if (mounted) {
              setBugReports(getMockBugReports());
            }
          }
        );

        // Projects listener
        const projectsUnsubscribe = onSnapshot(
          projectsRef,
          (snapshot) => {
            if (mounted) {
              const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setProjects(data);
            }
          },
          (error) => {
            console.error("Error fetching projects:", error);
            if (mounted) {
              setProjects(getMockProjects());
            }
          }
        );

        // Employees listener
        const employeesUnsubscribe = onSnapshot(
          employeesRef,
          (snapshot) => {
            if (mounted) {
              const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setEmployees(data);
            }
          },
          (error) => {
            console.error("Error fetching employees:", error);
            if (mounted) {
              setEmployees(getMockEmployees());
            }
          }
        );

        // Tasks listener
        const tasksUnsubscribe = onSnapshot(
          tasksRef,
          (snapshot) => {
            if (mounted) {
              const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setTasks(data);
            }
          },
          (error) => {
            console.error("Error fetching tasks:", error);
            if (mounted) {
              setTasks(getMockTasks());
            }
          }
        );

        unsubscribers.push(
          bugReportsUnsubscribe,
          projectsUnsubscribe,
          employeesUnsubscribe,
          tasksUnsubscribe
        );

        setLoading(false);
      } catch (error) {
        console.error("Error setting up Firebase:", error);
        if (mounted) {
          setLoading(false);
          // Use mock data
          setBugReports(getMockBugReports());
          setProjects(getMockProjects());
          setEmployees(getMockEmployees());
          setTasks(getMockTasks());
        }
      }
    };

    setupFirebaseWithTimeout();

    return () => {
      mounted = false;
      clearTimeout(connectionTimeout);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  // Mock data for offline mode
  const getMockBugReports = () => [
    {
      id: "bug-1",
      title: "Login page crashes on mobile devices",
      description: "The login page crashes when accessed from mobile devices with screen width less than 375px.",
      steps_to_reproduce: "1. Open the app on a mobile device\n2. Navigate to login page\n3. Attempt to enter credentials",
      expected_behavior: "Login form should display properly and accept input",
      actual_behavior: "App crashes with a JavaScript error",
      severity: "high",
      status: "open",
      assigned_to: "mock-user-2",
      project_id: "mock-project-1",
      related_task_id: "mock-task-2",
      environment: "Production",
      browser: "Chrome, Safari",
      os: "iOS, Android",
      created_at: { seconds: Date.now() / 1000 - 86400 },
      created_by: "mock-user",
      comments: [
        { id: 1, user_id: "mock-user-3", text: "I can reproduce this on iPhone 12", timestamp: { seconds: Date.now() / 1000 - 43200 } }
      ]
    },
    {
      id: "bug-2",
      title: "Data visualization chart shows incorrect values",
      description: "The bar chart on the analytics dashboard is displaying incorrect percentage values.",
      steps_to_reproduce: "1. Go to Analytics dashboard\n2. View the conversion rate chart\n3. Compare values with the raw data",
      expected_behavior: "Chart values should match the data table percentages",
      actual_behavior: "Chart shows values approximately 15% higher than actual data",
      severity: "medium",
      status: "in_progress",
      assigned_to: "mock-user-4",
      project_id: "mock-project-3",
      related_task_id: "mock-task-3",
      environment: "Staging",
      browser: "All browsers",
      os: "All platforms",
      created_at: { seconds: Date.now() / 1000 - 172800 },
      created_by: "mock-user-2",
      comments: []
    },
    {
      id: "bug-3",
      title: "API timeout on large data requests",
      description: "The API endpoint for fetching user activity times out when requesting more than 30 days of data.",
      steps_to_reproduce: "1. Use the /api/user-activity endpoint\n2. Set date range parameter to more than 30 days\n3. Submit request",
      expected_behavior: "API should return complete dataset with appropriate pagination",
      actual_behavior: "Request times out after 30 seconds with no data returned",
      severity: "high",
      status: "open",
      assigned_to: "mock-user",
      project_id: "mock-project-2",
      related_task_id: "mock-task-5",
      environment: "Development, Staging, Production",
      browser: "N/A",
      os: "N/A",
      created_at: { seconds: Date.now() / 1000 - 259200 },
      created_by: "mock-user-3",
      comments: [
        { id: 1, user_id: "mock-user", text: "This is affecting our reporting capabilities", timestamp: { seconds: Date.now() / 1000 - 172800 } },
        { id: 2, user_id: "mock-user-2", text: "We need to implement pagination on this endpoint", timestamp: { seconds: Date.now() / 1000 - 86400 } }
      ]
    },
    {
      id: "bug-4",
      title: "Password reset emails not being delivered",
      description: "Users report not receiving password reset emails when requested through the forgot password flow.",
      steps_to_reproduce: "1. Go to login page\n2. Click 'Forgot Password'\n3. Enter email address\n4. Submit request",
      expected_behavior: "User should receive password reset email within minutes",
      actual_behavior: "No email is received, even after several hours",
      severity: "critical",
      status: "resolved",
      assigned_to: "mock-user-3",
      project_id: "mock-project-1",
      related_task_id: "mock-task-1",
      environment: "Production",
      browser: "All browsers",
      os: "All platforms",
      created_at: { seconds: Date.now() / 1000 - 345600 },
      created_by: "mock-user-4",
      comments: [
        { id: 1, user_id: "mock-user-3", text: "Fixed SMTP configuration issue", timestamp: { seconds: Date.now() / 1000 - 86400 } }
      ]
    },
    {
      id: "bug-5",
      title: "Session timeout occurs too quickly",
      description: "Users are being logged out after only 5 minutes of inactivity instead of the configured 30 minutes.",
      steps_to_reproduce: "1. Log in to the application\n2. Remain inactive for 5-10 minutes\n3. Attempt to perform an action",
      expected_behavior: "Session should remain active for 30 minutes as configured",
      actual_behavior: "User is logged out after approximately 5 minutes",
      severity: "low",
      status: "in_progress",
      assigned_to: "mock-user-2",
      project_id: "mock-project-2",
      related_task_id: "",
      environment: "Production",
      browser: "All browsers",
      os: "All platforms",
      created_at: { seconds: Date.now() / 1000 - 432000 },
      created_by: "mock-user",
      comments: []
    }
  ];

  const getMockProjects = () => [
    {
      id: "mock-project-1",
      name: "Website Redesign",
      description: "Complete website redesign project with modern UI",
      color: "#00D4FF"
    },
    {
      id: "mock-project-2",
      name: "Mobile Application",
      description: "iOS and Android app development",
      color: "#FF6600"
    },
    {
      id: "mock-project-3",
      name: "Analytics Dashboard",
      description: "Real-time analytics and reporting dashboard",
      color: "#f59e0b"
    }
  ];

  const getMockEmployees = () => [
    {
      id: "mock-user",
      name: "Alice Johnson",
      email: "alice@example.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
      role: "Senior Designer"
    },
    {
      id: "mock-user-2",
      name: "Bob Smith",
      email: "bob@example.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
      role: "Full Stack Developer"
    },
    {
      id: "mock-user-3",
      name: "Carol Davis",
      email: "carol@example.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
      role: "QA Engineer"
    },
    {
      id: "mock-user-4",
      name: "David Wilson",
      email: "david@example.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      role: "Product Manager"
    }
  ];

  const getMockTasks = () => [
    {
      id: "mock-task-1",
      title: "Design System Enhancement",
      description: "Update the design system components with new branding guidelines and color schemes",
      status: "pending",
      priority: "high",
      assigned_to: "mock-user",
      project_id: "mock-project-1"
    },
    {
      id: "mock-task-2",
      title: "Payment API Integration",
      description: "Integrate third-party payment API for checkout flow with enhanced security",
      status: "in_progress",
      priority: "high",
      assigned_to: "mock-user-2",
      project_id: "mock-project-1"
    },
    {
      id: "mock-task-3",
      title: "User Experience Testing",
      description: "Conduct comprehensive user testing for the new dashboard interface",
      status: "review",
      priority: "medium",
      assigned_to: "mock-user-3",
      project_id: "mock-project-3"
    },
    {
      id: "mock-task-4",
      title: "API Documentation Update",
      description: "Update comprehensive API documentation with new endpoints and examples",
      status: "completed",
      priority: "low",
      assigned_to: "mock-user",
      project_id: "mock-project-2"
    },
    {
      id: "mock-task-5",
      title: "Performance Optimization",
      description: "Optimize application performance and reduce bundle size",
      status: "in_progress",
      priority: "medium",
      assigned_to: "mock-user-2",
      project_id: "mock-project-2"
    }
  ];

  // Helper functions
  const getEmployeeName = (id: string) => {
    if (!id) return "Unassigned";
    const employee = employees.find((emp) => emp.id === id || emp.uid === id);
    if (employee) {
      if (employee.fullName) return employee.fullName;
      if (employee.firstName && employee.lastName) return `${employee.firstName} ${employee.lastName}`;
      if (employee.name) return employee.name;
      if (employee.displayName) return employee.displayName;
      if (employee.email) return employee.email;
      return employee.id || employee.uid || 'User';
    }
    return id === 'admin' ? 'Admin' : id;
  };

  const getEmployeeAvatar = (id: string) => {
    const employee = employees.find((emp) => emp.id === id);
    return employee ? employee.avatar : "https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown";
  };

  const getProjectName = (id: string) => {
    const project = projects.find((p) => p.id === id);
    return project ? project.name : "Unknown Project";
  };

  const getProjectColor = (id: string) => {
    const project = projects.find((p) => p.id === id);
    return project ? project.color : "#6b7280";
  };

  const getTaskTitle = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    return task ? task.title : "";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-500/30";
      case "high":
        return "text-orange-600 bg-orange-100 border-orange-200 dark:text-orange-400 dark:bg-orange-900/30 dark:border-orange-500/30";
      case "medium":
        return "text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-500/30";
      case "low":
        return "text-green-600 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-500/30";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-900/30 dark:border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-500/30";
      case "in_progress":
        return "text-purple-600 bg-purple-100 border-purple-200 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-500/30";
      case "resolved":
        return "text-green-600 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-500/30";
      case "closed":
        return "text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-900/30 dark:border-gray-500/30";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-900/30 dark:border-gray-500/30";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case "high":
        return <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case "medium":
        return <Flag className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "low":
        return <Flag className="w-4 h-4 text-green-600 dark:text-green-400" />;
      default:
        return <Flag className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  // Filter bugs based on search and filters
  const filteredBugs = bugReports.filter((bug) => {
    // Search term filter
    const searchMatch =
      !searchTerm ||
      bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bug.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Severity filter
    const severityMatch = !selectedSeverity || bug.severity === selectedSeverity;

    // Status filter
    const statusMatch = !selectedStatus || bug.status === selectedStatus;

    // Project filter
    const projectMatch = !selectedProject || bug.project_id === selectedProject;

    // Assignee filter
    const assigneeMatch = !selectedAssignee || bug.assigned_to === selectedAssignee;

    return searchMatch && severityMatch && statusMatch && projectMatch && assigneeMatch;
  });

  // Handle creating a new bug report
  const handleCreateBug = async () => {
    if (!isFirebaseConnected()) {
      toast.error("Cannot create bug report - Firebase connection unavailable");
      return;
    }

    try {
      const newBugData = {
        ...newBugForm,
        created_by: user?.uid || "anonymous",
        created_at: serverTimestamp(),
        comments: []
      };

      const docRef = await addDoc(collection(db, "bug_reports"), newBugData);
      setBugReports(prev => [{ id: docRef.id, ...newBugData, created_at: { seconds: Date.now() / 1000 } }, ...prev]);
      setShowNewBugModal(false);
      setNewBugForm({
        title: "",
        description: "",
        steps_to_reproduce: "",
        expected_behavior: "",
        actual_behavior: "",
        severity: "medium",
        status: "open",
        assigned_to: "",
        project_id: "",
        related_task_id: "",
        environment: "",
        browser: "",
        os: "",
      });
      toast.success("Bug report created successfully!");
    } catch (error) {
      console.error("Error creating bug report:", error);
      toast.error("Failed to create bug report. Please check your connection and try again.");
    }
  };

  // Handle updating a bug report
  const handleUpdateBug = async (bugId: string, updatedData: any) => {
    if (!isFirebaseConnected()) {
      toast.error("Cannot update bug report - Firebase connection unavailable");
      return;
    }

    try {
      const bugRef = doc(db, "bug_reports", bugId);
      await updateDoc(bugRef, updatedData);
      setBugReports(prev =>
        prev.map(bug =>
          bug.id === bugId ? { ...bug, ...updatedData } : bug
        )
      );
      toast.success("Bug report updated successfully!");
    } catch (error) {
      console.error("Error updating bug report:", error);
      toast.error("Failed to update bug report. Please check your connection and try again.");
    }
  };

  // Handle adding a comment to a bug report
  const handleAddComment = async (bugId: string, commentText: string) => {
    if (!isFirebaseConnected()) {
      toast.error("Cannot add comment - Firebase connection unavailable");
      return;
    }

    try {
      const bugRef = doc(db, "bug_reports", bugId);
      const bug = bugReports.find(b => b.id === bugId);
      
      if (!bug) {
        toast.error("Bug report not found");
        return;
      }
      
      const comments = bug.comments || [];
      const newComment = {
        id: Date.now(),
        user_id: user?.uid || "anonymous",
        text: commentText,
        timestamp: serverTimestamp()
      };
      
      await updateDoc(bugRef, {
        comments: [...comments, newComment]
      });
      
      setBugReports(prev =>
        prev.map(bug =>
          bug.id === bugId ? { 
            ...bug, 
            comments: [...(bug.comments || []), {
              ...newComment,
              timestamp: { seconds: Date.now() / 1000 }
            }] 
          } : bug
        )
      );
      
      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment. Please check your connection and try again.");
    }
  };

  // Navigate to related task in Kanban board
  const navigateToTask = (taskId: string) => {
    navigate(`/kanban?taskId=${taskId}`);
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 dark:border-blue-400 dark:border-t-blue-300 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Bug className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading bug reports...</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Preparing the bug tracking system
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 backdrop-blur-sm overflow-hidden">
      {/* Enhanced Header */}
      <div className="liquid-glass border-b border-2 border-purple-500/50 dark:border-purple-500/30 p-4 flex-shrink-0 backdrop-blur-2xl bg-gradient-to-r from-cyan-50/80 via-orange-50/80 to-cyan-100/80 dark:bg-gradient-to-r dark:from-slate-900/95 dark:via-violet-900/90 dark:to-indigo-900/95">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse" />
                <Bug className="w-6 h-6 text-white relative z-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-red-500 to-orange-500 dark:from-purple-400 dark:to-purple-500 bg-clip-text text-transparent">
                  Bug Reports
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {filteredBugs.length} bugs • {projects.length} projects
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 text-xs bg-gradient-to-r from-red-100/80 to-orange-100/80 dark:from-purple-900/40 dark:to-purple-800/40 text-red-700 dark:text-purple-300 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-full flex items-center gap-1 backdrop-blur-sm">
                <Activity className="w-3 h-3" />
                {navigator.onLine ? 'Live' : 'Offline'}
              </span>
              <span className="px-3 py-1.5 text-xs bg-gradient-to-r from-orange-100/80 to-yellow-100/80 dark:from-purple-900/40 dark:to-purple-800/40 text-orange-700 dark:text-purple-300 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-full backdrop-blur-sm shadow-sm">
                {Math.round((bugReports.filter(b => b.status === "resolved").length / Math.max(bugReports.length, 1)) * 100)}% Resolved
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search bugs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/80 dark:bg-slate-800/80 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 backdrop-blur-sm w-64"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`p-2 rounded-xl border-2 ${filterOpen ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500/50 dark:border-purple-500/30 text-purple-600 dark:text-purple-400' : 'bg-white/80 dark:bg-slate-800/80 border-purple-500/50 dark:border-purple-500/30 text-gray-600 dark:text-gray-400'} backdrop-blur-sm`}
            >
              <Filter className="w-5 h-5" />
            </button>

            {/* Create New Bug Button */}
            <button
              onClick={() => setShowNewBugModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl transition-all duration-200 shadow-lg flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Bug
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-4 gap-4 py-4">
                {/* Severity Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Severity
                  </label>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    className="w-full bg-white/80 dark:bg-slate-800/80 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 backdrop-blur-sm"
                  >
                    <option value="">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full bg-white/80 dark:bg-slate-800/80 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 backdrop-blur-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Project Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full bg-white/80 dark:bg-slate-800/80 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 backdrop-blur-sm"
                  >
                    <option value="">All Projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assignee Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assignee
                  </label>
                  <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="w-full bg-white/80 dark:bg-slate-800/80 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 backdrop-blur-sm"
                  >
                    <option value="">All Assignees</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bug Reports List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 gap-4">
          {filteredBugs.length > 0 ? (
            filteredBugs.map((bug) => (
              <BugCard
                key={bug.id}
                bug={bug}
                onClick={() => {
                  setSelectedBug(bug);
                  setShowBugDetailModal(true);
                }}
                getEmployeeName={getEmployeeName}
                getEmployeeAvatar={getEmployeeAvatar}
                getProjectName={getProjectName}
                getProjectColor={getProjectColor}
                getTaskTitle={getTaskTitle}
                getSeverityColor={getSeverityColor}
                getStatusColor={getStatusColor}
                getSeverityIcon={getSeverityIcon}
                navigateToTask={navigateToTask}
              />
            ))
          ) : (
            <div className="col-span-1 flex items-center justify-center h-64 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-2 border-purple-500/50 dark:border-purple-500/30 rounded-2xl p-8">
              <div className="text-center">
                <Bug className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  No bug reports found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm || selectedSeverity || selectedStatus || selectedProject || selectedAssignee
                    ? "Try adjusting your filters or search term"
                    : "Create your first bug report to get started"}
                </p>
                <button
                  onClick={() => setShowNewBugModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl transition-all duration-200 shadow-lg flex items-center gap-2 text-sm font-medium mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  New Bug Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Bug Modal */}
      <AnimatePresence>
        {showNewBugModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {relatedTask ? `Report Bug for Task: ${relatedTask.title}` : "Report New Bug"}
                </h2>
                <button
                  onClick={() => {
                    setShowNewBugModal(false);
                    setRelatedTask(null);
                    setNewBugForm({
                      title: "",
                      description: "",
                      steps_to_reproduce: "",
                      expected_behavior: "",
                      actual_behavior: "",
                      severity: "medium",
                      status: "open",
                      assigned_to: "",
                      project_id: "",
                      related_task_id: "",
                      environment: "",
                      browser: "",
                      os: "",
                    });
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <form className="space-y-4">
                  {/* Related Task Info */}
                  {relatedTask && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-xl mb-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                          <Link className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800 dark:text-blue-300">Related Task</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-400">{relatedTask.title}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded-full">
                              {relatedTask.status}
                            </span>
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded-full">
                              {relatedTask.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bug Title *
                    </label>
                    <input
                      type="text"
                      value={newBugForm.title}
                      onChange={(e) => setNewBugForm({ ...newBugForm, title: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200"
                      placeholder="Brief, descriptive title of the bug"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={newBugForm.description}
                      onChange={(e) => setNewBugForm({ ...newBugForm, description: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 min-h-[80px]"
                      placeholder="Detailed description of the bug"
                      required
                    />
                  </div>

                  {/* Steps to Reproduce */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Steps to Reproduce
                    </label>
                    <textarea
                      value={newBugForm.steps_to_reproduce}
                      onChange={(e) => setNewBugForm({ ...newBugForm, steps_to_reproduce: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 min-h-[80px]"
                      placeholder="1. Go to...\n2. Click on...\n3. Observe that..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Expected Behavior */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Expected Behavior
                      </label>
                      <textarea
                        value={newBugForm.expected_behavior}
                        onChange={(e) => setNewBugForm({ ...newBugForm, expected_behavior: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 min-h-[80px]"
                        placeholder="What should happen"
                      />
                    </div>

                    {/* Actual Behavior */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Actual Behavior
                      </label>
                      <textarea
                        value={newBugForm.actual_behavior}
                        onChange={(e) => setNewBugForm({ ...newBugForm, actual_behavior: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 min-h-[80px]"
                        placeholder="What actually happens"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Severity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Severity *
                      </label>
                      <select
                        value={newBugForm.severity}
                        onChange={(e) => setNewBugForm({ ...newBugForm, severity: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200"
                        required
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status *
                      </label>
                      <select
                        value={newBugForm.status}
                        onChange={(e) => setNewBugForm({ ...newBugForm, status: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200"
                        required
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Project */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Project *
                      </label>
                      <select
                        value={newBugForm.project_id}
                        onChange={(e) => setNewBugForm({ ...newBugForm, project_id: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200"
                        required
                      >
                        <option value="">Select Project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Assignee */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Assigned To
                      </label>
                      <select
                        value={newBugForm.assigned_to}
                        onChange={(e) => setNewBugForm({ ...newBugForm, assigned_to: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Environment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Environment
                      </label>
                      <input
                        type="text"
                        value={newBugForm.environment}
                        onChange={(e) => setNewBugForm({ ...newBugForm, environment: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200"
                        placeholder="Production, Staging, etc."
                      />
                    </div>

                    {/* Browser */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Browser
                      </label>
                      <input
                        type="text"
                        value={newBugForm.browser}
                        onChange={(e) => setNewBugForm({ ...newBugForm, browser: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200"
                        placeholder="Chrome, Firefox, etc."
                      />
                    </div>

                    {/* OS */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Operating System
                      </label>
                      <input
                        type="text"
                        value={newBugForm.os}
                        onChange={(e) => setNewBugForm({ ...newBugForm, os: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200"
                        placeholder="Windows, macOS, etc."
                      />
                    </div>
                  </div>

                  {/* Related Task */}
                  {!relatedTask && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Related Task
                      </label>
                      <select
                        value={newBugForm.related_task_id}
                        onChange={(e) => setNewBugForm({ ...newBugForm, related_task_id: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200"
                      >
                        <option value="">None</option>
                        {tasks.map((task) => (
                          <option key={task.id} value={task.id}>
                            {task.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowNewBugModal(false);
                    setRelatedTask(null);
                    setNewBugForm({
                      title: "",
                      description: "",
                      steps_to_reproduce: "",
                      expected_behavior: "",
                      actual_behavior: "",
                      severity: "medium",
                      status: "open",
                      assigned_to: "",
                      project_id: "",
                      related_task_id: "",
                      environment: "",
                      browser: "",
                      os: "",
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBug}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 shadow-md"
                >
                  Create Bug Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bug Detail Modal */}
      <AnimatePresence>
        {showBugDetailModal && selectedBug && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {getSeverityIcon(selectedBug.severity)}
                  {selectedBug.title}
                </h2>
                <button
                  onClick={() => {
                    setShowBugDetailModal(false);
                    setSelectedBug(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-0 h-[calc(90vh-120px)]">
                {/* Main Content */}
                <div className="col-span-2 p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
                  {/* Bug Info */}
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">{selectedBug.description}</p>
                    </div>

                    {/* Steps to Reproduce */}
                    {selectedBug.steps_to_reproduce && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Steps to Reproduce</h3>
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">{selectedBug.steps_to_reproduce}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                      {/* Expected Behavior */}
                      {selectedBug.expected_behavior && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Expected Behavior</h3>
                          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">{selectedBug.expected_behavior}</p>
                        </div>
                      )}

                      {/* Actual Behavior */}
                      {selectedBug.actual_behavior && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Actual Behavior</h3>
                          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">{selectedBug.actual_behavior}</p>
                        </div>
                      )}
                    </div>

                    {/* Environment Info */}
                    {(selectedBug.environment || selectedBug.browser || selectedBug.os) && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <Laptop className="w-4 h-4" />
                          Environment Details
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          {selectedBug.environment && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Environment</h4>
                              <p className="text-sm text-gray-800 dark:text-gray-200">{selectedBug.environment}</p>
                            </div>
                          )}
                          {selectedBug.browser && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Browser</h4>
                              <p className="text-sm text-gray-800 dark:text-gray-200">{selectedBug.browser}</p>
                            </div>
                          )}
                          {selectedBug.os && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Operating System</h4>
                              <p className="text-sm text-gray-800 dark:text-gray-200">{selectedBug.os}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    <div className="mt-8">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Comments ({selectedBug.comments?.length || 0})
                      </h3>

                      {selectedBug.comments && selectedBug.comments.length > 0 ? (
                        <div className="space-y-4">
                          {selectedBug.comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 dark:bg-gray-800/50 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-xl p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <img
                                  src={getEmployeeAvatar(comment.user_id)}
                                  alt={getEmployeeName(comment.user_id)}
                                  className="w-8 h-8 rounded-full"
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {getEmployeeName(comment.user_id)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {comment.timestamp ? new Date(comment.timestamp.seconds * 1000).toLocaleString() : ""}
                                  </p>
                                </div>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm italic">No comments yet</p>
                      )}

                      {/* Add Comment Form */}
                      <div className="mt-4">
                        <textarea
                          placeholder="Add a comment..."
                          className="w-full bg-white dark:bg-slate-900 border-2 border-purple-500/50 dark:border-purple-500/30 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 min-h-[80px]"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-200 shadow-md flex items-center gap-2 text-sm font-medium"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Add Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="col-span-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-800/30">
                  {/* Status and Actions */}
                  <div className="space-y-6">
                    {/* Status Badge */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Status</h3>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBug.status)}`}>
                        {selectedBug.status === "open" && <AlertCircle className="w-4 h-4 mr-1" />}
                        {selectedBug.status === "in_progress" && <Clock className="w-4 h-4 mr-1" />}
                        {selectedBug.status === "resolved" && <CheckCircle className="w-4 h-4 mr-1" />}
                        {selectedBug.status === "closed" && <X className="w-4 h-4 mr-1" />}
                        {selectedBug.status.replace("_", " ").charAt(0).toUpperCase() + selectedBug.status.replace("_", " ").slice(1)}
                      </div>
                    </div>

                    {/* Severity Badge */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Severity</h3>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(selectedBug.severity)}`}>
                        {getSeverityIcon(selectedBug.severity)}
                        <span className="ml-1">{selectedBug.severity.charAt(0).toUpperCase() + selectedBug.severity.slice(1)}</span>
                      </div>
                    </div>

                    {/* Project */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Project</h3>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getProjectColor(selectedBug.project_id) }}
                        />
                        <span className="text-gray-800 dark:text-gray-200">
                          {getProjectName(selectedBug.project_id)}
                        </span>
                      </div>
                    </div>

                    {/* Assignee */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Assigned To</h3>
                      {selectedBug.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={getEmployeeAvatar(selectedBug.assigned_to)}
                            alt={getEmployeeName(selectedBug.assigned_to)}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-gray-800 dark:text-gray-200">
                            {getEmployeeName(selectedBug.assigned_to)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 italic">Unassigned</span>
                      )}
                    </div>

                    {/* Related Task */}
                    {selectedBug.related_task_id && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Related Task</h3>
                        <button
                          onClick={() => navigateToTask(selectedBug.related_task_id)}
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm"
                        >
                          <Link className="w-4 h-4" />
                          {getTaskTitle(selectedBug.related_task_id)}
                        </button>
                      </div>
                    )}

                    {/* Created Info */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Created</h3>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {selectedBug.created_at ? new Date(selectedBug.created_at.seconds * 1000).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {getEmployeeName(selectedBug.created_by)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Actions</h3>
                      <div className="space-y-2">
                        <button className="w-full px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                          <Edit className="w-4 h-4" />
                          Edit Bug
                        </button>
                        <button className="w-full px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Mark as Resolved
                        </button>
                        <button className="w-full px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                          <Users className="w-4 h-4" />
                          Reassign
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Bug Card Component
const BugCard = ({ bug, onClick, getEmployeeName, getEmployeeAvatar, getProjectName, getProjectColor, getTaskTitle, getSeverityColor, getStatusColor, getSeverityIcon, navigateToTask }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-2 border-purple-500/50 dark:border-purple-500/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative"
      onClick={onClick}
    >
      {/* Floating glass orbs for visual effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-500/10 to-red-500/5 rounded-full blur-xl -ml-12 -mb-12 pointer-events-none" />

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            {/* Severity Icon */}
            <div className={`p-2 rounded-lg ${getSeverityColor(bug.severity).replace("text-", "bg-").replace("bg-", "bg-opacity-20 ")}`}>
              {getSeverityIcon(bug.severity)}
            </div>

            <div>
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {bug.title}
              </h3>

              {/* Project and Status */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getProjectColor(bug.project_id) }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {getProjectName(bug.project_id)}
                  </span>
                </div>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bug.status)}`}>
                  {bug.status.replace("_", " ").charAt(0).toUpperCase() + bug.status.replace("_", " ").slice(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Severity Badge */}
          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(bug.severity)}`}>
            {bug.severity.charAt(0).toUpperCase() + bug.severity.slice(1)}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {bug.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Assignee */}
            {bug.assigned_to ? (
              <div className="flex items-center gap-2">
                <img
                  src={getEmployeeAvatar(bug.assigned_to)}
                  alt={getEmployeeName(bug.assigned_to)}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {getEmployeeName(bug.assigned_to)}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-500 italic">Unassigned</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Related Task */}
            {bug.related_task_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToTask(bug.related_task_id);
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-xs"
              >
                <Link className="w-3 h-3" />
                Task
              </button>
            )}

            {/* Created Date */}
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              {bug.created_at ? new Date(bug.created_at.seconds * 1000).toLocaleDateString() : ""}
            </div>

            {/* Comment Count */}
            {bug.comments && bug.comments.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <MessageCircle className="w-3 h-3" />
                {bug.comments.length}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BugReportPage;
