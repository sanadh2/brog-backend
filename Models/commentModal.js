const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const commentSchema = new Schema({
  comment: {
    type: String,
    minlength: [1, "comment must be atleast 1 letter"],
    required: [true, "comment must have a content"],
  },
  blogID: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "must have blogID"],
    ref: "blog",
  },
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "must have the userID"],
    ref: "user",
  },
});

const commentModel = model("comment", commentSchema);

module.exports = commentModel;
