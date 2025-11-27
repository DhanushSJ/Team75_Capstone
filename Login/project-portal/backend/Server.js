// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { Readable } = require("stream");
const { finished } = require("stream/promises");
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);
let gridfsBucket;
const connectDB = require("./db");
const Team = require("./models/Team");
const Mentor = require("./models/Mentor");
const Submission = require("./models/Submission");
const ReportLayout = require("./models/ReportLayout");
const Announcement = require("./models/Announcement");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
  if (req.path.includes('parse-pdf') || req.path.includes('mentor')) {
    console.log(`[${req.method}] ${req.path} - Body:`, req.body);
  }
  next();
});

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Serve static files from uploads directory
app.use("/uploads", express.static(uploadDir));

// Configuration file path
const configFile = path.join(__dirname, "config.json");

// Mentors database file path
const mentorsFile = path.join(__dirname, "mentors.json");

// Announcements database file path
const announcementsFile = path.join(__dirname, "announcements.json");

// Admin logs database file path
const logsFile = path.join(__dirname, "adminLogs.json");

// Default configuration
const defaultConfig = {
  deadline: new Date("2025-10-15T16:18:00").toISOString(),
  fileTypes: [
    { key: "deliverable1", label: "Deliverable 1", fileType: "pdf" },
    { key: "deliverable2", label: "Deliverable 2", fileType: "pdf" },
    { key: "deliverable3", label: "Deliverable 3", fileType: "pdf" }
  ]
};

// Load configuration from file or use default
let config = defaultConfig;
if (fs.existsSync(configFile)) {
  try {
    config = JSON.parse(fs.readFileSync(configFile, "utf8"));
  } catch (e) {
    console.error("Error loading config, using default:", e);
  }
} else {
  // Save default config
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

// Helper functions to get config
const getDeadline = () => new Date(config.deadline);

// Reload config from file to ensure we have the latest data
const reloadConfig = () => {
  if (fs.existsSync(configFile)) {
    try {
      const loadedConfig = JSON.parse(fs.readFileSync(configFile, "utf8"));
      // Replace config with loaded config to ensure we have the latest data
      config = loadedConfig;
    } catch (e) {
      console.error("Error reloading config:", e);
    }
  }
};

// Get file types (either from flat fileTypes or from config fileTypes)
const getFileTypes = () => {
  reloadConfig(); // Reload to get latest file types from config file
  if (config.fileTypes && Array.isArray(config.fileTypes)) {
    return config.fileTypes;
  }
  return [];
};

// Get active phase/review for submissions
const getActivePhaseReview = () => {
  reloadConfig();
  if (config.activePhaseReview) {
    return config.activePhaseReview;
  }
  return null; // No active phase/review set
};

// Set active phase/review for submissions
const setActivePhaseReview = (phaseIndex, reviewIndex) => {
  reloadConfig();
  if (config.phases && config.phases[phaseIndex]) {
    const phase = config.phases[phaseIndex];
    const review = phase.reviews && phase.reviews[reviewIndex] ? phase.reviews[reviewIndex] : null;
    if (review) {
      config.activePhaseReview = {
        phaseIndex: phaseIndex,
        phaseName: phase.phaseName,
        reviewIndex: reviewIndex,
        reviewName: review.reviewName
      };
      saveConfig();
      return true;
    }
  }
  return false;
};

// Save configuration
const saveConfig = () => {
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
};

// Helper to convert array of team documents to map keyed by teamId
const normalizeMembers = (members = []) => {
  if (!Array.isArray(members)) return [];

  return members
    .map((member) => {
      if (typeof member === "string") {
        const trimmed = member.trim();
        if (!trimmed) return null;
        return { name: trimmed, srn: "" };
      }
      if (member && typeof member === "object") {
        const name = (member.name || member.srn || "").toString().trim();
        const srn = (member.srn || "").toString().trim();
        if (!name) return null;
        return { name, srn };
      }
      return null;
    })
    .filter(Boolean);
};

const mapTeamsById = (docs = []) =>
  docs.reduce((acc, doc) => {
    acc[doc.teamId] = {
      teamId: doc.teamId,
      teamName: doc.teamName || "",
      members: normalizeMembers(doc.members),
      mentorName: doc.mentorName || "",
      projectTitle: doc.projectTitle || "",
      contactEmail: doc.contactEmail || "",
      status: doc.status || "active",
      notes: doc.notes || "",
      progress: doc.progress || {},
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    return acc;
  }, {});

const loadTeams = async () => {
  const teamDocs = await Team.find().lean();
  return mapTeamsById(teamDocs);
};

const loadTeamById = async (teamId) => {
  const teamDoc = await Team.findOne({ teamId }).lean();
  return teamDoc ? mapTeamsById([teamDoc])[teamId] : null;
};

const seedMentorsFromFile = async () => {
  try {
    const existingCount = await Mentor.countDocuments();
    if (existingCount > 0) {
      return;
    }

    if (!fs.existsSync(mentorsFile)) {
      return;
    }

    const rawMentors = JSON.parse(fs.readFileSync(mentorsFile, "utf8"));
    if (!rawMentors || typeof rawMentors !== "object") {
      return;
    }

    const docs = Object.entries(rawMentors).map(([mentorName, password]) => ({
      mentorName,
      password: password || `${mentorName}123`,
    }));

    if (docs.length > 0) {
      await Mentor.insertMany(docs);
      console.log(`📥 Seeded ${docs.length} mentors from mentors.json`);
    }
  } catch (error) {
    console.error("Failed to seed mentors from file:", error);
  }
};

const seedTeamsFromFile = async () => {
  try {
    const teamsFilePath = path.join(__dirname, "teams.json");
    const existingCount = await Team.countDocuments();
    if (existingCount > 0) {
      return;
    }
    if (!fs.existsSync(teamsFilePath)) {
      return;
    }

    const fileData = JSON.parse(fs.readFileSync(teamsFilePath, "utf8"));
    if (!fileData || typeof fileData !== "object") {
      return;
    }

    const docs = Object.entries(fileData).map(([teamId, team]) => ({
      teamId,
      teamName: team.teamName || "",
      members: normalizeMembers(team.members || []),
      mentorName: team.mentorName || "",
      projectTitle: team.projectTitle || "",
      contactEmail: team.contactEmail || "",
      status: team.status || "active",
      notes: team.notes || "",
      progress: team.progress || {},
      createdAt: team.createdAt ? new Date(team.createdAt) : undefined,
      updatedAt: team.updatedAt ? new Date(team.updatedAt) : undefined,
    }));

    if (docs.length > 0) {
      await Team.insertMany(docs);
      console.log(`📥 Seeded ${docs.length} teams from teams.json`);
    }
  } catch (error) {
    console.error("Failed to seed teams from file:", error);
  }
};

// Announcements database management
const loadAnnouncements = () => {
  if (fs.existsSync(announcementsFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(announcementsFile, "utf8"));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Error loading announcements, using empty:", e);
      return [];
    }
  }
  return [];
};

const saveAnnouncements = (announcements) => {
  fs.writeFileSync(announcementsFile, JSON.stringify(announcements, null, 2));
};

// Initialize announcements database
let announcements = loadAnnouncements();

// Admin logs database management
const loadLogs = () => {
  if (fs.existsSync(logsFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(logsFile, "utf8"));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Error loading admin logs, using empty:", e);
      return [];
    }
  }
  return [];
};

