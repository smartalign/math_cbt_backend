import express from "express";
import { getConnection } from "./db.js";

const router = express.Router();

// ✅ GET /api/getUsers
router.get("/", async (req, res) => {
  try {
    const db = await getConnection();

    // 🔹 Fetch all users from both tables
    const [users] = await db.execute("SELECT * FROM users");
    // console.log("SAMPLE ROW FROM USERS:", users[0]);

    const [nonStaff] = await db.execute("SELECT * FROM nonstafftable");

    // 🧮 Combine both sets of results
    const allUsers = [];

    // Add admin users
    users.forEach((row) => {
      if (row.username && row.username.trim() !== "") {
        allUsers.push({
          id: row.id,
          name: row.username,
          class: row.class,
          gender: row.gender,
          dob: row.dob,
          address: row.address,
          role: row.role,
          status: row.status,
        });
      }
    });

    // Add students/parents
    nonStaff.forEach((row) => {
      if (row.username && row.username.trim() !== "") {
        allUsers.push({
          id: row.id,
          name: row.username,
          class: row.class,
          gender: row.gender,
          dob: row.dob,
          address: row.address,
          role: row.role,
          status: row.status,
        });
      }
    });

    // ✅ Respond with combined list
    return res.status(200).json(allUsers);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});

export default router;
