// server.js
import express from "express";
import cors from "cors";
import loginHandler from "./api/login.js"; // Import your login API handler
import updateUserRoute from "./api/update_user.js";
import registerRoute from "./api/register.js";
import getUsersRoute from "./api/get_users.js";
import getUserByIdRoute from "./api/get_user_by_id.js";
import deleteUserRoute from "./api/delete_users.js";
import deleteMultipleUsersRoute from "./api/delete_multiple_users.js";


const app = express();
const PORT = process.env.PORT || 3001;

// 🧩 Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// 🧠 API Routes
// app.post("/api/login", async (req, res) => {
//   try {
//     await loginHandler(req, res);
//   } catch (error) {
//     console.error("Error in /api/login route:", error);
//     res.status(500).json({ status: "error", message: "Internal server error" });
//   }
// });


app.use("/api/login", loginHandler);
app.use("/api/register", registerRoute);
app.use("/api/update_user", updateUserRoute);
app.use("/api/get_users", getUsersRoute);
app.use("/api/get_user_by_id", getUserByIdRoute);
app.use("/api/delete_users", deleteUserRoute);
app.use("/api/delete_multiple_users", deleteMultipleUsersRoute);





// 🩵 Health Check Route
app.get("/", (req, res) => {
  res.send("✅ Math CBT Backend is running successfully!");
});

// 🟢 Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
