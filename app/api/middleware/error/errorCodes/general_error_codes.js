export const general_error_codes = {
  BAD_REQUEST: {
    statusCode: 400,
    message: "Error in request",
  },
  INTERNAL_ERROR: {
    statusCode: 500,
    message: "Internal server error",
  },
  FAILED_TO_GET_BALANCE: {
    statusCode: 500,
    message: "Failed to get wallet's balance",
  },
  FAILED_TO_GET_TRANSACTION_RECORD: {
    statusCode: 500,
    message: "Failed to get transaction record",
  },
};
