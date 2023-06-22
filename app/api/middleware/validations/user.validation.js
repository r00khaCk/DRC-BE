import { body } from "express-validator";

const userValidationChainable = [
  body("name")
    .exists({ checkFalsy: true })
    .withMessage("Name is required")
    .isString()
    .withMessage("Name should be a string"),
  body("email")
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage("Provide valid email"),
  body("password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .isString()
    .withMessage("Password should be string")
    .isLength({ min: 5 })
    .withMessage("Password should be at least 5 characters"),
];

module.exports = { userValidationChainable };
