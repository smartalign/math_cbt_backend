import express from "express";
import bcrypt from "bcryptjs";
import { getConnection } from "./db.js";

const router = express.Router();

router.post("/:id", async (req, res) => {
  try {
    const db = await getConnection();

    const id = parseInt(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ status: "error", message: "Invalid ID" });
    }

    const {
      firstName = "",
      lastName = "",
      class: userClass = "",
      gender = "",
      email = "",
      address = "",
      role = "",
      dob = "",
    } = req.body;

    if (!firstName || !lastName || !email || !address || !dob || !role ||!gender) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields.",
      });
    }

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




    // ✅ Check current table (find where this ID lives)
    const [foundInUsers] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    const [foundInNonStaff] = await db.query("SELECT * FROM nonstafftable WHERE id = ?", [id]);

    // ✅ If moving between tables
    if (role === "admin" && foundInNonStaff.length > 0) {
      // move from nonstafftable → users
      const user = foundInNonStaff[0];

      await db.query(
        "INSERT INTO users (username, firstName, lastName, password, class, gender, email, address, dob, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [username, firstName, lastName, hashedPassword, userClass, gender, email, address, dob, role]
      );

      await db.query("DELETE FROM nonstafftable WHERE id = ?", [id]);

      return res.status(200).json({
        status: "success",
        message: "User Just Became An Admin.",
      });
    }

    if ((role === "student" || role === "parent") && foundInUsers.length > 0) {
      // move from users → nonstafftable
      const user = foundInUsers[0];

      await db.query(
        "INSERT INTO nonstafftable (username, firstName, lastName, password, class, gender, email, address, dob, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [username, firstName, lastName, hashedPassword, userClass, gender, email, address, dob, role]
      );

      await db.query("DELETE FROM users WHERE id = ?", [id]);

      return res.status(200).json({
        status: "success",
        message: "User Status Updated Successfully.",
      });
    }

    // ✅ Otherwise, normal update within the same table
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
      role,
      id,
    ];

    let sql = "";
    if (foundInUsers.length > 0) {
      sql = `
        UPDATE users
        SET username=?, firstName=?, lastName=?, password=?, class=?, gender=?, email=?, address=?, dob=?, role=?
        WHERE id=?`;
    } else if (foundInNonStaff.length > 0) {
      sql = `
        UPDATE nonstafftable
        SET username=?, firstName=?, lastName=?, password=?, class=?, gender=?, email=?, address=?, dob=?, role=?
        WHERE id=?`;
    } else {
      return res.status(404).json({
        status: "error",
        message: "User Not Found.",
      });
    }

    const [result] = await db.query(sql, params);

    if (result.affectedRows > 0) {
      return res.status(200).json({
        status: "success",
        message: "User updated successfully.",
      });
    } else {
      return res.status(404).json({
        status: "error",
        message: "No changes made.",
      });
    }
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ status: "error", message: "Server error." });
  }
});

export default router;
