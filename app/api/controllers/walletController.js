import { validationResult } from "express-validator";
import * as WalletModel from "../models/wallet.js";

export async function walletDeposit(req, res, next) {
  try {
    // handles errors from the user validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        validation: "failed",
        errors: errors.array(),
      });
    }
    let response = await WalletModel.walletDeposit(req.headers, req.body);

    return res.status(201).json({
      message: response.message,
      details: response.details,
    });
  } catch (err) {
    next(err);
  }
}

export async function walletWithdraw(req, res, next) {
  try {
    // handles errors from the user validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        validation: "failed",
        errors: errors.array(),
      });
    }
    let response = await WalletModel.walletWithdraw(req.headers, req.body);

    if (response.message == "INSUFFICIENT_BALANCE") {
      return res.status(400).json({
        message: response.message,
        details: response.details,
      });
    } else if (response.message == "WITHDRAW_SUCCESS") {
      return res.status(201).json({
        message: response.message,
        details: response.details,
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function walletTransaction(req, res, next) {
  try {
    let response = await WalletModel.walletTransaction(req.headers);

    return res.status(201).json({
      message: response.message,
      details: response.details,
    });
  } catch (err) {
    next(err);
  }
}

export const getWalletBalance = async (req, res, next) => {
  try {
    let wallet_balance = await WalletModel.getWalletBalanceFromDB(req.headers);

    res.status(200).json({
      message: "SUCCESS",
      details: {
        USD: Number(wallet_balance.balance[0].amount.toFixed(2)),
        BTC: wallet_balance.balance[1].amount,
        ETH: wallet_balance.balance[2].amount,
      },
    });
  } catch (err) {
    next(err);
  }
};
