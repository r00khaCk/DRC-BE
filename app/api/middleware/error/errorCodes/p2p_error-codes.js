export const p2p_error_codes = {
  INSUFFICIENT_BALANCE: {
    statusCode: 400,
    message: "Insufficient wallet balance",
  },
  CONTRACT_LIMIT_REACHED: {
    statusCode: 400,
    message: "Maximum number of contract reached",
  },
  UPDATE_QUERY_FAILURE: {
    status: 500,
    message: "P2P contract creation failed",
  },
  INPUT_QUERY_FAILURE: {
    statusCode: 500,
    message: "P2P contract creation failed",
  },
  SELECT_QUERY_FAILURE: {
    statusCode: 500,
    message: "Failed to fetch data",
  },
  FAILED_TO_FETCH_CONTRACT: {
    statusCode: 500,
    message: "Contract is not available",
  },
  CANNOT_BUY_OWN_CONTRACT: {
    statusCode: 400,
    message: "Cannot buy own contract",
  },
  FAILED_TO_BUY_CONTRACT: {
    statusCode: 500,
    message: "Failed to buy contract",
  },
  FAILED_TO_WITHDRAW_CONTRACT: {
    statusCode: 500,
    message: "Failed to withdraw contract",
  },
  CANNOT_DELETE_OTHERS_CONTRACT: {
    statusCode: 400,
    message: "Cannot buy own contract",
  },
};
