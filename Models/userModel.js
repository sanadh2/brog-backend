const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const blogModel = require("./blogModel");
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "user must have a name"],
      trim: true,
      minlength: [3, "name must have atleast 3 letters"],
    },
    email: {
      type: String,
      required: [true, "user must have an email"],
      trim: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Invalid Email",
      ],
      lowercase: true,
    },
    username: {
      type: String,
      required: [true, "User must have a username"],
      trim: true,
      minlength: [6, "username must have atleast  6 letters"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "user must have a password"],
      minlength: [8, "password must have atleast  8 letters"],
    },
    blogs: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "blog",
      default: [],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    followers: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: "user",
    },
    following: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: "user",
    },
    profilePic: {
      type: String,
      default:
        "https://firebasestorage.googleapis.com/v0/b/blog-10df3.appspot.com/o/DPs%2Fdefault-avatar.jpg?alt=media&token=16f238d1-2f5e-4cf2-b1b6-5f9ca25c66d1",
    },
    notifications: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "notification",
      default: [],
    },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const userModel = model("user", userSchema);
module.exports = userModel;
