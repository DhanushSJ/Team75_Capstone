import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null); // "student", "admin", or "mentor"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [time, setTime] = useState(new Date());
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewSourceUrl, setPreviewSourceUrl] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  // Student states
  const [files, setFiles] = useState({});
  const [submissions, setSubmissions] = useState(null);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [deadline, setDeadline] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [fileTypes, setFileTypes] = useState([]); // Dynamic file types
  const [phases, setPhases] = useState([]); // Phases structure for progress calculation
  const [activePhaseReview, setActivePhaseReview] = useState(null); // Active phase/review from admin config
  const [teamProgress, setTeamProgress] = useState(null); // Team progress data
  const [teamDetails, setTeamDetails] = useState(null);
  const [pastSubmissions, setPastSubmissions] = useState(null);
  const [showPastSubmissions, setShowPastSubmissions] = useState(false);
  const [submittedFiles, setSubmittedFiles] = useState(new Set()); // Track submitted files per account
  
  // Dashboard tab state
  const [activeTab, setActiveTab] = useState("profile");
  
  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [clearedAnnouncements, setClearedAnnouncements] = useState([]);
  const [showClearAnnouncementsConfirm, setShowClearAnnouncementsConfirm] = useState(false);
  const [lastSeenPhaseReview, setLastSeenPhaseReview] = useState(null);
  const [phaseReviewChangeCount, setPhaseReviewChangeCount] = useState(0);

  // Admin states
  const [adminConfig, setAdminConfig] = useState(null);
  const [adminSubmissions, setAdminSubmissions] = useState(null);
  const [teams, setTeams] = useState({});
  const [editingTeam, setEditingTeam] = useState(null);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [selectedEditPhase, setSelectedEditPhase] = useState(null);
  const [selectedEditReview, setSelectedEditReview] = useState(null);
  const [showReviewNameModal, setShowReviewNameModal] = useState(false);
  const [reviewNameInput, setReviewNameInput] = useState("");
  const [showDeleteReviewConfirm, setShowDeleteReviewConfirm] = useState(false);
  const [deleteReviewData, setDeleteReviewData] = useState(null);
  const [showFileTypeModal, setShowFileTypeModal] = useState(false);
  const [fileTypeKey, setFileTypeKey] = useState("");
  const [fileTypeLabel, setFileTypeLabel] = useState("");
  const [phaseReviewHistory, setPhaseReviewHistory] = useState([]);
  const [editingLiveSubmission, setEditingLiveSubmission] = useState(null);
  const [showEditLiveSubmissionModal, setShowEditLiveSubmissionModal] = useState(false);
  const [showDeleteLiveSubmissionConfirm, setShowDeleteLiveSubmissionConfirm] = useState(false);
  const [liveSubmissionToDelete, setLiveSubmissionToDelete] = useState(null);
  const [boldDeliverables, setBoldDeliverables] = useState(new Set());
  const [newTeam, setNewTeam] = useState({
    teamId: "",
    teamName: "",
    members: "",
    projectTitle: "",
    contactEmail: "",
    status: "active",
    notes: "",
    mentorName: ""
  });
  
  // Admin announcements state
  const [adminAnnouncements, setAdminAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: ""
  });
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showDeleteAnnouncementConfirm, setShowDeleteAnnouncementConfirm] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [lastAnnouncementsViewTime, setLastAnnouncementsViewTime] = useState(() => {
    // Load from localStorage or default to current time
    const saved = localStorage.getItem('lastAnnouncementsViewTime');
    return saved ? parseInt(saved) : Date.now();
  });
  
  // Admin submissions editing state
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [showEditSubmissionModal, setShowEditSubmissionModal] = useState(false);
  const [newSubmission, setNewSubmission] = useState({
    team: "",
    submissionType: "ontime", // "ontime" or "late"
    files: [], // Array of File objects
    count: 0
  });
  
  // Admin logs state
  const [adminLogs, setAdminLogs] = useState([]);
  const [adminActiveSection, setAdminActiveSection] = useState("logs");
  const [showClearLogsConfirm, setShowClearLogsConfirm] = useState(false);
  const [selectedReportPhase, setSelectedReportPhase] = useState("");
  const [showReportLayoutModal, setShowReportLayoutModal] = useState(false);
  const [reportLayoutTitle, setReportLayoutTitle] = useState("");
  const [reportHeadings, setReportHeadings] = useState([]);
  const [newHeadingText, setNewHeadingText] = useState("");
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [reportFontSize, setReportFontSize] = useState("12");
  const [savedReportLayouts, setSavedReportLayouts] = useState([]);
  const [showDeleteLayoutConfirm, setShowDeleteLayoutConfirm] = useState(false);
  const [layoutToDelete, setLayoutToDelete] = useState(null);
  const [editingReportLayout, setEditingReportLayout] = useState(null);
  const [headerSuggestions, setHeaderSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSuggestionsForId, setShowSuggestionsForId] = useState(null);
  
  // Predefined header sections
  const predefinedHeaders = [
    "DECLARATION",
    "ACKNOWLEDGEMENT",
    "TABLE OF CONTENTS",
    "LIST OF FIGURES",
    "LIST OF TABLES",
    "INTRODUCTION",
    "PROBLEM STATEMENT",
    "ABSTRACT AND SCOPE",
    "RESEARCH / TECHNOLOGY GAP AND CHALLENGES",
    "OBJECTIVES",
    "LITERATURE SURVEY",
    "Overview of Datasets",
    "CONCLUSION OF CAPSTONE PROJECT PHASE - 1",
    "PLAN OF WORK FOR CAPSTONE PROJECT PHASE - 2",
    "REFERENCES/BIBLIOGRAPHY",
    "APPENDIX A DEFINITIONS, ACRONYMS, AND ABBREVIATIONS"
  ];

  // Function to get suggestions based on input
  const getHeaderSuggestions = (inputText, headingId) => {
    if (!inputText || inputText.trim().length === 0) {
      setHeaderSuggestions([]);
      setShowSuggestionsForId(null);
      return;
    }
    
    const searchText = inputText.toLowerCase().trim();
    const filtered = predefinedHeaders.filter(header =>
      header.toLowerCase().startsWith(searchText)
    );
    
    setHeaderSuggestions(filtered);
    setShowSuggestionsForId(headingId);
    setActiveSuggestionIndex(-1);
  };
  const adminTabs = [
    { key: "config", label: "Configuration" },
    { key: "reports", label: "Report Layout" },
    { key: "live", label: "Live Submission" },
    { key: "submissions", label: "Submission Overview" },
    { key: "teams", label: "Team Management" },
    { key: "announcements", label: "Announcements" },
    { key: "logs", label: "Admin Activity Logs" },
  ];
  
  // Mentor states
  const [mentorTeams, setMentorTeams] = useState({});
  const [selectedTeamSubmissions, setSelectedTeamSubmissions] = useState(null);
  const [showTeamSubmissionsModal, setShowTeamSubmissionsModal] = useState(false);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState("all"); // Phase filter for team submissions
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedSubmissionForEvaluation, setSelectedSubmissionForEvaluation] = useState(null);
  const [evaluationScores, setEvaluationScores] = useState({});
  const [reportLayouts, setReportLayouts] = useState([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState("");
  const [parsingResult, setParsingResult] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [loadingLayouts, setLoadingLayouts] = useState(false);
  const [showTechnicalSoundnessModal, setShowTechnicalSoundnessModal] = useState(false);
  
  // Evaluation criteria
  const evaluationCriteria = [
    'Parser Check',
    'Image Check',
    'Quality Check',
    'Novelty',
    'Technical Soundness',
  ];
  
  const scoreOptions = Array.from({ length: 10 }, (_, index) => index + 1);
  
  // Chatbot states
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatContainerRef = useRef(null);

  // Login page modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const previewObjectUrlRef = useRef(null);
  const actionButtonsRef = useRef(null);
  const isValidEmail = (value) =>
    !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const formatTimestamp = (value, fallback = "N/A") => {
    if (!value) return fallback;
    const date =
      value instanceof Date
        ? value
        : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : null;
    if (!date || Number.isNaN(date.getTime())) {
      return fallback;
    }
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatPhaseLabel = (phaseName) => {
    if (!phaseName) return "phase-?";
    const numberMatch = phaseName.match(/\d+/);
    if (numberMatch) {
      return `phase-${numberMatch[0]}`;
    }
    return `phase-${phaseName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9-]/g, "")}`;
  };

  const formatReviewLabel = (reviewName) => {
    if (!reviewName) return "review-?";
    const numberMatch = reviewName.match(/\d+/);
    if (numberMatch) {
      return `review-${numberMatch[0]}`;
    }
    const cleaned = reviewName.replace(/review/i, "").trim();
    if (cleaned) {
      return `review-${cleaned.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9-]/g, "")}`;
    }
    return `review-${reviewName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9-]/g, "")}`;
  };

  const resolveFileUrl = (file) => {
    if (!file) return null;
    const path = file.viewUrl || file.url;
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `http://localhost:5000${path}`;
  };

  const buildPreviewTitle = (file) => {
    if (!file) return "Document Preview";
    const label = file.typeLabel || file.fieldName || "File";
    return file.filename ? `${label}: ${file.filename}` : label;
  };

  const closePreview = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setPreviewUrl(null);
    setPreviewSourceUrl(null);
    setPreviewLoading(false);
    setPreviewError(null);
    setPreviewTitle("");
    setIsPreviewVisible(false);
    setPreviewFile(null);
  };

  const handlePreviewFile = async (file) => {
    setPreviewFile(file || null);
    const sourceUrl = resolveFileUrl(file);
    if (!sourceUrl) {
      setPreviewError("Preview unavailable for this file.");
      setIsPreviewVisible(true);
      return;
    }

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }

    setPreviewTitle(buildPreviewTitle(file));
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewSourceUrl(sourceUrl);
    setIsPreviewVisible(true);
    setPreviewUrl(null);

    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Preview request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const effectiveMime =
        file?.mimetype ||
        blob.type ||
        response.headers.get("Content-Type") ||
        "";
      const isPreviewable =
        typeof effectiveMime === "string" &&
        (effectiveMime.startsWith("application/pdf") ||
          effectiveMime.startsWith("image/"));

      if (!isPreviewable) {
        setPreviewError(
          "Preview is available for PDFs and images only. Please use Download to open this file."
        );
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      previewObjectUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
    } catch (error) {
      console.error("Failed to preview file", error);
      setPreviewError("Unable to preview this file. Please use Download instead.");
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    };
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Load chat history when user logs in
  useEffect(() => {
    if (loggedIn && username) {
      const storageKey = `chatHistory:${username}`;
      try {
        const savedHistory = localStorage.getItem(storageKey);
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          setChatMessages(parsedHistory);
        } else {
          setChatMessages([]);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        setChatMessages([]);
      }
    } else {
      // Clear messages when logged out
      setChatMessages([]);
    }
  }, [loggedIn, username]);

  // Handle sticky buttons scroll behavior
  useEffect(() => {
    let initialLeft = null;
    let initialWidth = null;
    let initialTop = null;
    let wasAbsolute = false;
    
    const handleScroll = () => {
      if (actionButtonsRef.current) {
        const rect = actionButtonsRef.current.getBoundingClientRect();
        const scrollContainer = document.querySelector('[data-left-panel]');
        
        // Check if buttons are 20px from the top (within the scroll container)
        let shouldBeAbsolute = false;
        let containerRect = null;
        let distanceFromTop = 0;
        
        if (scrollContainer) {
          containerRect = scrollContainer.getBoundingClientRect();
          // Calculate distance from top of scroll container
          distanceFromTop = rect.top - containerRect.top;
          // Switch to absolute when 20px from top
          shouldBeAbsolute = distanceFromTop <= 20;
        } else {
          distanceFromTop = rect.top;
          shouldBeAbsolute = distanceFromTop <= 20;
        }
        
        if (shouldBeAbsolute && !wasAbsolute) {
          // Store initial position when first switching to absolute
          initialLeft = rect.left - (scrollContainer ? containerRect.left : 0);
          initialWidth = rect.width;
          // Store the scroll position when switching
          initialTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
        }
        
        if (shouldBeAbsolute) {
          // Switch to absolute positioning
          if (scrollContainer) {
            const currentScrollTop = scrollContainer.scrollTop;
            // Position absolute - keep buttons at 20px from top of scroll container
            // The top value should be relative to the scroll container's content
            actionButtonsRef.current.style.position = "absolute";
            actionButtonsRef.current.style.top = `${currentScrollTop + 20}px`;
            // Maintain left position - calculate relative to scroll container
            if (initialLeft === null) {
              initialLeft = rect.left - containerRect.left;
            }
            actionButtonsRef.current.style.left = `${initialLeft}px`;
            if (initialWidth === null) {
              initialWidth = rect.width;
            }
            actionButtonsRef.current.style.width = `${initialWidth}px`;
          } else {
            actionButtonsRef.current.style.position = "absolute";
            actionButtonsRef.current.style.top = `${window.scrollY + 20}px`;
            if (initialLeft === null) {
              initialLeft = rect.left;
            }
            actionButtonsRef.current.style.left = `${initialLeft}px`;
            if (initialWidth === null) {
              initialWidth = rect.width;
            }
            actionButtonsRef.current.style.width = `${initialWidth}px`;
          }
          actionButtonsRef.current.style.backgroundColor = "transparent";
          actionButtonsRef.current.style.boxShadow = "none";
          actionButtonsRef.current.style.zIndex = "1000";
          actionButtonsRef.current.style.visibility = "visible";
          actionButtonsRef.current.style.opacity = "1";
          wasAbsolute = true;
        } else {
          // Return to sticky positioning
          actionButtonsRef.current.style.position = "sticky";
          actionButtonsRef.current.style.top = "0px";
          actionButtonsRef.current.style.left = "auto";
          actionButtonsRef.current.style.width = "100%";
          actionButtonsRef.current.style.backgroundColor = "transparent";
          actionButtonsRef.current.style.boxShadow = "none";
          wasAbsolute = false;
          initialLeft = null;
          initialWidth = null;
          initialTop = null;
        }
      }
    };

    // Find the scrolling container
    const scrollContainer = document.querySelector('[data-left-panel]');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // Initial check
      
      // Also listen to resize events in case container size changes
      window.addEventListener('resize', handleScroll, { passive: true });
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    } else {
      // Fallback to window if container not found
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll, { passive: true });
      handleScroll();
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, []);

  // Fetch report layouts when evaluation modal opens
  useEffect(() => {
    if (showEvaluationModal && userType === "mentor") {
      console.log("Evaluation modal opened, fetching report layouts...");
      setLoadingLayouts(true);
      const fetchMentorReportLayouts = async () => {
        try {
          console.log("Fetching report layouts from:", "http://localhost:5000/mentor/report-layouts");
          const res = await fetch("http://localhost:5000/mentor/report-layouts");
          console.log("Response status:", res.status, res.statusText);
          if (!res.ok) {
            console.error(`Failed to fetch report layouts: HTTP ${res.status}`);
            setReportLayouts([]);
            setLoadingLayouts(false);
            return;
          }
          const data = await res.json();
          console.log("Report layouts response:", JSON.stringify(data, null, 2));
          if (data.success && Array.isArray(data.layouts)) {
            console.log(`Setting ${data.layouts.length} report layouts to state`);
            console.log("Layouts data:", data.layouts.map(l => ({ id: l.id, title: l.title, phase: l.phase })));
            setReportLayouts(data.layouts);
            console.log("Report layouts state should now be:", data.layouts.length > 0 ? `${data.layouts.length} layouts` : "empty");
          } else {
            console.error("Invalid response format. Expected data.success=true and data.layouts=array");
            console.error("Actual data:", data);
            setReportLayouts([]);
          }
          setLoadingLayouts(false);
        } catch (e) {
          console.error("Failed to fetch report layouts", e);
          setReportLayouts([]);
          setLoadingLayouts(false);
        }
      };
      fetchMentorReportLayouts();
    } else if (!showEvaluationModal) {
      // Reset states when modal closes
      setSelectedLayoutId("");
      setParsingResult(null);
      setLoadingLayouts(false);
    }
  }, [showEvaluationModal, userType]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (loggedIn && username && chatMessages.length > 0) {
      const storageKey = `chatHistory:${username}`;
      try {
        // Filter out loading messages before saving
        const messagesToSave = chatMessages.filter(msg => !msg.loading);
        localStorage.setItem(storageKey, JSON.stringify(messagesToSave));
      } catch (error) {
        console.error("Error saving chat history:", error);
      }
    }
  }, [chatMessages, loggedIn, username]);

  // Magnetic cursor effect for student dashboard
  useEffect(() => {
    if (!loggedIn || userType !== "student") return;
    
    const handleMouseMove = (e) => {
      const particles = document.querySelectorAll('.magnetic-particles');
      particles.forEach((particle, index) => {
        const rect = particle.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = (e.clientX - centerX) * 0.02;
        const deltaY = (e.clientY - centerY) * 0.02;
        
        particle.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      });
    };

    const handleMouseLeave = () => {
      const particles = document.querySelectorAll('.magnetic-particles');
      particles.forEach(particle => {
        particle.style.transform = 'translate(0, 0)';
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [loggedIn, userType]);

  // Keyboard shortcuts for login page
  useEffect(() => {
    if (!loggedIn) {
      const handleKeyPress = (e) => {
        // ESC to close login modal
        if (e.key === 'Escape' && showLoginModal) {
          setShowLoginModal(false);
        }
      };
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [loggedIn, showLoginModal]);

  // Fetch deadline and file types when student logs in - fetch from admin config to match admin settings
  useEffect(() => {
    if (!loggedIn || userType !== "student") return;
    
    const fetchDeadlineAndTypes = async () => {
      try {
        // Fetch from admin/config to ensure it matches what admin sets
        const res = await fetch("http://localhost:5000/admin/config");
        const data = await res.json();
        
        // Only set deadline and fileTypes if there's an active phase/review
        if (data && data.activePhaseReview) {
          if (data.deadline) setDeadline(data.deadline);
          else setDeadline(null);
          
          if (data.fileTypes) {
            // Always update to ensure UI reflects latest admin changes
            setFileTypes(data.fileTypes || []);
          } else {
            setFileTypes([]);
          }
        } else {
          // No active phase/review - clear everything
          setDeadline(null);
          setFileTypes([]);
        }
      } catch (e) {
        console.error("Failed to fetch deadline/fileTypes", e);
        // Fallback to submissions endpoint
        try {
          const res = await fetch("http://localhost:5000/submissions");
          const data = await res.json();
          // Only set if there's an active phase/review
          if (data && data.activePhaseReview) {
            if (data.deadline) setDeadline(data.deadline);
            else setDeadline(null);
            if (data.fileTypes) {
              setFileTypes(data.fileTypes || []);
            } else {
              setFileTypes([]);
            }
          } else {
            setDeadline(null);
            setFileTypes([]);
          }
        } catch (e2) {
          console.error("Failed to fetch from submissions endpoint", e2);
        }
      }
    };
    
    const fetchPhases = async () => {
      try {
        const res = await fetch("http://localhost:5000/admin/config");
        const data = await res.json();
        if (data && data.phases) setPhases(data.phases || []);
        if (data && data.activePhaseReview) {
          const newPhaseReview = data.activePhaseReview;
          
          // Check if phase/review has changed
          if (userType === "student") {
            if (!lastSeenPhaseReview) {
              // First time - set as last seen
              setLastSeenPhaseReview(newPhaseReview);
              if (username) {
                localStorage.setItem(`lastSeenPhaseReview_${username}`, JSON.stringify(newPhaseReview));
              }
            } else {
              const oldKey = `${lastSeenPhaseReview.phaseName || lastSeenPhaseReview.phase}_${lastSeenPhaseReview.reviewName || lastSeenPhaseReview.review}`;
              const newKey = `${newPhaseReview.phaseName || newPhaseReview.phase}_${newPhaseReview.reviewName || newPhaseReview.review}`;
              
              if (oldKey !== newKey) {
                // Phase/review has changed - show notification
                setPhaseReviewChangeCount(prev => prev + 1);
                // Browser notifications disabled
                // if (typeof Notification !== "undefined") {
                //   if (Notification.permission === "granted") {
                //     new Notification("Phase/Review Updated", {
                //       body: `New phase: ${newPhaseReview.phaseName || newPhaseReview.phase}, Review: ${newPhaseReview.reviewName || newPhaseReview.review}`,
                //       icon: "/clgL.png"
                //     });
                //   } else if (Notification.permission !== "denied") {
                //     Notification.requestPermission().then(permission => {
                //       if (permission === "granted") {
                //         new Notification("Phase/Review Updated", {
                //           body: `New phase: ${newPhaseReview.phaseName || newPhaseReview.phase}, Review: ${newPhaseReview.reviewName || newPhaseReview.review}`,
                //           icon: "/clgL.png"
                //         });
                //       }
                //     });
                //   }
                // }
              }
            }
          }
          
          setActivePhaseReview(newPhaseReview);
        } else {
          // Clear active phase/review if it was deleted
          setActivePhaseReview(null);
          if (userType === "student" && activePhaseReview) {
            // Phase/review was cleared - reset last seen
            setLastSeenPhaseReview(null);
            if (username) {
              localStorage.removeItem(`lastSeenPhaseReview_${username}`);
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch phases", e);
      }
    };
    
    const fetchTeamProgress = async () => {
      if (!username) return;
      try {
        const res = await fetch(`http://localhost:5000/team/progress/${username}`);
        const data = await res.json();
        if (data && data.success) {
          setTeamProgress(data);
        }
      } catch (e) {
        console.error("Failed to fetch team progress", e);
      }
    };
    
    fetchDeadlineAndTypes();
    fetchPhases();
    fetchTeamProgress();
    
    // Set up periodic refresh every 10 seconds to get updated file types and config from admin (more frequent for better UX)
    const interval = setInterval(() => {
      fetchDeadlineAndTypes();
      fetchPhases();
      fetchTeamProgress();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [loggedIn, userType, username]);

  // Auto-fetch submissions when View All tab is active
  useEffect(() => {
    if (!loggedIn || userType !== "student") return;
    if (activeTab === "viewAll") {
      // Always fetch to ensure fresh data when tab becomes active
      fetchAllSubmissions();
      
      // Set up periodic refresh every 10 seconds while tab is active
      const interval = setInterval(() => {
        fetchAllSubmissions();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [activeTab, loggedIn, userType]);

  // Refetch file types when submissions tab becomes active - ensure it matches admin config
  useEffect(() => {
    if (!loggedIn || userType !== "student" || activeTab !== "submissions") return;
    
    const fetchFileTypes = async () => {
      try {
        // Fetch from admin/config to ensure it matches what admin sets
        const res = await fetch("http://localhost:5000/admin/config");
        const data = await res.json();
        if (data && data.fileTypes) {
          // Always update to ensure UI reflects latest admin changes
          setFileTypes(data.fileTypes || []);
        }
      } catch (e) {
        console.error("Failed to fetch file types", e);
        // Fallback to submissions endpoint
        try {
          const res = await fetch("http://localhost:5000/submissions");
          const data = await res.json();
          if (data && data.fileTypes) {
            setFileTypes(data.fileTypes || []);
          }
        } catch (e2) {
          console.error("Failed to fetch from submissions endpoint", e2);
        }
      }
    };
    
    fetchFileTypes();
    
    // Set up more frequent refresh when tab is active (every 5 seconds)
    const interval = setInterval(() => {
      fetchFileTypes();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeTab, loggedIn, userType]);

  // Initialize files object when file types are loaded or updated
  useEffect(() => {
    if (fileTypes.length > 0) {
      setFiles(prevFiles => {
        const updatedFiles = { ...prevFiles };
        // Add new file types if they don't exist, preserve existing files
        fileTypes.forEach(ft => {
          if (!(ft.key in updatedFiles)) {
            updatedFiles[ft.key] = null;
          }
        });
        // Remove file types that no longer exist (optional - keep for backward compatibility)
        // Object.keys(updatedFiles).forEach(key => {
        //   if (!fileTypes.some(ft => ft.key === key)) {
        //     delete updatedFiles[key];
        //   }
        // });
        return updatedFiles;
      });
    }
  }, [fileTypes]);

  // Fetch team details for student
  useEffect(() => {
    if (!loggedIn || userType !== "student" || !username) return;
    const fetchTeamDetails = async () => {
      try {
        const res = await fetch(`http://localhost:5000/teams/${username}`);
        const data = await res.json();
        if (data && data.team) setTeamDetails(data.team);
      } catch (e) {
        console.error("Failed to fetch team details", e);
      }
    };
    fetchTeamDetails();
  }, [loggedIn, userType, username]);

  // Refetch past submissions when fileTypes or phases change to update progress
  useEffect(() => {
    if (!loggedIn || userType !== "student" || !username) return;
    const fetchPastSubmissions = async () => {
      try {
        const res = await fetch(`http://localhost:5000/submissions/${username}`);
        const data = await res.json();
        if (data && data.success) {
          setPastSubmissions(data);
          
          const currentPhaseName = activePhaseReview?.phaseName || null;
          const currentReviewName = activePhaseReview?.reviewName || null;
          const submittedFileKeys = new Set();
          let hasCurrentReviewSubmission = false;

          if (data.submissions && Array.isArray(data.submissions)) {
            data.submissions.forEach((submission) => {
              const matchesActiveReview =
                currentPhaseName &&
                currentReviewName &&
                submission.phase === currentPhaseName &&
                submission.review === currentReviewName;

              if (matchesActiveReview) {
                hasCurrentReviewSubmission = true;
                if (submission.files && Array.isArray(submission.files)) {
                  submission.files.forEach((file) => {
                    const fileKey =
                      (file && typeof file === "object" && file.fieldName) ||
                      (typeof file === "string"
                        ? file.match(/^([^_]+)_/)?.[1]
                        : file?.filename?.match(/^([^_]+)_/)?.[1]) ||
                      null;
                    if (fileKey) {
                      submittedFileKeys.add(fileKey);
                    }
                  });
                }
              }
            });
          }

          if (
            hasCurrentReviewSubmission &&
            phases &&
            phases.length > 0 &&
            currentPhaseName &&
            currentReviewName
          ) {
            const phase = phases.find((p) => p.phaseName === currentPhaseName);
            const review = phase?.reviews?.find(
              (r) => r.reviewName === currentReviewName
            );
            review?.documents?.forEach((doc) => {
              if (doc?.key) submittedFileKeys.add(doc.key);
            });
          }

          setSubmittedFiles(submittedFileKeys);
          setHasSubmitted(hasCurrentReviewSubmission);
        } else {
          // If no success response, reset submission state
          setHasSubmitted(false);
          setSubmittedFiles(new Set());
        }
      } catch (e) {
        console.error("Failed to fetch past submissions", e);
        // On error, don't reset - keep existing state
      }
    };
    fetchPastSubmissions();
    
    // Set up periodic refresh every 30 seconds to update progress when admin changes config
    const interval = setInterval(() => {
      fetchPastSubmissions();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loggedIn, userType, username, phases, fileTypes, activePhaseReview]);

  // Fetch announcements for students and mentors with periodic polling
  useEffect(() => {
    if (!loggedIn || (userType !== "student" && userType !== "mentor")) return;
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch("http://localhost:5000/announcements");
        if (!res.ok) {
          console.error("Failed to fetch announcements: HTTP", res.status);
          return;
        }
        const data = await res.json();
        if (data && data.announcements) {
          console.log("Fetched announcements:", data.announcements.length);
          setAnnouncements(data.announcements);
        } else {
          console.warn("No announcements in response:", data);
        }
      } catch (e) {
        console.error("Failed to fetch announcements", e);
      }
    };
    
    // Fetch immediately
    fetchAnnouncements();
    
    // Poll every 30 seconds for new announcements
    const interval = setInterval(fetchAnnouncements, 30000);
    
    return () => clearInterval(interval);
  }, [loggedIn, userType]);

  // Sync cleared announcements when username changes
  useEffect(() => {
    if (username) {
      try {
        const saved = localStorage.getItem(`clearedAnnouncements_${username}`);
        if (saved) {
          setClearedAnnouncements(JSON.parse(saved));
        } else {
          setClearedAnnouncements([]);
        }
        
        // Load last seen phase/review
        const savedPhaseReview = localStorage.getItem(`lastSeenPhaseReview_${username}`);
        if (savedPhaseReview) {
          setLastSeenPhaseReview(JSON.parse(savedPhaseReview));
        }
        
        // Load phase review change count
        const savedCount = localStorage.getItem(`phaseReviewChangeCount_${username}`);
        if (savedCount) {
          setPhaseReviewChangeCount(parseInt(savedCount) || 0);
        }
      } catch (e) {
        setClearedAnnouncements([]);
      }
    }
  }, [username]);
  
  // Save last seen phase/review when it changes and user views announcements
  useEffect(() => {
    if (username && activePhaseReview && activeTab === "announcements") {
      const currentKey = `${activePhaseReview.phaseName || activePhaseReview.phase}_${activePhaseReview.reviewName || activePhaseReview.review}`;
      const lastKey = lastSeenPhaseReview ? `${lastSeenPhaseReview.phaseName || lastSeenPhaseReview.phase}_${lastSeenPhaseReview.reviewName || lastSeenPhaseReview.review}` : null;
      
      if (currentKey !== lastKey) {
        setLastSeenPhaseReview(activePhaseReview);
        localStorage.setItem(`lastSeenPhaseReview_${username}`, JSON.stringify(activePhaseReview));
        setPhaseReviewChangeCount(0);
        localStorage.setItem(`phaseReviewChangeCount_${username}`, "0");
      }
    }
  }, [activeTab, activePhaseReview, username, lastSeenPhaseReview]);
  
  // Save phase review change count
  useEffect(() => {
    if (username) {
      localStorage.setItem(`phaseReviewChangeCount_${username}`, phaseReviewChangeCount.toString());
    }
  }, [phaseReviewChangeCount, username]);

  // Function to clear an announcement from user's view
  const handleConfirmClearAllAnnouncements = () => {
    const allIds = visibleAnnouncements.map(ann => ann.id || ann._id || JSON.stringify(ann));
    const newCleared = [...clearedAnnouncements, ...allIds];
    setClearedAnnouncements(newCleared);
    try {
      localStorage.setItem(`clearedAnnouncements_${username}`, JSON.stringify(newCleared));
    } catch (e) {
      console.error("Failed to save cleared announcements", e);
    }
    setNotification({ show: true, message: "Cleared announcements", type: "success" });
    setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
    setShowClearAnnouncementsConfirm(false);
  };

  const handleClearAnnouncement = (announcementId) => {
    if (!username) return;
    
    const newCleared = [...clearedAnnouncements, announcementId];
    setClearedAnnouncements(newCleared);
    
    try {
      localStorage.setItem(`clearedAnnouncements_${username}`, JSON.stringify(newCleared));
    } catch (e) {
      console.error("Failed to save cleared announcements", e);
    }
  };

  // Filter out cleared announcements
  const visibleAnnouncements = announcements.filter(ann => {
    const annId = ann.id || ann._id || JSON.stringify(ann);
    return !clearedAnnouncements.includes(annId);
  });

  // Admin: Fetch config on login
  useEffect(() => {
    if (!loggedIn || userType !== "admin") return;
    fetchAdminConfig();
    fetchAdminSubmissions();
    fetchAdminTeams();
    fetchAdminAnnouncements();
    fetchAdminLogs();
    fetchReportLayouts();
    // Load saved phase/review selection from localStorage
    try {
      const savedPhase = localStorage.getItem('adminSelectedPhase');
      const savedReview = localStorage.getItem('adminSelectedReview');
      if (savedPhase !== null) {
        setSelectedEditPhase(parseInt(savedPhase));
      }
      if (savedReview !== null) {
        setSelectedEditReview(parseInt(savedReview));
      }
    } catch (e) {
      console.error("Failed to load phase/review selection from localStorage", e);
    }
    // Load phase/review history from localStorage
    try {
      const savedHistory = localStorage.getItem('adminPhaseReviewHistory');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setPhaseReviewHistory(parsedHistory);
      }
    } catch (e) {
      console.error("Failed to load phase/review history from localStorage", e);
    }
  }, [loggedIn, userType]);

  // Save phase/review selection to localStorage when they change
  useEffect(() => {
    if (userType === "admin") {
      try {
        if (selectedEditPhase !== null) {
          localStorage.setItem('adminSelectedPhase', selectedEditPhase.toString());
        } else {
          localStorage.removeItem('adminSelectedPhase');
        }
        if (selectedEditReview !== null) {
          localStorage.setItem('adminSelectedReview', selectedEditReview.toString());
        } else {
          localStorage.removeItem('adminSelectedReview');
        }
      } catch (e) {
        console.error("Failed to save phase/review selection to localStorage", e);
      }
    }
  }, [selectedEditPhase, selectedEditReview, userType]);

  // Mentor: Fetch teams on login
  useEffect(() => {
    if (!loggedIn || userType !== "mentor" || !username) return;
    fetchMentorTeams();
  }, [loggedIn, userType, username]);

  // Login validation
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Try admin login first
    if (username === "admin") {
      try {
        const res = await fetch("http://localhost:5000/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        
        let data;
        try {
          data = await res.json();
        } catch (jsonError) {
          console.error("Failed to parse JSON response:", jsonError);
          alert("Server error: Invalid response format. Please check if the backend server is running.");
          return false;
        }
        
        if (res.ok && data.success) {
          setLoggedIn(true);
          setUserType("admin");
          setAdminActiveSection("config"); // Always start on Configuration tab
          setShowLoginModal(false);
          return true;
        } else {
          // Admin login failed, show error and stop
          alert(data.message || "Invalid admin credentials!");
          return false;
        }
      } catch (e) {
        console.error("Admin login error", e);
        if (e.message && e.message.includes("Failed to fetch")) {
          alert("Cannot connect to server. Please make sure the backend server is running on http://localhost:5000");
        } else {
          alert("Login error. Please try again.");
        }
        return false;
      }
    }

    // Try mentor login (try for any username not matching other patterns)
    if (username !== "admin" && username.split("_").length !== 2) {
      try {
        const res = await fetch("http://localhost:5000/mentor/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        
        let data;
        try {
          data = await res.json();
        } catch (jsonError) {
          console.error("Failed to parse JSON response:", jsonError);
          alert("Server error: Invalid response format. Please check if the backend server is running.");
          return false;
        }
        
        if (res.ok && data.success) {
          setLoggedIn(true);
          setUserType("mentor");
          setShowLoginModal(false);
          return true;
        } else {
          // Mentor login failed, show error and stop (don't try student login)
          alert(data.message || "Invalid mentor credentials!");
          return false;
        }
      } catch (e) {
        console.error("Mentor login error", e);
        if (e.message && e.message.includes("Failed to fetch")) {
          alert("Cannot connect to server. Please make sure the backend server is running on http://localhost:5000");
        } else {
          alert("Login error. Please try again.");
        }
        return false;
      }
    }

    // Try student login (only for usernames with underscore format: TeamNo_PassoutYear)
    if (username.split("_").length === 2) {
      try {
        const res = await fetch("http://localhost:5000/student/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        
        let data;
        try {
          data = await res.json();
        } catch (jsonError) {
          console.error("Failed to parse JSON response:", jsonError);
          alert("Server error: Invalid response format. Please check if the backend server is running.");
          return false;
        }
        
        if (res.ok && data.success) {
          setLoggedIn(true);
          setUserType("student");
          setActiveTab("profile"); // Ensure student portal opens in profile tab
          setShowLoginModal(false);
          return true;
        } else {
          // Student login failed, show error
          alert(data.message || "Invalid student credentials!");
          return false;
        }
      } catch (e) {
        console.error("Student login error", e);
        if (e.message && e.message.includes("Failed to fetch")) {
          alert("Cannot connect to server. Please make sure the backend server is running on http://localhost:5000");
        } else {
          alert("Login error. Please try again.");
        }
        return false;
      }
    }
    
    // If username format doesn't match any pattern
    alert("Invalid username format!\n\nAdmin: admin / admin123\nMentor: mentor/richa/anime / [name]123\nStudent: 001_2024 / 1234");
    return false;
  };

  // Logout handler - clears chat history and resets state
  const handleLogout = () => {
    // Clear chat history and submitted files on logout
    if (username) {
      try {
        localStorage.removeItem(`chatHistory:${username}`);
      } catch (error) {
        console.error("Error clearing user data:", error);
      }
    }
    // Reset all state
    setLoggedIn(false);
    setUserType(null);
    setUsername("");
    setPassword("");
    setChatMessages([]);
    setChatInput("");
    setShowChatbot(false);
    setSubmittedFiles(new Set());
  };
  const fetchAdminConfig = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/config");
      const data = await res.json();
      setAdminConfig(data);
    } catch (e) {
      console.error("Failed to fetch admin config", e);
    }
  };

  const fetchAdminSubmissions = async () => {
    try {
      const res = await fetch("http://localhost:5000/submissions");
      const data = await res.json();
      setAdminSubmissions(data);
    } catch (e) {
      console.error("Failed to fetch admin submissions", e);
    }
  };

  const fetchAdminTeams = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/teams");
      const data = await res.json();
      if (data.success) setTeams(data.teams || {});
    } catch (e) {
      console.error("Failed to fetch teams", e);
    }
  };

  const fetchAdminAnnouncements = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/announcements");
      const data = await res.json();
      if (data.success) setAdminAnnouncements(data.announcements || []);
    } catch (e) {
      console.error("Failed to fetch announcements", e);
    }
  };

  const handleClearAdminLogs = () => {
    setShowClearLogsConfirm(true);
  };

  const handleConfirmClearAdminLogs = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/logs", {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminLogs([]);
        setNotification({ show: true, message: "Logs cleared", type: "success" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
      } else {
        setNotification({ show: true, message: data.error || "Failed to clear logs", type: "error" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
      }
    } catch (e) {
      console.error("Failed to clear admin logs", e);
      setNotification({ show: true, message: "Failed to clear admin logs", type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
    }
    
    setShowClearLogsConfirm(false);
  };

  const fetchAdminLogs = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/logs");
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setAdminLogs(data.logs);
      } else {
        setAdminLogs([]);
      }
    } catch (e) {
      console.error("Failed to fetch admin logs", e);
      setAdminLogs([]);
    }
  };

  const handleConfirmDeleteLayout = async () => {
    if (!layoutToDelete) return;
    
    try {
      const res = await fetch(`http://localhost:5000/admin/report-layouts/${layoutToDelete.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      
      if (data.success) {
        setNotification({ show: true, message: "Submission deleted", type: "error" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
        await fetchReportLayouts();
        addAdminLog("Deleted report layout", {
          title: layoutToDelete.title,
          phase: layoutToDelete.phase
        });
      } else {
        setNotification({ show: true, message: `Failed to delete report layout: ${data.error || "Unknown error"}`, type: "error" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
      }
    } catch (e) {
      console.error("Failed to delete report layout", e);
      setNotification({ show: true, message: "Failed to delete report layout. Please try again.", type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
    }
    
    setShowDeleteLayoutConfirm(false);
    setLayoutToDelete(null);
  };

  const fetchReportLayouts = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin/report-layouts");
      if (!res.ok) {
        console.error(`Failed to fetch report layouts: HTTP ${res.status}`);
        setSavedReportLayouts([]);
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.layouts)) {
        setSavedReportLayouts(data.layouts);
      } else {
        console.error("Invalid response format:", data);
        setSavedReportLayouts([]);
      }
    } catch (e) {
      console.error("Failed to fetch report layouts", e);
      if (e.message && (e.message.includes("Failed to fetch") || e.message.includes("NetworkError"))) {
        console.error("Backend server may not be running on http://localhost:5000");
      }
      setSavedReportLayouts([]);
    }
  };

  // Admin logging function
  const addAdminLog = async (action, details = {}) => {
    const timestamp = new Date().toISOString();
    try {
      const res = await fetch("http://localhost:5000/admin/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, details, timestamp })
      });
      const data = await res.json();
      if (res.ok && data.success && data.log) {
        setAdminLogs(prev => {
          const newLogs = [data.log, ...prev];
          return newLogs.length > 1000 ? newLogs.slice(0, 1000) : newLogs;
        });
      } else {
        console.error("Failed to store admin log:", data);
      }
    } catch (e) {
      console.error("Failed to store admin log:", e);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      setNotification({ show: true, message: "Title and content are required!", type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAnnouncement)
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ show: true, message: "Announcement made", type: "success" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
        setShowAnnouncementModal(false);
        setNewAnnouncement({ title: "", content: "" });
        fetchAdminAnnouncements();
      } else {
        setNotification({ show: true, message: data.message || "Failed to save announcement", type: "error" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
      }
    } catch (e) {
      console.error("Failed to save announcement", e);
      setNotification({ show: true, message: "Failed to save announcement", type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
    }
  };

  const handleDeleteAnnouncement = (id) => {
    const announcement = adminAnnouncements.find(a => (a.id || a._id) === id);
    setAnnouncementToDelete({ id, announcement });
    setShowDeleteAnnouncementConfirm(true);
  };

  const handleConfirmDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    
    try {
      const res = await fetch(`http://localhost:5000/admin/announcements/${announcementToDelete.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ show: true, message: "Announcement deleted", type: "error" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
        fetchAdminAnnouncements();
      } else {
        setNotification({ show: true, message: data.message || "Failed to delete announcement", type: "error" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
      }
    } catch (e) {
      console.error("Failed to delete announcement", e);
      setNotification({ show: true, message: "Failed to delete announcement", type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
    }
    
    setShowDeleteAnnouncementConfirm(false);
    setAnnouncementToDelete(null);
  };

  // Submission management functions
  const handleEditSubmission = (submission, submissionType) => {
    setEditingSubmission({ ...submission, originalType: submissionType });
    setNewSubmission({
      team: submission.team,
      submissionType: submissionType,
      files: [...submission.files],
      count: submission.count
    });
    setShowEditSubmissionModal(true);
  };

  const handleAddSubmission = () => {
    setEditingSubmission(null);
    setNewSubmission({
      team: "",
      submissionType: "ontime",
      files: [], // Array of File objects
      count: 0
    });
    setShowEditSubmissionModal(true);
  };

  const handleSaveSubmission = async () => {
    if (!newSubmission.team || newSubmission.files.length === 0) {
      alert("Team name and at least one file are required!");
      return;
    }
    
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append("username", newSubmission.team);
      
      // Get file types from config
      const configRes = await fetch("http://localhost:5000/admin/config");
      const configData = await configRes.json();
      const fileTypes = configData.fileTypes || [];
      
      if (fileTypes.length === 0) {
        alert("No file types configured. Please configure file types in Admin Settings first.");
        return;
      }
      
      if (newSubmission.files.length > fileTypes.length) {
        alert(`Too many files. Please upload at most ${fileTypes.length} file(s) (matching the configured file types).`);
        return;
      }
      
      // Map uploaded files to file type keys in order
      newSubmission.files.forEach((file, index) => {
        const fileTypeKey = fileTypes[index].key;
        formData.append(fileTypeKey, file);
      });

      let res;
      if (editingSubmission) {
        // For editing, delete old and create new
        const deleteRes = await fetch(
          `http://localhost:5000/admin/submissions/${editingSubmission.team}/${editingSubmission.originalType}`,
          { method: "DELETE" }
        );
        if (!deleteRes.ok) {
          console.warn("Failed to delete old submission, continuing with upload...");
        }
      }
      
      // Add new submission using upload endpoint
      res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.message) {
        alert(editingSubmission ? "✅ Submission updated successfully!" : "✅ Submission added successfully!");
        setShowEditSubmissionModal(false);
        setEditingSubmission(null);
        setNewSubmission({ team: "", submissionType: "ontime", files: [], count: 0 }); // Array of File objects
        fetchAdminSubmissions(); // Refresh submissions
        addAdminLog(
          editingSubmission ? "Submission Updated" : "Submission Created",
          {
            team: newSubmission.team,
            type: data.submissionType?.toLowerCase() || newSubmission.submissionType,
            filesCount: newSubmission.files.length,
            oldType: editingSubmission?.originalType
          }
        );
      } else {
        alert(data.error || data.message || "❌ Failed to save submission");
      }
    } catch (e) {
      console.error("Failed to save submission", e);
      alert("Failed to save submission: " + (e.message || "Unknown error"));
    }
  };

  const handleDeleteSubmission = async (team, submissionType) => {
    if (!window.confirm(`Are you sure you want to delete the ${submissionType === "ontime" ? "on-time" : "late"} submission for team "${team}"?\n\nThis will permanently delete all files for this submission type.`)) return;
    
    const url = `http://localhost:5000/admin/submissions/${team}/${submissionType}`;
    console.log(`[DELETE] Attempting to delete submission: ${url}`);
    
    try {
      const res = await fetch(url, {
        method: "DELETE"
      });
      
      console.log(`[DELETE] Response status: ${res.status} ${res.statusText}`);
      console.log(`[DELETE] Response ok: ${res.ok}`);
      
      let data;
      let responseText = "";
      try {
        responseText = await res.text();
        console.log(`[DELETE] Response text:`, responseText);
        
        // Check if response is HTML (404 page)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          throw new Error(`Server returned HTML (likely 404). The endpoint may not be registered. Please restart the backend server. Status: ${res.status}`);
        }
        
        data = responseText ? JSON.parse(responseText) : {};
        console.log(`[DELETE] Parsed data:`, data);
      } catch (parseError) {
        console.error("[DELETE] Failed to parse response:", parseError);
        if (res.status === 404) {
          throw new Error(`Endpoint not found (404). Please restart the backend server to register the new DELETE endpoint.`);
        }
        throw new Error(`Server returned invalid response (status: ${res.status}): ${responseText?.substring(0, 100) || "empty response"}`);
      }
      
      if (!res.ok) {
        const errorMsg = data.error || data.message || `Server error: ${res.status} ${res.statusText}`;
        console.error("[DELETE] HTTP error:", errorMsg, data);
        throw new Error(errorMsg);
      }
      
      if (data.success) {
        console.log("[DELETE] Success! Refreshing submissions...");
        alert(`✅ ${data.message || "Submission deleted successfully!"}`);
        fetchAdminSubmissions(); // Refresh submissions
        addAdminLog("Submission Deleted", { team, submissionType });
        
        // Reset submission state for the deleted team if they're currently logged in
        // This will clear their submission status when they refresh or navigate
      } else {
        const errorMsg = data.message || data.error || "Failed to delete submission";
        console.error("[DELETE] Backend returned success: false", errorMsg, data);
        alert(`❌ ${errorMsg}`);
      }
    } catch (e) {
      console.error("[DELETE] Exception caught:", e);
      console.error("[DELETE] Error details:", {
        message: e.message,
        stack: e.stack,
        name: e.name
      });
      if (e.message && (e.message.includes("Failed to fetch") || e.message.includes("NetworkError"))) {
        alert("❌ Cannot connect to server. Please make sure the backend is running on http://localhost:5000");
      } else {
        alert(`❌ Failed to delete submission: ${e.message || "Unknown error"}\n\nCheck the browser console (F12) for more details.`);
      }
    }
  };

  const handleAddFileToSubmission = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length > 0) {
      setNewSubmission({
        ...newSubmission,
        files: [...newSubmission.files, ...selectedFiles],
        count: newSubmission.files.length + selectedFiles.length
      });
    }
    // Reset input so same file can be selected again
    event.target.value = "";
  };

  const handleRemoveFileFromSubmission = (index) => {
    const newFiles = newSubmission.files.filter((_, i) => i !== index);
    setNewSubmission({
      ...newSubmission,
      files: newFiles,
      count: newFiles.length
    });
  };

  // Mentor functions
  const fetchMentorTeams = async () => {
    try {
      const res = await fetch(`http://localhost:5000/mentor/teams?mentorName=${username}`);
      const data = await res.json();
      if (data.success) setMentorTeams(data.teams || {});
    } catch (e) {
      console.error("Failed to fetch mentor teams", e);
    }
  };

  const handleViewTeamSubmissions = async (teamId) => {
    try {
      const res = await fetch(`http://localhost:5000/submissions/${teamId}`);
      const data = await res.json();
      setSelectedTeamSubmissions(data);
      setSelectedPhaseFilter("all"); // Reset filter when opening modal
      setShowTeamSubmissionsModal(true);
    } catch (e) {
      console.error("Failed to fetch team submissions", e);
      alert("Failed to load team submissions");
    }
  };

  // Chatbot functions
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    // Add user message
    const userMessage = { sender: "user", text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    
    // Add loading indicator
    setChatMessages((prev) => [...prev, { sender: "bot", text: "...", loading: true }]);
    
    try {
      // Call RAG API
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text })
      });
      
      const data = await response.json();
      
      // Remove loading indicator
      setChatMessages((prev) => prev.filter(msg => !msg.loading));
      
      if (data.success) {
        setChatMessages((prev) => [...prev, { sender: "bot", text: data.response }]);
      } else {
        setChatMessages((prev) => [...prev, { 
          sender: "bot", 
          text: "Sorry, I encountered an error. Please try again or contact support." 
        }]);
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      
      // Remove loading indicator
      setChatMessages((prev) => prev.filter(msg => !msg.loading));
      
      setChatMessages((prev) => [...prev, { 
        sender: "bot", 
        text: "Sorry, I can't connect to the RAG chatbot. Please make sure the backend is running." 
      }]);
    }
  };

  const handleSaveConfig = async () => {
    if (!adminConfig) {
      alert("Configuration not loaded. Please refresh the page.");
      return;
    }
    try {
      // Sync document labels and fileTypes in phases from main fileTypes array
      const syncedPhases = adminConfig.phases ? adminConfig.phases.map(phase => ({
        ...phase,
        reviews: phase.reviews.map(review => ({
          ...review,
          documents: review.documents.map(doc => {
            // Find matching file type
            const matchingFileType = adminConfig.fileTypes.find(ft => ft.key === doc.key);
            return {
              ...doc,
              label: matchingFileType ? matchingFileType.label : doc.label,
              fileType: matchingFileType ? matchingFileType.fileType : doc.fileType
            };
          })
        }))
      })) : [];
      
      // Validate deadline before sending
      if (!adminConfig.deadline) {
        setNotification({ show: true, message: "Please fill the required fields", type: "error" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
        return;
      }

      // Validate file types
      if (adminConfig.fileTypes && adminConfig.fileTypes.length > 0) {
        const invalidFileTypes = adminConfig.fileTypes.filter(ft => !ft.key || !ft.label);
        if (invalidFileTypes.length > 0) {
          setNotification({ show: true, message: "Please fill the required fields", type: "error" });
          setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
          return;
        }
      }

      const res = await fetch("http://localhost:5000/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deadline: adminConfig.deadline,
          fileTypes: adminConfig.fileTypes || [],
          phases: syncedPhases
        })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        // Show the actual error message from backend
        const errorMsg = data.error || data.message || "Failed to save configuration";
        setNotification({ show: true, message: errorMsg, type: "error" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
        console.error("Save config error:", data);
        return;
      }

      setNotification({ show: true, message: "Configuration saved successfully!", type: "success" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
      fetchAdminConfig();
      fetchAdminSubmissions(); // Refresh submissions to reflect any file type changes
      addAdminLog("Configuration Saved", {
        fileTypesCount: adminConfig.fileTypes?.length || 0,
        phasesCount: adminConfig.phases?.length || 0,
        deadline: adminConfig.deadline || "Not set"
      });

      if (selectedEditPhase !== null && selectedEditReview !== null) {
        try {
          const resActive = await fetch("http://localhost:5000/admin/set-active-phase-review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phaseIndex: selectedEditPhase,
              reviewIndex: selectedEditReview
            })
          });
          const activeData = await resActive.json();
          if (resActive.ok && activeData.success) {
            setActivePhaseReview(activeData.activePhaseReview || null);
            addAdminLog("Active Review Set", {
              phaseIndex: selectedEditPhase,
              reviewIndex: selectedEditReview,
              phaseName: activeData.activePhaseReview?.phaseName,
              reviewName: activeData.activePhaseReview?.reviewName
            });
          } else {
            console.error("Failed to set active phase/review:", activeData?.error);
          }
        } catch (e) {
          console.error("Error setting active phase/review:", e);
        }
      }
    } catch (e) {
      console.error("Failed to save config", e);
      if (e.message && e.message.includes("Failed to fetch")) {
        alert("Cannot connect to server. Please make sure the backend is running on http://localhost:5000");
      } else {
        alert("Failed to save configuration. Please try again.");
      }
    }
  };

  const handleAddFileType = () => {
    if (!adminConfig) {
      alert("Configuration not loaded. Please refresh the page.");
      return;
    }
    // Open custom modal instead of prompts
    setFileTypeKey("");
    setFileTypeLabel("");
    setShowFileTypeModal(true);
  };

  const handleSubmitFileType = () => {
    if (!fileTypeKey || !fileTypeKey.trim()) {
      alert("Please enter a file type key.");
      return;
    }
    
    if (!fileTypeLabel || !fileTypeLabel.trim()) {
      alert("Please enter a file type label.");
      return;
    }

    // Check for duplicate keys
    if (adminConfig.fileTypes && adminConfig.fileTypes.some(ft => ft.key === fileTypeKey.trim())) {
      alert("❌ File type with this key already exists!");
      return;
    }
    
    setAdminConfig({
      ...adminConfig,
      fileTypes: [...(adminConfig.fileTypes || []), { key: fileTypeKey.trim(), label: fileTypeLabel.trim(), fileType: "any" }]
    });
    addAdminLog("File Type Added", { key: fileTypeKey.trim(), label: fileTypeLabel.trim() });
    
    // Close modal and reset
    setShowFileTypeModal(false);
    setFileTypeKey("");
    setFileTypeLabel("");
  };

  const handleRemoveFileType = (index) => {
    if (!adminConfig || !adminConfig.fileTypes || index < 0 || index >= adminConfig.fileTypes.length) {
      alert("Invalid file type index.");
      return;
    }
    // Browser confirm removed - file type is removed directly
    const fileTypeToRemove = adminConfig.fileTypes[index];
    const newTypes = adminConfig.fileTypes.filter((_, i) => i !== index);
    setAdminConfig({ ...adminConfig, fileTypes: newTypes });
    addAdminLog("File Type Removed", { key: fileTypeToRemove.key, label: fileTypeToRemove.label });
  };

  const handleSaveTeam = async () => {
    if (!newTeam.teamId) {
      setNotification({ show: true, message: "Team ID is required!", type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
      return;
    }
    if (newTeam.contactEmail && !isValidEmail(newTeam.contactEmail.trim())) {
      setNotification({ show: true, message: "Please enter a valid contact email address (e.g., name@example.com).", type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
      return;
    }
    try {
      const url = editingTeam ? `http://localhost:5000/admin/teams/${editingTeam}` : "http://localhost:5000/admin/teams";
      // Parse members from "Name:SRN, Name:SRN" format
      const parseMembers = (membersStr) => {
        if (!membersStr || membersStr.trim() === "") return [];
        return membersStr.split(",").map(m => {
          const trimmed = m.trim();
          if (trimmed.includes(":")) {
            const [name, srn] = trimmed.split(":").map(s => s.trim());
            return { name, srn };
          } else {
            // Backward compatibility: if no ":", treat as name only
            return { name: trimmed, srn: "" };
          }
        }).filter(m => m.name);
      };

      const parsedMembers = parseMembers(newTeam.members);
      
      const contactEmail = newTeam.contactEmail ? newTeam.contactEmail.trim() : "";

      const body = editingTeam ? {
        teamName: newTeam.teamName,
        members: parsedMembers,
        projectTitle: newTeam.projectTitle,
        contactEmail,
        status: newTeam.status,
        notes: newTeam.notes,
        mentorName: newTeam.mentorName
      } : {
        teamId: newTeam.teamId,
        teamData: {
          teamName: newTeam.teamName,
          members: parsedMembers,
          projectTitle: newTeam.projectTitle,
          contactEmail,
          status: newTeam.status,
          notes: newTeam.notes,
          mentorName: newTeam.mentorName
        }
      };
      
      const res = await fetch(url, {
        method: editingTeam ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      // Check if response is ok before parsing JSON
      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error("Failed to parse response:", jsonError);
        setNotification({ show: true, message: `Server error: ${res.status} ${res.statusText}`, type: "error" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
        return;
      }
      
      if (data.success) {
        // Auto-create mentor login if mentor name is provided
        if (newTeam.mentorName && newTeam.mentorName.trim() !== "") {
          try {
            const mentorRes = await fetch("http://localhost:5000/admin/ensure-mentor", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mentorName: newTeam.mentorName.trim() })
            });
            const mentorData = await mentorRes.json();
            
            if (mentorData.success && mentorData.created) {
              // Show mentor credentials if newly created
              const message = editingTeam 
                ? "Team updated. Mentor login credentials created too"
                : "New team created. Mentor login credentials created too";
              setNotification({ show: true, message: message, type: "success" });
              setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
              addAdminLog("Mentor Auto-Created", {
                mentorName: mentorData.username,
                teamId: newTeam.teamId
              });
            } else if (mentorData.success && mentorData.exists) {
              // Mentor already has credentials, don't mention it
              const message = editingTeam ? "Team updated" : "New team created";
              setNotification({ show: true, message: message, type: "success" });
              setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
            } else {
              const message = editingTeam ? "Team updated" : "New team created";
              setNotification({ show: true, message: message, type: "success" });
              setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
            }
          } catch (e) {
            console.error("Error creating mentor:", e);
            // Don't mention the error, just show team created/updated
            const message = editingTeam ? "Team updated" : "New team created";
            setNotification({ show: true, message: message, type: "success" });
            setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
          }
        } else {
          const message = editingTeam ? "Team updated" : "New team created";
          setNotification({ show: true, message: message, type: "success" });
          setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
        }
        
        setShowEditTeamModal(false);
        setEditingTeam(null);
        setNewTeam({
          teamId: "",
          teamName: "",
          members: "",
          projectTitle: "",
          contactEmail: "",
          status: "active",
          notes: "",
          mentorName: ""
        });
        fetchAdminTeams();
        fetchAdminSubmissions(); // Refresh submissions to show updated team names
        addAdminLog(
          editingTeam ? "Team Updated" : "Team Created",
          {
            teamId: newTeam.teamId,
            teamName: newTeam.teamName,
            membersCount: parsedMembers.length,
            mentorName: newTeam.mentorName || "None"
          }
        );
      } else {
        // Show the actual error message from backend, or a generic one
        const errorMessage = data.message || data.error || "Failed to save team";
        console.error("Team save error:", data);
        setNotification({ show: true, message: errorMessage, type: "error" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
      }
    } catch (e) {
      console.error("Failed to save team", e);
      setNotification({ show: true, message: "Failed to save team", type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
    }
  };

  const handleAddReviewToPhase = () => {
    if (!adminConfig || !Array.isArray(adminConfig.phases) || adminConfig.phases.length === 0) {
      alert("Configuration not loaded. Please refresh the page.");
      return;
    }
    if (selectedEditPhase === null) {
      alert("Select a phase first before adding a review.");
      return;
    }

    const phase = adminConfig.phases[selectedEditPhase];
    if (!phase) {
      alert("Invalid phase selection.");
      return;
    }

    // Open custom modal instead of prompt
    setReviewNameInput("");
    setShowReviewNameModal(true);
  };

  const handleSubmitReviewName = () => {
    if (!reviewNameInput || !reviewNameInput.trim()) {
      alert("Please enter a review name.");
      return;
    }
    
    if (selectedEditPhase === null) {
      alert("Select a phase first before adding a review.");
      setShowReviewNameModal(false);
      return;
    }

    const phase = adminConfig.phases[selectedEditPhase];
    if (!phase) {
      alert("Invalid phase selection.");
      setShowReviewNameModal(false);
      return;
    }

    const reviewName = reviewNameInput.trim();
    setShowReviewNameModal(false);

    const slugify = (value, fallback) => {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      return slug || fallback;
    };

    const existingReviews = Array.isArray(phase.reviews) ? phase.reviews : [];
    const baseKey = slugify(reviewName, `review${existingReviews.length + 1}`);
    let uniqueKey = baseKey;
    let counter = 2;
    while (
      existingReviews.some(
        (rev) =>
          slugify(rev.review || rev.reviewName || "", "") === uniqueKey
      )
    ) {
      uniqueKey = `${baseKey}_${counter++}`;
    }

    const phaseKey = slugify(phase.phaseName || `phase${selectedEditPhase + 1}`, `phase${selectedEditPhase + 1}`);
    const documents = (adminConfig.fileTypes || []).map((ft) => ({
      key: `${phaseKey}_${uniqueKey}_${ft.key}`,
      label: ft.label || ft.key,
      fileType: ft.fileType || "any",
    }));

    const newReview = {
      review: uniqueKey,
      reviewName,
      documents,
    };

    const updatedPhases = adminConfig.phases.map((ph, idx) =>
      idx === selectedEditPhase
        ? {
            ...ph,
            reviews: [...existingReviews, newReview],
          }
        : ph
    );

    const updatedConfig = { ...adminConfig, phases: updatedPhases };
    setAdminConfig(updatedConfig);

    const newReviewIndex = updatedConfig.phases[selectedEditPhase].reviews.length - 1;
    setSelectedEditReview(newReviewIndex);

    addAdminLog("Review Added", {
      phaseName: phase.phaseName,
      reviewName,
      documentsCount: documents.length,
    });

    // Alert removed - review is added silently
  };

  const handleRemoveReviewFromPhase = () => {
    if (
      !adminConfig ||
      !Array.isArray(adminConfig.phases) ||
      selectedEditPhase === null ||
      selectedEditReview === null
    ) {
      alert("Select a phase and review to delete.");
      return;
    }

    const phase = adminConfig.phases[selectedEditPhase];
    if (!phase || !Array.isArray(phase.reviews) || !phase.reviews[selectedEditReview]) {
      alert("Invalid phase or review selection.");
      return;
    }

    const review = phase.reviews[selectedEditReview];
    // Store data and show custom confirmation modal
    setDeleteReviewData({
      reviewName: review.reviewName,
      phaseName: phase.phaseName,
      phaseIndex: selectedEditPhase,
      reviewIndex: selectedEditReview
    });
    setShowDeleteReviewConfirm(true);
  };

  const handleConfirmDeleteReview = () => {
    if (!deleteReviewData) return;
    
    const { phaseIndex, reviewIndex } = deleteReviewData;
    const phase = adminConfig.phases[phaseIndex];
    const review = phase.reviews[reviewIndex];

    const updatedPhases = adminConfig.phases.map((ph, idx) =>
      idx === phaseIndex
        ? {
            ...ph,
            reviews: ph.reviews.filter((_, rIdx) => rIdx !== reviewIndex),
          }
        : ph
    );

    setAdminConfig({ ...adminConfig, phases: updatedPhases });

    const nextReviewIndex =
      phase.reviews.length > 1
        ? Math.max(0, reviewIndex - 1)
        : null;
    setSelectedEditReview(nextReviewIndex);

    addAdminLog("Review Removed", {
      phaseName: phase.phaseName,
      reviewName: review.reviewName,
    });

    // Alert removed - review is removed silently
    
    // Close modal and reset
    setShowDeleteReviewConfirm(false);
    setDeleteReviewData(null);
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm(`Are you sure you want to delete team ${teamId}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/admin/teams/${teamId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Team deleted successfully!");
        fetchAdminTeams();
        fetchAdminSubmissions(); // Refresh submissions to show updated team names
        addAdminLog("Team Deleted", { teamId });
      } else {
        alert(data.message || "Failed to delete team");
      }
    } catch (e) {
      console.error("Failed to delete team", e);
      alert("Failed to delete team");
    }
  };

  const handleFinalizeSubmissions = async () => {
    if (!adminSubmissions) return;
    
    const totalSubmissions = adminSubmissions.totalOnTime + adminSubmissions.totalLate;
    if (totalSubmissions === 0) {
      alert("No submissions to finalize.");
      return;
    }
    
    const confirmMessage = `Are you sure you want to finalize all submissions?\n\nThis will:\n- Mark all submissions as complete\n- Remove submissions from student view\n- Reset configuration state\n\nTotal submissions: ${totalSubmissions}\nOn-time: ${adminSubmissions.totalOnTime}\nLate: ${adminSubmissions.totalLate}\n\nThis action cannot be undone!`;
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      // Delete all submissions
      let deletedCount = 0;
      let errors = [];
      
      // Delete on-time submissions
      for (const submission of adminSubmissions.submissions.ontime) {
        try {
          const res = await fetch(`http://localhost:5000/admin/submissions/${submission.team}/ontime`, {
            method: "DELETE"
          });
          const data = await res.json();
          if (data.success) {
            deletedCount++;
          } else {
            errors.push(`${submission.team} (ontime)`);
          }
        } catch (e) {
          errors.push(`${submission.team} (ontime)`);
          console.error(`Failed to delete submission for ${submission.team}:`, e);
        }
      }
      
      // Delete late submissions
      for (const submission of adminSubmissions.submissions.late) {
        try {
          const res = await fetch(`http://localhost:5000/admin/submissions/${submission.team}/late`, {
            method: "DELETE"
          });
          const data = await res.json();
          if (data.success) {
            deletedCount++;
          } else {
            errors.push(`${submission.team} (late)`);
          }
        } catch (e) {
          errors.push(`${submission.team} (late)`);
          console.error(`Failed to delete submission for ${submission.team}:`, e);
        }
      }
      
      // Refresh submissions
      fetchAdminSubmissions();
      
      if (errors.length === 0) {
        alert(`✅ Successfully finalized all ${deletedCount} submissions!\n\nSubmissions have been removed from student view.`);
        addAdminLog("Submissions Finalized", { totalSubmissions: deletedCount });
      } else {
        alert(`⚠️ Finalized ${deletedCount} submissions, but ${errors.length} failed:\n${errors.join(", ")}`);
      }
    } catch (e) {
      console.error("Failed to finalize submissions", e);
      alert("Failed to finalize submissions. Please try again.");
    }
  };

  const handleDoneConfiguration = async () => {
    if (!adminConfig) return;
    
    // Check if phase and review are selected
    if (selectedEditPhase === null || selectedEditReview === null) {
      setNotification({ show: true, message: "Please select phase and review", type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
      return;
    }
    
    // Validate file types - check that all have both key and label
    if (adminConfig.fileTypes && adminConfig.fileTypes.length > 0) {
      const invalidFileTypes = adminConfig.fileTypes.filter(ft => !ft.key || !ft.label);
      if (invalidFileTypes.length > 0) {
        setNotification({ show: true, message: "Please fill the required fields", type: "error" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
        return;
      }
    }
    
    // Save current phase/review selection to history if both are selected
    if (selectedEditPhase !== null && selectedEditReview !== null && adminConfig.phases) {
      const phase = adminConfig.phases[selectedEditPhase];
      const review = phase?.reviews[selectedEditReview];
      if (phase && review) {
        const historyEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          phaseName: phase.phaseName,
          phaseIndex: selectedEditPhase,
          reviewName: review.reviewName,
          reviewIndex: selectedEditReview,
          deadline: adminConfig.deadline || null,
          fileTypes: adminConfig.fileTypes || []
        };
        setPhaseReviewHistory(prev => {
          const newHistory = [historyEntry, ...prev].slice(0, 50); // Keep last 50 entries
          try {
            localStorage.setItem('adminPhaseReviewHistory', JSON.stringify(newHistory));
          } catch (e) {
            console.error("Failed to save history to localStorage", e);
          }
          return newHistory;
        });
        
        // Log the review completion
        addAdminLog("Review Completed", {
          phaseName: phase.phaseName,
          reviewName: review.reviewName,
          documentsCount: review.documents?.length || 0
        });
        
        // Auto-create announcement for the submission
        try {
          const fileTypesList = adminConfig.fileTypes && adminConfig.fileTypes.length > 0
            ? adminConfig.fileTypes.map(ft => ft.label || ft.key).join(", ")
            : "N/A";
          
          const deadlineStr = formatTimestamp(adminConfig.deadline, "Not specified");
          
          const announcementData = {
            title: `${phase.phaseName} - ${review.reviewName} Submission Open`,
            content: `Submission is now open for ${phase.phaseName} - ${review.reviewName}.\n\nDeadline: ${deadlineStr}\n\nRequired Deliverables: ${fileTypesList}\n\nPlease submit your files before the deadline.`,
            priority: "normal"
          };
          
          const announcementRes = await fetch("http://localhost:5000/admin/announcements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(announcementData)
          });
          
          const announcementResult = await announcementRes.json();
          
          if (announcementRes.ok && announcementResult.success) {
            console.log("Announcement auto-created successfully:", announcementResult.announcement);
            setNotification({ show: true, message: `Announcement created: "${announcementData.title}"`, type: "success" });
            setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
            // Refresh admin announcements
            const annRes = await fetch("http://localhost:5000/admin/announcements");
            if (annRes.ok) {
              const annData = await annRes.json();
              if (annData.success) {
                setAdminAnnouncements(annData.announcements || []);
              }
            }
          } else {
            const errorMsg = announcementResult.error || "Unknown error";
            console.error("Failed to auto-create announcement:", errorMsg);
            setNotification({ show: true, message: `Failed to create announcement: ${errorMsg}. Please create it manually.`, type: "error" });
            setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
          }
        } catch (e) {
          console.error("Failed to auto-create announcement:", e);
          setNotification({ show: true, message: `Failed to create announcement: ${e.message}. Please create it manually.`, type: "error" });
          setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
        }
        
        // Set active phase/review on backend for submission organization
        try {
          const res = await fetch("http://localhost:5000/admin/set-active-phase-review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phaseIndex: selectedEditPhase,
              reviewIndex: selectedEditReview
            })
          });
          const data = await res.json();
          if (data.success) {
            console.log("Active phase/review set successfully:", data.activePhaseReview);
            // Refresh admin config to update activePhaseReview in state
            await fetchAdminConfig();
          } else {
            console.error("Failed to set active phase/review:", data.error);
          }
        } catch (e) {
          console.error("Error setting active phase/review:", e);
        }
      }
    } else {
      // Clear active phase/review if none selected
      try {
        const res = await fetch("http://localhost:5000/admin/set-active-phase-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phaseIndex: null,
            reviewIndex: null
          })
        });
        const data = await res.json();
        if (data.success) {
          console.log("Active phase/review cleared");
          // Refresh admin config to update activePhaseReview in state
          await fetchAdminConfig();
        }
      } catch (e) {
        console.error("Error clearing active phase/review:", e);
      }
    }
    
    // Reset file type labels (names)
    if (adminConfig.fileTypes && adminConfig.fileTypes.length > 0) {
      const resetFileTypes = adminConfig.fileTypes.map(ft => ({
        ...ft,
        label: "" // Reset label to empty
      }));
      setAdminConfig({ ...adminConfig, fileTypes: resetFileTypes });
    }
    
    // Reset phase and review selection
    setSelectedEditPhase(null);
    setSelectedEditReview(null);
    try {
      localStorage.removeItem('adminSelectedPhase');
      localStorage.removeItem('adminSelectedReview');
    } catch (e) {
      console.error("Failed to clear phase/review selection", e);
    }
    
    // Log Done button click (always log, even if no review was completed)
    addAdminLog("Done Button Clicked", {
      hadPhaseSelected: selectedEditPhase !== null,
      hadReviewSelected: selectedEditReview !== null,
      fileTypesReset: adminConfig.fileTypes?.length || 0
    });
    
    setNotification({ show: true, message: "Live submission set", type: "success" });
    setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
  };

  const handleEditLiveSubmission = (submissionId) => {
    // Check if it's the active submission
    let submission;
    if (submissionId === 'active' && adminConfig?.activePhaseReview) {
      submission = {
        id: 'active',
        phaseName: adminConfig.activePhaseReview.phaseName || adminConfig.activePhaseReview.phase,
        reviewName: adminConfig.activePhaseReview.reviewName || adminConfig.activePhaseReview.review,
        deadline: adminConfig.deadline,
        fileTypes: adminConfig.fileTypes || []
      };
    } else {
      submission = phaseReviewHistory.find(s => s.id === submissionId);
    }
    
    if (submission) {
      // Format deadline for datetime-local input
      const formattedDeadline = submission.deadline 
        ? new Date(submission.deadline).toISOString().slice(0, 16)
        : "";
      
      // Open edit modal with submission data
      setEditingLiveSubmission({
        ...submission,
        deadline: formattedDeadline
      });
      setShowEditLiveSubmissionModal(true);
    }
  };

  const handleSaveLiveSubmission = async () => {
    if (!editingLiveSubmission) return;
    
    // If it's the active submission, update the backend config
    if (editingLiveSubmission.id === 'active') {
      try {
        const res = await fetch("http://localhost:5000/admin/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deadline: editingLiveSubmission.deadline,
            fileTypes: adminConfig.fileTypes || [],
            phases: adminConfig.phases || []
          })
        });
        const data = await res.json();
        if (data.success) {
          await fetchAdminConfig(); // Refresh config
        }
      } catch (e) {
        console.error("Failed to update active submission deadline", e);
      }
    } else {
      // Update history entry
      setPhaseReviewHistory(prev => {
        const updated = prev.map(sub => 
          sub.id === editingLiveSubmission.id
            ? { ...sub, deadline: editingLiveSubmission.deadline }
            : sub
        );
        try {
          localStorage.setItem('adminPhaseReviewHistory', JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to save updated submission", e);
        }
        return updated;
      });
    }
    
    addAdminLog("Live Submission Updated", {
      submissionId: editingLiveSubmission.id,
      phaseName: editingLiveSubmission.phaseName,
      reviewName: editingLiveSubmission.reviewName
    });
    
    setShowEditLiveSubmissionModal(false);
    setEditingLiveSubmission(null);
    setBoldDeliverables(new Set());
    setNotification({ show: true, message: "Live submission updated", type: "success" });
    setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
  };

  const handleDeleteLiveSubmission = (submissionId) => {
    // Check if it's the active submission
    let submission;
    if (submissionId === 'active' && adminConfig?.activePhaseReview) {
      submission = {
        id: 'active',
        phaseName: adminConfig.activePhaseReview.phaseName || adminConfig.activePhaseReview.phase,
        reviewName: adminConfig.activePhaseReview.reviewName || adminConfig.activePhaseReview.review,
        deadline: adminConfig.deadline,
        fileTypes: adminConfig.fileTypes || []
      };
    } else {
      submission = phaseReviewHistory.find(s => s.id === submissionId);
    }
    if (!submission) return;
    
    setLiveSubmissionToDelete(submission);
    setShowDeleteLiveSubmissionConfirm(true);
  };

  const handleConfirmDeleteLiveSubmission = async () => {
    if (!liveSubmissionToDelete) return;
    
    // If it's the active submission, clear it on the backend
    if (liveSubmissionToDelete.id === 'active') {
      try {
        const res = await fetch("http://localhost:5000/admin/set-active-phase-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phaseIndex: null,
            reviewIndex: null
          })
        });
        const data = await res.json();
        if (data.success) {
          await fetchAdminConfig(); // Refresh config
        }
      } catch (e) {
        console.error("Failed to clear active submission", e);
      }
    } else {
      // Delete from history
      setPhaseReviewHistory(prev => {
        const updated = prev.filter(s => s.id !== liveSubmissionToDelete.id);
        try {
          localStorage.setItem('adminPhaseReviewHistory', JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to delete submission", e);
        }
        return updated;
      });
    }
    
    addAdminLog("Live Submission Deleted", {
      submissionId: liveSubmissionToDelete.id,
      phaseName: liveSubmissionToDelete.phaseName,
      reviewName: liveSubmissionToDelete.reviewName
    });
    
    setNotification({ show: true, message: "Live submission deleted", type: "error" });
    setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
    
    setShowDeleteLiveSubmissionConfirm(false);
    setLiveSubmissionToDelete(null);
  };

  const handleEditTeam = (teamId) => {
    const team = teams[teamId];
    setEditingTeam(teamId);
    
    // Convert members array to "Name:SRN" format for editing
    const formatMembers = (members) => {
      if (!members || members.length === 0) return "";
      return members.map(m => {
        if (typeof m === "string") {
          return m; // Backward compatibility with old string format
        } else if (m.name && m.srn) {
          return `${m.name}:${m.srn}`;
        } else if (m.name) {
          return m.name;
        }
        return "";
      }).filter(m => m).join(", ");
    };
    
    setNewTeam({
      teamId: team.teamId,
      teamName: team.teamName || "",
      members: formatMembers(team.members),
      projectTitle: team.projectTitle || "",
      contactEmail: team.contactEmail || "",
      status: team.status || "active",
      notes: team.notes || "",
      mentorName: team.mentorName || ""
    });
    setShowEditTeamModal(true);
  };

  // Student functions
  // Helper function to get accept attribute based on fileType
  const getFileAcceptAttribute = (fileType) => {
    if (!fileType || fileType === "any") return "";
    
    const typeMap = {
      "pdf": ".pdf",
      "word": ".doc,.docx",
      "doc": ".doc",
      "docx": ".docx",
      "excel": ".xls,.xlsx",
      "xls": ".xls",
      "xlsx": ".xlsx",
      "ppt": ".ppt,.pptx",
      "pptx": ".pptx",
      "powerpoint": ".ppt,.pptx",
      "image": ".jpg,.jpeg,.png,.gif,.bmp",
      "jpg": ".jpg,.jpeg",
      "jpeg": ".jpg,.jpeg",
      "png": ".png",
      "zip": ".zip",
      "rar": ".rar",
      "txt": ".txt",
      "csv": ".csv",
      "json": ".json",
      "xml": ".xml"
    };
    
    return typeMap[fileType.toLowerCase()] || "";
  };

  // Helper function to validate file type
  const validateFileType = (file, fileType) => {
    if (!fileType || fileType === "any") return true;
    
    const acceptString = getFileAcceptAttribute(fileType);
    if (!acceptString) return true; // If no mapping found, allow any
    
    const allowedExtensions = acceptString.split(",").map(ext => ext.trim().toLowerCase());
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    
    return allowedExtensions.includes(fileExtension);
  };

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Find the fileType configuration for this key
    const fileTypeConfig = fileTypes.find(ft => ft.key === key);
    if (fileTypeConfig && fileTypeConfig.fileType) {
      // Validate file type
      if (!validateFileType(file, fileTypeConfig.fileType)) {
        const acceptString = getFileAcceptAttribute(fileTypeConfig.fileType);
        alert(`Invalid file type! Please upload a ${fileTypeConfig.fileType.toUpperCase()} file.\n\nAccepted formats: ${acceptString || fileTypeConfig.fileType}`);
        e.target.value = ""; // Clear the input
        return;
      }
    }
    
    setFiles({ ...files, [key]: file });
  };

  const handleFileDelete = (key) => {
    setFiles({ ...files, [key]: null });
  };

  const fetchAllSubmissions = async () => {
    try {
      const response = await fetch("http://localhost:5000/submissions");
      const data = await response.json();
      setSubmissions(data);
      setShowSubmissions(true);
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
      alert("Failed to load submissions");
    }
  };


  const getTimeRemaining = () => {
    if (!deadline) return { expired: false, text: "Loading..." };
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate - now;
    
    if (timeDiff <= 0) {
      return { expired: true, text: "Deadline has passed" };
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return { expired: false, text: `${days}d ${hours}h ${minutes}m remaining` };
    } else if (hours > 0) {
      return { expired: false, text: `${hours}h ${minutes}m remaining` };
    } else {
      return { expired: false, text: `${minutes}m remaining` };
    }
  };

  // Calculate submission progress per user
  const getSubmissionProgress = () => {
    // If user has already submitted, show 100%
    if (hasSubmitted) {
      return {
        progress: 100,
        uploadedCount: fileTypes.length,
        totalCount: fileTypes.length
      };
    }
    
    // Calculate based on submittedFiles (persisted submissions)
    const uploadedCount = fileTypes.filter(ft => submittedFiles.has(ft.key)).length;
    const totalCount = fileTypes.length;
    const progress = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0;
    
    return {
      progress,
      uploadedCount,
      totalCount
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasSubmitted) return;

    // Check all required files are uploaded
    let allFilesPresent = true;
    const missingFiles = [];
    fileTypes.forEach(ft => {
      if (!files[ft.key]) {
        allFilesPresent = false;
        missingFiles.push(ft.label);
      }
    });

    if (!allFilesPresent) {
      setNotification({ show: true, message: `Please upload all required files before submitting. Missing: ${missingFiles.join(", ")}`, type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    fileTypes.forEach(ft => {
      formData.append(ft.key, files[ft.key]);
    });

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData
      });

      const result = await response.json();
      if (response.ok) {
        const filesList = (result.files || [])
          .map((file) => `• ${file.typeLabel || file.fieldName}: ${file.filename}`)
          .join("\n");
        const submissionDetails = `
Files stored in: MongoDB (download from dashboard)
Submission Type: ${result.submissionType}
Submitted at: ${formatTimestamp(result.timestamp)}
Files uploaded:
${filesList || result.uploaded.join(", ")}

${result.message}`;
        
        setHasSubmitted(true);
        setSubmissionStatus({
          isLate: result.late,
          timestamp: result.timestamp,
          submissionType: result.submissionType,
          uploaded: result.uploaded,
          files: result.files || []
        });
        
        // Update submittedFiles with the uploaded file keys
        setSubmittedFiles(prev => {
          const updated = new Set(prev);
          result.uploaded.forEach(fileKey => {
            updated.add(fileKey);
          });
          return updated;
        });
        
        // Refresh past submissions to update progress bar and ensure consistency
        try {
          const res = await fetch(`http://localhost:5000/submissions/${username}`);
          const data = await res.json();
          if (data && data.success) {
            setPastSubmissions(data);
            
            // Update submittedFiles based on actual submissions
            const submittedFileKeys = new Set();
            console.log(`[Submit] Processing submissions after upload:`, data.submissions);
            
            if (data.submissions && Array.isArray(data.submissions)) {
              data.submissions.forEach((submission, subIndex) => {
                console.log(`[Submit] Processing submission ${subIndex}:`, submission);
                if (submission.files && Array.isArray(submission.files)) {
                  submission.files.forEach((file, fileIndex) => {
                    const filename = typeof file === 'string' ? file : (file.filename || file);
                    const fileKey =
                      (file && typeof file === "object" && file.fieldName) ||
                      (filename && filename.match(/^([^_]+)_/)?.[1]);
                    console.log(`[Submit] File ${fileIndex}:`, file, '-> filename:', filename, '-> key:', fileKey);
                    if (fileKey) {
                      submittedFileKeys.add(fileKey);
                    } else if (filename) {
                      console.warn(`[Submit] Could not extract file key from filename: ${filename}`);
                    }
                  });
                } else {
                  console.warn(`[Submit] Submission ${subIndex} has no files array:`, submission);
                }
              });
            } else {
              console.warn(`[Submit] No submissions array found in data:`, data);
            }
            
            console.log(`[Submit] Final extracted file keys after upload:`, Array.from(submittedFileKeys));
            
            // Also check phases structure (more comprehensive check)
            if (phases && phases.length > 0 && data.submissions) {
              phases.forEach(phase => {
                phase.reviews.forEach(review => {
                  review.documents.forEach(doc => {
                    // Check if this document key was submitted by matching filename patterns
                    const filenamePattern = new RegExp(`^${doc.key}_`);
                    const hasFile = data.submissions.some(sub => {
                      if (!sub.files || !Array.isArray(sub.files)) return false;
                      return sub.files.some(f => {
                        const filename = typeof f === 'string' ? f : (f.filename || f);
                        return filename && filenamePattern.test(filename);
                      });
                    });
                    if (hasFile) {
                      submittedFileKeys.add(doc.key);
                    }
                  });
                });
              });
            }
            
            setSubmittedFiles(submittedFileKeys);
          }
        } catch (e) {
          console.error("Failed to refresh past submissions", e);
        }
        
        // Refresh team progress after submission
        try {
          const progressRes = await fetch(`http://localhost:5000/team/progress/${username}`);
          const progressData = await progressRes.json();
          if (progressData && progressData.success) {
            setTeamProgress(progressData);
          }
        } catch (e) {
          console.error("Failed to refresh team progress", e);
        }
        
        // Refresh all submissions list if user is on View All tab
        if (activeTab === "viewAll") {
          fetchAllSubmissions();
        }
        
        // Show success notification
        setNotification({ show: true, message: "Files submitted", type: "success" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
        const emptyFiles = {};
        fileTypes.forEach(ft => {
          emptyFiles[ft.key] = null;
        });
        setFiles(emptyFiles);
      } else {
        alert("Upload failed!");
        console.error(result);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Could not connect to the server!");
    }
  };

  const previewOverlay = !isPreviewVisible
    ? null
    : (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 4000,
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              backgroundColor: "rgba(17, 24, 39, 0.95)",
              borderRadius: "18px",
              padding: "0",
              width: "90vw",
              maxWidth: "1200px",
              height: "90vh",
              display: "grid",
              gridTemplateRows: "auto 1fr auto",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 15px 60px rgba(0, 0, 0, 0.55)",
            }}
          >
            <button
              onClick={closePreview}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "rgba(30, 41, 59, 0.9)",
                border: "none",
                color: "#fff",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                fontSize: "1.4rem",
                fontWeight: "bold",
                cursor: "pointer",
                lineHeight: 1,
              }}
              aria-label="Close preview"
            >
              ×
            </button>
            <h2
              style={{
              margin: "0",
              padding: "20px 56px 16px 28px",
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#93c5fd",
              borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 64, 175, 0.35))",
              }}
            >
              {previewTitle || "Document Preview"}
            </h2>
            {previewLoading ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "1.1rem",
                }}
              >
                Loading preview…
              </div>
            ) : previewError ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f87171",
                  fontSize: "1rem",
                  textAlign: "center",
                  padding: "32px",
                }}
              >
                {previewError}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(15, 23, 42, 0.75)",
                  padding: "18px",
                }}
              >
                {(() => {
                  const source = previewUrl || previewSourceUrl;
                  if (!source) {
                    return (
                      <div style={{ color: "#cbd5f5" }}>
                        Preview unavailable.
                      </div>
                    );
                  }
                  if (previewFile?.mimetype?.startsWith("image/")) {
                    return (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#111827",
                          borderRadius: "12px",
                          overflow: "hidden",
                          boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
                        }}
                      >
                        <img
                          src={source}
                          alt={previewTitle || "Preview"}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    );
                  }
                  const isPdf =
                    previewFile?.mimetype?.includes("pdf") ||
                    source.toLowerCase().endsWith(".pdf");
                  if (isPdf) {
                    return (
                      <iframe
                        src={`${source}#toolbar=1&navpanes=0`}
                        title={previewTitle || "Preview"}
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                          borderRadius: "12px",
                          backgroundColor: "#1f2937",
                          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.6)",
                        }}
                      />
                    );
                  }
                  return (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "12px",
                        backgroundColor: "#0f172a",
                        color: "#e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: "12px",
                        padding: "24px",
                        boxShadow: "0 20px 60px rgba(15, 23, 42, 0.6)",
                      }}
                    >
                      <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                        Preview not available
                      </div>
                      <div style={{ fontSize: "0.95rem", color: "#cbd5f5" }}>
                        Use Download or Open in new tab to view this file.
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            {(previewUrl || previewSourceUrl) && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 24px",
                  borderTop: "1px solid rgba(148, 163, 184, 0.15)",
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                }}
              >
                <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                  {previewFile?.filename || ""}
                </span>
                <a
                  href={previewSourceUrl || previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#93c5fd",
                    textDecoration: "underline",
                    fontWeight: "500",
                  }}
                >
                  Open in new tab
                </a>
              </div>
            )}
          </div>
        </div>
      );

  // ---------------- LOGIN PAGE ----------------
  if (!loggedIn) {
    // Smooth scroll function with easing
    const smoothScrollTo = (targetElement, offset = 0) => {
      const leftPanel = document.querySelector('[data-left-panel]');
      if (!leftPanel || !targetElement) return;
      
      const targetPosition = targetElement.offsetTop - offset;
      const startPosition = leftPanel.scrollTop;
      const distance = targetPosition - startPosition;
      const duration = 1500; // 1.5 seconds for slower, more pleasing scroll
      let startTime = null;
      
      // Easing function for smooth acceleration/deceleration
      const easeInOutCubic = (t) => {
        return t < 0.5 
          ? 4 * t * t * t 
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };
      
      const animation = (currentTime) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = easeInOutCubic(progress);
        
        leftPanel.scrollTop = startPosition + distance * ease;
        setScrollY(leftPanel.scrollTop);
        
        if (progress < 1) {
          requestAnimationFrame(animation);
        }
      };
      
      requestAnimationFrame(animation);
    };

    // Calculate fade opacity based on scroll position
    const calculateOpacity = (baseScroll = 0) => {
      const fadeStart = baseScroll;
      const fadeEnd = baseScroll + 400;
      if (scrollY < fadeStart) return 1;
      if (scrollY > fadeEnd) return 0;
      return 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart);
    };

    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
          {/* Left Side - Content Area (100%) */}
          <div
            data-left-panel
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "transparent",
              display: "flex",
              flexDirection: "column",
              padding: "30px",
              position: "relative",
              zIndex: 5,
              overflowY: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            onScroll={(e) => {
              setScrollY(e.target.scrollTop);
            }}
          >
          <style>{`
            [data-left-panel]::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "30px" }}>
            <img
              src="/clgL.png"
              alt="College Logo"
            style={{
              width: "160px",
              height: "80px",
              objectFit: "contain",
            }}
            />
          </div>

          {/* Floating Buttons - Top Right */}
            <button
              onClick={() => {
                const contactWindow = window.open(
                  "",
                  "Contact Us - PES University",
                  `width=${screen.width},height=${screen.height},resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
                );
                if (contactWindow) {
                  // Maximize the window
                  contactWindow.moveTo(0, 0);
                  contactWindow.resizeTo(screen.width, screen.height);
                  
                  contactWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>Contact Us - PES University</title>
                        <style>
                          * { margin: 0; padding: 0; box-sizing: border-box; }
                          body {
                            font-family: 'Montserrat', sans-serif;
                            background: #ffffff;
                            color: #1a1a1a;
                            padding: 60px 40px;
                            line-height: 1.6;
                          }
                          .container {
                            max-width: 1200px;
                            margin: 0 auto;
                          }
                          h1 {
                            font-size: 3rem;
                            color: #000000;
                            margin-bottom: 50px;
                            text-align: center;
                          }
                          h2 {
                            font-size: 2.5rem;
                            color: #1a1a1a;
                            margin-bottom: 30px;
                            margin-top: 60px;
                          }
                          .section {
                            margin-bottom: 60px;
                            padding: 40px;
                            background: #f9f9f9;
                            border-radius: 12px;
                            border-left: 4px solid #0066cc;
                          }
                          p {
                            margin-bottom: 15px;
                            font-size: 1.1rem;
                            color: #333333;
                          }
                          .contact-info {
                            margin-top: 20px;
                          }
                          .contact-info strong {
                            color: #1a1a1a;
                            display: block;
                            margin-bottom: 10px;
                            font-size: 1.2rem;
                          }
                          .contact-info div {
                            padding-left: 20px;
                            margin-bottom: 20px;
                            font-size: 1.1rem;
                            color: #333333;
                          }
                          .contact-info a {
                            color: #0066cc;
                            text-decoration: none;
                            transition: all 0.2s ease;
                          }
                          .contact-info a:hover {
                            text-decoration: underline;
                            color: #004499;
                          }
                          .close-btn {
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #ef4444;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 1rem;
                            font-weight: bold;
                            z-index: 1000;
                          }
                          .close-btn:hover {
                            background: #dc2626;
                          }
                        </style>
                      </head>
                      <body>
                        <button class="close-btn" onclick="window.close()">Close</button>
                        <div style="display: flex; align-items: flex-start; margin-bottom: 30px; padding: 0 40px;">
                          <img src="/clgL.png" alt="College Logo" style="width: 160px; height: 80px; object-fit: contain;" />
                        </div>
                        <div class="container">
                          <h1>About Us & Contact Information</h1>
                          
                          <div class="section">
                            <h2>About Us</h2>
                            <p>
                              PES University is a leading institution committed to academic excellence and innovation. 
                              We provide a platform for students to manage their academic submissions, track deadlines, 
                              and collaborate effectively with their teams.
                            </p>
                            <p>
                              Our mission is to empower students with cutting-edge technology and resources to excel in 
                              their academic journey and prepare them for successful careers in their chosen fields.
                            </p>
                          </div>

                          <div class="section">
                            <h2>Contact Us</h2>
                            <div class="contact-info">
                              <strong>Phone Numbers:</strong>
                              <div>
                                +91 80 26721983<br>
                                +91 80 26722108
                              </div>
                              
                              <strong>Email:</strong>
                              <div>
                                <a href="mailto:admissions@pes.edu">admissions@pes.edu</a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </body>
                    </html>
                  `);
                  contactWindow.document.close();
                  // Ensure window is maximized after content loads
                  setTimeout(() => {
                    contactWindow.moveTo(0, 0);
                    contactWindow.resizeTo(screen.width, screen.height);
                  }, 100);
                }
              }}
              style={{
                position: "fixed",
                top: "30px",
                right: "30px",
                padding: "16px 32px",
                backgroundColor: "#0066cc",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontWeight: "700",
                cursor: "pointer",
                fontSize: "18px",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                minWidth: "140px",
                boxShadow: "0 4px 20px rgba(0, 102, 204, 0.4)",
                zIndex: 1000,
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.05) translateY(-2px)";
                e.target.style.boxShadow = "0 6px 30px rgba(0, 102, 204, 0.6)";
                e.target.style.backgroundColor = "#0052a3";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1) translateY(0)";
                e.target.style.boxShadow = "0 4px 20px rgba(0, 102, 204, 0.4)";
                e.target.style.backgroundColor = "#0066cc";
              }}
            >
              Contact Us
            </button>
            <button
              onClick={() => {
                const faqWindow = window.open(
                  "",
                  "FAQs - How to Use the Portal",
                  `width=${screen.width},height=${screen.height},resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
                );
                if (faqWindow) {
                  // Maximize the window
                  faqWindow.moveTo(0, 0);
                  faqWindow.resizeTo(screen.width, screen.height);
                  faqWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>FAQs - How to Use the Portal</title>
                        <style>
                          * { margin: 0; padding: 0; box-sizing: border-box; }
                          body {
                            font-family: 'Montserrat', sans-serif;
                            background: #ffffff;
                            color: #1a1a1a;
                            padding: 40px;
                            line-height: 1.6;
                          }
                          .container {
                            max-width: 1200px;
                            margin: 0 auto;
                          }
                          h1 {
                            font-size: 3rem;
                            color: #000000;
                            margin-bottom: 40px;
                            text-align: center;
                          }
                          h2 {
                            font-size: 2.5rem;
                            color: #000000;
                            margin-bottom: 25px;
                            margin-top: 40px;
                          }
                          h3 {
                            font-size: 2rem;
                            color: #1a1a1a;
                            margin-bottom: 15px;
                          }
                          .step {
                            margin-bottom: 60px;
                            display: flex;
                            gap: 40px;
                            align-items: flex-start;
                            padding: 30px;
                            background: #f9f9f9;
                            border-radius: 12px;
                            border-left: 4px solid #000000;
                          }
                          .step-content {
                            flex: 1;
                          }
                          .step-image {
                            flex: 1;
                            display: flex;
                            justify-content: center;
                            align-items: flex-start;
                          }
                          .step-image img {
                            max-width: 100%;
                            height: auto;
                            border-radius: 12px;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                          }
                          p {
                            margin-bottom: 12px;
                            font-size: 1.1rem;
                            color: #333333;
                          }
                          strong {
                            color: #000000;
                          }
                          .close-btn {
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #ef4444;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 1rem;
                            font-weight: bold;
                            z-index: 1000;
                          }
                          .close-btn:hover {
                            background: #dc2626;
                          }
                          .action-buttons {
                            display: flex;
                            gap: 20px;
                            justify-content: center;
                            align-items: center;
                            margin: 40px 0;
                            flex-wrap: wrap;
                            position: sticky;
                            top: 0;
                            background: #ffffff;
                            padding: 20px;
                            z-index: 100;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                          }
                          .action-btn {
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            padding: 14px 28px;
                            background: #f0f0f0;
                            color: #1a1a1a;
                            border: 2px solid #d0d0d0;
                            border-radius: 8px;
                            font-size: 1.1rem;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                            text-decoration: none;
                          }
                          .action-btn:hover {
                            background: #000000;
                            color: white;
                            border-color: #000000;
                            transform: translateY(-2px);
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                          }
                          .action-btn svg {
                            width: 20px;
                            height: 20px;
                          }
                          html {
                            scroll-behavior: smooth;
                          }
                        </style>
                        <script>
                          function smoothScrollTo(element, offset = 30) {
                            if (!element) return;
                            const elementPosition = element.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - offset;
                            window.scrollTo({
                              top: offsetPosition,
                              behavior: 'smooth'
                            });
                          }
                        </script>
                      </head>
                      <body>
                        <button class="close-btn" onclick="window.close()">Close</button>
                        <div style="display: flex; align-items: flex-start; margin-bottom: 30px; padding: 0 40px;">
                          <img src="/clgL.png" alt="College Logo" style="width: 160px; height: 80px; object-fit: contain;" />
                        </div>
                        <div class="container">
                          <h1>How to Use the Portal</h1>
                          
                          <div class="action-buttons">
                            <a href="#login-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('login-section'); smoothScrollTo(el, 30);">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                              </svg>
                              <span>Login</span>
                            </a>
                            <a href="#submit-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('submit-section'); smoothScrollTo(el, 30);">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                              </svg>
                              <span>Submit</span>
                            </a>
                            <a href="#view-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('view-section'); smoothScrollTo(el, 30);">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                              <span>View</span>
                            </a>
                            <a href="#chatbot-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('chatbot-section'); smoothScrollTo(el, 30);">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                              </svg>
                              <span>Chatbot</span>
                            </a>
                          </div>
                          
                          <div id="login-section" class="step">
                            <div class="step-content">
                              <h3>Login to Your Account</h3>
                              <p>• Enter your credentials on the login form displayed on the main page</p>
                              <p>• <strong>Students:</strong> TeamNo_PassoutYear / Password: 1234</p>
                              <p>• <strong>Admins:</strong> admin / Password: admin123</p>
                              <p>• <strong>Mentors:</strong> mentor_username / Password: mentor123</p>
                            </div>
                            <div class="step-image">
                              <img src="/1.png" alt="Login Tutorial" />
                            </div>
                          </div>

                          <div id="submit-section" class="step">
                            <div class="step-content">
                              <h3>Submit Your Files</h3>
                              <p>• After logging in, you'll see the submission form on your dashboard</p>
                              <p>• Upload all required file types for your current phase and review</p>
                              <p>• Click <strong>"Submit Files"</strong> when all files are uploaded</p>
                              <p>• Make sure to submit before the deadline to avoid late submission</p>
                            </div>
                            <div class="step-image">
                              <img src="/2.png" alt="Upload Tutorial" />
                            </div>
                          </div>

                          <div id="view-section" class="step">
                            <div class="step-content">
                              <h3>View Your Submissions</h3>
                              <p>• Click <strong>"View My Past Submissions"</strong> to see your submission history</p>
                              <p>• Check submission status (On-time or Late)</p>
                              <p>• View details of each submission including timestamps and file information</p>
                              <p>• Track your progress across different phases and reviews</p>
                            </div>
                            <div class="step-image">
                              <img src="/3.png" alt="Submissions Tutorial" />
                            </div>
                          </div>

                          <div id="chatbot-section" class="step">
                            <div class="step-content">
                              <h3>Use the Chatbot</h3>
                              <p>• Click the chatbot button on your dashboard to open the chat assistant</p>
                              <p>• Ask questions about your project, research topics, or any academic queries</p>
                              <p>• The chatbot uses RAG (Retrieval Augmented Generation) to provide accurate answers</p>
                              <p>• Get instant help with your questions 24/7 without waiting for human assistance</p>
                            </div>
                            <div class="step-image">
                              <img src="/4.png" alt="Chatbot Tutorial" />
                            </div>
                          </div>

                          <div style="margin-top: 60px; padding: 30px; background: #f0f7ff; border-radius: 12px; border-left: 4px solid #000000;">
                            <h2>Need Help?</h2>
                            <p>If you encounter any issues or have questions, please contact:</p>
                            <p><strong>Email:</strong> <a href="mailto:admissions@pes.edu" style="color: #000000;">admissions@pes.edu</a></p>
                            <p><strong>Phone:</strong> +91 80 26721983 or +91 80 26722108</p>
                          </div>
                        </div>
                      </body>
                    </html>
                  `);
                  faqWindow.document.close();
                  // Ensure window is maximized after content loads
                  setTimeout(() => {
                    faqWindow.moveTo(0, 0);
                    faqWindow.resizeTo(screen.width, screen.height);
                  }, 100);
                }
              }}
              style={{
                position: "fixed",
                top: "30px",
                right: "230px",
                padding: "16px 32px",
                backgroundColor: "#0066cc",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontWeight: "700",
                cursor: "pointer",
                fontSize: "18px",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                minWidth: "140px",
                boxShadow: "0 4px 20px rgba(0, 102, 204, 0.4)",
                zIndex: 1000,
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.05) translateY(-2px)";
                e.target.style.boxShadow = "0 6px 30px rgba(0, 102, 204, 0.6)";
                e.target.style.backgroundColor = "#0052a3";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1) translateY(0)";
                e.target.style.boxShadow = "0 4px 20px rgba(0, 102, 204, 0.4)";
                e.target.style.backgroundColor = "#0066cc";
              }}
            >
              FAQs
            </button>

          {/* Main Content */}
          <div style={{ display: "flex", flexDirection: "column", color: "#1a1a1a", height: "100vh", justifyContent: "space-between", overflow: "hidden" }}>
            {/* Login Form - Displayed on Front Page */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              flex: 1,
              paddingTop: "100px",
              paddingBottom: "120px",
            }}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await handleLogin(e);
                }}
                style={{
                  backgroundColor: "#ffffff",
                  padding: "50px 45px",
                  borderRadius: "24px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                  width: "420px",
                  maxWidth: "90vw",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  border: "2px solid #e0e0e0",
                  position: "relative",
                }}
              >
                <h2 
                  style={{ 
                    marginBottom: "30px", 
                    color: "#1a1a1a", 
                    fontSize: "2rem", 
                    fontWeight: "bold",
                    letterSpacing: "1px",
                  }}
                >
                  Login
                </h2>

                <div style={{ marginBottom: "24px", position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "18px 20px",
                      margin: 0,
                      borderRadius: "12px",
                      border: "2px solid #d0d0d0",
                      fontSize: "16px",
                      height: "56px",
                      backgroundColor: "#ffffff",
                      color: "#1a1a1a",
                      boxSizing: "border-box",
                      display: "block",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0066cc";
                      e.target.style.backgroundColor = "#ffffff";
                      e.target.style.boxShadow = "0 0 0 3px rgba(0, 102, 204, 0.1)";
                      e.target.style.outline = "none";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d0d0d0";
                      e.target.style.backgroundColor = "#ffffff";
                      e.target.style.boxShadow = "none";
                    }}
                    className="login-form-input"
                  />
                </div>

                <div style={{ marginBottom: "28px", position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "18px 50px 18px 20px",
                      margin: 0,
                      borderRadius: "12px",
                      border: "2px solid #d0d0d0",
                      fontSize: "16px",
                      height: "56px",
                      backgroundColor: "#ffffff",
                      color: "#1a1a1a",
                      boxSizing: "border-box",
                      display: "block",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0066cc";
                      e.target.style.backgroundColor = "#ffffff";
                      e.target.style.boxShadow = "0 0 0 3px rgba(0, 102, 204, 0.1)";
                      e.target.style.outline = "none";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d0d0d0";
                      e.target.style.backgroundColor = "#ffffff";
                      e.target.style.boxShadow = "none";
                    }}
                    className="login-form-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "5px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "opacity 0.3s ease",
                      opacity: "0.7",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
                  >
                    {showPassword ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "18px",
                    backgroundColor: "#0066cc",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "18px",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 4px 12px rgba(0, 102, 204, 0.3)",
                    marginBottom: "24px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#0052a3";
                    e.target.style.transform = "translateY(-2px) scale(1.02)";
                    e.target.style.boxShadow = "0 6px 16px rgba(0, 102, 204, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#0066cc";
                    e.target.style.transform = "translateY(0) scale(1)";
                    e.target.style.boxShadow = "0 4px 12px rgba(0, 102, 204, 0.3)";
                  }}
                  onFocus={(e) => {
                    e.target.style.outline = "2px solid #0066cc";
                    e.target.style.outlineOffset = "2px";
                  }}
                  onBlur={(e) => {
                    e.target.style.outline = "none";
                  }}
                >
                  Login
                </button>
              </form>
            </div>

            {/* Company Logos Scrolling Bar - Fixed at Bottom */}
            <div style={{
              overflow: "hidden",
              position: "fixed",
              bottom: "0",
              left: "0",
              width: "100%",
              padding: "40px 0",
              backgroundColor: "#ffffff",
              maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
              zIndex: 10,
            }}>
              <style>{`
                @keyframes scrollLogos {
                  0% {
                    transform: translateX(0);
                  }
                  100% {
                    transform: translateX(-50%);
                  }
                }
              `}</style>
              <div 
                style={{
                  display: "flex",
                  gap: "120px",
                  alignItems: "center",
                  width: "max-content",
                  animation: "scrollLogos 40s linear infinite",
                  whiteSpace: "nowrap",
                  willChange: "transform",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.animationPlayState = "paused";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.animationPlayState = "running";
                }}
              >
                {[
                  "NAAC Accredited",
                  "Top 50 Engineering",
                  "500+ Companies",
                  "50,000+ Alumni",
                  "Research Excellence",
                  "Industry Partners",
                  "KUKA Lab",
                  "Innovation Hub"
                ].concat([
                  "NAAC Accredited",
                  "Top 50 Engineering",
                  "500+ Companies",
                  "50,000+ Alumni",
                  "Research Excellence",
                  "Industry Partners",
                  "KUKA Lab",
                  "Innovation Hub"
                ]).map((item, index) => (
                  <div
                    key={index}
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: "500",
                      color: "#333333",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      minWidth: "fit-content",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#0066cc";
                      e.currentTarget.style.textShadow = "none";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#333333";
                      e.currentTarget.style.textShadow = "none";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- MENTOR DASHBOARD ----------------
  if (userType === "mentor") {
    return (
      <div style={{
        background: "#ffffff",
        height: "100vh", width: "100vw",
        position: "relative", color: "#1a1a1a", fontFamily: "sans-serif", overflow: "auto"
      }}>
        {previewOverlay}

        <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", padding: "20px" }}>
          {/* Top Bar - Logo and Buttons */}
          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "30px" }}>
            <img
              src="/clgL.png"
              alt="College Logo"
              style={{
                width: "160px",
                height: "80px",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Floating Buttons - Top Right */}
          <button
            onClick={() => {
              const contactWindow = window.open(
                "",
                "Contact Us - PES University",
                `width=${screen.width},height=${screen.height},resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
              );
              if (contactWindow) {
                contactWindow.moveTo(0, 0);
                contactWindow.resizeTo(screen.width, screen.height);
                contactWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>Contact Us - PES University</title>
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                          font-family: 'Montserrat', sans-serif;
                          background: #ffffff;
                          color: #1a1a1a;
                          padding: 60px 40px;
                          line-height: 1.6;
                        }
                        .container {
                          max-width: 1200px;
                          margin: 0 auto;
                        }
                        h1 {
                          font-size: 3rem;
                          color: #000000;
                          margin-bottom: 50px;
                          text-align: center;
                        }
                        h2 {
                          font-size: 2.5rem;
                          color: #1a1a1a;
                          margin-bottom: 30px;
                          margin-top: 60px;
                        }
                        .section {
                          margin-bottom: 60px;
                          padding: 40px;
                          background: #f9f9f9;
                          border-radius: 12px;
                          border-left: 4px solid #0066cc;
                        }
                        p {
                          margin-bottom: 15px;
                          font-size: 1.1rem;
                          color: #333333;
                        }
                        .contact-info {
                          margin-top: 20px;
                        }
                        .contact-info strong {
                          color: #1a1a1a;
                          display: block;
                          margin-bottom: 10px;
                          font-size: 1.2rem;
                        }
                        .contact-info div {
                          padding-left: 20px;
                          margin-bottom: 20px;
                          font-size: 1.1rem;
                          color: #333333;
                        }
                        .contact-info a {
                          color: #0066cc;
                          text-decoration: none;
                          transition: all 0.2s ease;
                        }
                        .contact-info a:hover {
                          text-decoration: underline;
                          color: #004499;
                        }
                        .close-btn {
                          position: fixed;
                          top: 20px;
                          right: 20px;
                          background: #ef4444;
                          color: white;
                          border: none;
                          padding: 12px 24px;
                          border-radius: 8px;
                          cursor: pointer;
                          font-size: 1rem;
                          font-weight: bold;
                          z-index: 1000;
                        }
                        .close-btn:hover {
                          background: #dc2626;
                        }
                      </style>
                    </head>
                    <body>
                      <button class="close-btn" onclick="window.close()">✕ Close</button>
                      <div style="display: flex; align-items: flex-start; margin-bottom: 30px; padding: 0 40px;">
                        <img src="/clgL.png" alt="College Logo" style="width: 160px; height: 80px; object-fit: contain;" />
                      </div>
                      <div class="container">
                        <h1>About Us & Contact Information</h1>
                        
                        <div class="section">
                          <h2>About Us</h2>
                          <p>
                            PES University is a leading institution committed to academic excellence and innovation. 
                            We provide a platform for students to manage their academic submissions, track deadlines, 
                            and collaborate effectively with their teams.
                          </p>
                          <p>
                            Our mission is to empower students with cutting-edge technology and resources to excel in 
                            their academic journey and prepare them for successful careers in their chosen fields.
                          </p>
                        </div>

                        <div class="section">
                          <h2>Contact Us</h2>
                          <div class="contact-info">
                            <strong>Phone Numbers:</strong>
                            <div>
                              +91 80 26721983<br>
                              +91 80 26722108
                            </div>
                            
                            <strong>Email:</strong>
                            <div>
                              <a href="mailto:admissions@pes.edu">admissions@pes.edu</a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </body>
                  </html>
                `);
                contactWindow.document.close();
                setTimeout(() => {
                  contactWindow.moveTo(0, 0);
                  contactWindow.resizeTo(screen.width, screen.height);
                }, 100);
              }
            }}
            style={{
              position: "fixed",
              top: "30px",
              right: "30px",
              padding: "16px 32px",
              backgroundColor: "#0066cc",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "18px",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              minWidth: "140px",
              boxShadow: "0 4px 20px rgba(0, 102, 204, 0.4)",
              zIndex: 1000,
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05) translateY(-2px)";
              e.target.style.boxShadow = "0 6px 30px rgba(0, 102, 204, 0.6)";
              e.target.style.backgroundColor = "#0052a3";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1) translateY(0)";
              e.target.style.boxShadow = "0 4px 20px rgba(0, 102, 204, 0.4)";
              e.target.style.backgroundColor = "#0066cc";
            }}
          >
            Contact Us
          </button>
          <button
            onClick={() => {
              const faqWindow = window.open(
                "",
                "FAQs - How to Use the Portal",
                `width=${screen.width},height=${screen.height},resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
              );
              if (faqWindow) {
                faqWindow.moveTo(0, 0);
                faqWindow.resizeTo(screen.width, screen.height);
                faqWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>FAQs - How to Use the Portal</title>
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                          font-family: 'Montserrat', sans-serif;
                          background: #ffffff;
                          color: #1a1a1a;
                          padding: 40px;
                          line-height: 1.6;
                        }
                        .container {
                          max-width: 1200px;
                          margin: 0 auto;
                        }
                        h1 {
                          font-size: 3rem;
                          color: #000000;
                          margin-bottom: 40px;
                          text-align: center;
                        }
                        h2 {
                          font-size: 2.5rem;
                          color: #000000;
                          margin-bottom: 25px;
                          margin-top: 40px;
                        }
                        h3 {
                          font-size: 2rem;
                          color: #1a1a1a;
                          margin-bottom: 15px;
                        }
                        .step {
                          margin-bottom: 60px;
                          display: flex;
                          gap: 40px;
                          align-items: flex-start;
                          padding: 30px;
                          background: #f9f9f9;
                          border-radius: 12px;
                          border-left: 4px solid #000000;
                        }
                        .step-content {
                          flex: 1;
                        }
                        .step-image {
                          flex: 1;
                          display: flex;
                          justify-content: center;
                          align-items: flex-start;
                        }
                        .step-image img {
                          max-width: 100%;
                          height: auto;
                          border-radius: 12px;
                          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        }
                        p {
                          margin-bottom: 12px;
                          font-size: 1.1rem;
                          color: #333333;
                        }
                        strong {
                          color: #000000;
                        }
                        .close-btn {
                          position: fixed;
                          top: 20px;
                          right: 20px;
                          background: #ef4444;
                          color: white;
                          border: none;
                          padding: 12px 24px;
                          border-radius: 8px;
                          cursor: pointer;
                          font-size: 1rem;
                          font-weight: bold;
                          z-index: 1000;
                        }
                        .close-btn:hover {
                          background: #dc2626;
                        }
                        .action-buttons {
                          display: flex;
                          gap: 20px;
                          justify-content: center;
                          align-items: center;
                          margin: 40px 0;
                          flex-wrap: wrap;
                          position: sticky;
                          top: 0;
                          background: #ffffff;
                          padding: 20px;
                          z-index: 100;
                          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        }
                        .action-btn {
                          display: flex;
                          align-items: center;
                          gap: 12px;
                          padding: 14px 28px;
                          background: #f0f0f0;
                          color: #1a1a1a;
                          border: 2px solid #d0d0d0;
                          border-radius: 8px;
                          font-size: 1.1rem;
                          font-weight: 500;
                          cursor: pointer;
                          transition: all 0.3s ease;
                          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                          text-decoration: none;
                        }
                        .action-btn:hover {
                          background: #000000;
                          color: white;
                          border-color: #000000;
                          transform: translateY(-2px);
                          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                        }
                        .action-btn svg {
                          width: 20px;
                          height: 20px;
                        }
                        html {
                          scroll-behavior: smooth;
                        }
                      </style>
                      <script>
                        function smoothScrollTo(element, offset = 30) {
                          if (!element) return;
                          const elementPosition = element.getBoundingClientRect().top;
                          const offsetPosition = elementPosition + window.pageYOffset - offset;
                          window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                          });
                        }
                      </script>
                    </head>
                    <body>
                      <button class="close-btn" onclick="window.close()">✕ Close</button>
                      <div style="display: flex; align-items: flex-start; margin-bottom: 30px; padding: 0 40px;">
                        <img src="/clgL.png" alt="College Logo" style="width: 160px; height: 80px; object-fit: contain;" />
                      </div>
                      <div class="container">
                        <h1>How to Use the Portal</h1>
                        
                        <div class="action-buttons">
                          <a href="#login-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('login-section'); smoothScrollTo(el, 30);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <span>Login</span>
                          </a>
                          <a href="#submit-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('submit-section'); smoothScrollTo(el, 30);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            <span>Submit</span>
                          </a>
                          <a href="#view-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('view-section'); smoothScrollTo(el, 30);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>View</span>
                          </a>
                          <a href="#chatbot-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('chatbot-section'); smoothScrollTo(el, 30);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>Chatbot</span>
                          </a>
                        </div>
                        
                        <div id="login-section" class="step">
                          <div class="step-content">
                            <h3>Login to Your Account</h3>
                            <p>• Enter your credentials on the login form displayed on the main page</p>
                            <p>• <strong>Students:</strong> TeamNo_PassoutYear / Password: 1234</p>
                            <p>• <strong>Admins:</strong> admin / Password: admin123</p>
                            <p>• <strong>Mentors:</strong> mentor_username / Password: mentor123</p>
                          </div>
                          <div class="step-image">
                            <img src="/1.png" alt="Login Tutorial" />
                          </div>
                        </div>

                        <div id="submit-section" class="step">
                          <div class="step-content">
                            <h3>Submit Your Files</h3>
                            <p>• After logging in, you'll see the submission form on your dashboard</p>
                            <p>• Upload all required file types for your current phase and review</p>
                            <p>• Click <strong>"Submit Files"</strong> when all files are uploaded</p>
                            <p>• Make sure to submit before the deadline to avoid late submission</p>
                          </div>
                          <div class="step-image">
                            <img src="/2.png" alt="Upload Tutorial" />
                          </div>
                        </div>

                        <div id="view-section" class="step">
                          <div class="step-content">
                            <h3>View Your Submissions</h3>
                            <p>• Click <strong>"View My Past Submissions"</strong> to see your submission history</p>
                            <p>• Check submission status (On-time or Late)</p>
                            <p>• View details of each submission including timestamps and file information</p>
                            <p>• Track your progress across different phases and reviews</p>
                          </div>
                          <div class="step-image">
                            <img src="/3.png" alt="Submissions Tutorial" />
                          </div>
                        </div>

                        <div id="chatbot-section" class="step">
                          <div class="step-content">
                            <h3>Use the Chatbot</h3>
                            <p>• Click the chatbot button on your dashboard to open the chat assistant</p>
                            <p>• Ask questions about your project, research topics, or any academic queries</p>
                            <p>• The chatbot uses RAG (Retrieval Augmented Generation) to provide accurate answers</p>
                            <p>• Get instant help with your questions 24/7 without waiting for human assistance</p>
                          </div>
                          <div class="step-image">
                            <img src="/4.png" alt="Chatbot Tutorial" />
                          </div>
                        </div>

                        <div style="margin-top: 60px; padding: 30px; background: #f0f7ff; border-radius: 12px; border-left: 4px solid #000000;">
                          <h2>Need Help?</h2>
                          <p>If you encounter any issues or have questions, please contact:</p>
                          <p><strong>Email:</strong> <a href="mailto:admissions@pes.edu" style="color: #000000;">admissions@pes.edu</a></p>
                          <p><strong>Phone:</strong> +91 80 26721983 or +91 80 26722108</p>
                        </div>
                      </div>
                    </body>
                  </html>
                `);
                faqWindow.document.close();
                setTimeout(() => {
                  faqWindow.moveTo(0, 0);
                  faqWindow.resizeTo(screen.width, screen.height);
                }, 100);
              }
            }}
            style={{
              position: "fixed",
              top: "30px",
              right: "230px",
              padding: "16px 32px",
              backgroundColor: "#0066cc",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "18px",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              minWidth: "140px",
              boxShadow: "0 4px 20px rgba(0, 102, 204, 0.4)",
              zIndex: 1000,
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05) translateY(-2px)";
              e.target.style.boxShadow = "0 6px 30px rgba(0, 102, 204, 0.6)";
              e.target.style.backgroundColor = "#0052a3";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1) translateY(0)";
              e.target.style.boxShadow = "0 4px 20px rgba(0, 102, 204, 0.4)";
              e.target.style.backgroundColor = "#0066cc";
            }}
          >
            FAQs
          </button>

          {/* Header Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <div style={{
              backgroundColor: "#ffffff",
              padding: "15px 25px", borderRadius: "15px", fontSize: "1.1rem", fontWeight: "500",
              border: "1px solid #e0e0e0", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0066cc" }}>
                <span> Mentor Dashboard</span>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <div style={{
                backgroundColor: "#ffffff",
                padding: "15px 25px", borderRadius: "15px", fontSize: "1.5rem", fontWeight: "bold",
                border: "1px solid #e0e0e0", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0066cc" }}>
                  <span>{time.toLocaleTimeString()}</span>
                </div>
              </div>
              
              <button onClick={handleLogout} style={{
                padding: "10px 20px",
                backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px",
                cursor: "pointer", fontWeight: "bold", fontSize: "1rem", transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#dc2626";
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#ef4444";
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "none";
              }}>Logout</button>
            </div>
          </div>

          <div style={{ padding: "50px", maxWidth: "1400px", margin: "0 auto" }}>
          {/* My Teams Section */}
          <div style={{
            backgroundColor: "#ffffff", padding: "30px", borderRadius: "15px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", marginBottom: "30px", border: "1px solid #e0e0e0"
          }}>
            <h2 style={{ margin: "0 0 20px 0", color: "#0066cc", fontSize: "1.8rem" }}>My Teams ({Object.keys(mentorTeams).length})</h2>
            
            {Object.keys(mentorTeams).length === 0 ? (
              <div style={{ color: "#666", textAlign: "center", padding: "40px" }}>
                No teams assigned yet. Teams will appear here once the admin assigns them to you.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                {Object.entries(mentorTeams).map(([teamId, team]) => (
                  <div key={teamId} style={{
                    backgroundColor: "#f5f5f5", padding: "20px", borderRadius: "10px",
                    border: "1px solid #e0e0e0", transition: "all 0.3s ease", cursor: "pointer"
                  }}
                  onClick={() => handleViewTeamSubmissions(teamId)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e3f2fd";
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 5px 15px rgba(0, 102, 204, 0.2)";
                    e.currentTarget.style.borderColor = "#0066cc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#e0e0e0";
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                      <h3 style={{ margin: 0, color: "#0066cc", fontSize: "1.3rem", fontWeight: "bold" }}>{team.teamName || teamId}</h3>
                    </div>
                    <div style={{ fontSize: "0.9rem", marginBottom: "5px", color: "#666" }}><strong style={{ color: "#1a1a1a" }}>ID:</strong> {team.teamId}</div>
                    {team.projectTitle && <div style={{ fontSize: "0.9rem", marginBottom: "5px", color: "#666" }}><strong style={{ color: "#1a1a1a" }}>Project:</strong> {team.projectTitle}</div>}
                    {team.members && team.members.length > 0 && <div style={{ fontSize: "0.9rem", marginBottom: "5px", color: "#666" }}>
                      <strong style={{ color: "#1a1a1a" }}>Members:</strong> {team.members.map(m => {
                        if (typeof m === "string") return m;
                        if (m.name && m.srn) return `${m.name} (${m.srn})`;
                        if (m.name) return m.name;
                        return "";
                      }).filter(m => m).join(", ")}
                    </div>}
                    {team.contactEmail && <div style={{ fontSize: "0.9rem", marginBottom: "5px", color: "#666" }}><strong style={{ color: "#1a1a1a" }}>Student Email:</strong> {team.contactEmail}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chatbot */}
          <>
          {/* Floating Chatbot Button */}
          <button
            onClick={() => {
              const chatWindow = window.open(
                "",
                "Chatbot",
                "width=500,height=700,resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no"
              );
              if (chatWindow) {
                chatWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>Chat Assistant</title>
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                          background: #ffffff;
                          height: 100vh;
                          display: flex;
                          flex-direction: column;
                          color: #1a1a1a;
                        }
                        .chat-header {
                          background: #f5f5f5;
                          padding: 20px;
                          border-bottom: 2px solid #e0e0e0;
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                        }
                        .chat-header h2 {
                          color: #0066cc;
                          margin: 0;
                        }
                        .chat-container {
                          flex: 1;
                          display: flex;
                          flex-direction: column;
                          position: relative;
                        }
                        .chat-messages {
                          flex: 1;
                          padding: 20px;
                          overflow-y: auto;
                          display: flex;
                          flex-direction: column;
                          gap: 15px;
                        }
                        .welcome-screen {
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          justify-content: center;
                          height: 100%;
                          padding: 40px 20px;
                        }
                        .welcome-title {
                          font-size: 2rem;
                          font-weight: 400;
                          margin-bottom: 30px;
                          color: #666;
                        }
                        .message {
                          max-width: 75%;
                          padding: 12px 16px;
                          border-radius: 18px;
                          word-wrap: break-word;
                          line-height: 1.5;
                        }
                        .user-message {
                          align-self: flex-end;
                          background: #e3f2fd;
                          color: #0066cc;
                          border: 1px solid #0066cc;
                        }
                        .bot-message {
                          align-self: flex-start;
                          background: #f5f5f5;
                          color: #1a1a1a;
                          border: 1px solid #e0e0e0;
                        }
                        .chat-input-wrapper {
                          padding: 20px;
                          display: flex;
                          justify-content: center;
                          transition: all 0.3s ease;
                        }
                        .chat-input-wrapper.centered {
                          position: absolute;
                          top: 55%;
                          left: 50%;
                          transform: translate(-50%, 0);
                          width: 100%;
                          padding: 0 20px;
                        }
                        .chat-input-container {
                          max-width: 700px;
                          width: 100%;
                          position: relative;
                          display: flex;
                          align-items: center;
                          background: #f5f5f5;
                          border-radius: 30px;
                          padding: 4px 4px 4px 20px;
                          border: 2px solid #e0e0e0;
                        }
                        .chat-input-container:focus-within {
                          border-color: #0066cc;
                        }
                        .chat-input {
                          flex: 1;
                          padding: 12px 8px;
                          border: none;
                          background: transparent;
                          color: #1a1a1a;
                          font-size: 1rem;
                          outline: none;
                        }
                        .chat-input::placeholder {
                          color: #999;
                        }
                        .send-button {
                          width: 40px;
                          height: 40px;
                          border-radius: 50%;
                          border: none;
                          background: #0066cc;
                          color: #ffffff;
                          cursor: pointer;
                          font-size: 1.2rem;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          transition: all 0.2s;
                          flex-shrink: 0;
                        }
                        .send-button:hover {
                          background: #0052a3;
                        }
                        .send-button:active {
                          transform: scale(0.95);
                        }
                      </style>
                    </head>
                    <body>
                      <div class="chat-header">
                        <h2>Chat Assistant</h2>
                        <button onclick="window.close()" style="background:none;border:none;color:#666;font-size:1.5rem;cursor:pointer;">✕</button>
                      </div>
                      <div style="display: flex; align-items: flex-start; margin-bottom: 30px; padding: 20px 20px 0 20px;">
                        <img src="/clgL.png" alt="College Logo" style="width: 160px; height: 80px; object-fit: contain;" />
                      </div>
                      <div class="chat-container">
                        <div class="chat-messages" id="messages">
                          <div class="welcome-screen">
                            <h1 class="welcome-title">What can I help with?</h1>
                          </div>
                        </div>
                        <div class="chat-input-wrapper centered" id="inputWrapper">
                          <div class="chat-input-container">
                            <input type="text" class="chat-input" id="chatInput" placeholder="Ask anything" />
                            <button class="send-button" onclick="sendMessage()">↑</button>
                          </div>
                        </div>
                      </div>
                      <script>
                        const messagesDiv = document.getElementById('messages');
                        const input = document.getElementById('chatInput');
                        const inputWrapper = document.getElementById('inputWrapper');
                        let messages = [];
                        let isFirstMessage = true;

                        input.addEventListener('keypress', (e) => {
                          if (e.key === 'Enter' && input.value.trim()) {
                            sendMessage();
                          }
                        });

                        function scrollToBottom() {
                          messagesDiv.scrollTop = messagesDiv.scrollHeight;
                        }

                        function moveInputToBottom() {
                          if (isFirstMessage) {
                            inputWrapper.classList.remove('centered');
                            isFirstMessage = false;
                          }
                        }

                        async function sendMessage() {
                          const text = input.value.trim();
                          if (!text) return;

                          moveInputToBottom();
                          addMessage('user', text);
                          input.value = '';
                          addMessage('bot', '...');

                          try {
                            const response = await fetch('http://localhost:8000/api/chat', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ message: text })
                            });

                            const data = await response.json();
                            messages = messages.slice(0, -1);

                            if (data.success) {
                              addMessage('bot', data.response);
                            } else {
                              addMessage('bot', 'Sorry, I encountered an error. Please try again.');
                            }
                          } catch (error) {
                            console.error('Chatbot error:', error);
                            messages = messages.slice(0, -1);
                            addMessage('bot', 'Sorry, I can\\'t connect to the RAG chatbot. Please make sure the backend is running.');
                          }
                        }

                        function addMessage(sender, text) {
                          messages.push({ sender, text });
                          renderMessages();
                          scrollToBottom();
                        }

                        function renderMessages() {
                          if (messages.length === 0) {
                            messagesDiv.innerHTML = '<div class="welcome-screen"><h1 class="welcome-title" style="color: #666;">What can I help with?</h1></div>';
                            return;
                          }
                          messagesDiv.innerHTML = messages.map(msg =>
                            '<div class="message ' + (msg.sender === 'user' ? 'user-message' : 'bot-message') + '">' + msg.text + '</div>'
                          ).join('');
                        }
                      </script>
                    </body>
                  </html>
                `);
                chatWindow.document.close();
              }
            }}
            style={{
              position: "fixed",
              bottom: "30px",
              right: "30px",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "#0066cc",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0, 102, 204, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              zIndex: 1000,
              transition: "transform 0.3s ease, box-shadow 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.1)";
              e.target.style.boxShadow = "0 6px 30px rgba(0, 102, 204, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "0 4px 20px rgba(0, 102, 204, 0.4)";
            }}
          >
            💬
          </button>

          {/* Team Submissions Modal */}
          {showTeamSubmissionsModal && selectedTeamSubmissions && (
            <div style={{
              position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
              alignItems: "center", zIndex: 2000
            }}>
              <div style={{
                backgroundColor: "#ffffff", padding: "40px", borderRadius: "15px",
                maxWidth: "800px", width: "90vw", maxHeight: "80vh", overflow: "auto",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)", border: "1px solid #e0e0e0"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                  <h2 style={{ margin: 0, color: "#0066cc", fontSize: "1.8rem" }}>Team Submissions</h2>
                  <button onClick={() => {
                    setShowTeamSubmissionsModal(false);
                    setSelectedTeamSubmissions(null);
                    setSelectedPhaseFilter("all"); // Reset filter when closing
                  }} style={{
                    background: "transparent", border: "none", color: "#666",
                    fontSize: "1.8rem", cursor: "pointer", fontWeight: "bold",
                    width: "35px", height: "35px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#f5f5f5";
                    e.target.style.color = "#1a1a1a";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "#666";
                  }}>
                    ✕
                  </button>
                </div>

                {/* Phase Filter */}
                <div style={{ marginBottom: "20px", display: "inline-block" }}>
                  <label style={{ display: "inline-block", marginRight: "10px", color: "#1a1a1a", fontSize: "0.9rem", fontWeight: "500" }}>
                    Filter by Phase:
                  </label>
                  <select
                    value={selectedPhaseFilter}
                    onChange={(e) => setSelectedPhaseFilter(e.target.value)}
                    style={{
                      width: "auto",
                      minWidth: "150px",
                      padding: "8px 35px 8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      backgroundColor: "#ffffff",
                      color: "#1a1a1a",
                      fontSize: "1rem",
                      cursor: "pointer",
                      transition: "border-color 0.3s ease",
                      appearance: "none",
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      backgroundSize: "12px"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0066cc";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e0e0e0";
                    }}
                  >
                    <option value="all">All Phases</option>
                    <option value="phase1">Phase 1</option>
                    <option value="phase2">Phase 2</option>
                    <option value="phase3">Phase 3</option>
                    <option value="phase4">Phase 4</option>
                  </select>
                </div>

                {(() => {
                  const allSubmissions = (selectedTeamSubmissions.submissions || []).filter(Boolean);
                  
                  // Helper function to normalize phase values for comparison
                  const normalizePhase = (phaseValue) => {
                    if (!phaseValue) return "";
                    const phaseStr = String(phaseValue).toLowerCase().trim();
                    // Extract number from phase string (handles "Phase 1", "phase1", "Phase-1", etc.)
                    const numberMatch = phaseStr.match(/\d+/);
                    if (numberMatch) {
                      return `phase${numberMatch[0]}`;
                    }
                    // If no number found, normalize the string
                    return phaseStr.replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
                  };
                  
                  // Filter submissions based on selected phase
                  const teamSubmissions = selectedPhaseFilter === "all" 
                    ? allSubmissions 
                    : allSubmissions.filter(submission => {
                        const submissionPhase = normalizePhase(submission.phase);
                        const filterPhase = normalizePhase(selectedPhaseFilter);
                        return submissionPhase === filterPhase;
                      });
                  
                  if (teamSubmissions.length === 0) {
                    return (
                      <div style={{ color: "#666", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
                        {selectedPhaseFilter === "all" 
                          ? "No submissions available yet."
                          : `No submissions found for ${selectedPhaseFilter === "phase1" ? "Phase 1" : selectedPhaseFilter === "phase2" ? "Phase 2" : selectedPhaseFilter === "phase3" ? "Phase 3" : selectedPhaseFilter === "phase4" ? "Phase 4" : formatPhaseLabel(selectedPhaseFilter)}.`}
                      </div>
                    );
                  }

                  return teamSubmissions.map((submission, idx) => (
                    <div key={submission.submissionId || idx} style={{
                      backgroundColor: "#f5f5f5", padding: "20px", borderRadius: "8px",
                      border: `1px solid ${submission.isLate ? "#ef4444" : "#22c55e"}`,
                      marginBottom: "15px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                        <div>
                          <div style={{ fontWeight: "bold", color: "#0066cc", fontSize: "1.1rem" }}>
                            Submission #{idx + 1}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "2px", textTransform: "lowercase" }}>
                            {formatPhaseLabel(submission.phase)} &nbsp;•&nbsp; {formatReviewLabel(submission.review)}
                          </div>
                        </div>
                        <div style={{
                          padding: "6px 12px", borderRadius: "6px",
                          backgroundColor: submission.isLate ? "#fee2e2" : "#dcfce7",
                          border: `1px solid ${submission.isLate ? "#ef4444" : "#22c55e"}`,
                          color: submission.isLate ? "#dc2626" : "#16a34a",
                          fontSize: "0.9rem",
                          fontWeight: "bold"
                        }}>
                          {submission.submissionType}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "15px" }}>
                        Submitted: {formatTimestamp(submission.submittedAt)}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {(submission.files || []).filter(Boolean).map((file, fileIdx) => (
                          <div key={fileIdx} style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            backgroundColor: "#ffffff", padding: "10px", borderRadius: "6px",
                            border: "1px solid #e0e0e0"
                          }}>
                            <span style={{ color: "#1a1a1a", flex: 1 }}>
                              {file.typeLabel || file.fieldName}: {file.filename}
                            </span>
                            {(() => {
                              const isPDF = file.mimetype === "application/pdf" || 
                                           (file.filename && file.filename.toLowerCase().endsWith(".pdf"));
                              
                              return (
                                <>
                                  {isPDF && (
                                    <button
                                      type="button"
                                      onClick={() => handlePreviewFile(file)}
                                      style={{ color: "#0066cc", textDecoration: "underline", marginRight: "10px", background: "transparent", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
                                    >
                                      View File
                                    </button>
                                  )}
                                  <a 
                                    href={`http://localhost:5000${file.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      padding: "6px 12px", backgroundColor: "#0066cc", color: "white",
                                      borderRadius: "6px", textDecoration: "none", fontSize: "0.9rem",
                                      transition: "all 0.3s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = "#0056b3";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = "#0066cc";
                                    }}
                                  >
                                    Download
                                  </a>
                                  {isPDF && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                      <button
                                        onClick={() => {
                                          console.log("Evaluate button clicked for file:", file.filename);
                                          console.log("Current userType:", userType);
                                          console.log("Setting evaluation modal to true");
                                          setSelectedSubmissionForEvaluation({ submission, file });
                                          // Pre-populate scores if evaluation exists
                                          if (file.evaluation) {
                                            setEvaluationScores({
                                              "Parser Check": file.evaluation.parserCheck?.toString() || "",
                                              "Image Check": file.evaluation.imageCheck?.toString() || "",
                                              "Quality Check": file.evaluation.qualityCheck?.toString() || "",
                                              "Novelty": file.evaluation.novelty?.toString() || "",
                                              "Technical Soundness": file.evaluation.technicalSoundness?.toString() || ""
                                            });
                                          } else {
                                            setEvaluationScores({});
                                          }
                                          setSelectedLayoutId("");
                                          setParsingResult(null);
                                          // Don't reset reportLayouts here - let useEffect fetch fresh data
                                          setShowEvaluationModal(true);
                                        }}
                                        style={{
                                          padding: "6px 12px", backgroundColor: "#0066cc", color: "white",
                                          borderRadius: "6px", border: "none", fontSize: "0.9rem",
                                          cursor: "pointer", fontWeight: "bold",
                                          transition: "all 0.3s ease"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.backgroundColor = "#0056b3";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.backgroundColor = "#0066cc";
                                        }}
                                      >
                                        {file.evaluation && file.evaluation.totalScore !== null ? "Re-evaluate" : "Evaluate"}
                                      </button>
                                      {file.evaluation && file.evaluation.totalScore !== null && (
                                        <div style={{
                                          padding: "6px 12px",
                                          backgroundColor: "#0066cc",
                                          color: "white",
                                          borderRadius: "6px",
                                          border: "none",
                                          fontSize: "0.9rem",
                                          fontWeight: "bold",
                                          cursor: "default",
                                          pointerEvents: "none"
                                        }}>
                                          {file.evaluation.totalScore}/50
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </>

          {/* Evaluation Modal */}
          {showEvaluationModal && selectedSubmissionForEvaluation && (
            <div style={{
              position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
              alignItems: "center", zIndex: 3000
            }}>
              <div style={{
                backgroundColor: "#ffffff", padding: "30px", borderRadius: "15px",
                maxWidth: "95vw", maxHeight: "95vh", width: "1400px", display: "grid",
                gridTemplateColumns: "1fr 1fr", gap: "20px", overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)", border: "1px solid #e0e0e0"
              }}>
                {/* PDF Preview Panel */}
                <div style={{
                  backgroundColor: "#f5f5f5", padding: "20px", borderRadius: "12px",
                  display: "flex", flexDirection: "column", maxHeight: "90vh",
                  border: "1px solid #e0e0e0"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h3 style={{ margin: 0, color: "#0066cc", fontSize: "1.3rem" }}>
                      {selectedSubmissionForEvaluation.file.filename}
                    </h3>
                    <button
                      onClick={() => {
                        setShowEvaluationModal(false);
                        setSelectedSubmissionForEvaluation(null);
                        setEvaluationScores({});
                        setSelectedLayoutId("");
                        setParsingResult(null);
                      }}
                      style={{
                        background: "transparent", border: "none", color: "#666",
                        fontSize: "1.5rem", cursor: "pointer", fontWeight: "bold",
                        width: "30px", height: "30px", borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.3s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#f5f5f5";
                        e.target.style.color = "#1a1a1a";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "transparent";
                        e.target.style.color = "#666";
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <iframe
                    src={`http://localhost:5000${selectedSubmissionForEvaluation.file.viewUrl || selectedSubmissionForEvaluation.file.url}#toolbar=0&navpanes=0`}
                    title="PDF Preview"
                    style={{
                      flex: 1,
                      border: "none",
                      borderRadius: "8px",
                      backgroundColor: "#fff",
                      minHeight: "600px"
                    }}
                  />
                </div>

                {/* Evaluation Panel */}
                <div style={{
                  backgroundColor: "#f5f5f5", padding: "20px", borderRadius: "12px",
                  display: "flex", flexDirection: "column", maxHeight: "90vh", overflowY: "auto",
                  border: "1px solid #e0e0e0"
                }}>
                  <h3 style={{ margin: "0 0 20px 0", color: "#0066cc", fontSize: "1.3rem" }}>
                    Evaluation Table
                  </h3>
                  
                  {/* Report Layout Selection */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", color: "#1a1a1a", fontSize: "0.9rem", fontWeight: "500" }}>
                      Select Report Layout:
                    </label>
                    {loadingLayouts ? (
                      <div style={{ 
                        padding: "10px", 
                        backgroundColor: "#e3f2fd", 
                        borderRadius: "8px",
                        color: "#0066cc",
                        fontSize: "0.9rem",
                        textAlign: "center",
                        border: "1px solid #0066cc"
                      }}>
                        Loading layouts...
                      </div>
                    ) : !loadingLayouts && reportLayouts.length === 0 ? (
                      <div style={{ 
                        padding: "10px", 
                        backgroundColor: "#fff3cd", 
                        borderRadius: "8px",
                        color: "#856404",
                        fontSize: "0.9rem",
                        border: "1px solid #ffc107"
                      }}>
                        No report layouts available. Please contact admin.
                      </div>
                    ) : reportLayouts.length > 0 ? (
                      <>
                        <select
                          value={selectedLayoutId}
                          onChange={(e) => {
                            console.log("Selected layout ID:", e.target.value);
                            setSelectedLayoutId(e.target.value);
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0",
                            backgroundColor: "#ffffff",
                            color: "#1a1a1a",
                            fontSize: "1rem",
                            cursor: "pointer"
                          }}
                        >
                          <option value="" style={{ backgroundColor: "#ffffff", color: "#1a1a1a" }}>
                            -- Select a layout --
                          </option>
                          {reportLayouts.map((layout) => {
                            console.log("Rendering layout option:", layout.id, layout.title, layout.phase);
                            const phaseDisplay = layout.phase === "phase1" ? "Phase 1 Report" :
                                                  layout.phase === "phase2" ? "Phase 2 Report" :
                                                  layout.phase === "phase3" ? "Phase 3 Report" :
                                                  layout.phase === "phase4" ? "Phase 4 Report" :
                                                  layout.phase;
                            return (
                              <option key={layout.id} value={layout.id} style={{ backgroundColor: "#ffffff", color: "#1a1a1a" }}>
                                {layout.title} ({phaseDisplay})
                              </option>
                            );
                          })}
                        </select>
                        <div style={{ 
                          marginTop: "5px", 
                          fontSize: "0.8rem", 
                          color: "#666",
                          fontStyle: "italic"
                        }}>
                          {reportLayouts.length} layout(s) available
                        </div>
                      </>
                    ) : (
                      <div style={{ 
                        padding: "10px", 
                        backgroundColor: "#fee2e2", 
                        borderRadius: "8px",
                        color: "#dc2626",
                        fontSize: "0.9rem",
                        border: "1px solid #ef4444"
                      }}>
                        Error: Unable to load layouts. Check console for details.
                      </div>
                    )}
                    {selectedLayoutId && (
                      <button
                        onClick={async () => {
                          if (!selectedLayoutId || !selectedSubmissionForEvaluation) {
                            alert("Please select a report layout first.");
                            return;
                          }
                          
                          setIsParsing(true);
                          setParsingResult(null);
                          
                          try {
                            const pdfUrl = selectedSubmissionForEvaluation.file.url || selectedSubmissionForEvaluation.file.viewUrl;
                            console.log("Sending parse request with pdfUrl:", pdfUrl);
                            console.log("File object:", selectedSubmissionForEvaluation.file);
                            
                            const res = await fetch("http://localhost:5000/mentor/parse-pdf", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                pdfUrl: pdfUrl,
                                layoutId: selectedLayoutId
                              })
                            });
                            
                            console.log("Parse response status:", res.status, res.statusText);
                            
                            const data = await res.json();
                            console.log("Parse response data:", data);
                            console.log("Parse response success flag:", data.success);
                            
                            // Check if the response indicates success (regardless of HTTP status)
                            if (data && data.success === true) {
                              setParsingResult(data);
                              // Set Parser Check score based on parsing result
                              const parserScore = Math.round((data.score || 0) / 10); // Convert percentage to 1-10 scale
                              
                              // Set Image Check score based on CLIP similarity
                              const imageCheckScore = data.imageCheck ? Math.ceil((data.imageCheck.score || 0) / 10) : 0; // Convert percentage to 1-10 scale
                              
                              // Set Quality Check score based on quality metrics (already 0-10 scale)
                              const qualityCheckScore = data.qualityCheck ? Math.ceil(data.qualityCheck.score || 0) : 0;
                              
                              // Set Novelty score based on novelty metrics
                              // Novelty score is a raw model output in 0-0.5 range, scale to 1-10
                              let noveltyScore = 0;
                              if (data.noveltyCheck && data.noveltyCheck.score !== undefined && data.noveltyCheck.score !== null) {
                                const rawScore = parseFloat(data.noveltyCheck.score);
                                if (!isNaN(rawScore) && rawScore >= 0) {
                                  // Scale from 0-0.5 range to 1-10
                                  // Linear mapping: y = (x / 0.5) * 9 + 1 = x * 18 + 1
                                  // This maps 0 → 1 and 0.5 → 10
                                  noveltyScore = Math.max(1, Math.min(10, Math.ceil(rawScore * 18 + 1)));
                                }
                              }
                              
                              // Set Technical Soundness score (already 1-10 from model)
                              let technicalSoundnessScore = 0;
                              if (data.technicalSoundness && data.technicalSoundness.score !== undefined && data.technicalSoundness.score !== null) {
                                const rawScore = parseInt(data.technicalSoundness.score);
                                if (!isNaN(rawScore) && rawScore >= 1 && rawScore <= 10) {
                                  technicalSoundnessScore = rawScore;
                                }
                              }
                              
                              setEvaluationScores({
                                ...evaluationScores,
                                'Parser Check': parserScore > 0 ? parserScore.toString() : "",
                                'Image Check': imageCheckScore > 0 ? imageCheckScore.toString() : "",
                                'Quality Check': qualityCheckScore > 0 ? qualityCheckScore.toString() : "",
                                'Novelty': noveltyScore > 0 ? noveltyScore.toString() : "",
                                'Technical Soundness': technicalSoundnessScore > 0 ? technicalSoundnessScore.toString() : ""
                              });
                            } else {
                              console.error("Parse failed:", data.error);
                              alert(`Failed to parse PDF: ${data.error || "Unknown error"}`);
                            }
                          } catch (e) {
                            console.error("Failed to parse PDF", e);
                            alert(`Failed to parse PDF: ${e.message || "Please try again."}`);
                          } finally {
                            setIsParsing(false);
                          }
                        }}
                        disabled={isParsing || !selectedLayoutId}
                        style={{
                          marginTop: "10px",
                          padding: "10px 20px",
                          background: isParsing ? "#cbd5e1" : "#22c55e",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "0.95rem",
                          fontWeight: "bold",
                          cursor: isParsing || !selectedLayoutId ? "not-allowed" : "pointer",
                          opacity: isParsing || !selectedLayoutId ? 0.6 : 1,
                          transition: "all 0.3s ease"
                        }}
                      >
                        {isParsing ? "Parsing PDF..." : "Parse PDF with Selected Layout"}
                      </button>
                    )}
                  </div>
                  
                  <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e0e0e0"
                  }}>
                    <thead>
                      <tr style={{
                        background: "#0066cc",
                        color: "#ffffff"
                      }}>
                        <th style={{ padding: "15px", textAlign: "left", fontSize: "1rem", fontWeight: "bold" }}>Criteria</th>
                        <th style={{ padding: "15px", textAlign: "center", fontSize: "1rem", fontWeight: "bold" }}>Score</th>
                        <th style={{ padding: "15px", textAlign: "center", fontSize: "1rem", fontWeight: "bold" }}>Mentor Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluationCriteria.map((criterion, index) => {
                        // Get score for Parser Check, Image Check, Quality Check, Novelty, and Technical Soundness from parsing result
                        let scoreValue = "";
                        if (parsingResult) {
                          if (criterion === "Parser Check") {
                            scoreValue = Math.round((parsingResult.score || 0) / 10).toString();
                          } else if (criterion === "Image Check") {
                            if (parsingResult.imageCheck && parsingResult.imageCheck.score !== undefined) {
                              scoreValue = Math.ceil((parsingResult.imageCheck.score || 0) / 10).toString();
                            }
                          } else if (criterion === "Quality Check") {
                            if (parsingResult.qualityCheck && parsingResult.qualityCheck.score !== undefined) {
                              scoreValue = Math.ceil(parsingResult.qualityCheck.score || 0).toString();
                            }
                          } else if (criterion === "Novelty") {
                            if (parsingResult.noveltyCheck && parsingResult.noveltyCheck.score !== undefined && parsingResult.noveltyCheck.score !== null) {
                              const rawScore = parseFloat(parsingResult.noveltyCheck.score);
                              if (!isNaN(rawScore) && rawScore >= 0) {
                                // Scale from 0-0.5 range to 1-10
                                // Linear mapping: y = (x / 0.5) * 9 + 1 = x * 18 + 1
                                // This maps 0 → 1 and 0.5 → 10
                                scoreValue = Math.max(1, Math.min(10, Math.ceil(rawScore * 18 + 1))).toString();
                              }
                            }
                          } else if (criterion === "Technical Soundness") {
                            if (parsingResult.technicalSoundness && parsingResult.technicalSoundness.score !== undefined && parsingResult.technicalSoundness.score !== null) {
                              const rawScore = parseInt(parsingResult.technicalSoundness.score);
                              if (!isNaN(rawScore) && rawScore >= 1 && rawScore <= 10) {
                                scoreValue = rawScore.toString();
                              }
                            }
                          }
                        }
                        
                        return (
                          <tr key={criterion} style={{
                            borderBottom: index < evaluationCriteria.length - 1 ? "1px solid #e0e0e0" : "none",
                            backgroundColor: index % 2 === 0 ? "#ffffff" : "#f5f5f5"
                          }}>
                            <td style={{ padding: "15px", color: "#1a1a1a", fontSize: "1rem" }}>{criterion}</td>
                            <td style={{ padding: "15px", textAlign: "center", color: scoreValue ? "#16a34a" : "#666", fontSize: "1rem", fontWeight: scoreValue ? "bold" : "normal" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", position: "relative" }}>
                                <span>{scoreValue || "-"}</span>
                                {(() => {
                                  // Generate tooltip content based on criterion
                                  let tooltipContent = "";
                                  let showIcon = false;
                                  
                                  if (criterion === "Parser Check") {
                                    if (parsingResult) {
                                      const missingText = parsingResult.missing && parsingResult.missing.length > 0 
                                        ? `\nMissing Headings: ${parsingResult.missing.slice(0, 5).join(", ")}${parsingResult.missing.length > 5 ? "..." : ""}`
                                        : "";
                                      tooltipContent = `Headings Found: ${parsingResult.foundCount || 0}/${parsingResult.total || 0} (${parsingResult.score || 0}%)${missingText}`;
                                      showIcon = true;
                                    } else {
                                      tooltipContent = "Parser Check: Automated score based on heading structure and completeness.\n\nTo see the score, please parse the PDF first using the layout selection above.";
                                      showIcon = true;
                                    }
                                  } else if (criterion === "Image Check") {
                                    if (parsingResult && parsingResult.imageCheck) {
                                      tooltipContent = `Images: ${parsingResult.imageCheck.imageCount || 0} images\nAvg CLIP Similarity: ${parsingResult.imageCheck.avgSimilarity ? parsingResult.imageCheck.avgSimilarity.toFixed(4) : "0.0000"}\nScore: ${parsingResult.imageCheck.score || 0}%`;
                                      showIcon = true;
                                    } else {
                                      tooltipContent = "Image Check: Automated score based on image count and CLIP similarity.\n\nTo see the score, please parse the PDF first using the layout selection above.";
                                      showIcon = true;
                                    }
                                  } else if (criterion === "Quality Check") {
                                    if (parsingResult && parsingResult.qualityCheck) {
                                      tooltipContent = `Gunning Fog Index: ${parsingResult.qualityCheck.gunningFogIndex || 0}\nARI: ${parsingResult.qualityCheck.automatedReadabilityIndex || 0}\nLexical Density: ${(parsingResult.qualityCheck.lexicalDensity || 0).toFixed(4)}\nIndecisive Word Index: ${(parsingResult.qualityCheck.indecisiveWordIndex || 0).toFixed(4)}\nScore: ${parsingResult.qualityCheck.score || 0}/10`;
                                      showIcon = true;
                                    } else {
                                      tooltipContent = "Quality Check: Automated score based on readability metrics (Fog Index, ARI, Lexical Density).\n\nTo see the score, please parse the PDF first using the layout selection above.";
                                      showIcon = true;
                                    }
                                  } else if (criterion === "Novelty") {
                                    tooltipContent = "Novelty: Assess the originality and innovation of the project. Consider:\n• Unique approaches or solutions\n• Creative problem-solving\n• Original contributions to the field";
                                    showIcon = true;
                                  } else if (criterion === "Technical Soundness") {
                                    // For Technical Soundness, use click to open modal instead of tooltip
                                    if (parsingResult && parsingResult.technicalSoundness) {
                                      showIcon = true;
                                    } else {
                                      tooltipContent = "Technical Soundness: Automated evaluation using AI model.\n\nEvaluates:\n• Technical accuracy and correctness\n• Logical consistency\n• Methodology rigor\n• Technical depth and completeness\n\nTo see the evaluation, please parse the PDF first.";
                                      showIcon = true;
                                    }
                                  }
                                  
                                  if (!showIcon) return null;
                                  
                                  const isFirstRow = index === 0;
                                  
                                  // Special handling for Technical Soundness - use click instead of hover
                                  if (criterion === "Technical Soundness" && parsingResult && parsingResult.technicalSoundness) {
                                    return (
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          width: "18px",
                                          height: "18px",
                                          borderRadius: "50%",
                                          backgroundColor: "#0066cc",
                                          color: "white",
                                          fontSize: "0.75rem",
                                          fontWeight: "bold",
                                          cursor: "pointer",
                                          marginLeft: "4px",
                                          transition: "background-color 0.2s ease"
                                        }}
                                        onClick={() => setShowTechnicalSoundnessModal(true)}
                                        onMouseEnter={(e) => {
                                          e.target.style.backgroundColor = "#0056b3";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.backgroundColor = "#0066cc";
                                        }}
                                        title="Click to view detailed technical soundness evaluation"
                                      >
                                        i
                                      </span>
                                    );
                                  }
                                  
                                  // Regular tooltip for other criteria
                                  return (
                                    <div style={{ position: "relative", display: "inline-block" }}>
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          width: "18px",
                                          height: "18px",
                                          borderRadius: "50%",
                                          backgroundColor: "#0066cc",
                                          color: "white",
                                          fontSize: "0.75rem",
                                          fontWeight: "bold",
                                          cursor: "help",
                                          marginLeft: "4px",
                                          transition: "background-color 0.2s ease"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.backgroundColor = "#0056b3";
                                          const tooltip = document.getElementById(`tooltip-${criterion}-${index}`);
                                          if (tooltip) tooltip.style.display = "block";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.backgroundColor = "#0066cc";
                                          const tooltip = document.getElementById(`tooltip-${criterion}-${index}`);
                                          if (tooltip) tooltip.style.display = "none";
                                        }}
                                      >
                                        i
                                      </span>
                                      <div
                                        id={`tooltip-${criterion}-${index}`}
                                        style={{
                                          display: "none",
                                          position: "absolute",
                                          ...(isFirstRow ? {
                                            top: "100%",
                                            marginTop: "8px",
                                            left: "50%",
                                            transform: "translateX(-50%)"
                                          } : {
                                            bottom: "100%",
                                            marginBottom: "8px",
                                            left: "50%",
                                            transform: "translateX(-50%)"
                                          }),
                                          padding: "10px 12px",
                                          backgroundColor: "#1a1a1a",
                                          color: "white",
                                          borderRadius: "6px",
                                          fontSize: "0.85rem",
                                          whiteSpace: "pre-line",
                                          zIndex: 10000,
                                          minWidth: "200px",
                                          maxWidth: "300px",
                                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                                          lineHeight: "1.4",
                                          pointerEvents: "none"
                                        }}
                                      >
                                        {tooltipContent}
                                        <div
                                          style={{
                                            position: "absolute",
                                            ...(isFirstRow ? {
                                              bottom: "100%",
                                              left: "50%",
                                              transform: "translateX(-50%)",
                                              border: "6px solid transparent",
                                              borderBottomColor: "#1a1a1a"
                                            } : {
                                              top: "100%",
                                              left: "50%",
                                              transform: "translateX(-50%)",
                                              border: "6px solid transparent",
                                              borderTopColor: "#1a1a1a"
                                            })
                                          }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                            <td style={{ padding: "15px", textAlign: "center" }}>
                              <select
                                value={evaluationScores[criterion] || ""}
                                onChange={(e) => {
                                  setEvaluationScores({
                                    ...evaluationScores,
                                    [criterion]: e.target.value
                                  });
                                }}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: "8px",
                                  border: "1px solid #e0e0e0",
                                  backgroundColor: "#ffffff",
                                  color: "#1a1a1a",
                                  fontSize: "1rem",
                                  cursor: "pointer",
                                  minWidth: "100px"
                                }}
                              >
                                <option value="" style={{ backgroundColor: "#ffffff", color: "#1a1a1a" }}>Select</option>
                                {scoreOptions.map((value) => (
                                  <option key={value} value={value} style={{ backgroundColor: "#ffffff", color: "#1a1a1a" }}>
                                    {value}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{
                        background: "#e3f2fd",
                        fontWeight: "bold"
                      }}>
                        <td style={{ padding: "15px", color: "#0066cc", fontSize: "1.1rem" }}>Total</td>
                        <td style={{ padding: "15px", textAlign: "center", color: "#666", fontSize: "1.2rem" }}>
                          {parsingResult ? (() => {
                            const parserScore = Math.round((parsingResult.score || 0) / 10);
                            const imageScore = parsingResult.imageCheck ? Math.ceil((parsingResult.imageCheck.score || 0) / 10) : 0;
                            const qualityScore = parsingResult.qualityCheck ? Math.ceil(parsingResult.qualityCheck.score || 0) : 0;
                            
                            // Calculate Novelty score (scaled from 0-0.5 to 1-10)
                            let noveltyScore = 0;
                            if (parsingResult.noveltyCheck && parsingResult.noveltyCheck.score !== undefined && parsingResult.noveltyCheck.score !== null) {
                              const rawScore = parseFloat(parsingResult.noveltyCheck.score);
                              if (!isNaN(rawScore) && rawScore >= 0) {
                                noveltyScore = Math.max(1, Math.min(10, Math.ceil(rawScore * 18 + 1)));
                              }
                            }
                            
                            // Get Technical Soundness score (already 1-10)
                            const technicalSoundnessScore = parsingResult.technicalSoundness && parsingResult.technicalSoundness.score !== undefined && parsingResult.technicalSoundness.score !== null
                              ? parseInt(parsingResult.technicalSoundness.score) || 0
                              : 0;
                            
                            return parserScore + imageScore + qualityScore + noveltyScore + technicalSoundnessScore;
                          })() : "-"}
                        </td>
                        <td style={{ padding: "15px", textAlign: "center", color: "#0066cc", fontSize: "1.2rem" }}>
                          {Object.values(evaluationScores).reduce((sum, score) => {
                            const numeric = parseInt(score) || 0;
                            return sum + numeric;
                          }, 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  <button
                    onClick={async () => {
                      const totalScore = Object.values(evaluationScores).reduce((sum, score) => {
                        const numeric = parseInt(score) || 0;
                        return sum + numeric;
                      }, 0);
                      
                      if (Object.keys(evaluationScores).length < evaluationCriteria.length) {
                        alert("Please fill all evaluation criteria before submitting.");
                        return;
                      }
                      
                      if (!selectedSubmissionForEvaluation || !selectedSubmissionForEvaluation.submission || !selectedSubmissionForEvaluation.file) {
                        alert("Error: Submission data is missing. Please try again.");
                        console.error("selectedSubmissionForEvaluation:", selectedSubmissionForEvaluation);
                        return;
                      }
                      
                      try {
                        // Prepare the request data
                        const requestData = {
                          submissionId: selectedSubmissionForEvaluation.submission.submissionId,
                          fileId: selectedSubmissionForEvaluation.file.fileId,
                          scores: evaluationScores,
                          totalScore: totalScore,
                          evaluatedBy: userType === "mentor" ? (username || "mentor") : null
                        };
                        
                        console.log("Submitting evaluation:", requestData);
                        console.log("Selected submission:", selectedSubmissionForEvaluation);
                        
                        // Save evaluation to backend
                        const response = await fetch("http://localhost:5000/mentor/save-evaluation", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify(requestData)
                        });
                        
                        const data = await response.json();
                        console.log("Evaluation response:", data);
                        
                        if (data.success) {
                          // Save teamId before clearing state
                          const teamId = selectedSubmissionForEvaluation?.submission?.team;
                          
                          // Close the evaluation modal
                          setShowEvaluationModal(false);
                          setSelectedSubmissionForEvaluation(null);
                          setEvaluationScores({});
                          setSelectedLayoutId("");
                          setParsingResult(null);
                          
                          // Refresh the team submissions to show updated scores
                          if (teamId) {
                            try {
                              const res = await fetch(`http://localhost:5000/submissions/${teamId}`);
                              const updatedData = await res.json();
                              if (updatedData.success) {
                                setSelectedTeamSubmissions(updatedData);
                              }
                            } catch (e) {
                              console.error("Failed to refresh submissions:", e);
                              // Fallback to page reload if refresh fails
                              window.location.reload();
                            }
                          } else {
                            window.location.reload();
                          }
                        } else {
                          const errorMsg = data.error || "Unknown error";
                          console.error("Evaluation submission failed:", errorMsg);
                          alert(`Failed to submit evaluation: ${errorMsg}`);
                        }
                      } catch (e) {
                        console.error("Failed to submit evaluation", e);
                        console.error("Error details:", {
                          message: e.message,
                          stack: e.stack,
                          selectedSubmission: selectedSubmissionForEvaluation
                        });
                        alert(`Failed to submit evaluation: ${e.message || "Please check the console for details."}`);
                      }
                    }}
                    style={{
                      marginTop: "20px",
                      padding: "15px 30px",
                      background: "#0066cc",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(0, 102, 204, 0.3)",
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 6px 16px rgba(0, 102, 204, 0.4)";
                      e.target.style.background = "#0056b3";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 4px 12px rgba(0, 102, 204, 0.3)";
                      e.target.style.background = "#0066cc";
                    }}
                  >
                    Submit Evaluation
                  </button>
                  
                  {/* Technical Soundness Modal */}
                  {showTechnicalSoundnessModal && parsingResult && parsingResult.technicalSoundness && (
                    <div
                      style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10000,
                        padding: "20px"
                      }}
                      onClick={() => setShowTechnicalSoundnessModal(false)}
                    >
                      <div
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          width: "90%",
                          maxWidth: "800px",
                          maxHeight: "90vh",
                          display: "flex",
                          flexDirection: "column",
                          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div
                          style={{
                            padding: "20px 24px",
                            borderBottom: "2px solid #e0e0e0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#0066cc",
                            color: "white",
                            borderRadius: "12px 12px 0 0"
                          }}
                        >
                          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold" }}>
                            Technical Soundness Evaluation
                          </h2>
                          <button
                            onClick={() => setShowTechnicalSoundnessModal(false)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "white",
                              fontSize: "1.5rem",
                              cursor: "pointer",
                              padding: "0",
                              width: "32px",
                              height: "32px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "50%",
                              transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255, 255, 255, 0.2)"}
                            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                          >
                            ×
                          </button>
                        </div>
                        
                        {/* Modal Content - Scrollable */}
                        <div
                          style={{
                            padding: "24px",
                            overflowY: "auto",
                            flex: 1
                          }}
                        >
                          {(() => {
                            const techData = parsingResult.technicalSoundness;
                            return (
                              <>
                                {/* Score Display */}
                                <div
                                  style={{
                                    marginBottom: "24px",
                                    padding: "16px",
                                    backgroundColor: "#f0f7ff",
                                    borderRadius: "8px",
                                    border: "2px solid #0066cc"
                                  }}
                                >
                                  <div style={{ fontSize: "1.1rem", color: "#666", marginBottom: "8px" }}>
                                    Overall Score
                                  </div>
                                  <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#0066cc" }}>
                                    {techData.score || 0}/10
                                  </div>
                                </div>
                                
                                {/* Issues List */}
                                {techData.issues && techData.issues.length > 0 ? (
                                  <div>
                                    <h3 style={{ fontSize: "1.3rem", marginBottom: "16px", color: "#1a1a1a" }}>
                                      Issues Found ({techData.issues.length})
                                    </h3>
                                    {techData.issues.map((issue, idx) => (
                                      <div
                                        key={idx}
                                        style={{
                                          marginBottom: "20px",
                                          padding: "16px",
                                          backgroundColor: "#fff5f5",
                                          borderRadius: "8px",
                                          border: "1px solid #fecaca"
                                        }}
                                      >
                                        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "8px" }}>
                                          Issue #{idx + 1}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "1rem",
                                            fontWeight: "bold",
                                            color: "#dc2626",
                                            marginBottom: "12px",
                                            padding: "10px",
                                            backgroundColor: "#ffffff",
                                            borderRadius: "6px",
                                            borderLeft: "4px solid #dc2626",
                                            fontStyle: "italic"
                                          }}
                                        >
                                          "{issue.text || issue}"
                                        </div>
                                        <div style={{ fontSize: "1rem", color: "#1a1a1a", lineHeight: "1.6" }}>
                                          <strong>Reason:</strong> {issue.reason || "Not specified"}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      padding: "20px",
                                      backgroundColor: "#f0fdf4",
                                      borderRadius: "8px",
                                      border: "1px solid #86efac",
                                      textAlign: "center"
                                    }}
                                  >
                                    <div style={{ fontSize: "1.2rem", color: "#16a34a", fontWeight: "bold", marginBottom: "8px" }}>
                                      ✓ No Technical Issues Found
                                    </div>
                                    <div style={{ fontSize: "1rem", color: "#666" }}>
                                      The report demonstrates strong technical soundness across all evaluated criteria.
                                    </div>
                                  </div>
                                )}
                                
                                {/* Full Reasoning */}
                                {techData.reasoning && (
                                  <div style={{ marginTop: "24px" }}>
                                    <h3 style={{ fontSize: "1.3rem", marginBottom: "16px", color: "#1a1a1a" }}>
                                      Detailed Evaluation
                                    </h3>
                                    <div
                                      style={{
                                        padding: "16px",
                                        backgroundColor: "#f9fafb",
                                        borderRadius: "8px",
                                        border: "1px solid #e5e7eb",
                                        fontSize: "1rem",
                                        lineHeight: "1.6",
                                        color: "#1a1a1a",
                                        whiteSpace: "pre-wrap"
                                      }}
                                    >
                                      {techData.reasoning}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        
                        {/* Modal Footer */}
                        <div
                          style={{
                            padding: "16px 24px",
                            borderTop: "2px solid #e0e0e0",
                            display: "flex",
                            justifyContent: "flex-end"
                          }}
                        >
                          <button
                            onClick={() => setShowTechnicalSoundnessModal(false)}
                            style={{
                              padding: "10px 24px",
                              backgroundColor: "#0066cc",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "1rem",
                              fontWeight: "bold",
                              cursor: "pointer",
                              transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = "#0056b3"}
                            onMouseLeave={(e) => e.target.style.backgroundColor = "#0066cc"}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------- ADMIN DASHBOARD ----------------
  if (userType === "admin") {
    const [team, year] = username === "admin" ? ["Admin", ""] : username.split("_");
    return (
      <div className="dashboard-container" style={{
        minHeight: "100vh", width: "100vw",
        position: "relative", color: "#1a1a1a", fontFamily: "sans-serif", overflow: "auto",
        backgroundColor: "#ffffff"
      }}>
        {previewOverlay}

        {/* Notification Toast */}
        {notification.show && (
          <div
            className="notification-toast"
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              backgroundColor: notification.type === "success" ? "#10b981" : "#ef4444",
              color: "white",
              padding: "16px 24px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              minWidth: "300px",
              maxWidth: "500px",
              animation: "slideIn 0.3s ease-out",
              fontSize: "1rem",
              fontWeight: "500"
            }}
          >
            <span style={{ flex: 1 }}>{notification.message}</span>
            <button
              onClick={() => setNotification({ show: false, message: "", type: "success" })}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "1.2rem",
                padding: "0",
                marginLeft: "8px",
                opacity: 0.8
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Delete Layout Confirmation Modal */}
        {showDeleteLayoutConfirm && layoutToDelete && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#2d2d2d",
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90vw",
              color: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              border: "1px solid #444"
            }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "1.3rem", color: "white" }}>
                Delete Confirmation
              </h3>
              <p style={{ margin: "0 0 25px 0", fontSize: "1rem", color: "#ccc", lineHeight: "1.5" }}>
                Are you sure you want to delete <strong style={{ color: "white" }}>"{layoutToDelete.title}"</strong>?
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => {
                    setShowDeleteLayoutConfirm(false);
                    setLayoutToDelete(null);
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#555";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#444";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteLayout}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#a855f7",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#9333ea";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#a855f7";
                  }}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", padding: "20px" }}>
          {/* Top Bar - Logo and Buttons */}
          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "30px" }}>
            <img
              src="/clgL.png"
              alt="College Logo"
              style={{
                width: "160px",
                height: "80px",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Floating Buttons - Top Right */}
          <button
            onClick={() => {
              const contactWindow = window.open(
                "",
                "Contact Us - PES University",
                `width=${screen.width},height=${screen.height},resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
              );
              if (contactWindow) {
                contactWindow.moveTo(0, 0);
                contactWindow.resizeTo(screen.width, screen.height);
                contactWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>Contact Us - PES University</title>
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                          font-family: 'Montserrat', sans-serif;
                          background: #ffffff;
                          color: #1a1a1a;
                          padding: 60px 40px;
                          line-height: 1.6;
                        }
                        .container {
                          max-width: 1200px;
                          margin: 0 auto;
                        }
                        h1 {
                          font-size: 3rem;
                          color: #000000;
                          margin-bottom: 50px;
                          text-align: center;
                        }
                        h2 {
                          font-size: 2.5rem;
                          color: #1a1a1a;
                          margin-bottom: 30px;
                          margin-top: 60px;
                        }
                        .section {
                          margin-bottom: 60px;
                          padding: 40px;
                          background: #f9f9f9;
                          border-radius: 12px;
                          border-left: 4px solid #0066cc;
                        }
                        p {
                          margin-bottom: 15px;
                          font-size: 1.1rem;
                          color: #333333;
                        }
                        .contact-info {
                          margin-top: 20px;
                        }
                        .contact-info strong {
                          color: #1a1a1a;
                          display: block;
                          margin-bottom: 10px;
                          font-size: 1.2rem;
                        }
                        .contact-info div {
                          padding-left: 20px;
                          margin-bottom: 20px;
                          font-size: 1.1rem;
                          color: #333333;
                        }
                        .contact-info a {
                          color: #0066cc;
                          text-decoration: none;
                          transition: all 0.2s ease;
                        }
                        .contact-info a:hover {
                          text-decoration: underline;
                          color: #004499;
                        }
                        .close-btn {
                          position: fixed;
                          top: 20px;
                          right: 20px;
                          background: #ef4444;
                          color: white;
                          border: none;
                          padding: 12px 24px;
                          border-radius: 8px;
                          cursor: pointer;
                          font-size: 1rem;
                          font-weight: bold;
                          z-index: 1000;
                        }
                        .close-btn:hover {
                          background: #dc2626;
                        }
                      </style>
                    </head>
                    <body>
                      <button class="close-btn" onclick="window.close()">✕ Close</button>
                      <div style="display: flex; align-items: flex-start; margin-bottom: 30px; padding: 0 40px;">
                        <img src="/clgL.png" alt="College Logo" style="width: 160px; height: 80px; object-fit: contain;" />
                      </div>
                      <div class="container">
                        <h1>About Us & Contact Information</h1>
                        
                        <div class="section">
                          <h2>About Us</h2>
                          <p>
                            PES University is a leading institution committed to academic excellence and innovation. 
                            We provide a platform for students to manage their academic submissions, track deadlines, 
                            and collaborate effectively with their teams.
                          </p>
                          <p>
                            Our mission is to empower students with cutting-edge technology and resources to excel in 
                            their academic journey and prepare them for successful careers in their chosen fields.
                          </p>
                        </div>

                        <div class="section">
                          <h2>Contact Us</h2>
                          <div class="contact-info">
                            <strong>Phone Numbers:</strong>
                            <div>
                              +91 80 26721983<br>
                              +91 80 26722108
                            </div>
                            
                            <strong>Email:</strong>
                            <div>
                              <a href="mailto:admissions@pes.edu">admissions@pes.edu</a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </body>
                  </html>
                `);
                contactWindow.document.close();
                setTimeout(() => {
                  contactWindow.moveTo(0, 0);
                  contactWindow.resizeTo(screen.width, screen.height);
                }, 100);
              }
            }}
            style={{
              position: "fixed",
              top: "30px",
              right: "30px",
              padding: "16px 32px",
              backgroundColor: "#0066cc",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "18px",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              minWidth: "140px",
              boxShadow: "0 4px 20px rgba(0, 102, 204, 0.4)",
              zIndex: 1000,
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05) translateY(-2px)";
              e.target.style.boxShadow = "0 6px 30px rgba(0, 102, 204, 0.6)";
              e.target.style.backgroundColor = "#0052a3";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1) translateY(0)";
              e.target.style.boxShadow = "0 4px 20px rgba(0, 102, 204, 0.4)";
              e.target.style.backgroundColor = "#0066cc";
            }}
          >
            Contact Us
          </button>
          <button
            onClick={() => {
              const faqWindow = window.open(
                "",
                "FAQs - How to Use the Portal",
                `width=${screen.width},height=${screen.height},resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
              );
              if (faqWindow) {
                faqWindow.moveTo(0, 0);
                faqWindow.resizeTo(screen.width, screen.height);
                faqWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>FAQs - How to Use the Portal</title>
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                          font-family: 'Montserrat', sans-serif;
                          background: #ffffff;
                          color: #1a1a1a;
                          padding: 40px;
                          line-height: 1.6;
                        }
                        .container {
                          max-width: 1200px;
                          margin: 0 auto;
                        }
                        h1 {
                          font-size: 3rem;
                          color: #000000;
                          margin-bottom: 40px;
                          text-align: center;
                        }
                        h2 {
                          font-size: 2.5rem;
                          color: #000000;
                          margin-bottom: 25px;
                          margin-top: 40px;
                        }
                        h3 {
                          font-size: 2rem;
                          color: #1a1a1a;
                          margin-bottom: 15px;
                        }
                        .step {
                          margin-bottom: 60px;
                          display: flex;
                          gap: 40px;
                          align-items: flex-start;
                          padding: 30px;
                          background: #f9f9f9;
                          border-radius: 12px;
                          border-left: 4px solid #000000;
                        }
                        .step-content {
                          flex: 1;
                        }
                        .step-image {
                          flex: 1;
                          display: flex;
                          justify-content: center;
                          align-items: flex-start;
                        }
                        .step-image img {
                          max-width: 100%;
                          height: auto;
                          border-radius: 12px;
                          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        }
                        p {
                          margin-bottom: 12px;
                          font-size: 1.1rem;
                          color: #333333;
                        }
                        strong {
                          color: #000000;
                        }
                        .close-btn {
                          position: fixed;
                          top: 20px;
                          right: 20px;
                          background: #ef4444;
                          color: white;
                          border: none;
                          padding: 12px 24px;
                          border-radius: 8px;
                          cursor: pointer;
                          font-size: 1rem;
                          font-weight: bold;
                          z-index: 1000;
                        }
                        .close-btn:hover {
                          background: #dc2626;
                        }
                        .action-buttons {
                          display: flex;
                          gap: 20px;
                          justify-content: center;
                          align-items: center;
                          margin: 40px 0;
                          flex-wrap: wrap;
                          position: sticky;
                          top: 0;
                          background: #ffffff;
                          padding: 20px;
                          z-index: 100;
                          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        }
                        .action-btn {
                          display: flex;
                          align-items: center;
                          gap: 12px;
                          padding: 14px 28px;
                          background: #f0f0f0;
                          color: #1a1a1a;
                          border: 2px solid #d0d0d0;
                          border-radius: 8px;
                          font-size: 1.1rem;
                          font-weight: 500;
                          cursor: pointer;
                          transition: all 0.3s ease;
                          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                          text-decoration: none;
                        }
                        .action-btn:hover {
                          background: #000000;
                          color: white;
                          border-color: #000000;
                          transform: translateY(-2px);
                          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                        }
                        .action-btn svg {
                          width: 20px;
                          height: 20px;
                        }
                        html {
                          scroll-behavior: smooth;
                        }
                      </style>
                      <script>
                        function smoothScrollTo(element, offset = 30) {
                          if (!element) return;
                          const elementPosition = element.getBoundingClientRect().top;
                          const offsetPosition = elementPosition + window.pageYOffset - offset;
                          window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                          });
                        }
                      </script>
                    </head>
                    <body>
                      <button class="close-btn" onclick="window.close()">✕ Close</button>
                      <div style="display: flex; align-items: flex-start; margin-bottom: 30px; padding: 0 40px;">
                        <img src="/clgL.png" alt="College Logo" style="width: 160px; height: 80px; object-fit: contain;" />
                      </div>
                      <div class="container">
                        <h1>How to Use the Portal</h1>
                        
                        <div class="action-buttons">
                          <a href="#login-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('login-section'); smoothScrollTo(el, 30);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <span>Login</span>
                          </a>
                          <a href="#submit-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('submit-section'); smoothScrollTo(el, 30);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            <span>Submit</span>
                          </a>
                          <a href="#view-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('view-section'); smoothScrollTo(el, 30);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>View</span>
                          </a>
                          <a href="#chatbot-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('chatbot-section'); smoothScrollTo(el, 30);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>Chatbot</span>
                          </a>
                        </div>
                        
                        <div id="login-section" class="step">
                          <div class="step-content">
                            <h3>Login to Your Account</h3>
                            <p>• Enter your credentials on the login form displayed on the main page</p>
                            <p>• <strong>Students:</strong> TeamNo_PassoutYear / Password: 1234</p>
                            <p>• <strong>Admins:</strong> admin / Password: admin123</p>
                            <p>• <strong>Mentors:</strong> mentor_username / Password: mentor123</p>
                          </div>
                          <div class="step-image">
                            <img src="/1.png" alt="Login Tutorial" />
                          </div>
                        </div>

                        <div id="submit-section" class="step">
                          <div class="step-content">
                            <h3>Submit Your Files</h3>
                            <p>• After logging in, you'll see the submission form on your dashboard</p>
                            <p>• Upload all required file types for your current phase and review</p>
                            <p>• Click <strong>"Submit Files"</strong> when all files are uploaded</p>
                            <p>• Make sure to submit before the deadline to avoid late submission</p>
                          </div>
                          <div class="step-image">
                            <img src="/2.png" alt="Upload Tutorial" />
                          </div>
                        </div>

                        <div id="view-section" class="step">
                          <div class="step-content">
                            <h3>View Your Submissions</h3>
                            <p>• Click <strong>"View My Past Submissions"</strong> to see your submission history</p>
                            <p>• Check submission status (On-time or Late)</p>
                            <p>• View details of each submission including timestamps and file information</p>
                            <p>• Track your progress across different phases and reviews</p>
                          </div>
                          <div class="step-image">
                            <img src="/3.png" alt="Submissions Tutorial" />
                          </div>
                        </div>

                        <div id="chatbot-section" class="step">
                          <div class="step-content">
                            <h3>Use the Chatbot</h3>
                            <p>• Click the chatbot button on your dashboard to open the chat assistant</p>
                            <p>• Ask questions about your project, research topics, or any academic queries</p>
                            <p>• The chatbot uses RAG (Retrieval Augmented Generation) to provide accurate answers</p>
                            <p>• Get instant help with your questions 24/7 without waiting for human assistance</p>
                          </div>
                          <div class="step-image">
                            <img src="/4.png" alt="Chatbot Tutorial" />
                          </div>
                        </div>

                        <div style="margin-top: 60px; padding: 30px; background: #f0f7ff; border-radius: 12px; border-left: 4px solid #000000;">
                          <h2>Need Help?</h2>
                          <p>If you encounter any issues or have questions, please contact:</p>
                          <p><strong>Email:</strong> <a href="mailto:admissions@pes.edu" style="color: #000000;">admissions@pes.edu</a></p>
                          <p><strong>Phone:</strong> +91 80 26721983 or +91 80 26722108</p>
                        </div>
                      </div>
                    </body>
                  </html>
                `);
                faqWindow.document.close();
                setTimeout(() => {
                  faqWindow.moveTo(0, 0);
                  faqWindow.resizeTo(screen.width, screen.height);
                }, 100);
              }
            }}
            style={{
              position: "fixed",
              top: "30px",
              right: "230px",
              padding: "16px 32px",
              backgroundColor: "#0066cc",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "18px",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              minWidth: "140px",
              boxShadow: "0 4px 20px rgba(0, 102, 204, 0.4)",
              zIndex: 1000,
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05) translateY(-2px)";
              e.target.style.boxShadow = "0 6px 30px rgba(0, 102, 204, 0.6)";
              e.target.style.backgroundColor = "#0052a3";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1) translateY(0)";
              e.target.style.boxShadow = "0 4px 20px rgba(0, 102, 204, 0.4)";
              e.target.style.backgroundColor = "#0066cc";
            }}
          >
            FAQs
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <div style={{
              backgroundColor: "#f9f9f9",
              padding: "15px 25px", borderRadius: "15px", fontSize: "1.1rem", fontWeight: "500",
              border: "2px solid #0066cc", boxShadow: "0 0 20px rgba(0, 102, 204, 0.2)", backdropFilter: "blur(10px)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0066cc" }}>
                <span>Admin Dashboard</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <div style={{
                backgroundColor: "#f9f9f9",
                padding: "15px 25px", borderRadius: "15px", fontSize: "1.5rem", fontWeight: "bold",
                border: "2px solid #0066cc", boxShadow: "0 0 20px rgba(0, 102, 204, 0.2)", backdropFilter: "blur(10px)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0066cc" }}>
                  <span>{time.toLocaleTimeString()}</span>
                </div>
              </div>

              <button onClick={handleLogout} style={{
                padding: "10px 20px",
                backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px",
                cursor: "pointer", fontWeight: "bold", fontSize: "1rem", transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#dc2626";
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#ef4444";
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "none";
              }}> Logout</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
            <div className="dashboard-tabs admin-dashboard-tabs" style={{ marginBottom: "0" }}>
              {adminTabs.map((tab) => {
                // Count new announcements for the announcements tab
                const newAnnouncementsCount = tab.key === "announcements" 
                  ? adminAnnouncements.filter(ann => {
                      const annTime = ann.createdAt ? new Date(ann.createdAt).getTime() : 0;
                      return annTime > lastAnnouncementsViewTime;
                    }).length
                  : 0;

                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setAdminActiveSection(tab.key);
                      // Clear badge when announcements tab is clicked
                      if (tab.key === "announcements") {
                        const now = Date.now();
                        setLastAnnouncementsViewTime(now);
                        localStorage.setItem('lastAnnouncementsViewTime', now.toString());
                      }
                    }}
                    className={`tab-button ${adminActiveSection === tab.key ? "active" : ""}`}
                    style={{ position: "relative" }}
                  >
                    {tab.label}
                    {tab.key === "announcements" && newAnnouncementsCount > 0 && (
                      <span style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        borderRadius: "50%",
                        minWidth: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        padding: "0 6px",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)"
                      }}>
                        {newAnnouncementsCount > 99 ? "99+" : newAnnouncementsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="tab-content" style={{ flex: 1, margin: "0", maxWidth: "none", paddingBottom: "60px" }}>
              {/* Admin Logs Section */}
              {adminActiveSection === "logs" && (
                <div style={{
                  backgroundColor: "#f9f9f9", 
            padding: "30px", 
            borderRadius: "15px",
            boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)", 
            marginBottom: "30px",
            border: "2px solid #0066cc"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: "#0066cc", fontSize: "1.8rem" }}>Admin Activity Logs</h2>
              <button onClick={handleClearAdminLogs} style={{
                padding: "8px 16px", 
                backgroundColor: "#0066cc", 
                color: "white", 
                border: "none",
                borderRadius: "6px", 
                cursor: "pointer", 
                fontWeight: "bold", 
                fontSize: "0.9rem"
              }}>Clear All Logs</button>
            </div>
            
            <div style={{
              maxHeight: "70vh",
              overflowY: "auto",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              padding: "15px",
              border: "1px solid #e0e0e0"
            }}>
              {adminLogs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {adminLogs.map((log) => {
                    let detailsObj = {};
                    if (typeof log.details === "string") {
                      try {
                        detailsObj = JSON.parse(log.details);
                      } catch (e) {
                        detailsObj = { message: log.details };
                      }
                    } else if (log.details && typeof log.details === "object") {
                      detailsObj = log.details;
                    }
                    
                    return (
                      <div key={log.id || log._id} style={{
                        backgroundColor: "#f5f5f5",
                        padding: "15px",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: "1.1rem", 
                              fontWeight: "bold", 
                              color: "#0066cc",
                              marginBottom: "5px"
                            }}>
                              {log.action}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "#666" }}>
                              {formatTimestamp(log.timestamp)}
                            </div>
                          </div>
                        </div>
                        {Object.keys(detailsObj).length > 0 && (
                          <div style={{
                            marginTop: "8px",
                            padding: "10px",
                            backgroundColor: "#fafafa",
                            borderRadius: "6px",
                            fontSize: "0.9rem",
                            color: "#333"
                          }}>
                            <div style={{ fontWeight: "bold", marginBottom: "5px", color: "#000" }}>Details:</div>
                            {Object.entries(detailsObj).map(([key, value]) => (
                              <div key={key} style={{ marginLeft: "10px", marginBottom: "3px" }}>
                                <strong>{key}:</strong> {typeof value === "object" ? JSON.stringify(value) : String(value)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ 
                  textAlign: "center", 
                  padding: "40px", 
                  color: "#666",
                  fontSize: "1.1rem"
                }}>
                  No logs yet. All admin actions will be logged here.
                </div>
              )}
            </div>
            
            <div style={{ marginTop: "15px", fontSize: "0.85rem", color: "#666", textAlign: "center" }}>
              Total Logs: {adminLogs.length} | Showing most recent first
            </div>
          </div>
          )}

        {/* Clear Logs Confirmation Modal */}
        {showClearLogsConfirm && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#2d2d2d",
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90vw",
              color: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              border: "1px solid #444"
            }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "1.3rem", color: "white" }}>
                Clear Logs Confirmation
              </h3>
              <p style={{ margin: "0 0 25px 0", fontSize: "1rem", color: "#ccc", lineHeight: "1.5" }}>
                Are you sure you want to clear all admin logs?
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => setShowClearLogsConfirm(false)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#555";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#444";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClearAdminLogs}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#a855f7",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#9333ea";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#a855f7";
                  }}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

              {/* Configuration Section */}
              {adminActiveSection === "config" && (
                <div style={{
            backgroundColor: "#f9f9f9", padding: "30px", borderRadius: "15px",
            boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)", marginBottom: "30px", border: "2px solid #0066cc"
          }}>
            <h2 style={{ margin: "0 0 20px 0", color: "#0066cc", fontSize: "1.8rem" }}> Configuration</h2>
            {adminConfig && (
              <div>
                {/* Two-column layout with divider */}
                <div style={{ display: "flex", gap: "30px", alignItems: "flex-start", marginBottom: "30px" }}>
                  {/* Left Column: Deadline & Phases & Reviews */}
                  <div style={{ flex: "1", minWidth: "0" }}>
                    <div style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#1a1a1a" }}>Deadline:</label>
                      <div style={{
                        display: "inline-block",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "2px solid #e0e0e0",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                        transition: "all 0.3s ease"
                      }}>
                        <input 
                          type="datetime-local" 
                          value={adminConfig.deadline ? (() => {
                            const date = new Date(adminConfig.deadline);
                            const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                            return localDate.toISOString().slice(0, 16);
                          })() : ""}
                          onChange={(e) => setAdminConfig({ ...adminConfig, deadline: new Date(e.target.value).toISOString() })}
                          style={{ 
                            border: "none",
                            outline: "none",
                            padding: "0",
                            fontSize: "1rem",
                            color: "#1a1a1a",
                            backgroundColor: "transparent",
                            width: "auto",
                            minWidth: "200px"
                          }} 
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: "30px" }}>
                      <div style={{ marginBottom: "15px" }}>
                        <label style={{ fontWeight: "bold", color: "#1a1a1a" }}>Phases & Reviews Configuration:</label>
                      </div>
                      
                      {/* Dropdowns to select which phase/review to view */}
                      <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#1a1a1a" }}>Select Phase to View:</label>
                          <select
                            value={selectedEditPhase !== null ? selectedEditPhase : ""}
                            onChange={(e) => {
                              const phaseIdx = e.target.value !== "" ? parseInt(e.target.value) : null;
                              setSelectedEditPhase(phaseIdx);
                              setSelectedEditReview(null); // Reset review when phase changes
                            }}
                            style={{
                              width: "auto",
                              minWidth: "200px",
                              padding: "12px",
                              borderRadius: "8px",
                              border: "1px solid #ccc",
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              color: "#000",
                              fontSize: "1rem",
                              cursor: "pointer",
                              display: "inline-block"
                            }}
                          >
                            <option value="">-- Select Phase --</option>
                            {adminConfig.phases && adminConfig.phases.map((phase, idx) => (
                              <option key={idx} value={idx}>{phase.phaseName}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#1a1a1a" }}>Select Review to View:</label>
                          <select
                            value={selectedEditReview !== null ? selectedEditReview : ""}
                            onChange={(e) => setSelectedEditReview(e.target.value !== "" ? parseInt(e.target.value) : null)}
                            disabled={selectedEditPhase === null}
                            style={{
                              width: "auto",
                              minWidth: "200px",
                              padding: "12px",
                              borderRadius: "8px",
                              border: "1px solid #ccc",
                              backgroundColor: selectedEditPhase === null ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.9)",
                              color: "#000",
                              fontSize: "1rem",
                              cursor: selectedEditPhase === null ? "not-allowed" : "pointer",
                              display: "inline-block"
                            }}
                          >
                            <option value="">-- Select Review --</option>
                            {selectedEditPhase !== null && adminConfig.phases && adminConfig.phases[selectedEditPhase] && adminConfig.phases[selectedEditPhase].reviews.map((review, idx) => (
                              <option key={idx} value={idx}>{review.reviewName}</option>
                            ))}
                          </select>
                          <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                            <button
                              onClick={handleAddReviewToPhase}
                              disabled={selectedEditPhase === null}
                              style={{
                                padding: "8px 16px",
                                backgroundColor: selectedEditPhase === null ? "rgba(16, 185, 129, 0.4)" : "#10b981",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: selectedEditPhase === null ? "not-allowed" : "pointer",
                                fontWeight: "bold",
                                fontSize: "0.9rem",
                                transition: "all 0.3s ease"
                              }}
                            >
                              Add Review
                            </button>
                            <button
                              onClick={handleRemoveReviewFromPhase}
                              disabled={
                                selectedEditPhase === null ||
                                selectedEditReview === null ||
                                !adminConfig?.phases?.[selectedEditPhase]?.reviews?.length
                              }
                              style={{
                                padding: "8px 16px",
                                backgroundColor:
                                  selectedEditPhase === null ||
                                  selectedEditReview === null ||
                                  !adminConfig?.phases?.[selectedEditPhase]?.reviews?.length
                                    ? "rgba(239, 68, 68, 0.35)"
                                    : "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor:
                                  selectedEditPhase === null ||
                                  selectedEditReview === null ||
                                  !adminConfig?.phases?.[selectedEditPhase]?.reviews?.length
                                    ? "not-allowed"
                                    : "pointer",
                                fontWeight: "bold",
                                fontSize: "0.9rem",
                                transition: "all 0.3s ease"
                              }}
                            >
                              Delete Review
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Show selected phase/review info without editable boxes */}
                      {selectedEditPhase !== null && selectedEditReview !== null && adminConfig.phases && adminConfig.phases[selectedEditPhase] && adminConfig.phases[selectedEditPhase].reviews[selectedEditReview] ? (
                        <div style={{
                          marginBottom: "15px",
                          backgroundColor: "#ffffff", 
                          padding: "8px 12px", 
                          borderRadius: "8px",
                          border: "1px solid #e0e0e0",
                          width: "fit-content",
                          display: "inline-block"
                        }}>
                          <div style={{ fontSize: "0.85rem", color: "#333" }}>
                            <strong>Phase:</strong> {adminConfig.phases[selectedEditPhase].phaseName} | 
                            <strong> Review:</strong> {adminConfig.phases[selectedEditPhase].reviews[selectedEditReview].reviewName} | 
                            <strong> Documents:</strong> {adminConfig.phases[selectedEditPhase].reviews[selectedEditReview].documents?.length || 0}
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                          Select a Phase and Review above to view their configuration
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vertical Divider Line */}
                  <div style={{
                    width: "2px",
                    backgroundColor: "#e0e0e0",
                    alignSelf: "stretch",
                    minHeight: "100px"
                  }}></div>

                  {/* Right Column: File Types / Deliverables */}
                  <div style={{ flex: "1", minWidth: "0" }}>
                    <div style={{ marginBottom: "30px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                        <label style={{ fontWeight: "bold", color: "#1a1a1a" }}>File Types / Deliverables:</label>
                        <button onClick={handleAddFileType} style={{
                          padding: "8px 16px", backgroundColor: "#10b981", color: "white", border: "none",
                          borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem"
                        }}>Add File Type</button>
                      </div>
                  <div style={{
                    backgroundColor: "#ffffff", 
                    padding: "15px", 
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0"
                  }}>
                    {adminConfig.fileTypes && adminConfig.fileTypes.length > 0 ? (
                      adminConfig.fileTypes.map((fileType, idx) => (
                        <div key={idx} style={{
                          display: "flex", gap: "8px", marginBottom: "10px", alignItems: "center",
                          backgroundColor: "#f5f5f5", 
                          padding: "10px", 
                          borderRadius: "6px"
                        }}>
                          <input type="text" 
                            value={fileType.key} 
                            disabled
                            placeholder="File Type Key"
                            style={{
                              flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ccc",
                              backgroundColor: "rgba(255, 255, 255, 0.5)", color: "#666", cursor: "not-allowed"
                            }} />
                          <input type="text" 
                            value={fileType.label || ""} 
                            onChange={(e) => {
                              const newTypes = [...adminConfig.fileTypes];
                              newTypes[idx].label = e.target.value;
                              setAdminConfig({ ...adminConfig, fileTypes: newTypes });
                            }}
                            placeholder="File Type Label (e.g., Deliverable 1)"
                            style={{
                              flex: 2, padding: "8px", borderRadius: "6px", border: "1px solid #ccc",
                              backgroundColor: "rgba(255, 255, 255, 0.9)", color: "#000"
                            }} />
                          <select 
                            value={fileType.fileType || "any"} 
                            onChange={(e) => {
                              const newTypes = [...adminConfig.fileTypes];
                              newTypes[idx].fileType = e.target.value;
                              setAdminConfig({ ...adminConfig, fileTypes: newTypes });
                            }}
                            style={{
                              flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ccc",
                              backgroundColor: "rgba(255, 255, 255, 0.9)", color: "#000"
                            }}>
                            <option value="any">Any Type</option>
                            <option value="pdf">PDF</option>
                            <option value="doc">Word (.doc)</option>
                            <option value="docx">Word (.docx)</option>
                            <option value="ppt">PowerPoint (.ppt)</option>
                            <option value="pptx">PowerPoint (.pptx)</option>
                            <option value="image">Image</option>
                          </select>
                          <button onClick={() => handleRemoveFileType(idx)} style={{
                            padding: "8px 16px", backgroundColor: "#ef4444", color: "white", border: "none",
                            borderRadius: "6px", cursor: "pointer", fontWeight: "bold"
                          }}>Remove</button>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                        No file types configured. Click "Add File Type" to add one.
                      </div>
                    )}
                  </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "row", gap: "10px", alignItems: "flex-start" }}>
                  <button onClick={handleSaveConfig} style={{
                    padding: "8px 16px", backgroundColor: "#10b981", color: "white",
                    border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1.1rem"
                  }}> Save Configuration</button>

                  <button onClick={handleDoneConfiguration} style={{
                    padding: "8px 16px", backgroundColor: "#0066cc", color: "white",
                    border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1.1rem"
                  }}>Done</button>

                  <button onClick={() => {
                    if (window.confirm("Are you sure you want to reset all review history? This will clear all completed review records.")) {
                      const historyCount = phaseReviewHistory.length;
                      setPhaseReviewHistory([]);
                      try {
                        localStorage.removeItem('adminPhaseReviewHistory');
                        alert("✅ Review history reset successfully!");
                        addAdminLog("Review History Reset", {
                          reviewsCleared: historyCount
                        });
                      } catch (e) {
                        console.error("Failed to clear review history", e);
                        alert("Failed to clear review history from storage.");
                      }
                    }
                  }} style={{
                    padding: "8px 16px", backgroundColor: "#6b7280", color: "white",
                    border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem"
                  }}>Reset All Reviews (Testing)</button>
                </div>

              </div>
            )}
          </div>
          )}

              {/* Live Submission Section */}
              {adminActiveSection === "live" && (
                <div style={{
            backgroundColor: "#f9f9f9", padding: "30px", borderRadius: "15px",
            boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)", marginBottom: "30px", border: "2px solid #0066cc"
          }}>
            <h2 style={{ margin: "0 0 20px 0", color: "#0066cc", fontSize: "1.8rem" }}>Live Submissions</h2>
            <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "20px" }}>Active submission configurations. You can edit deadlines or delete submissions below.</p>
            {(() => {
              // Only show the active phase/review from backend (students should only see this)
              const activeSubmission = adminConfig?.activePhaseReview ? {
                id: 'active',
                phaseName: adminConfig.activePhaseReview.phaseName || adminConfig.activePhaseReview.phase,
                reviewName: adminConfig.activePhaseReview.reviewName || adminConfig.activePhaseReview.review,
                deadline: adminConfig.deadline,
                fileTypes: adminConfig.fileTypes || [],
                timestamp: adminConfig.activePhaseReview.createdAt || new Date().toISOString()
              } : null;
              
              return activeSubmission ? (
              <div style={{ maxHeight: "600px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div key={activeSubmission.id} style={{
                  padding: "15px",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#0066cc", marginBottom: "5px", fontSize: "1.1rem", fontWeight: "bold" }}>
                        {activeSubmission.phaseName} - {activeSubmission.reviewName}
                      </div>
                      <div style={{ color: "#666", fontSize: "0.85rem", marginBottom: "5px" }}>
                        <strong>Created:</strong> {formatTimestamp(activeSubmission.timestamp)}
                      </div>
                      {activeSubmission.deadline && (
                        <div style={{ color: "#10b981", fontSize: "0.85rem", marginBottom: "5px" }}>
                          <strong>Deadline:</strong> {formatTimestamp(activeSubmission.deadline)}
                        </div>
                      )}
                      {activeSubmission.fileTypes && activeSubmission.fileTypes.length > 0 && (
                        <div style={{ color: "#666", fontSize: "0.85rem" }}>
                          <strong>Deliverables:</strong> {activeSubmission.fileTypes.map(ft => ft.label || ft.key).join(", ")}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginLeft: "10px" }}>
                      <button onClick={() => handleEditLiveSubmission(activeSubmission.id)} style={{
                        padding: "8px 12px", backgroundColor: "#10b981", color: "white",
                        border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold",
                        fontSize: "0.85rem"
                      }}>Edit</button>
                      <button onClick={() => handleDeleteLiveSubmission(activeSubmission.id)} style={{
                        padding: "8px 12px", backgroundColor: "#ef4444", color: "white",
                        border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold",
                        fontSize: "0.85rem"
                      }}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: "#666", textAlign: "center", padding: "40px" }}>
                No live submissions yet. Live submissions are created when you set an active phase/review in the Configuration tab.
              </div>
            );
            })()}
          </div>
          )}

              {/* Teams Management Section */}
              {adminActiveSection === "teams" && (
                <div style={{
            backgroundColor: "#f9f9f9", padding: "30px", borderRadius: "15px",
            boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)", marginBottom: "30px", border: "2px solid #0066cc"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: "#0066cc", fontSize: "1.8rem" }}> Teams Management</h2>
              <button onClick={() => {
                setEditingTeam(null);
                setNewTeam({
                  teamId: "",
                  teamName: "",
                  members: "",
                  projectTitle: "",
                  contactEmail: "",
                  status: "active",
                  notes: ""
                });
                setShowEditTeamModal(true);
              }} style={{
                padding: "10px 20px", backgroundColor: "#10b981", color: "white", border: "none",
                borderRadius: "8px", cursor: "pointer", fontWeight: "bold"
              }}>Add Team</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {Object.entries(teams).map(([teamId, team]) => (
                <div key={teamId} style={{
                  backgroundColor: "#ffffff", padding: "20px", borderRadius: "10px",
                  border: "1px solid #e0e0e0"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                    <h3 style={{ margin: 0, color: "#0066cc" }}>{team.teamName || teamId}</h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleEditTeam(teamId)} style={{
                        padding: "6px 12px", backgroundColor: "#0066cc", color: "white", border: "none",
                        borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem"
                      }}>Edit</button>
                      <button onClick={() => handleDeleteTeam(teamId)} style={{
                        padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none",
                        borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem"
                      }}>Delete</button>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.9rem", marginBottom: "5px", color: "#333" }}><strong>ID:</strong> {team.teamId}</div>
                  {team.projectTitle && <div style={{ fontSize: "0.9rem", marginBottom: "5px", color: "#333" }}><strong>Project:</strong> {team.projectTitle}</div>}
                  {team.members && team.members.length > 0 && <div style={{ fontSize: "0.9rem", marginBottom: "5px", color: "#333" }}>
                    <strong>Members:</strong> {team.members.map(m => {
                      if (typeof m === "string") return m;
                      if (m.name && m.srn) return `${m.name} (${m.srn})`;
                      if (m.name) return m.name;
                      return "";
                    }).filter(m => m).join(", ")}
                  </div>}
                  {team.contactEmail && <div style={{ fontSize: "0.9rem", color: "#333" }}><strong>Student Email:</strong> {team.contactEmail}</div>}
                </div>
              ))}
            </div>
          </div>
          )}

              {/* Submissions Overview */}
              {adminActiveSection === "submissions" && (
                <div style={{
            backgroundColor: "#f9f9f9", padding: "30px", borderRadius: "15px",
            boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)", border: "2px solid #0066cc"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: "#0066cc", fontSize: "1.8rem" }}> Submissions Overview</h2>
              <button onClick={handleAddSubmission} style={{
                padding: "10px 20px", backgroundColor: "#10b981", color: "white", border: "none",
                borderRadius: "8px", cursor: "pointer", fontWeight: "bold",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#059669";
                e.target.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#10b981";
                e.target.style.transform = "translateY(0)";
              }}>Add Submission</button>
            </div>
            {adminSubmissions && (
              <div>
                <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                  <div style={{ flex: 1, padding: "20px", backgroundColor: "#e6f2ff", borderRadius: "8px", border: "2px solid #0066cc" }}>
                    <div style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "5px", color: "#0066cc" }}>{adminSubmissions.totalOnTime}</div>
                    <div style={{ color: "#333" }}>On-Time Submissions</div>
                  </div>
                  <div style={{ flex: 1, padding: "20px", backgroundColor: "#ffe6e6", borderRadius: "8px", border: "2px solid #ef4444" }}>
                    <div style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "5px", color: "#ef4444" }}>{adminSubmissions.totalLate}</div>
                    <div style={{ color: "#333" }}>Late Submissions</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "20px" }}>
                  <div style={{ 
                    flex: 1,
                    maxHeight: "600px",
                    overflowY: "auto",
                    overflowX: "hidden",
                    paddingRight: "10px"
                  }}>
                    <h3 style={{ color: "#0066cc", marginBottom: "15px" }}> On-Time</h3>
                    {adminSubmissions.submissions.ontime.length > 0 ? (
                      adminSubmissions.submissions.ontime.map((submission, index) => (
                        <div key={index} style={{
                          marginBottom: "10px", padding: "10px", backgroundColor: "#ffffff",
                          borderRadius: "5px", display: "flex", justifyContent: "space-between", alignItems: "center",
                          border: "1px solid #e0e0e0"
                        }}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ color: "#1a1a1a" }}>Team: {submission.teamName || submission.team}</strong>
                            {submission.teamName && submission.team !== submission.teamName && (
                              <div style={{ fontSize: "0.85rem", color: "#666", fontStyle: "italic" }}>
                                ID: {submission.team}
                              </div>
                            )}
                            <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "4px" }}>
                              Submitted: {formatTimestamp(submission.submittedAt)}
                            </div>
                            <div style={{ fontSize: "0.9rem", color: "#333", marginTop: "6px" }}>
                              Files ({submission.count}):
                              <ul style={{ margin: "6px 0 0 18px", padding: 0, listStyle: "disc" }}>
                                {(submission.filesWithTypes || []).filter(Boolean).map((file, idx) => (
                                  <li key={idx}>
                                    <div>
                                      {file.typeLabel}: {file.filename}
                                      <div style={{ marginTop: "4px" }}>
                                        <button
                                          type="button"
                                          onClick={() => handlePreviewFile(file)}
                                          style={{
                                            color: "#0066cc",
                                            textDecoration: "underline",
                                            marginRight: "10px",
                                            background: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: "0.85rem"
                                          }}
                                        >
                                          View
                                        </button>
                                        <a
                                          href={`http://localhost:5000${file.url}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ color: "#10b981", textDecoration: "underline" }}
                                        >
                                          Download
                                        </a>
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={() => handleEditSubmission(submission, "ontime")} style={{
                              padding: "6px 12px", backgroundColor: "#0066cc", color: "white", border: "none",
                              borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold"
                            }}>Edit</button>
                            <button onClick={() => handleDeleteSubmission(submission.team, "ontime")} style={{
                              padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none",
                              borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold"
                            }}>Delete</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "#666" }}>No on-time submissions yet</div>
                    )}
                  </div>
                  <div style={{ 
                    flex: 1,
                    maxHeight: "600px",
                    overflowY: "auto",
                    overflowX: "hidden",
                    paddingRight: "10px"
                  }}>
                    <h3 style={{ color: "#ef4444", marginBottom: "15px" }}>Late</h3>
                    {adminSubmissions.submissions.late.length > 0 ? (
                      adminSubmissions.submissions.late.map((submission, index) => (
                        <div key={index} style={{
                          marginBottom: "10px", padding: "10px", backgroundColor: "#ffffff",
                          borderRadius: "5px", display: "flex", justifyContent: "space-between", alignItems: "center",
                          border: "1px solid #e0e0e0"
                        }}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ color: "#1a1a1a" }}>Team: {submission.teamName || submission.team}</strong>
                            {submission.teamName && submission.team !== submission.teamName && (
                              <div style={{ fontSize: "0.85rem", color: "#666", fontStyle: "italic" }}>
                                ID: {submission.team}
                              </div>
                            )}
                            <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "4px" }}>
                              Submitted: {formatTimestamp(submission.submittedAt)}
                            </div>
                            <div style={{ fontSize: "0.9rem", color: "#333", marginTop: "6px" }}>
                              Files ({submission.count}):
                              <ul style={{ margin: "6px 0 0 18px", padding: 0, listStyle: "disc" }}>
                                {(submission.filesWithTypes || []).filter(Boolean).map((file, idx) => (
                                  <li key={idx}>
                                    <a
                                      href={`http://localhost:5000${file.url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: "#10b981", textDecoration: "underline" }}
                                    >
                                      {file.typeLabel}: {file.filename}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={() => handleEditSubmission(submission, "late")} style={{
                              padding: "6px 12px", backgroundColor: "#0066cc", color: "white", border: "none",
                              borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold"
                            }}>Edit</button>
                            <button onClick={() => handleDeleteSubmission(submission.team, "late")} style={{
                              padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none",
                              borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold"
                            }}>Delete</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "#666" }}>No late submissions yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

              {/* Announcements Management */}
              {adminActiveSection === "announcements" && (
                <div style={{
              backgroundColor: "#f9f9f9", padding: "30px", borderRadius: "15px",
              boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)", marginBottom: "30px", marginTop: "40px", border: "2px solid #0066cc"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, color: "#0066cc", fontSize: "1.8rem" }}> Announcements Management</h2>
                <button onClick={() => {
                  setNewAnnouncement({ title: "", content: "" });
                  setShowAnnouncementModal(true);
                }} style={{
                  padding: "10px 20px", backgroundColor: "#10b981", color: "white", border: "none",
                  borderRadius: "8px", cursor: "pointer", fontWeight: "bold"
                }}>Add Announcement</button>
              </div>

              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "15px",
                maxHeight: "600px",
                overflowY: "auto",
                overflowX: "hidden",
                paddingRight: "10px"
              }}>
                {adminAnnouncements.length > 0 ? (
                  adminAnnouncements.map((announcement, index) => (
                    <div key={announcement.id || index} style={{
                      backgroundColor: "#ffffff", padding: "20px", borderRadius: "10px",
                      border: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "start"
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                          <h3 style={{ margin: 0, color: "#0066cc", fontSize: "1.1rem" }}>{announcement.title}</h3>
                          <div style={{
                            padding: "4px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold",
                            backgroundColor: announcement.priority === "urgent" ? "#ef4444" : 
                                            announcement.priority === "high" ? "#f59e0b" : "#0066cc",
                            color: "white"
                          }}>
                            {announcement.priority.toUpperCase()}
                          </div>
                        </div>
                        <p style={{ color: "#333", fontSize: "0.9rem", marginBottom: "5px" }}>{announcement.content}</p>
                        {announcement.createdAt && (
                          <div style={{ fontSize: "0.8rem", color: "#666" }}>
                            Created: {formatTimestamp(announcement.createdAt)}
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleDeleteAnnouncement(announcement.id || index)} style={{
                        padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none",
                        borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold"
                      }}>Delete</button>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#666", textAlign: "center", padding: "20px" }}>No announcements yet</div>
                )}
              </div>
          </div>
          )}

        {/* Delete Announcement Confirmation Modal */}
        {showDeleteAnnouncementConfirm && announcementToDelete && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#2d2d2d",
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90vw",
              color: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              border: "1px solid #444"
            }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "1.3rem", color: "white" }}>
                Delete Confirmation
              </h3>
              <p style={{ margin: "0 0 25px 0", fontSize: "1rem", color: "#ccc", lineHeight: "1.5" }}>
                Are you sure you want to delete this announcement?
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => {
                    setShowDeleteAnnouncementConfirm(false);
                    setAnnouncementToDelete(null);
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#555";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#444";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteAnnouncement}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#a855f7",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#9333ea";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#a855f7";
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

              {/* Report Layout Section */}
              {adminActiveSection === "reports" && (
                <div style={{
            backgroundColor: "#f9f9f9", padding: "30px", borderRadius: "15px",
            boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)", marginBottom: "30px", border: "2px solid #0066cc"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: "#0066cc", fontSize: "1.8rem" }}>Report Layout</h2>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={() => {
                  setShowReportLayoutModal(true);
                  setEditingReportLayout(null);
                  setReportLayoutTitle("");
                  setSelectedReportPhase("");
                  setReportHeadings([]);
                  setNewHeadingText("");
                  setReportFontSize("12");
                }}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#0066cc",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#0052a3";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(0, 102, 204, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#0066cc";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                Add Layout
              </button>
            </div>
            
            {/* Display Saved Report Layouts */}
            {savedReportLayouts.length > 0 ? (
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "15px",
                maxHeight: "600px",
                overflowY: "auto",
                overflowX: "hidden",
                paddingRight: "10px"
              }}>
                {savedReportLayouts.map((layout) => (
                  <div key={layout.id} style={{
                    backgroundColor: "#ffffff",
                    padding: "20px",
                    borderRadius: "10px",
                    border: "1px solid #e0e0e0"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: "0 0 8px 0", color: "#0066cc", fontSize: "1.3rem", fontWeight: "bold" }}>
                          {layout.title}
                        </h3>
                        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "10px" }}>
                          Phase: <strong style={{ color: "#1a1a1a" }}>
                            {layout.phase === "phase1" ? "Phase 1 Report" :
                             layout.phase === "phase2" ? "Phase 2 Report" :
                             layout.phase === "phase3" ? "Phase 3 Report" :
                             "Phase 4 Report"}
                          </strong>
                        </div>
                        {layout.headings && layout.headings.length > 0 && (
                          <div style={{ marginTop: "10px" }}>
                            <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "8px" }}>Headings:</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              {layout.headings.map((heading, idx) => (
                                <div key={idx} style={{
                                  padding: "6px 12px",
                                  backgroundColor: "#e3f2fd",
                                  borderRadius: "6px",
                                  fontSize: "0.85rem",
                                  color: "#0066cc",
                                  border: "1px solid #90caf9"
                                }}>
                                  {heading.text || `Heading ${idx + 1}`}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "10px" }}>
                          Font Size: <strong style={{ color: "#1a1a1a" }}>{layout.fontSize}px</strong>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginLeft: "15px" }}>
                        <button
                          onClick={() => {
                            setEditingReportLayout(layout);
                            setReportLayoutTitle(layout.title);
                            setSelectedReportPhase(layout.phase);
                            setReportHeadings(layout.headings || []);
                            setReportFontSize(layout.fontSize || "12");
                            setShowReportLayoutModal(true);
                          }}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#0066cc",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            fontWeight: "bold"
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setLayoutToDelete(layout);
                            setShowDeleteLayoutConfirm(true);
                          }}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#dc2626",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            fontWeight: "bold"
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#666", textAlign: "center", padding: "40px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
                No report layouts saved yet. Click "Add Layout" to create one.
              </div>
            )}
          </div>
          )}

        {/* Report Layout Modal */}
        {showReportLayoutModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#ffffff", padding: "40px", borderRadius: "15px",
              maxWidth: "600px", width: "90vw", color: "#1a1a1a", maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)", border: "1px solid #e0e0e0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                <h2 style={{ margin: 0, fontSize: "1.8rem", color: "#0066cc" }}>
                  {editingReportLayout ? "Edit Report Layout" : "Add Report Layout"}
                </h2>
                <button onClick={() => {
                  setShowReportLayoutModal(false);
                  setReportLayoutTitle("");
                  setSelectedReportPhase("");
                  setReportHeadings([]);
                  setNewHeadingText("");
                  setReportFontSize("12");
                  setEditingReportLayout(null);
                }} style={{
                  background: "transparent", border: "none", color: "#666",
                  fontSize: "1.5rem", cursor: "pointer", fontWeight: "bold",
                  width: "30px", height: "30px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                  e.target.style.color = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#666";
                }}>×</button>
              </div>

              {/* Title Input */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>
                  Title:
                </label>
                <input
                  type="text"
                  value={reportLayoutTitle}
                  onChange={(e) => setReportLayoutTitle(e.target.value)}
                  placeholder="Enter report title"
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                    color: "#1a1a1a",
                    fontSize: "1rem",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }}
                />
              </div>

              {/* Phase Dropdown */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>
                  Select Phase Report:
                </label>
                <select
                  value={selectedReportPhase}
                  onChange={(e) => setSelectedReportPhase(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                    color: "#1a1a1a",
                    fontSize: "1rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }}
                >
                  <option value="">-- Select a Phase Report --</option>
                  <option value="phase1">Phase 1 Report</option>
                  <option value="phase2">Phase 2 Report</option>
                  <option value="phase3">Phase 3 Report</option>
                  <option value="phase4">Phase 4 Report</option>
                </select>
              </div>

              {/* Add Heading Section */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>
                  Headings:
                </label>

                {/* Display Headings */}
                {reportHeadings.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "15px" }}>
                    {reportHeadings.map((heading) => (
                      <div key={heading.id} style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px 15px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0"
                      }}>
                        <div style={{ flex: 1, position: "relative" }}>
                          <input
                            type="text"
                            value={heading.text}
                            onChange={(e) => {
                              const newText = e.target.value;
                              setReportHeadings(reportHeadings.map(h =>
                                h.id === heading.id ? { ...h, text: newText } : h
                              ));
                              getHeaderSuggestions(newText, heading.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                if (showSuggestionsForId === heading.id && activeSuggestionIndex >= 0 && headerSuggestions.length > 0) {
                                  // Use selected suggestion
                                  e.preventDefault();
                                  setReportHeadings(reportHeadings.map(h =>
                                    h.id === heading.id ? { ...h, text: headerSuggestions[activeSuggestionIndex] } : h
                                  ));
                                  setHeaderSuggestions([]);
                                  setShowSuggestionsForId(null);
                                  setActiveSuggestionIndex(-1);
                                } else {
                                  // Add new heading
                                  const index = reportHeadings.findIndex(h => h.id === heading.id);
                                  setReportHeadings([
                                    ...reportHeadings.slice(0, index + 1),
                                    { id: Date.now(), text: "" },
                                    ...reportHeadings.slice(index + 1)
                                  ]);
                                  setHeaderSuggestions([]);
                                  setShowSuggestionsForId(null);
                                }
                              } else if (e.key === "ArrowDown") {
                                e.preventDefault();
                                if (showSuggestionsForId === heading.id && headerSuggestions.length > 0) {
                                  setActiveSuggestionIndex(prev => 
                                    prev < headerSuggestions.length - 1 ? prev + 1 : prev
                                  );
                                }
                              } else if (e.key === "ArrowUp") {
                                e.preventDefault();
                                if (showSuggestionsForId === heading.id) {
                                  setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                                }
                              } else if (e.key === "Escape") {
                                setHeaderSuggestions([]);
                                setShowSuggestionsForId(null);
                                setActiveSuggestionIndex(-1);
                              }
                            }}
                            onBlur={(e) => {
                              // Reset border color
                              if (e.target === e.currentTarget) {
                                e.target.style.borderColor = "#e0e0e0";
                              }
                              // Delay hiding suggestions to allow clicking on them
                              // Check if the blur is not caused by clicking on a suggestion
                              setTimeout(() => {
                                // Only hide if we're not clicking on a suggestion
                                if (!e.relatedTarget || !e.relatedTarget.closest('[data-suggestion]')) {
                                  setHeaderSuggestions([]);
                                  setShowSuggestionsForId(null);
                                  setActiveSuggestionIndex(-1);
                                }
                              }, 250);
                            }}
                            onFocus={(e) => {
                              // Update border color
                              e.target.style.borderColor = "#0066cc";
                              // Show suggestions if there's text
                              if (e.target.value) {
                                getHeaderSuggestions(e.target.value, heading.id);
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "12px 15px",
                              borderRadius: "8px",
                              border: "1px solid #e0e0e0",
                              backgroundColor: "#ffffff",
                              color: "#1a1a1a",
                              fontSize: "1rem",
                              outline: "none",
                              boxSizing: "border-box",
                              transition: "border-color 0.3s ease"
                            }}
                            placeholder="Type to see suggestions..."
                          />
                          
                          {/* Suggestions Dropdown */}
                          {showSuggestionsForId === heading.id && headerSuggestions.length > 0 && (
                            <div style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              marginTop: "5px",
                              backgroundColor: "#ffffff",
                              border: "1px solid #e0e0e0",
                              borderRadius: "8px",
                              maxHeight: "250px",
                              overflowY: "auto",
                              zIndex: 1000,
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
                            }}>
                              {headerSuggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  data-suggestion="true"
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent input blur before click
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setReportHeadings(reportHeadings.map(h =>
                                      h.id === heading.id ? { ...h, text: suggestion } : h
                                    ));
                                    setHeaderSuggestions([]);
                                    setShowSuggestionsForId(null);
                                    setActiveSuggestionIndex(-1);
                                  }}
                                  style={{
                                    padding: "12px 15px",
                                    cursor: "pointer",
                                    borderBottom: index < headerSuggestions.length - 1 ? "1px solid #e0e0e0" : "none",
                                    color: "#1a1a1a",
                                    fontSize: "0.9rem",
                                    backgroundColor: activeSuggestionIndex === index ? "#e3f2fd" : "transparent",
                                    transition: "background-color 0.2s"
                                  }}
                                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                                  onMouseLeave={() => setActiveSuggestionIndex(-1)}
                                >
                                  {suggestion}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setReportHeadings(reportHeadings.filter(h => h.id !== heading.id));
                          }}
                          style={{
                            padding: "12px 15px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "1.5rem",
                            cursor: "pointer",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "45px",
                            height: "45px",
                            transition: "all 0.3s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#dc2626";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#ef4444";
                          }}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Header Button - Below the boxes */}
                <button
                  onClick={() => {
                    // Add a new empty heading
                    setReportHeadings([...reportHeadings, { id: Date.now(), text: "" }]);
                  }}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#22c55e",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#16a34a";
                    e.target.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#22c55e";
                    e.target.style.transform = "translateY(0)";
                  }}
                >
                  Add Header
                </button>
              </div>

              {/* Font Size Input */}
              <div style={{ marginBottom: "25px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>
                  Font Size:
                </label>
                <input
                  type="number"
                  value={reportFontSize}
                  onChange={(e) => setReportFontSize(e.target.value)}
                  min="8"
                  max="72"
                  placeholder="Enter font size"
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                    color: "#1a1a1a",
                    fontSize: "1rem",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowReportLayoutModal(false);
                    setReportLayoutTitle("");
                    setSelectedReportPhase("");
                    setReportHeadings([]);
                    setNewHeadingText("");
                    setReportFontSize("12");
                    setEditingReportLayout(null);
                  }}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#f5f5f5",
                    color: "#1a1a1a",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#e0e0e0";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#f5f5f5";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!reportLayoutTitle.trim() || !selectedReportPhase) {
                      setNotification({ show: true, message: "Please fill in the title and select a phase report.", type: "error" });
                      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
                      return;
                    }
                    
                    try {
                      const res = await fetch("http://localhost:5000/admin/report-layouts", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: editingReportLayout ? editingReportLayout.id : null,
                          title: reportLayoutTitle.trim(),
                          phase: selectedReportPhase,
                          headings: reportHeadings || [],
                          fontSize: reportFontSize || "12"
                        })
                      });
                      
                      if (!res.ok) {
                        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
                        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
                      }
                      
                      const data = await res.json();
                      
                      if (data.success) {
                        await fetchReportLayouts();
                        addAdminLog(editingReportLayout ? "Updated report layout" : "Created report layout", {
                          title: reportLayoutTitle,
                          phase: selectedReportPhase
                        });
                        if (editingReportLayout) {
                          setNotification({ show: true, message: "Updated", type: "success" });
                          setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
                        }
                        setShowReportLayoutModal(false);
                        setReportLayoutTitle("");
                        setSelectedReportPhase("");
                        setReportHeadings([]);
                        setNewHeadingText("");
                        setReportFontSize("12");
                        setEditingReportLayout(null);
                      } else {
                        setNotification({ show: true, message: `Failed to save report layout: ${data.error || "Unknown error"}`, type: "error" });
                        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
                      }
                    } catch (e) {
                      console.error("Failed to save report layout", e);
                      const errorMessage = e.message || "Unknown error";
                      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
                        setNotification({ show: true, message: "Cannot connect to server. Please make sure the backend is running on http://localhost:5000", type: "error" });
                        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
                      } else {
                        setNotification({ show: true, message: `Failed to save report layout: ${errorMessage}`, type: "error" });
                        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
                      }
                    }
                  }}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#22c55e",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#16a34a";
                    e.target.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#22c55e";
                    e.target.style.transform = "translateY(0)";
                  }}
                >
                  {editingReportLayout ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Announcement Modal */}
        {showAnnouncementModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#ffffff", padding: "40px", borderRadius: "15px",
              maxWidth: "600px", width: "90vw", color: "#1a1a1a", maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)", border: "1px solid #e0e0e0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                <h2 style={{ margin: 0, fontSize: "1.8rem", color: "#0066cc" }}>Add Announcement</h2>
                <button onClick={() => {
                  setShowAnnouncementModal(false);
                  setNewAnnouncement({ title: "", content: "" });
                }} style={{
                  background: "transparent", border: "none", color: "#666",
                  fontSize: "1.5rem", cursor: "pointer", fontWeight: "bold",
                  width: "30px", height: "30px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                  e.target.style.color = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#666";
                }}>
                  ×
                </button>
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>Title:</label>
                <input type="text" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  style={{
                    width: "100%", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff", color: "#1a1a1a", fontSize: "1rem",
                    outline: "none", boxSizing: "border-box", transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }} />
              </div>

              <div style={{ marginBottom: "25px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>Content:</label>
                <textarea value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  rows="5" style={{
                    width: "100%", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff", color: "#1a1a1a", fontSize: "1rem", resize: "vertical",
                    outline: "none", boxSizing: "border-box", transition: "border-color 0.3s ease",
                    fontFamily: "inherit"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }} />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button onClick={() => {
                  setShowAnnouncementModal(false);
                  setNewAnnouncement({ title: "", content: "" });
                }} style={{
                  padding: "12px 24px", backgroundColor: "#f5f5f5", color: "#1a1a1a",
                  border: "1px solid #e0e0e0", borderRadius: "8px", cursor: "pointer", fontWeight: "bold",
                  fontSize: "1rem", transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                }}>Cancel</button>
                <button onClick={handleSaveAnnouncement} style={{
                  padding: "12px 24px", backgroundColor: "#22c55e", color: "white",
                  border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold",
                  fontSize: "1rem", transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#16a34a";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#22c55e";
                  e.target.style.transform = "translateY(0)";
                }}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Review Name Modal */}
        {showReviewNameModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#ffffff", padding: "30px", borderRadius: "15px",
              maxWidth: "500px", width: "90vw", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              border: "1px solid #e0e0e0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#0066cc" }}>Add Review</h2>
                <button onClick={() => {
                  setShowReviewNameModal(false);
                  setReviewNameInput("");
                }} style={{
                  background: "transparent", border: "none", color: "#666",
                  fontSize: "1.5rem", cursor: "pointer", fontWeight: "bold",
                  width: "30px", height: "30px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                  e.target.style.color = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#666";
                }}>
                  ×
                </button>
              </div>

              <div style={{ marginBottom: "25px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>
                  Enter review name:
                </label>
                <input
                  type="text"
                  value={reviewNameInput}
                  onChange={(e) => setReviewNameInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSubmitReviewName();
                    }
                  }}
                  placeholder="e.g., Review 1, Final Review"
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                    color: "#1a1a1a",
                    fontSize: "1rem",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button onClick={() => {
                  setShowReviewNameModal(false);
                  setReviewNameInput("");
                }} style={{
                  padding: "10px 20px",
                  backgroundColor: "#f5f5f5",
                  color: "#1a1a1a",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                }}>
                  Cancel
                </button>
                <button onClick={handleSubmitReviewName} style={{
                  padding: "10px 20px",
                  backgroundColor: "#0066cc",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#0056b3";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#0066cc";
                  e.target.style.transform = "translateY(0)";
                }}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Review Confirmation Modal */}
        {showDeleteReviewConfirm && deleteReviewData && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#ffffff", padding: "30px", borderRadius: "15px",
              maxWidth: "500px", width: "90vw", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              border: "1px solid #e0e0e0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#ef4444" }}>Confirm Deletion</h2>
                <button onClick={() => {
                  setShowDeleteReviewConfirm(false);
                  setDeleteReviewData(null);
                }} style={{
                  background: "transparent", border: "none", color: "#666",
                  fontSize: "1.5rem", cursor: "pointer", fontWeight: "bold",
                  width: "30px", height: "30px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                  e.target.style.color = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#666";
                }}>
                  ×
                </button>
              </div>

              <div style={{ marginBottom: "25px" }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: "1rem", 
                  color: "#1a1a1a",
                  lineHeight: "1.6"
                }}>
                  Are you sure you want to delete <strong>"{deleteReviewData.reviewName}"</strong> from <strong>{deleteReviewData.phaseName}</strong>?
                </p>
                <p style={{ 
                  margin: "15px 0 0 0", 
                  fontSize: "0.9rem", 
                  color: "#ef4444",
                  fontWeight: "500"
                }}>
                  This action cannot be undone.
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button onClick={() => {
                  setShowDeleteReviewConfirm(false);
                  setDeleteReviewData(null);
                }} style={{
                  padding: "10px 20px",
                  backgroundColor: "#f5f5f5",
                  color: "#1a1a1a",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                }}>
                  Cancel
                </button>
                <button onClick={handleConfirmDeleteReview} style={{
                  padding: "10px 20px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#dc2626";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#ef4444";
                  e.target.style.transform = "translateY(0)";
                }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add File Type Modal */}
        {showFileTypeModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#ffffff", padding: "30px", borderRadius: "15px",
              maxWidth: "500px", width: "90vw", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              border: "1px solid #e0e0e0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#0066cc" }}>Add File Type</h2>
                <button onClick={() => {
                  setShowFileTypeModal(false);
                  setFileTypeKey("");
                  setFileTypeLabel("");
                }} style={{
                  background: "transparent", border: "none", color: "#666",
                  fontSize: "1.5rem", cursor: "pointer", fontWeight: "bold",
                  width: "30px", height: "30px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                  e.target.style.color = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#666";
                }}>
                  ×
                </button>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>
                  Enter file type key (e.g., 'deliverable3'):
                </label>
                <input
                  type="text"
                  value={fileTypeKey}
                  onChange={(e) => setFileTypeKey(e.target.value)}
                  placeholder="e.g., deliverable3"
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                    color: "#1a1a1a",
                    fontSize: "1rem",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }}
                />
              </div>

              <div style={{ marginBottom: "25px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>
                  Enter file type label (e.g., 'Deliverable 3'):
                </label>
                <input
                  type="text"
                  value={fileTypeLabel}
                  onChange={(e) => setFileTypeLabel(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSubmitFileType();
                    }
                  }}
                  placeholder="e.g., Deliverable 3"
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                    color: "#1a1a1a",
                    fontSize: "1rem",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button onClick={() => {
                  setShowFileTypeModal(false);
                  setFileTypeKey("");
                  setFileTypeLabel("");
                }} style={{
                  padding: "10px 20px",
                  backgroundColor: "#f5f5f5",
                  color: "#1a1a1a",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                }}>
                  Cancel
                </button>
                <button onClick={handleSubmitFileType} style={{
                  padding: "10px 20px",
                  backgroundColor: "#0066cc",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#0056b3";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#0066cc";
                  e.target.style.transform = "translateY(0)";
                }}>
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit/Add Submission Modal */}
        {showEditSubmissionModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#ffffff", padding: "40px", borderRadius: "15px",
              maxWidth: "600px", width: "90vw", color: "#1a1a1a", maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)", border: "1px solid #e0e0e0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                <h2 style={{ margin: 0, fontSize: "1.8rem", color: "#0066cc" }}>{editingSubmission ? "Edit Submission" : "Add Submission"}</h2>
                <button onClick={() => {
                  setShowEditSubmissionModal(false);
                  setEditingSubmission(null);
                  setNewSubmission({ team: "", submissionType: "ontime", files: [], count: 0 });
                }} style={{
                  background: "transparent", border: "none", color: "#666",
                  fontSize: "1.5rem", cursor: "pointer", fontWeight: "bold",
                  width: "30px", height: "30px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                  e.target.style.color = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#666";
                }}>
                  ×
                </button>
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>Team Name:</label>
                <input type="text" value={newSubmission.team} onChange={(e) => setNewSubmission({ ...newSubmission, team: e.target.value })}
                  disabled={!!editingSubmission} style={{
                    width: "100%", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e0e0e0",
                    backgroundColor: editingSubmission ? "#f5f5f5" : "#ffffff", color: "#1a1a1a",
                    fontSize: "1rem", outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    if (!editingSubmission) e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>Submission Type:</label>
                <select value={newSubmission.submissionType} onChange={(e) => setNewSubmission({ ...newSubmission, submissionType: e.target.value })}
                  style={{
                    width: "100%", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff", color: "#1a1a1a", fontSize: "1rem",
                    cursor: "pointer", outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }}>
                  <option value="ontime">On-Time</option>
                  <option value="late">Late</option>
                </select>
              </div>

              <div style={{ marginBottom: "25px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label style={{ display: "block", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>Files ({newSubmission.files.length}):</label>
                  <label style={{
                    padding: "8px 16px", backgroundColor: "#22c55e", color: "white", border: "none",
                    borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem",
                    transition: "all 0.3s ease", display: "inline-block"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#16a34a";
                    e.target.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#22c55e";
                    e.target.style.transform = "translateY(0)";
                  }}>
                    Add Files
                    <input
                      type="file"
                      multiple
                      onChange={handleAddFileToSubmission}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                {newSubmission.files.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px", overflowY: "auto" }}>
                    {newSubmission.files.map((file, index) => (
                      <div key={index} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 12px", backgroundColor: "#f5f5f5",
                        borderRadius: "6px", border: "1px solid #e0e0e0"
                      }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "0.9rem", color: "#1a1a1a", fontWeight: "500" }}>
                            {file.name}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#666" }}>
                            {(file.size / 1024).toFixed(2)} KB
                          </span>
                        </div>
                        <button onClick={() => handleRemoveFileFromSubmission(index)} type="button" style={{
                          padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none",
                          borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold",
                          transition: "all 0.3s ease", marginLeft: "12px"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#dc2626";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#ef4444";
                        }}>Remove</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "#666", padding: "20px", textAlign: "center", backgroundColor: "#f5f5f5", borderRadius: "6px", border: "1px solid #e0e0e0", borderStyle: "dashed" }}>
                    No files added. Click "Add Files" to upload files.
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button onClick={() => {
                  setShowEditSubmissionModal(false);
                  setEditingSubmission(null);
                  setNewSubmission({ team: "", submissionType: "ontime", files: [], count: 0 });
                }} style={{
                  padding: "12px 24px", backgroundColor: "#f5f5f5", color: "#1a1a1a",
                  border: "1px solid #e0e0e0", borderRadius: "8px", cursor: "pointer", fontWeight: "bold",
                  fontSize: "1rem", transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                }}>Cancel</button>
                <button onClick={handleSaveSubmission} style={{
                  padding: "12px 24px", backgroundColor: "#22c55e", color: "white",
                  border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold",
                  fontSize: "1rem", transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#16a34a";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#22c55e";
                  e.target.style.transform = "translateY(0)";
                }}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Team Modal */}
        {showEditTeamModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#ffffff", padding: "40px", borderRadius: "15px",
              maxWidth: "600px", width: "90vw", color: "#1a1a1a", maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)", border: "1px solid #e0e0e0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                <h2 style={{ margin: 0, fontSize: "1.8rem", color: "#0066cc" }}>{editingTeam ? "Edit Team" : "Add Team"}</h2>
                <button onClick={() => setShowEditTeamModal(false)} style={{
                  background: "transparent", border: "none", color: "#666",
                  fontSize: "1.5rem", cursor: "pointer", fontWeight: "bold",
                  width: "30px", height: "30px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                  e.target.style.color = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#666";
                }}>
                  ×
                </button>
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>Team ID:</label>
                <input type="text" value={newTeam.teamId} onChange={(e) => setNewTeam({ ...newTeam, teamId: e.target.value })}
                  disabled={!!editingTeam} style={{
                    width: "100%", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e0e0e0",
                    backgroundColor: editingTeam ? "#f5f5f5" : "#ffffff", color: "#1a1a1a",
                    fontSize: "1rem", outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    if (!editingTeam) e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>Members (Format: Name:SRN, comma-separated):</label>
                <input type="text" value={newTeam.members} onChange={(e) => setNewTeam({ ...newTeam, members: e.target.value })}
                  placeholder="John Doe:PES001, Jane Smith:PES002"
                  style={{
                    width: "100%", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff", color: "#1a1a1a", fontSize: "1rem",
                    outline: "none", boxSizing: "border-box", transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>Project Title:</label>
                <input type="text" value={newTeam.projectTitle} onChange={(e) => setNewTeam({ ...newTeam, projectTitle: e.target.value })}
                  style={{
                    width: "100%", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff", color: "#1a1a1a", fontSize: "1rem",
                    outline: "none", boxSizing: "border-box", transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>Mentor Name:</label>
                <input type="text" value={newTeam.mentorName} onChange={(e) => setNewTeam({ ...newTeam, mentorName: e.target.value })}
                  placeholder="Enter mentor name"
                  style={{
                    width: "100%", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff", color: "#1a1a1a", fontSize: "1rem",
                    outline: "none", boxSizing: "border-box", transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }} />
              </div>

              <div style={{ marginBottom: "25px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>Contact Email:</label>
                <input type="email" value={newTeam.contactEmail} onChange={(e) => setNewTeam({ ...newTeam, contactEmail: e.target.value })}
                  style={{
                    width: "100%", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff", color: "#1a1a1a", fontSize: "1rem",
                    outline: "none", boxSizing: "border-box", transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }} />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button onClick={() => setShowEditTeamModal(false)} style={{
                  padding: "12px 24px", backgroundColor: "#f5f5f5", color: "#1a1a1a",
                  border: "1px solid #e0e0e0", borderRadius: "8px", cursor: "pointer", fontWeight: "bold",
                  fontSize: "1rem", transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                }}>Cancel</button>
                <button onClick={handleSaveTeam} style={{
                  padding: "12px 24px", backgroundColor: "#22c55e", color: "white",
                  border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold",
                  fontSize: "1rem", transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#16a34a";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#22c55e";
                  e.target.style.transform = "translateY(0)";
                }}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Live Submission Modal */}
        {showEditLiveSubmissionModal && editingLiveSubmission && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#ffffff", padding: "40px", borderRadius: "15px",
              maxWidth: "600px", width: "90vw", color: "#1a1a1a", maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)", border: "1px solid #e0e0e0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                <h2 style={{ margin: 0, fontSize: "1.8rem", color: "#0066cc" }}>Edit Live Submission</h2>
                <button onClick={() => {
                  setShowEditLiveSubmissionModal(false);
                  setEditingLiveSubmission(null);
                  setBoldDeliverables(new Set());
                }} style={{
                  background: "transparent", border: "none", color: "#666",
                  fontSize: "1.5rem", cursor: "pointer", fontWeight: "bold",
                  width: "30px", height: "30px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                  e.target.style.color = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#666";
                }}>×</button>
              </div>
              
              <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "5px", color: "#1a1a1a" }}>
                  {editingLiveSubmission.phaseName} - {editingLiveSubmission.reviewName}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                  Created: {formatTimestamp(editingLiveSubmission.timestamp)}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "1rem", color: "#1a1a1a" }}>
                  Submission Deadline:
                </label>
                <input 
                  type="datetime-local" 
                  value={editingLiveSubmission.deadline || ""} 
                  onChange={(e) => setEditingLiveSubmission({ ...editingLiveSubmission, deadline: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                    color: "#1a1a1a",
                    fontSize: "1rem",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066cc";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e0e0e0";
                  }}
                />
                <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "5px" }}>
                  Set the deadline for this submission phase
                </div>
              </div>

              {editingLiveSubmission.fileTypes && editingLiveSubmission.fileTypes.length > 0 && (
                <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
                  <div style={{ fontWeight: "500", marginBottom: "8px", fontSize: "1rem", color: "#1a1a1a" }}>Required Deliverables:</div>
                  <div style={{ fontSize: "0.9rem", color: "#1a1a1a" }}>
                    {editingLiveSubmission.fileTypes.map((ft, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => {
                          const newBold = new Set(boldDeliverables);
                          if (newBold.has(idx)) {
                            newBold.delete(idx);
                          } else {
                            newBold.add(idx);
                          }
                          setBoldDeliverables(newBold);
                        }}
                        style={{ 
                          padding: "5px 0", 
                          color: "#1a1a1a",
                          fontWeight: boldDeliverables.has(idx) ? "bold" : "normal",
                          cursor: "pointer",
                          transition: "font-weight 0.2s ease"
                        }}
                      >
                        • {ft.label || ft.key}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button onClick={() => {
                  setShowEditLiveSubmissionModal(false);
                  setEditingLiveSubmission(null);
                  setBoldDeliverables(new Set());
                }} style={{
                  padding: "12px 24px", backgroundColor: "#f5f5f5", color: "#1a1a1a",
                  border: "1px solid #e0e0e0", borderRadius: "8px", cursor: "pointer", 
                  fontWeight: "500", fontSize: "1rem", transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f5f5f5";
                }}>Cancel</button>
                <button onClick={handleSaveLiveSubmission} style={{
                  padding: "12px 24px", backgroundColor: "#22c55e", color: "white",
                  border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500", 
                  fontSize: "1rem", transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#16a34a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#22c55e";
                }}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Live Submission Confirmation Modal */}
        {showDeleteLiveSubmissionConfirm && liveSubmissionToDelete && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#2d2d2d",
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90vw",
              color: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              border: "1px solid #444"
            }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "1.3rem", color: "white" }}>
                Delete Confirmation
              </h3>
              <p style={{ margin: "0 0 15px 0", fontSize: "1rem", color: "#ccc", lineHeight: "1.5" }}>
                Are you sure you want to delete this live submission?
              </p>
              <p style={{ margin: "0 0 15px 0", fontSize: "1rem", color: "white", fontWeight: "bold" }}>
                {liveSubmissionToDelete.phaseName} - {liveSubmissionToDelete.reviewName}
              </p>
              <p style={{ margin: "0 0 25px 0", fontSize: "0.9rem", color: "#ef4444", lineHeight: "1.5" }}>
                This action cannot be undone.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => {
                    setShowDeleteLiveSubmissionConfirm(false);
                    setLiveSubmissionToDelete(null);
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#555";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#444";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteLiveSubmission}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#a855f7",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#9333ea";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#a855f7";
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- STUDENT DASHBOARD ----------------
  const [team, year] = username.split("_");
  return (
    <div className="dashboard-container" style={{
      minHeight: "100vh", width: "100vw",
      position: "relative", color: "white", fontFamily: "sans-serif", overflow: "auto"
    }}>
      {previewOverlay}

      {/* Notification Toast */}
      {notification.show && (
        <div
          className="notification-toast"
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: notification.type === "success" ? "#10b981" : "#ef4444",
            color: "white",
            padding: "16px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: "300px",
            maxWidth: "500px",
            animation: "slideIn 0.3s ease-out",
            fontSize: "1rem",
            fontWeight: "500"
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>
            {notification.type === "success" ? "✓" : "✕"}
          </span>
          <span style={{ flex: 1 }}>{notification.message}</span>
          <button
            onClick={() => setNotification({ show: false, message: "", type: "success" })}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "1.2rem",
              padding: "0",
              marginLeft: "8px",
              opacity: 0.8
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Content Container */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", padding: "20px" }}>
        {/* Top Bar - Logo and Buttons */}
        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "30px" }}>
          <img
            src="/clgL.png"
            alt="College Logo"
            style={{
              width: "160px",
              height: "80px",
              objectFit: "contain",
            }}
          />
        </div>

        {/* Floating Buttons - Top Right */}
        <button
          onClick={() => {
            const contactWindow = window.open(
              "",
              "Contact Us - PES University",
              `width=${screen.width},height=${screen.height},resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
            );
            if (contactWindow) {
              contactWindow.moveTo(0, 0);
              contactWindow.resizeTo(screen.width, screen.height);
              contactWindow.document.write(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>Contact Us - PES University</title>
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body {
                        font-family: 'Montserrat', sans-serif;
                        background: #ffffff;
                        color: #1a1a1a;
                        padding: 60px 40px;
                        line-height: 1.6;
                      }
                      .container {
                        max-width: 1200px;
                        margin: 0 auto;
                      }
                      h1 {
                        font-size: 3rem;
                        color: #000000;
                        margin-bottom: 50px;
                        text-align: center;
                      }
                      h2 {
                        font-size: 2.5rem;
                        color: #1a1a1a;
                        margin-bottom: 30px;
                        margin-top: 60px;
                      }
                      .section {
                        margin-bottom: 60px;
                        padding: 40px;
                        background: #f9f9f9;
                        border-radius: 12px;
                        border-left: 4px solid #0066cc;
                      }
                      p {
                        margin-bottom: 15px;
                        font-size: 1.1rem;
                        color: #333333;
                      }
                      .contact-info {
                        margin-top: 20px;
                      }
                      .contact-info strong {
                        color: #1a1a1a;
                        display: block;
                        margin-bottom: 10px;
                        font-size: 1.2rem;
                      }
                      .contact-info div {
                        padding-left: 20px;
                        margin-bottom: 20px;
                        font-size: 1.1rem;
                        color: #333333;
                      }
                      .contact-info a {
                        color: #0066cc;
                        text-decoration: none;
                        transition: all 0.2s ease;
                      }
                      .contact-info a:hover {
                        text-decoration: underline;
                        color: #004499;
                      }
                      .close-btn {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #ef4444;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 1rem;
                        font-weight: bold;
                        z-index: 1000;
                      }
                      .close-btn:hover {
                        background: #dc2626;
                      }
                    </style>
                  </head>
                  <body>
                    <button class="close-btn" onclick="window.close()">✕ Close</button>
                    <div style="display: flex; align-items: flex-start; margin-bottom: 30px; padding: 0 40px;">
                      <img src="/clgL.png" alt="College Logo" style="width: 160px; height: 80px; object-fit: contain;" />
                    </div>
                    <div class="container">
                      <h1>About Us & Contact Information</h1>
                      
                      <div class="section">
                        <h2>About Us</h2>
                        <p>
                          PES University is a leading institution committed to academic excellence and innovation. 
                          We provide a platform for students to manage their academic submissions, track deadlines, 
                          and collaborate effectively with their teams.
                        </p>
                        <p>
                          Our mission is to empower students with cutting-edge technology and resources to excel in 
                          their academic journey and prepare them for successful careers in their chosen fields.
                        </p>
                      </div>

                      <div class="section">
                        <h2>Contact Us</h2>
                        <div class="contact-info">
                          <strong>Phone Numbers:</strong>
                          <div>
                            +91 80 26721983<br>
                            +91 80 26722108
                          </div>
                          
                          <strong>Email:</strong>
                          <div>
                            <a href="mailto:admissions@pes.edu">admissions@pes.edu</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </body>
                </html>
              `);
              contactWindow.document.close();
              setTimeout(() => {
                contactWindow.moveTo(0, 0);
                contactWindow.resizeTo(screen.width, screen.height);
              }, 100);
            }
          }}
          style={{
            position: "fixed",
            top: "30px",
            right: "30px",
            padding: "16px 32px",
            backgroundColor: "#0066cc",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "18px",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            minWidth: "140px",
            boxShadow: "0 4px 20px rgba(0, 102, 204, 0.4)",
            zIndex: 1000,
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.05) translateY(-2px)";
            e.target.style.boxShadow = "0 6px 30px rgba(0, 102, 204, 0.6)";
            e.target.style.backgroundColor = "#0052a3";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1) translateY(0)";
            e.target.style.boxShadow = "0 4px 20px rgba(0, 102, 204, 0.4)";
            e.target.style.backgroundColor = "#0066cc";
          }}
        >
          Contact Us
        </button>
        <button
          onClick={() => {
            const faqWindow = window.open(
              "",
              "FAQs - How to Use the Portal",
              `width=${screen.width},height=${screen.height},resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
            );
            if (faqWindow) {
              faqWindow.moveTo(0, 0);
              faqWindow.resizeTo(screen.width, screen.height);
              faqWindow.document.write(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>FAQs - How to Use the Portal</title>
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body {
                        font-family: 'Montserrat', sans-serif;
                        background: #ffffff;
                        color: #1a1a1a;
                        padding: 40px;
                        line-height: 1.6;
                      }
                      .container {
                        max-width: 1200px;
                        margin: 0 auto;
                      }
                      h1 {
                        font-size: 3rem;
                        color: #000000;
                        margin-bottom: 40px;
                        text-align: center;
                      }
                      h2 {
                        font-size: 2.5rem;
                        color: #000000;
                        margin-bottom: 25px;
                        margin-top: 40px;
                      }
                      h3 {
                        font-size: 2rem;
                        color: #1a1a1a;
                        margin-bottom: 15px;
                      }
                      .step {
                        margin-bottom: 60px;
                        display: flex;
                        gap: 40px;
                        align-items: flex-start;
                        padding: 30px;
                        background: #f9f9f9;
                        border-radius: 12px;
                        border-left: 4px solid #000000;
                      }
                      .step-content {
                        flex: 1;
                      }
                      .step-image {
                        flex: 1;
                        display: flex;
                        justify-content: center;
                        align-items: flex-start;
                      }
                      .step-image img {
                        max-width: 100%;
                        height: auto;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                      }
                      p {
                        margin-bottom: 12px;
                        font-size: 1.1rem;
                        color: #333333;
                      }
                      strong {
                        color: #000000;
                      }
                      .close-btn {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #ef4444;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 1rem;
                        font-weight: bold;
                        z-index: 1000;
                      }
                      .close-btn:hover {
                        background: #dc2626;
                      }
                      .action-buttons {
                        display: flex;
                        gap: 20px;
                        justify-content: center;
                        align-items: center;
                        margin: 40px 0;
                        flex-wrap: wrap;
                        position: sticky;
                        top: 0;
                        background: #ffffff;
                        padding: 20px;
                        z-index: 100;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                      }
                      .action-btn {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 14px 28px;
                        background: #f0f0f0;
                        color: #1a1a1a;
                        border: 2px solid #d0d0d0;
                        border-radius: 8px;
                        font-size: 1.1rem;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        text-decoration: none;
                      }
                      .action-btn:hover {
                        background: #000000;
                        color: white;
                        border-color: #000000;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                      }
                      .action-btn svg {
                        width: 20px;
                        height: 20px;
                      }
                      html {
                        scroll-behavior: smooth;
                      }
                    </style>
                    <script>
                      function smoothScrollTo(element, offset = 30) {
                        if (!element) return;
                        const elementPosition = element.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - offset;
                        window.scrollTo({
                          top: offsetPosition,
                          behavior: 'smooth'
                        });
                      }
                    </script>
                  </head>
                  <body>
                    <button class="close-btn" onclick="window.close()">✕ Close</button>
                    <div style="display: flex; align-items: flex-start; margin-bottom: 30px; padding: 0 40px;">
                      <img src="/clgL.png" alt="College Logo" style="width: 160px; height: 80px; object-fit: contain;" />
                    </div>
                    <div class="container">
                      <h1>How to Use the Portal</h1>
                      
                      <div class="action-buttons">
                        <a href="#login-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('login-section'); smoothScrollTo(el, 30);">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                          <span>Login</span>
                        </a>
                        <a href="#submit-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('submit-section'); smoothScrollTo(el, 30);">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          <span>Submit</span>
                        </a>
                        <a href="#view-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('view-section'); smoothScrollTo(el, 30);">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          <span>View</span>
                        </a>
                        <a href="#chatbot-section" class="action-btn" onclick="event.preventDefault(); const el = document.getElementById('chatbot-section'); smoothScrollTo(el, 30);">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          <span>Chatbot</span>
                        </a>
                      </div>
                      
                      <div id="login-section" class="step">
                        <div class="step-content">
                          <h3>Login to Your Account</h3>
                          <p>• Enter your credentials on the login form displayed on the main page</p>
                          <p>• <strong>Students:</strong> TeamNo_PassoutYear / Password: 1234</p>
                          <p>• <strong>Admins:</strong> admin / Password: admin123</p>
                          <p>• <strong>Mentors:</strong> mentor_username / Password: mentor123</p>
                        </div>
                        <div class="step-image">
                          <img src="/1.png" alt="Login Tutorial" />
                        </div>
                      </div>

                      <div id="submit-section" class="step">
                        <div class="step-content">
                          <h3>Submit Your Files</h3>
                          <p>• After logging in, you'll see the submission form on your dashboard</p>
                          <p>• Upload all required file types for your current phase and review</p>
                          <p>• Click <strong>"Submit Files"</strong> when all files are uploaded</p>
                          <p>• Make sure to submit before the deadline to avoid late submission</p>
                        </div>
                        <div class="step-image">
                          <img src="/2.png" alt="Upload Tutorial" />
                        </div>
                      </div>

                      <div id="view-section" class="step">
                        <div class="step-content">
                          <h3>View Your Submissions</h3>
                          <p>• Click <strong>"View My Past Submissions"</strong> to see your submission history</p>
                          <p>• Check submission status (On-time or Late)</p>
                          <p>• View details of each submission including timestamps and file information</p>
                          <p>• Track your progress across different phases and reviews</p>
                        </div>
                        <div class="step-image">
                          <img src="/3.png" alt="Submissions Tutorial" />
                        </div>
                      </div>

                      <div id="chatbot-section" class="step">
                        <div class="step-content">
                          <h3>Use the Chatbot</h3>
                          <p>• Click the chatbot button on your dashboard to open the chat assistant</p>
                          <p>• Ask questions about your project, research topics, or any academic queries</p>
                          <p>• The chatbot uses RAG (Retrieval Augmented Generation) to provide accurate answers</p>
                          <p>• Get instant help with your questions 24/7 without waiting for human assistance</p>
                        </div>
                        <div class="step-image">
                          <img src="/4.png" alt="Chatbot Tutorial" />
                        </div>
                      </div>

                      <div style="margin-top: 60px; padding: 30px; background: #f0f7ff; border-radius: 12px; border-left: 4px solid #000000;">
                        <h2>Need Help?</h2>
                        <p>If you encounter any issues or have questions, please contact:</p>
                        <p><strong>Email:</strong> <a href="mailto:admissions@pes.edu" style="color: #000000;">admissions@pes.edu</a></p>
                        <p><strong>Phone:</strong> +91 80 26721983 or +91 80 26722108</p>
                      </div>
                    </div>
                  </body>
                </html>
              `);
              faqWindow.document.close();
              setTimeout(() => {
                faqWindow.moveTo(0, 0);
                faqWindow.resizeTo(screen.width, screen.height);
              }, 100);
            }
          }}
          style={{
            position: "fixed",
            top: "30px",
            right: "230px",
            padding: "16px 32px",
            backgroundColor: "#0066cc",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "18px",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            minWidth: "140px",
            boxShadow: "0 4px 20px rgba(0, 102, 204, 0.4)",
            zIndex: 1000,
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.05) translateY(-2px)";
            e.target.style.boxShadow = "0 6px 30px rgba(0, 102, 204, 0.6)";
            e.target.style.backgroundColor = "#0052a3";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1) translateY(0)";
            e.target.style.boxShadow = "0 4px 20px rgba(0, 102, 204, 0.4)";
            e.target.style.backgroundColor = "#0066cc";
          }}
        >
          FAQs
        </button>

        {/* Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div style={{
            backgroundColor: "#ffffff",
            padding: "15px 25px", borderRadius: "15px", fontSize: "1.1rem", fontWeight: "500",
            border: "2px solid #0066cc", boxShadow: "0 2px 10px rgba(0, 102, 204, 0.2)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0066cc" }}>
              <span>Welcome, Team {team} (Batch {year})!</span>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <div style={{
              backgroundColor: "#ffffff",
              padding: "15px 25px", borderRadius: "15px", fontSize: "1.5rem", fontWeight: "bold",
              border: "2px solid #0066cc", boxShadow: "0 2px 10px rgba(0, 102, 204, 0.2)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0066cc" }}>
                <span>{time.toLocaleTimeString()}</span>
              </div>
            </div>
            
            <button onClick={handleLogout} style={{
              padding: "10px 20px",
              backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px",
              cursor: "pointer", fontWeight: "bold", fontSize: "1rem", transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#dc2626";
              e.target.style.transform = "scale(1.05)";
              e.target.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#ef4444";
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "none";
            }}>Logout</button>
          </div>
        </div>

        {/* Sidebar Navigation and Content */}
        <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
          {/* Tabbed Navigation - Vertical Sidebar */}
          <div className="dashboard-tabs admin-dashboard-tabs" style={{ marginBottom: "0" }}>
            <button 
              className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
            <button 
              className={`tab-button ${activeTab === "submissions" ? "active" : ""}`}
              onClick={() => setActiveTab("submissions")}
            >
              Submissions
            </button>
            <button 
              className={`tab-button ${activeTab === "viewAll" ? "active" : ""}`}
              onClick={() => setActiveTab("viewAll")}
            >
              My Submissions
            </button>
            <button 
              className={`tab-button ${activeTab === "announcements" ? "active" : ""}`}
              onClick={() => setActiveTab("announcements")}
              style={{ position: "relative" }}
            >
              Announcements
              {phaseReviewChangeCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)"
                }}>
                  {phaseReviewChangeCount > 9 ? "9+" : phaseReviewChangeCount}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content" style={{ flex: 1, margin: "0", maxWidth: "none", paddingBottom: "60px" }}>
          {/* Profile Tab */}
          {activeTab === "profile" && teamDetails && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Left side - Team Profile */}
              <div style={{
                backgroundColor: "#ffffff", padding: "40px", borderRadius: "20px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1), 0 0 10px rgba(0, 102, 204, 0.15)",
                border: "2px solid #e0e0e0"
              }}>
                <h2 style={{ margin: "0 0 30px 0", fontSize: "2rem", color: "#0066cc", textAlign: "center" }}>
                   Team Profile
                </h2>
                {teamDetails.projectTitle && (
                  <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "10px", border: "1px solid #e0e0e0" }}>
                    <div style={{ fontSize: "0.9rem", color: "#0066cc", marginBottom: "5px", fontWeight: "500" }}>Project Title</div>
                    <div style={{ fontSize: "1.1rem", color: "#1a1a1a" }}> {teamDetails.projectTitle}</div>
                  </div>
                )}
                {teamDetails.mentorName && (
                  <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "10px", border: "1px solid #e0e0e0" }}>
                    <div style={{ fontSize: "0.9rem", color: "#0066cc", marginBottom: "5px", fontWeight: "500" }}>Mentor</div>
                    <div style={{ fontSize: "1.1rem", color: "#1a1a1a" }}> {teamDetails.mentorName}</div>
                  </div>
                )}
                {teamDetails.members && teamDetails.members.length > 0 && (
                  <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "10px", border: "1px solid #e0e0e0" }}>
                    <div style={{ fontSize: "0.9rem", color: "#0066cc", marginBottom: "10px", fontWeight: "500" }}>Team Members</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {teamDetails.members.map((member, idx) => (
                        <div key={idx} style={{
                          padding: "8px 15px", backgroundColor: "#e3f2fd",
                          borderRadius: "8px", fontSize: "0.95rem", color: "#0066cc", border: "1px solid #0066cc"
                        }}>
                          {typeof member === "string" ? member : member.name ? (member.srn ? `${member.name} (${member.srn})` : member.name) : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {teamDetails.contactEmail && (
                  <div style={{ padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "10px", border: "1px solid #e0e0e0" }}>
                    <div style={{ fontSize: "0.9rem", color: "#0066cc", marginBottom: "5px", fontWeight: "500" }}>Contact Email</div>
                    <div style={{ fontSize: "1rem", color: "#1a1a1a" }}> {teamDetails.contactEmail}</div>
                  </div>
                )}
              </div>

              {/* Right side - Progress Bars */}
              <div style={{
                backgroundColor: "#ffffff", padding: "40px", borderRadius: "20px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1), 0 0 10px rgba(0, 102, 204, 0.15)",
                border: "2px solid #e0e0e0",
                display: "flex", flexDirection: "column", justifyContent: "space-between"
              }}>
                <h2 style={{ margin: "0 0 30px 0", fontSize: "2rem", color: "#0066cc", textAlign: "center" }}>
                   Project Progress
                </h2>
                
                {/* Overall 2-Year Progress */}
                <div style={{ marginBottom: "15px" }}>
                  <div style={{ fontSize: "1rem", color: "#000000", marginBottom: "15px", textAlign: "center", fontWeight: "bold" }}>
                    Overall Progress (4 Phases)
                  </div>
                  <div key={`progress-container-overall-${teamProgress?.overallProgress || 0}`} style={{ padding: "20px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      {(() => {
                        // Use backend calculated progress: team submissions / total submissions
                        const overallProgress = teamProgress?.overallProgress || 0;
                        const completedReviews = teamProgress?.completedReviews || 0;
                        const totalReviews = teamProgress?.totalReviews || 0;
                        
                        return (
                          <>
                            <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto" }}>
                              <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                                <circle
                                  cx="60"
                                  cy="60"
                                  r="52"
                                  fill="none"
                                  stroke="#e0e0e0"
                                  strokeWidth="8"
                                />
                                <circle
                                  cx="60"
                                  cy="60"
                                  r="52"
                                  fill="none"
                                  stroke="#0066cc"
                                  strokeWidth="8"
                                  strokeLinecap="round"
                                  strokeDasharray={`${2 * Math.PI * 52}`}
                                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - overallProgress / 100)}`}
                                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                                />
                              </svg>
                              <div style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                fontSize: "1.8rem",
                                fontWeight: "bold",
                                color: "#0066cc"
                              }}>
                                {Math.round(overallProgress * 10) / 10}%
                              </div>
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "10px" }}>
                              {completedReviews} of {totalReviews || completedReviews || 0} reviews completed
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Divider Line */}
                <div style={{ width: "100%", height: "1px", backgroundColor: "#e0e0e0", margin: "15px 0" }}></div>

                {/* Current Phase Progress */}
                <div>
                  <div style={{ fontSize: "1rem", color: "#000000", marginBottom: "15px", textAlign: "center", fontWeight: "bold" }}>
                    Current Phase Progress
                  </div>
                  <div style={{ padding: "20px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      {(() => {
                        const phaseProgress = teamProgress?.currentPhaseProgress || 0;
                        const currentPhaseName = teamProgress?.currentPhaseName || activePhaseReview?.phaseName || "No Phase Set";
                        const currentReviewName = teamProgress?.currentReviewName || activePhaseReview?.reviewName || "No Review Set";
                        const completedReviewsInPhase = teamProgress?.completedReviewsInPhase ?? 0;
                        const totalReviewsInPhase = teamProgress?.totalReviewsInPhase ?? 0;
                        
                        return (
                          <>
                            <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto" }}>
                              <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                                <circle
                                  cx="60"
                                  cy="60"
                                  r="52"
                                  fill="none"
                                  stroke="#e0e0e0"
                                  strokeWidth="8"
                                />
                                <circle
                                  cx="60"
                                  cy="60"
                                  r="52"
                                  fill="none"
                                  stroke="#0066cc"
                                  strokeWidth="8"
                                  strokeLinecap="round"
                                  strokeDasharray={`${2 * Math.PI * 52}`}
                                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - phaseProgress / 100)}`}
                                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                                />
                              </svg>
                              <div style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                fontSize: "1.8rem",
                                fontWeight: "bold",
                                color: "#0066cc"
                              }}>
                                {Math.round(phaseProgress * 10) / 10}%
                              </div>
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "10px" }}>
                              {currentPhaseName}: {currentReviewName}
                            </div>
                            {totalReviewsInPhase > 0 && (
                              <div style={{ fontSize: "0.7rem", color: "#888", marginTop: "5px" }}>
                                {completedReviewsInPhase} of {totalReviewsInPhase} reviews
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === "submissions" && activePhaseReview && fileTypes.length > 0 && (
            <form key={`submissions-form-${fileTypes.length}-${fileTypes.map(ft => `${ft.key}-${ft.label}`).join('-')}`} onSubmit={handleSubmit} style={{
              backgroundColor: "#ffffff", padding: "40px", borderRadius: "20px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1), 0 0 10px rgba(0, 102, 204, 0.15)",
              border: "2px solid #e0e0e0"
            }}>
          <h2 style={{ 
            marginBottom: "30px", 
            fontSize: "1.5rem", 
            fontWeight: "bold",
            color: "#0066cc",
            textAlign: "center"
          }}>
            {hasSubmitted ? "Submission completed — You can't upload files again" : " Upload Your Files"}
          </h2>

          {/* Deadline Display */}
          {deadline && (
            <div style={{
              backgroundColor: "#f5f5f5",
              border: "2px solid #0066cc",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "15px",
              marginLeft: "auto",
              marginRight: "auto",
              maxWidth: "500px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.85rem", color: "#0066cc", marginBottom: "4px", fontWeight: "bold" }}>
                Submission Deadline
              </div>
              <div style={{ fontSize: "1rem", marginBottom: "2px", color: "#1a1a1a", fontWeight: "bold" }}>
                {new Date(deadline).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div style={{ fontSize: "0.85rem", marginBottom: "8px", color: "#666" }}>
                {new Date(deadline).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
              <div style={{
                fontSize: "0.95rem", 
                fontWeight: "bold", 
                padding: "8px 12px",
                backgroundColor: deadline && getTimeRemaining().expired ? "#ffe5e5" : "#e5ffe5",
                borderRadius: "8px", 
                border: `2px solid ${deadline && getTimeRemaining().expired ? "#ff6b6b" : "#00cc00"}`,
                color: deadline && getTimeRemaining().expired ? "#ff6b6b" : "#00cc00"
              }}>
                {deadline ? getTimeRemaining().text : "Calculating..."}
              </div>
            </div>
          )}
          
          {hasSubmitted && submissionStatus && (
            <div style={{
              backgroundColor: submissionStatus.isLate ? "#ffe5e5" : "#e5ffe5",
              border: `2px solid ${submissionStatus.isLate ? "#ff6b6b" : "#00cc00"}`,
              borderRadius: "10px", padding: "15px", marginBottom: "20px", textAlign: "left"
            }}>
              <div style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "10px", color: submissionStatus.isLate ? "#ff6b6b" : "#00cc00" }}>
                {submissionStatus.isLate ? "Late Submission" : "On-Time Submission"}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "5px" }}>
            Submitted: {formatTimestamp(submissionStatus.timestamp)}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "5px" }}>
                Files stored securely in MongoDB. Use the links below to download:
              </div>
              <ul style={{ margin: "0 0 0 18px", padding: 0, listStyle: "disc" }}>
                {(submissionStatus.files || []).filter(Boolean).map((file, index) => (
                  <li key={index} style={{ marginBottom: "4px" }}>
                    <span style={{ marginRight: "8px" }}>
                      {file.typeLabel || file.fieldName}: {file.filename}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePreviewFile(file)}
                      style={{ color: submissionStatus.isLate ? "#f87171" : "#22c55e", textDecoration: "underline", marginRight: "10px", background: "transparent", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
                    >
                      View
                    </button>
                    <a
                      href={`http://localhost:5000${file.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#93c5fd", textDecoration: "underline" }}
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasSubmitted ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
              <div>Form disabled - Submission completed</div>
              <div style={{ fontSize: "0.9rem", marginTop: "5px" }}>No re-submissions allowed</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", gap: "16px", flexWrap: "wrap", width: "100%" }}>
              {fileTypes.map((fileType) => (
                <div key={fileType.key} style={{ flex: "0 1 auto", width: "220px", minWidth: "180px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "500", color: "#1a1a1a", textAlign: "center" }}>
                    {fileType.label}:
                  </label>
                  {!files[fileType.key] ? (
                    <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
                      <input 
                        type="file" 
                        accept={getFileAcceptAttribute(fileType.fileType)}
                        onChange={(e) => handleFileChange(e, fileType.key)}
                        style={{ 
                          position: "absolute",
                          opacity: 0,
                          width: "100%",
                          height: "100%",
                          cursor: "pointer",
                          zIndex: 2
                        }} 
                      />
                      <div 
                        className="file-upload-area"
                        style={{
                          padding: "8px", 
                          backgroundColor: "#f5f5f5",
                          border: "2px dashed #0066cc",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          textAlign: "center",
                          color: "#0066cc",
                          fontWeight: "500",
                          position: "relative",
                          zIndex: 1,
                          minHeight: "80px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          fontSize: "0.75rem"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#e3f2fd";
                          e.target.style.borderColor = "#0066cc";
                          e.target.style.transform = "scale(1.02)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#f5f5f5";
                          e.target.style.borderColor = "#0066cc";
                          e.target.style.transform = "scale(1)";
                        }}
                      >
                        <div style={{ fontSize: "0.7rem", marginBottom: "4px" }}>
                          {fileType.fileType && fileType.fileType !== "any" 
                            ? `${fileType.fileType.toUpperCase()}`
                            : "Upload"
                          }
                        </div>
                        <div style={{ fontSize: "0.65rem" }}>Click to upload</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      display: "flex", 
                      flexDirection: "column",
                      gap: "6px", 
                      padding: "8px",
                      backgroundColor: "#e5ffe5",
                      border: "2px solid #00cc00",
                      borderRadius: "8px",
                      minHeight: "80px",
                      justifyContent: "center"
                    }}>
                      <p style={{ fontSize: "0.75rem", color: "#00cc00", fontWeight: "500", wordBreak: "break-word", textAlign: "center" }}>
                        ✓ {files[fileType.key].name}
                      </p>
                      <button type="button" onClick={() => handleFileDelete(fileType.key)} style={{
                        background: "rgba(255, 107, 107, 0.2)", border: "1px solid #ff6b6b", color: "#ff6b6b",
                        fontSize: "0.7rem", cursor: "pointer", padding: "4px 8px", borderRadius: "4px",
                        fontWeight: "bold", transition: "all 0.2s ease", width: "100%"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "rgba(255, 107, 107, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "rgba(255, 107, 107, 0.2)";
                      }}
                      title="Remove file">Remove</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ 
            display: "flex", 
            flexDirection: "row", 
            gap: "16px", 
            marginTop: "40px",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%"
          }}>
            <button type="submit" disabled={hasSubmitted} style={{
              padding: "8px 16px", backgroundColor: hasSubmitted ? "#999" : "#0066cc",
              color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1.1rem",
              cursor: hasSubmitted ? "not-allowed" : "pointer",
              opacity: hasSubmitted ? 0.6 : 1, transition: "all 0.3s ease", boxShadow: "0 3px 10px rgba(0, 102, 204, 0.3)",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => {
              if (!hasSubmitted) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(0, 102, 204, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!hasSubmitted) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(0, 102, 204, 0.3)";
              }
            }}>
              {hasSubmitted ? "Already Submitted" : "Submit Files"}
            </button>

            <button type="button" onClick={() => {
              setActiveTab("viewAll");
            }} style={{
              padding: "8px 16px", backgroundColor: "#0c4a6e", color: "white",
              border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1.1rem", cursor: "pointer",
              transition: "all 0.3s ease", boxShadow: "0 3px 10px rgba(12, 74, 110, 0.3)",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(12, 74, 110, 0.4)";
              e.target.style.backgroundColor = "#075985";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(12, 74, 110, 0.3)";
              e.target.style.backgroundColor = "#0c4a6e";
            }}>
               View My Submissions
            </button>
          </div>
            </form>
          )}

          {activeTab === "submissions" && (!activePhaseReview || fileTypes.length === 0) && (
            <div style={{
              backgroundColor: "#ffffff", padding: "40px", borderRadius: "20px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1), 0 0 10px rgba(0, 102, 204, 0.15)",
              border: "2px solid #e0e0e0",
              textAlign: "center"
            }}>
              <h2 style={{ 
                marginBottom: "20px", 
                fontSize: "1.5rem", 
                fontWeight: "bold",
                color: "#666"
              }}>
                No live submissions at this moment
              </h2>
            </div>
          )}

          {/* View All Tab */}
          {activeTab === "viewAll" && (
            <div style={{
              backgroundColor: "#ffffff", padding: "40px", borderRadius: "20px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1), 0 0 10px rgba(0, 102, 204, 0.15)",
              border: "2px solid #e0e0e0"
            }}>
              <h2 style={{ margin: "0 0 30px 0", fontSize: "2rem", color: "#0066cc" }}> Your Team Submissions</h2>
              {submissions ? (
                (() => {
                  // Filter submissions to only show current team's submissions
                  const currentTeamId = username; // username is like "075_2026"
                  const submissionGroups = submissions.submissions || { ontime: [], late: [] };
                  const teamOnTimeSubmissions = submissionGroups.ontime.filter(sub => sub.team === currentTeamId);
                  const teamLateSubmissions = submissionGroups.late.filter(sub => sub.team === currentTeamId);
                  
                  return (
                    <>
                      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                        <div style={{ padding: "15px", backgroundColor: "#e5ffe5", border: "2px solid #00cc00", borderRadius: "8px", flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "5px", color: "#00cc00" }}> {teamOnTimeSubmissions.length}</div>
                          <div style={{ color: "#1a1a1a", fontWeight: "500" }}>On-Time Submissions</div>
                        </div>
                        <div style={{ padding: "15px", backgroundColor: "#ffe5e5", border: "2px solid #ff6b6b", borderRadius: "8px", flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "5px", color: "#ff6b6b" }}> {teamLateSubmissions.length}</div>
                          <div style={{ color: "#1a1a1a", fontWeight: "500" }}>Late Submissions</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "20px" }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ color: "#00cc00", marginBottom: "15px", fontSize: "1.3rem", fontWeight: "bold" }}> On-Time Submissions</h3>
                          {teamOnTimeSubmissions.length > 0 ? (
                            teamOnTimeSubmissions.map((submission, index) => (
                              <div key={index} style={{
                                marginBottom: "10px", padding: "15px", backgroundColor: "#e5ffe5",
                                borderRadius: "8px", border: "1px solid #00cc00"
                              }}>
                                <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "5px" }}>
                                  {formatTimestamp(submission.submittedAt)}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "8px", textTransform: "lowercase" }}>
                                  {formatPhaseLabel(submission.phaseName || submission.phase)} &nbsp;•&nbsp; {formatReviewLabel(submission.reviewName || submission.review)}
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "#333" }}>
                                  Files ({submission.count}):
                                  <ul style={{ margin: "6px 0 0 18px", padding: 0, listStyle: "disc" }}>
                                    {(submission.filesWithTypes || []).filter(Boolean).map((file, idx) => (
                                      <li key={idx}>
                                        {file.typeLabel}: {file.filename}
                                        <div style={{ marginTop: "4px" }}>
                                          <button
                                            type="button"
                                            onClick={() => handlePreviewFile(file)}
                                            style={{ color: "#0066cc", textDecoration: "underline", marginRight: "10px", background: "transparent", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
                                          >
                                            View
                                          </button>
                                          <a
                                            href={`http://localhost:5000${file.url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: "#0066cc", textDecoration: "underline" }}
                                          >
                                            Download
                                          </a>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ color: "#666" }}>No on-time submissions yet</div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ color: "#ff6b6b", marginBottom: "15px", fontSize: "1.3rem", fontWeight: "bold" }}>Late Submissions</h3>
                          {teamLateSubmissions.length > 0 ? (
                            teamLateSubmissions.map((submission, index) => (
                              <div key={index} style={{
                                marginBottom: "10px", padding: "15px", backgroundColor: "#ffe5e5",
                                borderRadius: "8px", border: "1px solid #ff6b6b"
                              }}>
                                <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "5px" }}>
                                  {formatTimestamp(submission.submittedAt)}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "8px", textTransform: "lowercase" }}>
                                  {formatPhaseLabel(submission.phaseName || submission.phase)} &nbsp;•&nbsp; {formatReviewLabel(submission.reviewName || submission.review)}
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "#333" }}>
                                  Files ({submission.count}):
                                  <ul style={{ margin: "6px 0 0 18px", padding: 0, listStyle: "disc" }}>
                                    {(submission.filesWithTypes || []).filter(Boolean).map((file, idx) => (
                                      <li key={idx}>
                                        <a
                                          href={`http://localhost:5000${file.url}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ color: "#0066cc", textDecoration: "underline" }}
                                        >
                                          {file.typeLabel}: {file.filename}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ color: "#666" }}>No late submissions yet</div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                  <div style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Loading your submissions...</div>
                  <div style={{ fontSize: "0.9rem" }}>Please wait while we fetch your team's submissions.</div>
                </div>
              )}
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === "announcements" && (
            <div style={{
              backgroundColor: "#ffffff", padding: "40px", borderRadius: "20px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1), 0 0 10px rgba(0, 102, 204, 0.15)",
              border: "2px solid #e0e0e0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <h2 style={{ margin: 0, fontSize: "2rem", color: "#0066cc", textAlign: "center", flex: 1 }}>
                  Announcements
                </h2>
                {visibleAnnouncements.length > 0 && (
                  <button
                    onClick={() => {
                      setShowClearAnnouncementsConfirm(true);
                    }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#126171",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "0.9rem"
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>
              {visibleAnnouncements.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {visibleAnnouncements.map((announcement, index) => {
                    const announcementId = announcement.id || announcement._id || JSON.stringify(announcement);
                    return (
                    <div key={index} style={{
                      padding: "20px", borderRadius: "12px",
                      backgroundColor: announcement.priority === "urgent" ? "#ffe5e5" : 
                                      announcement.priority === "high" ? "#fff4e5" : 
                                      "#e3f2fd",
                      border: `2px solid ${announcement.priority === "urgent" ? "#ff4444" : 
                               announcement.priority === "high" ? "#ffc107" : "#0066cc"}`
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                        <h3 style={{ margin: 0, fontSize: "1.3rem", color: "#1a1a1a", flex: 1 }}>{announcement.title}</h3>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <div style={{
                            padding: "5px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold",
                            backgroundColor: announcement.priority === "urgent" ? "#ff4444" : 
                                            announcement.priority === "high" ? "#ffc107" : "#0066cc",
                            color: "white"
                          }}>
                            {(announcement.priority || "normal").toUpperCase()}
                          </div>
                          <button
                            onClick={() => handleClearAnnouncement(announcementId)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#126171",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              fontWeight: "bold"
                            }}
                            title="Clear this announcement from your view"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <p style={{ color: "#333", lineHeight: "1.6", marginBottom: "10px" }}>{announcement.content}</p>
                      {announcement.createdAt && (
                        <div style={{ fontSize: "0.85rem", color: "#666" }}>
                          Created: {formatTimestamp(announcement.createdAt)}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "#666", fontSize: "1.1rem" }}>
                  {announcements.length > 0 
                    ? "All announcements have been cleared from your view" 
                    : "No announcements at this time"}
                </div>
              )}
            </div>
          )}

        {/* Clear All Announcements Confirmation Modal */}
        {showClearAnnouncementsConfirm && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "#2d2d2d",
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90vw",
              color: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              border: "1px solid #444"
            }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "1.3rem", color: "white" }}>
                Clear All Announcements
              </h3>
              <p style={{ margin: "0 0 25px 0", fontSize: "1rem", color: "#ccc", lineHeight: "1.5" }}>
                Clear all announcements from your view? This will hide them from your dashboard.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => setShowClearAnnouncementsConfirm(false)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#555";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#444";
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClearAllAnnouncements}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#a855f7",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#9333ea";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#a855f7";
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

          {/* Past Submissions Modal */}
      {showPastSubmissions && pastSubmissions && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.85)", display: "flex", justifyContent: "center",
          alignItems: "center", zIndex: 1000, animation: "fadeIn 0.3s ease"
        }} onClick={() => setShowPastSubmissions(false)}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { 
                opacity: 0;
                transform: translateY(50px) scale(0.95);
              }
              to { 
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            .modal-content {
              animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
          `}</style>
          <div className="modal-content" style={{
            backgroundColor: "rgba(0, 0, 0, 0.95)", padding: "35px", borderRadius: "20px",
            maxWidth: "85vw", maxHeight: "85vh", overflow: "auto", color: "white", minWidth: "700px",
            border: "2px solid #0891b2", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(20px)"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h2 style={{ margin: 0, fontSize: "1.8rem", color: "#0891b2" }}>📋 My Past Submissions</h2>
              <button onClick={() => setShowPastSubmissions(false)} style={{
                background: "rgba(255, 107, 107, 0.2)", border: "2px solid #ff6b6b", color: "#ff6b6b",
                fontSize: "1.5rem", cursor: "pointer", fontWeight: "bold", width: "40px", height: "40px",
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "rgba(255, 107, 107, 0.4)";
                e.target.style.transform = "scale(1.1) rotate(90deg)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "rgba(255, 107, 107, 0.2)";
                e.target.style.transform = "scale(1) rotate(0deg)";
              }}>✕</button>
            </div>

            {pastSubmissions.totalSubmissions === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#ccc" }}>
                <div style={{ fontSize: "1.2rem", marginBottom: "10px" }}>No submissions found</div>
                <div style={{ fontSize: "0.9rem" }}>You haven't submitted any files yet.</div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: "8px" }}>
                  <strong>Total Submissions: {pastSubmissions.totalSubmissions}</strong>
                </div>

                {pastSubmissions.submissions.map((submission, index) => (
                  <div key={index} style={{
                    backgroundColor: submission.isLate ? "rgba(255, 107, 107, 0.2)" : "rgba(0, 255, 0, 0.2)",
                    border: `2px solid ${submission.isLate ? "#ff6b6b" : "#00ff00"}`,
                    borderRadius: "10px", padding: "20px", marginBottom: "20px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                      <div>
                        <div style={{ fontSize: "1.3rem", fontWeight: "bold", marginBottom: "5px" }}>
                          Submission #{index + 1} - {submission.submissionType}
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "#ccc" }}>
                          Submitted: {formatTimestamp(submission.submittedAt)}
                        </div>
                      </div>
                      <div style={{
                        padding: "8px 16px", backgroundColor: submission.isLate ? "#ff6b6b" : "#00ff00",
                        color: "white", borderRadius: "6px", fontWeight: "bold", fontSize: "0.9rem"
                      }}>
                        {submission.submissionType}
                      </div>
                    </div>

                    <div style={{ marginTop: "15px" }}>
                      <div style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "10px" }}>
                        Files ({submission.count}):
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "10px" }}>
                        {submission.files.map((file, fileIndex) => (
                          <div key={fileIndex} style={{
                            backgroundColor: "rgba(0, 0, 0, 0.3)", padding: "12px", borderRadius: "8px",
                            border: "1px solid rgba(255, 255, 255, 0.2)"
                          }}>
                            <div style={{ fontSize: "0.85rem", color: "#4ade80", fontWeight: "bold", marginBottom: "3px" }}>
                              {file.typeLabel || file.fieldName || file.filename}
                            </div>
                            <div style={{ fontSize: "0.9rem", fontWeight: "bold", marginBottom: "5px", wordBreak: "break-word" }}>
                              {file.filename}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#aaa", marginBottom: "3px" }}>
                              Size: {file.size ? (file.size / 1024).toFixed(2) : "0"} KB
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#aaa" }}>
                              {formatTimestamp(file.uploadedAt)}
                            </div>
                            <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                              <button
                                type="button"
                                onClick={() => handlePreviewFile(file)}
                                style={{
                                  padding: "6px 12px", backgroundColor: "#22c55e", color: "white",
                                  borderRadius: "6px", border: "none", fontSize: "0.85rem",
                                  cursor: "pointer"
                                }}
                              >
                                View
                              </button>
                              <a
                                href={`http://localhost:5000${file.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: "6px 12px", backgroundColor: "#3b82f6", color: "white",
                                  borderRadius: "6px", textDecoration: "none", fontSize: "0.85rem"
                                }}
                              >
                                Download
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{
              marginTop: "20px", padding: "15px", backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "8px", fontSize: "0.9rem", color: "#aaa", textAlign: "center"
            }}>
              <strong>Note:</strong> This is a read-only view. You cannot edit or delete your submissions.
            </div>
          </div>
        </div>
          )}
          </div>
        </div>
      </div>

      {/* Chatbot */}
      {(userType === "student" || userType === "mentor") && (
        <button
            onClick={() => {
              const chatWindow = window.open(
                "",
                "Chatbot",
                "width=500,height=700,resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no"
              );
              if (chatWindow) {
                chatWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>Chat Assistant</title>
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                          background: #ffffff;
                          height: 100vh;
                          display: flex;
                          flex-direction: column;
                          color: #1a1a1a;
                        }
                        .chat-header {
                          background: #f5f5f5;
                          padding: 20px;
                          border-bottom: 1px solid #e0e0e0;
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                        }
                        .chat-header h2 {
                          color: #0066cc;
                        }
                        .chat-header button {
                          color: #666 !important;
                        }
                        .chat-container {
                          flex: 1;
                          display: flex;
                          flex-direction: column;
                          position: relative;
                        }
                        .chat-messages {
                          flex: 1;
                          padding: 20px;
                          overflow-y: auto;
                          display: flex;
                          flex-direction: column;
                          gap: 15px;
                        }
                        .welcome-screen {
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          justify-content: center;
                          height: 100%;
                          padding: 40px 20px;
                        }
                        .welcome-title {
                          font-size: 2rem;
                          font-weight: 400;
                          margin-bottom: 30px;
                          color: #666;
                        }
                        .message {
                          max-width: 75%;
                          padding: 12px 16px;
                          border-radius: 18px;
                          word-wrap: break-word;
                          line-height: 1.5;
                        }
                        .user-message {
                          align-self: flex-end;
                          background: #e3f2fd;
                          color: #0066cc;
                          border: 1px solid #0066cc;
                        }
                        .bot-message {
                          align-self: flex-start;
                          background: #f5f5f5;
                          color: #1a1a1a;
                          border: 1px solid #e0e0e0;
                        }
                        .chat-input-wrapper {
                          padding: 20px;
                          display: flex;
                          justify-content: center;
                          transition: all 0.3s ease;
                        }
                        .chat-input-wrapper.centered {
                          position: absolute;
                          top: 55%;
                          left: 50%;
                          transform: translate(-50%, 0);
                          width: 100%;
                          padding: 0 20px;
                        }
                        .chat-input-container {
                          max-width: 700px;
                          width: 100%;
                          position: relative;
                          display: flex;
                          align-items: center;
                          background: #f5f5f5;
                          border-radius: 30px;
                          padding: 4px 4px 4px 20px;
                          border: 1px solid #e0e0e0;
                        }
                        .chat-input-container:focus-within {
                          border-color: #0066cc;
                        }
                        .chat-input {
                          flex: 1;
                          padding: 12px 8px;
                          border: none;
                          background: transparent;
                          color: #1a1a1a;
                          font-size: 1rem;
                          outline: none;
                        }
                        .chat-input::placeholder {
                          color: #888;
                        }
                        .send-button {
                          width: 40px;
                          height: 40px;
                          border-radius: 50%;
                          border: none;
                          background: #0066cc;
                          color: white;
                          cursor: pointer;
                          font-size: 1.2rem;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          transition: all 0.2s;
                          flex-shrink: 0;
                        }
                        .send-button:hover {
                          background: #0056b3;
                        }
                        .send-button:active {
                          transform: scale(0.95);
                        }
                      </style>
                    </head>
                    <body>
                      <div class="chat-header">
                        <h2>Chat Assistant</h2>
                        <button onclick="window.close()" style="background:none;border:none;color:#666;font-size:1.5rem;cursor:pointer;">✕</button>
                      </div>
                      <div style="display: flex; align-items: flex-start; margin-bottom: 30px; padding: 20px 20px 0 20px;">
                        <img src="/clgL.png" alt="College Logo" style="width: 160px; height: 80px; object-fit: contain;" />
                      </div>
                      <div class="chat-container">
                        <div class="chat-messages" id="messages">
                          <div class="welcome-screen">
                            <h1 class="welcome-title">What can I help with?</h1>
                          </div>
                        </div>
                        <div class="chat-input-wrapper centered" id="inputWrapper">
                          <div class="chat-input-container">
                            <input type="text" class="chat-input" id="chatInput" placeholder="Ask anything" />
                            <button class="send-button" onclick="sendMessage()">↑</button>
                          </div>
                        </div>
                      </div>
                      <script>
                        const messagesDiv = document.getElementById('messages');
                        const input = document.getElementById('chatInput');
                        const inputWrapper = document.getElementById('inputWrapper');
                        let messages = [];
                        let isFirstMessage = true;

                        input.addEventListener('keypress', (e) => {
                          if (e.key === 'Enter' && input.value.trim()) {
                            sendMessage();
                          }
                        });

                        function scrollToBottom() {
                          messagesDiv.scrollTop = messagesDiv.scrollHeight;
                        }

                        function moveInputToBottom() {
                          if (isFirstMessage) {
                            inputWrapper.classList.remove('centered');
                            isFirstMessage = false;
                          }
                        }

                        async function sendMessage() {
                          const text = input.value.trim();
                          if (!text) return;

                          moveInputToBottom();
                          addMessage('user', text);
                          input.value = '';
                          addMessage('bot', '...');

                          try {
                            const response = await fetch('http://localhost:8000/api/chat', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ message: text })
                            });

                            const data = await response.json();
                            messages = messages.slice(0, -1);

                            if (data.success) {
                              addMessage('bot', data.response);
                            } else {
                              addMessage('bot', 'Sorry, I encountered an error. Please try again.');
                            }
                          } catch (error) {
                            console.error('Chatbot error:', error);
                            messages = messages.slice(0, -1);
                            addMessage('bot', 'Sorry, I can\\'t connect to the RAG chatbot. Please make sure the backend is running.');
                          }
                        }

                        function addMessage(sender, text) {
                          messages.push({ sender, text });
                          renderMessages();
                          scrollToBottom();
                        }

                        function renderMessages() {
                          if (messages.length === 0) {
                            messagesDiv.innerHTML = '<div class="welcome-screen"><h1 class="welcome-title">What can I help with?</h1></div>';
                            return;
                          }
                          messagesDiv.innerHTML = messages.map(msg =>
                            '<div class="message ' + (msg.sender === 'user' ? 'user-message' : 'bot-message') + '">' + msg.text + '</div>'
                          ).join('');
                        }
                      </script>
                    </body>
                  </html>
                `);
                chatWindow.document.close();
              }
            }}
            style={{
              position: "fixed",
              bottom: "30px",
              right: "30px",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "#0066cc",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0, 102, 204, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              zIndex: 1000,
              transition: "transform 0.3s ease, box-shadow 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.1)";
              e.target.style.boxShadow = "0 6px 30px rgba(0, 102, 204, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "0 4px 20px rgba(0, 102, 204, 0.4)";
            }}
          >
            💬
          </button>
      )}
    </div>
    );
  }

export default App;
