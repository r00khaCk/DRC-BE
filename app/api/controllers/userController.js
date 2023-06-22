import * as UserModel from "../models/users.js";

export const registerNewUser = async (req, res) => {
  try {
    let user = await UserModel.registerNewUser(req.body);
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
