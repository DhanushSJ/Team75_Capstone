const { Schema, model } = require("mongoose");

const AnnouncementSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    priority: { type: String, default: "normal" },
  },
  { timestamps: true }
);

module.exports = model("Announcement", AnnouncementSchema);

