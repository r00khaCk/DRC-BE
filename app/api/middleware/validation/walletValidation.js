import { body } from "express-validator";

export const walletValidation = [
  body("amount")
    .exists({ checkFalsy: true })
    .withMessage("Amount is required")
    .isNumeric()
    .withMessage("Amount should be a number")
    .isFloat({ lt: 30001, gt: 0 })
    .withMessage("Maximum amount of deposit is 30,000"),
];
