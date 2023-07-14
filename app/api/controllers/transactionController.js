import * as TransactionModel from "../models/transaction.js";

export const getAllTransactions = async (req, res, next) => {
  // console.log(req.headers);
  try {
    let get_transactions = await TransactionModel.getAllTransactions(
      req.headers
    );
    return res.status(200).json({
      message: "SUCCESS",
      details: get_transactions.data,
    });
  } catch (error) {
    next(error);
  }
};
