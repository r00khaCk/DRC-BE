import database from "../../services/db.js";
import jwt from "jsonwebtoken";

const env = process.env;

export async function walletDeposit(header_details, deposit_amount) {
  const amount = deposit_amount.amount;
  const email = await getEmail(header_details);

  if (amount && email) {
    try {
      const query_balance = await database.connection.query(
        "SELECT id,currency,amount FROM crypthubschema.wallet JOIN crypthubschema.users ON user_id = id WHERE email = $1 AND currency = 'USD'",
        [email]
      );
      const final_amount = amount + query_balance.rows[0].amount;
      console.log(final_amount);
      const query_deposit = await database.connection.query(
        "UPDATE crypthubschema.wallet SET amount = $1 WHERE user_id = $2 AND currency = 'USD' RETURNING amount",
        [final_amount, query_balance.rows[0].id]
      );
      return {
        message: "DEPOSIT_SUCCESS",
        details: {
          balance: query_deposit.rows[0].amount,
        },
      };
    } catch (error) {
      console.log(error);
      return "QUERY_FAIL";
    }
  } else {
    return "BAD_REQUEST";
  }
}

function getEmail(req_headers) {
  const token = req_headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  const email = decoded.email;
  return email;
}
