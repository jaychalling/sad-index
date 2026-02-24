-- Billboard Sadness Index — Initial Schema
-- Based on PRD Section 4.1 with improvements noted below

-- ============================================================
-- 1. bsi_weekly — 주간 BSI 점수
-- Improvement: most_sad_track/most_happy_track → JSONB (structured)
-- ============================================================
CREATE TABLE bsi_weekly (
  id              SERIAL PRIMARY KEY,
  week_date       DATE NOT NULL UNIQUE,
  bsi_score       DECIMAL(5,2) NOT NULL,
  avg_valence     DECIMAL(5,4),
  track_count     INTEGER DEFAULT 100,
  most_sad_track  JSONB,    -- {title, artist, valence, rank}
  most_happy_track JSONB,   -- {title, artist, valence, rank}
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bsi_weekly_date ON bsi_weekly(week_date DESC);

-- ============================================================
-- 2. track_weekly — 곡별 주간 상세
-- ============================================================
CREATE TABLE track_weekly (
  id              SERIAL PRIMARY KEY,
  week_date       DATE NOT NULL,
  rank            INTEGER NOT NULL,
  title           TEXT NOT NULL,
  artist          TEXT NOT NULL,
  valence         DECIMAL(5,4),
  spotify_id      TEXT,
  UNIQUE(week_date, rank)
);

CREATE INDEX idx_track_weekly_date ON track_weekly(week_date DESC);
CREATE INDEX idx_track_weekly_spotify ON track_weekly(spotify_id) WHERE spotify_id IS NOT NULL;

-- ============================================================
-- 3. economic_data — 경제 지표 (SP500, VIX, UNRATE, UMCSENT)
-- ============================================================
CREATE TABLE economic_data (
  id              SERIAL PRIMARY KEY,
  date            DATE NOT NULL,
  indicator       VARCHAR(20) NOT NULL,
  value           DECIMAL(12,4),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, indicator)
);

CREATE INDEX idx_economic_date_ind ON economic_data(date DESC, indicator);

-- ============================================================
-- 4. subscribers — 뉴스레터 구독
-- ============================================================
CREATE TABLE subscribers (
  id              SERIAL PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  tier            VARCHAR(10) DEFAULT 'free',
  subscribed_at   TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed    BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- 5. api_keys — API 키 관리
-- ============================================================
CREATE TABLE api_keys (
  id              SERIAL PRIMARY KEY,
  key             VARCHAR(64) NOT NULL UNIQUE,
  email           TEXT NOT NULL,
  tier            VARCHAR(20) DEFAULT 'free',
  daily_limit     INTEGER DEFAULT 100,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. valence_cache — Valence 분석 캐시
-- Improvement: billboard lookup index (title+artist) for non-Spotify lookups
-- ============================================================
CREATE TABLE valence_cache (
  id              SERIAL PRIMARY KEY,
  spotify_id      TEXT UNIQUE,
  title           TEXT NOT NULL,
  artist          TEXT NOT NULL,
  valence         DECIMAL(5,4) NOT NULL,
  source          VARCHAR(20) DEFAULT 'essentia',
  analyzed_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_valence_cache_lookup ON valence_cache(title, artist);

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bsi_weekly_updated_at
  BEFORE UPDATE ON bsi_weekly
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

-- subscribers: 서버만 읽기/쓰기 (service_role)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on subscribers"
  ON subscribers FOR ALL
  USING (auth.role() = 'service_role');

-- api_keys: 서버만 읽기/쓰기
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on api_keys"
  ON api_keys FOR ALL
  USING (auth.role() = 'service_role');

-- bsi_weekly: 누구나 읽기, 서버만 쓰기
ALTER TABLE bsi_weekly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read on bsi_weekly"
  ON bsi_weekly FOR SELECT
  USING (true);
CREATE POLICY "Service role write on bsi_weekly"
  ON bsi_weekly FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role update on bsi_weekly"
  ON bsi_weekly FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- track_weekly: 누구나 읽기, 서버만 쓰기
ALTER TABLE track_weekly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read on track_weekly"
  ON track_weekly FOR SELECT
  USING (true);
CREATE POLICY "Service role write on track_weekly"
  ON track_weekly FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- economic_data: 누구나 읽기, 서버만 쓰기
ALTER TABLE economic_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read on economic_data"
  ON economic_data FOR SELECT
  USING (true);
CREATE POLICY "Service role write on economic_data"
  ON economic_data FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- valence_cache: 누구나 읽기, 서버만 쓰기
ALTER TABLE valence_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read on valence_cache"
  ON valence_cache FOR SELECT
  USING (true);
CREATE POLICY "Service role write on valence_cache"
  ON valence_cache FOR ALL
  USING (auth.role() = 'service_role');
