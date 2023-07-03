import * as express from "express";
import * as UserController from "../controllers/userController.js";
import * as UserValidation from "../middleware/validation/userValidation.js";
import { checkAuth } from "../middleware/authentication/checkAuth.js";
export const router = express.Router();

router.post(
  "/registerUser",
  UserValidation.userRegistrationValidation,
  UserController.registerNewUser
);
router.post(
  "/loginUser",
  UserValidation.userLoginValidation,
  UserController.loginUser
);
router.post("/forgotPassword", UserController.forgotPassword);
router.post("/resetPassword", checkAuth, UserController.resetPassword);
router.post("/logoutUser", checkAuth, UserController.logoutUser);
router.post("/checkBlacklist", UserController.checkBlacklist);

router.get("/verify/:token", UserController.verifyAccount);
// router.get("/registerUsers/verify/:token", UserController.activateUserAccount);
