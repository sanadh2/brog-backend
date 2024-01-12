const userModel = require("../Models/userModel");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const commentModel = require("../Models/commentModal");
const blogModel = require("../Models/blogModel");
const { isObjectIdOrHexString } = require("mongoose");
const notificationModel = require("../Models/notificationModal");

const signup = async (req, res, next) => {
  const { name, email, username, password } = req.body;

  if (!name || !email || !username || !password)
    return res
      .status(400)
      .json({ success: false, msg: "could not get enough credentials" });

  if (!password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/))
    return res
      .status(400)
      .json({ success: false, msg: "password is not strong enough" });

  const userExist =
    (await userModel.findOne({ email })) ||
    (await userModel.findOne({ username }));
  if (userExist) {
    return res
      .status(400)
      .json({ success: false, msg: "the user already exists" });
  }

  const user = new userModel({
    name,
    email,
    username,
    password: bcrypt.hashSync(password, 12),
  });

  const savedUser = await user
    .save()
    .then((user) => res.status(200).json(user))
    .catch((err) => {
      if (err.name == "ValidationError")
        res.status(400).json({
          success: false,
          error: err.message.replace(err._message.concat(": "), ""),
        });
      else if (err.code === 11000)
        res.status(400).json({
          success: false,
          error: `${Object.keys(err.keyValue)}`,
          msg: `${Object.keys(err.keyValue)} is already exists`,
        });
      else
        res.status(400).json({
          success: false,
          error: err,
        });
    });
};

