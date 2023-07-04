import * as P2PModel from "../models/p2p.js";

export const addP2PContract = async (req, res) => {
  let p2p_contract = await P2PModel.addNewP2PContract(req.body, req.headers);
  if (p2p_contract.status === "INPUT_QUERY_SUCCESS") {
    res.status(201).json({ message: "CONTRACT_ADDED" });
  } else if (p2p_contract.status === "INPUT_QUERY_FAILURE") {
    res.status(500).json({ message: "CONTRACT_CREATION_ERROR" });
  } else if (p2p_contract.status === "BAD_REQUEST") {
    res.status(400).json({ message: "REQUEST_ERROR" });
  }
};
