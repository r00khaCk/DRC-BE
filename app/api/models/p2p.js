import database from "../../services/db.js";
import jwt from "jsonwebtoken";

export const addNewP2PContract = async (
  contract_information,
  request_header
) => {
  /**
   * contract_information = {coin_amount, selling_price, currency}
   * request_header = {email, user_id}
   */

  let user_email = await getEmail(request_header);
  console.log(user_email);
  const { coin_amount, selling_price, currency } = contract_information;

  if (user_email && coin_amount && selling_price && currency) {
    let values = [coin_amount, selling_price, currency, user_email];
  }
};

const getEmail = (req_headers) => {
  console.log(req_headers);
  const token = req_headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  const email = decoded.email;
  return email;
};