const saveLogs = (logs) => {
  fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));
};

// Initialize admin logs database
let adminLogs = loadLogs();

const memoryStorage = multer.memoryStorage();
const createUploadMiddleware = () => {
  const fileTypes = getFileTypes();
  const fields = fileTypes.map(ft => ({ name: ft.key, maxCount: 1 }));
  return multer({ storage: memoryStorage }).fields(fields);
};

// Upload route - dynamically configured
app.post("/upload", (req, res) => {
  const upload = createUploadMiddleware();
  upload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!gridfsBucket) {
        return res.status(500).json({ error: "File storage is not initialized." });
      }

      const fileTypes = getFileTypes();
      if (!fileTypes.length) {
        return res.status(400).json({ error: "File types are not configured by admin." });
      }

      const username = req.body.username;
      if (!username) {
        return res.status(400).json({ error: "Username is required for submission." });
      }

      const now = new Date();
      const deadline = getDeadline();
      const isLate = now > deadline;
      const activePhaseReview = getActivePhaseReview();
      const labelMap = new Map(fileTypes.map(ft => [ft.key, ft.label || ft.key]));

      if (!activePhaseReview) {
        return res.status(400).json({
          error: "No active phase/review set. Please contact admin to set active phase/review before submitting.",
        });
      }

      const uploadedFiles = req.files || {};
      const missingFiles = fileTypes
        .filter((ft) => !uploadedFiles[ft.key] || uploadedFiles[ft.key].length === 0)
        .map((ft) => ft.label || ft.key);

      if (missingFiles.length > 0) {
        return res.status(400).json({
          error: `Missing required files: ${missingFiles.join(", ")}`,
        });
      }

      const storedFiles = [];
      for (const [fieldName, files] of Object.entries(uploadedFiles)) {
        const file = files[0];
        const uploadStream = gridfsBucket.openUploadStream(file.originalname, {
          metadata: {
            fieldName,
            teamId: username,
            phase: activePhaseReview.phaseName,
            review: activePhaseReview.reviewName,
            submissionType: isLate ? "late" : "ontime",
          },
          contentType: file.mimetype,
        });

        await finished(Readable.from(file.buffer).pipe(uploadStream));

        storedFiles.push({
          fileId: uploadStream.id,
          fieldName,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        });

      }

      const submissionDoc = await Submission.create({
        teamId: username,
        phase: activePhaseReview.phaseName,
        review: activePhaseReview.reviewName,
        submissionType: isLate ? "late" : "ontime",
        files: storedFiles.map((file) => ({
          ...file,
        })),
        submittedAt: now,
      });

      res.json({
        message: isLate
          ? "⚠️ You have submitted after the deadline!"
          : "✅ Submission successful and on time!",
        late: isLate,
        timestamp: now.toISOString(),
        submissionType: isLate ? "LATE" : "ONTIME",
        phase: activePhaseReview.phaseName,
        review: activePhaseReview.reviewName,
        uploaded: storedFiles.map((file) => file.fieldName),
        submissionId: submissionDoc._id,
        files: storedFiles.map((file) => ({
          fieldName: file.fieldName,
          filename: file.filename,
          typeLabel: labelMap.get(file.fieldName) || file.fieldName,
          url: `/files/${file.fileId}`,
          viewUrl: `/files/${file.fileId}/view`,
          mimetype: file.mimetype,
          size: file.size,
        })),
      });
    } catch (error) {
      console.error("Error handling submission:", error);
      res.status(500).json({ error: "Failed to process submission" });
    }
  });
});

// Route to get all submissions organized by type
app.get("/submissions", async (req, res) => {
  try {
    const [submissionDocs, teamsMap] = await Promise.all([
      Submission.find().sort({ submittedAt: -1 }).lean(),
      loadTeams(),
    ]);

    const fileTypes = getFileTypes();
    const labelByKey = new Map(
      fileTypes.map((ft) => [ft.key, ft.label || ft.key])
    );

    const response = {
      ontime: [],
      late: [],
    };

    submissionDocs.forEach((submission) => {
      const teamInfo = teamsMap[submission.teamId] || {};
      const filesWithTypes = submission.files.map((file) => ({
        filename: file.filename,
        typeLabel: labelByKey.get(file.fieldName) || file.fieldName,
        typeKey: file.fieldName,
        url: `/files/${file.fileId}`,
        viewUrl: `/files/${file.fileId}/view`,
        uploadedAt: file.uploadedAt,
        mimetype: file.mimetype,
        size: file.size,
      }));

      const entry = {
        submissionId: submission._id,
        team: submission.teamId,
        teamName: teamInfo.teamName,
        count: submission.files.length,
        files: filesWithTypes.map((file) => file.filename),
        filesWithTypes,
        submittedAt: submission.submittedAt,
        phase: submission.phase,
        review: submission.review,
        submissionType: submission.submissionType,
      };

      if (submission.submissionType === "late") {
        response.late.push(entry);
      } else {
        response.ontime.push(entry);
      }
    });

    res.json({
      success: true,
      totalOnTime: response.ontime.length,
      totalLate: response.late.length,
      submissions: response,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Failed to read submissions" });
  }
});

// Route to get a specific team's submission details
app.get("/submissions/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const [submissionDocs, team] = await Promise.all([
      Submission.find({ teamId: username }).sort({ submittedAt: -1 }).lean(),
      loadTeamById(username),
    ]);

    const fileTypes = getFileTypes();
    const labelByKey = new Map(
      fileTypes.map((ft) => [ft.key, ft.label || ft.key])
    );

    const submissions = submissionDocs.map((submission) => ({
      submissionId: submission._id,
      team: submission.teamId,
      phase: submission.phase,
      review: submission.review,
      submissionType: submission.submissionType,
      isLate: submission.submissionType === "late",
      submittedAt: submission.submittedAt,
      count: submission.files.length,
      files: submission.files.map((file) => ({
        fileId: file.fileId,
        fieldName: file.fieldName,
        filename: file.filename,
        typeLabel: labelByKey.get(file.fieldName) || file.fieldName,
        url: `/files/${file.fileId}`,
        viewUrl: `/files/${file.fileId}/view`,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: file.uploadedAt,
        evaluation: file.evaluation || null, // Include evaluation data
      })),
    }));

    res.json({
      success: true,
      team: username,
      teamName: team?.teamName,
      submissions,
      totalSubmissions: submissions.length,
    });
  } catch (error) {
    console.error("Error fetching team submissions:", error);
    res.status(500).json({ success: false, error: "Failed to read submissions" });
  }
});

// Route to delete all files for a specific username
app.delete("/submissions/:username", async (req, res) => {
  try {
    if (!gridfsBucket) {
      return res.status(500).json({ success: false, error: "File storage is not initialized" });
    }

    const username = req.params.username;
    const submissions = await Submission.find({ teamId: username }).lean();

    if (!submissions.length) {
      return res.json({
        success: true,
        message: `No submissions found for ${username}`,
        filesDeleted: 0,
      });
    }

    let filesDeleted = 0;
    for (const submission of submissions) {
      for (const file of submission.files) {
        try {
          await gridfsBucket.delete(new mongoose.Types.ObjectId(file.fileId));
          filesDeleted += 1;
        } catch (error) {
          console.error(`Failed to delete file ${file.fileId}:`, error);
        }
      }
    }

    await Submission.deleteMany({ teamId: username });

    res.json({
      success: true,
      message: `All submissions deleted for ${username}`,
      filesDeleted,
    });
  } catch (error) {
    console.error("Error deleting submissions:", error);
    res.status(500).json({ success: false, error: "Failed to delete submissions" });
  }
});

