import bcrypt, { hash } from "bcrypt";
import database from "../../services/db.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

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
          let values = [name, email, hashPassword];
          try {
            response = await database.connection.query(
              "INSERT INTO crypthubschema.users (name,email,password) VALUES($1,$2,$3) RETURNING *",
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
        expiresIn: "5m",
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
    while (counter < 6) {
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
        user: "crypthubofficial@gmail.com",
        pass: process.env.EMAIL_PASSWORD,
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

// May be used later when trying to verify the JWT -Haziq
// try {
//   const decoded = jwt.verify(token, secretKey);
//   console.log(decoded);
// } catch (error) {
//   console.error('Invalid token');
// }
