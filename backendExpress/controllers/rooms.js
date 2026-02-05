import pool from "../db/db.js";

export const getAllRooms = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM rooms");
    res.json(rows);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const addRoom = async (req, res) => {
  try {
    const { name, capacity, location, is_active } = req.body;
    await pool.query(
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
    const { rows } = await pool.query("SELECT * FROM rooms WHERE id=$1", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      res.status(400).json({ status: "error", msg: "room not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const deleteRoomById = async (req, res) => {
  try {
    const results = await pool.query("DELETE FROM rooms WHERE id = $1", [
      req.params.id,
    ]);
    if (results.rowCount === 0) {
      res.status(400).json({ status: "error", msg: "room not found" });
    }
    res.json({ status: "ok", msg: "room deleted" });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const updateRoomById2 = async (req, res) => {
  try {
    const updates = req.body;
    // 1. Get the keys from the body (name, description, etc.)
    const keys = Object.keys(updates);

    // 2. Safety Check: If body is empty, don't do anything
    if (keys.length === 0) {
      return res
        .status(400)
        .json({ status: "error", msg: "No update fields provided" });
    }

    /* 3. Build the SET part of the query dynamically
       We map the keys into "column_name = $index" format
    */
    const setClause = keys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    // 4. Prepare the values array (the data to be inserted)
    const values = Object.values(updates);

    // 5. Add the ID as the very last parameter for the WHERE clause
    values.push(req.params.id);
    const idPosition = values.length;

    // 6. Combine it all into one query
    const sql = `UPDATE rooms SET ${setClause} WHERE id = $${idPosition}`;
    const results = await pool.query(sql, values);

    if (results.rowCount === 0) {
      res.status(400).json({ status: "error", msg: "room not found" });
    }
    res.json({ status: "ok", msg: "room updated" });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const updateRoomById = async (req, res) => {
  const { id } = req.params;
  const { name, capacity, location, is_active } = req.body;

  try {
    const { rows } = await pool.query("SELECT * FROM rooms WHERE id = $1", [
      id,
    ]);
    if (rows.length === 0) {
      res.status(404).json({ status: "error", msg: "room not found" });
    }
    const current = rows[0];

    const sql = `
    UPDATE rooms SET
        name = COALESCE($1, $2),
        capacity = COALESCE($3::smallint, $4::smallint),
        location = COALESCE($5, $6),
        is_active = COALESCE($7::boolean, $8::boolean)
    WHERE id = $9
    `;

    const values = [
      name ?? null, //$1 new value or null
      current.name,
      capacity ?? null,
      current.capacity,
      location ?? null,
      current.location,
      is_active ?? null,
      current.is_active,
      id,
    ];
    await pool.query(sql, values);
    res.json({ status: "ok", msg: "room updated" });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const addEquipmentToRoom = async (req, res) => {
  const { roomId } = req.params;
  const { equipmentId, quantity = 1 } = req.body;

  try {
    await pool.query(
      `
      INSERT INTO room_equipments (room_id, equipment_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (room_id, equipment_id)
      DO UPDATE SET quantity = EXCLUDED.quantity;
      `,
      [roomId, equipmentId, quantity],
    );

    res.json({ status: "ok", msg: "Equipment assigned to room" });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const removeEquipmentFromRoom = async (req, res) => {
  const { roomId, equipmentId } = req.params;

  try {
    const { rowCount } = await pool.query(
      `
      DELETE FROM room_equipments
      WHERE room_id = $1
        AND equipment_id = $2;
      `,
      [roomId, equipmentId],
    );

    if (rowCount === 0) {
      res
        .status(404)
        .json({ status: "error", msg: "room or equipment not found" });
    }

    res.json({ status: "ok", msg: "Equipment removed from room" });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};