// Admin route to delete a specific submission type (ontime or late) for a team
app.delete("/admin/submissions/:team/:submissionType", async (req, res) => {
  try {
    if (!gridfsBucket) {
      return res.status(500).json({ success: false, error: "File storage is not initialized" });
    }

    const team = req.params.team;
    const submissionType = req.params.submissionType.toLowerCase();

    if (submissionType !== "ontime" && submissionType !== "late") {
      return res.status(400).json({
        success: false,
        error: "Invalid submission type. Must be 'ontime' or 'late'",
      });
    }

    const submissions = await Submission.find({ teamId: team, submissionType }).lean();

    if (!submissions.length) {
      return res.json({
        success: true,
        message: `No ${submissionType === "ontime" ? "on-time" : "late"} submissions found for team ${team}`,
        filesDeleted: 0,
      });
    }

    let filesDeleted = 0;
    for (const submission of submissions) {
      for (const file of submission.files) {
        try {
          await gridfsBucket.delete(new mongoose.Types.ObjectId(file.fileId));
          filesDeleted += 1;
        } catch (error) {
          console.error(`Failed to delete file ${file.fileId}:`, error);
        }
      }
    }

    await Submission.deleteMany({ teamId: team, submissionType });

    res.json({
      success: true,
      message: `${submissionType === "ontime" ? "On-time" : "Late"} submission deleted successfully for team ${team}`,
      filesDeleted,
    });
  } catch (error) {
    console.error("Error deleting admin submission:", error);
    res.status(500).json({ success: false, error: "Failed to delete submission" });
  }
});

// Admin authentication - simple check
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123"; // Change this to a secure password

// Admin login endpoint
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true, message: "Admin login successful" });
  } else {
    res.status(401).json({ success: false, message: "Invalid admin credentials" });
  }
});

// Mentor login endpoint
app.post("/mentor/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  try {
    const mentor = await Mentor.findOne({ mentorName: username }).lean();
    if (mentor && mentor.password === password) {
      res.json({ success: true, message: "Mentor login successful" });
    } else {
      res.status(401).json({ success: false, message: "Invalid mentor credentials" });
    }
  } catch (error) {
    console.error("Mentor login error:", error);
    res.status(500).json({ success: false, message: "Login error" });
  }
});

// Auto-create or check mentor credentials
app.post("/admin/ensure-mentor", async (req, res) => {
  const { mentorName } = req.body;
  
  if (!mentorName || mentorName.trim() === "") {
    return res.json({ 
      success: true, 
      created: false, 
      message: "No mentor name provided" 
    });
  }
  try {
    const normalizedMentorName = mentorName.trim();

    const existingMentor = await Mentor.findOne({ mentorName: normalizedMentorName }).lean();
    if (existingMentor) {
      return res.json({ 
        success: true, 
        created: false, 
        exists: true,
        message: `Mentor ${normalizedMentorName} already exists`,
        username: normalizedMentorName
      });
    }
    
    // Create new mentor with default password
    const defaultPassword = `${normalizedMentorName}123`; // Password is mentorName + "123"
    const mentor = await Mentor.create({
      mentorName: normalizedMentorName,
      password: defaultPassword,
    });
    
    return res.json({ 
      success: true, 
      created: true,
      exists: false,
      message: `Mentor ${normalizedMentorName} created successfully`,
      username: mentor.mentorName,
      password: defaultPassword
    });
  } catch (error) {
    console.error("Error ensuring mentor:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to create mentor" 
    });
  }
});

// Student login endpoint
app.post("/student/login", async (req, res) => {
  const { username, password } = req.body;

  if (password !== "1234") {
    return res.status(401).json({ success: false, message: "Invalid student credentials" });
  }

  const teamExists = await Team.exists({ teamId: username });

  if (teamExists) {
    res.json({ success: true, message: "Student login successful" });
  } else {
    res.status(401).json({ success: false, message: "Invalid student credentials" });
  }
});

// Get teams for mentor
app.get("/mentor/teams", async (req, res) => {
  const { mentorName } = req.query;

  if (!mentorName) {
    return res.status(400).json({
      success: false,
      error: "Mentor name required",
    });
  }

  try {
    const mentorTeamsDocs = await Team.find({ mentorName }).lean();
    const mentorTeams = mapTeamsById(mentorTeamsDocs);
    res.json({ success: true, teams: mentorTeams });
  } catch (error) {
    console.error("Error fetching mentor teams:", error);
    res.status(500).json({ success: false, error: "Failed to fetch teams" });
  }
});

// Get configuration (admin only - but we'll allow students to read deadline/fileTypes)
app.get("/admin/config", (req, res) => {
  res.json({
    deadline: config.deadline,
    fileTypes: getFileTypes(),
    phases: config.phases || [],
    activePhaseReview: getActivePhaseReview()
  });
});

// Get team progress (calculates progress based on submissions and active phase/review)
app.get("/team/progress/:teamId", async (req, res) => {
  try {
    const teamId = req.params.teamId;
    reloadConfig();
    const activePhaseReview = getActivePhaseReview();
    const phases = config.phases || [];

    const teamSubmissions = await Submission.find({ teamId }).lean();

    // Calculate total reviews across all phases
    let totalReviews = 0;
    phases.forEach(phase => {
      if (phase.reviews && Array.isArray(phase.reviews)) {
        totalReviews += phase.reviews.length;
      }
    });

    // Calculate completed reviews
    let completedReviews = 0;
    if (activePhaseReview) {
      const activePhaseIndex = activePhaseReview.phaseIndex;
      const activeReviewIndex = activePhaseReview.reviewIndex;

      // Count all reviews in phases before the active phase
      for (let i = 0; i < activePhaseIndex; i++) {
        if (phases[i] && phases[i].reviews && Array.isArray(phases[i].reviews)) {
          completedReviews += phases[i].reviews.length;
        }
      }

      // Count reviews in the active phase before the active review
      if (phases[activePhaseIndex] && phases[activePhaseIndex].reviews) {
        completedReviews += activeReviewIndex; // Reviews before the active one
      }

      // Check if the active review has been submitted
      const matchingSubmission = teamSubmissions.find(
        (submission) =>
          submission.phase === activePhaseReview.phaseName &&
          submission.review === activePhaseReview.reviewName
      );

      if (matchingSubmission) {
        // Active review is submitted, so it counts as completed
        completedReviews += 1;
      }
    }

    // Calculate overall progress based on completed reviews
    const overallProgress = totalReviews > 0
      ? (completedReviews / totalReviews) * 100
      : 0;

    let currentPhaseProgress = 0;
    let currentPhaseName = activePhaseReview?.phaseName || null;
    let currentReviewName = activePhaseReview?.reviewName || null;
    let completedReviewsInPhase = 0;
    let totalReviewsInPhase = 0;

    if (activePhaseReview) {
      const activePhaseIndex = activePhaseReview.phaseIndex;
      const activeReviewIndex = activePhaseReview.reviewIndex;
      
      // Find the active phase
      const activePhase = phases[activePhaseIndex];
      
      if (activePhase && activePhase.reviews && Array.isArray(activePhase.reviews)) {
        totalReviewsInPhase = activePhase.reviews.length;
        
        // Count reviews completed in this phase (reviews before the active one)
        completedReviewsInPhase = activeReviewIndex;
        
        // Check if the active review has been submitted
        const matchingSubmission = teamSubmissions.find(
          (submission) =>
            submission.phase === activePhaseReview.phaseName &&
            submission.review === activePhaseReview.reviewName
        );

        if (matchingSubmission) {
          // Active review is submitted, so it counts as completed
          completedReviewsInPhase += 1;
        }
        
        // Calculate progress as completed reviews / total reviews in phase
        currentPhaseProgress = totalReviewsInPhase > 0 
          ? (completedReviewsInPhase / totalReviewsInPhase) * 100 
          : 0;
      }
    }

    await Team.findOneAndUpdate(
      { teamId },
      {
        progress: {
          overallProgress,
          currentPhaseProgress,
          currentPhaseName,
          currentReviewName,
          completedReviews,
          totalReviews,
          completedReviewsInPhase,
          totalReviewsInPhase,
          lastUpdated: new Date().toISOString(),
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      teamId,
      overallProgress,
      currentPhaseProgress,
      currentPhaseName,
      currentReviewName,
      completedReviews,
      totalReviews,
      completedReviewsInPhase,
      totalReviewsInPhase,
      activePhaseReview,
    });
  } catch (error) {
    console.error("Error calculating team progress:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate progress",
    });
  }
});

