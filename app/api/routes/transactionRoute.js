import * as express from "express";
import * as TransactionController from "../controllers/transactionController.js";
import { checkAuth } from "../middleware/authentication/checkAuth.js";
export const router = express.Router();

router.get(
  "/getAllTransactions",
  checkAuth,
  TransactionController.getAllTransactions
);
