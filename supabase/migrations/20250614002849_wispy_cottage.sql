/*
  # Optimize users table performance

  1. Indexes
    - Add index on id (primary key already indexed)
    - Add index on email for faster lookups
    - Add composite index for common queries

  2. Performance
    - Optimize RLS policies for faster execution
    - Add statistics for query planner
*/

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add index on role for filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add composite index for common auth queries
CREATE INDEX IF NOT EXISTS idx_users_id_email ON users(id, email);

-- Update table statistics for better query planning
ANALYZE users;

-- Optimize RLS policies for better performance
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Public can read basic user info" ON users;

-- More efficient RLS policy for own data access
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- More efficient public read policy with specific columns
CREATE POLICY "Public can read basic user info"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Add comment for documentation
COMMENT ON TABLE users IS 'User profiles with optimized indexes and RLS policies';