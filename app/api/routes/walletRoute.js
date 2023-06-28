import * as express from "express";
import * as WalletController from "../controllers/walletController.js";
import { checkAuth } from "../middleware/authentication/checkAuth.js";

export const router = express.Router();

router.post("/walletDeposit", checkAuth, WalletController.walletDeposit);
