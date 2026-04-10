-- ============================================================
-- Pakistani Legal Precedents Migration
-- ============================================================

-- Enable vector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- PRECEDENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS precedents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_name         TEXT NOT NULL,
  citation          TEXT,
  citation_type     TEXT CHECK (citation_type IN ('PLD','SCMR','CLC','PCrLJ','MLD','YLR','Other')),
  court             TEXT NOT NULL,
  court_code        TEXT NOT NULL CHECK (court_code IN ('SC','LHC','SHC','PHC','BHC','IHC','FSC')),
  year              INTEGER,
  date_decided      DATE,
  appellant         TEXT,
  respondent        TEXT,
  judge_names       TEXT[] DEFAULT '{}',
  bench_type        TEXT,
  law_category      TEXT NOT NULL,
  law_subcategory   TEXT,
  statutes          TEXT[] DEFAULT '{}',
  keywords          TEXT[] DEFAULT '{}',
  headnotes         TEXT,
  holding           TEXT,
  full_text         TEXT,
  outcome           TEXT,
  is_landmark       BOOLEAN DEFAULT FALSE,
  landmark_reason   TEXT,
  embedding         vector(1536),
  source_url        TEXT,
  source            TEXT,
  view_count        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SAVED PRECEDENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_precedents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  precedent_id   UUID NOT NULL REFERENCES precedents(id) ON DELETE CASCADE,
  notes          TEXT,
  folder         TEXT DEFAULT 'General',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, precedent_id)
);

-- ============================================================
-- LEGAL ARGUMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS legal_arguments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  query                 TEXT NOT NULL,
  case_facts            TEXT,
  argument_text         TEXT,
  cited_precedent_ids   UUID[] DEFAULT '{}',
  law_category          TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Full-text search index
CREATE INDEX IF NOT EXISTS precedents_fts_idx
  ON precedents
  USING GIN (
    to_tsvector('english',
      COALESCE(case_name, '') || ' ' ||
      COALESCE(headnotes, '') || ' ' ||
      COALESCE(holding, '') || ' ' ||
      COALESCE(full_text, '')
    )
  );

-- HNSW vector index for semantic search
CREATE INDEX IF NOT EXISTS precedents_embedding_hnsw_idx
  ON precedents
  USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

-- Regular indexes
CREATE INDEX IF NOT EXISTS precedents_court_code_idx   ON precedents(court_code);
CREATE INDEX IF NOT EXISTS precedents_year_idx         ON precedents(year);
CREATE INDEX IF NOT EXISTS precedents_law_category_idx ON precedents(law_category);
CREATE INDEX IF NOT EXISTS precedents_is_landmark_idx  ON precedents(is_landmark);
CREATE INDEX IF NOT EXISTS precedents_citation_type_idx ON precedents(citation_type);

