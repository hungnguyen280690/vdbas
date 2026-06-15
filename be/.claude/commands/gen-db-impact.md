# gen-db-impact

Analyze an Oracle SQL DDL file alongside an API contract Markdown, then generate a `DB_IMPACT_ANALYSIS.md` covering:

1. **Table catalog** — every table grouped by role (core business, project, master data, common, auxiliary), with PK type and key notes.
2. **API → DB operation mapping** — for each endpoint, which tables are written (INSERT/UPDATE/DELETE) vs read (SELECT), and any lookup/validation tables touched.
3. **FK dependency graph** — ASCII diagram of the foreign key relationships.
4. **Key constraints & patterns** — UUID type, optimistic locking, soft delete, composite FK, denormalization, etc.
5. **Backend directory structure** — map every table to a Java entity class and suggest a layered folder layout (`api/`, `application/`, `domain/`, `common/`) following the existing module conventions.
6. **Tables NOT exposed via API** — tables that exist in the SQL but have no corresponding endpoint, with the reason.

## Usage

```
/gen-db-impact [sql_file] [contract_file] [output_file]
```

- `sql_file` — path to the `.sql` DDL file (default: `api_contract/EXPENDITURE.sql`)
- `contract_file` — path to the API contract Markdown (default: `api_contract/API_CONTRACT.md`)
- `output_file` — where to write the result (default: `api_contract/DB_IMPACT_ANALYSIS.md`)

## Steps to execute

1. Read `$sql_file` — parse all `CREATE TABLE` statements to extract table name, columns (name + type + nullable), PKs, and FKs.
2. Read `$contract_file` — extract all API endpoints and their data model sections.
3. Cross-reference: for each API endpoint identify which tables are touched (write vs read) using the `SQL Column` mappings in the contract.
4. Build FK dependency graph from `ALTER TABLE … ADD CONSTRAINT … FOREIGN KEY` statements.
5. Identify patterns: scan for columns named `VERSION`/`DOSSIER_VERSION` (optimistic lock), `STATUS` with soft-delete semantics, `RAW(16)` (UUID), composite PKs/FKs.
6. Map each table to a suggested Java entity class name and assign it to the appropriate layer (`domain/entity/`).
7. Identify tables with no API endpoint counterpart.
8. Write the full analysis to `$output_file` following the section structure above.

Output must be a self-contained Markdown file usable by both frontend and backend developers as a reference document.
