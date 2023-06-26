import * as TradeModel from "../models/trade.js";

export const buyTrade = async (req, res) => {
  let buyOrder = await TradeModel.buyCoinsModel(req.body, req.headers);
  if (buyOrder.status === "BUY_ERROR") {
    return res.status(400).json({
      message: "BUY_ORDER_FAILED",
    });
  }
  return res.status(200).json({
    message: "BUY_ORDER_SUCCESS",
    details: {
      orderAmount: buyOrder.orderAmount,
      walletBalance: buyOrder.walletBalance,
      coinCurrency: buyOrder.coinCurrency,
    },
  });
};
