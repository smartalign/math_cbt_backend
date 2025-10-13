import { getConnection } from "./db.js";

export default async function handler(req, res) {
  
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  // ✅ Allow only GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  try {
    // 🧠 Connect to database
    const db = await getConnection();

    // 📥 Extract query params
    const id = parseInt(req.query.id, 10);
    const role = req.query.role || "";

    // ✅ Validate input
    if (!id || id <= 0) {
      return res.status(400).json({ status: "error", message: "Invalid or missing ID" });
    }

    if (!role) {
      return res.status(400).json({ status: "error", message: "Missing or invalid role" });
    }

    // 🧩 Choose table based on role
    let query;
    if (role === "admin") {
      query = "SELECT * FROM users WHERE id = ?";
    } else if (role === "student" || role === "parent") {
      query = "SELECT * FROM nonstafftable WHERE id = ?";
    } else {
      return res.status(400).json({ status: "error", message: "Unknown role" });
    }

    // 🔎 Execute query
    const [rows] = await db.execute(query, [id]);

    // ✅ If user found
    if (rows.length > 0) {
      return res.status(200).json({
        status: "success",
        user: rows[0],
      });
    } else {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }
  } catch (error) {
    console.error("Get user by ID error:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
}
