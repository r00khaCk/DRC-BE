import * as express from "express";
import * as TradeController from "../controllers/tradeController.js";
import { checkAuth } from "../middleware/authentication/checkAuth.js";
import {
  buyTradeValidation,
  sellTradeValidation,
} from "../middleware/validation/tradeValidation.js";
export const router = express.Router();

router.post("/buy", checkAuth, buyTradeValidation, TradeController.buyTrade);
router.post("/sell", checkAuth, sellTradeValidation, TradeController.sellTrade);
