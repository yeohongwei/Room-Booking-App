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

const router = express.Router();

router.get("/", getAllBookings);
router.put("/", addBooking);
router.patch("/:id", updateBookingById);
router.delete("/:id", deleteBookingById);
router.get("/:id", getBookingById);
router.get("/user/:userId", getUserBookingsWithRoomsAndEquipmentsByUserId);
router.get("/room/:roomId", getRoomBookingsByRoomId);

export default router;
