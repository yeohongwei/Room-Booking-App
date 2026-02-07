import express from "express";
import {
  getAllUsers,
  login,
  refresh,
  register,
  setUserRole,
} from "../controllers/users.js";
import {
  validatedRegistrationData,
  validateLoginData,
} from "../validators/users.js";
import checkError from "../validators/checkErrors.js";
import { auth, authAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/users", authAdmin, getAllUsers);
router.put("/register", validatedRegistrationData, checkError, register);
router.post("/login", validateLoginData, checkError, login);
router.post("/refresh", refresh);

router.patch("/role/:userId", authAdmin, setUserRole);

export default router;
