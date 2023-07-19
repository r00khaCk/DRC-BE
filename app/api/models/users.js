import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import database from "../../services/db.js";
import Redis from "ioredis";
import { CustomError } from "../middleware/error/custom-error.js";
import { getEmail } from "../../utils/commonFunctions.js";
import { getWalletBalance } from "../../utils/commonQueries.js";

const env = process.env;
const redisClient = new Redis({
  host: "redis",
  port: 6379,
  password: env.REDIS_PASSWORD,
});

// Register new account
export const registerNewUserModel = async (registerDetails) => {
  const { name, email, password } = registerDetails;
  // storedEmail will fetch records where the email equals to the registerDetails email
  let storedEmail = await database.connection.query(
    "SELECT * FROM crypthubschema.users WHERE email=$1",
    [email]
  );
  // storedEmail.rows.length returns the length of the rows
  // if storedEmail.rows.length is > 0 means that there is a duplicate email in the db
  if (storedEmail.rows.length) {
    throw new CustomError("DUPLICATE_EMAIL");
  } else {
    bcrypt.hash(password, 10, async (err, hash) => {
      if (err) {
        // return "PASSWORD_HASHING_ERROR";
        console.log(err);
        throw new CustomError("PASSWORD_HASHING_ERROR");
      } else {
        let hashPassword = hash;
        // Check if email, name, and password are true
        if (name && email && hashPassword) {
          let values = [name, email, hashPassword, 0];
          try {
            await database.connection.query(
              "INSERT INTO crypthubschema.users (name,email,password,account_verified) VALUES($1,$2,$3,$4) RETURNING *",
              values
            );
            addUserWallets(email);
          } catch (error) {
            console.log(error);
            throw new CustomError("REGISTER_QUERY_FAILED");
          }
        } else {
          throw new CustomError("BAD_REQUEST");
        }
      }
    });
  }
};

export const sendVerificationEmailModel = async (userDetails, callback) => {
  try {
    const { email } = userDetails;
    const senderClient = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.GOOGLE_EMAIL,
        pass: env.GOOGLE_PASSWORD,
      },
    });

    const verificationToken = jwt.sign(
      {
        data: email,
      },
      env.SECRET_KEY,
      { expiresIn: "5m" }
    );

    const verificationEmailTemplate = {
      from: env.GOOGLE_EMAIL,

      to: email,

      subject: "Email Verification",

      text: `Dear valued customer,\nThank you for choosing CryptHub! We kindly request you to verify your account by clicking on the following link:\n${env.HOST_URL}/user/verify/${verificationToken}?email=${email}\nIf you have any questions or need assistance, please don't hesitate to contact our support team.\nBest regards,\n
      The CryptHub Team`,
    };

    senderClient.sendMail(verificationEmailTemplate, (error, info) => {
      if (error) {
        console.log(error);
        throw new CustomError("VERIFICATION_EMAIL_ERROR");
      }
      console.log("VERIFICATION_EMAIL_SENT");
      return "VERIFICATION_EMAIL_SENT";
    });
  } catch (error) {
    console.log(error);
    throw new CustomError("INTERNAL_ERROR");
  }
};

// verifies if the token sent to the user matches the token generated in the server
export const verifyToken = async (reqParams) => {
  const { token } = reqParams;
  let isTokenBlacklisted = await redisClient.zscore("blacklisted", token);
  return new Promise((resolve, reject) => {
    if (isTokenBlacklisted == null) {
      jwt.verify(token, env.SECRET_KEY, (err, decoded) => {
        if (err) {
          resolve("INVALID_TOKEN");
        } else {
          redisClient.zadd("blacklisted", Date.now(), token);
          resolve("VALID_TOKEN");
        }
      });
    } else {
      resolve("INVALID_TOKEN");
    }
  });
};

//-----Functions used within the file-----
// changes the account status when the token has been validated
export const changeAccountStatus = async (userEmailFromToken) => {
  const { email } = userEmailFromToken;
  let values = [email, 1];
  let response;
  try {
    response = await database.connection.query(
      "UPDATE crypthubschema.users SET account_verified=$2 WHERE email=$1 RETURNING *",
      values
    );
  } catch (error) {
    console.log(error);
    throw new CustomError("VERIFICATION_ERROR");
  }
};

