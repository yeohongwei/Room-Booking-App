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

const router = express.Router();

router.get("/users", getAllUsers);
router.put("/register", validatedRegistrationData, checkError, register);
router.post("/login", validateLoginData, checkError, login);
router.post("/refresh", refresh);

router.patch("/role/:userId", setUserRole);

export default router;
