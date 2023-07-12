export const user_error_codes = {
  DUPLICATE_EMAIL: {
    statusCode: 400,
    message: "This email address exists",
  },
  PASSWORD_HASHING_ERROR: {
    statusCode: 500,
    message: "Failed to create user",
  },
  QUERY_FAILED: {
    statusCode: 500,
    message: "Failed to create user",
  },
  BAD_REQUEST: {
    statusCode: 400,
    message: "Error in request",
  },
  VERIFICATION_EMAIL_ERROR: {
    statusCode: 500,
    message: "Verification email failed to be sent",
  },
  INTERNAL_ERROR: {
    statusCode: 500,
    message: "Internal server error",
  },
  INVALID_TOKEN: {
    statusCode: 400,
    message: "Verification token is invalid",
  },
  QUERY_ERROR: {
    statusCode: 500,
    message: "Failed to verify account",
  },
};
