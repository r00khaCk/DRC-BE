import database from "../../services/db.js";
import jwt from "jsonwebtoken";

import { CustomError } from "../middleware/error/custom-error.js";
import { getCoinBalance, getWalletBalance } from "../../utils/commonQueries.js";
import { getEmail } from "../../utils/commonFunctions.js";

const env = process.env;

// buy function
export const buyCoinsModel = async (order_information, req_header) => {
  if (order_information && req_header) {
    const user_email = await getEmail(req_header);
    const { input_amount } = order_information;
    // gets the returned value from calculateTotalBuyAmount() and stores it in calculate_total_model_result
    const calculate_total_model_result = await calculateTotalBuyAmount(
      order_information,
      user_email
    );

    //checks the returned value of the calculate_total_model_result()
    if (calculate_total_model_result.status === "BALANCE_INSUFFICIENT") {
      throw new CustomError("BALANCE_INSUFFICIENT");
    } else if (calculate_total_model_result.status === "BALANCE_SUFFICIENT") {
      //calculates the new balance for the USD wallet
      let balance_from_wallet =
        calculate_total_model_result.wallet_balance.rows[0].amount;
      const new_balance = balance_from_wallet - input_amount;

      // query to update the USD wallet
      let balance_values = [new_balance.toFixed(2), user_email];
      let update_usd_wallet =
        "UPDATE cryptHubSchema.wallet AS w SET amount = $1 FROM cryptHubSchema.users AS u WHERE u.id = w.user_id AND u.email = $2 AND w.currency = 'USD'";
      try {
        await database.connection.query("BEGIN;");
        await database.connection.query(update_usd_wallet, balance_values);

        //adds the bought coin into the user wallet (currency based on order)
        await addBoughtCurrencyIntoWallet(
          order_information,
          calculate_total_model_result.coin_amount,
          user_email
        );

        // gets all the current wallet amount
        let get_all_wallet_balance = await getWalletBalance(user_email);

        const { coin_currency } = order_information;
        await addTransactionToTransactionHistory(
          user_email,
          input_amount,
          calculate_total_model_result.coin_amount,
          0,
          coin_currency,
          "buy"
        );

        // return result
        await database.connection.query("COMMIT;");
        return {
          status: "BUY_SUCCESS",
          wallet_balance: get_all_wallet_balance.rows,
          coin_currency: coin_currency,
        };
      } catch (error) {
        await database.connection.query("ROLLBACK;");
        console.log(error);
        throw new CustomError("TRADE_QUERY_FAILED");
      }
    }
  } else {
    throw new CustomError("BAD_REQUEST");
  }
};

// sell owned BTC or ETH coins
export const sellCoinsModel = async (order_information, req_header) => {
  if (order_information && req_header) {
    const user_email = await getEmail(req_header);

    // calculates the total amount earned from selling
    const calculate_total_earned_result = await calculateTotalEarned(
      order_information,
      user_email
    );

    // checks if there is enough coins to be sold
    if (calculate_total_earned_result.status === "INSUFFICIENT_COIN_AMOUNT") {
      throw new CustomError("INSUFFICIENT_COIN_AMOUNT");
    } else if (
      calculate_total_earned_result.status === "SUFFICIENT_COIN_AMOUNT"
    ) {
      let coin_balance_from_wallet =
        calculate_total_earned_result.coin_balance.rows[0].amount;

      let coin_currency = calculate_total_earned_result.coin_currency;

      // calculates the new coin balance
      const new_coin_balance =
        coin_balance_from_wallet - calculate_total_earned_result.coin_amount;

      // updates the sold coin's balance
      let coin_balance_values = [new_coin_balance, user_email, coin_currency];
      let update_coin_balance_query =
        "UPDATE cryptHubSchema.wallet AS w SET amount = $1 FROM cryptHubSchema.users AS u WHERE u.id = w.user_id AND u.email = $2 AND w.currency = $3";

      try {
        await database.connection.query("BEGIN;");
        await database.connection.query(
          update_coin_balance_query,
          coin_balance_values
        );

        // function to add the earned amount from sale to the USD wallet
        await addEarnedAmountIntoUSDWallet(
          user_email,
          calculate_total_earned_result.total_earned_after_commission_deduction
        );

        // gets all the current wallet amount
        let get_all_wallet_balance = await getWalletBalance(user_email);

        await addTransactionToTransactionHistory(
          user_email,
          calculate_total_earned_result.total_earned_after_commission_deduction,
          calculate_total_earned_result.coin_amount,
          calculate_total_earned_result.commission_deduction,
          coin_currency,
          "sell"
        );

        await database.connection.query("COMMIT;");
        return {
          status: "SELL_SUCCESS",
          wallet_balance: get_all_wallet_balance.rows,
          coin_currency: coin_currency,
        };
      } catch (error) {
        await database.connection.query("ROLLBACK;");
        console.log("Error from sell transaction", error);
        throw error;
      }
    }
  } else {
    throw new CustomError("BAD_REQUEST");
  }
};

