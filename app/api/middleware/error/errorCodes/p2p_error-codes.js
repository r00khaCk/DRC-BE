export const p2p_error_codes = {
  INSUFFICIENT_COIN_AMOUNT: {
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
};
