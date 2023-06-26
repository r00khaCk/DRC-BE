import database from "../../services/db.js";
import jwt from "jsonwebtoken";

const env = process.env;

// buy function
export const buyCoinsModel = async (order_information, req_header) => {
  //access the email from the token to be used in SQL query
  const token = req_header.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  let user_email = decoded.email;
  console.log("User email from token: ", user_email);
  console.log("Buy order from user: ", order_information);

  // gets the returned value from calculateTotalModel() and stores it in calculate_total_model_result
  const calculate_total_model_result = await calculateTotalModel(
    order_information,
    user_email
  );
  console.log(
    "Variable calculate_total_model_result: ",
    calculate_total_model_result
  );
  //checks the returned value of the calculate_total_model_result()
  if (calculate_total_model_result.status === "BALANCE_INSUFFICIENT") {
    return { status: "BUY_ERROR" };
  } else if (calculate_total_model_result.status === "BALANCE_SUFFICIENT") {
    //calculates the new balance for the USD wallet
    let balance_from_wallet =
      calculate_total_model_result.wallet_balance.rows[0].amount;
    const new_balance =
      balance_from_wallet - calculate_total_model_result.total_amount;
    console.log("New balance for USD wallet: ", new_balance);
    // query to update the USD wallet
    let balance_values = [new_balance.toFixed(2), user_email];
    let update_usd_wallet =
      "UPDATE cryptHubSchema.wallet AS w SET amount = $1 FROM cryptHubSchema.users AS u WHERE u.id = w.user_id AND u.email = $2 AND w.currency = 'USD'";
    await database.connection.query(update_usd_wallet, balance_values);

    //adds the bought coin into the user wallet (currency based on order)
    addBoughtCurrencyIntoWallet(
      order_information,
      calculate_total_model_result.total_amount,
      user_email
    );

    // return result
    const { coin_currency } = order_information;
    return {
      status: "BUY_ORDER_SUCCESS",
      order_amount: calculate_total_model_result.total_amount,
      wallet_balance:
        calculate_total_model_result.wallet_balance.rows[0].amount,
      boughtCoinAmount: addBoughtCurrencyIntoWallet.coinAdded,
      coin_currency: coin_currency,
    };
  }
};

// function to calculate total amount to be paid and also checks user's wallet balance
const calculateTotalModel = async (order_information, user_email) => {
  try {
    const { current_price, coin_amount } = order_information;
    let total_amount = current_price * coin_amount;

    //check if wallet has enough money (virtual) in the user's USDT wallet
    let values = [user_email];

    let get_wallet_balance =
      "SELECT w.amount FROM cryptHubSchema.wallet AS w JOIN cryptHubSchema.users AS u ON u.id = w.user_id WHERE u.email = $1 AND w.currency = 'USD'";

    let wallet_balance = await database.connection.query(
      get_wallet_balance,
      values
    );
    console.log("Wallet balance from db: ", wallet_balance.rows[0].amount);
    if (wallet_balance.rows[0].amount < total_amount.toFixed(2)) {
      return { status: "BALANCE_INSUFFICIENT" };
    } else {
      // if returning more than 1 value => put it in an object
      return { status: "BALANCE_SUFFICIENT", wallet_balance, total_amount };
    }
  } catch (error) {
    console.log(Error(error));
    return "BUY_ERROR";
  }
};

const addBoughtCurrencyIntoWallet = async (
  order_information,
  total_amount,
  user_email
) => {
  const { coin_currency } = order_information;

  // return value from getCurrentCoinAmount() is stored in current_currency_amount
  let current_currency_amount = await getCurrentCoinAmount(
    user_email,
    coin_currency
  );
  console.log(
    "current amount of specific currency from db: ",
    current_currency_amount
  );

  // adds the current_currency_amount with the total_amount and stores in updated_currency_amount
  let updated_currency_amount = current_currency_amount + total_amount;
  console.log("updated currency amount", updated_currency_amount);

  let values = [updated_currency_amount, user_email, coin_currency];

  const update_bought_currency_amount =
    "UPDATE cryptHubSchema.wallet AS w SET amount = $1  FROM cryptHubSchema.users AS u WHERE u.id = w.user_id AND u.email = $2 AND w.currency = $3 ";
  let update_currency_amount_query = await database.connection.query(
    update_bought_currency_amount,
    values
  );
  let bought_currency_amount = update_currency_amount_query;
  return { coinAdded: bought_currency_amount };
};

const getCurrentCoinAmount = async (user_email, coin_currency) => {
  let values = [user_email, coin_currency];
  const get_currency_amount =
    "SELECT w.amount FROM cryptHubSchema.wallet AS w JOIN cryptHubSchema.users AS u ON u.id = w.user_id WHERE u.email = $1 AND w.currency = $2;";
  let current_amount_response = await database.connection.query(
    get_currency_amount,
    values
  );
  return current_amount_response.rows[0].amount;
};
