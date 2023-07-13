import * as express from "express";
import * as TradeController from "../controllers/tradeController.js";
import { checkAuth } from "../middleware/authentication/checkAuth.js";
import { tradeValidation } from "../middleware/validation/tradeValidation.js";
export const router = express.Router();

router.post("/buy", checkAuth, tradeValidation, TradeController.buyTrade);
router.post("/sell", checkAuth, tradeValidation, TradeController.sellTrade);
