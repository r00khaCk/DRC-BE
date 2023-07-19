export const user_error_codes = {
  // Register
  DUPLICATE_EMAIL: {
    statusCode: 400,
    message: "This email address is already in used",
  },
  PASSWORD_HASHING_ERROR: {
    statusCode: 500,
    message: "Failed: Error during hashing",
  },
  REGISTER_QUERY_FAILED: {
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
  VERIFICATION_ERROR: {
    statusCode: 500,
    message: "Failed to verify account",
  },
  // Login
  INVALID_PASSWORD: {
    statusCode: 400,
    message: "Wrong Password",
  },
  FAILED_TO_SET_TIMESTAMP: {
    statusCode: 500,
    message: "Login Failed. Please try again",
  },
  ACCOUNT_NOT_VERIFIED: {
    statusCode: 400,
    message: "Account is not verified. Please check your email.",
  },
  EMAIL_NOT_EXIST: {
    statusCode: 400,
    message: "User with the given email does not exist",
  },
  // Password Recovery
  FAILED_TO_SEND_EMAIL: {
    statusCode: 500,
    message: "Recovery Password email failed to be sent",
  },
  FAILED_TO_SET_NEW_PASSWORD: {
    statusCode: 500,
    message: "Failed to set new password",
  },
  // Reset Password
  PASSWORD_NEW_SAME_AS_OLD: {
    statusCode: 500,
    message: "New password cannot be the same as old password",
  },
};
