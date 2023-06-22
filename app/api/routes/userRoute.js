import * as express from "express";
import * as UserController from "../controllers/userController.js";
export const router = express.Router();

router.post("/registerUser", UserController.registerNewUser);
router.post("/loginUser", UserController.loginUser);
router.post("/forgotPassword", UserController.forgotPassword);

router.get("/verify/:token", UserController.verifyAccount);
// router.get("/registerUsers/verify/:token", UserController.activateUserAccount);
