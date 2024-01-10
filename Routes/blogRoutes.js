const express = require("express");
const blogRouter = express.Router();
const {
  createBlog,
  getBlogs,
  getSingleBlog,
  likeUnlike,
  deleteBlog,
  getFollowingBlogs,
  reportBlog,
  featuredBlogs,
} = require("../RouteHandlers/blogHandler");

const blogModel = require("../Models/blogModel");
const userModel = require("../Models/userModel");
const isBanned = require("../Middlewares/isBanned");
blogRouter.patch("/dummy-route", async (req, res, next) => {});

blogRouter.post("/new-blog", isBanned, createBlog);

blogRouter.get("/blogs", getBlogs);
blogRouter.get("/blogs/single", getSingleBlog);
blogRouter.get("/following/:userID", getFollowingBlogs);
blogRouter.patch("/blogs/like-unlike", likeUnlike);
blogRouter.delete("/blogs", deleteBlog);
blogRouter.post("/report-blog", reportBlog);
blogRouter.get("/featured-blogs", featuredBlogs);

module.exports = { blogRouter };
