const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "blog must have a title"],
      trim: true,
      uppercase: true,
      minlength: [4, "title must have minimum 4 letters"],
    },
    content: {
      type: String,
      required: [true, "blog must have content"],
      trim: true,
      minlength: [4, "content must have minimum 4 letters"],
    },
    authorID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    category: {
      type: String,
      enum: [
        "How-to Guides",
        "Listicles",
        "Interviews",
        "Reviews",
        "Case Studies",
        "Personal Stories",
        "Guest Posts",
        "Roundup Posts",
        "Behind-the-Scenes",
        "Technology",
        "FAQs (Frequently Asked Questions)",
        "Health and Wellness",
        "Science",
        "Nature",
        "Food and Travel",
        "History",
        "Travel",
        "Photography",
        "Exploration",
        "Wildlife",
      ],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    images: {
      type: [String],
      default: [],
    },

    updatedAt: {
      type: Date,
      default: Date.now(),
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: "user",
    },
    comments: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: "comment",
    },
    view: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: "user",
    },
    report: {
      type: [],
      default: [mongoose.Schema.Types.ObjectId],
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);
const blogModel = model("blog", blogSchema);

module.exports = blogModel;
