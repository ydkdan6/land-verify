/*
  # Land Information System Database Schema

  1. New Tables
    - `profiles` - User profiles with role information
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text) - admin, landowner, public
      - `phone` (text, optional)
      - `created_at` (timestamp)

    - `land_records` - Core land information
      - `id` (uuid, primary key)
      - `title` (text) - Land title/name
      - `location` (text) - Physical location
      - `coordinates` (text) - GPS coordinates
      - `size` (decimal) - Size in acres/hectares
      - `size_unit` (text) - Unit of measurement
      - `ownership_status` (text) - verified, pending, disputed
      - `zoning` (text) - Zoning classification
      - `price` (decimal, optional) - Market price
      - `description` (text, optional)
      - `owner_id` (uuid, references profiles)
      - `verified_by` (uuid, references profiles, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `ownership_documents` - Document management
      - `id` (uuid, primary key)
      - `land_record_id` (uuid, references land_records)
      - `document_type` (text) - deed, survey, certificate
      - `document_url` (text) - File URL
      - `status` (text) - pending, approved, rejected
      - `submitted_by` (uuid, references profiles)
      - `reviewed_by` (uuid, references profiles, optional)
      - `notes` (text, optional)
      - `created_at` (timestamp)

    - `transactions` - Land transactions
      - `id` (uuid, primary key)
      - `land_record_id` (uuid, references land_records)
      - `from_owner` (uuid, references profiles)
      - `to_owner` (uuid, references profiles)
      - `transaction_type` (text) - sale, transfer, inheritance
      - `amount` (decimal, optional)
      - `status` (text) - pending, approved, completed, cancelled
      - `approved_by` (uuid, references profiles, optional)
      - `created_at` (timestamp)

    - `notifications` - User notifications
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `message` (text)
      - `type` (text) - info, warning, success, error
      - `read` (boolean, default false)
      - `created_at` (timestamp)

    - `zoning_laws` - Zoning regulations
      - `id` (uuid, primary key)
      - `zone_type` (text)
      - `description` (text)
      - `regulations` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Profiles readable by authenticated users, updatable by owners
    - Land records readable by all, manageable by admins and owners
    - Documents and transactions with proper access controls
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'landowner', 'public')),
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create land_records table
CREATE TABLE IF NOT EXISTS land_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  location text NOT NULL,
  coordinates text,
  size decimal NOT NULL,
  size_unit text NOT NULL DEFAULT 'acres',
  ownership_status text NOT NULL DEFAULT 'pending' CHECK (ownership_status IN ('verified', 'pending', 'disputed')),
  zoning text NOT NULL,
  price decimal,
  description text,
  owner_id uuid REFERENCES profiles(id),
  verified_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ownership_documents table
CREATE TABLE IF NOT EXISTS ownership_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  land_record_id uuid REFERENCES land_records(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('deed', 'survey', 'certificate', 'other')),
  document_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by uuid REFERENCES profiles(id),
  reviewed_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  land_record_id uuid REFERENCES land_records(id) ON DELETE CASCADE,
  from_owner uuid REFERENCES profiles(id),
  to_owner uuid REFERENCES profiles(id),
  transaction_type text NOT NULL CHECK (transaction_type IN ('sale', 'transfer', 'inheritance')),
  amount decimal,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  approved_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create zoning_laws table
CREATE TABLE IF NOT EXISTS zoning_laws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_type text NOT NULL,
  description text NOT NULL,
  regulations text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoning_laws ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Land records policies
CREATE POLICY "Anyone can read land records"
  ON land_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all land records"
  ON land_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Landowners can manage their own land records"
  ON land_records FOR ALL
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Ownership documents policies
CREATE POLICY "Users can read documents for their land"
  ON ownership_documents FOR SELECT
  TO authenticated
  USING (
    submitted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM land_records lr
      WHERE lr.id = land_record_id AND lr.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert documents for their land"
  ON ownership_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM land_records lr
      WHERE lr.id = land_record_id AND lr.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all documents"
  ON ownership_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Transactions policies
CREATE POLICY "Users can read their transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    from_owner = auth.uid() OR
    to_owner = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    from_owner = auth.uid() OR
    to_owner = auth.uid()
  );

CREATE POLICY "Admins can manage all transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notifications policies
CREATE POLICY "Users can read their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Zoning laws policies (public read access)
CREATE POLICY "Anyone can read zoning laws"
  ON zoning_laws FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage zoning laws"
  ON zoning_laws FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert some sample zoning laws
INSERT INTO zoning_laws (zone_type, description, regulations) VALUES
('Residential', 'Areas designated for housing and residential development', 'Maximum building height: 3 stories. Minimum lot size: 1000 sq ft. Setback requirements: 10ft front, 5ft sides.'),
('Commercial', 'Areas designated for business and commercial activities', 'Maximum building height: 10 stories. Mixed-use allowed. Parking requirements: 1 space per 250 sq ft.'),
('Industrial', 'Areas designated for manufacturing and industrial use', 'Maximum building height: 8 stories. Environmental impact assessment required. Buffer zones from residential areas.'),
('Agricultural', 'Areas designated for farming and agricultural activities', 'Minimum lot size: 5 acres. Restrictions on non-agricultural structures. Water rights considerations.'),
('Mixed-Use', 'Areas allowing combination of residential and commercial use', 'Flexible zoning with specific ratios. Ground floor commercial encouraged. Transit-oriented development preferred.');