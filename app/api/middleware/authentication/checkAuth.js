import jwt from "jsonwebtoken";
import Redis from "ioredis";

const env = process.env;
const redisClient = new Redis({
  host: "redis",
  port: 6379,
});

export const checkAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    isTokenBlacklisted = await checkBlacklist(token);
    if (isTokenBlacklisted == "TOKEN_IS_VALID") {
      const decoded = jwt.verify(token, env.SECRET_KEY);
      req.userEmail = decoded;
      next();
    } else {
      return res.status(401).json({
        message: "Authentication Failed",
      });
    }
  } catch (error) {
    return res.status(401).json({
      message: "Authentication Failed",
    });
  }
};

async function checkBlacklist(userToken) {
  const { token } = userToken;
  let response;
  if (token) {
    try {
      const isBlacklisted = await checkBlacklist(token);
      if (isBlacklisted == 1) {
        response = "TOKEN_IS_BLACKLISTED";
      } else {
        response = "TOKEN_IS_VALID";
      }
    } catch (error) {
      console.log("Error when checking");
      console.log(error);
      response = "BLACKLIST_CHECK_ERROR";
      throw error;
    }
  } else {
    response = "REQUEST_ERROR";
  }

  function checkBlacklist(token) {
    return redisClient.sismember("blacklisted", token);
  }

  return response;
}
