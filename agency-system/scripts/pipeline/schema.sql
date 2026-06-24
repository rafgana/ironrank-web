-- Migration: agency system tables
-- Ejecutar en Supabase SQL editor o via supabase CLI
-- Crea las 4 tablas del sistema de agencia

-- ============================================================
-- agency_prospects: leads cualificados
-- ============================================================
CREATE TABLE IF NOT EXISTS agency_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size_estimate TEXT,
  geography TEXT,
  founders JSONB DEFAULT '[]',
  signals JSONB DEFAULT '[]',
  enrichment JSONB DEFAULT '{}',
  fit_score INTEGER DEFAULT 0,
  angle TEXT,
  icp TEXT,
  source TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'enriched', 'qualified', 'contacted', 'replied', 'won', 'lost', 'unqualified')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  enriched_at TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agency_prospects_user ON agency_prospects(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_prospects_status ON agency_prospects(status);
CREATE INDEX IF NOT EXISTS idx_agency_prospects_fit ON agency_prospects(fit_score DESC);

ALTER TABLE agency_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prospects" ON agency_prospects
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- agency_dossiers: research por persona
-- ============================================================
CREATE TABLE IF NOT EXISTS agency_dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES agency_prospects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  linkedin_url TEXT,
  background TEXT,
  signals JSONB DEFAULT '[]',
  outreach_angle TEXT,
  talking_points JSONB DEFAULT '[]',
  body_markdown TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_dossiers_user ON agency_dossiers(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_dossiers_prospect ON agency_dossiers(prospect_id);

ALTER TABLE agency_dossiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own dossiers" ON agency_dossiers
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- agency_sequences: outbound multicanal
-- ============================================================
CREATE TABLE IF NOT EXISTS agency_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES agency_prospects(id) ON DELETE CASCADE,
  channel TEXT CHECK (channel IN ('email', 'linkedin', 'twitter', 'phone')),
  subject TEXT,
  body_markdown TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'replied', 'bounced', 'archived')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_sequences_user ON agency_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_sequences_prospect ON agency_sequences(prospect_id);
CREATE INDEX IF NOT EXISTS idx_agency_sequences_status ON agency_sequences(status);

ALTER TABLE agency_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sequences" ON agency_sequences
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- agency_pipeline_events: log de transiciones
-- ============================================================
CREATE TABLE IF NOT EXISTS agency_pipeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES agency_prospects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  channel TEXT,
  actor TEXT CHECK (actor IN ('user', 'agent', 'system')),
  note TEXT,
  metadata JSONB DEFAULT '{}',
  ts TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_events_user ON agency_pipeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_events_prospect ON agency_pipeline_events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_agency_events_ts ON agency_pipeline_events(ts DESC);

ALTER TABLE agency_pipeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own events" ON agency_pipeline_events
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
