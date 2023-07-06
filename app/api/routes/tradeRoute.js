import * as express from "express";
import * as TradeController from "../controllers/tradeController.js";
import { checkAuth } from "../middleware/authentication/checkAuth.js";
export const router = express.Router();

router.post("/buy", checkAuth, TradeController.buyTrade);
router.post("/sell", checkAuth, TradeController.sellTrade);
