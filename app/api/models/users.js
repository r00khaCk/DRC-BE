import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import database from "../../services/db.js";
import config from "../../app_config.js";

const gmail_config = config.gmail;
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
            response = await database.connection.query(
              "INSERT INTO crypthubschema.users (name,email,password,account_verified) VALUES($1,$2,$3,$4) RETURNING *",
              values
            );
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

// handles sending the verification email to the new user
export const sendVerificationEmailModel = async (userDetails, callback) => {
  try {
    const { email, name } = userDetails;
    const senderClient = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmail_config.email,
        pass: gmail_config.password,
      },
    });

    const verificationToken = jwt.sign(
      {
        data: email,
      },
      env.SECRET_KEY,
      { expiresIn: "5m" }
    );

    // creates the email template
    const verificationEmailTemplate = {
      from: gmail_config.email,

      to: email,

      subject: "Email Verification",

      text: `Hi there ${name},\nPlease click on this link to verify your account\nhttp://localhost:5000/user/verify/${verificationToken}`,
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

// user login
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
        response = checkPassword(
          password,
          query_result.rows[0].password,
          query_result.rows[0].id
        );
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

  async function checkPassword(received_password, actual_password, user_ID) {
    const matching = await bcrypt.compare(received_password, actual_password);
    console.log(matching);

    if (matching) {
      let token = jwt.sign({ id: user_ID }, process.env.secretKey, {
        expiresIn: "30m",
      });
      return token;
    } else {
      return "INVALID_PASSWORD";
    }
  }

  return response;
}

// May be used later when trying to verify the JWT -Haziq
// try {
//   const decoded = jwt.verify(token, secretKey);
//   console.log(decoded);
// } catch (error) {
//   console.error('Invalid token');
// }

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
