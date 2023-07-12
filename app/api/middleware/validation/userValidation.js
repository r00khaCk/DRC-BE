import { body } from "express-validator";

export const userRegistrationValidation = [
  body("name")
    .exists({ checkFalsy: true })
    .withMessage("Name is required")
    .isString()
    .withMessage("Name should be a string")
    .matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9]*$/)
    .withMessage("Only character and number are allowed")
    .isLength({ min: 4, max: 12 }),
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Provide valid email")
    .isString()
    .withMessage("Email should be a string"),
  body("password")
    .exists({ checkFalsy: false })
    .withMessage("Password is required")
    .isString()
    .withMessage("Password should be string")
    .isLength({ min: 8, max: 32 })
    .withMessage("Password should between 8 to 32 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).*$/
    )
    .withMessage(
      "Password should include one lowercase letter, one uppercase letter, one symbol and one digit"
    ),
];

export const userLoginValidation = [
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Provide valid email")
    .isString()
    .withMessage("Email should be a string"),
  body("password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .isString()
    .withMessage("Password should be string")
    .isLength({ min: 8, max: 32 })
    .withMessage("Password should between 8 to 32 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).*$/
    )
    .withMessage(
      "Password should include one lowercase letter, one uppercase letter, one symbol and one digit"
    ),
];

export const forgotPasswordValidation = [
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Provide valid email")
    .isString()
    .withMessage("Email should be a string"),
];

export const resetPasswordValidation = [
  body("old_password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .isString()
    .withMessage("Password should be string")
    .isLength({ min: 8, max: 32 })
    .withMessage("Password should between 8 to 32 characters"),
  body("new_password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .isString()
    .withMessage("Password should be string")
    .isLength({ min: 8, max: 32 })
    .withMessage("Password should between 8 to 32 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).*$/
    )
    .withMessage(
      "Password should include one lowercase letter, one uppercase letter, one symbol and one digit"
    ),
];

// module.exports = { userValidationChainable };
