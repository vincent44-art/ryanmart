-- MySQL compatible database setup script ensuring all 17 tables from ORM

CREATE TABLE `user` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(256) DEFAULT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'seller',
  `name` VARCHAR(100) NOT NULL,
  `salary` DOUBLE DEFAULT 0.0,
  `is_paid` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_first_login` BOOLEAN DEFAULT TRUE,
  `profile_image` VARCHAR(256) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sale` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `seller_id` INT NOT NULL,
  `seller_fruit_id` INT DEFAULT NULL,
  `stock_name` VARCHAR(100) NOT NULL,
  `fruit_name` VARCHAR(50) NOT NULL,
  `qty` DOUBLE NOT NULL DEFAULT 0,
  `unit_price` DOUBLE NOT NULL DEFAULT 0,
  `amount` DOUBLE NOT NULL DEFAULT 0,
  `paid_amount` DOUBLE NOT NULL DEFAULT 0,
  `remaining_amount` DOUBLE NOT NULL DEFAULT 0,
  `customer_name` VARCHAR(100) DEFAULT NULL,
  `date` DATE DEFAULT NULL,
  CONSTRAINT `fk_sale_seller` FOREIGN KEY (`seller_id`) REFERENCES `user`(`id`),
  CONSTRAINT `fk_sale_seller_fruit` FOREIGN KEY (`seller_fruit_id`) REFERENCES `seller_fruits`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `purchase` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `purchaser_id` INT NOT NULL,
  `employee_name` VARCHAR(100) NOT NULL,
  `fruit_type` VARCHAR(50) NOT NULL,
  `quantity` VARCHAR(50) NOT NULL,
  `unit` VARCHAR(20) NOT NULL,
  `buyer_name` VARCHAR(100) NOT NULL,
  `cost` DOUBLE NOT NULL,
  `purchase_date` DATE NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `amount_per_kg` DOUBLE NOT NULL DEFAULT 0,
  CONSTRAINT `fk_purchase_purchaser` FOREIGN KEY (`purchaser_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `quantity` VARCHAR(50) NOT NULL,
  `fruit_type` VARCHAR(50) NOT NULL,
  `unit` VARCHAR(20) DEFAULT NULL,
  `location` VARCHAR(100) DEFAULT NULL,
  `expiry_date` DATE DEFAULT NULL,
  `purchase_price` DOUBLE DEFAULT NULL,
  `purchase_date` DATE DEFAULT NULL,
  `added_by` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_inventory_added_by` FOREIGN KEY (`added_by`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_movement` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `inventory_id` INT NOT NULL,
  `movement_type` VARCHAR(10) NOT NULL,
  `quantity` VARCHAR(50) NOT NULL,
  `unit` VARCHAR(20) DEFAULT NULL,
  `remaining_stock` VARCHAR(50) DEFAULT NULL,
  `date` DATE NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `selling_price` DOUBLE DEFAULT NULL,
  `added_by` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_stock_movement_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`),
  CONSTRAINT `fk_stock_movement_user` FOREIGN KEY (`added_by`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `driver_expenses` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `driver_email` VARCHAR(120) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `category` VARCHAR(80) NOT NULL,
  `type` VARCHAR(80) DEFAULT NULL,
  `description` VARCHAR(256) DEFAULT NULL,
  `date` DATE DEFAULT NULL,
  `car_number_plate` VARCHAR(20) DEFAULT NULL,
  `car_name` VARCHAR(100) DEFAULT NULL,
  `stock_name` VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `message` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `sender_id` INT NOT NULL,
  `recipient_role` VARCHAR(50) DEFAULT NULL,
  `recipient_id` INT DEFAULT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_message_sender` FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`),
  CONSTRAINT `fk_message_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gradients` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `application_date` DATE NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `fruit_type` VARCHAR(50) NOT NULL,
  `gradient_type` VARCHAR(50) NOT NULL,
  `notes` VARCHAR(255) DEFAULT NULL,
  `quantity` VARCHAR(50) DEFAULT NULL,
  `unit` VARCHAR(20) DEFAULT NULL,
  `purpose` VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `receipts` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `receipt_num` VARCHAR(50) NOT NULL UNIQUE,
  `seller_name` VARCHAR(100) DEFAULT NULL,
  `seller_address` VARCHAR(200) DEFAULT NULL,
  `seller_phone` VARCHAR(20) DEFAULT NULL,
  `buyer_name` VARCHAR(100) DEFAULT NULL,
  `buyer_contact` VARCHAR(50) DEFAULT NULL,
  `date` DATE NOT NULL,
  `payment` VARCHAR(50) DEFAULT NULL,
  `items` TEXT DEFAULT NULL,
  `subtotal` DOUBLE DEFAULT NULL,
  `discount` DOUBLE DEFAULT NULL,
  `final_total` DOUBLE DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `spolige` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `description` VARCHAR(255) NOT NULL,
  `quantity` DOUBLE NOT NULL,
  `date` DATE DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `it_event` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_email` VARCHAR(120) DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `event_type` VARCHAR(50) NOT NULL,
  `severity` VARCHAR(50) NOT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `device` VARCHAR(255) DEFAULT NULL,
  `resource` VARCHAR(255) DEFAULT NULL,
  `summary` TEXT NOT NULL,
  `payload` JSON DEFAULT NULL,
  `related_event_ids` JSON DEFAULT NULL,
  `server_logs` TEXT DEFAULT NULL,
  `stack_trace` TEXT DEFAULT NULL,
  CONSTRAINT `fk_it_event_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `other_expenses` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `expense_type` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `amount` DOUBLE NOT NULL,
  `date` DATE NOT NULL,
  `user_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_other_expenses_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `it_alert` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `event_ids` JSON NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `severity` VARCHAR(50) NOT NULL,
  `acknowledged` BOOLEAN DEFAULT FALSE,
  `acknowledged_by` VARCHAR(120) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `assigned_to` VARCHAR(120) DEFAULT NULL,
  `suggested_actions` JSON DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `salaries` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `amount` DOUBLE NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `date` DATE DEFAULT NULL,
  `is_paid` BOOLEAN DEFAULT FALSE,
  CONSTRAINT `fk_salaries_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `assignments` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `seller_id` INT NOT NULL,
  `seller_email` VARCHAR(120) NOT NULL,
  `fruit_type` VARCHAR(80) NOT NULL,
  `assignment_id` VARCHAR(80) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_assignments_seller` FOREIGN KEY (`seller_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_tracking` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `stock_name` VARCHAR(128) NOT NULL,
  `date_in` DATE NOT NULL,
  `fruit_type` VARCHAR(64) NOT NULL,
  `quantity_in` DOUBLE NOT NULL,
  `amount_per_kg` DOUBLE NOT NULL,
  `total_amount` DOUBLE NOT NULL,
  `other_charges` DOUBLE DEFAULT 0,
  `date_out` DATE DEFAULT NULL,
  `duration` INT DEFAULT NULL,
  `gradient_used` VARCHAR(128) DEFAULT NULL,
  `gradient_amount_used` DOUBLE DEFAULT NULL,
  `gradient_cost_per_unit` DOUBLE DEFAULT NULL,
  `total_gradient_cost` DOUBLE DEFAULT NULL,
  `quantity_out` DOUBLE DEFAULT NULL,
  `spoilage` DOUBLE DEFAULT NULL,
  `total_stock_cost` DOUBLE DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `seller_fruits` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `stock_name` VARCHAR(100) NOT NULL,
  `fruit_name` VARCHAR(50) NOT NULL,
  `qty` DOUBLE NOT NULL,
  `unit_price` DOUBLE NOT NULL,
  `date` DATE NOT NULL,
  `amount` DOUBLE NOT NULL,
  `customer_name` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT DEFAULT NULL,
  CONSTRAINT `fk_seller_fruits_created_by` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
