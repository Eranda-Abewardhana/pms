-- ================================================================
-- PMS MySQL Database Setup Script
-- Run this as root: mysql -u root -p < db_setup.sql
-- Or: sudo mariadb < db_setup.sql
-- ================================================================

CREATE DATABASE IF NOT EXISTS pms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'pms_user'@'localhost' IDENTIFIED BY 'pms_password';
GRANT ALL PRIVILEGES ON pms_db.* TO 'pms_user'@'localhost';
FLUSH PRIVILEGES;

SELECT 'Database pms_db and user pms_user created successfully.' AS status;
