import express from "express";
import { getConnection } from "./db.js";

const router = express.Router();

router.put("/:role/:status/:id", async (req, res) => {

    const { role, status, id } = req.params;
    const { newStatus = status } = req.body;

if (!id || !role) {
      return res.status(400).json({ status: "error", message: "Missing id or role" });
    }
    const db = await getConnection();
    
let table;
    // const userRole = role.toLowerCase();
    if (role === "admin") table = "users";
    else if (role === "student" || role === "parent") table = "nonstafftable";
    else return res.status(400).json({ status: "error", message: "Unknown role" });

   

    const params = [
        newStatus,
        id
    ]

    const sql = `
      UPDATE ${table}
      SET status=?
      WHERE id=?`;

    const [result] = await db.query(sql, params);

    if (result.affectedRows > 0) {
      return res.status(200).json({
        status: "success",
        message: "User status changed successfully.",
      });
    } else {
      return res.status(400).json({
        status: "error",
        message: "No changes made.",
      });
    }

});

export default router;

