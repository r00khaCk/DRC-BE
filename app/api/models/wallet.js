import database from "../../services/db.js";
import jwt from "jsonwebtoken";

const env = process.env;

export async function walletDeposit(header_details, body_details) {
  const amount = body_details.amount;
  const email = await getEmail(header_details);

  if (amount && email) {
    try {
      // begin
      await database.connection.query("BEGIN;");
      const query_balance = await database.connection.query(
        "SELECT * FROM crypthubschema.wallet JOIN crypthubschema.users ON user_id = id WHERE email = $1 AND currency = 'USD' ORDER BY wallet_id ASC",
        [email]
      );
      const final_amount = amount + query_balance.rows[0].amount;
      const query_deposit = await database.connection.query(
        "UPDATE crypthubschema.wallet SET amount = $1 WHERE user_id = $2 AND currency = 'USD' RETURNING amount",
        [final_amount, query_balance.rows[0].id]
      );
      await database.connection.query(
        "INSERT INTO crypthubschema.deposit_withdrawal_transactions (wallet_id,dwt_type,dwt_amount,dwt_before,dwt_after) VALUES($1,'DEPOSIT',$2,$3,$4)",
        [
          query_balance.rows[0].wallet_id,
          amount,
          query_balance.rows[0].amount,
          query_deposit.rows[0].amount,
        ]
      );
      //   commit
      await database.connection.query("COMMIT;");
      return {
        message: "DEPOSIT_SUCCESS",
        details: {
          balance: query_deposit.rows[0].amount,
        },
      };
    } catch (error) {
      await database.connection.query("ROLLBACK;");
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
