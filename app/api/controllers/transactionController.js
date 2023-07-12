import * as TransactionModel from "../models/transaction.js";

export const getAllTransactions = async (req, res, next) => {
  // console.log(req.headers);
  try {
    let get_transactions = await TransactionModel.getAllTransactions(
      req.headers
    );
    if (get_transactions.status === "SUCCESS") {
      return res.status(200).json({
        message: "SUCCESS",
        details: get_transactions.data,
      });
    }
  } catch (error) {
    next(error);
  }

  // if (get_transactions.status === "BAD_REQUEST") {
  //   return res.status(400).json({
  //     message: "BAD_REQUEST",
  //   });
  // } else if (get_transactions.status === "QUERY_FAIL") {
  //   return res.status(500).json({
  //     message: "QUERY_FAIL",
  //   });
  // } else if (get_transactions.status === "SUCCESS") {
  //   return res.status(200).json({
  //     message: "SUCCESS",
  //     details: get_transactions.data,
  //   });
  // }
};
