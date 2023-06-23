import database from "../../services/db.js";

// buy
export const buyCoinsModel = async (orderInformation) => {
  //   const { currentPrice, coinAmount } = orderInformation;
  console.log(orderInformation);

  if (calculateTotalModel(orderInformation));
  //   return orderInformation;
};

const calculateTotalModel = async (orderInformation) => {
  try {
    const { currentPrice, coinAmount } = orderInformation;
    let totalAmount = currentPrice * coinAmount;
    //check if wallet has enough money (virtual)
    //enter code here

    let walletBalance;
    //------------------
    return totalAmount;
  } catch (error) {
    console.log(Error(error));
    return "BUY_ERROR";
  }
};
