# ADR-005: PostgreSQL 16 TSVECTOR with GIN Index over External Search Engine

* **Status:** Accepted
* **Context:** Belooga requires talent discovery and autocomplete search across candidates' names, headlines, bios, and skills.
* **Decision:** Utilize **PostgreSQL 16 native `tsvector` with GIN Indexes and `pg_trgm`**, rejecting external search clusters (Elasticsearch / Typesense).
* **Rationale:**
  1. **Zero Dual-Write Synchronization Lag:** Candidate profile updates instantly reflect in the search index within the same database transaction.
  2. **Operational Simplicity:** Eliminates the infrastructure cost, networking latency, and failure modes of managing a separate Elasticsearch cluster.
  3. **High Throughput:** GIN indexes with `ts_rank_cd` sustain sub-10ms search queries across candidate profiles.
* **Consequences:**
  * Queries must never combine `search_vector @@ ...` with `OR ILIKE '%...%'`, which disables the GIN index scan.
