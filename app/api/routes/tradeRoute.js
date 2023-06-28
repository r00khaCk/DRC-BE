import * as express from "express";
import * as TradeController from "../controllers/tradeController.js";
export const router = express.Router();

router.post("/buy", TradeController.buyTrade);
router.post("/sell", TradeController.sellTrade);
