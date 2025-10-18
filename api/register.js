import express from "express";
import bcrypt from "bcryptjs";
import { getConnection } from "./db.js"; // adjust path as needed

const router = express.Router();

// ✅ POST /api/register
router.post("/", async (req, res) => {
  try {
    const db = await getConnection();

    const {
      firstName = "",
      lastName = "",
      class: userClass = "",
      gender= "",
      email = "",
      address = "",
      dob = "",
      role = "",
      status = "active",
    } = req.body;

    // ✅ Input validation
    if (!firstName || !lastName || !email || !role || !gender || !status) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields.",
      });
    }

    // 🧮 Generate username and password
    const username = `${firstName} ${lastName}`;
    const rawPassword = `${firstName}1234`;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 🔎 Check for duplicate username in both tables
    const [userCheck1] = await db.execute("SELECT * FROM users WHERE username = ?", [username]);
    const [userCheck2] = await db.execute("SELECT * FROM nonstafftable WHERE username = ?", [username]);

    if (userCheck1.length > 0 || userCheck2.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Username already exists.",
      });
    }

    // 🚀 Insert into the correct table based on role
    let query;
    if (role === "admin") {
      query = `
        INSERT INTO users 
        (username, firstName, lastName, password, class, gender, email, address, dob, role, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
    } else if (role === "student" || role === "parent") {
      query = `
        INSERT INTO nonstafftable 
        (username, firstName, lastName, password, class, gender, email, address, dob, role, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
    } else {
      return res.status(400).json({ status: "error", message: "Unknown role." });
    }

    await db.execute(query, [
      username,
      firstName,
      lastName,
      hashedPassword,
      userClass,
      gender,
      email,
      address,
      dob,
      role,
      status,
    ]);

    // ✅ Respond success
    return res.status(201).json({
      status: "success",
      message: "Registration was successful.",
      username,
      password: rawPassword, // Optional: display in frontend
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      status: "error",
      message: "Registration failed.",
      error: error.message,
    });
  }
});

export default router;