import { validationResult } from "express-validator";
import * as UserModel from "../models/users.js";

export const registerNewUser = async (req, res, next) => {
  try {
    // handles errors from the user validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        validation: "failed",
        errors: errors.array(),
      });
    }
    await UserModel.registerNewUserModel(req.body);
    if (!sendVerificationEmail(req.body)) {
      return res.status(500).json({
        message: "VERIFICATION_EMAIL_ERROR",
      });
    }
    return res.status(201).json({
      message: "USER_CREATED",
    });
    // catches error in the request body, i.e: missing key when post request is sent
  } catch (err) {
    next(err);
  }
};

export const verifyAccount = async (req, res) => {
  try {
    let user_email_url = req.query.email;

    const email = { email: user_email_url };
    let check_token = await UserModel.verifyToken(req.params);
    if (check_token === "INVALID_TOKEN") {
      //check if the account has been verified after first INVALID_TOKEN is received and email verification is sent again
      let account_verify_check =
        await UserModel.checkIfAccountHasBeenVerifiedAfterVerificationEmailExpired(
          email
        );
      if (account_verify_check.rows[0].account_verified == false) {
        sendVerificationEmail(email);
        return res.render("resendVerificationEmailView");
      } else {
        return res.render("verifiedAccountView");
      }
    } else if (check_token === "VALID_TOKEN") {
      await UserModel.changeAccountStatus(email);
      return res.render("verifiedAccountView");
    }
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
};

export const sendVerificationEmail = async (userDetails, res) => {
  try {
    UserModel.sendVerificationEmailModel(userDetails);
  } catch (err) {
    return res.status(500).json({
      error: err,
    });
  }
};

export async function loginUser(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    let response = await UserModel.loginUser(req.body);
    return res.status(201).json({
      message: response.message,
      details: response.details,
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    // handles errors from the user validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        validation: "failed",
        errors: errors.array(),
      });
    }
    let response = await UserModel.forgotPassword(req.body);
    return res.status(200).json({
      message: response,
    });
  } catch (err) {
    next(err);
  }
}

export async function passwordRecovery(req, res, next) {
  try {
    let user_email_url = req.query.email;
    const email = { email: user_email_url };
    let check_token = await UserModel.verifyToken(req.params);
    if (check_token == "VALID_TOKEN") {
      await UserModel.passwordRecovery(email);
      return res.render("passwordRecoveryView");
    } else if (check_token == "INVALID_TOKEN") {
      return res.render("passwordRecoveryExpireView");
    }
  } catch (err) {
    next(err);
  }
}
export async function resetPassword(req, res, next) {
  try {
    let response = await UserModel.resetPassword(req.headers, req.body);
    return res.status(201).json({
      message: response,
    });
  } catch (err) {
    next(err);
  }
}

export async function logoutUser(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    let response = await UserModel.logoutUser(token);
    res.status(200).json({
      message: response,
    });
  } catch (err) {
    next(err);
  }
}

export async function checkBlacklist(req, res) {
  try {
    let response = await UserModel.checkBlacklist(req.body);
    res.status(200).json({
      message: response,
    });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
}
