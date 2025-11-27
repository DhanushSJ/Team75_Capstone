const { Schema, model } = require("mongoose");

const MentorSchema = new Schema(
  {
    mentorName: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = model("Mentor", MentorSchema);

