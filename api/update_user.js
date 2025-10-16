import express from "express";
import bcrypt from "bcryptjs";
import { getConnection } from "./db.js";

const router = express.Router();

// ✅ POST /api/updateUser/:id
router.post("/:id", async (req, res) => {
  try {
    const db = await getConnection();

    // ✅ Get ID safely from URL params
    const id = parseInt(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ status: "error", message: "Invalid ID" });
    }

    // ✅ Parse request body
    const {
      firstName = "",
      lastName = "",
      class: userClass = "",
      email = "",
      address = "",
      role = "",
      dob = "",
    } = req.body;

    // ✅ Validate fields
    if (!firstName || !lastName || !email || !address || !dob || !role) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields.",
      });
    }

    // ✅ Prepare new values
    const username = `${firstName} ${lastName}`;
    const rawPassword = `${firstName}1234`;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // ✅ Check for duplicate username (excluding current record)
    const [userDup1] = await db.query(
      "SELECT * FROM users WHERE username = ? AND id != ?",
      [username, id]
    );
    const [userDup2] = await db.query(
      "SELECT * FROM nonstafftable WHERE username = ? AND id != ?",
      [username, id]
    );

    if (userDup1.length > 0 || userDup2.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Username already exists.",
      });
    }

    // ✅ Build SQL query depending on role
    let sql = "";
    const params = [
      username,
      firstName,
      lastName,
      hashedPassword,
      userClass,
      email,
      address,
      dob,
      role,
      id,
    ];

    if (role === "admin") {
      sql = `
        UPDATE users
        SET username=?, firstName=?, lastName=?, password=?, class=?, email=?, address=?, dob=?, role=?
        WHERE id=?`;
    } else if (role === "student" || role === "parent") {
      sql = `
        UPDATE nonstafftable
        SET username=?, firstName=?, lastName=?, password=?, class=?, email=?, address=?, dob=?, role=?
        WHERE id=?`;
    } else {
      return res.status(400).json({
        status: "error",
        message: "Unknown role.",
      });
    }

    // ✅ Execute update query
    const [result] = await db.query(sql, params);

    // ✅ Return appropriate response
    if (result.affectedRows > 0) {
      return res.status(200).json({
        status: "success",
        message: "Update was successful.",
      });
    } else {
      return res.status(404).json({
        status: "error",
        message: "User not found or no changes made.",
      });
    }
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ status: "error", message: "Server error." });
  }
});

export default router;
