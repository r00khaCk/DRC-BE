import { p2p_error_codes } from "./errorCodes/p2p_error-codes.js";
import { trade_error_codes } from "./errorCodes/trade_error_codes.js";
import { transaction_error_codes } from "./errorCodes/transaction_error_codes.js";
import { user_error_codes } from "./errorCodes/users_error_codes.js";

export const errorHandler = (err, req, res, next) => {
  const code = (err && err.code) || null;
  const error =
    p2p_error_codes[code] ||
    trade_error_codes[code] ||
    transaction_error_codes[code] ||
    user_error_codes[code] ||
    error_codes["INTERNAL_ERROR"];

  return res.status(error.statusCode).json({ message: error.message });
};
