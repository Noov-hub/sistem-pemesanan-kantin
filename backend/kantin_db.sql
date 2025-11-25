/*
Navicat MySQL Data Transfer

Source Server         : LatihanDatabase
Source Server Version : 80030
Source Host           : localhost:3306
Source Database       : kantin_db

Target Server Type    : MYSQL
Target Server Version : 80030
File Encoding         : 65001

Date: 2025-11-25 17:34:36
*/

SET FOREIGN_KEY_CHECKS=0;
-- ----------------------------
-- Table structure for `orders`
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `order_notes` text NOT NULL,
  `status` enum('new','confirmed','cooking','ready','completed','cancelled') DEFAULT 'new',
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `payment_status` enum('unpaid','paid','refunded') DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for `users`
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('cashier','kitchen','customer') DEFAULT 'cashier',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES ('1', 'kasir1', 'admin123', 'cashier', '2025-11-24 19:04:26');
INSERT INTO `users` VALUES ('2', 'dapur1', 'admin123', 'kitchen', '2025-11-24 19:04:26');
