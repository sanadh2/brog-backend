const { Router } = require("express");
const {
  postComment,
  getComments,
  deleteComment,
} = require("../RouteHandlers/commentHandler");
const commentRouter = Router();

commentRouter.get("/:blogID", getComments);
commentRouter.post("/add-comment", postComment);
commentRouter.delete("/:commentID", deleteComment);
module.exports = commentRouter;
