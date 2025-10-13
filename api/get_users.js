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
    // 🧠 Connect to the database (via your pool)
    const db = await getConnection();

    // 🔹 Fetch all users from the `users` table
    const [users] = await db.execute("SELECT * FROM users");

    // 🔹 Fetch all users from the `nonstafftable` table
    const [nonStaff] = await db.execute("SELECT * FROM nonstafftable");

    // 🧮 Combine both sets of results
    const allUsers = [];

    // Add records from `users`
    users.forEach((row) => {
      if (row.username && row.username.trim() !== "") {
        allUsers.push({
          id: row.id,
          name: row.username,
          class: row.class,
          dob: row.dob,
          address: row.address,
          role: row.role,
        });
      }
    });

    // Add records from `nonstafftable`
    nonStaff.forEach((row) => {
      if (row.username && row.username.trim() !== "") {
        allUsers.push({
          id: row.id,
          name: row.username,
          class: row.class,
          dob: row.dob,
          address: row.address,
          role: row.role,
        });
      }
    });

    // ✅ Send back as JSON
    return res.status(200).json(allUsers);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch users",
      error: error.message,
    });
  }
}
