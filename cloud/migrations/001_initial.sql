-- FieldScan Cloud initial SQLite schema (Megaplan §7.1 & §7.2)
-- Executed with PRAGMA foreign_keys = ON and explicit journal mode check.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'pilot',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS api_credentials (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  token_sha256 TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  max_active_jobs INTEGER NOT NULL DEFAULT 5 CHECK (max_active_jobs > 0),
  created_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  manufacturer_norm TEXT NOT NULL,
  model TEXT NOT NULL,
  model_norm TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bench_support_status TEXT NOT NULL DEFAULT 'homologated'
    CHECK (bench_support_status IN ('homologated', 'candidate', 'unsupported')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS products_mfr_model_norm
  ON products(manufacturer_norm, model_norm);

CREATE TABLE IF NOT EXISTS variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_code TEXT NOT NULL,
  variant_norm TEXT NOT NULL,
  hardware_revision TEXT,
  hardware_revision_norm TEXT NOT NULL DEFAULT '',
  discriminant_hint TEXT,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(product_id, variant_norm, hardware_revision_norm)
);

CREATE TABLE IF NOT EXISTS aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alias_norm TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id TEXT REFERENCES variants(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 100,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS aliases_lookup ON aliases(alias_norm);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  variant_id TEXT REFERENCES variants(id) ON DELETE SET NULL,
  origin_kind TEXT NOT NULL
    CHECK (origin_kind IN ('oem_official', 'oem_portal', 'distributor_public', 'test_fixture', 'context_candidate')),
  canonical_url TEXT NOT NULL,
  final_url TEXT NOT NULL,
  allowed_domain TEXT NOT NULL,
  source_class TEXT NOT NULL
    CHECK (source_class IN ('manual_pdf', 'datasheet_pdf', 'catalog_pdf', 'cad_step', 'cad_glb', 'product_page')),
  permission_policy TEXT NOT NULL
    CHECK (permission_policy IN ('redistributable', 'derived_only', 'reference_only', 'restricted')),
  decision_evidence TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS sources_canonical_url_idx
  ON sources(canonical_url, source_class);

CREATE TABLE IF NOT EXISTS objects (
  sha256 TEXT PRIMARY KEY CHECK (length(sha256) = 64),
  byte_count INTEGER NOT NULL CHECK (byte_count >= 0),
  media_type TEXT NOT NULL,
  storage_relpath TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS source_revisions (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  revision_label TEXT NOT NULL,
  content_sha256 TEXT NOT NULL REFERENCES objects(sha256),
  etag TEXT,
  last_modified TEXT,
  fetched_at INTEGER NOT NULL,
  semantic_class TEXT NOT NULL DEFAULT 'initial'
    CHECK (semantic_class IN ('initial', 'editorial_only', 'citation_update', 'procedure_change', 'physical_change')),
  evidence_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE(source_id, content_sha256)
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  request_key TEXT NOT NULL,
  request_json TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'resolve'
    CHECK (purpose IN ('resolve', 'refresh', 'seed', 'recheck')),
  state TEXT NOT NULL CHECK (state IN ('queued', 'running', 'completed', 'failed')),
  phase TEXT NOT NULL DEFAULT 'enqueued',
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at INTEGER NOT NULL,
  lease_until INTEGER,
  lease_token TEXT,
  result_json TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS jobs_active_request
  ON jobs(tenant_id, request_key)
  WHERE state IN ('queued', 'running');

CREATE INDEX IF NOT EXISTS jobs_schedule
  ON jobs(state, available_at, created_at);

CREATE TABLE IF NOT EXISTS publications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL,
  channel TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id TEXT NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
  publication_seq INTEGER NOT NULL CHECK (publication_seq > 0),
  input_fingerprint TEXT NOT NULL,
  availability TEXT NOT NULL CHECK (availability IN ('ready', 'partial')),
  cap_documentation INTEGER NOT NULL CHECK (cap_documentation IN (0, 1)),
  cap_interactive_twin INTEGER NOT NULL CHECK (cap_interactive_twin IN (0, 1)),
  cap_procedures INTEGER NOT NULL CHECK (cap_procedures IN (0, 1)),
  reason_codes_json TEXT NOT NULL DEFAULT '[]',
  key_id TEXT NOT NULL,
  manifest_sha256 TEXT NOT NULL CHECK (length(manifest_sha256) = 64),
  envelope_etag TEXT NOT NULL,
  envelope_bytes BLOB NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'superseded', 'withdrawn')),
  created_at INTEGER NOT NULL,
  UNIQUE(tenant_id, issuer, channel, product_id, variant_id, publication_seq)
);

CREATE INDEX IF NOT EXISTS publications_fingerprint_idx
  ON publications(tenant_id, issuer, channel, product_id, variant_id, input_fingerprint);

CREATE TABLE IF NOT EXISTS publication_objects (
  publication_id TEXT NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  package_path TEXT NOT NULL,
  document_id TEXT,
  object_sha256 TEXT NOT NULL REFERENCES objects(sha256) ON DELETE RESTRICT,
  byte_count INTEGER NOT NULL CHECK (byte_count >= 0),
  PRIMARY KEY (publication_id, role, package_path)
);

CREATE INDEX IF NOT EXISTS publication_objects_sha_idx
  ON publication_objects(object_sha256);

CREATE TABLE IF NOT EXISTS current_publications (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id TEXT NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
  publication_id TEXT NOT NULL REFERENCES publications(id) ON DELETE RESTRICT,
  publication_seq INTEGER NOT NULL CHECK (publication_seq > 0),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, channel, product_id, variant_id)
);

CREATE TABLE IF NOT EXISTS source_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  job_id TEXT,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'worker',
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS publication_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  publication_id TEXT REFERENCES publications(id) ON DELETE SET NULL,
  job_id TEXT,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'worker',
  reason TEXT NOT NULL DEFAULT '',
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
