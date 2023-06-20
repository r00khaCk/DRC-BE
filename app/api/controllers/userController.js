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
