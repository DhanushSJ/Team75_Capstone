const { Schema, model, Types } = require("mongoose");

const EvaluationSchema = new Schema(
  {
    parserCheck: { type: Number, default: null },
    imageCheck: { type: Number, default: null },
    qualityCheck: { type: Number, default: null },
    novelty: { type: Number, default: null },
    technicalSoundness: { type: Number, default: null },
    totalScore: { type: Number, default: null },
    evaluatedAt: { type: Date, default: Date.now },
    evaluatedBy: { type: String, default: null }, // Mentor username/ID
  },
  { _id: false }
);

const FileSchema = new Schema(
  {
    fileId: { type: Types.ObjectId, required: true },
    fieldName: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    evaluation: { type: EvaluationSchema, default: null }, // Evaluation scores for this file
  },
  { _id: false }
);

const SubmissionSchema = new Schema(
  {
    teamId: { type: String, required: true, index: true },
    phase: { type: String, required: true },
    review: { type: String, required: true },
    submissionType: { type: String, enum: ["ontime", "late"], required: true },
    files: { type: [FileSchema], default: [] },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model("Submission", SubmissionSchema);

