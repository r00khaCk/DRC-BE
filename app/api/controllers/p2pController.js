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
      message: "FETCHING_DATA_FAILED",
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
      message: "FETCHING_DATA_FAILED",
    });
  } else if (get_ongoing_contracts.status === "BAD_REQUEST") {
    res.status(400).json({
      message: "REQUEST_ERROR",
    });
  }
};

export const getAllCompletedP2PContracts = async (req, res) => {
  let get_all_completed_contracts = await P2PModel.getAllCompletedP2PContracts(
    req.headers
  );
  if (get_all_completed_contracts.status === "SELECT_QUERY_SUCCESS") {
    res.status(200).json({
      message: "SUCCESS",
      details: get_all_completed_contracts.data,
    });
  } else if (get_all_completed_contracts.status === "NO_CONTRACTS_FETCHED") {
    res.status(500).json({
      message: "NO_CONTRACTS_FOUND",
    });
  } else if (get_all_completed_contracts.status === "SELECT_QUERY_FAILURE") {
    res.status(500).json({
      message: "FETCHING_DATA_FAILED",
    });
  } else if (get_all_completed_contracts.status === "BAD_REQUEST") {
    res.status(400).json({
      message: "REQUEST_ERROR",
    });
  }
};

export async function buyContract(req, res) {
  try {
    let response = await P2PModel.buyContract(req.headers, req.body);
    if (response.message == "CONTRACT_PURCHASE_SUCCESFUL") {
      return res.status(200).json({
        message: response.message,
        details: response.details
      });
    } else if (response.message == "BAD_REQUEST") {
      return res.status(400).json({
        message: response,
      });
    } else {
      return res.status(500).json({
        message: response,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
}

export async function deleteContract(req, res) {
  try {
    let response = await P2PModel.deleteContract(req.headers, req.body);
    if (response.message == "CONTRACT_DELETED") {
      return res.status(200).json({
        message: response.message,
        details: response.details
      });
    } else if (response.message == "BAD_REQUEST") {
      return res.status(400).json({
        message: response,
      });
    } else {
      return res.status(500).json({
        message: response,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
}