const addUserWallets = async (userEmail) => {
  let values = [userEmail];
  let insert_empty_wallet_query =
    "INSERT INTO cryptHubSchema.wallet (currency, amount, user_id) " +
    "SELECT 'USD', 0, u.id " +
    "FROM cryptHubSchema.users AS u " +
    "WHERE u.email = $1 " +
    "UNION ALL " +
    "SELECT 'BTC', 0, u.id " +
    "FROM cryptHubSchema.users AS u " +
    "WHERE u.email = $1 " +
    "UNION ALL " +
    "SELECT 'ETH', 0, u.id " +
    "FROM cryptHubSchema.users AS u " +
    "WHERE u.email = $1; ";
  await database.connection.query(insert_empty_wallet_query, values);
};

export const checkIfAccountHasBeenVerifiedAfterVerificationEmailExpired = (
  user_email
) => {
  const { email } = user_email;
  let value = [email];
  let check_account_verified =
    "SELECT account_verified FROM crypthubschema.users WHERE email=$1";
  let check_account_verified_query = database.connection.query(
    check_account_verified,
    value
  );
  return check_account_verified_query;
};

export async function loginUser(login_details) {
  try {
    const { email, password } = login_details;
    let query_result;
    if (email && password) {
      query_result = await getWalletBalance(email);
      if (query_result.rows.length) {
        if (query_result.rows[0].account_verified == true) {
          let get_token = await checkPassword(
            password,
            query_result.rows[0].password,
            query_result.rows[0].email,
            query_result.rows[0].id
          );
          return {
            message: "LOGIN_SUCCESSFUL",
            details: {
              token: get_token,
              id: query_result.rows[0].id,
              name: query_result.rows[0].name,
              email: query_result.rows[0].email,
              USD: query_result.rows[0].amount,
              BTC: query_result.rows[1].amount,
              ETH: query_result.rows[2].amount,
            },
          };
        } else {
          throw new CustomError("ACCOUNT_NOT_VERIFIED");
        }
      } else {
        throw new CustomError("EMAIL_NOT_EXIST");
      }
    } else {
      throw new CustomError("BAD_REQUEST");
    }
  } catch (error) {
    console.log(error);
    throw error;
  }

  async function checkPassword(
    received_password,
    actual_password,
    user_email,
    user_id
  ) {
    const matching = await bcrypt.compare(received_password, actual_password);

    if (matching) {
      let query_result = await database.connection.query(
        "UPDATE crypthubschema.users SET last_login = to_timestamp($1) RETURNING *",
        [Date.now() / 1000]
      );
      if (query_result.rows.length == 0)
        throw new CustomError("FAILED_TO_SET_TIMESTAMP");
      let token = jwt.sign({ email: user_email, id: user_id }, env.SECRET_KEY, {
        expiresIn: "24h",
      });
      return token;
    } else {
      throw new CustomError("INVALID_PASSWORD");
    }
  }
}

// Send confirmation email
export async function forgotPassword(req_body) {
  try {
    const { email } = req_body;
    if (email) {
      const query_email = await database.connection.query(
        "SELECT * FROM crypthubschema.users WHERE email = $1",
        [email]
      );
      if (query_email.rows.length == 0)
        throw new CustomError("EMAIL_NOT_EXIST");
      if (query_email.rows[0].account_verified == false)
        throw new CustomError("ACCOUNT_NOT_VERIFIED");
      const send_confirmation_email = await sendConfirmationEmail(email);
      return send_confirmation_email;
    } else {
      throw new CustomError("BAD_REQUEST");
    }
  } catch (error) {
    console.log(error);
    throw error;
  }

  function sendConfirmationEmail(user_email) {
    return new Promise((resolve, reject) => {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: env.GOOGLE_EMAIL,
          pass: env.GOOGLE_PASSWORD,
        },
      });
      const verificationToken = jwt.sign(
        {
          data: user_email,
        },
        env.SECRET_KEY,
        { expiresIn: "5m" }
      );

      const mailOptions = {
        from: "crypthubofficial@gmail.com",
        to: user_email,
        subject: "Password Recovery",
        text: `Hi there dear customer,\nPlease click on this link to recover your password\n${env.HOST_URL}/user/passwordRecovery/${verificationToken}?email=${user_email}\nDid not request for password recovery? You may ignore this email.`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          throw new CustomError("FAILED_TO_SEND_EMAIL");
        } else {
          console.log("Email sent: " + info.response);
          resolve("EMAIL_SENT");
        }
      });
    });
  }
}

