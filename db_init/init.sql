-- Connect to the newly created database
\c crypthub_db_2;

CREATE SCHEMA IF NOT EXISTS cryptHubSchema;

-- Create the "users" table
CREATE TABLE cryptHubSchema.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  password VARCHAR(150),
  account_verified BOOLEAN
);

CREATE TABLE cryptHubSchema.wallet (
  wallet_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES cryptHubSchema.users(id),
  currency VARCHAR(50),
  amount DECIMAL(10, 2),
  CONSTRAINT unique_user_currency UNIQUE (user_id, currency)
);

CREATE TABLE cryptHubSchema.transactions (
  transaction_id SERIAL PRIMARY KEY,
  wallet_id INT REFERENCES cryptHubSchema.wallet(wallet_id),
  user_id INT REFERENCES cryptHubSchema.users(id),
  transaction_amount DECIMAL(10, 2),
  transaction_date TIMESTAMP
);

CREATE TABLE cryptHubSchema.deposit (
  deposit_id SERIAL PRIMARY KEY,
  wallet_id INT REFERENCES cryptHubSchema.wallet(wallet_id),
  deposit_amount DECIMAL(10, 2)
);
