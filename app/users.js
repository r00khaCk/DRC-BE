import database from "./services/db.js";
class Users {
  constructor(database) {
    this.users = {};
    this.database = database;
    this.connection = database.connection;
  }

  async list(req, res) {
    const result = await this.database.connection.query(
      "SELECT * from cryptHubSchema.users"
    );
    this._sendResponse(res, result.rows);
  }

  // ----- Helper Methods -----
  _sendResponse(res, body) {
    res.status(200).send(body || {});
  }

  _sendError(res, status, code) {
    res.status(status).send({ error: code || "UNKNOWN_ERROR" });
  }
}

export default Users;
