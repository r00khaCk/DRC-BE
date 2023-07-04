import * as express from "express";
import * as P2PController from "../controllers/p2pController.js";
import { checkAuth } from "../middleware/authentication/checkAuth.js";
export const router = express.Router();