const signin = async (req, res, next) => {
  const { usernameEmail, password } = req.body;
  if (!usernameEmail || !password) {
    return res
      .status(400)
      .json({ success: false, msg: "could not get enough credentials" });
  }
  let userExist;
  userExist =
    (await userModel.findOne({ email: usernameEmail })) ||
    (await userModel.findOne({ username: usernameEmail }));
  if (!userExist)
    return res
      .status(404)
      .json({ success: false, msg: "could not find the user" });

  const validPassword = bcrypt.compareSync(password, userExist.password);
  if (!validPassword)
    return res.status(400).json({ success: false, msg: "password Error" });

  const userToken = JWT.sign(
    { id: userExist._id, role: userExist.role },
    process.env.PRIVATE_KEY,
    {
      expiresIn: "5m",
    }
  );

  const { cookie } = req.headers;
  if (cookie) {
    const token = cookie.split("=")[1];
    JWT.verify(String(token), process.env.PRIVATE_KEY, (err, user) => {
      if (err) {
        return res.status(400).json({
          success: false,
          msg: "could not get enough credentialssss",
          err,
        });
      }
      res.clearCookie(`${user.id}`);
      req.cookies[`${user.id}`] = "";
    });
  }

  res.cookie(String(userExist._id), userToken, {
    path: "/",
    expires: new Date(Date.now() + 1000 * 120),
    httpOnly: true,
    // sameSite: "lax",
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({
    success: true,
    token: userToken,
  });
};

const verification = async (req, res, next) => {
  const cookie = req.headers.cookie;
  if (!cookie)
    return res
      .status(400)
      .json({ success: false, msg: "could not get enough credentials now" });
  const token = cookie.split("=")[1];

  JWT.verify(String(token), process.env.PRIVATE_KEY, (err, user) => {
    if (err) {
      return res
        .status(400)
        .json({ success: false, msg: "could not get enough credentials" });
    }
    req.id = user.id;
  });
  next();
};

const getUser = async (req, res, next) => {
  const userID = req.id;
  if (!userID)
    return res.status(400).json({ success: false, msg: "SOmething's fishy" });
  const user = await userModel
    .findById(userID)
    .select("-password")
    .populate("blogs")
    .populate({
      path: "notifications",
      populate: [{ path: "sender" }, { path: "recipient" }],
    });

  res.status(200).json({ success: true, user });
};

const refreshToken = async (req, res, next) => {
  const cookie = req.headers.cookie;
  if (!cookie)
    return res
      .status(400)
      .json({ success: false, msg: "could not get enough credentials" });
  const token = cookie.split("=")[1];
  JWT.verify(String(token), process.env.PRIVATE_KEY, (err, user) => {
    if (err) {
      return res
        .status(400)
        .json({ success: false, msg: "could not get enough credentialssss" });
    }
    res.clearCookie(`${user.id}`);
    req.cookies[`${user.id}`] = "";

    const newToken = JWT.sign(
      { id: user.id, role: user.role },
      process.env.PRIVATE_KEY,
      {
        expiresIn: "2m",
      }
    );

    res.cookie(String(user.id), newToken, {
      path: "/",
      expires: new Date(Date.now() + 1000 * 69),
      httpOnly: true,
      // sameSite: "lax",
      sameSite: "none",
      secure: true,
    });
    req.id = user.id;
    next();
  });
};

const deleteUser = async (req, res, next) => {
  const { password } = req.body;
  const { userID } = req.params;
  if (!password && !userID) {
    return res
      .status(400)
      .json({ success: false, msg: "could not get enough credentials" });
  }
  const isUserExist = await userModel
    .findByIdAndDelete(userID)
    .select("-password");

  if (!isUserExist)
    return res.status(404).json({
      success: false,
      error: "not found",
      msg: "could not find the user",
    });
  return res.status(200).json({ success: true, user: isUserExist });
};

const deleteEveryOne = async (req, res, next) => {
  await userModel.deleteMany({});
  await commentModel.deleteMany({});
  await blogModel.deleteMany({});
  return res.status(200).json({ success: true });
};

const userList = async (req, res, next) => {
  try {
    const { search } = req.params;
    if (!search || search.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Search term must be at least 3 characters",
      });
    }
    const regex = new RegExp(search, "i");
    const getUsers = await userModel.find({
      name: regex,
    });

    res.status(200).json({ success: true, users: getUsers });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const followUser = async (req, res, next) => {
  const { followeeID, userID } = req.body;

  const user = await userModel.findById(userID);
  const followee = await userModel.findById(followeeID);

  if (!followee || !user)
    return res
      .status(404)
      .json({ success: false, msg: "could not find the followee or user" });

  followOrUnfollow = user.following.includes(followeeID);

  if (!followOrUnfollow) {
    //this is following, man
    const notification = new notificationModel({
      title: "follow",
      message: "started to follow you",
      sender: userID,
      recipient: followeeID,
    });
    await notification.save();
    await userModel.findByIdAndUpdate(userID, {
      $addToSet: { following: followeeID },
    });
    await userModel.findByIdAndUpdate(followeeID, {
      $addToSet: { followers: userID },
      $push: {
        notifications: notification._id,
      },
    });
  } else {
    //this is unfollowing
    await userModel.findByIdAndUpdate(userID, {
      $pull: { following: followeeID },
    });
    await userModel.findByIdAndUpdate(followeeID, {
      $pull: { followers: userID },
    });
  }

  await user.save();
  await followee.save();
  return res.status(200).json({ success: true });
};

const userData = async (req, res, next) => {
  const { userID } = req.params;
  if (!userID)
    return res
      .status(400)
      .json({ success: false, msg: "could not get enough credentials" });

  if (!isObjectIdOrHexString(userID))
    return res.status(400).json({ success: false, msg: "Invalid ID" });

  const user = await userModel
    .findById(userID)
    .select("-password")
    .populate("blogs");

  if (!user)
    return res.status(404).json({
      success: false,
      msg: "could not find the user",
    });
  res.status(200).json({ success: true, user });
};

const updateUser = async (req, res, next) => {
  const { userID, name, email, username, oldPassword, newPassword } = req.body;
  if (!userID)
    return res
      .status(400)
      .json({ success: false, msg: "could not get enough user-credentials" });

  if (!name && !email && !username && !oldPassword)
    return res
      .status(400)
      .json({ success: false, msg: "could not get enough credentials" });

  try {
    const user = await userModel.findById(userID);
    if (oldPassword) {
      const validPassword = bcrypt.compareSync(oldPassword, user.password);
      if (!validPassword) {
        return res.status(403).json({ success: false, msg: "Password error" });
      }
    }

    if (newPassword) {
      user.password = bcrypt.hashSync(newPassword, 12);
    }

    if (name) {
      user.name = name;
    }

    if (email) {
      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist)
        return res
          .status(403)
          .json({ success: false, msg: "email already exists" });
      user.email = email;
    }

    if (username) {
      const isUsernameExist = await userModel.findOne({ username });
      if (isUsernameExist)
        return res
          .status(401)
          .json({ success: false, msg: "username already exists" });
      user.username = username;
    }

    if (newPassword) {
      user.password = bcrypt.hashSync(newPassword, 12);
    }
    await user.save();
    return res.json({ success: true, msg: "User updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

const makeAdmin = async (req, res, next) => {
  const { userID } = req.body;
  if (!userID)
    return res.status(400).json({
      success: false,
      msg: "Insufficient data to perform the operation.",
    });
  const admin = userModel.findOne({ role: "admin" });
  console.log(admin);
  const notification = new notificationModel({
    title: "admin",
    message: "made you admin",
    sender: "659d77dcbf9d3bb3860053cc",
    recipient: userID,
  });
  await notification.save();

  console.log(notification);

  const user = await userModel.findByIdAndUpdate(
    userID,
    {
      $set: {
        role: "admin",
      },
      $push: {
        notifications: notification._id,
      },
    },
    { new: true }
  );
  if (!user)
    return res.status(404).json({
      success: false,
      msg: "user with this ID not found.",
    });

  return res.status(200).json({ success: true, user });
};

const updateProfilePic = async (req, res, next) => {
  const { imageDp, userID } = req.body;
  if (!imageDp || !userID)
    return res
      .status(400)
      .json({ success: false, msg: "could not get enough credentials" });
  const user = await userModel.findByIdAndUpdate(
    userID,
    {
      $set: {
        profilePic: imageDp,
      },
    },
    { new: true }
  );
  if (!user)
    return res
      .status(404)
      .json({ success: false, msg: "couldn't find the user" });
  res.status(200).json({ success: true, msg: "profile picture changed" });
};

const signout = async (req, res, next) => {
  const cookie = req.headers.cookie;
  if (!cookie)
    return res
      .status(400)
      .json({ success: false, msg: "could not get enough credentials" });
  const token = cookie.split("=")[1];
  console.log(token);
  JWT.verify(token.toString(), process.env.PRIVATE_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ msg: "authentication failed" });
    }
    res.clearCookie(`${user.id}`);
    req.cookies[`${user.id}`] = "";
    res.status(200).json({ msg: "Logged out" });
  });
};

const banUser = async (req, res, next) => {
  const { userID } = req.body;
  if (!userID)
    return res
      .status(200)
      .json({ success: false, msg: "could not get enough credentials" });

  const notification = new notificationModel({
    title: "ban",
    message: "banned you",
    sender: "659d77dcbf9d3bb3860053cc",
    recipient: userID,
  });
  await notification.save();
  const user = await userModel.findByIdAndUpdate(
    userID,
    {
      isBanned: true,
      $push: {
        notifications: notification._id,
      },
    },
    { new: true }
  );
  res.status(200).json({ success: true, user });

  setTimeout(async () => {
    const notification = new notificationModel({
      title: "ban",
      message: "Your ban is revoked",
      sender: "659d77dcbf9d3bb3860053cc",
      recipient: userID,
    });
    await notification.save();
    const user = await userModel.findByIdAndUpdate(
      userID,
      {
        isBanned: false,
        $push: {
          notifications: notification._id,
        },
      },
      { new: true }
    );
    await user.save();
  }, 60000);
};

module.exports = {
  signup,
  signin,
  deleteUser,
  userList,
  deleteEveryOne,
  getUser,
  followUser,
  makeAdmin,
  refreshToken,
  verification,
  updateProfilePic,
  userData,
  updateUser,
  signout,
  banUser,
};
