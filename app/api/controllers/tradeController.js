import * as TradeModel from "../models/trade.js";

export const buyTrade = async (req, res) => {
  let buyOrder = await TradeModel.buyCoinsModel(req.body);
  console.log(buyOrder);
  return res.status(200).json({
    message: "BUY_SUCCESS",
    order: buyOrder,
  });
};

// const calculateTotalAmount = async (orderInfo, res) => {
//   try {
//     let total = TradeModel.calculateTotal(orderInfo);
//     return total;
//   } catch (err) {
//     return res.status(500).json({
//       error: err,
//     });
//   }
// };
