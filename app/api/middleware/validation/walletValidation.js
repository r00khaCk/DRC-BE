import { body } from "express-validator";

export const walletValidation = [
  body("amount")
    .exists({ checkFalsy: true })
    .withMessage("Amount is required")
    .isNumeric()
    .withMessage("Amount should be a number")
    .isFloat({ gt: 0 })
    .isLength({ max: 30000 })
    .withMessage("Maximum amount of deposit is 30,000"),
];
