import database from "../../services/db.js";
import jwt from "jsonwebtoken";
import { getCurrentCoinAmount, getAllWalletBalance } from "./trade.js";

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

    // get currenct coin amount of the user
    let current_coin_amount = await getCurrentCoinAmount(user_email, currency);
    if (current_coin_amount < coin_amount) {
      return { status: "INSUFFICIENT_COIN_AMOUNT" };
    } else {
      // deduct the current coin amount with amount to be sold and update the db
      let new_coin_amount = current_coin_amount - coin_amount;
      try {
        await database.connection.query("BEGIN;");
        let update_coin_amount_result = await updateCoinAmountInWallet(
          new_coin_amount,
          user_email,
          currency
        );
        if (
          update_coin_amount_result.rows.length < 1 &&
          update_coin_amount_result.rows.length > 1
        ) {
          return { status: "UPDATE_QUERY_FAILURE" };
        }

        const add_new_p2p_contract_query =
          "INSERT INTO crypthubschema.p2p_contracts (seller_id, currency, coin_amount, selling_price) SELECT u.id, $1, $2, $3 FROM cryptHubSchema.users as u WHERE u.email = $4";

        const add_new_p2p_contract = await database.connection.query(
          add_new_p2p_contract_query,
          values
        );

        await database.connection.query("COMMIT;");
        let all_wallet_balance = await getAllWalletBalance(user_email);
        return {
          status: "INPUT_QUERY_SUCCESS",
          wallet_balance: all_wallet_balance.balance.rows,
        };
      } catch (error) {
        await database.connection.query("ROLLBACK;");
        console.log(error);
        return { status: "INPUT_QUERY_FAILURE" };
      }
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

//-------FUNCTIONS USED WITHIN THIS MODEL-----------
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

const updateCoinAmountInWallet = async (
  new_coin_amount,
  user_email,
  currency
) => {
  let update_values = [new_coin_amount, user_email, currency];
  const update_coin_amount_query =
    "UPDATE cryptHubSchema.wallet AS w SET amount = $1  FROM cryptHubSchema.users AS u WHERE u.id = w.user_id AND u.email = $2 AND w.currency = $3";
  let update_coin_amount = await database.connection.query(
    update_coin_amount_query,
    update_values
  );
  return update_coin_amount;
  //COIN_AMOUNT_DEDUCTED
};
