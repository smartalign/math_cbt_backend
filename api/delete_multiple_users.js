import { getConnection } from "./db.js";

// ✅ This function runs in a serverless environment (Vercel function)
export default async function handler(req, res) {

res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");


  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Only POST allowed" });
  }

  try {
    // ✅ Get connection from db.js
    const db = await getConnection();

    const { ids } = req.body;

    // ✅ Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "error", message: "No IDs provided" });
    }

    // ✅ Clean up IDs (convert to integers)
    const idList = ids.map((id) => parseInt(id)).filter((id) => !isNaN(id));

    if (idList.length === 0) {
      return res.status(400).json({ status: "error", message: "Invalid IDs" });
    }

    // ✅ Create placeholders for the query
    const placeholders = idList.map(() => "?").join(",");

    // ✅ Delete from both tables
    const [result1] = await db.query(
      `DELETE FROM users WHERE id IN (${placeholders})`,
      idList
    );

    const [result2] = await db.query(
      `DELETE FROM nonstafftable WHERE id IN (${placeholders})`,
      idList
    );

    // ✅ Close DB connection
    await db.end();

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
  } catch (err) {
    console.error("Error deleting users:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}
