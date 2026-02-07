import express from "express";
import {
  addBooking,
  deleteBookingById,
  getAllBookings,
  getBookingById,
  getRoomBookingsByRoomId,
  getUserBookingsWithRoomsAndEquipmentsByUserId,
  updateBookingById,
} from "../controllers/bookings.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getAllBookings);
router.put("/", auth, addBooking);
router.patch("/:id", auth, updateBookingById);
router.delete("/:id", auth, deleteBookingById);
router.get("/:id", auth, getBookingById);
router.get(
  "/user/:userId",
  auth,
  getUserBookingsWithRoomsAndEquipmentsByUserId,
);
router.get("/room/:roomId", auth, getRoomBookingsByRoomId);

export default router;