// Update configuration (admin only)
app.post("/admin/config", (req, res) => {
  const { deadline, fileTypes, phases } = req.body;
  
  if (!deadline) {
    return res.status(400).json({ 
      success: false, 
      error: "Invalid configuration. Need deadline (ISO string)" 
    });
  }
  
  // Validate deadline
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return res.status(400).json({ 
      success: false, 
      error: "Invalid deadline format. Use ISO date string." 
    });
  }
  
  // Update config
  config.deadline = deadline;
  if (fileTypes && Array.isArray(fileTypes)) {
    // Validate file types
    if (!fileTypes.every(ft => ft.key && ft.label)) {
      return res.status(400).json({ 
        success: false, 
        error: "Each file type must have 'key' and 'label' properties" 
      });
    }
    config.fileTypes = fileTypes;
  }
  if (phases && Array.isArray(phases)) {
    config.phases = phases;
  }
  
  saveConfig();
  
  res.json({ 
    success: true, 
    message: "Configuration updated successfully",
    config: {
      deadline: config.deadline,
      fileTypes: getFileTypes(),
      phases: config.phases || []
    }
  });
});

// Set active phase/review for submissions (admin only)
app.post("/admin/set-active-phase-review", (req, res) => {
  const { phaseIndex, reviewIndex } = req.body;
  
  if (phaseIndex === null || phaseIndex === undefined || reviewIndex === null || reviewIndex === undefined) {
    // Clear active phase/review
    reloadConfig();
    delete config.activePhaseReview;
    saveConfig();
    return res.json({
      success: true,
      message: "Active phase/review cleared",
      activePhaseReview: null
    });
  }
  
  if (setActivePhaseReview(parseInt(phaseIndex), parseInt(reviewIndex))) {
    res.json({
      success: true,
      message: "Active phase/review set successfully",
      activePhaseReview: config.activePhaseReview
    });
  } else {
    res.status(400).json({
      success: false,
      error: "Invalid phase or review index"
    });
  }
});

// Teams database endpoints

// Get all teams (admin only for full details, students can get their own)
app.get("/admin/teams", async (req, res) => {
  try {
    const teams = await loadTeams();
    res.json({ success: true, teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ success: false, error: "Failed to fetch teams" });
  }
});

// Get single team by ID
app.get("/teams/:teamId", async (req, res) => {
  const teamId = req.params.teamId;
  try {
    const team = await loadTeamById(teamId);
    if (team) {
      res.json({ success: true, team });
    } else {
      res.status(404).json({ success: false, error: "Team not found" });
    }
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ success: false, error: "Failed to fetch team" });
  }
});

// Create or update team (admin only)
app.post("/admin/teams", async (req, res) => {
  const { teamId, teamData } = req.body;

  if (!teamId) {
    return res.status(400).json({
      success: false,
      error: "Team ID is required",
    });
  }

  if (!teamData || typeof teamData !== "object") {
    return res.status(400).json({
      success: false,
      error: "Invalid team data",
    });
  }

  try {
    const existingTeam = await Team.findOne({ teamId }).lean();
    const requestedMembers = normalizeMembers(teamData.members);
    const fallbackMembers = normalizeMembers(existingTeam?.members || []);
    const membersToUse =
      requestedMembers.length > 0 ? requestedMembers : fallbackMembers;

    const payload = {
      teamId,
      teamName: teamData.teamName ?? existingTeam?.teamName ?? "",
      members: membersToUse,
      projectTitle: teamData.projectTitle ?? existingTeam?.projectTitle ?? "",
      contactEmail: teamData.contactEmail ?? existingTeam?.contactEmail ?? "",
      status: teamData.status ?? existingTeam?.status ?? "active",
      notes: teamData.notes ?? existingTeam?.notes ?? "",
      mentorName: teamData.mentorName ?? existingTeam?.mentorName ?? "",
    };

    const team = await Team.findOneAndUpdate(
      { teamId },
      { $set: payload },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({
      success: true,
      message: existingTeam ? "Team updated successfully" : "Team created successfully",
      team: mapTeamsById([team])[teamId],
    });
  } catch (error) {
    console.error("Error saving team:", error);
    res.status(500).json({ success: false, error: "Failed to save team" });
  }
});

// Update team (admin only)
app.put("/admin/teams/:teamId", async (req, res) => {
  const teamId = req.params.teamId;
  const teamData = req.body || {};

  try {
    // Normalize members if provided
    const requestedMembers = teamData.members ? normalizeMembers(teamData.members) : undefined;
    
    // Exclude members from teamData spread, we'll add normalized version separately
    const { members, ...restTeamData } = teamData;
    
    const updatedTeam = await Team.findOneAndUpdate(
      { teamId },
      {
        $set: {
          ...restTeamData,
          teamId,
          updatedAt: new Date(),
          ...(requestedMembers !== undefined ? { members: requestedMembers } : {}),
        },
      },
      { new: true }
    ).lean();

    if (!updatedTeam) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    res.json({
      success: true,
      message: "Team updated successfully",
      team: mapTeamsById([updatedTeam])[teamId],
    });
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ success: false, error: "Failed to update team" });
  }
});

// Delete team (admin only)
app.delete("/admin/teams/:teamId", async (req, res) => {
  const teamId = req.params.teamId;

  try {
    const deletion = await Team.deleteOne({ teamId });
    if (deletion.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    res.json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ success: false, error: "Failed to delete team" });
  }
});

