import { query } from "../db/db.js";

export const getAllRooms = async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM rooms");
    res.json(rows);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { name, capacity, location, is_active } = req.body;
    const { rows } = await query(
      "INSERT INTO rooms (name, capacity, location, is_active) VALUES ($1, $2, $3, $4)",
      [name, capacity, location, is_active],
    );
    res.json({ status: "ok", msg: "room added" });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM rooms WHERE id=$1", [
      req.params.id,
    ]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};
