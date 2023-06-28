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
    return { status: "BALANCE_INSUFFICIENT" };
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
    let update_wallet_query = await database.connection.query(
      update_usd_wallet,
      balance_values
    );
    console.log(update_wallet_query);

    //adds the bought coin into the user wallet (currency based on order)
    addBoughtCurrencyIntoWallet(
      order_information,
      calculate_total_model_result.coin_amount,
      user_email
    );

    // gets all the current wallet amount
    let get_all_wallet_balance = await getAllWalletBalance(user_email);
    console.log(get_all_wallet_balance.balance.rows);

    // return result
    const { coin_currency } = order_information;
    return {
      status: "BUY_SUCCESS",
      wallet_balance: get_all_wallet_balance.balance.rows,
      coin_currency: coin_currency,
    };
  }
};

// sell owned BTC or ETH coins
export const sellCoinsModel = async (order_information, req_header) => {
  const token = req_header.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  let user_email = decoded.email;
  console.log("User email from token: ", user_email);
  console.log("Sell order from user: ", order_information);

  // calculates the total amount earned from selling
  const calculate_total_earned_result = await calculateTotalEarned(
    order_information,
    user_email
  );

  console.log(
    "Variable calculate_total_earned_result: ",
    calculate_total_earned_result
  );

  // checks if there is enough coins to be sold
  if (calculate_total_earned_result.status === "INSUFFICIENT_COIN_AMOUNT") {
    return { status: "INSUFFICIENT_COIN_AMOUNT" };
  } else if (
    calculate_total_earned_result.status === "SUFFICIENT_COIN_AMOUNT"
  ) {
    let coin_balance_from_wallet =
      calculate_total_earned_result.coin_balance.rows[0].amount;

    let coin_currency = calculate_total_earned_result.coin_currency;
    console.log("Coin currency: ", coin_currency);

    // calculates the new coin balance
    const new_coin_balance =
      coin_balance_from_wallet - calculate_total_earned_result.coin_amount;
    console.log("New coin balance for wallet: ", new_coin_balance);

    // updates the sold coin's balance
    let coin_balance_values = [new_coin_balance, user_email, coin_currency];
    let update_coin_balance_query =
      "UPDATE cryptHubSchema.wallet AS w SET amount = $1 FROM cryptHubSchema.users AS u WHERE u.id = w.user_id AND u.email = $2 AND w.currency = $3";
    try {
      let update_coin_balance = await database.connection.query(
        update_coin_balance_query,
        coin_balance_values
      );
      console.log(update_coin_balance);
    } catch (error) {
      console.log("Error for update_coin_balance: ", error);
      return { status: "PG_UPDATE_ERROR" };
    }

    // function to add the earned amount from sale to the USD wallet
    addEarnedAmountIntoUSDWallet(
      user_email,
      calculate_total_earned_result.total_earned,
      order_information
    );

    // gets all the current wallet amount
    let get_all_wallet_balance = await getAllWalletBalance(user_email);
    console.log(get_all_wallet_balance.balance.rows);

    return {
      status: "SELL_SUCCESS",
      wallet_balance: get_all_wallet_balance.balance.rows,
      coin_currency: coin_currency,
    };
  }
};

//---------Functions that are used in this file only----------------
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
      return {
        status: "BALANCE_SUFFICIENT",
        wallet_balance,
        total_amount,
        coin_amount,
      };
    }
  } catch (error) {
    console.log(Error(error));
    return "BUY_ERROR";
  }
};

// calculates the total amount earned from the current_selling_price and coin_amount
const calculateTotalEarned = async (order_information, user_email) => {
  const { coin_currency, current_selling_price, coin_amount } =
    order_information;
  let total_earned = coin_amount * current_selling_price;

  let values = [user_email, coin_currency];

  let get_coin_balance_query =
    "SELECT w.amount FROM cryptHubSchema.wallet AS w JOIN cryptHubSchema.users AS u ON u.id = w.user_id WHERE u.email = $1 AND w.currency = $2";

  try {
    let coin_balance = await database.connection.query(
      get_coin_balance_query,
      values
    );

    console.log("Coin balance from wallet (db): ", coin_balance.rows[0].amount);

    if (coin_balance.rows[0].amount < coin_amount) {
      return { status: "INSUFFICIENT_COIN_AMOUNT" };
    } else {
      return {
        status: "SUFFICIENT_COIN_AMOUNT",
        total_earned,
        coin_balance,
        coin_amount,
        coin_currency,
      };
    }
  } catch (error) {
    console.log("Error for wallet_balance: ", error);
    throw Error(error);
  }
};

