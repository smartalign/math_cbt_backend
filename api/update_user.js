import express from "express";
import bcrypt from "bcryptjs";
import { getConnection } from "./db.js";

const router = express.Router();

router.post("/:role/:id", async (req, res) => {
  try {
    const db = await getConnection();
    const { role, id } = req.params;
    const numericId = parseInt(id);

    if (!numericId || numericId <= 0) {
      return res.status(400).json({ status: "error", message: "Invalid ID" });
    }

    // ✅ Validate role and select correct table
    const table = role === "admin" ? "users" : "nonstafftable";
    const [currentUser] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [numericId]);

    if (currentUser.length === 0) {
      return res.status(404).json({ status: "error", message: "User not found." });
    }

    const {
      firstName = "",
      lastName = "",
      class: userClass = "",
      gender = "",
      email = "",
      address = "",
      dob = "",
      newRole = role, // optional new role (for moving between tables)
      status,
    } = req.body;

    if (!firstName || !lastName || !email || !address || !dob || !gender) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields.",
      });
    }

    const username = `${firstName} ${lastName}`;
    const rawPassword = `${firstName}1234`;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const oldUsername = currentUser[0].username;

    // ✅ If username changed, check duplicates across both tables
    if (username !== oldUsername) {
      const [existsInUsers] = await db.query(
        "SELECT id FROM users WHERE username = ?",
        [username]
      );
      const [existsInNonStaff] = await db.query(
        "SELECT id FROM nonstafftable WHERE username = ?",
        [username]
      );

      if (existsInUsers.length > 0 || existsInNonStaff.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Username already exists.",
        });
      }
    }

    // ✅ Handle role change (moving between tables)
    if (newRole === "admin" && table === "nonstafftable") {
      // move nonstaff → users
      await db.query(
        "INSERT INTO users (username, firstName, lastName, password, class, gender, email, address, dob, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [username, firstName, lastName, hashedPassword, userClass, gender, email, address, dob, newRole, status]
      );
      await db.query("DELETE FROM nonstafftable WHERE id = ?", [numericId]);

      return res.status(200).json({
        status: "success",
        message: "User promoted to admin successfully.",
      });
    }

    if ((newRole === "student" || newRole === "parent") && table === "users") {
      // move users → nonstaff
      await db.query(
        "INSERT INTO nonstafftable (username, firstName, lastName, password, class, gender, email, address, dob, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [username, firstName, lastName, hashedPassword, userClass, gender, email, address, dob, newRole, status]
      );
      await db.query("DELETE FROM users WHERE id = ?", [numericId]);

      return res.status(200).json({
        status: "success",
        message: "User moved to nonstafftable successfully.",
      });
    }

    // ✅ Normal update within the same table
    const params = [
      username,
      firstName,
      lastName,
      hashedPassword,
      userClass,
      gender,
      email,
      address,
      dob,
      newRole,
      status,
      numericId,
    ];

    const sql = `
      UPDATE ${table}
      SET username=?, firstName=?, lastName=?, password=?, class=?, gender=?, email=?, address=?, dob=?, role=?, status=?
      WHERE id=?`;

    const [result] = await db.query(sql, params);

    if (result.affectedRows > 0) {
      return res.status(200).json({
        status: "success",
        message: "User updated successfully.",
      });
    } else {
      return res.status(400).json({
        status: "error",
        message: "No changes made.",
      });
    }
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      error: err.message,
    });
  }
});

export default router;