// Announcements endpoints

// Get all announcements (for students)
app.get("/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find({}).sort({ createdAt: -1 }).lean();
    res.json({ 
      announcements: announcements.map(ann => ({
        id: ann._id.toString(),
        title: ann.title,
        content: ann.content,
        priority: ann.priority,
        createdAt: ann.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ announcements: [] });
  }
});

// Get all announcements (admin)
app.get("/admin/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find({}).sort({ createdAt: -1 }).lean();
    res.json({ 
      success: true, 
      announcements: announcements.map(ann => ({
        id: ann._id.toString(),
        title: ann.title,
        content: ann.content,
        priority: ann.priority,
        createdAt: ann.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ success: false, error: "Failed to fetch announcements" });
  }
});

// Create announcement (admin only)
app.post("/admin/announcements", async (req, res) => {
  const { title, content, priority } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ 
      success: false, 
      error: "Title and content are required" 
    });
  }
  
  try {
    const newAnnouncement = await Announcement.create({
      title: title,
      content: content,
      priority: priority || "normal"
    });
    
    res.json({ 
      success: true, 
      message: "Announcement created successfully",
      announcement: {
        id: newAnnouncement._id.toString(),
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        priority: newAnnouncement.priority,
        createdAt: newAnnouncement.createdAt
      }
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create announcement" 
    });
  }
});

// Delete announcement (admin only)
app.delete("/admin/announcements/:id", async (req, res) => {
  const id = req.params.id;
  
  try {
    const deletedAnnouncement = await Announcement.findByIdAndDelete(id);
    
    if (!deletedAnnouncement) {
      return res.status(404).json({ 
        success: false, 
        error: "Announcement not found" 
      });
    }
    
    res.json({ 
      success: true, 
      message: "Announcement deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete announcement" 
    });
  }
});

// Admin logs endpoints

// Get all admin logs
app.get("/admin/logs", (req, res) => {
  adminLogs = loadLogs(); // Reload to get latest data
  res.json({ 
    success: true, 
    logs: adminLogs 
  });
});

// Create admin log entry
app.post("/admin/logs", (req, res) => {
  const { action, details, timestamp } = req.body;
  
  if (!action) {
    return res.status(400).json({ 
      success: false, 
      error: "Action is required" 
    });
  }
  
  adminLogs = loadLogs();
  
  const newLog = {
    id: Date.now().toString(), // Simple ID generation
    action: action,
    details: details || {},
    timestamp: timestamp || new Date().toISOString()
  };
  
  adminLogs.unshift(newLog); // Add to beginning
  
  // Keep only last 1000 logs
  if (adminLogs.length > 1000) {
    adminLogs = adminLogs.slice(0, 1000);
  }
  
  saveLogs(adminLogs);
  
  res.json({ 
    success: true, 
    message: "Log created successfully",
    log: newLog
  });
});

// Clear all admin logs
app.delete("/admin/logs", (req, res) => {
  adminLogs = [];
  saveLogs(adminLogs);
  
  res.json({ 
    success: true, 
    message: "All admin logs cleared successfully"
  });
});

app.get("/files/:id", async (req, res) => {
  try {
    if (!gridfsBucket) {
      return res.status(500).json({ error: "File storage is not initialized." });
    }

    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const downloadStream = gridfsBucket.openDownloadStream(fileId);

    downloadStream.on("file", (file) => {
      res.setHeader("Content-Type", file.contentType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    });

    downloadStream.on("error", (error) => {
      console.error("Error streaming file:", error);
      res.status(404).json({ error: "File not found" });
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(400).json({ error: "Invalid file identifier" });
  }
});

app.get("/files/:id/view", async (req, res) => {
  try {
    if (!gridfsBucket) {
      return res.status(500).json({ error: "File storage is not initialized." });
    }

    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const viewStream = gridfsBucket.openDownloadStream(fileId);

    viewStream.on("file", (file) => {
      res.setHeader("Content-Type", file.contentType || "application/octet-stream");
      res.setHeader("Content-Disposition", "inline");
    });

    viewStream.on("error", (error) => {
      console.error("Error streaming file inline:", error);
      res.status(404).json({ error: "File not found" });
    });

    viewStream.pipe(res);
  } catch (error) {
    console.error("Error streaming file inline:", error);
    res.status(400).json({ error: "Invalid file identifier" });
  }
});

// Get all report layouts (admin only)
app.get("/admin/report-layouts", async (req, res) => {
  try {
    const layouts = await ReportLayout.find({}).sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      layouts: layouts.map(layout => ({
        id: layout._id.toString(),
        title: layout.title,
        phase: layout.phase,
        headings: layout.headings || [],
        fontSize: layout.fontSize || "12",
        createdAt: layout.createdAt,
        updatedAt: layout.updatedAt
      }))
    });
  } catch (error) {
    console.error("Error fetching report layouts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch report layouts" });
  }
});

// Create or update report layout (admin only)
app.post("/admin/report-layouts", async (req, res) => {
  try {
    console.log("Received report layout save request:", JSON.stringify(req.body, null, 2));
    const { id, title, phase, headings, fontSize } = req.body;

    if (!title || !phase) {
      return res.status(400).json({
        success: false,
        error: "Title and phase are required"
      });
    }

    if (!["phase1", "phase2", "phase3", "phase4"].includes(phase)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phase. Must be phase1, phase2, phase3, or phase4"
      });
    }

    let layout;
    if (id) {
      // Update existing layout
      layout = await ReportLayout.findByIdAndUpdate(
        id,
        {
          title,
          phase,
          headings: headings || [],
          fontSize: fontSize || "12"
        },
        { new: true }
      ).lean();

      if (!layout) {
        return res.status(404).json({
          success: false,
          error: "Report layout not found"
        });
      }
    } else {
      // Create new layout
      // Filter out headings with empty text
      const validHeadings = (headings || []).filter(h => h && (h.text || h.text === ""));
      console.log("Creating report layout with:", { title, phase, headingsCount: validHeadings.length, fontSize });
      console.log("Headings data:", JSON.stringify(validHeadings, null, 2));
      
      layout = await ReportLayout.create({
        title,
        phase,
        headings: validHeadings,
        fontSize: fontSize || "12"
      });
      layout = layout.toObject();
      console.log("✅ Report layout created successfully with ID:", layout._id.toString());
      console.log("✅ Saved to collection: reportlayouts");
    }

    const responseData = {
      success: true,
      message: id ? "Report layout updated successfully" : "Report layout created successfully",
      layout: {
        id: layout._id.toString(),
        title: layout.title,
        phase: layout.phase,
        headings: layout.headings || [],
        fontSize: layout.fontSize || "12",
        createdAt: layout.createdAt,
        updatedAt: layout.updatedAt
      }
    };
    console.log("✅ Sending success response");
    res.json(responseData);
  } catch (error) {
    console.error("Error saving report layout:", error);
    const errorMessage = error.message || "Failed to save report layout";
    console.error("Error details:", error);
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Delete report layout (admin only)
app.delete("/admin/report-layouts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const layout = await ReportLayout.findByIdAndDelete(id);

    if (!layout) {
      return res.status(404).json({
        success: false,
        error: "Report layout not found"
      });
    }

    res.json({
      success: true,
      message: "Report layout deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting report layout:", error);
    res.status(500).json({ success: false, error: "Failed to delete report layout" });
  }
});

