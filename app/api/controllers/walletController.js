import * as WalletModel from "../models/wallet.js";

export async function walletDeposit(req, res) {
  try {
    let response = await WalletModel.walletDeposit(req.headers, req.body);
    return res.status(201).json({
      message: response.message,
      details: response.details,
    });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
}
