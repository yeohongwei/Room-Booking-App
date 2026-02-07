import express from "express";
import {
  addEquipment,
  deleteEquipmentById,
  getAllEquipments,
  getEquipmentById,
  updateEquipmentById,
} from "../controllers/equipments.js";
import { auth, authAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getAllEquipments);
router.get("/:id", auth, getEquipmentById);
router.delete("/:id", authAdmin, deleteEquipmentById);
router.put("/", authAdmin, addEquipment);
router.patch("/:id", authAdmin, updateEquipmentById);

export default router;
