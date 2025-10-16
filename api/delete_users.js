import express from "express";
import { getConnection } from "./db.js";

const router = express.Router();

// ✅ DELETE /api/deleteUser
router.delete("/:role/:id", async (req, res) => {
  try {
    const { role, id } = req.params;

    if (!id || !role) {
      return res.status(400).json({ status: "error", message: "Missing id or role" });
    }

    const db = await getConnection();

    let table;
    if (role === "admin") table = "users";
    else if (role === "student" || role === "parent") table = "nonstafftable";
    else return res.status(400).json({ status: "error", message: "Unknown role" });

    const [result] = await db.query(`DELETE FROM ${table} WHERE id = ?`, [id]);

    if (result.affectedRows > 0) {
      return res.status(200).json({ status: "success", message: "User deleted successfully" });
    }

    return res.status(404).json({ status: "error", message: "User not found" });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
});



export default router;
