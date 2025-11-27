const db = require("../config/db");

const createSchema = async () => {
  try {
    // Ensure database exists and switch to it (if your connection permits)
    await db.query(`CREATE DATABASE IF NOT EXISTS book_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
   

   
    // users
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        userId INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(100) NOT NULL,
        useremail VARCHAR(100) NOT NULL UNIQUE,
        userpassword VARCHAR(255) NOT NULL
      )
    `);
    console.log("users table created");

    // books
    await db.query(`
      CREATE TABLE IF NOT EXISTS books (
        bookId INT PRIMARY KEY AUTO_INCREMENT,
        bookImage VARCHAR(255),
        title VARCHAR(150) NOT NULL,
        author VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        stock INT NOT NULL DEFAULT 0
      )
    `);
    console.log("books table created");

    // cart
    await db.query(`
      CREATE TABLE IF NOT EXISTS cart (
        cartId INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        book_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        UNIQUE KEY unique_cart (user_id, book_id),
        FOREIGN KEY (user_id) REFERENCES users(userId) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(bookId) ON DELETE CASCADE
      )
    `);
    console.log("cart table created");

    // orders
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        book_ids JSON,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(userId) ON DELETE CASCADE
      )
    `);
    console.log("orders table created");

    // order_items
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        book_id INT,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(bookId) ON DELETE SET NULL
      )
    `);
    console.log("order_items table created");

    // optional: seed sample books (use INSERT IGNORE to avoid duplicates)
    await db.query(`
      INSERT IGNORE INTO books (bookId, title, author, price, stock, bookImage) VALUES
      (101, 'The Great Gatsby', 'F. Scott Fitzgerald', 10.99, 100, 'https://images-na.ssl-images-amazon.com/images/I/81af+MCATTL.jpg'),
      (102, 'To Kill a Mockingbird', 'Harper Lee', 20.99, 100, 'https://m.media-amazon.com/images/I/81gepf1eMqL.jpg'),
      (103, '1984', 'George Orwell', 30.00, 100, 'https://via.placeholder.com/140x200?text=1984'),
      (104, 'Pride and Prejudice', 'Jane Austen', 12.99, 100, 'https://images-na.ssl-images-amazon.com/images/I/91HHqVTAJQL.jpg')
    `);
    console.log("sample books seeded (if not present)");
  } catch (error) {
    console.error("createSchema error:", error);
    process.exitCode = 1;
  }
};

createSchema();
