import express from "express";
import { createRoom, getAllRooms } from "../controllers/rooms.js";

const router = express.Router();

router.get("/", getAllRooms);
router.put("/", createRoom);

export default router;
