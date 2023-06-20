import * as UserModel from "../models/users.js";

export async function registerNewUser(req, res) {
  try {
    let user = await UserModel.registerNewUser(req.body);
    res.status(201).json({
      message: "User created",
    });
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
}

export async function loginUser(req, res) {
  try {
    let response = await UserModel.loginUser(req.body);
    res.status(201).json({
      message: response,
    });
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
}
