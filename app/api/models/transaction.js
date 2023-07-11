import database from "../../services/db.js";
import jwt from "jsonwebtoken";
import { CustomError } from "../middleware/error/custom-error.js";

const env = process.env;

// function to get all transactions
export const getAllTransactions = async (request_headers) => {
  let user_email = await getEmail(request_headers);
  if (user_email) {
    let value = [user_email];
    const get_all_transactions_query =
      "SELECT t.* FROM cryptHubSchema.transactions AS t JOIN cryptHubSchema.users AS u ON t.user_id = u.id WHERE u.email = $1 ORDER BY transaction_date DESC";
    try {
      const get_all_transactions = await database.connection.query(
        get_all_transactions_query,
        value
      );
      return { status: "SUCCESS", data: get_all_transactions.rows };
    } catch (error) {
      console.log("Error from get_all_transactions: ", error);
      // return { status: "QUERY_FAIL" };
      throw new CustomError("QUERY_FAILED");
    }
  } else {
    // return { status: "BAD_REQUEST" };
    throw new CustomError("BAD_REQUEST");
  }
};

const getEmail = (req_headers) => {
  // console.log(req_headers);
  const token = req_headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  const email = decoded.email;
  return email;
};
