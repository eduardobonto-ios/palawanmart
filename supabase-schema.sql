-- Database Schema for PalawanMart (PostgreSQL / Supabase)
-- IMPORTANT: Run this entire script in your Supabase SQL Editor.
-- This script uses TEXT for IDs to support Firebase UIDs (which are strings, not UUIDs).
-- If you see "invalid input syntax for type uuid", it means you need to RE-RUN this script.

-- 1. RESET DATABASE (Run in this order to avoid foreign key errors)
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Profiles Table (Linked to Firebase Auth)
CREATE TABLE profiles (
  id TEXT PRIMARY KEY, -- Firebase UID (String)
  display_name TEXT,
  email TEXT UNIQUE,
  photo_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin', 'rider')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Orders & Order Items (Marketplace Flow)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    seller_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    rider_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready_for_pickup', 'picked_up', 'delivered', 'payment_received', 'cancelled')),
    delivery_address TEXT,
    payment_method TEXT DEFAULT 'COD',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    product_image TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop any old policies that might exist
DROP POLICY IF EXISTS "Orders access policy" ON orders;
DROP POLICY IF EXISTS "Public Orders Access" ON orders;
DROP POLICY IF EXISTS "allow_authenticated_insert_orders" ON orders;
DROP POLICY IF EXISTS "public_insert_orders" ON orders;
DROP POLICY IF EXISTS "Order items access policy" ON order_items;
DROP POLICY IF EXISTS "Public Order Items Access" ON order_items;

-- Create new clean policies (Permissive ALL to fix RLS 42501)
CREATE POLICY "orders_standard_access" ON orders FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "order_items_standard_access" ON order_items FOR ALL TO public USING (true) WITH CHECK (true);


-- 2. Categories Table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products Table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  stock INT DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Cart Table
CREATE TABLE cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 5. Messages Table (Real-time Chat)
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  receiver_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Contextual chat about a product
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Ratings Table
CREATE TABLE ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  score INT CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- --- RLS POLICIES (Public Access for Firebase integration) ---

-- Note: In a production app, you would use Supabase Auth or a secure Edge Function.
-- For this setup using the Supabase client with Firebase Auth, we enable public access policies.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Profiles Access" ON profiles FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Products Access" ON products FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Categories Access" ON categories FOR SELECT TO public USING (true);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Cart Access" ON cart_items FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Messages Access" ON messages FOR ALL TO public USING (true) WITH CHECK (true);

-- Enable real-time for messages, orders and items
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- To make a user an admin, run this SQL after they first log in:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';

-- Initial Data Seeding
INSERT INTO categories (name, slug, icon) VALUES 
('Fresh Produce', 'fresh-produce', 'Apple'),
('Clothing & Apparel', 'clothing', 'Shirt'),
('Handicrafts', 'handicrafts', 'Palette'),
('Packaged Food', 'packaged-food', 'Package'),
('Souvenirs', 'souvenirs', 'Gift'),
('Wellness', 'wellness', 'Sparkles')
ON CONFLICT (slug) DO NOTHING;

-- Note: To insert sample products, you need a valid seller_id (Firebase UID string). 
-- You can run the following AFTER you have logged in once to the website:
/*
INSERT INTO products (seller_id, category_id, name, description, price, stock, images)
SELECT 
  id, 
  (SELECT id FROM categories WHERE slug = 'handicrafts' LIMIT 1),
  'South Sea Pearl Necklace',
  'Authentic golden south sea pearls harvested from the pristine waters of Palawan.',
  25000.00,
  5,
  ARRAY['https://images.unsplash.com/photo-1515562141207-7a88fb0ce33e?auto=format&fit=crop&q=80&w=800']
FROM profiles
LIMIT 1;
*/
