import { validationResult } from "express-validator";

const checkError = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ status: "error", msg: errors.array() });
  } else {
    next();
  }
};

export default checkError;
