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

const router = express.Router();

router.get("/", getAllRooms);
router.post("/:id", getRoomById);
router.delete("/:id", deleteRoomById);
router.put("/", addRoom);
router.patch("/:id", updateRoomById);

router.post("/:roomId/equipments/", addEquipmentToRoom);
router.delete("/:roomId/equipments/:equipmentId", removeEquipmentFromRoom);

export default router;
