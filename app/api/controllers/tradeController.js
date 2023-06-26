import * as TradeModel from "../models/trade.js";

export const buyTrade = async (req, res) => {
  let buy_order = await TradeModel.buyCoinsModel(req.body, req.headers);
  if (buy_order.status === "BUY_ERROR") {
    return res.status(400).json({
      message: "BUY_ORDER_FAILED",
    });
  }
  return res.status(200).json({
    message: "BUY_ORDER_SUCCESS",
    details: {
      orderAmount: buy_order.order_amount,
      coinCurrency: buy_order.coin_currency,
      walletBalance: buy_order.wallet_balance,
    },
  });
};
