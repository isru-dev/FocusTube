
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import channelurl from "./src/routes/channelurl.js";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://focus-tube-wine.vercel.app",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server requests and health checks.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked origin: ${origin}`));
      }
    },
  })
);

app.use(express.json());

// Health check
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "FocusTube API is running",
    environment: process.env.NODE_ENV || "development",
  });
});

// YouTube API routes
app.use("/youtube/url", channelurl);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`FocusTube API listening on port ${PORT}`);
});
