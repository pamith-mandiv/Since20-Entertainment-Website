-- SINCE'20 Entertainments Database Schema DDL
CREATE DATABASE IF NOT EXISTS since20_db;
USE since20_db;

-- Users Table (Artists and Admins)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('artist', 'admin') NOT NULL DEFAULT 'artist',
  phone VARCHAR(50) NOT NULL,
  artist_name VARCHAR(255) NULL,
  country VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Releases Table (Song submissions)
CREATE TABLE IF NOT EXISTS releases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  song_name VARCHAR(255) NOT NULL,
  artist_name VARCHAR(255) NOT NULL,
  album_art VARCHAR(555) NOT NULL,
  song_file VARCHAR(555) NOT NULL,
  payment_receipt VARCHAR(555) NULL, -- Optional payment proof upload
  spotify_link VARCHAR(555) NULL,    -- Manual URL entered by admin
  apple_music_link VARCHAR(555) NULL,  -- Manual URL entered by admin
  lyrics_writer VARCHAR(255) NOT NULL,
  melody_composer VARCHAR(255) NOT NULL,
  release_date DATE NOT NULL,
  tiktok_cut_time VARCHAR(50) NOT NULL,
  tiktok_release_date DATE NOT NULL,
  tiktok_link VARCHAR(255) NULL,
  youtube_channel VARCHAR(255) NOT NULL,
  facebook_link VARCHAR(255) NULL,
  instagram_link VARCHAR(255) NULL,
  production_year INT NOT NULL,
  status ENUM('pending', 'approved', 'released', 'correction', 'rejected') NOT NULL DEFAULT 'pending',
  correction_note TEXT NULL,
  additional_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Stats Table (Spotify and Apple Music counts)
CREATE TABLE IF NOT EXISTS stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  release_id INT NOT NULL UNIQUE,
  spotify_streams INT DEFAULT 0,
  apple_music_streams INT DEFAULT 0,
  monthly_listeners INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE
);

-- Support Messages Table (Help Chat)
CREATE TABLE IF NOT EXISTS support_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  artist_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  admin_reply TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Artist Portfolios Table (Linktree style)
CREATE TABLE IF NOT EXISTS artist_portfolios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NULL,
  roles JSON NULL,
  bio TEXT NULL,
  location VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  website VARCHAR(255) NULL,
  profile_picture VARCHAR(555) NULL,
  cover_picture VARCHAR(555) NULL,
  theme_options JSON NULL,
  social_links JSON NULL,
  featured_release_id INT NULL,
  selected_animation VARCHAR(50) DEFAULT 'animation1',
  animation_enabled TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Portfolio Catalog Table (Artist manual uploads for portfolio)
CREATE TABLE IF NOT EXISTS portfolio_catalog (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  song_title VARCHAR(255) NOT NULL,
  artist_name VARCHAR(255) NOT NULL,
  featuring_artists VARCHAR(255) NULL,
  album_art VARCHAR(555) NOT NULL,
  release_date DATE NOT NULL,
  genre VARCHAR(100) NULL,
  description TEXT NULL,
  streaming_links JSON NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Artist Events Table
CREATE TABLE IF NOT EXISTS artist_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  event_type ENUM('concert','live_show','press_conference','media','tour') NOT NULL DEFAULT 'concert',
  event_date DATETIME NOT NULL,
  event_time VARCHAR(50) NULL,
  venue VARCHAR(255) NULL,
  city VARCHAR(255) NULL,
  location VARCHAR(255) NULL,
  description TEXT NULL,
  ticket_link VARCHAR(555) NULL,
  poster_image VARCHAR(555) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
