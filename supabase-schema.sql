-- Database Schema for Arrow Lock Detection System
-- Project: raccoon jep

-- Drop existing tables if they exist (to fix type issues)
DROP TABLE IF EXISTS detections CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table - stores user information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(first_name, location)
);

-- Detections table - stores detection records
CREATE TABLE detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    location TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    detected_count INTEGER NOT NULL DEFAULT 0,
    confirmed_count INTEGER NOT NULL DEFAULT 0,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geo_accuracy DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_detections_user_id ON detections(user_id);
CREATE INDEX IF NOT EXISTS idx_detections_timestamp ON detections(timestamp);
CREATE INDEX IF NOT EXISTS idx_detections_location ON detections(location);
CREATE INDEX IF NOT EXISTS idx_users_name_location ON users(first_name, location);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE detections ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is using anon key)
-- Allow anyone to read and insert users
CREATE POLICY "Enable read access for all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON users
    FOR UPDATE USING (true);

-- Allow anyone to read and insert detections
CREATE POLICY "Enable read access for all detections" ON detections
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all detections" ON detections
    FOR INSERT WITH CHECK (true);
