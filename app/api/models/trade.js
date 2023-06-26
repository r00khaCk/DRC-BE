import database from "../../services/db.js";
import jwt from "jsonwebtoken";

const env = process.env;

// buy function
export const buyCoinsModel = async (orderInformation, reqHeader) => {
  //access the email from the token to be used in SQL query
  const token = reqHeader.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  let userEmail = decoded.email;
  console.log("User email from Token: ", userEmail);
  console.log(orderInformation);

  const calculateTotalModelResult = await calculateTotalModel(
    orderInformation,
    userEmail
  );
  console.log(calculateTotalModelResult);
  //checks the returned value of the calculateTotalModelResult()
  if (calculateTotalModelResult.status === "BALANCE_INSUFFICIENT") {
    return { status: "BUY_ERROR" };
  } else if (calculateTotalModelResult.status === "BALANCE_SUFFICIENT") {
    //calculates the new balance for the USDT wallet
    console.log(
      "walletBalance:",
      calculateTotalModelResult.walletBalance.rows[0].amount
    );
    let balance_from_wallet =
      calculateTotalModelResult.walletBalance.rows[0].amount;

    console.log(balance_from_wallet);
    const newBalance =
      balance_from_wallet - calculateTotalModelResult.totalAmount;
    console.log(newBalance);
    // query to update the wallet
    let balanceValues = [newBalance.toFixed(2), userEmail];
    await database.connection.query(
      "UPDATE cryptHubSchema.wallet AS w SET amount = $1 FROM cryptHubSchema.users AS u WHERE u.id = w.user_id AND u.email = $2 AND w.currency = 'USD'",
      balanceValues
    );
    addBoughtCurrencyIntoWallet(
      orderInformation,
      calculateTotalModelResult.totalAmount,
      userEmail
    );
    const { coin_currency } = orderInformation;
    return {
      status: "BUY_ORDER_SUCCESS",
      orderAmount: calculateTotalModelResult.totalAmount,
      walletBalance: calculateTotalModelResult.walletBalance.rows[0].amount,
      boughtCoinAmount: addBoughtCurrencyIntoWallet.coinAdded,
      coinCurrency: coin_currency,
    };
  }
};

// function to calculate total amount to be paid and also checks user's wallet balance
const calculateTotalModel = async (orderInformation, userEmail) => {
  try {
    const { currentPrice, coinAmount } = orderInformation;
    let totalAmount = currentPrice * coinAmount;

    //check if wallet has enough money (virtual) in the user's USDT wallet
    let values = [userEmail];
    console.log("userEmail from token: ", userEmail);

    let walletBalance = await database.connection.query(
      "SELECT w.amount FROM cryptHubSchema.wallet AS w JOIN cryptHubSchema.users AS u ON u.id = w.user_id WHERE u.email = $1 AND w.currency = 'USD'",
      values
    );
    console.log("Wallet balance from db: ", walletBalance.rows[0].amount);
    if (walletBalance.rows[0].amount < totalAmount.toFixed(2)) {
      return { status: "BALANCE_INSUFFICIENT" };
    } else {
      // if returning more than 1 value => put it in an object
      return { status: "BALANCE_SUFFICIENT", walletBalance, totalAmount };
    }
  } catch (error) {
    console.log(Error(error));
    return "BUY_ERROR";
  }
};

const addBoughtCurrencyIntoWallet = async (
  orderInformation,
  totalAmount,
  userEmail
) => {
  const { coin_currency } = orderInformation;
  let current_currency_amount = await getCurrentCoinAmount(
    userEmail,
    coin_currency
  );
  console.log("current amount from db: ", current_currency_amount);
  console.log("total amount: ", totalAmount);

  let updated_currency_amount = current_currency_amount + totalAmount;
  console.log("updated currency amount", updated_currency_amount);

  let values = [updated_currency_amount, userEmail, coin_currency];
  const insert_bought_currency_query =
    "UPDATE cryptHubSchema.wallet AS w SET amount = $1  FROM cryptHubSchema.users AS u WHERE u.id = w.user_id AND u.email = $2 AND w.currency = $3 ";
  let update_currency_amount_query = await database.connection.query(
    insert_bought_currency_query,
    values
  );
  let bought_currency_amount = update_currency_amount_query;
  return { coinAdded: bought_currency_amount };
};

const getCurrentCoinAmount = async (userEmail, coin_currency) => {
  let values = [userEmail, coin_currency];
  const get_currency_amount =
    "SELECT w.amount FROM cryptHubSchema.wallet AS w JOIN cryptHubSchema.users AS u ON u.id = w.user_id WHERE u.email = $1 AND w.currency = $2;";
  let current_amount_response = await database.connection.query(
    get_currency_amount,
    values
  );
  return current_amount_response.rows[0].amount;
};
