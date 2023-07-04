import database from "../../services/db.js";
import jwt from "jsonwebtoken";

const env = process.env;

export const addNewP2PContractModel = async (
  contract_information,
  request_header
) => {
  /**
   * contract_information = {coin_amount, selling_price, currency}
   * request_header = {email, user_id}
   */
  let user_email = await getEmail(request_header);
  const { currency, coin_amount, selling_price } = contract_information;

  if (user_email && coin_amount && selling_price && currency) {
    let values = [currency, coin_amount, selling_price, user_email];
    const add_new_p2p_contract_query =
      "INSERT INTO crypthubschema.p2p_contracts (seller_id, currency, coin_amount, selling_price) SELECT u.id, $1, $2, $3 FROM cryptHubSchema.users as u WHERE u.email = $4";
    try {
      const add_new_p2p_contract = await database.connection.query(
        add_new_p2p_contract_query,
        values
      );

      return { status: "INPUT_QUERY_SUCCESS" };
    } catch (error) {
      console.log("Error from add_new_p2p_contract", new Error(error));
      return { status: "INPUT_QUERY_FAILURE" };
    }
  } else {
    return { status: "BAD_REQUEST" };
  }
};

const getEmail = (req_headers) => {
  console.log(req_headers);
  const token = req_headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  const email = decoded.email;
  return email;
};
