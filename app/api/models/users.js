import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import database from "../../services/db.js";
import config from "../../app_config.js";
const gmail_config = config.gmail;

// Register new account
export const registerNewUser = async (registerDetails) => {
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

const env = process.env;
export const verifyNewAccount = async (userDetails, callback) => {
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

    const verificationEmailTemplate = {
      from: gmail_config.email,

      to: email,

      subject: "Email Verification",

      text: `Hi there ${name},\nPlease click on this link to verify your account\nhttp://localhost:5000/user/registerUsers/verify/${verificationToken}`,
    };

    let message;
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
