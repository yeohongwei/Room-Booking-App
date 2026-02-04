import { body } from "express-validator";

export const validatedRegistrationData = [
  body("name").trim().notEmpty().withMessage("name is required"),
  body("email").isEmail().withMessage("valid email is required"),
  body("password", "password has 6 to 50 characters").isLength({
    min: 6,
    max: 50,
  }),
];

export const validateLoginData = [
  body("email", "email is required").trim().notEmpty(),
  body("password", "password is required").trim().notEmpty(),
];
