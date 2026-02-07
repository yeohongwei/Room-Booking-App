import express from "express";
import {
  addEquipmentToRoom,
  addRoom,
  deleteRoomById,
  getAllRooms,
  getRoomById,
  removeEquipmentFromRoom,
  updateRoomById,
} from "../controllers/rooms.js";
import { auth, authAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getAllRooms);
router.get("/:id", auth, getRoomById);
router.delete("/:id", authAdmin, deleteRoomById);
router.put("/", authAdmin, addRoom);
router.patch("/:id", authAdmin, updateRoomById);

router.put("/:roomId/equipments", authAdmin, addEquipmentToRoom);
router.delete(
  "/:roomId/equipments/:equipmentId",
  authAdmin,
  removeEquipmentFromRoom,
);

export default router;
