const { Schema, model } = require("mongoose");

const HeadingSchema = new Schema(
  {
    id: { type: Number },
    text: { type: String, default: "" },
  },
  { _id: false }
);

const ReportLayoutSchema = new Schema(
  {
    title: { type: String, required: true },
    phase: { type: String, required: true, enum: ["phase1", "phase2", "phase3", "phase4"] },
    headings: { type: [HeadingSchema], default: [] },
    fontSize: { type: String, default: "12" },
  },
  { timestamps: true }
);

module.exports = model("ReportLayout", ReportLayoutSchema);

