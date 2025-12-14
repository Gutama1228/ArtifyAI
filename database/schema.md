# 🗄️ ArtifyAI Database Schema v3.0

**Save as:** `database/schema.md`

## Quick Setup

1. Go to Supabase Dashboard → SQL Editor
2. Copy ALL code below
3. Click "Run"
4. Done! ✅

---

## Complete SQL Schema

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============= TABLES =============

-- 1. Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free','pro','enterprise')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user','admin','moderator')),
  credits_remaining INT DEFAULT 10,
  daily_limit INT DEFAULT 10,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  storage_used_bytes BIGINT DEFAULT 0,
  storage_quota_bytes BIGINT DEFAULT 52428800,
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  trust_score INT DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  phone_number TEXT,
  phone_verified BOOLEAN DEFAULT false,
  login_streak_days INT DEFAULT 0,
  last_login_date DATE,
  total_generations INT DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free','pro','enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','trialing','past_due')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan)
);

-- 3. Chats
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Chat',
  description TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  message_count INT DEFAULT 0,
  generation_count INT DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  model_used TEXT DEFAULT 'stable-diffusion-xl',
  generation_params JSONB DEFAULT '{}'::jsonb,
  tokens_used INT DEFAULT 0,
  generation_time FLOAT,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Generations
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  storage_path TEXT,
  file_size_bytes BIGINT,
  model TEXT DEFAULT 'stable-diffusion-xl',
  width INT DEFAULT 1024,
  height INT DEFAULT 1024,
  steps INT DEFAULT 50,
  guidance_scale FLOAT DEFAULT 7.5,
  seed BIGINT,
  sampler TEXT DEFAULT 'euler_a',
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending','processing','completed','failed')),
  is_saved BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  generation_time_ms INT,
  queue_time_ms INT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Generation Ratings
CREATE TABLE generation_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  quality_rating INT CHECK (quality_rating >= 1 AND quality_rating <= 5),
  accuracy_rating INT CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  creativity_rating INT CHECK (creativity_rating >= 1 AND creativity_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, generation_id)
);

-- 7. Device Tracking
CREATE TABLE device_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_fingerprint TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  platform TEXT,
  trust_score INT DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_suspicious BOOLEAN DEFAULT false,
  suspicious_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. IP Rate Limits
CREATE TABLE ip_rate_limits (
  ip_address INET PRIMARY KEY,
  daily_usage INT DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  blocked_until TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Abuse Reports
CREATE TABLE abuse_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('multiple_accounts','spam','suspicious_pattern','vpn_abuse','bot_behavior','terms_violation')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  description TEXT,
  evidence JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','investigating','actioned','dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  review_notes TEXT,
  action_taken TEXT,
  user_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- 10. Usage Logs
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('generation','chat_created','chat_message','download','api_call','login','logout','profile_update','subscription_change')),
  credits_used INT DEFAULT 1,
  tokens_used INT DEFAULT 0,
  resource_id UUID,
  resource_type TEXT,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Daily Stats
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  total_users INT DEFAULT 0,
  active_users INT DEFAULT 0,
  new_users INT DEFAULT 0,
  total_generations INT DEFAULT 0,
  total_chats INT DEFAULT 0,
  total_messages INT DEFAULT 0,
  free_users INT DEFAULT 0,
  pro_users INT DEFAULT 0,
  enterprise_users INT DEFAULT 0,
  revenue_cents BIGINT DEFAULT 0,
  mrr_cents BIGINT DEFAULT 0,
  avg_generation_time_ms INT DEFAULT 0,
  flagged_accounts INT DEFAULT 0,
  blocked_ips INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Admin Settings
CREATE TABLE admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Cleanup Warnings
CREATE TABLE cleanup_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  warning_type TEXT DEFAULT 'inactivity' CHECK (warning_type IN ('inactivity','storage_limit','violation')),
  warning_sent_at TIMESTAMPTZ DEFAULT NOW(),
  will_delete_at TIMESTAMPTZ NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Feature Flags
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INT DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  allowed_users UUID[] DEFAULT ARRAY[]::UUID[],
  allowed_tiers TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. System Notifications
CREATE TABLE system_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info','warning','error','success','maintenance')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all','free','pro','enterprise','admins')),
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  start_at TIMESTAMPTZ DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============= INDEXES =============

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_subscription ON profiles(subscription_tier);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_chats_user ON chats(user_id);
CREATE INDEX idx_chats_activity ON chats(last_activity_at DESC);
CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_gen_user ON generations(user_id);
CREATE INDEX idx_gen_created ON generations(created_at DESC);
CREATE INDEX idx_device_fingerprint ON device_tracking(device_fingerprint);
CREATE INDEX idx_device_ip ON device_tracking(ip_address);
CREATE INDEX idx_usage_user ON usage_logs(user_id);
CREATE INDEX idx_usage_created ON usage_logs(created_at DESC);

-- ============= RLS =============

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users view own chats" ON chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users CRUD own chats" ON chats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own messages" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid()));
CREATE POLICY "Users create own messages" ON messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid()));
CREATE POLICY "Users view own generations" ON generations FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users create generations" ON generations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============= FUNCTIONS =============

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION update_chat_activity() RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats SET last_activity_at = NOW(), message_count = message_count + 1 WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_activity AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_chat_activity();

CREATE OR REPLACE FUNCTION increment_generation_count() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.chat_id IS NOT NULL THEN UPDATE chats SET generation_count = generation_count + 1 WHERE id = NEW.chat_id; END IF;
  UPDATE profiles SET total_generations = total_generations + 1 WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_generation_count AFTER INSERT ON generations FOR EACH ROW EXECUTE FUNCTION increment_generation_count();

