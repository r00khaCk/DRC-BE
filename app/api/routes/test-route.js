
import { Router } from "express";

export const promiseHandler = (func) =>  ((req, res, next) => {
    Promise.resolve(func(req, res, next)).catch(next)
})



export const testHandler = promiseHandler(async () => {
    throw new Error("Test")
})

const testRouter = Router();
testRouter.route("/").get(testHandler)

export default testRouter;