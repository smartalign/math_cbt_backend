import { getConnection } from "./db.js";
import bcrypt from "bcryptjs"; // ✅ Needed for password hashing

export default async function handler(req, res) {
  // ✅ Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Only Post allowed" });
  }

  try {
    // ✅ Connect to MySQL
    const db = await getConnection();

    // ✅ Get `id` safely from query
    const id = parseInt(req.query.id);
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

    // ✅ Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !address ||
      !dob ||
      !role
    ) {
      await db.end();
      return res.status(400).json({
        status: "error",
        message: "Missing required fields.",
      });
    }

    // ✅ Prepare username and hashed password
    const username = `${firstName} ${lastName}`;
    const pswdhashing = `${firstName}1234`;
    const password = await bcrypt.hash(pswdhashing, 10);

    // ✅ Check if username already exists (excluding current record)
    const [userDup1] = await db.query(
      "SELECT * FROM users WHERE username = ? AND id != ?",
      [username, id]
    );
    const [userDup2] = await db.query(
      "SELECT * FROM nonstafftable WHERE username = ? AND id != ?",
      [username, id]
    );

    if (userDup1.length > 0 || userDup2.length > 0) {
      await db.end();
      return res
        .status(400)
        .json({ status: "error", message: "Username already exists" });
    }

    // ✅ Choose table based on role
    let sql = "";
    let params = [
      username,
      firstName,
      lastName,
      password,
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
      await db.end();
      return res.status(400).json({ status: "error", message: "Unknown role" });
    }

    // ✅ Execute update query
    const [result] = await db.query(sql, params);
    await db.end();

    // ✅ Respond to frontend
    if (result.affectedRows > 0) {
      return res.status(200).json({
        status: "success",
        message: "Update was successful",
      });
    } else {
      return res.status(404).json({
        status: "error",
        message: "User not found or no changes made",
      });
    }
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}
