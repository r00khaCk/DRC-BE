import jwt from "jsonwebtoken";

const env = process.env;

export const checkAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    console.log("token from checkAuth: ", token);
    const decoded = jwt.verify(token, env.SECRET_KEY);
    console.log("decoded: ", decoded);
    req.email = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Authentication Failed",
    });
  }
};
