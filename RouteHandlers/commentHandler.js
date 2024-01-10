const commentModel = require("../Models/commentModal");
const blogModel = require("../Models/blogModel");
const userModel = require("../Models/userModel");

const getComments = async (req, res, next) => {
  const { blogID } = req.params;
  if (!blogID)
    return res.status(400).json({ success: false, msg: "need BlogId" });
  const comments = await commentModel.find({ blogID });
  return res.status(200).json({ success: true, comments });
};

const postComment = async (req, res, next) => {
  const { comment, blogID, userID } = req.body;
  if (!comment || !blogID || !userID)
    return res
      .status(400)
      .json({ success: false, msg: "not enough credtentials" });

  const user = await userModel.findById(userID).select("-password");

  if (!user)
    return res.status(404).json({ success: false, msg: "user doesn't exist" });
  const blog = await blogModel.findById(blogID);
  if (!blog)
    return res.status(404).json({ success: false, msg: "blog doesn't exist" });

  const newComment = new commentModel({
    comment,
    blogID,
    userID,
  });
  blog.comments.push(newComment._id);
  await newComment.save();
  await blog.save();
  return res
    .status(200)
    .json({ success: true, msg: "comment added", comment: newComment });
};

const deleteComment = async (req, res, next) => {
  const { commentID } = req.params;
  if (!commentID)
    return res
      .status(400)
      .json({ success: false, msg: "not enough credtentials" });

  const comment = await commentModel.findById(commentID);

  if (!comment)
    return res
      .status(404)
      .json({ success: false, msg: "comment doesn't exist" });

  const blog = await blogModel.findByIdAndUpdate(comment.blogID, {
    $pull: {
      comments: commentID,
    },
  });
  if (!blog) return res.status(500).json("Something's fishy");
  await comment.deleteOne();

  res.status(200).json({ success: true });
};

module.exports = { getComments, postComment, deleteComment };
