import * as express from "express";
import * as WalletController from "../controllers/walletController.js";
import { checkAuth } from "../middleware/authentication/checkAuth.js";

export const router = express.Router();

router.post("/walletDeposit", checkAuth, WalletController.walletDeposit);
router.post("/walletWithdraw", checkAuth, WalletController.walletWithdraw);
router.get("/walletTransaction", checkAuth, WalletController.walletTransaction);
router.get(
  "/currentWalletBalance",
  checkAuth,
  WalletController.getWalletBalance
);
