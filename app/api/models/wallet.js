import database from "../../services/db.js";
import jwt from "jsonwebtoken";

const env = process.env;

export async function walletDeposit(header_details, body_details) {
  try {
    const { amount } = body_details;
    const email = await getEmail(header_details);
    if (amount && email) {
      // begin
      await database.connection.query("BEGIN;");
      const query_balance = await database.connection.query(
        "SELECT * FROM crypthubschema.wallet JOIN crypthubschema.users ON user_id = id WHERE email = $1 AND currency = 'USD' ORDER BY wallet_id ASC",
        [email]
      );
      if (query_balance.rows.length == 0) {
        return "FAILED_TO_FETCH_WALLET";
      }
      const final_amount = amount + query_balance.rows[0].amount;
      const query_deposit = await database.connection.query(
        "UPDATE crypthubschema.wallet SET amount = $1 WHERE user_id = $2 AND currency = 'USD' RETURNING amount",
        [final_amount, query_balance.rows[0].id]
      );
      if (query_deposit.rows.length == 0) {
        await database.connection.query("ROLLBACK;");
        return "FAILED_TO_DEPOSIT";
      }
      const query_history = await database.connection.query(
        "INSERT INTO crypthubschema.deposit_withdrawal_transactions (wallet_id,dwt_type,dwt_amount,dwt_before,dwt_after) VALUES($1,'deposit',$2,$3,$4) RETURNING *",
        [
          query_balance.rows[0].wallet_id,
          amount,
          query_balance.rows[0].amount,
          query_deposit.rows[0].amount,
        ]
      );
      if (query_history.rows.length == 0) {
        await database.connection.query("ROLLBACK;");
        return "FAILED_TO_SAVE_TRANSACTION";
      }
      //   commit
      await database.connection.query("COMMIT;");
      return {
        message: "DEPOSIT_SUCCESS",
        details: {
          balance: query_deposit.rows[0].amount,
        },
      };
    } else {
      return "BAD_REQUEST";
    }
  } catch (error) {
    await database.connection.query("ROLLBACK;");
    console.log(error);
    return "REQUEST_FAILED";
  }
}

export async function walletWithdraw(header_details, body_details) {
  try {
    const { amount } = body_details;
    const email = await getEmail(header_details);
    if (amount && email) {
      // begin
      await database.connection.query("BEGIN;");
      const query_balance = await database.connection.query(
        "SELECT * FROM crypthubschema.wallet JOIN crypthubschema.users ON user_id = id WHERE email = $1 AND currency = 'USD' ORDER BY wallet_id ASC",
        [email]
      );
      if (query_balance.rows.length == 0) return "FAILED_TO_WITHDRAW";
      const final_amount = query_balance.rows[0].amount - amount;
      if (final_amount < 0)
        return {
          message: "INSUFFICIENT_BALANCE",
          details: {
            balance: query_balance.rows[0].amount,
          },
        };
      const query_withdraw = await database.connection.query(
        "UPDATE crypthubschema.wallet SET amount = $1 WHERE user_id = $2 AND currency = 'USD' RETURNING amount",
        [final_amount, query_balance.rows[0].id]
      );
      if (query_withdraw.rows.length == 0) {
        await database.connection.query("ROLLBACK;");
        return "FAILED_TO_WITHDRAW";
      }
      const query_history = await database.connection.query(
        "INSERT INTO crypthubschema.deposit_withdrawal_transactions (wallet_id,dwt_type,dwt_amount,dwt_before,dwt_after) VALUES($1,'withdraw',$2,$3,$4) RETURNING *",
        [
          query_balance.rows[0].wallet_id,
          amount,
          query_balance.rows[0].amount,
          query_withdraw.rows[0].amount,
        ]
      );
      if (query_history.rows.length == 0) {
        await database.connection.query("ROLLBACK;");
        return "FAILED_TO_SAVE_TRANSACTION";
      }
      //   commit
      await database.connection.query("COMMIT;");
      return {
        message: "WITHDRAW_SUCCESS",
        details: {
          balance: query_withdraw.rows[0].amount,
        },
      };
    } else {
      return "BAD_REQUEST";
    }
  } catch (error) {
    await database.connection.query("ROLLBACK;");
    console.log(error);
    return "REQUEST_FAILED";
  }
}

export async function walletTransaction(header_details) {
  try {
    const user_id = await getID(header_details);
    if (user_id) {
      const query_result = await database.connection.query(
        "SELECT u.* FROM crypthubschema.deposit_withdrawal_transactions as u JOIN crypthubschema.wallet as i  on u.wallet_id = i.wallet_id WHERE user_id = $1",
        [user_id]
      );
      if (query_result.rows.length == 0) return "FAILED_TO_FETCH_TRANSACTION";
      return {
        message: "SUCCESSFUL",
        details: query_result.rows,
      };
    } else {
      return "BAD_REQUEST";
    }
  } catch (error) {
    console.log(error);
    return "REQUEST_FAILED";
  }
}

function getEmail(req_headers) {
  const token = req_headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  const email = decoded.email;
  return email;
}

function getID(req_headers) {
  const token = req_headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  const id = decoded.id;
  return id;
}