//---------Functions that are used in this file only----------------
// function to calculate total amount to be paid and also checks user's wallet balance
const calculateTotalBuyAmount = async (order_information, user_email) => {
  try {
    const { current_price, coin_amount } = order_information;
    let total_amount = current_price * coin_amount;

    //check if wallet has enough money (virtual) in the user's USD wallet
    let wallet_balance = await getWalletBalance(user_email);
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
    throw new CustomError("BUY_ERROR");
  }
};

// calculates the total amount earned from the current_selling_price and coin_amount
const calculateTotalEarned = async (order_information, user_email) => {
  const { coin_currency, current_selling_price, coin_amount } =
    order_information;
  let total_earned = coin_amount * current_selling_price;

  // calculate 5% commission deduction from calculate_total_earned_result.total_earned
  let commission_deduction = total_earned * 0.05;

  let total_earned_after_commission_deduction =
    total_earned - commission_deduction;

  try {
    let coin_balance = await getCoinBalance(user_email, coin_currency);

    if (coin_balance.rows[0].amount < coin_amount) {
      return { status: "INSUFFICIENT_COIN_AMOUNT" };
    } else {
      return {
        status: "SUFFICIENT_COIN_AMOUNT",
        total_earned_after_commission_deduction,
        commission_deduction,
        coin_balance,
        coin_amount,
        coin_currency,
      };
    }
  } catch (error) {
    console.log(error);
    throw new CustomError("SELL_ERROR");
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

  // adds the current_coin_amount with the total_amount and stores in updated_coin_amount
  let updated_coin_amount = current_coin_amount + coin_amount;

  let values = [updated_coin_amount, user_email, coin_currency];

  const update_bought_coin_amount =
    "UPDATE cryptHubSchema.wallet AS w SET amount = $1  FROM cryptHubSchema.users AS u WHERE u.id = w.user_id AND u.email = $2 AND w.currency = $3 ";
  try {
    let update_coin_amount_query = await database.connection.query(
      update_bought_coin_amount,
      values
    );
    let bought_coin_amount = update_coin_amount_query;
    return { coinAdded: bought_coin_amount };
  } catch (error) {
    console.log(error);
    throw new CustomError("BUY_ERROR");
  }
};

//add total_earned into the USD wallet
const addEarnedAmountIntoUSDWallet = async (user_email, total_earned) => {
  let current_USD_amount = await getCurrentCoinAmount(user_email, "USD");

  let updated_usd_wallet = current_USD_amount + total_earned;

  let values = [updated_usd_wallet.toFixed(2), user_email];

  const update_usd_wallet_query =
    "UPDATE cryptHubSchema.wallet AS w SET amount = $1  FROM cryptHubSchema.users AS u WHERE u.id = w.user_id AND u.email = $2 AND w.currency = 'USD'";
  try {
    await database.connection.query(update_usd_wallet_query, values);
  } catch (error) {
    console.log(error);
    throw new CustomError("SELL_ERROR");
  }
};

// gets the current amount of a specific currency
export const getCurrentCoinAmount = async (user_email, coin_currency) => {
  try {
    let current_amount_response = await getCoinBalance(
      user_email,
      coin_currency
    );
    return current_amount_response.rows[0].amount;
  } catch (error) {
    console.log(error);
    throw new CustomError("TRADE_QUERY_ERROR");
  }
};

// function to add the buy/sell orders to the transaction history
const addTransactionToTransactionHistory = async (
  user_email,
  amount,
  coin_amount,
  commission,
  currency,
  trade_type
) => {
  let values = [
    amount,
    coin_amount,
    commission,
    currency,
    trade_type,
    user_email,
  ];

  const add_transaction_query =
    "INSERT INTO cryptHubSchema.transactions (wallet_id, user_id, transaction_amount,coin_amount,commission_deduction_5, currency, trade_type) " +
    "SELECT w.wallet_id, u.id, $1, $2, $3, $4, $5 " +
    "FROM cryptHubSchema.users AS u " +
    "JOIN cryptHubSchema.wallet AS w " +
    "ON u.id = w.user_id " +
    "WHERE u.email = $6 AND w.currency = $4 ";

  try {
    await database.connection.query(add_transaction_query, values);
  } catch (error) {
    console.log(error);
    throw new CustomError("TRADE_QUERY_ERROR");
  }
};
