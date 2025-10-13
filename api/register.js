import { getConnection } from "./db.js"; // import your reusable DB connection pool
import bcrypt from "bcryptjs"; // for password hashing

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  try {
    // 🧩 Get DB connection from your pool
    const db = await getConnection();

    // 📥 Parse the incoming JSON body
    const {
      firstName = "",
      lastName = "",
      class: userClass = "",
      email = "",
      address = "",
      role = "",
      dob = "",
    } = req.body;

    // ✅ Validate input
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields.",
      });
    }

    // 🧮 Generate username and password
    const username = `${firstName} ${lastName}`;
    const rawPassword = `${firstName}1234`; // same logic as in your PHP
    const hashedPassword = await bcrypt.hash(rawPassword, 10); // hash for security

    // 🔎 Check for duplicate username in both tables
    const [userCheck1] = await db.execute("SELECT * FROM users WHERE username = ?", [username]);
    const [userCheck2] = await db.execute("SELECT * FROM nonstafftable WHERE username = ?", [username]);

    if (userCheck1.length > 0 || userCheck2.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Username already exists.",
      });
    }

    // 🚀 Insert based on role
    let query;
    if (role === "admin") {
      query = `
        INSERT INTO users 
        (username, firstName, lastName, password, class, email, address, dob, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    } else if (role === "student" || role === "parent") {
      query = `
        INSERT INTO nonstafftable 
        (username, firstName, lastName, password, class, email, address, dob, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    } else {
      return res.status(400).json({ status: "error", message: "Unknown role" });
    }

    // 🧾 Execute insertion
    await db.execute(query, [
      username,
      firstName,
      lastName,
      hashedPassword,
      userClass,
      email,
      address,
      dob,
      role,
    ]);

    // ✅ Respond success
    return res.status(201).json({
      status: "success",
      message: "Registration was successful",
      username,
      password: rawPassword, // Optional: Only send if you want to show it in frontend
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      status: "error",
      message: "Registration failed",
      error: error.message,
    });
  }
}
