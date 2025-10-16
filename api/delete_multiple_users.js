import express from "express";
import { getConnection } from "./db.js";

const router = express.Router();

// ✅ POST /api/deleteMultipleUsers
router.post("/", async (req, res) => {
  try {
    const { ids } = req.body;

    // 🧩 Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "error", message: "No IDs provided" });
    }

    // 🧮 Clean IDs (convert to integers and remove invalid)
    const idList = ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));

    if (idList.length === 0) {
      return res.status(400).json({ status: "error", message: "Invalid IDs" });
    }

    // 🧠 Connect to database
    const db = await getConnection();

    // 🧾 Create placeholders for query (e.g., ?,?,?)
    const placeholders = idList.map(() => "?").join(",");

    // 🗑️ Delete from both tables
    const [result1] = await db.query(`DELETE FROM users WHERE id IN (${placeholders})`, idList);
    const [result2] = await db.query(`DELETE FROM nonstafftable WHERE id IN (${placeholders})`, idList);

    // ✅ Respond based on results
    if (result1.affectedRows > 0 || result2.affectedRows > 0) {
      return res.status(200).json({
        status: "success",
        message: "Records deleted successfully",
      });
    } else {
      return res.status(404).json({
        status: "error",
        message: "No matching records found",
      });
    }
  } catch (error) {
    console.error("Error deleting users:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;
