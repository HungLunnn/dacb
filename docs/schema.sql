-- ============================================================================
-- HỆ THỐNG QUẢN LÝ THUÊ TRỌ - LƯỢC ĐỒ CƠ SỞ DỮ LIỆU (MySQL 8.0+)
-- Database: Quan_Ly_Phong
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `Quan_Ly_Phong`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `Quan_Ly_Phong`;

-- 1. Bảng vai trò (role)
CREATE TABLE IF NOT EXISTS `role` (
    `id`   VARCHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_role_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng người dùng (user)
CREATE TABLE IF NOT EXISTS `user` (
    `id`                VARCHAR(36)  NOT NULL,
    `email`             VARCHAR(255) NOT NULL,
    `username`          VARCHAR(255) NOT NULL,
    `password`          VARCHAR(255) NOT NULL,
    `full_name`         VARCHAR(255) NULL,
    `phone_number`      VARCHAR(20)  NULL,
    `create_date`       DATE         NOT NULL,
    `active`            BIT(1)       DEFAULT b'1',
    `access_token`      TEXT         NULL,
    `refresh_token`     VARCHAR(255) NULL,
    `exp_refresh_token` DATETIME(6)  NULL,
    `role_id`           VARCHAR(36)  NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_email` (`email`),
    UNIQUE KEY `uk_user_username` (`username`),
    KEY `idx_user_phone` (`phone_number`),
    CONSTRAINT `fk_user_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng phòng trọ (apartment)
CREATE TABLE IF NOT EXISTS `apartment` (
    `id`             VARCHAR(36)  NOT NULL,
    `address`        VARCHAR(255) NOT NULL,
    `retail_price`   DOUBLE       NOT NULL,
    `number_of_room` INT          NOT NULL,
    `status`         BIT(1)       NOT NULL DEFAULT b'0', -- 0: Còn trống, 1: Đang thuê
    PRIMARY KEY (`id`),
    KEY `idx_apartment_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng khách hàng (customer)
CREATE TABLE IF NOT EXISTS `customer` (
    `id`            VARCHAR(36)  NOT NULL,
    `full_name`     VARCHAR(100) NOT NULL,
    `address`       VARCHAR(255) NULL,
    `citizen_id`    VARCHAR(20)  NULL,
    `date_of_birth` DATE         NULL,
    `phone_number`  VARCHAR(20)  NULL,
    PRIMARY KEY (`id`),
    KEY `idx_customer_phone` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng hợp đồng thuê phòng (contract)
CREATE TABLE IF NOT EXISTS `contract` (
    `id`                 VARCHAR(36)   NOT NULL,
    `start_date`         DATE          NOT NULL,
    `end_date`           DATE          NOT NULL,
    `create_date`        DATE          NOT NULL,
    `retail_price`       DOUBLE        NOT NULL,
    `total`              DOUBLE        NOT NULL,
    `status`             VARCHAR(20)   NOT NULL, -- DRAFT, ACTIVE, EXPIRED, TERMINATED
    `terminated_at`      DATE          NULL,
    `termination_reason` VARCHAR(1000) NULL,
    `customer_id`        VARCHAR(36)   NOT NULL,
    `apartment_id`       VARCHAR(36)   NOT NULL,
    `user_id`            VARCHAR(36)   NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_contract_apartment` (`apartment_id`),
    KEY `idx_contract_customer` (`customer_id`),
    KEY `idx_contract_status` (`status`),
    CONSTRAINT `fk_contract_customer`  FOREIGN KEY (`customer_id`)  REFERENCES `customer` (`id`),
    CONSTRAINT `fk_contract_apartment` FOREIGN KEY (`apartment_id`) REFERENCES `apartment` (`id`),
    CONSTRAINT `fk_contract_user`      FOREIGN KEY (`user_id`)      REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng hóa đơn điện nước hàng tháng (invoice)
CREATE TABLE IF NOT EXISTS `invoice` (
    `id`              VARCHAR(36)  NOT NULL,
    `invoice_number`  VARCHAR(100) NOT NULL,
    `contract_id`     VARCHAR(36)  NOT NULL,
    `billing_month`   INT          NOT NULL,
    `billing_year`    INT          NOT NULL,
    `room_amount`     DOUBLE       NOT NULL,
    `electric_old`    DOUBLE       DEFAULT 0,
    `electric_new`    DOUBLE       DEFAULT 0,
    `electric_usage`  DOUBLE       DEFAULT 0,
    `electric_rate`   DOUBLE       NOT NULL DEFAULT 3000,
    `electric_amount` DOUBLE       NOT NULL DEFAULT 0,
    `water_old`       DOUBLE       DEFAULT 0,
    `water_new`       DOUBLE       DEFAULT 0,
    `water_usage`     DOUBLE       DEFAULT 0,
    `water_rate`      DOUBLE       NOT NULL DEFAULT 10000,
    `water_amount`    DOUBLE       NOT NULL DEFAULT 0,
    `amount`          DOUBLE       NOT NULL,
    `issue_date`      DATE         NOT NULL,
    `due_date`        DATE         NOT NULL,
    `status`          VARCHAR(20)  NOT NULL, -- UNPAID, PAID, CANCELLED
    `paid_at`         DATETIME(6)  NULL,
    `created_at`      DATETIME(6)  NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_invoice_number` (`invoice_number`),
    UNIQUE KEY `uk_invoice_contract_period` (`contract_id`, `billing_month`, `billing_year`),
    KEY `idx_invoice_contract` (`contract_id`),
    KEY `idx_invoice_status` (`status`),
    KEY `idx_invoice_period` (`billing_year`, `billing_month`),
    CONSTRAINT `fk_invoice_contract` FOREIGN KEY (`contract_id`) REFERENCES `contract` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng thông báo hệ thống (notification)
CREATE TABLE IF NOT EXISTS `notification` (
    `id`              VARCHAR(36)   NOT NULL,
    `user_id`         VARCHAR(36)   NOT NULL,
    `title`           VARCHAR(255)  NOT NULL,
    `message`         VARCHAR(1000) NOT NULL,
    `type`            VARCHAR(40)   NOT NULL, -- CONTRACT_CREATED, CONTRACT_UPDATED, CONTRACT_TERMINATED, INVOICE_CREATED, INVOICE_PAID, UTILITY_INVOICE_CREATED, SYSTEM
    `is_read`         BIT(1)        NOT NULL DEFAULT b'0',
    `created_at`      DATETIME(6)   NOT NULL,
    `recipient_phone` VARCHAR(20)   NULL,
    PRIMARY KEY (`id`),
    KEY `idx_notification_user_read` (`user_id`, `is_read`),
    KEY `idx_notification_phone_read` (`recipient_phone`, `is_read`),
    KEY `idx_notification_created_at` (`created_at`),
    CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
