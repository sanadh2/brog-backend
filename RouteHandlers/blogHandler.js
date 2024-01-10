const blogModel = require("../Models/blogModel");
const userModel = require("../Models/userModel");
const notificationModel = require("../Models/notificationModal");

const createBlog = async (req, res, next) => {
  const { title, content, userID: authorID, category, images } = req.body;
  if (!title || !content || !authorID || !category || images == [])
    return res
      .status(400)
      .json({ success: false, msg: `couldn't get enough data` });
  console.log(images);
  const blog = new blogModel({
    title,
    content,
    authorID,
    category,
    images,
  });

  try {
    const returnBlog = await blog.save();
    await userModel.findByIdAndUpdate(authorID, {
      $push: {
        blogs: returnBlog._id,
      },
    });
    return res.status(201).json({ success: true, blog });
  } catch (err) {
    return res.status(400).json({ success: false, msg: "error" });
  }
};

const updateBlog = async (req, res, next) => {
  const { blogID, title, content, category, images, userID } = req.body;

  if (!blogID || !userID)
    return res
      .status(400)
      .json({ success: false, msg: "couldn't get enough credentials" });

  if (!title && !content && !category && !images)
    return res
      .status(400)
      .json({ success: false, msg: "couldn't get enough data" });

  try {
    const blog = await blogModel.findById(blogID);
    if (!blog)
      return res
        .status(404)
        .json({ success: false, msg: "no blog with this id" });

    if (blog.authorID !== userID) {
      const user = await userModel.findById(userID);
      if (!user || user.role !== "admin") {
        return res
          .status(401)
          .json({ success: false, msg: "Unauthorized request" });
      }
    }

    if (title) blog.title = title;
    if (content) blog.content = content;
    if (category) blog.category = category;
    if (images) blog.images = images;

    await blog.save();

    return res.status(204).json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, msg: "error" });
  }
};

const deleteBlog = async (req, res, next) => {
  const { blogID, userID } = req.query;
  if (!blogID || !userID)
    return res
      .status(400)
      .json({ success: false, msg: "couldn't get enough data" });
  const blog = await blogModel.findById(blogID);
  if (!blog)
    return res
      .status(404)
      .json({ success: false, msg: "couldn't find blog with this id" });
  const user = await userModel.findById(userID);
  if (blog.authorID !== userID) {
    if (!user || user.role !== "admin") {
      return res
        .status(401)
        .json({ success: false, msg: "Unauthorized request" });
    }
  }
  await blog.deleteOne();
  user.blogs = user.blogs.filter((blog) => blog._id !== blogID);
  await user.save();
  return res
    .status(200)
    .json({ success: true, msg: `Blog: ${blog.title} deleted` });
};

const getBlogs = async (req, res, next) => {
  const sorted = blogModel.find({}).sort("-createdAt");
  const result = await sorted;
  return res.json({ result });
};

const getFollowingBlogs = async (req, res, next) => {
  const { userID } = req.params;
  if (!userID)
    return res
      .status(400)
      .json({ success: false, msg: "could not get userID" });

  const user = await userModel.findById(userID);
  const followingBlogs = await blogModel.find({
    authorID: { $in: user.following },
  });

  res.status(200).json({ success: true, followingBlogs, following: user });
};

const getSingleBlog = async (req, res, next) => {
  const blogID = req.query.blogID;
  const userID = req.query.userID;
  if (!blogID || !userID)
    return res
      .status(400)
      .json({ success: false, msg: "couldn't get enough data" });
  const blog = await blogModel
    .findByIdAndUpdate(blogID, { $addToSet: { view: userID } }, { new: true })
    .populate({ path: "comments", populate: "userID" })
    .populate({ path: "authorID", select: "-password" });

  if (!blog)
    return res
      .status(404)
      .json({ success: false, msg: "there is no blog with this id" });
  return res.status(200).json({ success: true, blog });
};

const likeUnlike = async (req, res, next) => {
  const { blogID, userID } = req.body;
  if (!blogID || !userID)
    return res
      .status(400)
      .json({ success: false, msg: "couldn't get enough data" });
  const blog = await blogModel.findById(blogID);

  if (!blog)
    return res
      .status(404)
      .json({ success: false, msg: "couldn't find blog with this id" });

  if (blog.likes.includes(userID)) {
    await blogModel.updateOne({ _id: blogID }, { $pull: { likes: userID } });
    return res.status(200).json({ success: true, msg: "unliked" });
  }
  blog.likes.push(userID);
  await blog.save();
  const notification = new notificationModel({
    title: "like",
    message: "liked your blog",
    sender: userID,
    recipient: blog.authorID,
    blogID,
  });
  await notification.save();
  await userModel.findByIdAndUpdate(blog.authorID, {
    $push: {
      notifications: notification._id,
    },
  });
  return res.status(200).json({ success: true, msg: "liked" });
};

const reportBlog = async (req, res, next) => {
  const { userID, blogID } = req.body;
  if (!blogID || !userID)
    return res
      .status(400)
      .json({ success: false, msg: "couldn't get enough data" });

  const blog = await blogModel.findByIdAndUpdate(
    blogID,
    {
      $addToSet: {
        report: userID,
      },
    },
    { new: true }
  );

  if (!blog)
    return res
      .status(404)
      .json({ success: false, msg: "Could not find the blog" });

  const notification = new notificationModel({
    title: "report",
    message: "reported",
    sender: userID,
    recipient: blog.authorID,
    blogID: blogID,
  });
  await notification.save();
  await userModel.findOneAndUpdate(
    { role: "admin" },
    {
      $addToSet: {
        notifications: notification._id,
      },
    }
  );
  res.status(200).json({ success: true, blog });
};

const featuredBlogs = async (req, res, next) => {
  const blogs = await blogModel.find().sort({ views: -1 }).limit(10);
  return res.status(200).json({ success: true, blogs });
};

module.exports = {
  createBlog,
  deleteBlog,
  likeUnlike,
  getBlogs,
  getSingleBlog,
  updateBlog,
  getFollowingBlogs,
  reportBlog,
  featuredBlogs,
};