// Get report layouts for mentors (filtered by phase if provided)
app.get("/mentor/report-layouts", async (req, res) => {
  try {
    console.log("=== MENTOR REPORT LAYOUTS ENDPOINT HIT ===");
    console.log("Request query:", req.query);
    
    const { phase } = req.query;
    let query = {};
    
    if (phase) {
      query.phase = phase;
    }
    
    console.log("Fetching report layouts for mentor with query:", JSON.stringify(query));
    
    // Verify database connection
    if (mongoose.connection.readyState !== 1) {
      console.error("Database not connected! Ready state:", mongoose.connection.readyState);
      return res.status(500).json({ 
        success: false, 
        error: "Database not connected" 
      });
    }
    
    const layouts = await ReportLayout.find(query).sort({ createdAt: -1 }).lean();
    console.log(`Found ${layouts.length} report layouts in database`);
    
    if (layouts.length > 0) {
      console.log("Sample layout:", JSON.stringify(layouts[0], null, 2));
    }
    
    const formattedLayouts = layouts.map(layout => {
      const formatted = {
        id: layout._id.toString(),
        title: layout.title,
        phase: layout.phase,
        headings: layout.headings || [],
        fontSize: layout.fontSize || "12",
        createdAt: layout.createdAt,
        updatedAt: layout.updatedAt
      };
      console.log(`Formatting layout: ${formatted.title} (${formatted.phase})`);
      return formatted;
    });
    
    console.log(`Sending ${formattedLayouts.length} report layouts to frontend`);
    console.log("Response data:", JSON.stringify({
      success: true,
      layoutsCount: formattedLayouts.length,
      layouts: formattedLayouts.map(l => ({ id: l.id, title: l.title, phase: l.phase }))
    }, null, 2));
    
    res.json({
      success: true,
      layouts: formattedLayouts
    });
  } catch (error) {
    console.error("Error fetching report layouts for mentor:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch report layouts",
      details: error.message 
    });
  }
});

