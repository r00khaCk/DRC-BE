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
          await database.connection.query("ROLLBACK;");
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
  let user_id = await getID(request_header);

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

export async function buyContract(req_headers, req_body) {
  try {
    const buyer_id = await getID(req_headers);
    const { contract_id } = req_body;
    let contract_currency, contract_currency_id;
    if (buyer_id && contract_id) {
      const query_contract = await database.connection.query(
        "SELECT * FROM crypthubschema.p2p_contracts WHERE contract_id = $1",
        [contract_id]
      );
      if (query_contract.rows.length == 0) return "FAILED_TO_FETCH_CONTRACT";
      const seller_id = query_contract.rows[0].seller_id;
      if (buyer_id == seller_id) {
        return "CANNOT_BUY_OWN_CONTRACT";
      }
      switch (query_contract.rows[0].currency) {
        case "BTC":
          contract_currency_id = 1;
          contract_currency = "BTC";
          break;
        case "ETH":
          contract_currency_id = 2;
          contract_currency = "ETH";
          break;
      }
      await database.connection.query("BEGIN;");
      // Query for Buyer
      let query_buyer = await database.connection.query(
        "SELECT * FROM crypthubschema.wallet JOIN crypthubschema.users ON user_id = id WHERE id = $1 ORDER BY wallet_id ASC",
        [buyer_id]
      );
      if (query_buyer.rows.length == 0) return "FAILED_TO_FETCH_BUYER";
      const final_USD_buyer =
        query_buyer.rows[0].amount - query_contract.rows[0].selling_price;
      if (final_USD_buyer < 0) return "INSUFFICIENT_BALANCE";
      // Update buyer's USD
      const query_update_buyer_USD = await database.connection.query(
        "UPDATE crypthubschema.wallet SET amount = $1 WHERE user_id = $2 AND currency = 'USD' RETURNING *",
        [final_USD_buyer, buyer_id]
      );
      if (query_update_buyer_USD.rows.length == 0) {
        await database.connection.query("ROLLBACK;");
        return "FAILED_TO_BUY_CONTRACT";
      }
      // Update buyer's Coin
      const final_coin_buyer =
        query_buyer.rows[contract_currency_id].amount +
        query_contract.rows[0].coin_amount;
      const query_update_coin_buyer = await database.connection.query(
        "UPDATE crypthubschema.wallet SET amount = $1 WHERE user_id = $2 AND currency = $3 RETURNING *",
        [final_coin_buyer, buyer_id, contract_currency]
      );
      if (query_update_coin_buyer.rows.length == 0) {
        await database.connection.query("ROLLBACK;");
        return "FAILED_TO_BUY_CONTRACT";
      }
      // Query for Seller
      const query_seller = await database.connection.query(
        "SELECT * FROM crypthubschema.wallet JOIN crypthubschema.users ON user_id = id WHERE id = $1 ORDER BY wallet_id ASC",
        [seller_id]
      );
      if (query_seller.rows.length == 0) return "FAILED_TO_FETCH_SELLER";
      const final_USD_seller =
        query_seller.rows[0].amount + query_contract.rows[0].selling_price;
      // Update seller's USD
      const query_update_seller_USD = await database.connection.query(
        "UPDATE crypthubschema.wallet SET amount = $1 WHERE user_id = $2 AND currency = 'USD' RETURNING *",
        [final_USD_seller, seller_id]
      );
      if (query_update_seller_USD.rows.length == 0) {
        await database.connection.query("ROLLBACK;");
        return "FAILED_TO_BUY_CONTRACT";
      }
      // Insert into completed contract
      const query_completed = await database.connection.query(
        "INSERT INTO crypthubschema.p2p_completed (contract_id, seller_id, buyer_id, currency, coin_amount, selling_price, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
        [
          contract_id,
          seller_id,
          buyer_id,
          query_contract.rows[0].currency,
          query_contract.rows[0].coin_amount,
          query_contract.rows[0].selling_price,
          query_contract.rows[0].created_at,
        ]
      );
      if (query_completed.rows.length == 0) {
        await database.connection.query("ROLLBACK;");
        return "FAILED_TO_BUY_CONTRACT";
      }
      // Delete from open contract
      const query_delete = await database.connection.query(
        "DELETE FROM crypthubschema.p2p_contracts WHERE contract_id = $1 RETURNING *",
        [contract_id]
      );
      if (query_delete.rows.length == 0) {
        await database.connection.query("ROLLBACK;");
        return "FAILED_TO_BUY_CONTRACT";
      }
      query_buyer = await database.connection.query(
        "SELECT * FROM crypthubschema.wallet JOIN crypthubschema.users ON user_id = id WHERE id = $1 ORDER BY wallet_id ASC",
        [buyer_id]
      );
      if (query_buyer.rows.length == 0) return "FAILED_TO_FETCH_BUYER";
      await database.connection.query("COMMIT;");
      return {
        message: "CONTRACT_PURCHASE_SUCCESFUL",
        details: {
          USD: query_buyer.rows[0].amount,
          BTC: query_buyer.rows[1].amount,
          ETH: query_buyer.rows[2].amount,
        },
      };
    } else {
      return "BAD_REQUEST";
    }
  } catch (error) {
    console.log(error);
    await database.connection.query("ROLLBACK;");
    return "REQUEST_FAILED";
  }
}

