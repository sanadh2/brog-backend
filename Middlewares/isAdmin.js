const JWT = require("jsonwebtoken");

const isAdmin = (req, res, next) => {
  const cookie = req.headers.cookie;
  if (!cookie) {
    return res.status(401).json({ msg: "Access denied, Man" });
  }
  const token = cookie.split("=")[1];
  try {
    const decoded = JWT.verify(token, process.env.PRIVATE_KEY);

    if (decoded.role !== "admin") {
      throw new Error();
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ msg: "Access denied" });
  }
};

module.exports = isAdmin;
