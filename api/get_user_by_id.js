import express from "express";
import { getConnection } from "./db.js";

const router = express.Router();

    
    
    // ✅ GET /api/getUserById?id=1&role=admin
    router.get("/:role/:id", async (req, res) => {
      try {
        const db = await getConnection();
        
    // 📥 Extract query params
        const { role, id } = req.params;
    // const id = parseInt(req.query.id, 10);
    // const role = req.query.role || "";

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

    // ✅ Respond based on result
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
});

export default router;
