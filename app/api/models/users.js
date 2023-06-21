import bcrypt, { hash } from "bcrypt";
import database from "../../services/db.js";
import jwt from "jsonwebtoken";

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
