// /api/login.js
import { getConnection } from "./db.js";
import bcrypt from "bcryptjs";
import express from "express";
import cors from "cors";


const router = express.Router();
router.use(cors());

// POST /api/login
router.post("/", async (req, res) => {
  try {
    
    const db = await getConnection();
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username and password are required.",
      });
    }

    // --- STEP 1: Create tables if they don't exist ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        firstName VARCHAR(50) NOT NULL,
        lastName VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        class VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        address VARCHAR(255) NOT NULL,
        dob VARCHAR(255) NOT NULL,
        role ENUM('admin') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS nonstafftable (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        firstName VARCHAR(50) NOT NULL,
        lastName VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        class VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        address VARCHAR(255) NOT NULL,
        dob VARCHAR(255) NOT NULL,
        role ENUM('student', 'parent') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // --- STEP 2: Insert default records if empty ---
    const [[{ c: userscount }]] = await db.query("SELECT COUNT(*) AS c FROM users");
    const [[{ c: nonstaffcount }]] = await db.query("SELECT COUNT(*) AS c FROM nonstafftable");

    if (userscount === 0) {
      const adminPass = await bcrypt.hash("admin123", 10);
      await db.query(
        `
        INSERT INTO users (username, firstName, lastName, password, class, email, address, dob, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          "admin1",
          "joseph",
          "baiyekusi",
          adminPass,
          "",
          "josephbaiyekusi@gmail.com",
          "No 22 Akande Street, Kaduna Road",
          "01/10/2002",
          "admin",
        ]
      );
    }

    if (nonstaffcount === 0) {
      const studentPass = await bcrypt.hash("student123", 10);
      const parentPass = await bcrypt.hash("parent123", 10);
      await db.query(
        `
        INSERT INTO nonstafftable (username, firstName, lastName, password, class, email, address, dob, role)
        VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          "student1",
          "benjamin",
          "baiyekusi",
          studentPass,
          "ss2",
          "benjaminbaiyekusi@gmail.com",
          "No 22 Akande Street, Kaduna Road",
          "20/10/2004",
          "student",
          "parent1",
          "Agnes",
          "baiyekusi",
          parentPass,
          "",
          "agnesbaiyekusi@gmail.com",
          "No 22 Akande Street, Kaduna Road",
          "12/03/1970",
          "parent",
        ]
      );
    }

    // --- STEP 3: Handle login ---
    let user = null;
    let table = null;

    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (users.length === 1) {
      user = users[0];
      table = "users";
    } else {
      const [nonstaff] = await db.query(
        "SELECT * FROM nonstafftable WHERE username = ?",
        [username]
      );
      if (nonstaff.length === 1) {
        user = nonstaff[0];
        table = "nonstafftable";
      }
    }

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res
        .status(401)
        .json({ status: "error", message: "Incorrect password." });
    }

    // --- STEP 4: Success Response ---
    res.status(200).json({
      status: "success",
      message: "Login successful.",
      role: user.role,
      username: user.username,
      table,
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Server error", error: error.message });
  }
});

export default router;
