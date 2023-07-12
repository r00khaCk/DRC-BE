import { body } from "express-validator";

export const tradeValidation = [
  body("coin_amount")
    .exists({ checkFalsy: false })
    .withMessage("Coin amount required")
    .isNumeric()
    .withMessage("Coin amount should be a number")
    .isFloat({ gt: 0 })
    .withMessage("Coin amount should be more than 0"),
];
