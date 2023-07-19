import { body } from "express-validator";

export const buyTradeValidation = [
  body("input_amount")
    .exists({ checkFalsy: false })
    .withMessage("Input amount required")
    .isNumeric()
    .withMessage("Input amount must be a number")
    .isFloat({ gt: 0 })
    .withMessage("Input amount must be greater than 0"),
  body("coin_amount")
    .exists({ checkFalsy: false })
    .withMessage("Coin amount required")
    .isNumeric()
    .withMessage("Coin amount should be a number")
    .isFloat({ gt: 0 })
    .withMessage("Coin amount should be more than 0"),
];

export const sellTradeValidation = [
  body("coin_amount")
    .exists({ checkFalsy: false })
    .withMessage("Coin amount required")
    .isNumeric()
    .withMessage("Coin amount should be a number")
    .isFloat({ gt: 0 })
    .withMessage("Coin amount should be more than 0"),
];
