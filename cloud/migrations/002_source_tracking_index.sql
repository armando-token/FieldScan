-- Migration 002: Index source_revisions by source_id and fetched_at for semantic diff lookup (CL-SRC-03 / CL-OPS-02)

CREATE INDEX IF NOT EXISTS source_revisions_lookup_idx
  ON source_revisions(source_id, fetched_at DESC);
