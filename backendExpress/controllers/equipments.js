import pool from "../db/db.js";

export const getAllEquipments = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM equipments");
    res.json(rows);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const addEquipment = async (req, res) => {
  try {
    const { code, display_name, description } = req.body;
    await pool.query(
      "INSERT INTO equipments ( code, display_name, description) VALUES ($1, $2, $3)",
      [code, display_name, description],
    );
    res.json({ status: "ok", msg: "equipment added" });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const getEquipmentById = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM equipments WHERE id=$1", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      res.status(400).json({ status: "error", msg: "equpments not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const deleteEquipmentById = async (req, res) => {
  try {
    const results = await pool.query("DELETE FROM equipments WHERE id = $1", [
      req.params.id,
    ]);
    if (results.rowCount === 0) {
      res.status(400).json({ status: "error", msg: "equipments not found" });
    }
    res.json({ status: "ok", msg: "equipment deleted" });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};

export const updateEquipmentById = async (req, res) => {
  const { id } = req.params;
  const { code, display_name, description } = req.body;

  try {
    const { rows } = await pool.query(
      "SELECT * FROM equipments WHERE id = $1",
      [id],
    );
    if (rows.length === 0) {
      res.status(404).json({ status: "error", msg: "equipment not found" });
    }
    const current = rows[0];

    const sql = `
    UPDATE equipments SET
        code = COALESCE($1, $2),
        display_name = COALESCE($3, $4),
        description = COALESCE($5, $6)
    WHERE id = $7
    `;

    const values = [
      code ?? null, //$1 new value or null
      current.code,
      display_name ?? null,
      current.display_name,
      description ?? null,
      current.description,
      id,
    ];
    await pool.query(sql, values);
    res.json({ status: "ok", msg: "equipment updated" });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ status: "error", msg: error.message });
  }
};
