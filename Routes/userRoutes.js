const express = require("express");
const userRoute = express.Router();
const {
  signup,
  signin,
  deleteUser,
  userList,
  deleteEveryOne,
  getUser,
  followUser,
  verification,
  refreshToken,
  updateProfilePic,
  userData,
  updateUser,
  signout,
  makeAdmin,
  banUser,
} = require("../RouteHandlers/userHandler");
const isAdmin = require("../Middlewares/isAdmin");

userRoute.post("/signup", signup);
userRoute.post("/make-admin", makeAdmin);
userRoute.post("/signin", signin);
userRoute.get("/users/:userID", userData);
userRoute.patch("/follow", followUser);
userRoute.get("/verify", verification, getUser);
userRoute.get("/refresh", refreshToken, verification, getUser);
userRoute.patch("/uploaddp", updateProfilePic);
userRoute.patch("/update-user", updateUser);
userRoute.post("/signout", signout);

userRoute.get("/search-users/:search", userList);
userRoute.use(isAdmin);
userRoute.delete("/:userID", deleteUser);
userRoute.delete("/", deleteEveryOne);
userRoute.patch("/ban-user", banUser);

module.exports = { userRoute };
