import * as WalletModel from "../models/wallet.js";

export async function walletDeposit(req, res) {
  try {
    let response = await WalletModel.walletDeposit(req.headers, req.body);
    if (response == "BAD_REQUEST") {
      return res.status(400).json({
        message: response,
      });
    }
    if (response.message == "DEPOSIT_SUCCESS") {
      return res.status(201).json({
        message: response.message,
        details: response.details,
      });
    }
    return res.status(500).json({
      message: response,
    });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
}

export async function walletWithdraw(req, res) {
  try {
    let response = await WalletModel.walletWithdraw(req.headers, req.body);
    if (response.message == "INSUFFICIENT_BALANCE") {
      return res.status(400).json({
        message: response.message,
        details: response.details,
      });
    }
    if (response == "BAD_REQUEST") {
      return res.status(400).json({
        message: response,
      });
    }
    if (response.message == "WITHDRAW_SUCCESS") {
      return res.status(201).json({
        message: response.message,
        details: response.details,
      });
    }
    return res.status(500).json({
      message: response,
    });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
}

export async function walletTransaction(req, res) {
  try {
    let response = await WalletModel.walletTransaction(req.headers);
    if (response == "BAD_REQUEST") {
      return res.status(400).json({
        message: error,
      });
    }
    if (response.message == "SUCCESSFUL") {
      return res.status(201).json({
        message: response.message,
        details: response.details,
      });
    }
    return res.status(500).json({
      message: error,
    });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
}

export const getWalletBalance = async (req, res) => {
  let wallet_balance = await WalletModel.getWalletBalanceFromDB(req.headers);
  if (wallet_balance.status === "SELECT_QUERY_FAILED") {
    res.status(500).json({
      message: "ERROR_FETCHING_DATA",
    });
  } else {
    res.status(200).json({
      message: "SUCCESS",
      details: {
        USD: Number(wallet_balance.balance[0].amount.toFixed(2)),
        BTC: wallet_balance.balance[1].amount,
        ETH: wallet_balance.balance[2].amount,
      },
    });
  }
};
