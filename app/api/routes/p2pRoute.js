import * as express from "express";
import * as P2PController from "../controllers/p2pController.js";
import { checkAuth } from "../middleware/authentication/checkAuth.js";
import { p2pValidation } from "../middleware/validation/p2pValidation.js";
export const router = express.Router();

router.post(
  "/addP2PContract",
  checkAuth,
  p2pValidation,
  P2PController.addP2PContract
);
router.post("/buyContract", checkAuth, P2PController.buyContract);
router.post("/deleteContract", checkAuth, P2PController.deleteContract);
router.get("/getOpenContracts", P2PController.getAllOpenContracts);
router.get(
  "/getOngoingContracts",
  checkAuth,
  P2PController.getOngoingContracts
);
router.get(
  "/getCompletedContracts",
  checkAuth,
  P2PController.getAllCompletedP2PContracts
);
