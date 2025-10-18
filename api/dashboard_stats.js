import express from "express";
import { getConnection } from "./db.js";

const router = express.Router();

// ✅ GET /api/dashboard-stats
router.post("/", async (req, res) => {
  try {
    const db = await getConnection();

    // Student counts (assuming 'nonstafftable' holds students & parents)
    const [studentTotal] = await db.query(
      "SELECT COUNT(*) AS total FROM nonstafftable WHERE role = 'student'"
    );
    const [studentActive] = await db.query(
      "SELECT COUNT(*) AS total FROM nonstafftable WHERE role = 'student' AND status = 'ACTIVE'"
    );
    const [studentInactive] = await db.query(
      "SELECT COUNT(*) AS total FROM nonstafftable WHERE role = 'student' AND status = 'INACTIVE'"
    );

    // Staff counts (from 'users' table)
    const [staffTotal] = await db.query(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'admin' OR role = 'staff'"
    );
    const [staffActive] = await db.query(
      "SELECT COUNT(*) AS total FROM users WHERE (role = 'admin' OR role = 'staff') AND status = 'ACTIVE'"
    );
    const [staffInactive] = await db.query(
      "SELECT COUNT(*) AS total FROM users WHERE (role = 'admin' OR role = 'staff') AND status = 'INACTIVE'"
    );

    const [genderStats] = await db.query(`
      SELECT
        SUM(gender = 'Male') AS male,
        SUM(gender = 'Female') AS female
      FROM nonstafftable
    `);

    res.json({
      status: "success",
      data: {
        students: {
          total: studentTotal[0].total,
          active: studentActive[0].total,
          inactive: studentInactive[0].total,
        },
        staff: {
          total: staffTotal[0].total,
          active: staffActive[0].total,
          inactive: staffInactive[0].total,
        },
        gender: genderStats[0], // 👈 add this

      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Unable to fetch dashboard statistics",
      error: error.message,
    });
  }
});

export default router;
