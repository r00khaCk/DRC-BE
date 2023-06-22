import * as UserModel from "../models/users.js";

export const registerNewUser = async (req, res, next) => {
  try {
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
    return res.status(500).json({
      error: err,
    });
  }
};

export async function loginUser(req, res) {
  try {
    let response = await UserModel.loginUser(req.body);
    if (response !== "EMAIL_NOT_EXIST" && response !== "INVALID_PASSWORD") {
      return res.status(201).json({
        message: "LOGIN_SUCCESSFUL",
        token: response,
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

export const verifyAccount = async (req, res) => {
  try {
    // console.log("req.params", req);
    let account_verified = await UserModel.verifyAccountModel(req.params);
    console.log(account_verified);
    if (account_verified === "INVALID_TOKEN") {
      return res.status(401).json({
        message: "INVALID_TOKEN",
      });
    } else if (account_verified === "VALID_TOKEN") {
      return res.render("verifiedAccountView");
      // return res.status(200).json({
      //   message: "VALID_TOKEN",
      // });
    }
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
};

const sendVerificationEmail = async (userDetails, res) => {
  try {
    UserModel.sendVerificationEmailModel(userDetails);
  } catch (err) {
    return res.status(500).json({
      error: err,
    });
  }
};
