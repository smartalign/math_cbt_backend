import mysql from "mysql2/promise";

export default async function handler(req, res) {
  
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  // Only allow POST requests (like in your PHP code)
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  try {
    // Parse JSON input from request body
    const { id } = req.body;

    // Validate input
    if (!id) {
      return res.status(400).json({ status: "error", message: "No ID provided" });
    }

    // Connect to Railway MySQL database
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQL_PORT || 3306,
    });

    // Use prepared statements for safety
    const [result1] = await connection.execute("DELETE FROM users WHERE id = ?", [id]);
    const [result2] = await connection.execute("DELETE FROM nonstafftable WHERE id = ?", [id]);

    await connection.end();

    // Check if at least one delete worked
    if (result1.affectedRows > 0 || result2.affectedRows > 0) {
      return res.status(200).json({ status: "success", message: "Record deleted successfully" });
    } else {
      return res.status(404).json({ status: "error", message: "Record not found" });
    }

  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ status: "error", message: "Server error", error: error.message });
  }
}
