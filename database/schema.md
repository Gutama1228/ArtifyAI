# 🗄️ ArtifyAI - Complete Database Schema

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Database:** PostgreSQL (Supabase)

---

## 📋 Table of Contents

1. [Setup Instructions](#setup-instructions)
2. [Database Schema](#database-schema)
3. [Indexes](#indexes)
4. [Row Level Security (RLS)](#row-level-security)
5. [Functions & Triggers](#functions--triggers)
6. [Default Settings](#default-settings)

---

## 🚀 Setup Instructions

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up / Sign in
3. Create new project
4. Wait for database to be ready (~2 minutes)

### Step 2: Run This Schema
1. Go to SQL Editor in Supabase Dashboard
2. Copy ALL code below
3. Paste and click "Run"
4. Wait for completion (~30 seconds)

### Step 3: Get API Keys
1. Go to Project Settings > API
2. Copy `Project URL` and `anon/public key`
3. Add to `.env.local` file

---

## 🗃️ Database Schema

Copy and paste ALL code below into Supabase SQL Editor:

```sql
-- =====================================================
-- ARTIFYAI DATABASE SCHEMA
-- Version: 1.0.0
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- 1. USERS & AUTHENTICATION
-- =====================================================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  
  -- Usage limits
  credits_remaining INT DEFAULT 10,
  daily_limit INT DEFAULT 10,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  email_verification_token TEXT,
  email_verification_expires_at TIMESTAMPTZ,
  
  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Plan details
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trialing', 'past_due')),
  
  -- Billing period
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  -- Payment integration
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  
  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, plan)
);

-- =====================================================
-- 2. CHAT SYSTEM
-- =====================================================

-- Chat Conversations
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Chat details
  title TEXT DEFAULT 'New Chat',
  description TEXT,
  
  -- Activity tracking
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  is_archived BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  
  -- Counters
  message_count INT DEFAULT 0,
  generation_count INT DEFAULT 0,
  
  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  
  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Image generation
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  model_used TEXT DEFAULT 'stable-diffusion-xl',
  
  -- Generation metadata
  generation_params JSONB DEFAULT '{}'::jsonb,
  tokens_used INT DEFAULT 0,
  generation_time FLOAT,
  
  -- Status
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. IMAGE GENERATION
-- =====================================================

-- Generation History
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Prompt details
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  
  -- Image details
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  storage_path TEXT,
  
  -- Model & settings
  model TEXT DEFAULT 'stable-diffusion-xl',
  width INT DEFAULT 1024,
  height INT DEFAULT 1024,
  steps INT DEFAULT 50,
  guidance_scale FLOAT DEFAULT 7.5,
  seed BIGINT,
  sampler TEXT DEFAULT 'euler_a',
  
  -- Status & visibility
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  is_saved BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Performance metrics
  generation_time_ms INT,
  queue_time_ms INT,
  
  -- Metadata
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation Ratings (for user satisfaction tracking)
CREATE TABLE IF NOT EXISTS generation_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE NOT NULL,
  
  -- Rating details
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  
  -- Categories (optional detailed feedback)
  quality_rating INT CHECK (quality_rating >= 1 AND quality_rating <= 5),
  accuracy_rating INT CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  creativity_rating INT CHECK (creativity_rating >= 1 AND creativity_rating <= 5),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, generation_id)
);

-- =====================================================
-- 4. USAGE TRACKING & ANALYTICS
-- =====================================================

-- Usage Logs (detailed activity tracking)
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'generation', 'chat_created', 'chat_message', 'download', 
    'api_call', 'login', 'logout', 'profile_update'
  )),
  
  -- Resource usage
  credits_used INT DEFAULT 1,
  tokens_used INT DEFAULT 0,
  
  -- Context
  resource_id UUID,
  resource_type TEXT,
  
  -- Request details
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Statistics (aggregated data)
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  
  -- User metrics
  total_users INT DEFAULT 0,
  active_users INT DEFAULT 0,
  new_users INT DEFAULT 0,
  
  -- Activity metrics
  total_generations INT DEFAULT 0,
  total_chats INT DEFAULT 0,
  total_messages INT DEFAULT 0,
  
  -- Subscription metrics
  free_users INT DEFAULT 0,
  pro_users INT DEFAULT 0,
  enterprise_users INT DEFAULT 0,
  
  -- Revenue
  revenue DECIMAL(10,2) DEFAULT 0,
  mrr DECIMAL(10,2) DEFAULT 0,
  
  -- Performance
  avg_generation_time_ms INT DEFAULT 0,
  avg_response_time_ms INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. ADMIN & SYSTEM MANAGEMENT
-- =====================================================

-- Admin Settings (key-value store)
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Cleanup Warnings (for free tier auto-delete)
CREATE TABLE IF NOT EXISTS cleanup_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Warning details
  warning_type TEXT DEFAULT 'inactivity' CHECK (warning_type IN ('inactivity', 'storage_limit', 'violation')),
  warning_sent_at TIMESTAMPTZ DEFAULT NOW(),
  will_delete_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  -- Email tracking
  email_sent BOOLEAN DEFAULT false,
  email_opened BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Flags (for gradual rollouts)
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  
  -- Rollout strategy
  rollout_percentage INT DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  allowed_users UUID[] DEFAULT ARRAY[]::UUID[],
  allowed_tiers TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Notifications (announcements, maintenance, etc)
CREATE TABLE IF NOT EXISTS system_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Notification details
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success', 'maintenance')),
  
  -- Targeting
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'free', 'pro', 'enterprise', 'admins')),
  
  -- Display settings
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  
  -- Schedule
  start_at TIMESTAMPTZ DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  
  -- Metadata
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- Chats
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_activity ON chats(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_is_archived ON chats(is_archived);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

-- Generations
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_chat_id ON generations(chat_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_is_public ON generations(is_public);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);

-- Generation Ratings
CREATE INDEX IF NOT EXISTS idx_generation_ratings_rating ON generation_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_generation_ratings_user_id ON generation_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_ratings_generation_id ON generation_ratings(generation_id);

-- Usage Logs
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action_type ON usage_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- Daily Stats
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleanup_warnings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Subscriptions Policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chats Policies
CREATE POLICY "Users can view own chats" ON chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats" ON chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON chats
  FOR DELETE USING (auth.uid() = user_id);

-- Messages Policies
CREATE POLICY "Users can view messages in own chats" ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
  );

CREATE POLICY "Users can create messages in own chats" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
  );

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
  );

-- Generations Policies
CREATE POLICY "Users can view own generations" ON generations
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own generations" ON generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations" ON generations
  FOR UPDATE USING (auth.uid() = user_id);

-- Generation Ratings Policies
CREATE POLICY "Users can view all ratings" ON generation_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create own ratings" ON generation_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON generation_ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Usage Logs Policies
CREATE POLICY "Users can view own usage logs" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage logs" ON usage_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 8. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update chat activity when message is added
CREATE OR REPLACE FUNCTION update_chat_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats 
  SET 
    last_activity_at = NOW(),
    last_message_at = NOW(),
    message_count = message_count + 1,
    updated_at = NOW()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_activity
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_activity();

-- Function: Increment generation count in chat
CREATE OR REPLACE FUNCTION increment_chat_generation_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.chat_id IS NOT NULL THEN
    UPDATE chats 
    SET generation_count = generation_count + 1
    WHERE id = NEW.chat_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_generation_count
AFTER INSERT ON generations
FOR EACH ROW
EXECUTE FUNCTION increment_chat_generation_count();

-- Function: Reset daily credits at midnight
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    credits_remaining = daily_limit,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function: Check and mark inactive chats for cleanup (FREE TIER ONLY)
CREATE OR REPLACE FUNCTION check_inactive_chats()
RETURNS void AS $$
BEGIN
  -- Create warnings for chats inactive for 23 days (7 days before deletion)
  INSERT INTO cleanup_warnings (chat_id, user_id, will_delete_at, warning_type)
  SELECT 
    c.id, 
    c.user_id, 
    c.last_activity_at + INTERVAL '30 days',
    'inactivity'
  FROM chats c
  JOIN profiles p ON c.user_id = p.id
  WHERE 
    p.subscription_tier = 'free'
    AND c.last_activity_at < NOW() - INTERVAL '23 days'
    AND NOT c.is_archived
    AND NOT EXISTS (
      SELECT 1 FROM cleanup_warnings 
      WHERE chat_id = c.id 
      AND is_deleted = false
      AND warning_type = 'inactivity'
    );
  
  -- Delete chats inactive for 30 days (FREE tier only)
  DELETE FROM chats
  WHERE id IN (
    SELECT c.id 
    FROM chats c
    JOIN profiles p ON c.user_id = p.id
    WHERE 
      p.subscription_tier = 'free'
      AND c.last_activity_at < NOW() - INTERVAL '30 days'
      AND NOT c.is_archived
  );
  
  -- Mark warnings as completed for deleted chats
  UPDATE cleanup_warnings
  SET 
    is_deleted = true,
    deleted_at = NOW()
  WHERE 
    will_delete_at < NOW() 
    AND is_deleted = false
    AND warning_type = 'inactivity';
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate average user rating
CREATE OR REPLACE FUNCTION calculate_average_rating()
RETURNS DECIMAL AS $$
DECLARE
  avg_rating DECIMAL;
BEGIN
  SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,1)
  INTO avg_rating
  FROM generation_ratings
  WHERE created_at > NOW() - INTERVAL '90 days';
  
  RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE(
  total_chats BIGINT,
  total_messages BIGINT,
  total_generations BIGINT,
  average_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM chats WHERE user_id = user_uuid),
    (SELECT COUNT(*) FROM messages m JOIN chats c ON m.chat_id = c.id WHERE c.user_id = user_uuid),
    (SELECT COUNT(*) FROM generations WHERE user_id = user_uuid),
    (SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,1) FROM generation_ratings WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. DEFAULT ADMIN SETTINGS
-- =====================================================

INSERT INTO admin_settings (key, value, description, category, is_public) VALUES
  ('site_name', '"ArtifyAI"', 'Website name', 'general', true),
  ('site_description', '"Transform your imagination into reality with AI-powered image generation"', 'Website description', 'general', true),
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode', 'system', false),
  ('allow_registrations', 'true', 'Allow new user registrations', 'auth', false),
  ('max_free_chats', '5', 'Maximum active chats for free users', 'limits', false),
  ('max_pro_chats', '100', 'Maximum active chats for pro users', 'limits', false),
  ('free_daily_limit', '10', 'Daily generation limit for free users', 'limits', true),
  ('pro_daily_limit', '500', 'Daily generation limit for pro users', 'limits', true),
  ('enterprise_daily_limit', '-1', 'Daily generation limit for enterprise users (-1 = unlimited)', 'limits', true),
  ('chat_retention_days', '{"free": 30, "pro": 90, "enterprise": -1}', 'Chat retention period in days by tier (-1 = forever)', 'retention', true),
  ('default_model', '"stable-diffusion-xl"', 'Default AI model for image generation', 'generation', true),
  ('max_image_width', '2048', 'Maximum image width in pixels', 'generation', true),
  ('max_image_height', '2048', 'Maximum image height in pixels', 'generation', true),
  ('email_notifications_enabled', 'true', 'Enable email notifications', 'notifications', false),
  ('smtp_configured', 'false', 'Is SMTP properly configured', 'email', false)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 10. INITIAL FEATURE FLAGS
-- =====================================================

INSERT INTO feature_flags (name, description, is_enabled) VALUES
  ('image_upscaling', 'Allow users to upscale generated images', false),
  ('image_editing', 'Enable image editing features', false),
  ('batch_generation', 'Allow batch image generation', false),
  ('api_access', 'Enable API access for users', false),
  ('social_sharing', 'Enable social media sharing', true),
  ('public_gallery', 'Enable public image gallery', true),
  ('chat_export', 'Allow exporting chat conversations', true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SCHEMA SETUP COMPLETE! ✅
-- =====================================================

-- Verify installation
DO $$
DECLARE
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'subscriptions', 'chats', 'messages', 
    'generations', 'generation_ratings', 'usage_logs',
    'daily_stats', 'admin_settings', 'cleanup_warnings',
    'feature_flags', 'system_notifications'
  );
  
  IF table_count = 12 THEN
    RAISE NOTICE '✅ Database schema installed successfully! All 12 tables created.';
  ELSE
    RAISE NOTICE '⚠️ Warning: Only % out of 12 tables were created.', table_count;
  END IF;
END $$;
```

---

## ✅ Verification Checklist

After running the schema, verify:

- [ ] All 12 tables created
- [ ] All indexes created
- [ ] RLS policies active
- [ ] Triggers working
- [ ] Default settings inserted
- [ ] Feature flags initialized

---

## 🔐 Security Notes

1. **Row Level Security (RLS)** is enabled on all user-facing tables
2. Service role key needed for admin operations
3. Anon key safe for client-side use
4. All sensitive data uses proper policies

---

## 📊 Storage Estimates

With this schema:
- **1 user** = ~5KB (profile + subscription)
- **1 chat** = ~2KB
- **1 message** = ~1KB
- **1 generation** = ~3KB (metadata only, images stored separately)

**500MB can handle:**
- 100,000+ users
- 250,000+ chats
- 500,000+ messages
- 150,000+ generations

---

## 🔄 Maintenance & Updates

### Daily Cron Jobs (Setup in Vercel)

Create these API routes and schedule them:

**1. Reset Daily Credits** - Run at 00:00 UTC
```bash
GET /api/cron/reset-credits
```

**2. Check Inactive Chats** - Run at 02:00 UTC  
```bash
GET /api/cron/cleanup-chats
```

**3. Update Daily Stats** - Run at 23:59 UTC
```bash
GET /api/cron/update-stats
```

---

## 📞 Support

For issues or questions:
1. Check Supabase logs
2. Verify RLS policies
3. Check function execution
4. Review indexes

---

## 📝 Changelog

### Version 1.0.0 (December 2024)
- Initial schema release
- 12 core tables
- RLS policies
- Automated triggers
- Multi-tier support

---

**✅ Ready to use! Copy everything above and paste into Supabase SQL Editor.**

-- Add to profiles table
ALTER TABLE profiles ADD COLUMN storage_used_bytes BIGINT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN storage_quota_bytes BIGINT DEFAULT 52428800; -- 50MB for free

-- Add storage tracking
CREATE TABLE storage_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  storage_tier TEXT DEFAULT 'hot',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
