-- SQLite database setup script
-- Created based on User model schema

CREATE TABLE `user` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(256),
    role VARCHAR(20) NOT NULL DEFAULT 'seller',
    name VARCHAR(100) NOT NULL,
    salary DOUBLE DEFAULT 0.0,
    is_paid TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    is_first_login TINYINT(1) DEFAULT 1,
    profile_image VARCHAR(256)
);

-- Note: The 'role' field uses string representation of UserRole enum values.
-- Boolean fields are stored as INTEGER 0 (false) / 1 (true) in SQLite.

CREATE TABLE sale (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INTEGER NOT NULL,
    seller_fruit_id INTEGER,
    stock_name VARCHAR(100) NOT NULL,
    fruit_name VARCHAR(50) NOT NULL,
    qty REAL NOT NULL DEFAULT 0.0,
    unit_price REAL NOT NULL DEFAULT 0.0,
    amount REAL NOT NULL DEFAULT 0.0,
    paid_amount REAL NOT NULL DEFAULT 0.0,
    remaining_amount REAL NOT NULL DEFAULT 0.0,
    customer_name VARCHAR(100),
    date DATE,
    FOREIGN KEY (seller_id) REFERENCES user(id),
    FOREIGN KEY (seller_fruit_id) REFERENCES seller_fruits(id)
);
<<<<<<< SEARCH
CREATE TABLE IF NOT EXISTS purchase (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchaser_id INTEGER NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    fruit_type VARCHAR(50) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    buyer_name VARCHAR(100) NOT NULL,
    cost REAL NOT NULL,
    purchase_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount_per_kg REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (purchaser_id) REFERENCES user(id)
);
=======
CREATE TABLE IF NOT EXISTS purchase (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchaser_id INTEGER NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    fruit_type VARCHAR(50) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    buyer_name VARCHAR(100) NOT NULL,
    cost REAL NOT NULL,
    purchase_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount_per_kg REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (purchaser_id) REFERENCES user(id)
);
<<<<<<< SEARCH
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    fruit_type VARCHAR(50) NOT NULL,
    unit VARCHAR(20),
    location VARCHAR(100),
    expiry_date DATE,
    purchase_price REAL,
    purchase_date DATE,
    added_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES user(id)
);
=======
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    fruit_type VARCHAR(50) NOT NULL,
    unit VARCHAR(20),
    location VARCHAR(100),
    expiry_date DATE,
    purchase_price REAL,
    purchase_date DATE,
    added_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS purchase (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchaser_id INTEGER NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    fruit_type VARCHAR(50) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    buyer_name VARCHAR(100) NOT NULL,
    cost REAL NOT NULL,
    purchase_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount_per_kg REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (purchaser_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    fruit_type VARCHAR(50) NOT NULL,
    unit VARCHAR(20),
    location VARCHAR(100),
    expiry_date DATE,
    purchase_price REAL,
    purchase_date DATE,
    added_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES user(id)
);

-- Sample INSERT statements for User table
INSERT INTO "user" (email, password_hash, role, name, salary, is_paid, is_active, is_first_login, profile_image)
VALUES 
 ('ceo@example.com', '', 'ceo', 'CEO User', 0.0, 0, 1, 1, NULL),
