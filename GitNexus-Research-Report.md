# Báo cáo Đánh giá GitNexus MCP Tool

> **Ngày nghiên cứu:** 11/06/2026  
> **Phương pháp:** 2 vòng deep research với adversarial verification  
> **Vòng 1:** 103 agents, 21 nguồn, 89 claims → 25 verified (tổng quan + bug reports)  
> **Vòng 2:** 97 agents, 15 nguồn, 68 claims → 25 verified (cross-module use case)  
> **Repo nghiên cứu:** [abhigyanpatwari/GitNexus](https://github.com/abhigyanpatwari/GitNexus)

---

## Tóm tắt điều hành

GitNexus là một knowledge graph engine mã nguồn mở theo kiến trúc MCP-native, sử dụng KuzuDB/LadybugDB làm cơ sở dữ liệu đồ thị nhúng và cung cấp 16 MCP tools nhằm trang bị cho AI coding assistants khả năng hiểu cấu trúc codebase.

**Kết luận chính:**
- Các claim về giảm token **không có cơ sở thực nghiệm** — tất cả số liệu định lượng (74%, 120x, 84–93%) bị bác bỏ 0/3 trong adversarial verification.
- Phản hồi cộng đồng **chủ yếu là bug reports**, không phải endorsements về hiệu năng.
- Công cụ có **lỗi kiến trúc nghiêm trọng** giữa MCP path và CLI path.
- Dự án đang phát triển tích cực nhưng **chưa ổn định cho production**.

---

## Phương pháp nghiên cứu

| Bước | Mô tả | Kết quả |
|------|--------|---------|
| Scope | Phân tích câu hỏi thành 5 góc độ tìm kiếm | 5 angles |
| Search | 5 agents tìm kiếm song song | 21 nguồn duy nhất |
| Fetch | Trích xuất claims từ nguồn | 89 claims |
| Verify | Adversarial 3-vote per claim (cần 2/3 refutes để loại) | 25 verified |
| Synthesize | Tổng hợp & phân loại | 7 confirmed / 18 killed |

**5 góc độ nghiên cứu:**
1. Primary community feedback
2. Token reduction benchmarks
3. Developer forum & Discord discussion
4. Competitive comparison
5. Skeptical & limitations perspective

---

## Phần 1: Kiến trúc & Tính năng (Đã xác minh)

### 1.1 Kiến trúc cốt lõi
**Confidence: HIGH | Vote: 2-1**

GitNexus sử dụng KuzuDB (đổi tên thành LadybugDB) làm embedded graph database và MCP server (stdio transport) làm interface layer. Công cụ parse toàn bộ codebase qua Tree-sitter AST (hỗ trợ 14+ ngôn ngữ), xây dựng knowledge graph offline, sau đó expose qua 16 MCP tools.

**Nguồn xác minh:**
- [ARCHITECTURE.md — GitHub repo chính thức](https://github.com/abhigyanpatwari/GitNexus)
- [MarkTechPost — "Meet GitNexus: An Open-Source MCP-Native Knowledge Graph Engine" (24/04/2026)](https://www.marktechpost.com/2026/04/24/meet-gitnexus-an-open-source-mcp-native-knowledge-graph-engine-that-gives-claude-code-and-cursor-full-codebase-structural-awareness/)
- [dev.to — "I built a zero-dependency alternative to GitNexus"](https://dev.to/cyber_audiomind_3a9f839c/i-built-a-zero-dependency-alternative-to-gitnexus-for-ai-assisted-coding-2gl6)

**Bằng chứng cụ thể:** Issue #285 trên GitHub trực tiếp tham chiếu "KuzuDB stdout corruption", xác nhận đây là database được dùng thực tế trong production code, không chỉ trong tài liệu.

---

### 1.2 Tool `gitnexus_impact()` — Blast-radius analysis
**Confidence: MEDIUM | Vote: 2-1**

GitNexus cung cấp công cụ `gitnexus_impact()` phân tích ảnh hưởng (blast radius) của một thay đổi code lên toàn codebase, với depth grouping và confidence scoring.

**Nguồn xác minh:**
- [GitHub Issues #316 và #631](https://github.com/abhigyanpatwari/GitNexus/issues/316) — bug reports trực tiếp tham chiếu tool này, xác nhận nó tồn tại trong production
- [npm package @iflow-mcp/abhigyanpatwari-gitnexus](https://www.npmjs.com/package/@iflow-mcp/abhigyanpatwari-gitnexus) — liệt kê tool trong manifest
- [dev.to — Xavier Masle build log](https://dev.to/xaviermasle/how-i-built-a-bot-free-ai-super-app-using-electron-gitnexus-bullmq-qdrant-mcp-13hd)

**Lưu ý:** Vote 2-1 do nguồn blog là secondary. Tuy nhiên GitHub primary source đủ để xác nhận.

---

## Phần 2: Benchmark Giảm Token — KHÔNG CÓ CƠ SỞ

> **Kết luận rõ ràng: Tất cả các con số định lượng về token reduction đều bị bác bỏ 0/3.**

### 2.1 Các claim bị bác bỏ

| Claim | Nguồn | Kết quả verify |
|-------|--------|----------------|
| "74% token savings, 88% fewer tool calls" (Satapathy case study) | [blog.pebblous.ai](https://blog.pebblous.ai/report/gitnexus-production-report-2026/en/) | **0-3 Bị bác bỏ** |
| "120x token reduction (412,000 → 3,400 tokens)" | [Hacker News #47234516](https://news.ycombinator.com/item?id=47234516) | **0-3 Bị bác bỏ** |
| "84-93% ACP token reduction" | [dev.to — ACP benchmark](https://dev.to/mz06/we-benchmarked-an-84-token-reduction-then-we-open-sourced-the-protocol-2j87) | **0-3 Bị bác bỏ** |
| "85-100x reduction via progressive disclosure MCP" | [matthewkruczek.ai](https://matthewkruczek.ai/blog/progressive-disclosure-mcp-servers.html) | **0-3 Bị bác bỏ** |
| "~70% token cut via Tree-sitter compression" | [rywalker.com research](https://rywalker.com/research/code-intelligence-tools) | **0-3 Bị bác bỏ** |
| "4+ queries → 1 query (single-query impact analysis)" | [GitHub repo README](https://github.com/abhigyanpatwari/GitNexus) | **0-3 Bị bác bỏ** |
| "Smaller LLMs can match larger ones with GitNexus context" | [GitHub repo README](https://github.com/abhigyanpatwari/GitNexus) | **0-3 Bị bác bỏ** |

### 2.2 Logic phân tích

**Tại sao các con số này không đáng tin:**
1. **Không có methodology công khai** — không ai mô tả cụ thể điều kiện đo, baseline, hay codebase được dùng.
2. **Nguồn chất lượng thấp** — blog cá nhân, bài báo marketing, không có peer review hay independent replication.
3. **Conflict of interest** — phần lớn đến từ người dùng muốn "sell" tool, không phải neutral benchmark.
4. **Adversarial verification 0/3** — tức là cả 3 agents kiểm tra độc lập đều không tìm được bằng chứng xác nhận.

**Điều GitNexus thực sự claim theo kiến trúc (không phải benchmark):** Lý thuyết là precomputed graph sẽ giảm số lượng tool calls so với sequential file exploration. Đây là hợp lý về mặt logic nhưng **chưa được đo lường một cách nghiêm túc và công khai**.

---

## Phần 3: Lỗi Kỹ thuật Được Cộng đồng Báo cáo

### 3.1 Lỗi nghiêm trọng nhất: MCP vs CLI database adapter divergence
**Confidence: HIGH | Vote: 3-0**

**Mô tả:** MCP path và CLI path sử dụng hai database adapter khác nhau với chế độ read/write khác nhau:
- **MCP path** (`pool-adapter.js`): `new lbug.Database(dbPath, 0, false, true)` → **read-only**
- **CLI path** (`lbug-adapter.js`): `new lbug.Database(dbPath)` → **read-write (default)**

**Hậu quả:** Queries thành công trên CLI nhưng fail hoặc trả về kết quả rỗng khi gọi qua MCP — đây là cách sử dụng chính của tool.

**Nguồn:**
- [Issue #1449 — "MCP returns empty results"](https://github.com/abhigyanpatwari/GitNexus/issues/1449) *(trực tiếp document code diff)*
- [Issue #1403 — corroboration](https://github.com/abhigyanpatwari/GitNexus/issues/1403)
- [Issue #1287 — same root cause](https://github.com/abhigyanpatwari/GitNexus/issues/1287)

**Đánh giá:** Đây là lỗi **kiến trúc hệ thống**, không phải edge case. Vote 3/3 = toàn bộ panel đồng ý.

---

### 3.2 Tree-sitter peer dependency conflict (v1.4.9)
**Confidence: HIGH | Vote: 3-0**

**Mô tả:** `gitnexus@1.4.9` khai báo `tree-sitter@^0.25.0` nhưng 8 language parsers đi kèm yêu cầu `^0.21.x` đến `^0.22.x` → npm ERESOLVE → MCP server không khởi động được, báo `MCP error -32000: Connection closed`.

**8 parsers bị ảnh hưởng:** C, C++, Java, TypeScript, Ruby, Rust, PHP, C#

**Timeline:**
- **27/03/2026:** Issue #537 được mở, reproducible trên macOS với Claude Code CLI
- **~28/03/2026:** PR #538 fix, release v1.4.10

**Nguồn:**
- [Issue #537 — tree-sitter ERESOLVE](https://github.com/abhigyanpatwari/GitNexus/issues/537)
- [npm registry — gitnexus@1.4.9 dependency manifest](https://www.npmjs.com/package/gitnexus)

---

### 3.3 FTS5/SQLite crash khi gọi qua MCP
**Confidence: HIGH | Vote: 3-0**

**Mô tả:** GitNexus emit warning `"FTS extension unavailable; continuing without FTS features"` nhưng **không guard** downstream query code, khiến `bm25Results` là `undefined` và crash result-fusion step với `"Error: bm25Results is not iterable"` khi gọi `gitnexus_query` qua MCP. CLI thực hiện cùng query thành công.

**Môi trường xác nhận:** gitnexus 1.6.4, Node v25.9.0, macOS arm64 (Issue #1489, 10/05/2026)

**Fix:** PR #1540 (đã merge)

**Nguồn:**
- [Issue #1489 — FTS5 crash via MCP](https://github.com/abhigyanpatwari/GitNexus/issues/1489)
- [Issue #1090 — FTS5 pattern](https://github.com/abhigyanpatwari/GitNexus/issues/1090)
- [Issue #1403 — corroboration](https://github.com/abhigyanpatwari/GitNexus/issues/1403)

---

### 3.4 Lỗi khác (không đủ bằng chứng để confirm, nhưng đáng chú ý)

| Lỗi | Issue | Vote |
|-----|-------|------|
| Request timeout (-32001) khi dùng với opencode trên Windows/WSL | [#1380](https://github.com/abhigyanpatwari/GitNexus/issues/1380) | 1-2 (không confirm) |
| Database lock conflict giữa MCP server và PreToolUse hook | [#1492](https://github.com/abhigyanpatwari/GitNexus/issues/1492) | 1-2 (không confirm) |
| BM25 returns zero results ở v1.6.3 do lazy FTS init | [#1449](https://github.com/abhigyanpatwari/GitNexus/issues/1449) | 1-2 (không confirm) |

---

## Phần 4: Đánh giá Cộng đồng

### 4.1 Nơi tìm được phản hồi
| Platform | Kết quả |
|----------|---------|
| GitHub Issues | ✅ Nhiều bug reports, active discussion |
| Hacker News | ✅ 1 thread được verify ([#47234516](https://news.ycombinator.com/item?id=47234516)) |
| dev.to | ✅ Vài bài build log sử dụng GitNexus |
| Reddit | ❌ Không tìm thấy thread nào được verify |
| Discord | ❌ Không tìm thấy thảo luận được verify |

### 4.2 Số liệu adoption — KHÔNG XÁC NHẬN ĐƯỢC
Bài báo MarkTechPost claim "28,000+ stars, 3,000+ forks, 45 contributors" — bị bác bỏ **0/3**. Quy mô adoption thực tế **không xác minh được** qua research này.

### 4.3 Nhận xét chung từ cộng đồng
- **Tích cực:** Ý tưởng kiến trúc được đánh giá cao (knowledge graph + AST indexing)
- **Tiêu cực:** Reliability là vấn đề chính — "works on CLI but not MCP" là complaint lặp lại nhiều nhất
- **Trung lập:** Dự án active develop, bugs được fix nhanh

---

## Phần 5: So sánh Alternatives

Trong quá trình research, các công cụ thay thế sau xuất hiện:

| Tool | Đặc điểm | Link |
|------|----------|------|
| **Repomix** | Pack codebase thành 1 file cho LLM, simpler approach | [github.com/yamadashy/repomix](https://github.com/yamadashy/repomix) |
| **Zero-dependency alternative** (ẩn danh) | Tác giả dev.to tự build, không cần server | [dev.to article](https://dev.to/cyber_audiomind_3a9f839c/i-built-a-zero-dependency-alternative-to-gitnexus-for-ai-assisted-coding-2gl6) |

---

## Phần 6: Câu hỏi Còn Mở

Sau khi verify, những câu hỏi này **chưa có câu trả lời đáng tin**:

1. Liệu GitNexus có benchmark token reduction độc lập, được reproduce bởi bên thứ ba không?
2. Lỗi MCP-vs-CLI database adapter đã được fix hoàn toàn trong các phiên bản sau 1.6.4 chưa?
3. Quy mô adoption thực tế (stars, active users) là bao nhiêu?
4. Có user reports nào trên Reddit/Discord về production use không?

---

## Phần 7: Nguồn Tham khảo Đầy đủ

### Nguồn Primary (chất lượng cao)
| # | URL | Vai trò |
|---|-----|---------|
| P1 | https://github.com/abhigyanpatwari/GitNexus | Repo chính thức |
| P2 | https://github.com/abhigyanpatwari/GitNexus/issues/1449 | MCP read-only bug |
| P3 | https://github.com/abhigyanpatwari/GitNexus/issues/1403 | MCP adapter issue |
| P4 | https://github.com/abhigyanpatwari/GitNexus/issues/1287 | Database mode issue |
| P5 | https://github.com/abhigyanpatwari/GitNexus/issues/537 | tree-sitter conflict |
| P6 | https://github.com/abhigyanpatwari/GitNexus/issues/1489 | FTS5 crash MCP |
| P7 | https://github.com/abhigyanpatwari/GitNexus/issues/1090 | FTS5 pattern |
| P8 | https://github.com/abhigyanpatwari/GitNexus/issues/1380 | Timeout issue |
| P9 | https://github.com/abhigyanpatwari/GitNexus/issues/1492 | DB lock conflict |
| P10 | https://github.com/abhigyanpatwari/GitNexus/issues/410 | Other issue |
| P11 | https://www.npmjs.com/package/gitnexus | npm package |
| P12 | https://github.com/yamadashy/repomix | Competitor reference |

### Nguồn Secondary/Forum
| # | URL | Vai trò | Chất lượng |
|---|-----|---------|------------|
| S1 | https://www.marktechpost.com/2026/04/24/meet-gitnexus-an-open-source-mcp-native-knowledge-graph-engine-that-gives-claude-code-and-cursor-full-codebase-structural-awareness/ | Overview article | Secondary |
| S2 | https://news.ycombinator.com/item?id=47234516 | HN discussion | Forum |
| S3 | https://dev.to/xaviermasle/how-i-built-a-bot-free-ai-super-app-using-electron-gitnexus-bullmq-qdrant-mcp-13hd | Build log | Blog |
| S4 | https://dev.to/cyber_audiomind_3a9f839c/i-built-a-zero-dependency-alternative-to-gitnexus-for-ai-assisted-coding-2gl6 | Alternative builder | Blog |
| S5 | https://www.npmjs.com/package/@iflow-mcp/abhigyanpatwari-gitnexus | npm wrapper | Primary |

### Nguồn Đã Kiểm tra nhưng Không Đáng tin (benchmark claims)
| URL | Vấn đề |
|-----|--------|
| https://blog.pebblous.ai/report/gitnexus-production-report-2026/en/ | Claims 74%/88% bị bác bỏ 0/3 |
| https://dev.to/mz06/we-benchmarked-an-84-token-reduction-then-we-open-sourced-the-protocol-2j87 | ACP 84-93% bị bác bỏ 0/3 |
| https://matthewkruczek.ai/blog/progressive-disclosure-mcp-servers.html | 85-100x bị bác bỏ 0/3 |
| https://rywalker.com/research/code-intelligence-tools | 70% tree-sitter compression bị bác bỏ 0/3 |
| https://medium.com/@hi.debmckinney/cutting-mcp-token-costs-by-92-at-500-tools-a-benchmark-walkthrough-b7d976c7e2c8 | Unreliable, 0 claims verified |

---

## Kết luận & Khuyến nghị

### Nên dùng khi nào
- Codebase **>50k lines** với nhiều cross-module dependency phức tạp
- Thường xuyên cần "blast radius analysis" (cái này ảnh hưởng đến đâu)
- Sẵn sàng debug/workaround nếu gặp lỗi MCP

### Không nên dùng khi nào
- Kỳ vọng token savings có số liệu cụ thể → **không có bằng chứng thực nghiệm**
- Cần tool ổn định cho production ngay lập tức
- Codebase nhỏ/vừa → Claude Code's built-in exploration đủ tốt

### Verdict tổng thể

> **Theo dõi, chưa production-ready.** GitNexus có kiến trúc thú vị và tiềm năng thực sự cho large codebase, nhưng tại thời điểm này: (1) benchmark token reduction là unverified marketing claims, (2) có lỗi kiến trúc hệ thống giữa MCP và CLI path, (3) cộng đồng chưa đủ lớn để có independent validation. Phiên bản sau 1.6.4 có thể đã fix nhiều lỗi — nên test lại nếu quan tâm.

---

*Báo cáo được tạo bởi 2 vòng deep research workflow: tổng cộng 200 agents, 36 nguồn, 157 claims extracted, 50 adversarially verified.*  
*Ngày: 11/06/2026*

---

# Phần II: GitNexus cho Use Case Cross-Module & Multi-Feature

> **Câu hỏi nghiên cứu:** GitNexus có đáng dùng trong production cho việc code liên module và liên thông nhiều feature không?  
> **Phương pháp vòng 2:** 97 agents, 15 nguồn, 68 claims → 25 verified (6 confirmed / 19 killed)

---

## A. Tính năng Cross-Module Được Xác Nhận

### A.1 Kiến trúc pipeline và MCP tools
**Confidence: HIGH | Vote: 2-1 (merged từ 2 claims)**

GitNexus xây dựng knowledge graph qua multi-stage pipeline (Tree-sitter AST parse → import resolution → heritage mapping → community detection) và expose các tools sau cho AI agents:

| Tool | Mục đích cross-module |
|------|----------------------|
| `impact` | Blast-radius analysis — ai sẽ bị ảnh hưởng nếu thay đổi X |
| `context` | 360° view của một symbol trong codebase |
| `detect_changes` | Map git diff lên affected processes |
| `rename` | Multi-file rename theo dependency graph |
| `group_query` | Query theo functional community (module group) |

**Nguồn:**
- [GitHub README chính thức](https://github.com/abhigyanpatwari/GitNexus)
- [ai-chain.tw — GitNexus workflow guide](https://ai-chain.tw/en/blog/gitnexus-graphify-ai-coding-workflow-guide/)

---

### A.2 Tool `impact` — Blast-radius analysis
**Confidence: MEDIUM | Vote: 2-1**

Tool `gitnexus_impact()` trả về danh sách callers được nhóm theo depth và confidence score:

```
Depth 1 — WILL BREAK:   callers trực tiếp (high confidence)
Depth 2 — LIKELY AFFECTED: callers gián tiếp (medium confidence)
```

Có parameter `minConfidence` để filter kết quả theo ngưỡng tin cậy (ví dụ: `minConfidence: 0.8`).

**Nguồn:**
- [GitHub README — impact tool documentation](https://github.com/abhigyanpatwari/GitNexus)
- [jimmysong.io — GitNexus overview](https://jimmysong.io/ai/gitnexus/)

**Lưu ý quan trọng:** Đây là **vendor-documented feature**, không phải independently benchmarked behaviour. Confidence là MEDIUM vì chưa có bên thứ ba xác nhận độ chính xác.

---

### A.3 Community detection cho module grouping
**Confidence: MEDIUM | Vote: 2-1**

GitNexus chạy Leiden community detection trên dependency graph để tự động phát hiện "functional clusters" (tương đương với module groups). Từ đó generate per-community SKILL.md files với:
- `Impact Analysis` skill — "Analyze blast radius before changes"
- `Refactoring` skill — "Plan safe refactors using dependency mapping"

**Nguồn:**
- [GitHub README — `gitnexus analyze --skills`](https://github.com/abhigyanpatwari/GitNexus)

---

## B. Vấn đề Cốt lõi: Accuracy Không Được Xác Nhận

> **Đây là phát hiện quan trọng nhất của vòng 2: Confidence: HIGH | Vote: 3-0 + 2-1**

**Không tồn tại** trong bộ nguồn đã survive adversarial verification:
- Tỷ lệ false positive / false negative của dependency detection
- Benchmark accuracy so với alternatives (LSP, Sourcegraph, grep)
- Controlled production deployment data từ bên thứ ba
- Language-specific precision/recall metrics

**Bằng chứng:**
- [hoangyell.com](https://hoangyell.com/gitnexus-explained/) — dùng hypothetical examples với mock confidence percentages, không phải real data
- [labgrimoire.com](https://labgrimoire.com/spellbook/gitnexus/) — liệt kê blast-radius là feature với commentary định tính, không có số liệu
- Tất cả claims về metrics cụ thể (2.7x vs grep, 88% fewer tool calls, 100% file-read elimination) bị bác bỏ **0/3**

**Logic:** Nếu một tool claim blast-radius analysis nhưng không publish accuracy metrics, developer không thể biết liệu kết quả trả về có đủ tin cậy để ra quyết định hay không.

---

## C. Claims Bị Bác bỏ Liên quan Cross-Module

| Claim | Nguồn | Vote | Ý nghĩa |
|-------|--------|------|---------|
| "2.7x more dependencies than grep" | [blog.pebblous.ai](https://blog.pebblous.ai/report/gitnexus-production-report-2026/en/) | **0-3** | Marketing, không có methodology |
| "100% file-read elimination trong 17-agent env" | [blog.pebblous.ai](https://blog.pebblous.ai/report/gitnexus-production-report-2026/en/) | **0-3** | Không verify được |
| "Traces transitive callers across file boundaries" | [termdock.com](https://www.termdock.com/en/blog/gitnexus-code-intelligence-knowledge-graph) | **0-3** | Vendor claim, no evidence |
| "impact() returns every upstream caller in 1 query" | [marktechpost.com](https://www.marktechpost.com/2026/04/24/meet-gitnexus-an-open-source-mcp-native-knowledge-graph-engine-that-gives-claude-code-and-cursor-full-codebase-structural-awareness/) | **0-3** | Overstated |
| "cross-module safe rename across 23 files" | [rywalker.com](https://rywalker.com/research/code-intelligence-tools) | **0-3** | Không có reproduction |
| "impact() under-reports blast radius (false negatives)" | [GitHub issues](https://github.com/abhigyanpatwari/GitNexus/issues) | **0-3** | Không đủ evidence để confirm |
| "Go: zero CALLS edges cho grouped parameters" | [GitHub issues](https://github.com/abhigyanpatwari/GitNexus/issues) | **1-2** | Possible nhưng không confirm |

**Lưu ý đặc biệt về 2 dòng cuối:** Các bug reports về false negatives trong Go và về impact() bị **không confirm** (0-3, 1-2) — không có nghĩa là không tồn tại, mà là không đủ evidence công khai để verify. Đây là dấu hiệu cần test thực tế.

---

## D. Câu hỏi Chưa Có Câu Trả Lời (Quan trọng cho Production Decision)

1. **Tỷ lệ false negative của `impact()`** với TypeScript, Go, Java là bao nhiêu? Nếu bỏ sót 20% dependencies thì tool này nguy hiểm hơn là hữu ích trong refactoring.

2. **Index staleness:** Knowledge graph có stale sau mỗi commit không? Cần re-index bao lâu một lần? Với team active development, graph cũ = kết quả sai.

3. **Language gaps được mention nhưng không confirm:** Java, Vue, Kotlin, Go (grouped params) có thể có parsing gaps — maintainer chưa publish known-limitations matrix.

4. **MCP-vs-CLI divergence đã fix hoàn toàn chưa?** Từ Phần I báo cáo này, đây là lỗi systemic. Nếu còn tồn tại, mọi cross-module query qua MCP đều có thể sai.

---

## E. Verdict: Có Nên Dùng cho Production Cross-Module Không?

### Ma trận quyết định

| Tiêu chí | Trạng thái | Mức độ rủi ro |
|----------|-----------|---------------|
| Tính năng cross-module tồn tại | ✅ Confirmed (docs) | — |
| Accuracy được đo lường | ❌ Không có data | 🔴 Cao |
| MCP stability | ⚠️ Đã có bugs systemic | 🟡 Trung bình |
| Active development | ✅ Fixes liên tục | 🟢 Thấp |
| Independent validation | ❌ Không tồn tại | 🔴 Cao |
| Language support đầy đủ | ❓ Unclear gaps | 🟡 Trung bình |

### Khuyến nghị theo context

**KHÔNG dùng cho production nếu:**
- Refactoring cross-module là critical path (lỗi blast-radius = break prod)
- Codebase dùng Go hoặc Java nhiều (possible parsing gaps unconfirmed)
- Team dựa vào kết quả tool mà không double-check bằng LSP/tests

**CÓ THỂ thử nghiệm nếu:**
- Dùng như **supplementary context** (thêm góc nhìn, không thay thế LSP)
- Kết quả luôn được verify bằng TypeScript compiler / test suite trước khi commit
- Chỉ dùng trên codebase TypeScript/JavaScript (language support tốt nhất)
- Team sẵn sàng report bugs và theo dõi fixes

**Quy trình an toàn nếu thử:**
```
1. gitnexus_impact(target) → xem danh sách "WILL BREAK"
2. Verify từng item bằng IDE's "Find All References" (LSP)
3. Cross-check với test suite
4. KHÔNG commit dựa solely on GitNexus output
```

### Verdict cuối

> **Chưa đủ điều kiện production cho cross-module refactoring.**  
> Lý do cốt lõi: không có accuracy data, nghĩa là developer không biết khi nào tool đúng và khi nào sai. Một tool blast-radius analysis với unknown false negative rate là rủi ro cao hơn không dùng tool.  
>  
> **Thời điểm nên xem xét lại:** Khi maintainer publish precision/recall metrics trên ít nhất 2-3 ngôn ngữ với controlled benchmark, hoặc khi community có independent reproduction của accuracy claims.

---

## F. Nguồn Bổ sung (Vòng 2)

| URL | Chất lượng | Vai trò |
|-----|-----------|---------|
| https://ai-chain.tw/en/blog/gitnexus-graphify-ai-coding-workflow-guide/ | Blog | Tool workflow guide |
| https://jimmysong.io/ai/gitnexus/ | Secondary | Overview + use cases |
| https://hoangyell.com/gitnexus-explained/ | Blog | Feature explanation (hypothetical examples) |
| https://labgrimoire.com/spellbook/gitnexus/ | Blog | Feature listing |
| https://www.termdock.com/en/blog/gitnexus-code-intelligence-knowledge-graph | Blog | Cross-module claims |
| https://www.virge.io/en/blog/gitnexus-code-knowledge-graph/ | Blog | Architecture overview |
| https://rywalker.com/research/gitnexus | Blog | Comparative analysis |
| https://www.paperclipped.de/en/blog/gitnexus-code-knowledge-graph-ai-agents | Blog | Agent integration |

---

*Phần II bổ sung: 97 agents, 15 nguồn, 68 claims extracted, 25 adversarially verified.*  
*Tổng toàn báo cáo: 200 agents, 36 nguồn, 157 claims, 50 verified.*  
*Ngày: 11/06/2026*
