import * as TradeModel from "../models/trade.js";
import { validationResult } from "express-validator";

export const buyTrade = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        validation: "failed",
        errors: errors.array(),
      });
    }
    let buy_order = await TradeModel.buyCoinsModel(req.body, req.headers);
    if (buy_order.status === "BUY_SUCCESS") {
      return res.status(200).json({
        message: "BUY_ORDER_SUCCESS",
        details: {
          coinCurrency: buy_order.coin_currency,
          walletBalance: {
            USD: Number(buy_order.wallet_balance[0].amount.toFixed(2)),
            BTC: buy_order.wallet_balance[1].amount,
            ETH: buy_order.wallet_balance[2].amount,
          },
        },
      });
    }
  } catch (error) {
    next(error);
  }
  // if (buy_order.status === "BALANCE_INSUFFICIENT") {
  //   return res.status(400).json({
  //     message: "BALANCE_INSUFFICIENT",
  //   });
  // } else if (buy_order.status === "QUERY_FAILED") {
  //   return res.status(500).json({
  //     message: "DB_ERROR",
  //   });
  // } else if (buy_order.status === "BAD_REQUEST") {
  //   return res.status(400).json({
  //     message: "BAD_REQUEST",
  //   });
  // } else if (buy_order.status === "BUY_SUCCESS") {
  //   return res.status(200).json({
  //     message: "BUY_ORDER_SUCCESS",
  //     details: {
  //       coinCurrency: buy_order.coin_currency,
  //       walletBalance: {
  //         USD: Number(buy_order.wallet_balance[0].amount.toFixed(2)),
  //         BTC: buy_order.wallet_balance[1].amount,
  //         ETH: buy_order.wallet_balance[2].amount,
  //       },
  //     },
  //   });
  // }
};

export const sellTrade = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        validation: "failed",
        errors: errors.array(),
      });
    }
    let sell_order = await TradeModel.sellCoinsModel(req.body, req.headers);
    return res.status(200).json({
      message: "SELL_ORDER_SUCCESS",
      details: {
        coinCurrency: sell_order.coin_currency,
        walletBalance: {
          USD: sell_order.wallet_balance[0].amount,
          BTC: sell_order.wallet_balance[1].amount,
          ETH: sell_order.wallet_balance[2].amount,
        },
      },
    });
  } catch (error) {
    next(error);
  }

  // if (sell_order.status === "INSUFFICIENT_COIN_AMOUNT") {
  //   return res.status(400).json({
  //     message: "INSUFFICIENT_COIN_AMOUNT",
  //   });
  // } else if (sell_order.status === "QUERY_FAILED") {
  //   return res.status(500).json({
  //     message: "DB_ERROR",
  //   });
  // } else if (sell_order.status === "BAD_REQUEST") {
  //   return res.status(400).json({
  //     message: "BAD_REQUEST",
  //   });
  // }
};
