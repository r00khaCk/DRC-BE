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
    console.log("BEGIN AUTHENTICATION");

    const token = req.headers.authorization.split(" ")[1];
    let isTokenBlacklisted = await checkBlacklist(token);
    if (isTokenBlacklisted == "TOKEN_IS_VALID") {
      console.log("BEGIN JWT VERIFY");
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

async function checkBlacklist(user_token) {
  const token = user_token;

  if (token) {
    try {
      console.log("TRYING TO CHECK BLACKLIST");
      const isBlacklisted = await redisCheckBlacklist(token);
      console.log(isBlacklisted, "AFTER CHECK BLACKLIST");
      if (isBlacklisted == null) {
        return "TOKEN_IS_VALID";
      } else {
        return "TOKEN_IS_BLACKLISTED";
      }
    } catch (error) {
      console.log(error);
      return "FAILED_TO_VALIDATE_TOKEN";
    }
  } else {
    return "BAD_REQUEST";
  }

  function redisCheckBlacklist(token) {
    return redisClient.zscore("blacklisted", token);
  }
}
