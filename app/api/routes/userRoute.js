import * as express from "express";
import * as UserController from "../controllers/userController.js";
import {
  userRegistrationValidation,
  userLoginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from "../middleware/validation/userValidation.js";
import { checkAuth } from "../middleware/authentication/checkAuth.js";
export const router = express.Router();

router.post(
  "/registerUser",
  userRegistrationValidation,
  UserController.registerNewUser
);
router.post("/loginUser", userLoginValidation, UserController.loginUser);
router.post(
  "/forgotPassword",
  forgotPasswordValidation,
  UserController.forgotPassword
);
router.post(
  "/resetPassword",
  resetPasswordValidation,
  checkAuth,
  UserController.resetPassword
);
router.post("/logoutUser", checkAuth, UserController.logoutUser);
router.post("/checkBlacklist", UserController.checkBlacklist);

router.get("/verify/:token", UserController.verifyAccount);
router.get("/passwordRecovery/:token", UserController.passwordRecovery);