export async function deleteContract(req_headers, req_body) {
  try {
    const user_id = await getID(req_headers);
    const { contract_id } = req_body;
    let contract_currency, contract_currency_id;
    if (user_id && contract_id) {
      const query_contract = await database.connection.query(
        "SELECT * FROM crypthubschema.p2p_contracts WHERE contract_id = $1",
        [contract_id]
      );
      if (query_contract.rows.length == 0) return "FAILED_TO_FETCH_CONTRACT";
      switch (query_contract.rows[0].currency) {
        case "BTC":
          contract_currency_id = 1;
          contract_currency = "BTC";
          break;
        case "ETH":
          contract_currency_id = 2;
          contract_currency = "ETH";
          break;
      }
      if (user_id != query_contract.rows[0].seller_id)
        return "FAILED_TO_DELETE_CONTRACT";
      await database.connection.query("BEGIN;");
      // Query for user
      let query_user = await database.connection.query(
        "SELECT * FROM crypthubschema.wallet JOIN crypthubschema.users ON user_id = id WHERE id = $1 ORDER BY wallet_id ASC",
        [user_id]
      );
      if (query_user.rows.length == 0) return "FAILED_TO_FETCH_USER";
      // Reimburse user's coin
      const final_coin_user =
        query_user.rows[contract_currency_id].amount +
        query_contract.rows[0].coin_amount;
      const query_update_coin_user = await database.connection.query(
        "UPDATE crypthubschema.wallet SET amount = $1 WHERE user_id = $2 AND currency = $3 RETURNING *",
        [final_coin_user, user_id, contract_currency]
      );
      if (query_update_coin_user.rows.length == 0) {
        await database.connection.query("ROLLBACK;");
        return "FAILED_TO_UPDATE_USER_COIN";
      }
      // Insert contract into deleted
      const query_delete_history = await database.connection.query(
        "INSERT INTO crypthubschema.p2p_deleted (contract_id, seller_id, currency, coin_amount, selling_price, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
        [
          contract_id,
          user_id,
          query_contract.rows[0].currency,
          query_contract.rows[0].coin_amount,
          query_contract.rows[0].selling_price,
          query_contract.rows[0].created_at,
        ]
      );
      if (query_delete_history.rows.length == 0) {
        await database.connection.query("ROLLBACK;");
        return "FAILED_TO_INSERT_INTO_HISTORY";
      }
      // Delete from open contract
      const query_delete = await database.connection.query(
        "DELETE FROM crypthubschema.p2p_contracts WHERE contract_id = $1 RETURNING *",
        [contract_id]
      );
      if (query_delete.rows.length == 0) {
        await database.connection.query("ROLLBACK;");
        return "FAILED_TO_DELETE_CONTRACT";
      }
      query_user = await database.connection.query(
        "SELECT * FROM crypthubschema.wallet JOIN crypthubschema.users ON user_id = id WHERE id = $1 ORDER BY wallet_id ASC",
        [user_id]
      );
      if (query_user.rows.length == 0) return "FAILED_TO_FETCH_USER";
      await database.connection.query("COMMIT;");
      return {
        message: "CONTRACT_DELETED",
        details: {
          USD: query_user.rows[0].amount,
          BTC: query_user.rows[1].amount,
          ETH: query_user.rows[2].amount,
        },
      };
    } else {
      return "BAD_REQUEST";
    }
  } catch (error) {
    console.log(error);
    await database.connection.query("ROLLBACK;");
    return "REQUEST_FAILED";
  }
}

