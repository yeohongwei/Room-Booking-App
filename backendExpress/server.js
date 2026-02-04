import dotenv from "dotenv";
dotenv.config();
import rooms from "./routers/rooms.js";
import users from "./routers/users.js";
import bookings from "./routers/bookings.js";
import equipments from "./routers/equipments.js";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
});

// Need to connect DB here
const app = express();

app.use(cors());
app.use(helmet());
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// routers
app.use("/auth", users);
app.use("/rooms", rooms);
app.use("/equipments", equipments);
app.use("/bookings", bookings);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("JSON parsing error:", err.message);

    return res.status(400).json({
      status: 400,
      msg: "invalid JSON format",
    });
  } else if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    err.type === "entity.parse.failed"
  ) {
    console.error("URL-encoded parsing error:", err.message);

    return res.status(400).json({
      status: 400,
      msg: "invalid form data format",
    });
  }

  next(err);
});

app.use((err, req, res, next) => {
  console.error(err.message);
  console.error(err.stack);

  res.status(err.status || 500).json({
    status: "error",
    msg: "an unknown error occurred",
  });
});

const BACKEND_PORT = process.env.BACKEND_PORT || 5001;
app.listen(BACKEND_PORT, () => {
  console.log(`server started on port ${BACKEND_PORT}`);
});
