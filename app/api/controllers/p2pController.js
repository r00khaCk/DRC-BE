import { validationResult } from "express-validator";
import * as P2PModel from "../models/p2p.js";

export const addP2PContract = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        validation: "failed",
        errors: errors.array(),
      });
    }
    let p2p_contract = await P2PModel.addNewP2PContractModel(
      req.body,
      req.headers
    );
    if (p2p_contract.status === "INPUT_QUERY_SUCCESS") {
      res.status(201).json({
        message: "CONTRACT_ADDED",
        details: {
          wallet_balance: {
            USD: Number(p2p_contract.wallet_balance[0].amount.toFixed(2)),
            BTC: p2p_contract.wallet_balance[1].amount,
            ETH: p2p_contract.wallet_balance[2].amount,
          },
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getAllOpenContracts = async (req, res, next) => {
  try {
    let get_all_openContracts = await P2PModel.getOpenContractsModel();
    if (get_all_openContracts.status === "SELECT_QUERY_SUCCESS") {
      res.status(200).json({
        message: "SUCCESS",
        details: get_all_openContracts.data,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getOngoingContracts = async (req, res, next) => {
  try {
    let get_ongoing_contracts = await P2PModel.getOngoingContractsModel(
      req.headers
    );
    if (get_ongoing_contracts.status === "SELECT_QUERY_SUCCESS") {
      res.status(200).json({
        message: "SUCCESS",
        details: get_ongoing_contracts.data,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getAllCompletedP2PContracts = async (req, res, next) => {
  try {
    let get_all_completed_contracts =
      await P2PModel.getAllCompletedP2PContracts(req.headers);
    if (get_all_completed_contracts.status === "CONTRACTS_FOUND") {
      res.status(200).json({
        message: "SUCCESS",
        details: get_all_completed_contracts.data,
      });
    }
  } catch (error) {
    next(error);
  }
};

export async function buyContract(req, res, next) {
  try {
    let response = await P2PModel.buyContract(req.headers, req.body);
    return res.status(200).json({
      message: response.message,
      details: response.details,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteContract(req, res, next) {
  try {
    let response = await P2PModel.deleteContract(req.headers, req.body);
    return res.status(200).json({
      message: response.message,
      details: response.details,
    });
  } catch (err) {
    next(err);
  }
}
