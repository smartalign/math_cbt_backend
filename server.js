import express from "express";
import cors from "cors";
import loginHandler from "./api/login.js"; // ✅ import your handler

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json()); // ✅ Needed so req.body works

// Adapt serverless handler to Express
app.post("/api/login", async (req, res) => {
  try {
    // Simply pass req, res to your function
    await loginHandler(req, res);
  } catch (err) {
    console.error("Error in /api/login route:", err);
    res.status(500).json({ status: "error", message: "Server crashed internally" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Backend server is running!");
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
