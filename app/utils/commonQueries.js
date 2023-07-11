import database from "../services/db.js";

export async function getWalletBalance(email) {
  const query_wallet_balance = await database.connection.query(
    "SELECT * FROM crypthubschema.wallet JOIN crypthubschema.users ON user_id = id WHERE email = $1 ORDER BY wallet_id ASC",
    [email]
  );
  return query_wallet_balance;
}

export async function getCoinBalance(email, currency) {
  const query_coin_balance = await database.connection.query(
    "SELECT * FROM crypthubschema.wallet JOIN crypthubschema.users ON user_id = id WHERE email = $1 AND currency = $2",
    [email, currency]
  );
  return query_coin_balance;
}