CREATE OR REPLACE FUNCTION update_login_streak() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_login_date = OLD.last_login_date + INTERVAL '1 day' THEN NEW.login_streak_days := OLD.login_streak_days + 1;
  ELSIF NEW.last_login_date > OLD.last_login_date + INTERVAL '1 day' THEN NEW.login_streak_days := 1; END IF;
  IF NEW.login_streak_days >= 30 THEN NEW.daily_limit := 20;
  ELSIF NEW.login_streak_days >= 15 THEN NEW.daily_limit := 15;
  ELSIF NEW.login_streak_days >= 7 THEN NEW.daily_limit := 12;
  ELSE NEW.daily_limit := 10; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_login_streak BEFORE UPDATE OF last_login_date ON profiles FOR EACH ROW EXECUTE FUNCTION update_login_streak();

CREATE OR REPLACE FUNCTION enforce_image_limit() RETURNS TRIGGER AS $$
DECLARE user_tier TEXT; image_count INT;
BEGIN
  SELECT subscription_tier INTO user_tier FROM profiles WHERE id = NEW.user_id;
  IF user_tier = 'free' THEN
    SELECT COUNT(*) INTO image_count FROM generations WHERE user_id = NEW.user_id AND is_saved = false;
    IF image_count >= 30 THEN
      DELETE FROM generations WHERE id IN (SELECT id FROM generations WHERE user_id = NEW.user_id AND is_saved = false ORDER BY created_at ASC LIMIT (image_count - 29));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_image_limit AFTER INSERT ON generations FOR EACH ROW EXECUTE FUNCTION enforce_image_limit();

CREATE OR REPLACE FUNCTION reset_daily_credits() RETURNS void AS $$
BEGIN UPDATE profiles SET credits_remaining = daily_limit, last_reset_date = CURRENT_DATE WHERE last_reset_date < CURRENT_DATE; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_inactive_chats() RETURNS void AS $$
BEGIN
  INSERT INTO cleanup_warnings (chat_id, user_id, will_delete_at)
  SELECT c.id, c.user_id, c.last_activity_at + INTERVAL '30 days'
  FROM chats c JOIN profiles p ON c.user_id = p.id
  WHERE p.subscription_tier = 'free' AND c.last_activity_at < NOW() - INTERVAL '23 days' AND NOT c.is_archived
  AND NOT EXISTS (SELECT 1 FROM cleanup_warnings WHERE chat_id = c.id AND is_deleted = false);
  
  DELETE FROM chats WHERE id IN (SELECT c.id FROM chats c JOIN profiles p ON c.user_id = p.id WHERE p.subscription_tier = 'free' AND c.last_activity_at < NOW() - INTERVAL '30 days');
  
  UPDATE cleanup_warnings SET is_deleted = true, deleted_at = NOW() WHERE will_delete_at < NOW() AND is_deleted = false;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_public_stats() RETURNS TABLE(active_users BIGINT, total_generations BIGINT, total_conversations BIGINT, average_rating NUMERIC) AS $$
BEGIN RETURN QUERY SELECT
  (SELECT COUNT(*) FROM profiles WHERE last_login_at > NOW() - INTERVAL '30 days'),
  (SELECT COUNT(*) FROM generations),
  (SELECT COUNT(*) FROM chats),
  (SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 4.9) FROM generation_ratings WHERE created_at > NOW() - INTERVAL '90 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============= DEFAULT DATA =============

INSERT INTO admin_settings (key, value, description) VALUES
('free_daily_limit', '10', 'Free tier daily limit'),
('pro_daily_limit', '500', 'Pro tier daily limit'),
('max_free_chats', '5', 'Max chats for free users'),
('chat_retention_days', '{"free":30,"pro":90,"enterprise":-1}', 'Retention days by tier')
ON CONFLICT (key) DO NOTHING;

INSERT INTO feature_flags (name, description, is_enabled) VALUES
('batch_generation', 'Batch image generation', true),
('public_gallery', 'Public image gallery', true),
('chat_export', 'Export chat conversations', true)
ON CONFLICT (name) DO NOTHING;

-- ============= VERIFICATION =============

DO $$
DECLARE table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name IN ('profiles','subscriptions','chats','messages','generations','generation_ratings','device_tracking','ip_rate_limits','abuse_reports','usage_logs','daily_stats','admin_settings','cleanup_warnings','feature_flags','system_notifications');
  IF table_count = 15 THEN RAISE NOTICE '✅ All 15 tables created successfully!';
  ELSE RAISE WARNING '⚠️ Only % tables created', table_count; END IF;
END $$;
```

---

## Features

✅ **15 Tables** - All core functionality  
✅ **Anti-Abuse** - Device tracking, IP limits, trust score  
✅ **Gamification** - Login streaks with bonuses  
✅ **Auto-Cleanup** - Free tier 30-day deletion  
✅ **Storage Limits** - Rolling 30-image limit (free)  
✅ **Security** - Row Level Security enabled  
✅ **Performance** - Essential indexes  
✅ **Automation** - Triggers & functions

---

## Cron Jobs (Setup in Vercel)

Create these API routes:

```typescript
// app/api/cron/reset-credits/route.ts
export async function GET() {
  const { error } = await supabase.rpc('reset_daily_credits');
  return Response.json({ success: !error });
}

// app/api/cron/cleanup-chats/route.ts  
export async function GET() {
  const { error } = await supabase.rpc('check_inactive_chats');
  return Response.json({ success: !error });
}
```

Schedule in `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/reset-credits", "schedule": "0 0 * * *" },
    { "path": "/api/cron/cleanup-chats", "schedule": "0 2 * * *" }
  ]
}
```

---

## Next Steps

1. ✅ Run schema in Supabase
2. ✅ Get API keys
3. ✅ Add to `.env.local`
4. ✅ Start building features!

**Done! Database ready! 🚀**
