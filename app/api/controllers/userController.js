import { validationResult } from "express-validator";
import * as UserModel from "../models/users.js";

export const registerNewUser = async (req, res, next) => {
  try {
    // handles errors from the user validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    let user = await UserModel.registerNewUserModel(req.body);
    // error responses
    if (user === "DUPLICATE_EMAIL") {
      return res.status(400).json({
        message: "DUPLICATE_EMAIL",
      });
    } else if (user === "PASSWORD_HASHING_ERROR") {
      return res.status(500).json({
        message: "PASSWORD_HASHING_ERROR",
      });
    }
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
    return res.status(500).json({
      error: err,
    });
  }
};

export const verifyAccount = async (req, res) => {
  try {
    let user_email_url = req.query.email;
    console.log("user email from verify token: ", user_email_url);

    const email = { email: user_email_url };
    let account_verified = await UserModel.verifyAccountModel(req.params);
    console.log(account_verified);
    if (account_verified === "INVALID_TOKEN") {
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
    } else if (account_verified === "VALID_TOKEN") {
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

export async function loginUser(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    let response = await UserModel.loginUser(req.body);

    if (
      response !== "EMAIL_NOT_EXIST" &&
      response !== "INVALID_PASSWORD" &&
      response !== "ACCOUNT_NOT_VERIFIED"
    ) {
      return res.status(201).json({
        message: "LOGIN_SUCCESSFUL",
        token: response,
      });
    } else if (response == "ACCOUNT_NOT_VERIFIED") {
      if (!sendVerificationEmail(req.body)) {
        return res.status(500).json({
          message: "VERIFICATION_EMAIL_ERROR",
        });
      }
      return res.status(201).json({
        message: response,
      });
    } else
      res.status(400).json({
        message: response,
      });
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
}

export async function forgotPassword(req, res) {
  try {
    let response = await UserModel.forgotPassword(req.body);
    if (response !== "EMAIL_NOT_EXIST") {
      return res.status(201).json({
        message: response,
      });
    } else
      res.status(500).json({
        message: response,
      });
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
}
