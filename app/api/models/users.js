import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import database from "../../services/db.js";
import e from "express";

const env = process.env;

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
        let response;
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

      text: `Hi there dear customer,\nPlease click on this link to verify your account\nhttp://localhost:5000/user/verify/${verificationToken}`,
    };

    senderClient.sendMail(verificationEmailTemplate, (error, info) => {
      if (error) {
        console.log(Error(error));
        callback("VERIFICATION_EMAIL_ERROR");
      }
      console.log("VERIFICATION_EMAIL_SENT");
      console.log(info);
      callback("VERIFICATION_EMAIL_SENT");
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
    "INSERT INTO cryptHubSchema.wallet (currency, amount, user_id) SELECT 'USD', 0, u.id FROM cryptHubSchema.users AS u union all select 'BTC', 0, u.id FROM cryptHubSchema.users AS u union all select 'ETH', 0, u.id FROM cryptHubSchema.users AS u WHERE u.email = $1";
  await database.connection.query(insert_empty_wallet_query, values);
};

export async function loginUser(loginDetails) {
  const { email, password } = loginDetails;
  let query_result;
  let response;
  if (email && password) {
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
        if (query_result.rows[0].account_verified == true) {
          response = checkPassword(
            password,
            query_result.rows[0].password,
            query_result.rows[0].email
          );
        } else {
          response = "ACCOUNT_NOT_VERIFIED";
        }
      } else {
        response = "EMAIL_NOT_EXIST";
      }
    } catch (error) {
      console.log("Error during verification");
      console.log(error);
      throw error;
    }
  } else {
    throw new Error("Bad Request");
  }

  async function checkPassword(received_password, actual_password, userEmail) {
    const matching = await bcrypt.compare(received_password, actual_password);
    console.log(matching);

    if (matching) {
      let token = jwt.sign({ email: userEmail }, env.SECRET_KEY, {
        expiresIn: "60m",
      });
      return token;
    } else {
      return "INVALID_PASSWORD";
    }
  }

  return response;
}

export async function forgotPassword(forgotPasswordDetails) {
  const { email } = forgotPasswordDetails;
  let query_result;
  let response;
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
        response = "SEND_NEW_PASSWORD_TO_USER";
      } else {
        response = "EMAIL_NOT_EXIST";
      }
    } catch (error) {
      console.log("Error during sending new password to user's email");
      console.log(error);
      throw error;
    }
  } else {
    throw new Error("Bad Request");
  }

  function generateRandomChars() {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 9) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  function setNewPassword(user_email, new_password) {
    bcrypt.hash(new_password, 10, async (err, hash) => {
      if (err) {
        console.log("Error when hashing password");
        return;
      } else {
        let hashPassword = hash;
        try {
          database.connection.query(
            "UPDATE crypthubschema.users SET password = $1 WHERE email = $2",
            [hashPassword, user_email]
          );
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

  return response;
}
