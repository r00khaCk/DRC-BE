import database from "../../services/db.js";
import jwt from "jsonwebtoken";

const env = process.env;

// adds new P2P contracts into the marketplace
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

//get all open contracts
export const getOpenContractsModel = async () => {
  const get_all_openContracts_query =
    "SELECT * FROM cryptHubSchema.p2p_contracts";
  try {
    let get_all_openContracts = await database.connection.query(
      get_all_openContracts_query
    );
    return { status: "SELECT_QUERY_SUCCESS", data: get_all_openContracts.rows };
  } catch (error) {
    console.log(error);
    return { status: "SELECT_QUERY_FAILURE" };
  }
};

// get ongoing contracts for specific user
export const getOngoingContractsModel = async (request_header) => {
  let user_id = await getUserId(request_header);

  if (user_id) {
    let value = [user_id];
    const get_ongoing_contracts_query =
      "SELECT * FROM cryptHubSchema.p2p_contracts WHERE seller_id = $1";
    try {
      let get_ongoing_contracts = await database.connection.query(
        get_ongoing_contracts_query,
        value
      );
      return {
        status: "SELECT_QUERY_SUCCESS",
        data: get_ongoing_contracts.rows,
      };
    } catch (error) {
      console.log(error);
      return { status: "SELECT_QUERY_FAILURE" };
    }
  } else {
    return { status: "BAD_REQUEST" };
  }
};

const getUserId = (req_headers) => {
  const token = req_headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  const id = decoded.id;
  return id;
};

const getEmail = (req_headers) => {
  //   console.log(req_headers);
  const token = req_headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  const email = decoded.email;
  return email;
};
