-- SQLite database setup script
-- Created based on User model schema

CREATE TABLE `user` (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(256),
    role VARCHAR(20) NOT NULL DEFAULT 'seller',
    name VARCHAR(100) NOT NULL,
    salary DOUBLE DEFAULT 0.0,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_first_login BOOLEAN DEFAULT TRUE,
    profile_image VARCHAR(256)
);

CREATE TABLE sale (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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

CREATE TABLE purchase (
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

CREATE TABLE inventory (
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

-- Missing tables from ORM models

CREATE TABLE stock_movement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER NOT NULL,
    movement_type VARCHAR(10) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    unit VARCHAR(20),
    remaining_stock VARCHAR(50),
    date DATE NOT NULL,
    notes TEXT,
    selling_price FLOAT,
    added_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id),
    FOREIGN KEY (added_by) REFERENCES user(id)
);

CREATE TABLE driver_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_email VARCHAR(120) NOT NULL,
    amount FLOAT NOT NULL,
    category VARCHAR(80) NOT NULL,
    type VARCHAR(80),
    description VARCHAR(256),
    date DATE,
    car_number_plate VARCHAR(20),
    car_name VARCHAR(100),
    stock_name VARCHAR(100)
);

CREATE TABLE message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    recipient_role VARCHAR(50),
    recipient_id INTEGER,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES user(id),
    FOREIGN KEY (recipient_id) REFERENCES user(id)
);

CREATE TABLE gradients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_date DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    fruit_type VARCHAR(50) NOT NULL,
    gradient_type VARCHAR(50) NOT NULL,
    notes VARCHAR(255),
    quantity VARCHAR(50),
    unit VARCHAR(20),
    purpose VARCHAR(100)
);

CREATE TABLE receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_num VARCHAR(50) NOT NULL UNIQUE,
    seller_name VARCHAR(100),
    seller_address VARCHAR(200),
    seller_phone VARCHAR(20),
    buyer_name VARCHAR(100),
    buyer_contact VARCHAR(50),
    date DATE NOT NULL,
    payment VARCHAR(50),
    items TEXT,
    subtotal FLOAT,
    discount FLOAT,
    final_total FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE spolige (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description VARCHAR(255) NOT NULL,
    quantity FLOAT NOT NULL,
    date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE it_event (
    id VARCHAR(50) PRIMARY KEY,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_email VARCHAR(120),
    user_id INTEGER,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    ip VARCHAR(45),
    device VARCHAR(255),
    resource VARCHAR(255),
    summary TEXT NOT NULL,
    payload JSON,
    related_event_ids JSON,
    server_logs TEXT,
    stack_trace TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE other_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_type VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    amount FLOAT NOT NULL,
    date DATE NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE it_alert (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_ids JSON NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(120),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_to VARCHAR(120),
    suggested_actions JSON
);

CREATE TABLE salaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount FLOAT NOT NULL,
    description VARCHAR(255),
    date DATE,
    is_paid BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    seller_email VARCHAR(120) NOT NULL,
    fruit_type VARCHAR(80) NOT NULL,
    assignment_id VARCHAR(80),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES user(id)
);

CREATE TABLE stock_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_name VARCHAR(128) NOT NULL,
    date_in DATE NOT NULL,
    fruit_type VARCHAR(64) NOT NULL,
    quantity_in FLOAT NOT NULL,
    amount_per_kg FLOAT NOT NULL,
    total_amount FLOAT NOT NULL,
    other_charges FLOAT DEFAULT 0,
    date_out DATE,
    duration INTEGER,
    gradient_used VARCHAR(128),
    gradient_amount_used FLOAT,
    gradient_cost_per_unit FLOAT,
    total_gradient_cost FLOAT,
    quantity_out FLOAT,
    spoilage FLOAT,
    total_stock_cost FLOAT
);

CREATE TABLE seller_fruits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_name VARCHAR(100) NOT NULL,
    fruit_name VARCHAR(50) NOT NULL,
    qty FLOAT NOT NULL,
    unit_price FLOAT NOT NULL,
    date DATE NOT NULL,
    amount FLOAT NOT NULL,
    customer_name VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (created_by) REFERENCES user(id)
);
