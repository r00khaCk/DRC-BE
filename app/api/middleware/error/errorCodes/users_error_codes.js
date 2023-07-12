export const user_error_codes = {
  DUPLICATE_EMAIL: {
    statusCode: 400,
    message: "This email address already exists",
  },
  PASSWORD_HASHING_ERROR: {
    statusCode: 500,
    message: "Failed to create user",
  },
  QUERY_FAILED: {
    statusCode: 500,
    message: "Failed to create user",
  },
  VERIFICATION_EMAIL_ERROR: {
    statusCode: 500,
    message: "Verification email failed to be sent",
  },
  INVALID_TOKEN: {
    statusCode: 400,
    message: "Verification token is invalid",
  },
  QUERY_ERROR: {
    statusCode: 500,
    message: "Failed to verify account",
  },
  U_INVALID_PASSWORD: {
    statusCode: 400,
    message: "Wrong Password",
  },
  U_FAILED_TO_SET_TIMESTAMP: {
    statusCode: 500,
    message: "Failed to set timestamp",
  },
  U_ACCOUNT_NOT_VERIFIED: {
    statusCode: 400,
    message: "Account is not verified",
  },
  U_EMAIL_NOT_EXIST: {
    statusCode: 400,
    message: "Email does not exist",
  },
  U_FAILED_TO_SEND_EMAIL: {
    statusCode: 500,
    message: "Failed to send email for password recovery",
  },
  U_FAILED_TO_SET_NEW_PASSWORD: {
    statusCode: 500,
    message: "Failed to set new password",
  },
};
