export const p2p_error_codes = {
  INSUFFICIENT_COIN_AMOUNT: {
    statusCode: 400,
    message: "Insufficient wallet balance",
  },
  CONTRACT_LIMIT_REACHED: {
    statusCode: 400,
    message: "Maximum number of contract reached",
  },
  BAD_REQUEST: {
    statusCode: 400,
    message: "Error in request",
  },
  UPDATE_QUERY_FAILURE: {
    status: 500,
    message: "P2P contract creation failed",
  },
  INPUT_QUERY_FAILURE: {
    statusCode: 500,
    message: "P2P contract creation failed",
  },
  INTERNAL_ERROR: {
    statusCode: 500,
    message: "Internal server error",
  },
  SELECT_QUERY_FAILURE: {
    statusCode: 500,
    message: "Failed to fetch data",
  },
};
