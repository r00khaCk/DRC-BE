import { response } from "express";
import database from "../../services/db.js";

// Register new account
export async function registerNewUser(registerDetails) {
  const { name, email, password } = registerDetails;
  let response;
  //check if email, name and password is true
  if (name && email && password) {
    let values = [name, email, password];
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
    return response.rows[0];
  } else {
    throw new Error("Bad Request");
  }
}

export async function loginUser(loginDetails) {
  const { email, password } = loginDetails;
  let response;
  if (email && password) {
    try {
      response = await database.connection.query(
        "SELECT * FROM crypthubschema.users WHERE email = $1",
        [email]
      );
    } catch (error) {
      console.log("Error in query");
      console.log(error);
      throw error;
    }
    try {
      if (response.rows.length) {
        checkPassword(response.rows[0].password, password);
      } else {
        response = "Email is not registed in the database";
      }
    } catch (error) {
      console.log("Error during verification");
      console.log(error);
      throw error;
    }
      console.log("Verification Complete");
    } else {
      throw new Error("Bad Request");
  }
  return response;

  function checkPassword(given_password, actual_password) {
    if (given_password == actual_password) {
      response = "Correct Password";
    } else {
      response = "Wrong Password";
    }
  }
}