// Parse PDF with selected report layout
app.post("/mentor/parse-pdf", async (req, res) => {
  console.log("=== PARSE PDF ENDPOINT HIT ===");
  console.log("Request method:", req.method);
  console.log("Request path:", req.path);
  console.log("Request body:", req.body);
  
  let tempPdfPath = null;
  
  try {
    const { pdfUrl, layoutId } = req.body;
    console.log("Extracted from body - pdfUrl:", pdfUrl, "layoutId:", layoutId);

    if (!pdfUrl || !layoutId) {
      return res.status(400).json({
        success: false,
        error: "PDF URL and layout ID are required"
      });
    }

    // Fetch the layout from database
    const layout = await ReportLayout.findById(layoutId).lean();
    if (!layout) {
      return res.status(404).json({
        success: false,
        error: "Report layout not found"
      });
    }

    // Extract fileId from URL
    // URL format: /files/{fileId} or /files/{fileId}/view
    // Also handle full URLs like http://localhost:5000/files/{fileId}
    console.log("Received pdfUrl:", pdfUrl);
    
    let fileId;
    try {
      // Remove protocol and domain if present
      let cleanUrl = pdfUrl;
      if (pdfUrl.includes('://')) {
        const urlObj = new URL(pdfUrl);
        cleanUrl = urlObj.pathname;
      }
      
      console.log("Cleaned URL:", cleanUrl);
      
      const urlMatch = cleanUrl.match(/\/files\/([^\/\?]+)/);
      if (!urlMatch || !urlMatch[1]) {
        console.error("URL pattern match failed. Clean URL:", cleanUrl);
        return res.status(400).json({
          success: false,
          error: `Invalid file URL format. Expected /files/{fileId}, got: ${pdfUrl}`
        });
      }
      
      const fileIdString = urlMatch[1];
      console.log("Extracted fileId string:", fileIdString);
      
      fileId = new mongoose.Types.ObjectId(fileIdString);
      console.log("Converted to ObjectId:", fileId.toString());
    } catch (e) {
      console.error("Error extracting fileId:", e);
      return res.status(400).json({
        success: false,
        error: `Invalid file ID format: ${e.message}`
      });
    }

    // Check if GridFS is initialized
    if (!gridfsBucket) {
      return res.status(500).json({
        success: false,
        error: "File storage is not initialized"
      });
    }

    // Check if file exists in GridFS before attempting download
    try {
      const files = await gridfsBucket.find({ _id: fileId }).toArray();
      if (files.length === 0) {
        console.error(`File with ID ${fileId} not found in GridFS`);
        return res.status(404).json({
          success: false,
          error: `PDF file not found in database (ID: ${fileId.toString()})`
        });
      }
      console.log(`Found file in GridFS: ${files[0].filename}, size: ${files[0].length} bytes`);
    } catch (checkError) {
      console.error("Error checking file in GridFS:", checkError);
      return res.status(500).json({
        success: false,
        error: `Error checking file in database: ${checkError.message}`
      });
    }

    // Download file from GridFS to temporary location
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    tempPdfPath = path.join(tempDir, `pdf_${Date.now()}_${fileId.toString()}.pdf`);
    
    console.log(`Downloading file ${fileId} from GridFS to ${tempPdfPath}`);
    
    const downloadStream = gridfsBucket.openDownloadStream(fileId);
    const writeStream = fs.createWriteStream(tempPdfPath);
    
    await new Promise((resolve, reject) => {
      downloadStream.on("error", (error) => {
        console.error("Error downloading file from GridFS:", error);
        console.error("Error details:", error.message, error.stack);
        reject(new Error(`File not found in GridFS: ${error.message}`));
      });
      
      writeStream.on("error", (error) => {
        console.error("Error writing temp file:", error);
        console.error("Error details:", error.message, error.stack);
        reject(new Error(`Failed to write temporary file: ${error.message}`));
      });
      
      writeStream.on("finish", () => {
        console.log(`File write stream finished for ${tempPdfPath}`);
        resolve();
      });
      
      downloadStream.pipe(writeStream);
    });
    
    console.log(`File downloaded successfully to ${tempPdfPath}`);
    
    // Verify file was written
    if (!fs.existsSync(tempPdfPath)) {
      return res.status(500).json({
        success: false,
        error: "Failed to download file from GridFS - file not found after download"
      });
    }
    
    const stats = fs.statSync(tempPdfPath);
    console.log(`Downloaded file size: ${stats.size} bytes`);
    
    if (stats.size === 0) {
      return res.status(500).json({
        success: false,
        error: "Downloaded file is empty"
      });
    }

    // Prepare headings for Python script
    const headingsJson = JSON.stringify(layout.headings || []);
    const fontSize = parseFloat(layout.fontSize) || 14.0;

    // Get Python script path
    const pythonScriptPath = path.join(__dirname, "pdf_parser.py");

    // Write headings to a temporary file to avoid command line escaping issues
    const tempHeadingsFile = path.join(__dirname, "temp_headings.json");
    fs.writeFileSync(tempHeadingsFile, headingsJson, "utf8");

    // Execute Python script
    const command = `python "${pythonScriptPath}" "${tempPdfPath}" "${tempHeadingsFile}" ${fontSize}`;
    
    console.log("Executing PDF parser command:", command);
    
    let stdout, stderr;
    const maxRetries = 2;
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt} for PDF parsing...`);
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const result = await execAsync(command, {
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
          timeout: 180000 // 180 second timeout (increased for LLM calls and retries)
        });
        stdout = result.stdout;
        stderr = result.stderr;
        lastError = null;
        break; // Success, exit retry loop
      } catch (execError) {
        lastError = execError;
        // Command might have failed, but check if we still got stdout with JSON
        stdout = execError.stdout || "";
        stderr = execError.stderr || "";
        console.error(`Python script execution error (attempt ${attempt + 1}):`, execError.message);
        
        // If we have valid JSON in stdout, don't retry
        if (stdout && stdout.trim()) {
          const jsonStart = stdout.lastIndexOf('{');
          const jsonEnd = stdout.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            try {
              const jsonStr = stdout.substring(jsonStart, jsonEnd + 1);
              JSON.parse(jsonStr); // Validate JSON is parseable
              console.log("Found valid JSON despite error, not retrying");
              break; // We have valid JSON, exit retry loop
            } catch (e) {
              // JSON is invalid, continue to retry
              console.log("JSON validation failed, will retry");
            }
          }
        }
        
        // If this was the last attempt, keep the error
        if (attempt === maxRetries) {
          console.error("All retry attempts exhausted");
        }
      }
    }
    
    // Clean up temp files (after retry loop completes)
    if (fs.existsSync(tempHeadingsFile)) {
      try {
        fs.unlinkSync(tempHeadingsFile);
      } catch (e) {
        console.error("Failed to delete temp headings file:", e);
      }
    }
    if (tempPdfPath && fs.existsSync(tempPdfPath)) {
      try {
        fs.unlinkSync(tempPdfPath);
        console.log(`Cleaned up temp PDF file: ${tempPdfPath}`);
      } catch (e) {
        console.error("Failed to delete temp PDF file:", e);
      }
    }

    // Log stderr for debugging (includes debug messages from Python script)
    if (stderr) {
      console.log("Python script stderr length:", stderr.length, "chars");
      console.log("Python script stderr (first 500):", stderr.substring(0, 500));
    }
    
    // Log stdout for debugging
    if (stdout) {
      console.log("Python script stdout length:", stdout.length, "chars");
      console.log("Python script stdout (first 500):", stdout.substring(0, 500));
      console.log("Python script stdout (last 500):", stdout.substring(Math.max(0, stdout.length - 500)));
      console.log("Python script stdout contains '{':", stdout.includes('{'));
      console.log("Python script stdout contains '}':", stdout.includes('}'));
    } else {
      console.error("CRITICAL: No stdout from Python script!");
    }

    // ALWAYS check for JSON in stdout first, regardless of command success/failure
    // The Python script always outputs JSON, even on errors
    // The JSON should be the ONLY thing in stdout (all debug goes to stderr)
    if (stdout && stdout.trim()) {
      // Try multiple strategies to find JSON
      let result = null;
      
      // Strategy 0: If stdout is just JSON (most common case after our fix)
      try {
        const trimmed = stdout.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          result = JSON.parse(trimmed);
          if (result && typeof result === 'object' && 'success' in result) {
            console.log("✓ Successfully parsed JSON (strategy 0 - direct parse), success:", result.success);
          } else {
            console.error("✗ Strategy 0: JSON parsed but missing 'success' field");
            result = null;
          }
        }
      } catch (e) {
        console.log("Strategy 0 failed (not pure JSON):", e.message);
        // Not pure JSON, continue to other strategies
      }
      
      // Strategy 1: Look for the last complete JSON object (most reliable)
      let jsonStart = stdout.lastIndexOf('{');
      let jsonEnd = stdout.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        try {
          const jsonStr = stdout.substring(jsonStart, jsonEnd + 1);
          console.log("Attempting to parse JSON (strategy 1):", jsonStr.substring(0, 200));
          
          // Validate JSON is complete by checking it's well-formed
          // Count braces to ensure it's balanced
          let braceCount = 0;
          for (let i = 0; i < jsonStr.length; i++) {
            if (jsonStr[i] === '{') braceCount++;
            if (jsonStr[i] === '}') braceCount--;
          }
          
          if (braceCount !== 0) {
            console.error("JSON appears incomplete (unbalanced braces), trying other strategies");
          } else {
            result = JSON.parse(jsonStr);
            // Validate result has required structure
            if (result && typeof result === 'object' && 'success' in result) {
              console.log("Successfully parsed JSON, success:", result.success);
            } else {
              console.error("JSON parsed but missing 'success' field");
              result = null;
            }
          }
        } catch (parseError) {
          console.error("Strategy 1 failed:", parseError.message);
        }
      }
      
      // Strategy 2: Try to find JSON by looking for lines that start with {
      if (!result) {
        const lines = stdout.split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith('{')) {
            try {
              // Try to parse from this line to the end
              const jsonStr = lines.slice(i).join('\n');
              result = JSON.parse(jsonStr);
              console.log("Successfully parsed JSON (strategy 2), success:", result.success);
              break;
            } catch (e) {
              // Try to find the complete JSON object
              let braceCount = 0;
              let startIdx = stdout.indexOf(line);
              let endIdx = startIdx;
              for (let j = startIdx; j < stdout.length; j++) {
                if (stdout[j] === '{') braceCount++;
                if (stdout[j] === '}') {
                  braceCount--;
                  if (braceCount === 0) {
                    endIdx = j;
                    break;
                  }
                }
              }
              if (endIdx > startIdx) {
                try {
                  const jsonStr = stdout.substring(startIdx, endIdx + 1);
                  result = JSON.parse(jsonStr);
                  console.log("Successfully parsed JSON (strategy 2b), success:", result.success);
                  break;
                } catch (e2) {
                  // Continue to next line
                }
              }
            }
          }
        }
      }
      
      // If we found valid JSON, return it
      if (result) {
        // If JSON has success: false, return it as error response
        if (result.success === false) {
          console.log("JSON indicates failure, returning error response");
          return res.status(500).json(result);
        }
        
        // Success! Return the result with 200 status (even if command "failed" due to stderr)
        console.log("JSON indicates success, returning result with 200 status");
        return res.status(200).json(result);
      } else {
        console.error("Could not parse JSON from stdout using any strategy");
        console.error("stdout length:", stdout.length);
        console.error("stdout preview (first 500):", stdout.substring(0, 500));
        console.error("stdout preview (last 500):", stdout.substring(Math.max(0, stdout.length - 500)));
        
        // Final safety check: try to extract any JSON-like structure
        console.log("Final attempt: trying to extract any JSON-like structure from stdout");
        const jsonMatches = stdout.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
        if (jsonMatches && jsonMatches.length > 0) {
          // Try the last (most complete) match
          for (let i = jsonMatches.length - 1; i >= 0; i--) {
            try {
              const parsed = JSON.parse(jsonMatches[i]);
              if (parsed && typeof parsed === 'object' && 'success' in parsed) {
                console.log("Found valid JSON in final attempt, success:", parsed.success);
                if (parsed.success === false) {
                  return res.status(500).json(parsed);
                }
                return res.status(200).json(parsed);
              }
            } catch (e) {
              // Continue to next match
            }
          }
        }
      }
    } else {
      console.error("No stdout output from Python script");
    }

    // If no valid JSON found, return error (but don't include stderr debug messages)
    // Only include actual error messages, not debug output
    let errorMessage = "Unknown error";
    
    // Check if we have any actual errors (not just debug messages)
    if (stderr) {
      // Filter out ALL debug/info messages - be very aggressive
      const debugKeywords = [
        'debug:', 'warning:', 'info:', 'loading', 'loaded successfully',
        'calculated:', 'evaluating', 'calling', 'model response received',
        'parsed score:', 'issues found:', 'technical soundness score:',
        'novelty score', 'checkpoint at:', 'found checkpoint', 'skipping',
        'extracted', 'quality metrics calculated', 'final cleaned text',
        'extracted text length', 'gunning fog index', 'automated readability',
        'lexical density', 'indecisive word index', 'quality score',
        'novelty model', 'llama model', 'attempting to parse', 'successfully parsed'
      ];
      
      const errorLines = stderr.split('\n').filter(line => {
        const lowerLine = line.toLowerCase().trim();
        // Skip empty lines
        if (!lowerLine) return false;
        // Skip lines that contain ANY debug keywords
        if (debugKeywords.some(keyword => lowerLine.includes(keyword))) {
          return false;
        }
        // Only keep lines that are actual errors (and don't contain debug keywords)
        const isError = (
          (lowerLine.includes('error') || 
           lowerLine.includes('exception') ||
           lowerLine.includes('traceback') ||
           (lowerLine.includes('failed') && !lowerLine.includes('debug'))) &&
          !lowerLine.includes('debug') &&
          !lowerLine.includes('warning') &&
          !lowerLine.includes('info')
        );
        return isError;
      });
      
      if (errorLines.length > 0) {
        // Take only the first actual error line to avoid duplication
        errorMessage = errorLines[0].trim();
      } else {
        // If no explicit errors found, provide a generic message
        errorMessage = "PDF parsing encountered an issue. Please check server logs for details.";
      }
    } else if (!stdout) {
      errorMessage = "No output from PDF parser";
    } else {
      errorMessage = "Could not parse JSON response from PDF parser";
    }
    
    // Ensure error message doesn't duplicate "Failed to parse PDF"
    if (errorMessage.toLowerCase().includes('failed to parse')) {
      errorMessage = errorMessage.replace(/failed to parse pdf:?\s*/gi, '').trim();
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage || "PDF parsing failed"
    });
  } catch (error) {
    console.error("Error parsing PDF:", error);
    
    // Clean up temp files on error
    if (tempPdfPath && fs.existsSync(tempPdfPath)) {
      try {
        fs.unlinkSync(tempPdfPath);
        console.log(`Cleaned up temp PDF file on error: ${tempPdfPath}`);
      } catch (e) {
        console.error("Failed to delete temp PDF file on error:", e);
      }
    }
    
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        error: "Invalid response from PDF parser"
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || "Failed to parse PDF"
    });
  }
});

// Save evaluation scores for a submission file
app.post("/mentor/save-evaluation", async (req, res) => {
  console.log("=== SAVE EVALUATION ENDPOINT HIT ===");
  console.log("Request method:", req.method);
  console.log("Request path:", req.path);
  console.log("Request body:", req.body);
  
  try {
    console.log("Save evaluation request received:", req.body);
    const { submissionId, fileId, scores, totalScore, evaluatedBy } = req.body;
    
    if (!submissionId || !fileId || !scores) {
      console.error("Missing required fields:", { submissionId: !!submissionId, fileId: !!fileId, scores: !!scores });
      return res.status(400).json({
        success: false,
        error: "Missing required fields: submissionId, fileId, and scores are required"
      });
    }
    
    console.log("Looking for submission:", submissionId);
    // Find the submission
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      console.error("Submission not found:", submissionId);
      return res.status(404).json({
        success: false,
        error: `Submission not found: ${submissionId}`
      });
    }
    
    console.log("Submission found, files count:", submission.files.length);
    console.log("Looking for fileId:", fileId, "Type:", typeof fileId);
    console.log("Available fileIds:", submission.files.map(f => ({ fileId: f.fileId.toString(), fileIdType: f.fileId.constructor.name, filename: f.filename })));
    
    // Convert fileId to ObjectId if it's a string, for proper comparison
    let fileIdToMatch = fileId;
    try {
      if (typeof fileId === 'string' && mongoose.Types.ObjectId.isValid(fileId)) {
        fileIdToMatch = new mongoose.Types.ObjectId(fileId);
      }
    } catch (e) {
      console.log("Could not convert fileId to ObjectId, using as-is");
    }
    
    // Find the file in the submission - try both string and ObjectId comparison
    const fileIndex = submission.files.findIndex(
      f => {
        const fileIdStr = f.fileId.toString();
        const searchIdStr = fileIdToMatch.toString();
        return fileIdStr === searchIdStr || fileIdStr === fileId || f.fileId.equals(fileIdToMatch);
      }
    );
    
    if (fileIndex === -1) {
      console.error("File not found in submission. Looking for:", fileId);
      console.error("Available files:", submission.files.map(f => ({ fileId: f.fileId.toString(), filename: f.filename })));
      return res.status(404).json({
        success: false,
        error: `File not found in submission. FileId: ${fileId}`
      });
    }
    
    console.log("File found at index:", fileIndex);
    
    // Update the file's evaluation
    submission.files[fileIndex].evaluation = {
      parserCheck: scores["Parser Check"] ? parseInt(scores["Parser Check"]) : null,
      imageCheck: scores["Image Check"] ? parseInt(scores["Image Check"]) : null,
      qualityCheck: scores["Quality Check"] ? parseInt(scores["Quality Check"]) : null,
      novelty: scores["Novelty"] ? parseInt(scores["Novelty"]) : null,
      technicalSoundness: scores["Technical Soundness"] ? parseInt(scores["Technical Soundness"]) : null,
      totalScore: totalScore || null,
      evaluatedAt: new Date(),
      evaluatedBy: evaluatedBy || null
    };
    
    // Save the submission
    await submission.save();
    
    res.json({
      success: true,
      message: "Evaluation saved successfully",
      evaluation: submission.files[fileIndex].evaluation
    });
  } catch (error) {
    console.error("Error saving evaluation:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to save evaluation"
    });
  }
});

// 404 handler for unmatched routes (add this before startServer)
app.use((req, res, next) => {
  if (req.path.includes('parse-pdf') || req.path.includes('mentor')) {
    console.log(`[404] ${req.method} ${req.path} - No matching route found`);
  }
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`
  });
});

const startServer = async () => {
  await connectDB();
  gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });
  await seedMentorsFromFile();
  await seedTeamsFromFile();

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(` Submission deadline: ${getDeadline().toLocaleString()}`);
    console.log(` Admin username: ${ADMIN_USERNAME}`);
    console.log(` File types configured: ${getFileTypes().map(ft => ft.label).join(", ")}`);
    console.log(`✅ Registered endpoints:`);
    console.log(`   - GET  /mentor/report-layouts`);
    console.log(`   - POST /mentor/parse-pdf`);
    console.log(`   - POST /mentor/save-evaluation`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
