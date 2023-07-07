import jwt from "jsonwebtoken";
import Redis from "ioredis";

const env = process.env;
const redisClient = new Redis({
  host: "redis",
  port: 6379,
  password: env.REDIS_PASSWORD,
});

export const checkAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    console.log(token);
    let isTokenBlacklisted = await checkBlacklist(token);
    if (isTokenBlacklisted == "TOKEN_IS_VALID") {
      jwt.verify(token, env.SECRET_KEY);
      next();
    } else {
      return res.status(401).json({
        message: "AUTHENTICATION_FAILED",
      });
    }
  } catch (error) {
    return res.status(401).json({
      message: "AUTHENTICATION_FAILED",
    });
  }
};

async function checkBlacklist(userToken) {
  let response;
  console.log(userToken);
  if (userToken) {
    try {
      const isBlacklisted = await redisCheckBlacklist(userToken);
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
    } finally {
      return response;
    }
  } else {
    return (response = "REQUEST_ERROR");
  }

  function redisCheckBlacklist(userToken) {
    return redisClient.sismember("blacklisted", userToken);
  }
}