CREATE INDEX IF NOT EXISTS saved_precedents_user_id_idx      ON saved_precedents(user_id);
CREATE INDEX IF NOT EXISTS saved_precedents_precedent_id_idx ON saved_precedents(precedent_id);
CREATE INDEX IF NOT EXISTS legal_arguments_user_id_idx       ON legal_arguments(user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_precedents_updated_at
  BEFORE UPDATE ON precedents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE precedents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_precedents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_arguments     ENABLE ROW LEVEL SECURITY;

-- Precedents: readable by all authenticated users
CREATE POLICY "Authenticated users can read precedents"
  ON precedents FOR SELECT
  TO authenticated
  USING (true);

-- Saved precedents: full CRUD for own records
CREATE POLICY "Users can view own saved precedents"
  ON saved_precedents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved precedents"
  ON saved_precedents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved precedents"
  ON saved_precedents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved precedents"
  ON saved_precedents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Legal arguments: full CRUD for own records
CREATE POLICY "Users can view own legal arguments"
  ON legal_arguments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own legal arguments"
  ON legal_arguments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own legal arguments"
  ON legal_arguments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own legal arguments"
  ON legal_arguments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- SEARCH FUNCTION (Full-Text)
-- ============================================================

CREATE OR REPLACE FUNCTION search_precedents(
  query_text        TEXT DEFAULT NULL,
  filter_court      TEXT DEFAULT NULL,
  filter_category   TEXT DEFAULT NULL,
  filter_year_from  INTEGER DEFAULT NULL,
  filter_year_to    INTEGER DEFAULT NULL,
  filter_landmark   BOOLEAN DEFAULT NULL,
  result_limit      INTEGER DEFAULT 20,
  result_offset     INTEGER DEFAULT 0
)
RETURNS TABLE (
  id                UUID,
  case_name         TEXT,
  citation          TEXT,
  citation_type     TEXT,
  court             TEXT,
  court_code        TEXT,
  year              INTEGER,
  date_decided      DATE,
  appellant         TEXT,
  respondent        TEXT,
  judge_names       TEXT[],
  bench_type        TEXT,
  law_category      TEXT,
  law_subcategory   TEXT,
  statutes          TEXT[],
  keywords          TEXT[],
  headnotes         TEXT,
  holding           TEXT,
  full_text         TEXT,
  outcome           TEXT,
  is_landmark       BOOLEAN,
  landmark_reason   TEXT,
  source_url        TEXT,
  source            TEXT,
  view_count        INTEGER,
  created_at        TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ,
  rank              REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.case_name,
    p.citation,
    p.citation_type,
    p.court,
    p.court_code,
    p.year,
    p.date_decided,
    p.appellant,
    p.respondent,
    p.judge_names,
    p.bench_type,
    p.law_category,
    p.law_subcategory,
    p.statutes,
    p.keywords,
    p.headnotes,
    p.holding,
    p.full_text,
    p.outcome,
    p.is_landmark,
    p.landmark_reason,
    p.source_url,
    p.source,
    p.view_count,
    p.created_at,
    p.updated_at,
    CASE
      WHEN query_text IS NOT NULL AND query_text <> '' THEN
        ts_rank(
          to_tsvector('english',
            COALESCE(p.case_name, '') || ' ' ||
            COALESCE(p.headnotes, '') || ' ' ||
            COALESCE(p.holding, '') || ' ' ||
            COALESCE(p.full_text, '')
          ),
          plainto_tsquery('english', query_text)
        )
      ELSE 0.0
    END AS rank
  FROM precedents p
  WHERE
    (
      query_text IS NULL OR query_text = '' OR
      to_tsvector('english',
        COALESCE(p.case_name, '') || ' ' ||
        COALESCE(p.headnotes, '') || ' ' ||
        COALESCE(p.holding, '') || ' ' ||
        COALESCE(p.full_text, '')
      ) @@ plainto_tsquery('english', query_text)
    )
    AND (filter_court IS NULL OR filter_court = '' OR p.court_code = filter_court)
    AND (filter_category IS NULL OR filter_category = '' OR p.law_category = filter_category)
    AND (filter_year_from IS NULL OR p.year >= filter_year_from)
    AND (filter_year_to IS NULL OR p.year <= filter_year_to)
    AND (filter_landmark IS NULL OR p.is_landmark = filter_landmark)
  ORDER BY
    p.is_landmark DESC,
    rank DESC,
    p.year DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

-- ============================================================
-- MATCH FUNCTION (Vector Similarity)
-- ============================================================

CREATE OR REPLACE FUNCTION match_precedents(
  query_embedding   vector(1536),
  match_threshold   FLOAT DEFAULT 0.7,
  match_count       INTEGER DEFAULT 10
)
RETURNS TABLE (
  id              UUID,
  case_name       TEXT,
  citation        TEXT,
  court           TEXT,
  court_code      TEXT,
  year            INTEGER,
  law_category    TEXT,
  headnotes       TEXT,
  holding         TEXT,
  is_landmark     BOOLEAN,
  similarity      FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.case_name,
    p.citation,
    p.court,
    p.court_code,
    p.year,
    p.law_category,
    p.headnotes,
    p.holding,
    p.is_landmark,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM precedents p
  WHERE
    p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
