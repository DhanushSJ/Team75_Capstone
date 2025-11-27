const { Schema, model } = require("mongoose");

const MemberSchema = new Schema(
  {
    name: { type: String },
    srn: { type: String },
  },
  { _id: false }
);

const TeamSchema = new Schema(
  {
    teamId: { type: String, required: true, unique: true },
    teamName: { type: String, default: "" },
    members: { type: [MemberSchema], default: [] },
    mentorName: { type: String, default: "" },
    projectTitle: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    status: { type: String, default: "active" },
    notes: { type: String, default: "" },
    progress: {
      overallProgress: { type: Number, default: 0 },
      currentPhaseProgress: { type: Number, default: 0 },
      currentPhaseName: { type: String, default: "" },
      currentReviewName: { type: String, default: "" },
      teamSubmissionsCount: { type: Number, default: 0 },
      totalSubmissionsAllTeams: { type: Number, default: 0 },
      lastUpdated: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = model("Team", TeamSchema);

