import * as P2PModel from "../models/p2p.js";

export const addP2PContract = async (req, res) => {
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
  } else if (p2p_contract.status === "INPUT_QUERY_FAILURE") {
    res.status(500).json({ message: "CONTRACT_CREATION_ERROR" });
  } else if (p2p_contract.status === "BAD_REQUEST") {
    res.status(400).json({ message: "REQUEST_ERROR" });
  } else if (p2p_contract.status === "UPDATE_QUERY_FAILURE") {
    res.status(500).json({ message: "CONTRACT_CREATION_ERROR" });
  } else if (p2p_contract.status === "INSUFFICIENT_COIN_AMOUNT") {
    res.status(400).json({ message: "INSUFFICIENT_COIN_BALANCE" });
  }
};

export const getAllOpenContracts = async (req, res) => {
  let get_all_openContracts = await P2PModel.getOpenContractsModel();
  if (get_all_openContracts.status === "SELECT_QUERY_SUCCESS") {
    res.status(200).json({
      message: "SUCCESS",
      details: get_all_openContracts.data,
    });
  } else if (get_all_openContracts.status === "SELECT_QUERY_FAILURE") {
    res.status(500).json({
      message: "FETCHING_CONTRACTS_FAILED",
    });
  }
};

export const getOngoingContracts = async (req, res) => {
  let get_ongoing_contracts = await P2PModel.getOngoingContractsModel(
    req.headers
  );
  if (get_ongoing_contracts.status === "SELECT_QUERY_SUCCESS") {
    res.status(200).json({
      message: "SUCCESS",
      details: get_ongoing_contracts.data,
    });
  } else if (get_ongoing_contracts.status === "SELECT_QUERY_FAILURE") {
    res.status(500).json({
      message: "FETCHING_ONGOING_FAILED",
    });
  } else if (get_ongoing_contracts.status === "BAD_REQUEST") {
    res.status(400).json({
      message: "REQUEST_ERROR",
    });
  }
};
