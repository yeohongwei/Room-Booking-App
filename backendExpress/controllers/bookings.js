import pool from "../db/db.js";

export const getAllBookings = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM bookings");
    res.json(rows);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const addBooking = async (req, res) => {
  try {
    const { user_id, room_id, start_time, end_time } = req.body;

    //   VALIDATION FOR status done in DB SO NOT NEEDED
    // const validStatus = ['active', 'cancelled']
    // if (!validStatus.includes(status)) {
    //     res.status(400).json({
    //     status: "error",
    //     msg: "Invalid status. Only active or cancelled are allowed.",
    //   });
    // }

    await pool.query(
      `INSERT INTO bookings 
        (user_id, room_id, start_time, end_time) 
            VALUES ($1, $2, $3, $4)`,
      [user_id, room_id, start_time, end_time],
    );
    res.json({ status: "ok", msg: "booking added" });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM bookings WHERE id=$1", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      res.status(400).json({ status: "error", msg: "booking not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const deleteBookingById = async (req, res) => {
  try {
    const results = await pool.query("DELETE FROM bookings WHERE id = $1", [
      req.params.id,
    ]);
    if (results.rowCount === 0) {
      res.status(400).json({ status: "error", msg: "booking not found" });
    }
    res.json({ status: "ok", msg: "booking deleted" });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const updateBookingById = async (req, res) => {
  const { id } = req.params;
  const { user_id, room_id, start_time, end_time } = req.body;

  try {
    const { rows } = await pool.query("SELECT * FROM bookings WHERE id = $1", [
      id,
    ]);
    if (rows.length === 0) {
      res.status(404).json({ status: "error", msg: "booking not found" });
    }
    const current = rows[0];

    const sql = `
    UPDATE bookings SET
        user_id = COALESCE($1::uuid, $2::uuid),
        room_id = COALESCE($3::uuid, $4::uuid),
        start_time = COALESCE($5::timestamptz, $6::timestamptz),
        end_time = COALESCE($7::timestamptz, $8::timestamptz)
    WHERE id = $9
    `;

    const values = [
      user_id ?? null, //$1 new value or null
      current.user_id,
      room_id ?? null,
      current.room_id,
      start_time ?? null,
      current.start_time,
      end_time ?? null,
      current.end_time,
      id,
    ];
    await pool.query(sql, values);
    res.json({ status: "ok", msg: "booking updated" });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const getBookingsByRoomId = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM bookings WHERE room_id=$1",
      [req.params.roomId],
    );
    res.json(rows);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const getUserBookingsWithRoomsAndEquipmentsByUserId = async (
  req,
  res,
) => {
  const { userId } = req.params;

  try {
    const sql = `
      SELECT
        b.id            AS booking_id,
        b.start_time,
        b.end_time,

        r.id            AS room_id,
        r.name          AS room_name,
        r.capacity,
        r.location,

        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'code', e.code,
              'name', e.display_name,
              'quantity', re.quantity
            )
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) AS equipments
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      LEFT JOIN room_equipments re ON re.room_id = r.id
      LEFT JOIN equipments e ON e.id = re.equipment_id
      WHERE b.user_id = $1
      GROUP BY b.id, r.id
      ORDER BY b.start_time DESC;
    `;

    const { rows } = await pool.query(sql, [userId]);

    res.json(rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "error", msg: error.message });
  }
};

export const getRoomBookingsByRoomId = async (req, res) => {
  const { roomId } = req.params;

  try {
    const query = `
      SELECT
        b.id          AS booking_id,
        b.start_time,
        b.end_time,
        b.created_at,

        u.id          AS user_id,
        u.name        AS user_name,
        u.email       AS user_email
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      WHERE b.room_id = $1
      ORDER BY b.start_time;
    `;

    const { rows } = await pool.query(query, [roomId]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