// pass in the coin_currency and user_email to update the wallet
const addBoughtCurrencyIntoWallet = async (
  order_information,
  coin_amount,
  user_email
) => {
  const { coin_currency } = order_information;

  // return value from getCurrentCoinAmount() is stored in current_coin_amount
  let current_coin_amount = await getCurrentCoinAmount(
    user_email,
    coin_currency
  );
  console.log(
    "current amount of specific currency from db: ",
    current_coin_amount
  );

  // adds the current_coin_amount with the total_amount and stores in updated_coin_amount
  let updated_coin_amount = current_coin_amount + coin_amount;
  console.log("updated currency amount", updated_coin_amount);

  let values = [updated_coin_amount, user_email, coin_currency];

  const update_bought_coin_amount =
    "UPDATE cryptHubSchema.wallet AS w SET amount = $1  FROM cryptHubSchema.users AS u WHERE u.id = w.user_id AND u.email = $2 AND w.currency = $3 ";
  let update_coin_amount_query = await database.connection.query(
    update_bought_coin_amount,
    values
  );
  let bought_coin_amount = update_coin_amount_query;
  return { coinAdded: bought_coin_amount };
};

//add total_earned into the USD wallet
const addEarnedAmountIntoUSDWallet = async (
  user_email,
  total_earned,
  order_information
) => {
  const { coin_currency } = order_information;
  let current_USD_amount = await getCurrentCoinAmount(user_email, "USD");
  console.log("Current USD wallet amount: ", current_USD_amount);

  let updated_usd_wallet = current_USD_amount + total_earned;
  console.log("New USD wallet balance: ", updated_usd_wallet);

  let values = [updated_usd_wallet.toFixed(2), user_email];

  const update_usd_wallet_query =
    "UPDATE cryptHubSchema.wallet AS w SET amount = $1  FROM cryptHubSchema.users AS u WHERE u.id = w.user_id AND u.email = $2 AND w.currency = 'USD'";
  try {
    const update_usd_wallet = await database.connection.query(
      update_usd_wallet_query,
      values
    );
    let new_USD_wallet_balance = update_usd_wallet;
    console.log(new_USD_wallet_balance);
    // return new_USD_wallet_balance;
  } catch (error) {
    console.log("Error from update_usd_wallet: ", error);
    throw Error(error);
  }
};

// gets the current amount of a specific currency
const getCurrentCoinAmount = async (user_email, coin_currency) => {
  let values = [user_email, coin_currency];
  const get_currency_amount =
    "SELECT w.amount FROM cryptHubSchema.wallet AS w JOIN cryptHubSchema.users AS u ON u.id = w.user_id WHERE u.email = $1 AND w.currency = $2;";
  try {
    let current_amount_response = await database.connection.query(
      get_currency_amount,
      values
    );
    console.log(
      "currenct amount of sell",
      current_amount_response.rows[0].amount
    );
    return current_amount_response.rows[0].amount;
  } catch (error) {
    console.log("Error from current_amount_response: ", error);
    throw Error(error);
  }
};

// function to get current balance
const getAllWalletBalance = async (user_email) => {
  let value = [user_email];
  const get_all_wallet_balance_query =
    "SELECT w.amount FROM cryptHubSchema.wallet AS w JOIN cryptHubSchema.users AS u ON u.id = w.user_id WHERE u.email = $1 ORDER BY w.wallet_id ASC";
  try {
    const get_all_wallet_balance = await database.connection.query(
      get_all_wallet_balance_query,
      value
    );
    return { balance: get_all_wallet_balance };
  } catch (error) {
    console.log("Error from get_all_wallet_balance: ", error);
    throw Error(error);
  }
};
