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
  //checks the returned value of the calculateTotalModelResult()
  if (calculateTotalModelResult.status === "BALANCE_INSUFFICIENT") {
    return { status: "BUY_ERROR" };
  } else if (calculateTotalModelResult.status === "BALANCE_SUFFICIENT") {
    //calculates the new balance for the USDT wallet
    const newBalance =
      calculateTotalModelResult.walletBalance.rows[0].amount -
      calculateTotalModelResult.totalAmount;
    console.log(newBalance);
    // query to update the wallet
    let balanceValues = [newBalance.toFixed(2), userEmail];
    await database.connection.query(
      "UPDATE cryptHubSchema.wallet AS w SET amount = $1 FROM cryptHubSchema.users AS u WHERE u.id = w.user_id AND u.email = $2 AND w.currency = 'USDT'",
      balanceValues
    );
    return {
      status: "BUY_ORDER_SUCCESS",
      orderAmount: calculateTotalModelResult.totalAmount.toFixed(2),
      walletBalance: calculateTotalModelResult.walletBalance.rows[0].amount,
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
      "SELECT w.amount FROM cryptHubSchema.wallet AS w JOIN cryptHubSchema.users AS u ON u.id = w.user_id WHERE u.email = $1 AND w.currency = 'USDT'",
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
