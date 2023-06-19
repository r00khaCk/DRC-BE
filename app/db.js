import pg from 'pg';
const { Pool } = pg;
import  config  from './app_config.js';
const db_config = config.db;
const connectionString = 'postgresql://'+db_config.user+':'+db_config.password+'@'+db_config.host+':'+db_config.port+'/'+db_config.database;
const pool = new Pool({connectionString});


async function queryByCallback(query, params, callback) {
  let error, result;
  try {
    result = await pool.query(query, params);
    // pool.end();
  } catch(e) {
    error = e;
  } finally {
    callback(error, result);
  }
}

//Checkout, use, and return
async function queryByPromise(query) {
  let response = {};
  await pool
  .connect()
  .then(client => {
    return client
      .query(query)
      .then(res => {
        client.release()
        response.result = res.rows
      })
      .catch(err => {
        client.release()
        console.log(err.stack)
        response.error = e.stack
      })
  });
  return response;
}


const exportFuncs = {
  queryByCallback,
  connection: pool,
  queryByPromise
};

export default exportFuncs;
