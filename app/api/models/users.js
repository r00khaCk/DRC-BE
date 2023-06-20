import bcrypt from "bcrypt";
import database from "../../services/db.js";

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
        return "HASHING_ERROR";
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

//Helper methods
// const _sendResponse = (res, registerDetails) => {
//   res.status(200).send(registerDetails || {});
// };

// const _sendError = (res, status, code) => {
//   res.status(status).send({ error: code || "UNKNOWN_ERROR" });
// };
