import jwt from "jsonwebtoken";

const env = process.env;

export function getEmail(req_headers) {
  const token = req_headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  const email = decoded.email;
  return email;
}

export function getID(req_headers) {
  const token = req_headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  const id = decoded.id;
  return id;
}
