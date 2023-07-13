import { body } from "express-validator";

export const p2pValidation = [
  body("coin_amount")
    .exists({ checkFalsy: true })
    .withMessage("Coin amount is required")
    .isNumeric()
    .withMessage("Coin amount should be a number")
    .isFloat({ gt: 0, lt: 101 })
    .withMessage("Coin amount should be more than 0")
    .withMessage("Coin amount must be less than or equal to 100"),

  body("selling_price")
    .isNumeric()
    .withMessage("Coin amount should be a number")
    .isFloat({ gt: 0 })
    .withMessage("Coin amount should be more than 0"),
];
