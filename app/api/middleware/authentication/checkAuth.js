import jwt from "jsonwebtoken";

const env = process.env;

export const checkAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, env.SECRET_KEY);
    req.userEmail = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Authentication Failed",
    });
  }
};
