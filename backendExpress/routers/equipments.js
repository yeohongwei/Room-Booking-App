import express from "express";
import {
  addEquipment,
  deleteEquipmentById,
  getAllEquipments,
  getEquipmentById,
  updateEquipmentById,
} from "../controllers/equipments.js";

const router = express.Router();

router.get("/", getAllEquipments);
router.post("/:id", getEquipmentById);
router.delete("/:id", deleteEquipmentById);
router.put("/", addEquipment);
router.patch("/:id", updateEquipmentById);

export default router;