// Send new password
export async function passwordRecovery(req_body) {
  try {
    const { email } = req_body;
    let query_result;
    if (email) {
      query_result = await database.connection.query(
        "SELECT * FROM crypthubschema.users WHERE email = $1",
        [email]
      );
      if (query_result.rows.length == 0)
        throw new CustomError("EMAIL_NOT_EXIST");
      const new_password = generateRandomChars();
      setNewPassword(query_result.rows[0].email, new_password);
      sendEmail(query_result.rows[0].email, new_password);
      return "SEND_NEW_PASSWORD_TO_USER";
    } else {
      throw new CustomError("BAD_REQUEST");
    }
  } catch (error) {
    console.log(error);
    throw error;
  }

  function generateRandomChars() {
    let result = "";
    const upper_case = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower_case = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "1234567890";
    const symbols = "!@#$%^&*()-_=+{}:;,<.>[]";

    let counter = 0;
    while (counter < 2) {
      result += upper_case.charAt(
        Math.floor(Math.random() * upper_case.length)
      );
      result += lower_case.charAt(
        Math.floor(Math.random() * lower_case.length)
      );
      result += symbols.charAt(Math.floor(Math.random() * symbols.length));
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
      counter++;
    }
    return result;
  }

  function setNewPassword(user_email, new_password) {
    bcrypt.hash(new_password, 10, async (err, hash) => {
      if (err) {
        throw new CustomError("PASSWORD_HASHING_ERROR");
      } else {
        let hashPassword = hash;
        const set_new_password_query = await database.connection.query(
          "UPDATE crypthubschema.users SET password = $1 WHERE email = $2 RETURNING *",
          [hashPassword, user_email]
        );
        if (set_new_password_query == 0) {
          throw new CustomError("FAILED_TO_SET_NEW_PASSWORD");
        }
      }
    });
  }

  function sendEmail(user_email, user_new_password) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.GOOGLE_EMAIL,
        pass: env.GOOGLE_PASSWORD,
      },
    });

    const mailOptions = {
      from: "crypthubofficial@gmail.com",
      to: user_email,
      subject: "Password Recovery",
      text: `This is your new password ${user_new_password}\nMake sure to CHANGE your password after logging in!`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        throw new CustomError("FAILED_TO_SEND_EMAIL");
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }
}

export async function resetPassword(header_details, body_details) {
  try {
    const email = await getEmail(header_details);
    const { old_password, new_password } = body_details;
    if (!email || !old_password || !new_password) {
      throw new CustomError("BAD_REQUEST");
    }
    if (old_password == new_password)
      throw new CustomError("PASSWORD_NEW_SAME_AS_OLD");
    const query_result = await database.connection.query(
      "SELECT password FROM crypthubschema.users WHERE email = $1",
      [email]
    );
    if (query_result.rows.length == 0) {
      throw new CustomError("EMAIL_NOT_EXIST");
    }
    const actual_password = query_result.rows[0].password;
    const matching = await bcrypt.compare(old_password, actual_password);
    if (matching) {
      try {
        let hash_result = await bcrypt.hash(new_password, 10);
        let query_result2 = await database.connection.query(
          "UPDATE crypthubschema.users SET password = $1 WHERE email = $2 RETURNING *",
          [hash_result, email]
        );
        if (query_result2.rows.length == 0)
          throw new CustomError("RESET_PASSWORD_FAILURE");
        return "RESET_PASSWORD_SUCCESS";
      } catch (error) {
        throw new CustomError("PASSWORD_HASHING_ERROR");
      }
    } else {
      throw new CustomError("INVALID_PASSWORD");
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function logoutUser(user_token) {
  try {
    const token = user_token;
    if (token) {
      blacklist(token);
      return "LOGOUT_SUCCESS";
    } else {
      throw new CustomError("BAD_REQUEST");
    }
  } catch (error) {
    console.log(error);
    throw error;
  }

  function blacklist(logout_token) {
    redisClient.zadd("blacklisted", Date.now(), logout_token);
  }
}

// This endpoint is just to see if a token is blacklisted or not -Haziq
export async function checkBlacklist(user_token) {
  const { token } = user_token;

  if (token) {
    try {
      const isBlacklisted = await redisCheckBlacklist(token);
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
