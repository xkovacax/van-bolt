/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - matches auth.users id
      - `name` (text) - user's full name
      - `email` (text, unique) - user's email address
      - `role` (text) - either 'owner' or 'customer'
      - `avatar` (text) - URL to user's avatar image
      - `rating` (numeric) - user's average rating
      - `review_count` (integer) - number of reviews received
      - `created_at` (timestamp) - when the record was created
      - `updated_at` (timestamp) - when the record was last updated

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read their own data
    - Add policy for users to update their own data
    - Add policy for public read access to basic user info (for camper listings)
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'customer')),
  avatar text,
  rating numeric(3,2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  review_count integer DEFAULT 0 CHECK (review_count >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy for public read access to basic user info (needed for camper listings)
CREATE POLICY "Public can read basic user info"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Policy for authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();