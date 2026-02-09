import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { v4 as uuidv4 } from "uuid";
import pool from "../db/db.js";

export const getAllUsers = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users");
    res.json(rows);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const me = async (req, res) => {
  try {
    const id = req?.decoded?.id;
    if (!id) {
      return res.status(401).json({ status: "error", msg: "unauthorised" });
    }

    const { rows } = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", msg: "user not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "error", msg: "server error" });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const { rowCount } = await pool.query(
      "SELECT 1 FROM users where email = $1",
      [email],
    );
    if (rowCount > 0) {
      res.status(400).json({ status: "error", msg: "duplicate email" });
    }

    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      "INSERT INTO users (name, email, hash) VALUES ($1, $2, $3)",
      [name, email, hash],
    );
    res.json({ status: "ok", msg: "User registered" });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: "invalid registration" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await pool.query("SELECT * from users WHERE email = $1", [
      email,
    ]);
    if (data.rowCount === 0) {
      console.error("user not found");
      return res.status(401).json({ status: "error", msg: "not authorised" });
    }
    const auth = data.rows[0];

    const result = await bcrypt.compare(password, auth.hash);
    if (!result) {
      console.log("username or password error");
      return res.status(401).json({ status: "error", msg: "login failed" });
    }
    const claims = {
      id: auth.id,
      role: auth.role,
    };
    const access = jwt.sign(claims, process.env.ACCESS_SECRET, {
      expiresIn: "15m",
      jwtid: uuidv4(),
    });

    const refresh = jwt.sign(claims, process.env.REFRESH_SECRET, {
      expiresIn: "30d",
      jwtid: uuidv4(),
    });

    res.json({ access, refresh });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: "login failed" });
  }
};

export const refresh = async (req, res) => {
  try {
    const decoded = jwt.verify(req.body.refresh, process.env.REFRESH_SECRET);
    const claims = { id: decoded.id, role: decoded.role };

    const access = jwt.sign(claims, process.env.ACCESS_SECRET, {
      expiresIn: "15m",
      jwtid: uuidv4(),
    });
    res.json({ access });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: "refresh error" });
  }
};

export const setUserRole = async (req, res) => {
  try {
    const { userId: id } = req.params;

    const { role } = req.body;

    // 1. STICKY GATEKEEPER: Prevent any roles except these two
    const validRoles = ["USER", "ADMIN"];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        status: "error",
        msg: "Invalid role. Only USER or ADMIN are allowed.",
      });
    }

    // 2. DATABASE EXECUTION
    const result = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2",
      [role, id],
    );

    // 3. CHECK IF USER EXISTED
    if (result.rowCount === 0) {
      // Use return to stop execution if not found
      res.status(404).json({ status: "error", msg: "User not found" });
    }

    // 4. SUCCESS
    res.json({ status: "ok", msg: `User role updated to ${role}` });
  } catch (error) {
    console.error(error.message);
    // Use 500 for server/database errors; 400 is usually for bad user input
    res
      .status(500)
      .json({ status: "error", msg: "Server error during role update" });
  }
};
