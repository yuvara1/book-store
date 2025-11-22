const db = require("../config/db");

//!USER SCHEMA
const createSchema = async () => {
  try {
    // CREATING USER TABLE
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        userId INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(100) NOT NULL,
        useremail VARCHAR(100) NOT NULL UNIQUE,
        userpassword VARCHAR(255) NOT NULL   
      );
    `);
    console.log("USER TABLE CREATED");

    //! CREATING BOOKS TABLE
    await db.query(`
      CREATE TABLE IF NOT EXISTS books (
        bookId INT AUTO_INCREMENT PRIMARY KEY,
        bookImage VARCHAR(150) ,
        title VARCHAR(150) NOT NULL,
        author VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INT NOT NULL
      );
    `);
    console.log("BOOKS TABLE CREATED");

    // CREATING CART TABLE
    await db.query(`CREATE TABLE IF NOT EXISTS cart (
    cartId INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(userId) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(bookId) ON DELETE CASCADE,
    UNIQUE KEY unique_cart (user_id, book_id)
  )`);
    console.log("CART TABLE CREATED");

    // CREATING ORDERS TABLE
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        book_ids JSON, 
        total_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(userId) ON DELETE CASCADE
      );
    `);
    console.log("ORDERS TABLE CREATED");
  } catch (error) {
    console.log(error);
  }
};

createSchema();
