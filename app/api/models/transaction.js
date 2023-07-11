import database from "../../services/db.js";
import { getEmail } from "../../utils/commonFunctions.js";

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
      return { status: "QUERY_FAIL" };
    }
  } else {
    return { status: "BAD_REQUEST" };
  }
};
