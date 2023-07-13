import { p2p_error_codes } from "./errorCodes/p2p_error-codes.js";
import { trade_error_codes } from "./errorCodes/trade_error_codes.js";
import { user_error_codes } from "./errorCodes/users_error_codes.js";
import { general_error_codes } from "./errorCodes/general_error_codes.js";
import { wallet_error_codes } from "./errorCodes/wallet_error_codes.js";

export const errorHandler = (err, req, res, next) => {
  const code = (err && err.code) || null;
  const error = general_error_codes[code] ||
    wallet_error_codes[code] ||
    p2p_error_codes[code] ||
    trade_error_codes[code] ||
    user_error_codes[code] || {
      statusCode: 500,
      message: "Internal Server Error",
    };

  return res.status(error.statusCode).json({ message: error.message });
};
