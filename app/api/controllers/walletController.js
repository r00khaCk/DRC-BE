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
