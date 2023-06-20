import * as express from "express";
import * as UserController from "../controllers/userController.js";
export const router = express.Router();

router.post("/registerUsers", UserController.registerNewUser);
router.post("/loginUser", UserController.loginUser);

