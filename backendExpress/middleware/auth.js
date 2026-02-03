import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  if (!("authorization" in req.headers)) {
    return res.status(400).json({ status: "error", msg: "no token found" });
  }

  const token = req.headers["authorization"].replace("Bearer ", "");
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
      req.decoded = decoded;
      next();
    } catch (error) {
      console.error(error.message);
      return res.status(401).json({ status: "error", msg: "unauthorised" });
    }
  } else {
    console.error("missing token");
    return res.status(403).json({ status: "error", msg: "missing token" });
  }
};

export const authAdmin = (req, res, next) => {
  if (!("authorization" in req.headers)) {
    return res.status(400).json({ status: "error", msg: "no token found" });
  }

  const token = req.headers["authorization"].replace("Bearer ", "");
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_SECRET);

      if (decoded.role.toUpperCase() === "ADMIN") {
        req.decoded = decoded;
        next();
      } else {
        console.error("unauthorised");
        return res.status(403).json({ status: "error", msg: "unauthoried" });
      }
    } catch (error) {
      console.error(error.message);
      return res.status(401).json({ status: "error", msg: "unauthorised" });
    }
  } else {
    console.error("missing token");
    return res.status(403).json({ status: "error", msg: "missing token" });
  }
};
