const express = require("express");

const app = express();
require("dotenv").config();
const connectDB = require("./connectDB");

const PORT = process.env.PORT || 4444;

const startServer = async () => {
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () => console.log(`connected to the server:${PORT}`));
};
startServer();
const { userRoute } = require("./Routes/userRoutes");
const morgan = require("morgan");
const routeNotFound = require("./ErrorHandlers/routeNotFound");
const cors = require("cors");
const bodyParser = require("body-parser");
app.use(
  cors({
    origin: ["http://192.168.1.7:1111", "http://localhost"],
    credentials: true,
  })
);
require("express-async-errors");
app.use(express.json());
app.use(morgan("dev"));
const cookieParser = require("cookie-parser");
const { blogRouter } = require("./Routes/blogRoutes");
const commentRouter = require("./Routes/commentRoutes");

app.use(cookieParser());
app.get("/", (req, res) => {
  res.send(`<h1><center>Welcome to my server, Bitches!!!</center></h1>`);
});

app.use("/user", userRoute);
app.use("/blog", blogRouter);
app.use("/comment", commentRouter);
app.use(routeNotFound);
