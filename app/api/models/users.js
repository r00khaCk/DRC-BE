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

// export default Users;
