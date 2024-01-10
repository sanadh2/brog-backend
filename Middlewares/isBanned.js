const userModel = require("../Models/userModel");
const isBanned = async (req, res, next) => {
  const { userID } = req.body;
  if (!userID)
    return res.status(400).json({ success: false, msg: "something's Fishy" });
  const user = await userModel.findById(userID).select("isBanned");
  if (user.isBanned == true)
    return res.status(403).json({
      success: false,
      msg: "Sorry you cannot upload blogs right now, wait for the banned time to over.",
    });
  next();
};
module.exports = isBanned;
