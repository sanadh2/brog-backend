const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    sender: {
      type: String,
      required: true,
      ref: "user",
    },
    recipient: {
      type: String,
      required: true,
      ref: "user",
    },
    blogID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "blog",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const notificationModel = model("notification", notificationSchema);

module.exports = notificationModel;