// gets all the completed p2p contracts for users [bought, sold and deleted]
export const getAllCompletedP2PContracts = async (request_header) => {
  let user_id = await getID(request_header);
  console.log(user_id);
  let value = [user_id];
  if (user_id) {
    try {
      await database.connection.query("BEGIN;");
      const get_all_completed_contracts_query =
        "select seller_id, buyer_id from crypthubschema.p2p_completed";

      let get_all_completed_contracts_result = await database.connection.query(
        get_all_completed_contracts_query
      );

      let seller_ids = get_all_completed_contracts_result.rows.map(
        (row) => row.seller_id
      );

      let buyer_ids = get_all_completed_contracts_result.rows.map(
        (row) => row.buyer_id
      );

      if (seller_ids.includes(user_id)) {
        const get_all_completed_seller_contracts_query =
          "SELECT p.contract_id,p.seller_id,p.currency,p.coin_amount,p.selling_price,p.created_at,p.completed_at, CASE WHEN p.seller_id = $1 THEN 'sold' ELSE 'bought' END AS transaction_type FROM crypthubschema.p2p_completed AS p WHERE p.seller_id = $1 UNION SELECT d.*, 'delete' AS transaction_type FROM crypthubschema.p2p_deleted AS d WHERE d.seller_id = $1 ORDER BY completed_at DESC";
        let get_all_completed_seller_contracts =
          await database.connection.query(
            get_all_completed_seller_contracts_query,
            value
          );
        return {
          status: "SELECT_QUERY_SUCCESS",
          data: get_all_completed_seller_contracts.rows,
        };
      } else if (buyer_ids.includes(user_id)) {
        const get_all_completed_buyer_contracts_query =
          "SELECT p.contract_id,p.seller_id,p.currency,p.coin_amount,p.selling_price,p.created_at,p.completed_at, CASE WHEN p.buyer_id = $1 THEN 'bought' ELSE 'sold' END AS transaction_type FROM crypthubschema.p2p_completed AS p WHERE p.buyer_id = $1 UNION SELECT d.*, 'delete' AS transaction_type FROM crypthubschema.p2p_deleted AS d WHERE d.seller_id = $1 ORDER BY completed_at DESC";
        let get_all_completed_buyer_contracts = await database.connection.query(
          get_all_completed_buyer_contracts_query,
          value
        );
        await database.connection.query("COMMIT;");
        return {
          status: "SELECT_QUERY_SUCCESS",
          data: get_all_completed_buyer_contracts.rows,
        };
      } else {
        await database.connection.query("ROLLBACK;");
        return { status: "NO_CONTRACTS_FETCHED" };
      }
    } catch (error) {
      await database.connection.query("ROLLBACK;");
      console.log(error);
      return { status: "SELECT_QUERY_FAILURE" };
    }
  } else {
    return { status: "BAD_REQUEST" };
  }
};

//-------FUNCTIONS USED WITHIN THIS MODEL-----------
const getEmail = (req_headers) => {
  const token = req_headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  const email = decoded.email;
  return email;
};

function getID(req_headers) {
  const token = req_headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, env.SECRET_KEY);
  const id = decoded.id;
  return id;
}

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
