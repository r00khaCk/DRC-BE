import * as express from "express";
import * as WalletController from "../controllers/walletController.js";
import { walletValidation } from "../middleware/validation/walletValidation.js";
import { checkAuth } from "../middleware/authentication/checkAuth.js";

export const router = express.Router();

router.post(
  "/walletDeposit",
  walletValidation,
  checkAuth,
  WalletController.walletDeposit
);
router.post(
  "/walletWithdraw",
  walletValidation,
  checkAuth,
  WalletController.walletWithdraw
);
router.get("/walletTransaction", checkAuth, WalletController.walletTransaction);
router.get(
  "/currentWalletBalance",
  checkAuth,
  WalletController.getWalletBalance
);
