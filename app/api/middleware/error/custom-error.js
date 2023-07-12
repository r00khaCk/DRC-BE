// class handles custom errors raised by the application through the code

export class CustomError extends Error {
  constructor(code) {
    super();
    this.code = code;
  }
}
