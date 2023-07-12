export const trade_error_codes = {
  BALANCE_INSUFFICIENT: {
    statusCode: 400,
    message: "Insufficienct USD wallet balance",
  },
  INSUFFICIENT_COIN_AMOUNT: {
    statusCode: 400,
    message: "Insufficient coin amount to be sold",
  },
  QUERY_FAILED: {
    statusCode: 500,
    message: "Transaction failed. Please try again",
  },
  BAD_REQUEST: {
    statusCode: 400,
    message: "Error in request",
  },
  BUY_ERROR: {
    statusCode: 500,
    message: "Error during buy process",
  },

  SELL_ERROR: {
    statusCode: 500,
    message: "Error during sell process",
  },
  QUERY_ERROR: {
    statusCode: 500,
    message: "Internal query error",
  },
};
