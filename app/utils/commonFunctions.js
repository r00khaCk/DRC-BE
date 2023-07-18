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

export function formatDate(timestamp) {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}



