import { DB } from "sqlite";

const config = {
  name: ""
};

const initialise = (dbName: string) => {
  config.name = `${dbName}.db`;
  const db = new DB(config.name);

  db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        bio TEXT,
        image BLOB
      )
    `);

  db.close();
}

export default {
  initialise,
  config
};