import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import database from "../../services/db.js";
import Redis from "ioredis";

const env = process.env;
const redisClient = new Redis({
  host: "redis",
  port: 6379,
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
  if (storedEmail.rows.length) {
    // if storedEmail.rows.length is > 0 means that there is a duplicate email in the db
    console.log(`${email} exists in the database`);
    return "DUPLICATE_EMAIL";
  } else {
    bcrypt.hash(password, 10, async (err, hash) => {
      if (err) {
        return "PASSWORD_HASHING_ERROR";
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
            console.log("Error in query");
            console.log(error);
            throw error;
          }
        } else {
          throw new Error("Bad Request");
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

      text: `Hi there dear customer,\nPlease click on this link to verify your account\nhttp://localhost:5000/user/verify/${verificationToken}?email=${email}`,
    };

    senderClient.sendMail(verificationEmailTemplate, (error, info) => {
      if (error) {
        console.log(Error(error));
        return "VERIFICATION_EMAIL_ERROR";
      }
      console.log("VERIFICATION_EMAIL_SENT");
      console.log(info);
      return "VERIFICATION_EMAIL_SENT";
    });
  } catch (error) {
    throw Error(error);
  }
};

// verifies if the token sent to the user matches the token generated in the server
export const verifyAccountModel = (reqParams) => {
  console.log("reqParams", reqParams);
  return new Promise((resolve, reject) => {
    const { token } = reqParams;

    jwt.verify(token, env.SECRET_KEY, (err, decoded) => {
      if (err) {
        resolve("INVALID_TOKEN");
      } else {
        const tokenValue = decoded.data;
        console.log(tokenValue);
        changeAccountStatus(tokenValue);
        resolve("VALID_TOKEN");
      }
    });
  });
};

//-----Functions used within the file-----
// changes the account status when the token has been validated
const changeAccountStatus = async (userEmailFromToken) => {
  const userEmail = userEmailFromToken;
  let values = [userEmail, 1];
  let response;
  try {
    response = await database.connection.query(
      "UPDATE crypthubschema.users SET account_verified=$2 WHERE email=$1",
      values
    );
  } catch (error) {
    console.log("Error in query");
    console.log(error);
    throw error;
  }
};

const addUserWallets = async (userEmail) => {
  console.log(userEmail);
  let values = [userEmail];
  let insert_empty_wallet_query =
    "INSERT INTO cryptHubSchema.wallet (currency, amount, user_id) SELECT 'USD', 0, u.id FROM cryptHubSchema.users AS u WHERE u.email = $1 UNION ALL SELECT 'BTC', 0, u.id FROM cryptHubSchema.users AS u WHERE u.email = $1 UNION ALL SELECT 'ETH', 0, u.id FROM cryptHubSchema.users AS u WHERE u.email = $1;";
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
  const { email, password } = login_details;
  let query_result;
  if (email && password) {
    try {
      query_result = await database.connection.query(
        "SELECT * FROM crypthubschema.users JOIN crypthubschema.wallet ON id = user_id WHERE email = $1 ORDER BY wallet_id ASC",
        [email]
      );
    } catch (error) {
      console.log("Error in query");
      console.log(error);
      throw error;
    }

    try {
      if (query_result.rows.length) {
        if (query_result.rows[0].account_verified == true) {
          let get_token = await checkPassword(
            password,
            query_result.rows[0].password,
            query_result.rows[0].email,
            query_result.rows[0].id
          );
          if (
            get_token == "INVALID_PASSWORD" ||
            get_token == "FAILED_TO_SET_TIMESTAMP"
          ) {
            return get_token;
          } else {
            return {
              message: "LOGIN_SUCCESSFUL",
              details: {
                token: get_token,
                name: query_result.rows[0].name,
                email: query_result.rows[0].email,
                USD: query_result.rows[0].amount,
                BTC: query_result.rows[1].amount,
                ETH: query_result.rows[2].amount,
              },
            };
          }
        } else {
          return "ACCOUNT_NOT_VERIFIED";
        }
      } else {
        return "EMAIL_NOT_EXIST";
      }
    } catch (error) {
      console.log("Error during verification");
      console.log(error);
      throw error;
    }
  } else {
    throw new Error("Bad Request");
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
      if (query_result.rows.length == 0) return "FAILED_TO_SET_TIMESTAMP";
      let token = jwt.sign({ email: user_email, id: user_id }, env.SECRET_KEY, {
        expiresIn: "24h",
      });
      return token;
    } else {
      return "INVALID_PASSWORD";
    }
  }
}

export async function forgotPassword(forgotPasswordDetails) {
  const { email } = forgotPasswordDetails;
  let query_result;
  if (email) {
    try {
      query_result = await database.connection.query(
        "SELECT * FROM crypthubschema.users WHERE email = $1",
        [email]
      );
    } catch (error) {
      console.log("Error in query");
      console.log(error);
      throw error;
    }

    try {
      if (query_result.rows.length) {
        const new_password = generateRandomChars();
        setNewPassword(query_result.rows[0].email, new_password);
        sendEmail(query_result.rows[0].email, new_password);
        return "SEND_NEW_PASSWORD_TO_USER";
      } else {
        return "EMAIL_NOT_EXIST";
      }
    } catch (error) {
      console.log("Error during sending new password to user's email");
      console.log(error);
      throw error;
    }
  } else {
    return "BAD_REQUEST";
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
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
      result += symbols.charAt(Math.floor(Math.random() * symbols.length));
      counter++;
    }
    return result;
  }

  function setNewPassword(user_email, new_password) {
    bcrypt.hash(new_password, 10, async (err, hash) => {
      if (err) {
        return "PASSWORD_HASHING_ERROR";
      } else {
        let hashPassword = hash;
        try {
          const set_new_password_query = await database.connection.query(
            "UPDATE crypthubschema.users SET password = $1 WHERE email = $2 RETURNING *",
            [hashPassword, user_email]
          );
          if (set_new_password_query == 0) return "QUERY_ERROR";
        } catch (error) {
          console.log(error);
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
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }
}

export async function resetPassword(header_details, body_details) {
  const email = await getEmail(header_details);
  const { old_password, new_password } = body_details;
  let query_result;
  if (email && old_password && new_password) {
    try {
      query_result = await database.connection.query(
        "SELECT password FROM crypthubschema.users WHERE email = $1",
        [email]
      );
      if (query_result.rows.length) {
        const actual_password = query_result.rows[0].password;
        //Too many if else, feels bad :( , need to clean this before pushing to prod - Haziq
        const matching = await bcrypt.compare(old_password, actual_password);
        if (matching) {
          try {
            let hash_result = await bcrypt.hash(new_password, 10);
            if (hash_result == "PASSWORD_HASHING_ERROR") return hash_result;
            let query_result2 = await database.connection.query(
              "UPDATE crypthubschema.users SET password = $1 WHERE email = $2 RETURNING *",
              [hash_result, email]
            );
            if (query_result2.rows.length == 0) return "RESET_PASSWORD_FAILURE";
            return "RESET_PASSWORD_SUCCESS";
          } catch (error) {
            return "PASSWORD_HASHING_ERROR";
          }
        } else {
          return "INVALID_PASSWORD";
        }
      } else {
        return "FAILED_TO_FETCH_USER";
      }
    } catch (error) {
      console.log(error);
      return error;
    }
  } else {
    return "BAD_REQUEST";
  }

  function getEmail(req_headers) {
    const token = req_headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, env.SECRET_KEY);
    const email = decoded.email;
    return email;
  }
}

export async function logoutUser(user_token) {
  const token = user_token;
  if (token) {
    try {
      blacklist(token);
      return "LOGOUT_SUCCESS";
    } catch (error) {
      console.log("Error when blacklisting token");
      console.log(error);
      return "INVALID_TOKEN";
    }
  } else {
    return "BAD_REQUEST";
  }

  function blacklist(logout_token) {
    redisClient.sadd("blacklisted", logout_token);
  }
}

// This function is just to see if a token is blacklisted or not -Haziq
export async function checkBlacklist(user_token) {
  const { token } = user_token;

  if (token) {
    try {
      const isBlacklisted = await redisCheckBlacklist(token);
      if (isBlacklisted == 1) {
        return "TOKEN_IS_BLACKLISTED";
      } else {
        return "TOKEN_IS_VALID";
      }
    } catch (error) {
      console.log("Error when checking");
      console.log(error);
      throw error;
    }
  } else {
    return "BAD_REQUEST";
  }

  function redisCheckBlacklist(token) {
    return redisClient.sismember("blacklisted", token);
  }
}
