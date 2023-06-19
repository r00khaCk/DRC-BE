// process.env = built-in object that access current Node.js process env var
const env = process.env;

const app_config = {
  db: {
    host: 'postgres',
    port: env.POSTGRES_PORT,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
  },
};
export default  app_config;
