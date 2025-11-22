const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Raj@1",
  database: "book_store",
});

(async () => {
  try {
    await db.getConnection();
    console.log("database is connected");
  } catch (error) {
    console.log(error);
  }
})();

module.exports = db;
