-- MySQL database setup script
-- Created based on User model schema

CREATE TABLE user (
id INT PRIMARY KEY AUTO_INCREMENT,
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
) ENGINE=InnoDB;

CREATE TABLE sale (
id INT PRIMARY KEY AUTO_INCREMENT,
seller_id INT NOT NULL,
seller_fruit_id INT,
stock_name VARCHAR(100) NOT NULL,
fruit_name VARCHAR(50) NOT NULL,
qty DOUBLE NOT NULL DEFAULT 0,
unit_price DOUBLE NOT NULL DEFAULT 0,
amount DOUBLE NOT NULL DEFAULT 0,
paid_amount DOUBLE NOT NULL DEFAULT 0,
remaining_amount DOUBLE NOT NULL DEFAULT 0,
customer_name VARCHAR(100),
date DATE,
FOREIGN KEY (seller_id) REFERENCES user(id),
FOREIGN KEY (seller_fruit_id) REFERENCES seller_fruits(id)
) ENGINE=InnoDB;

CREATE TABLE purchase (
id INT PRIMARY KEY AUTO_INCREMENT,
purchaser_id INT NOT NULL,
employee_name VARCHAR(100) NOT NULL,
fruit_type VARCHAR(50) NOT NULL,
quantity VARCHAR(50) NOT NULL,
unit VARCHAR(20) NOT NULL,
buyer_name VARCHAR(100) NOT NULL,
cost DOUBLE NOT NULL,
purchase_date DATE NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
amount_per_kg DOUBLE NOT NULL DEFAULT 0,
FOREIGN KEY (purchaser_id) REFERENCES user(id)
) ENGINE=InnoDB;

CREATE TABLE inventory (
id INT PRIMARY KEY AUTO_INCREMENT,
name VARCHAR(100) NOT NULL,
quantity VARCHAR(50) NOT NULL,
fruit_type VARCHAR(50) NOT NULL,
unit VARCHAR(20),
location VARCHAR(100),
expiry_date DATE,
purchase_price DOUBLE,
purchase_date DATE,
added_by INT NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (added_by) REFERENCES user(id)
) ENGINE=InnoDB;

CREATE TABLE stock_movement (
id INT PRIMARY KEY AUTO_INCREMENT,
inventory_id INT NOT NULL,
movement_type VARCHAR(10) NOT NULL,
quantity VARCHAR(50) NOT NULL,
unit VARCHAR(20),
remaining_stock VARCHAR(50),
date DATE NOT NULL,
notes TEXT,
selling_price DOUBLE,
added_by INT NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (inventory_id) REFERENCES inventory(id),
FOREIGN KEY (added_by) REFERENCES user(id)
) ENGINE=InnoDB;

CREATE TABLE driver_expenses (
id INT PRIMARY KEY AUTO_INCREMENT,
driver_email VARCHAR(120) NOT NULL,
amount DOUBLE NOT NULL,
category VARCHAR(80) NOT NULL,
type VARCHAR(80),
description VARCHAR(256),
date DATE,
car_number_plate VARCHAR(20),
car_name VARCHAR(100),
stock_name VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE message (
id INT PRIMARY KEY AUTO_INCREMENT,
sender_id INT NOT NULL,
recipient_role VARCHAR(50),
recipient_id INT,
message TEXT NOT NULL,
is_read BOOLEAN DEFAULT FALSE,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (sender_id) REFERENCES user(id),
FOREIGN KEY (recipient_id) REFERENCES user(id)
) ENGINE=InnoDB;

CREATE TABLE gradients (
id INT PRIMARY KEY AUTO_INCREMENT,
application_date DATE NOT NULL,
name VARCHAR(100) NOT NULL,
description VARCHAR(255),
fruit_type VARCHAR(50) NOT NULL,
gradient_type VARCHAR(50) NOT NULL,
notes VARCHAR(255),
quantity VARCHAR(50),
unit VARCHAR(20),
purpose VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE receipts (
id INT PRIMARY KEY AUTO_INCREMENT,
receipt_num VARCHAR(50) NOT NULL UNIQUE,
seller_name VARCHAR(100),
seller_address VARCHAR(200),
seller_phone VARCHAR(20),
buyer_name VARCHAR(100),
buyer_contact VARCHAR(50),
date DATE NOT NULL,
payment VARCHAR(50),
items TEXT,
subtotal DOUBLE,
discount DOUBLE,
final_total DOUBLE,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE spolige (
id INT PRIMARY KEY AUTO_INCREMENT,
description VARCHAR(255) NOT NULL,
quantity DOUBLE NOT NULL,
date DATE,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE it_event (
id VARCHAR(50) PRIMARY KEY,
timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
user_email VARCHAR(120),
user_id INT,
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
) ENGINE=InnoDB;

CREATE TABLE other_expenses (
id INT PRIMARY KEY AUTO_INCREMENT,
expense_type VARCHAR(100) NOT NULL,
description VARCHAR(255),
amount DOUBLE NOT NULL,
date DATE NOT NULL,
user_id INT NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB;

CREATE TABLE it_alert (
id INT PRIMARY KEY AUTO_INCREMENT,
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
) ENGINE=InnoDB;

CREATE TABLE salaries (
id INT PRIMARY KEY AUTO_INCREMENT,
user_id INT NOT NULL,
amount DOUBLE NOT NULL,
description VARCHAR(255),
date DATE,
is_paid BOOLEAN DEFAULT FALSE,
FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB;

CREATE TABLE assignments (
id INT PRIMARY KEY AUTO_INCREMENT,
seller_id INT NOT NULL,
seller_email VARCHAR(120) NOT NULL,
fruit_type VARCHAR(80) NOT NULL,
assignment_id VARCHAR(80),
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (seller_id) REFERENCES user(id)
) ENGINE=InnoDB;

CREATE TABLE stock_tracking (
id INT PRIMARY KEY AUTO_INCREMENT,
stock_name VARCHAR(128) NOT NULL,
date_in DATE NOT NULL,
fruit_type VARCHAR(64) NOT NULL,
quantity_in DOUBLE NOT NULL,
amount_per_kg DOUBLE NOT NULL,
total_amount DOUBLE NOT NULL,
other_charges DOUBLE DEFAULT 0,
date_out DATE,
duration INT,
gradient_used VARCHAR(128),
gradient_amount_used DOUBLE,
gradient_cost_per_unit DOUBLE,
total_gradient_cost DOUBLE,
quantity_out DOUBLE,
spoilage DOUBLE,
total_stock_cost DOUBLE
) ENGINE=InnoDB;

CREATE TABLE seller_fruits (
id INT PRIMARY KEY AUTO_INCREMENT,
stock_name VARCHAR(100) NOT NULL,
fruit_name VARCHAR(50) NOT NULL,
qty DOUBLE NOT NULL,
unit_price DOUBLE NOT NULL,
date DATE NOT NULL,
amount DOUBLE NOT NULL,
customer_name VARCHAR(100),
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
created_by INT,
FOREIGN KEY (created_by) REFERENCES user(id)
) ENGINE=InnoDB;
