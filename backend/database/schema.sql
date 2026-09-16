-- =============================================================================
-- COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
-- Relational Database DDL Schema (MySQL 8.0+ / MariaDB 10.4+)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `cems_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `cems_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. USERS & STAFF DIRECTORY
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'Court Officer',
  `department` VARCHAR(200) DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  `last_login` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. CASE MANAGEMENT
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `cases`;
CREATE TABLE `cases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `case_id` VARCHAR(50) NOT NULL UNIQUE,
  `case_number` VARCHAR(100) NOT NULL,
  `case_title` VARCHAR(255) NOT NULL,
  `case_type` VARCHAR(50) NOT NULL DEFAULT 'Criminal',
  `court_name` VARCHAR(200) NOT NULL,
  `court_location` VARCHAR(255) DEFAULT NULL,
  `judge_name` VARCHAR(150) DEFAULT NULL,
  `presiding_officer` VARCHAR(150) DEFAULT NULL,
  `investigating_officer` VARCHAR(150) DEFAULT NULL,
  `petitioner` VARCHAR(200) DEFAULT NULL,
  `respondent` VARCHAR(200) DEFAULT NULL,
  `advocate` VARCHAR(200) DEFAULT NULL,
  `priority` VARCHAR(20) NOT NULL DEFAULT 'Medium',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `filing_date` VARCHAR(30) NOT NULL,
  `next_hearing_date` VARCHAR(30) DEFAULT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cases_case_id` (`case_id`),
  INDEX `idx_cases_type` (`case_type`),
  INDEX `idx_cases_status` (`status`),
  INDEX `idx_cases_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. EVIDENCE REGISTRY
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `evidence`;
CREATE TABLE `evidence` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `evidence_id` VARCHAR(50) NOT NULL UNIQUE,
  `case_id` VARCHAR(50) NOT NULL,
  `evidence_name` VARCHAR(255) NOT NULL,
  `evidence_type` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `collected_by` VARCHAR(150) NOT NULL,
  `collection_date` VARCHAR(30) NOT NULL,
  `collection_time` VARCHAR(20) NOT NULL,
  `collection_location` VARCHAR(255) DEFAULT NULL,
  `source` VARCHAR(255) DEFAULT NULL,
  `file_name` VARCHAR(255) DEFAULT NULL,
  `file_path` VARCHAR(500) DEFAULT NULL,
  `file_size` VARCHAR(50) DEFAULT NULL,
  `file_size_bytes` BIGINT DEFAULT 0,
  `hash_algorithm` VARCHAR(20) NOT NULL DEFAULT 'SHA-256',
  `hash_value` VARCHAR(64) NOT NULL,
  `original_hash` VARCHAR(64) NOT NULL,
  `current_hash` VARCHAR(64) NOT NULL,
  `verification_status` VARCHAR(20) NOT NULL DEFAULT 'VERIFIED',
  `court_status` VARCHAR(50) NOT NULL DEFAULT 'Registered',
  `last_verified` VARCHAR(50) DEFAULT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_evidence_id` (`evidence_id`),
  INDEX `idx_evidence_case` (`case_id`),
  INDEX `idx_evidence_type` (`evidence_type`),
  INDEX `idx_evidence_status` (`verification_status`),
  INDEX `idx_evidence_court_status` (`court_status`),
  CONSTRAINT `fk_evidence_case` FOREIGN KEY (`case_id`) REFERENCES `cases` (`case_id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. CHAIN OF CUSTODY TIMELINE & TRANSFERS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `custody_records`;
CREATE TABLE `custody_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `custody_id` VARCHAR(50) NOT NULL UNIQUE,
  `evidence_id` VARCHAR(50) NOT NULL,
  `event_date` VARCHAR(30) NOT NULL,
  `event_time` VARCHAR(20) NOT NULL,
  `officer` VARCHAR(150) NOT NULL,
  `action` VARCHAR(150) NOT NULL,
  `from_location` VARCHAR(255) NOT NULL,
  `to_location` VARCHAR(255) NOT NULL,
  `reason` TEXT NOT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_custody_id` (`custody_id`),
  INDEX `idx_custody_evidence` (`evidence_id`),
  CONSTRAINT `fk_custody_evidence` FOREIGN KEY (`evidence_id`) REFERENCES `evidence` (`evidence_id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. COURT HEARINGS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `hearings`;
CREATE TABLE `hearings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hearing_id` VARCHAR(50) NOT NULL UNIQUE,
  `case_id` VARCHAR(50) NOT NULL,
  `court` VARCHAR(200) NOT NULL,
  `judge` VARCHAR(150) NOT NULL,
  `hearing_date` VARCHAR(30) NOT NULL,
  `hearing_time` VARCHAR(30) NOT NULL,
  `hearing_type` VARCHAR(100) NOT NULL,
  `purpose` TEXT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_hearings_case` (`case_id`),
  INDEX `idx_hearings_status` (`status`),
  CONSTRAINT `fk_hearings_case` FOREIGN KEY (`case_id`) REFERENCES `cases` (`case_id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. CASE DOCUMENTS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_id` VARCHAR(50) NOT NULL UNIQUE,
  `case_id` VARCHAR(50) NOT NULL,
  `document_name` VARCHAR(255) NOT NULL,
  `document_type` VARCHAR(100) NOT NULL,
  `uploaded_by` VARCHAR(150) NOT NULL,
  `upload_date` VARCHAR(30) NOT NULL,
  `version` VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Verified',
  `file_size` VARCHAR(50) DEFAULT NULL,
  `file_path` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_documents_case` (`case_id`),
  INDEX `idx_documents_type` (`document_type`),
  CONSTRAINT `fk_documents_case` FOREIGN KEY (`case_id`) REFERENCES `cases` (`case_id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. COURT SUBMISSIONS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `court_submissions`;
CREATE TABLE `court_submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `submission_id` VARCHAR(50) NOT NULL UNIQUE,
  `evidence_id` VARCHAR(50) NOT NULL,
  `case_id` VARCHAR(50) NOT NULL,
  `court` VARCHAR(200) NOT NULL,
  `submission_date` VARCHAR(30) NOT NULL,
  `submitted_by` VARCHAR(150) NOT NULL,
  `submission_reference` VARCHAR(100) NOT NULL,
  `submission_type` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Submitted',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_submissions_case` (`case_id`),
  INDEX `idx_submissions_evidence` (`evidence_id`),
  INDEX `idx_submissions_status` (`status`),
  CONSTRAINT `fk_submissions_evidence` FOREIGN KEY (`evidence_id`) REFERENCES `evidence` (`evidence_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_submissions_case` FOREIGN KEY (`case_id`) REFERENCES `cases` (`case_id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. IMMUTABLE AUDIT ACTIVITY LOGS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `activity_id` VARCHAR(50) NOT NULL UNIQUE,
  `timestamp` VARCHAR(50) NOT NULL,
  `user` VARCHAR(150) NOT NULL,
  `action` VARCHAR(150) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `reference_id` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Success',
  `details` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_activity_module` (`module`),
  INDEX `idx_activity_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. NOTIFICATIONS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `notification_id` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(20) NOT NULL DEFAULT 'info',
  `time_ago` VARCHAR(50) DEFAULT 'Just now',
  `is_unread` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. SYSTEM CONFIGURATION & SETTINGS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
