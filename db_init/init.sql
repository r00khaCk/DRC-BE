-- Connect to the newly created database
\c crypthub_db_2;


CREATE SCHEMA IF NOT EXISTS cryptHubSchema;

-- Create the "users" table
CREATE TABLE cryptHubSchema.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  password VARCHAR(150),
  account_verified BOOLEAN,
  last_login TIMESTAMP
);

CREATE TABLE cryptHubSchema.wallet (
  wallet_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES cryptHubSchema.users(id),
  currency TEXT,
  amount FLOAT,
  CONSTRAINT unique_user_currency UNIQUE (user_id, currency)
);

CREATE TYPE tradeType AS ENUM ('buy','sell');
CREATE TABLE cryptHubSchema.transactions (
  transaction_id SERIAL PRIMARY KEY,
  wallet_id INT REFERENCES cryptHubSchema.wallet(wallet_id),
  user_id INT REFERENCES cryptHubSchema.users(id),
  transaction_amount FLOAT,
  coin_amount FLOAT,
  commission_deduction_5 FLOAT,
  currency TEXT,
  trade_type tradeType,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE dwtTradeType AS ENUM ('deposit','withdraw');
CREATE TABLE cryptHubSchema.deposit_withdrawal_transactions (
  dwt_id SERIAL PRIMARY KEY,
  wallet_id INT REFERENCES cryptHubSchema.wallet(wallet_id),
  dwt_type dwtTradeType,
  dwt_amount DECIMAL(10, 2),
  dwt_before DECIMAL(10,2),
  dwt_after DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  
CREATE TABLE cryptHubSchema.p2p_contracts (
  contract_id uuid DEFAULT uuid_generate_v4(),
  seller_id INT REFERENCES cryptHubSchema.users(id),
  currency TEXT,
  coin_amount FLOAT,
  selling_price FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE cryptHubSchema.p2p_completed (
  contract_id VARCHAR(120),
  seller_id INT REFERENCES cryptHubSchema.users(id),
  buyer_id INT REFERENCES cryptHubSchema.users(id),
  currency TEXT,
  coin_amount FLOAT,
  selling_price FLOAT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cryptHubSchema.p2p_deleted (
  contract_id VARCHAR(120),
  seller_id INT REFERENCES cryptHubSchema.users(id),
  currency TEXT,
  coin_amount FLOAT,
  selling_price FLOAT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);