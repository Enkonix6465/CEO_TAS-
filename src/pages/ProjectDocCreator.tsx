import React, { useState, useEffect, Suspense } from "react";
import "react-quill/dist/quill.snow.css";

/**
 * Note: ReactQuill internally uses findDOMNode which is deprecated in React 18.
 * This warning is a known issue with the react-quill library and cannot be completely
 * eliminated without updating the library itself. The warning does not affect functionality.
 * See: https://github.com/zenoamaro/react-quill/issues/775
 */

// Import ReactQuill directly since warning is handled globally
import ReactQuill from "react-quill";

// Simplified wrapper component for ReactQuill with SSR protection
const QuillEditor = React.forwardRef<ReactQuill, any>((props, ref) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server side to avoid hydration issues
  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border-2 border-dashed border-blue-300 dark:border-gray-600">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Initializing creative editor...</p>
        </div>
      </div>
    );
  }

  return <ReactQuill ref={ref} {...props} />;
});

QuillEditor.displayName = 'QuillEditor';

import { v4 as uuidv4 } from "uuid";
import {
  collection,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Edit3,
  Eye,
  Save,
  Copy,
  Download,
  Trash2,
  Calendar,
  User,
  Lock,
  Search,
  Filter,
  Share,
  Layout,
  Sparkles,
  Zap,
  Bookmark,
  Star,
  Globe,
  Palette,
  Type,
  Image,
  Code,
  Heart,
  Award,
  Briefcase,
  Users,
  Clock,
  Target,
  Layers,
  Settings,
  ChevronRight,
  ExternalLink,
  Send,
  Mail,
  Link,
  Facebook,
  Twitter,
  Linkedin,
  CheckCircle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const ProjectDocCreator = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [content, setContent] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("documents");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    public: false,
    allowComments: true,
    allowDownload: false,
    password: "",
    expiryDate: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Document Templates
  const templates = [
    {
      id: "project-proposal",
      name: "Project Proposal",
      description: "Comprehensive project proposal template with timeline and budget",
      category: "Business",
      icon: Briefcase,
      color: "from-blue-500 to-indigo-600",
      content: `
        <h1>Project Proposal: [Project Name]</h1>
        <h2>Executive Summary</h2>
        <p>Brief overview of the project objectives and expected outcomes.</p>
        
        <h2>Project Scope</h2>
        <ul>
          <li>Objective 1: Description</li>
          <li>Objective 2: Description</li>
          <li>Objective 3: Description</li>
        </ul>
        
        <h2>Timeline</h2>
        <p>Phase 1: [Start Date] - [End Date]</p>
        <p>Phase 2: [Start Date] - [End Date]</p>
        <p>Phase 3: [Start Date] - [End Date]</p>
        
        <h2>Budget Overview</h2>
        <p>Total Budget: $[Amount]</p>
        <p>Resource Allocation: [Details]</p>
        
        <h2>Team Structure</h2>
        <p>Project Manager: [Name]</p>
        <p>Lead Developer: [Name]</p>
        <p>Designer: [Name]</p>
      `
    },
    {
      id: "meeting-notes",
      name: "Meeting Notes",
      description: "Structured meeting notes with action items and decisions",
      category: "Meeting",
      icon: Users,
      color: "from-green-500 to-emerald-600",
      content: `
        <h1>Meeting Notes</h1>
        <p><strong>Date:</strong> [Date]</p>
        <p><strong>Time:</strong> [Time]</p>
        <p><strong>Attendees:</strong> [List of attendees]</p>
        
        <h2>Agenda</h2>
        <ol>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ol>
        
        <h2>Key Discussions</h2>
        <p>[Summary of main discussion points]</p>
        
        <h2>Decisions Made</h2>
        <ul>
          <li>Decision 1</li>
          <li>Decision 2</li>
        </ul>
        
        <h2>Action Items</h2>
        <table>
          <tr><th>Action</th><th>Owner</th><th>Due Date</th><th>Status</th></tr>
          <tr><td>[Action]</td><td>[Name]</td><td>[Date]</td><td>[Status]</td></tr>
        </table>
      `
    },
    {
      id: "technical-spec",
      name: "Technical Specification",
      description: "Detailed technical documentation for development projects",
      category: "Technical",
      icon: Code,
      color: "from-purple-500 to-pink-600",
      content: `
        <h1>Technical Specification</h1>
        <h2>Overview</h2>
        <p>Brief description of the technical solution.</p>
        
        <h2>Architecture</h2>
        <p>High-level system architecture and design patterns.</p>
        
        <h2>API Endpoints</h2>
        <table>
          <tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
          <tr><td>GET</td><td>/api/users</td><td>Retrieve user list</td></tr>
          <tr><td>POST</td><td>/api/users</td><td>Create new user</td></tr>
        </table>
        
        <h2>Database Schema</h2>
        <p>Entity relationship diagrams and table structures.</p>
        
        <h2>Security Considerations</h2>
        <ul>
          <li>Authentication method</li>
          <li>Data encryption</li>
          <li>Access controls</li>
        </ul>
      `
    },
    {
      id: "status-report",
      name: "Status Report",
      description: "Weekly/monthly project status report template",
      category: "Report",
      icon: Target,
      color: "from-yellow-500 to-orange-600",
      content: `
        <h1>Project Status Report</h1>
        <p><strong>Report Period:</strong> [Start Date] to [End Date]</p>
        <p><strong>Project:</strong> [Project Name]</p>
        <p><strong>Prepared by:</strong> [Name]</p>
        
        <h2>Executive Summary</h2>
        <p>Overall project health and key highlights.</p>
        
        <h2>Accomplishments</h2>
        <ul>
          <li>Achievement 1</li>
          <li>Achievement 2</li>
          <li>Achievement 3</li>
        </ul>
        
        <h2>Current Status</h2>
        <p><strong>Progress:</strong> [X]% complete</p>
        <p><strong>Budget:</strong> [X]% utilized</p>
        <p><strong>Timeline:</strong> On track / Delayed by [X] days</p>
        
        <h2>Upcoming Milestones</h2>
        <ul>
          <li>Milestone 1: [Date]</li>
          <li>Milestone 2: [Date]</li>
        </ul>
        
        <h2>Risks and Issues</h2>
        <p>Current risks and mitigation strategies.</p>
      `
    },
    {
      id: "user-guide",
      name: "User Guide",
      description: "Step-by-step user documentation and tutorials",
      category: "Documentation",
      icon: Bookmark,
      color: "from-teal-500 to-cyan-600",
      content: `
        <h1>User Guide</h1>
        <h2>Getting Started</h2>
        <p>Welcome to [Product Name]. This guide will help you get started quickly.</p>
        
        <h2>Prerequisites</h2>
        <ul>
          <li>Requirement 1</li>
          <li>Requirement 2</li>
          <li>Requirement 3</li>
        </ul>
        
        <h2>Installation</h2>
        <ol>
          <li>Step 1: Description</li>
          <li>Step 2: Description</li>
          <li>Step 3: Description</li>
        </ol>
        
        <h2>Basic Usage</h2>
        <h3>Feature 1</h3>
        <p>How to use feature 1 with screenshots and examples.</p>
        
        <h3>Feature 2</h3>
        <p>How to use feature 2 with step-by-step instructions.</p>
        
        <h2>Troubleshooting</h2>
        <p>Common issues and their solutions.</p>
        
        <h2>FAQ</h2>
        <p><strong>Q:</strong> Question 1?</p>
        <p><strong>A:</strong> Answer 1</p>
      `
    },
    {
      id: "creative-brief",
      name: "Creative Brief",
      description: "Creative project brief for design and marketing teams",
      category: "Creative",
      icon: Palette,
      color: "from-rose-500 to-pink-600",
      content: `
        <h1>Creative Brief</h1>
        <h2>Project Overview</h2>
        <p><strong>Project Name:</strong> [Name]</p>
        <p><strong>Client:</strong> [Client Name]</p>
        <p><strong>Timeline:</strong> [Start] - [End]</p>
        
        <h2>Objectives</h2>
        <p>What we want to achieve with this creative project.</p>
        
        <h2>Target Audience</h2>
        <p>Primary: [Description]</p>
        <p>Secondary: [Description]</p>
        
        <h2>Key Messages</h2>
        <ul>
          <li>Message 1</li>
          <li>Message 2</li>
          <li>Message 3</li>
        </ul>
        
        <h2>Design Guidelines</h2>
        <p><strong>Brand Colors:</strong> [Colors]</p>
        <p><strong>Typography:</strong> [Fonts]</p>
        <p><strong>Tone:</strong> [Voice and tone]</p>
        
        <h2>Deliverables</h2>
        <ul>
          <li>Deliverable 1</li>
          <li>Deliverable 2</li>
          <li>Deliverable 3</li>
        </ul>
      `
    }
  ];

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user?.email) setUserEmail(user.email);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        toast.error("Printing is disabled for security reasons.");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchProjects = async () => {
    try {
      const snapshot = await getDocs(collection(db, "projects"));
      const projectList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectList);
    } catch (error) {
      console.error("Error fetching projects:", error);
      // Mock data fallback
      setProjects([
        {
          id: "1",
          name: "AI Analytics Platform",
          description: "Advanced analytics dashboard with AI insights",
          color: "#00D4FF"
        },
        {
          id: "2",
          name: "Mobile Banking App",
          description: "Next-generation banking experience",
          color: "#FF6600"
        },
        {
          id: "3",
          name: "E-commerce Revolution",
          description: "Modern e-commerce platform",
          color: "#00D4FF"
        }
      ]);
    }
  };

  const fetchDocuments = async (projectId) => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "projectDocs"));
      const filtered = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((d) => d.projectId === projectId);
      setDocuments(filtered);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setSelectedDoc(null);
    setContent("");
    setDocTitle("");
    setPreviewMode(false);
    fetchDocuments(project.id);
  };

  const handleNewDocument = () => {
    setSelectedDoc(null);
    setContent("");
    setDocTitle("");
    setPreviewMode(false);
    setActiveTab("documents");
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setContent(template.content);
    setDocTitle(template.name);
    setPreviewMode(false);
    setActiveTab("documents");
    toast.success(`${template.name} template loaded! 🎯`);
  };

  const handleDocumentSelect = (doc) => {
    setSelectedDoc(doc);
    setContent(doc.htmlContent || "");
    setDocTitle(doc.title || "");
    setPreviewMode(true);
  };

  const saveDocument = async () => {
    if (!selectedProject || !content.trim() || !docTitle.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const docId = selectedDoc?.id || `${selectedProject.id}_${uuidv4()}`;
      const docRef = doc(db, "projectDocs", docId);
      const docData = {
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        title: docTitle,
        htmlContent: content,
        createdBy: userEmail,
        updatedAt: new Date().toISOString(),
        createdAt: selectedDoc?.createdAt || new Date().toISOString(),
        template: selectedTemplate?.id || null,
      };

      await setDoc(docRef, docData, { merge: true });
      toast.success("Document saved successfully! ��");
      setSelectedDoc({ id: docId, ...docData });
      fetchDocuments(selectedProject.id);
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedDoc) {
      toast.error("Please save the document first");
      return;
    }

    try {
      // Generate shareable link
      const shareLink = `${window.location.origin}/shared-doc/${selectedDoc.id}`;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareLink);
        toast.success("Share link copied to clipboard! 📋");
      } else {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = shareLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success("Share link copied! 📋");
      }
      
      setShowShareModal(false);
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to generate share link");
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    searchTerm
      ? doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.htmlContent?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const filteredTemplates = templates.filter(template =>
    docTypeFilter === "all" || 
    template.category.toLowerCase() === docTypeFilter.toLowerCase()
  );

  const filterContent = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Document Type
        </label>
        <select
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-purple-500/30 rounded-md bg-white dark:bg-black/95 text-gray-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={docTypeFilter}
          onChange={(e) => setDocTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="business">Business</option>
          <option value="meeting">Meeting</option>
          <option value="technical">Technical</option>
          <option value="report">Report</option>
          <option value="documentation">Documentation</option>
          <option value="creative">Creative</option>
        </select>
      </div>
    </div>
  );

  const tabs = [
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      active: activeTab === "documents",
    },
    {
      id: "templates",
      label: "Templates",
      icon: Layout,
      active: activeTab === "templates",
    },
  ];

  return (
    <div className="h-full bg-gradient-to-br from-cyan-100/95 to-orange-100/95 dark:bg-gradient-to-br dark:from-black/95 dark:to-black/90 flex flex-col">
      <PageHeader
        title="Creative Doc Studio"
        subtitle={selectedProject ? `• ${selectedProject.name}` : ""}
        status="Secure"
        statusColor="bg-green-100 text-green-700"
        tabs={tabs}
        onTabChange={setActiveTab}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search documents and templates..."
        showFilters={true}
        filterOpen={filterOpen}
        onFilterToggle={() => setFilterOpen(!filterOpen)}
        filterContent={filterContent}
        customActions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewDocument}
              disabled={!selectedProject}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-300 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              New Document
            </button>
            {selectedDoc && (
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Share className="w-4 h-4" />
                Share
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-hidden flex">
        {/* Enhanced Sidebar */}
        <div className="w-80 border-r border-gray-200 dark:border-purple-500/30 bg-white/80 dark:bg-black/95 backdrop-blur-xl flex flex-col">
          {/* Project Selection */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-purple-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Select Project
              </h2>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {projects.map((project) => (
                <motion.button
                  key={project.id}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleProjectSelect(project)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    selectedProject?.id === project.id
                      ? "border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 shadow-lg"
                      : "border-gray-200 dark:border-purple-500/30 hover:border-purple-300 dark:hover:border-purple-500/50 hover:bg-gray-50 dark:hover:bg-purple-500/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color || '#00D4FF' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {project.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Content List */}
          {selectedProject && (
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "documents" ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documents
                    </h3>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                      {filteredDocuments.length}
                    </span>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-3"></div>
                      <p className="text-gray-500">Loading documents...</p>
                    </div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No documents yet
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Create your first document or use a template
                      </p>
                      <button
                        onClick={() => setActiveTab("templates")}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Browse Templates →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredDocuments.map((doc) => (
                        <motion.div
                          key={doc.id}
                          whileHover={{ scale: 1.02, x: 4 }}
                          onClick={() => handleDocumentSelect(doc)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedDoc?.id === doc.id
                              ? "border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 shadow-lg"
                              : "border-gray-200 dark:border-purple-500/30 hover:border-purple-300 dark:hover:border-purple-500/50 hover:bg-gray-50 dark:hover:bg-purple-500/10"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                                {doc.title || "Untitled Document"}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <User className="w-3 h-3" />
                                {doc.createdBy}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="w-3 h-3" />
                                {new Date(doc.updatedAt).toLocaleDateString()}
                              </div>
                              {doc.template && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Layout className="w-3 h-3 text-purple-500" />
                                  <span className="text-xs text-purple-600 font-medium">Template</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Layout className="w-5 h-5" />
                      Templates
                    </h3>
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                      {filteredTemplates.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {filteredTemplates.map((template) => (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02, x: 4 }}
                        onClick={() => handleTemplateSelect(template)}
                        className="p-4 rounded-xl border-2 border-gray-200 dark:border-purple-500/30 hover:border-purple-300 dark:hover:border-purple-500/50 hover:bg-gray-50 dark:hover:bg-purple-500/10 cursor-pointer transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${template.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <template.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-purple-600 transition-colors">
                              {template.name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {template.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                {template.category}
                              </span>
                              <Sparkles className="w-3 h-3 text-yellow-500" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Main Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedProject ? (
            <>
              {/* Enhanced Editor Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-purple-500/30 bg-white/80 dark:bg-black/95 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Enter your document title..."
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="text-2xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none w-full placeholder-gray-400 focus:placeholder-gray-300"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm border-2 rounded-lg transition-all ${
                        previewMode 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {previewMode ? (
                        <>
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Preview
                        </>
                      )}
                    </button>
                    <button
                      onClick={saveDocument}
                      disabled={loading || !content.trim() || !docTitle.trim()}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 transition-all shadow-lg hover:shadow-xl"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span>Secure document</span>
                    </div>
                    {selectedTemplate && (
                      <div className="flex items-center gap-2">
                        <Layout className="w-4 h-4 text-purple-500" />
                        <span className="text-purple-600">From {selectedTemplate.name} template</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Auto-saved</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Editor Content */}
              <div className="flex-1 overflow-hidden">
                {previewMode ? (
                  <div
                    className="h-full overflow-y-auto p-8 bg-white dark:bg-gray-800 relative"
                    onContextMenu={(e) => e.preventDefault()}
                    onCopy={(e) => e.preventDefault()}
                    style={{ userSelect: "none" }}
                  >
                    {/* Enhanced Watermark */}
                    <div
                      className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center text-6xl font-bold text-gray-500 transform rotate-45"
                      style={{ zIndex: 1 }}
                    >
                      CONFIDENTIAL - {userEmail}
                    </div>
                    
                    {/* Enhanced Document Header */}
                    <div className="mb-8 pb-6 border-b-2 border-gray-200 dark:border-gray-700 relative z-10">
                      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        {docTitle || "Untitled Document"}
                      </h1>
                      <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          <span>Project: {selectedProject.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Author: {userEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Last updated: {new Date().toLocaleDateString()}</span>
                        </div>
                        {selectedTemplate && (
                          <div className="flex items-center gap-2">
                            <Layout className="w-4 h-4 text-purple-500" />
                            <span className="text-purple-600">Template: {selectedTemplate.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Document Content */}
                    <div
                      className="prose prose-lg max-w-none dark:prose-invert relative z-10"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  </div>
                ) : (
                  <div className="h-full p-6 bg-white dark:bg-gray-800">
                    <QuillEditor
                      value={content}
                      onChange={setContent}
                      className="h-full"
                      placeholder="Start writing your document or select a template to get started..."
                      modules={{
                        toolbar: [
                          [{ header: [1, 2, 3, 4, 5, 6, false] }],
                          ["bold", "italic", "underline", "strike"],
                          [{ color: [] }, { background: [] }],
                          [{ list: "ordered" }, { list: "bullet" }],
                          [{ indent: "-1" }, { indent: "+1" }],
                          [{ align: [] }],
                          ["blockquote", "code-block"],
                          ["link", "image"],
                          ["clean"],
                        ],
                      }}
                      formats={[
                        "header",
                        "bold",
                        "italic",
                        "underline",
                        "strike",
                        "color",
                        "background",
                        "list",
                        "bullet",
                        "indent",
                        "align",
                        "blockquote",
                        "code-block",
                        "link",
                        "image",
                      ]}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Welcome to Creative Doc Studio
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Choose a project from the sidebar to start creating amazing documents with our templates and tools
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    <span>Professional Templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Share className="w-4 h-4" />
                    <span>Easy Sharing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Secure Storage</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md liquid-glass-card shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Share className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Share Document
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Document Access
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="access"
                        checked={!shareSettings.public}
                        onChange={() => setShareSettings(prev => ({ ...prev, public: false }))}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="font-medium">Private</p>
                        <p className="text-xs text-gray-500">Only people with the link can view</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="access"
                        checked={shareSettings.public}
                        onChange={() => setShareSettings(prev => ({ ...prev, public: true }))}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="font-medium">Public</p>
                        <p className="text-xs text-gray-500">Anyone on the internet can view</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={shareSettings.allowComments}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, allowComments: e.target.checked }))}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Allow comments</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={shareSettings.allowDownload}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, allowDownload: e.target.checked }))}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Allow download</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectDocCreator;
