# M08 — System Design Master
## EHR / ECR-NOW Domain | Java Senior Interview Series

> **Why this matters:** Every senior Java interview includes at least one system design question. The code knowledge in M01-M07 is your toolkit. System design is knowing *which tool to pick and why* under constraints.

---

## PART 1 — The System Design Framework (Use Every Time)

### The 6-Step Method (45-minute interview structure)

```
Step 1: Clarify Requirements         (5 min)
Step 2: Estimate Scale               (3 min)
Step 3: Define the API               (5 min)
Step 4: High-Level Design            (10 min)
Step 5: Deep Dive into Components    (15 min)
Step 6: Identify Bottlenecks + Fixes (7 min)
```

### Step 1 — Questions to Always Ask

```
Functional (what the system does):
- Who are the users? How many? Patient-facing or clinician-facing?
- What are the core use cases? (Read-heavy or write-heavy?)
- Are there SLA requirements? (e.g., ECR must submit within 24 hours)

Non-functional (how well it works):
- Expected QPS (queries per second)?
- Data volume? Growth rate?
- Availability requirement? (99.9% = 8.7h/year downtime, 99.99% = 52min/year)
- Consistency requirement? (strong vs eventual)
- Latency requirement? (p99 < 200ms?)
- Geographic distribution? Multi-region?
```

### Step 2 — Back-of-Envelope Estimation

```
EHR System example:
- 500 hospitals, 200 clinicians each → 100,000 clinicians
- Each clinician: 20 patients/day → 2,000,000 patient interactions/day
- 2M / 86,400 seconds ≈ 23 writes/second (manageable)
- Read:write ratio = 10:1 → ~230 reads/second

Storage:
- 1 patient record ≈ 10KB
- 50M patients → 500GB (fits in single PostgreSQL instance)
- With 10 years retention + audit logs → ~5TB → sharding or partitioning needed

Bandwidth:
- FHIR bundle per ECR submission ≈ 50KB
- 10,000 ECR submissions/day → 500MB/day → trivial

Cache sizing:
- Active patients (accessed in last 7 days) ≈ 5% of total → 2.5M records
- 2.5M * 10KB = 25GB → fits in single Redis node

Common numbers to memorize:
  1 million requests/day  = ~12 RPS
  1 billion requests/day  = ~12,000 RPS
  1KB * 1M records        = 1GB
  1KB * 1B records        = 1TB
  Hard disk read          = 10ms
  SSD read                = 0.1ms
  RAM read                = 0.0001ms (100ns)
  Network within DC       = 0.5ms
  Network cross-region    = 150ms
```

---

## PART 2 — Core Design Decisions

### 2.1 SQL vs NoSQL — Decision Framework

```
Choose PostgreSQL (relational) when:
✅ Complex relationships (Patient → Appointments → Doctors → Billing)
✅ ACID transactions required (patient registration must be atomic)
✅ Complex queries with JOINs (reporting, analytics)
✅ Schema is well-defined and stable
✅ Data integrity is paramount (healthcare = regulatory compliance)
→ EHR core data: patients, appointments, lab results

Choose MongoDB (document) when:
✅ Schema varies per record (different EHR vendors send different fields)
✅ Nested documents natural (patient + all vitals in one doc)
✅ Write-heavy with flexible reads
✅ Rapid iteration on schema
→ FHIR resources (each resource type has different structure)

Choose Cassandra when:
✅ Time-series data (vitals every 5 minutes for ICU patients)
✅ Write-heavy at massive scale (millions of sensor readings/second)
✅ Geographically distributed writes
✅ Can tolerate eventual consistency
→ Patient vitals stream, IoT medical device data

Choose Redis when:
✅ Sub-millisecond read latency required
✅ Session data, rate limiting, leaderboards
✅ Cache layer in front of slower DB
→ Patient session cache, ECR rate limiting, active dashboard data

Choose Elasticsearch when:
✅ Full-text search (search patient by name fragment, ICD code description)
✅ Log analytics, audit trail search
→ Patient search, HIPAA audit log search

EHR Architecture Decision:
PostgreSQL (core data) + Redis (cache/sessions) + Elasticsearch (search/audit)
```

### 2.2 CAP Theorem in Real Systems

```
CAP: A distributed system can guarantee only 2 of 3:
  C = Consistency (all nodes see same data at same time)
  A = Availability (every request gets a response)
  P = Partition Tolerance (system works even if network splits)

Network partitions happen in practice → must always tolerate P
Real choice: CP vs AP

CP (Consistency + Partition Tolerance):
- When partition: reject requests to avoid stale data
- Use for: banking, patient medication records, billing
- Examples: PostgreSQL (2PC), HBase, ZooKeeper
- EHR use: "Never show a doctor a stale medication list — return error instead"

AP (Availability + Partition Tolerance):
- When partition: serve possibly stale data
- Use for: product catalog, social media feed, non-critical reads
- Examples: DynamoDB, Cassandra, CouchDB
- EHR use: "Show ECR submission status from cache even if DB unreachable"

PACELC (extends CAP for normal operation):
  Even without partition: choose Latency vs Consistency
  PostgreSQL: low latency read, consistent write
  DynamoDB: tunable consistency (read-your-writes vs eventual)
```

### 2.3 Consistency Patterns

```
Strong Consistency:
- After write, all reads return new value
- Achieved via: synchronous replication, 2PC
- Cost: high latency, lower availability
- EHR use: Patient allergy updates (MUST be immediately visible to all)

Eventual Consistency:
- After write, reads will eventually return new value
- Achieved via: async replication, CRDTs
- Cost: stale reads possible
- EHR use: Patient appointment reminder count (ok if slightly stale)

Read-Your-Writes:
- After write, same user's reads always see their write
- Achieved via: sticky sessions, sync primary reads
- EHR use: After updating patient address, user sees updated address

Monotonic Reads:
- If user reads value X, never reads older value
- Achieved via: user affinity to same replica
- EHR use: Viewing appointment history — once you see appointment #100, never see list with only 99

Write-Ahead Log (WAL) Shipping:
- Replicate DB changes via WAL to read replicas
- Read replicas may lag by seconds
- EHR: Route analytics queries to read replicas, writes to primary
```

### 2.4 Caching Strategies

```
Cache-Aside (Lazy Loading):
  Read: Check cache → miss → read DB → populate cache → return
  Write: Write DB → invalidate cache
  Pros: Only cached when needed, resilient (app works if cache down)
  Cons: Initial miss penalty, potential stale data
  Use for: Patient records, ICD code lookups
  Code pattern: @Cacheable("patients") + @CacheEvict on update

Write-Through:
  Write: Write cache AND DB synchronously
  Read: Always in cache (no miss after first load)
  Pros: Fresh cache always
  Cons: Write latency (2 writes), cache may hold unused data
  Use for: Patient demographics (every write also updates cache)

Write-Behind (Write-Back):
  Write: Write cache immediately → async write to DB later
  Pros: Very fast writes
  Cons: Data loss risk if cache crashes before DB write
  Use for: View counters, non-critical metrics (NOT patient records)

Read-Through:
  Cache sits in front of DB; cache fetches from DB on miss automatically
  Pros: Application doesn't know about DB
  Cons: Cache must know about DB
  Examples: Redis with RedisCacheManager

Cache Eviction Policies:
  LRU (Least Recently Used):  evict least recently accessed → general purpose
  LFU (Least Frequently Used): evict least accessed overall → ICD codes (some rarely used)
  TTL-based: expire after time → session data, rate limits
  EHR: Active patients = LRU, Static reference data = LFU + long TTL
```

---

## PART 3 — Design the EHR System (Full Walkthrough)

### Requirements

```
Functional:
- Clinicians can register, update, view patients
- Lab systems submit lab results
- System auto-detects reportable conditions and submits ECR to public health
- Patients can view their records (read-only portal)
- Audit trail for all access (HIPAA)

Non-Functional:
- 100,000 clinicians, 50M patient records
- 99.99% uptime (HIPAA-mandated)
- Write: 25 RPS, Read: 250 RPS (manageable scale)
- ECR submission within 1 hour of positive lab result
- HIPAA: encryption at rest + in transit, full audit log
- p99 API latency < 500ms
```

### High-Level Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │              CLIENTS                         │
                    │  EHR Web App  |  Mobile  |  Lab Systems      │
                    └──────────────────┬──────────────────────────┘
                                       │ HTTPS
                    ┌──────────────────▼──────────────────────────┐
                    │         API GATEWAY (Spring Cloud)           │
                    │   Rate Limiting | JWT Auth | Load Balancing  │
                    │         SSL Termination | Routing            │
                    └────┬──────────┬───────────┬─────────────────┘
                         │          │           │
          ┌──────────────▼──┐  ┌────▼────┐  ┌──▼──────────────┐
          │  EHR Service    │  │  LAB    │  │  PORTAL Service  │
          │  (Patient CRUD) │  │ Service │  │  (Patient Read)  │
          └──────┬──────────┘  └────┬────┘  └──────────────────┘
                 │                  │
          ┌──────▼──────────────────▼─────────────────────────┐
          │                  KAFKA                             │
          │  lab-results topic | patient-events topic          │
          └──────────────────┬────────────────────────────────┘
                             │
          ┌──────────────────▼────────────────────────────────┐
          │              ECR Service                           │
          │    Evaluate → Build FHIR → Submit to ECR-NOW      │
          └───────────────────────────────────────────────────┘

Data Layer:
  PostgreSQL (primary)  ←─── HikariCP ───→  EHR Service
  PostgreSQL (replica)  ←─── read queries ─ EHR Service
  Redis Cluster         ←─── @Cacheable ──→ EHR/Portal Service
  Elasticsearch         ←─── audit/search ─ EHR Service
  S3 (object storage)   ←─── FHIR bundles ─ ECR Service
```

### Database Schema Design

```sql
-- Core tables
patients (id, mrn UNIQUE, first_name, last_name, dob, status, version, created_at, updated_at)
  INDEX: mrn, (last_name, first_name), status

appointments (id, patient_id FK, doctor_id FK, scheduled_at, type, status)
  PARTITION BY RANGE (scheduled_at)  -- monthly partitions (performance for large tables)
  INDEX: patient_id, doctor_id, (scheduled_at, status)

lab_results (id, patient_id FK, order_id, test_code, result_value, positive, ordered_at, resulted_at)
  INDEX: patient_id, (test_code, resulted_at), positive

case_reports (id, lab_result_id FK UNIQUE, condition_code, status, submitted_at, fhir_bundle_s3_key)
  INDEX: status, condition_code

audit_log (id, user_id, patient_mrn, action, resource, timestamp, ip_address)
  → Write to Elasticsearch (not PostgreSQL — avoids write amplification)
  → Partition by month for retention management

-- Read replica routing:
Primary:  INSERT/UPDATE/DELETE + critical reads (allergy, medication)
Replica:  SELECT for reports, dashboard, search queries
```

### API Design

```
RESTful API — key endpoints:

Patient Management:
POST   /api/v1/patients                    → Register patient
GET    /api/v1/patients/{mrn}              → Get patient (with HIPAA audit log)
PUT    /api/v1/patients/{mrn}              → Update patient
GET    /api/v1/patients?lastName=Smith&dob=1985-03-15  → Search

Lab Results:
POST   /api/v1/lab-results                 → Submit result (from lab system)
GET    /api/v1/patients/{mrn}/lab-results  → Get results for patient

ECR:
GET    /api/v1/ecr/{id}/status             → Check submission status
POST   /api/v1/ecr/{id}/retry              → Manual retry (admin)

Versioning strategy: URI versioning (/v1/, /v2/) for breaking changes
Rate limiting: 1000 req/min per API key (Redis token bucket)
```

### Key Design Decisions Explained

```
Decision 1: Why Kafka between Lab Service and ECR Service?

Option A: Lab Service calls ECR Service directly (synchronous)
  Problem: If ECR-NOW is down, lab result submission fails or lab service must retry
  Problem: Lab system latency = lab processing + ECR submission time

Option B: Kafka (async, decoupled)
  ✅ Lab system fires-and-forgets → immediate ACK
  ✅ ECR service processes at its own pace
  ✅ If ECR-NOW down → messages wait in Kafka (no data loss)
  ✅ Replay possible if ECR-NOW needs reprocessing
  ✅ Multiple consumers (ECR service + audit + analytics) from same event
  Choice: Kafka ✅

Decision 2: Why Redis for patient cache?

Without cache:
  250 RPS * avg 10ms DB query = PostgreSQL handling 250 concurrent queries
  With 50M records, complex JOIN queries: 50-100ms each → too slow

With Redis:
  Cache hit (p95 of reads): < 1ms → 99% of reads bypass PostgreSQL
  Only cache misses + writes hit PostgreSQL (~25 writes/sec → trivial)
  Cache hot patients (active in last 24h) → ~5% of 50M = 2.5M records
  2.5M * 10KB = 25GB Redis → affordable
  Choice: Redis cache-aside pattern ✅

Decision 3: Why PostgreSQL over Cassandra?

Cassandra advantages: Write scale, geo-distribution, no single point of failure
PostgreSQL advantages: ACID, JOINs, foreign keys, complex queries

EHR has:
  - Complex relationships (patient ↔ doctor ↔ appointment ↔ billing ↔ insurance)
  - Regulatory requirement for strong consistency (medication, allergy)
  - Moderate write scale (25 RPS) — PostgreSQL handles 10,000+ TPS easily
  - Rich reporting queries

Choice: PostgreSQL with read replica + partitioning ✅
(Cassandra would be chosen if: 1M+ writes/sec or global geo-distribution)
```

---

## PART 4 — Design the ECR-NOW Reporting System

### Requirements

```
Functional:
- Receive lab results from 10,000 hospital EHR systems
- Evaluate each for ~200 reportable conditions
- Build FHIR R4 bundle with patient, lab, provider data
- Submit to state/local public health agencies via HL7/FHIR API
- Track submission status, retry on failure
- Handle duplicate suppression (same patient/condition/week = 1 report)

Non-functional:
- Ingest: 50,000 lab results/hour (peak during outbreak = 10x)
- Submit within 1 hour of positive lab result
- 99.9% delivery guarantee to public health
- Idempotent submission (network retries must not duplicate reports)
```

### Architecture

```
EHR Systems (10,000 hospitals)
    │  HTTPS POST /api/v1/lab-results
    ▼
[API Gateway] → rate limit per hospital
    │
    ▼
[Ingestion Service] → validate FHIR format, authenticate hospital
    │  Kafka: lab-results-raw topic
    ▼
[Evaluation Service] → match ICD codes against reportable conditions list
    │  reportable: Kafka lab-results-reportable topic
    │  non-reportable: Kafka lab-results-negative topic (audit only)
    ▼
[FHIR Builder Service] → fetch patient/provider demographics, build bundle
    │  Kafka: fhir-bundles-ready topic
    ▼
[Submission Service] → submit to public health APIs, handle retries
    │  success: mark submitted, notify EHR
    │  failure: DLT, escalate after 3 retries
    ▼
[Public Health APIs] (CDC, state health departments)

Storage:
  PostgreSQL: case_reports (status, metadata, idempotency key)
  S3: FHIR bundles (immutable, cheap, durable)
  Redis: deduplication window (patient+condition+week → submitted)
  Elasticsearch: submission audit, search by condition/region/time
```

### Idempotency — Preventing Duplicate Reports

```java
// Idempotency key = SHA-256(patientMrn + conditionCode + epiWeek)
// epiWeek = ISO week number (7-day window)

String idempotencyKey = DigestUtils.sha256Hex(
    patientMrn + "|" + conditionCode + "|" + getEpiWeek(resultDate));

// Before submitting:
// 1. Check Redis: has this key been submitted in last 7 days?
Boolean alreadySubmitted = redisTemplate.hasKey("ecr:submitted:" + idempotencyKey);
if (alreadySubmitted) {
    log.info("Duplicate ECR suppressed: key={}", idempotencyKey);
    return;
}

// 2. Check PostgreSQL (Redis may have been cleared)
Optional<CaseReport> existing = caseReportRepo.findByIdempotencyKey(idempotencyKey);
if (existing.isPresent() && existing.get().getStatus() == SUBMITTED) {
    return;
}

// 3. Submit (with DB transaction)
CaseReport report = createAndSubmit(idempotencyKey, bundle);

// 4. Mark in both Redis and DB
redisTemplate.opsForValue().set("ecr:submitted:" + idempotencyKey, "1",
    Duration.ofDays(8));  // 8 days > 7-day epi week window
caseReportRepo.save(report.withStatus(SUBMITTED));
```

### Retry Strategy with Exponential Backoff

```
Attempt 1: immediate
Attempt 2: 1 minute later
Attempt 3: 5 minutes later
Attempt 4: 30 minutes later (still within 1-hour SLA if lab result recent)
Attempt 5: 2 hours later (SLA broken — alert)
After 5 attempts → Dead Letter Topic → human review + manual retry

Resilience4j config:
  retry:
    ecr-now:
      maxAttempts: 5
      waitDuration: 1m
      exponentialBackoffMultiplier: 5   # 1m, 5m, 25m, 125m...
      retryExceptions:
        - java.net.ConnectException
        - java.net.SocketTimeoutException
      ignoreExceptions:
        - com.ecr.ValidationException  # Don't retry bad data
```

---

## PART 5 — Common System Design Questions

### Design a Rate Limiter

```
Algorithms:

1. Fixed Window Counter
   - Count requests per minute in window
   - Redis: INCR key:minute:1234, EXPIRE 60
   - Problem: Boundary burst (100 at 0:59 + 100 at 1:01 = 200 in 2 seconds)

2. Sliding Window Log
   - Store timestamp of each request in Redis Sorted Set
   - Remove entries outside window, count remaining
   - Redis ZADD + ZREMRANGEBYSCORE + ZCARD
   - Problem: High memory (stores every request timestamp)

3. Sliding Window Counter (best for most cases)
   - Blend of fixed windows: current + (previous * (1 - overlap %))
   - Memory efficient, smooth
   - EHR API rate limiter choice

4. Token Bucket (best for burst allowance)
   - Bucket fills at steady rate (10 tokens/sec)
   - Each request consumes 1 token
   - Allows burst up to bucket capacity
   - Leaky Bucket variant: smooths output rate

EHR implementation (Redis + Spring Cloud Gateway):
spring:
  cloud:
    gateway:
      routes:
        - filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 100   # tokens/sec
                redis-rate-limiter.burstCapacity: 200   # bucket size
                key-resolver: "#{@hospitalIdKeyResolver}"
```

### Design a Notification Service (EHR Alerts)

```
Requirements:
- Send ECR confirmation to clinicians
- Appointment reminders to patients
- Critical lab result alerts to doctors
- Channels: Email, SMS, In-App push
- Guaranteed delivery (at-least-once)

Architecture:
  Event Sources → Kafka → Notification Service → Channel Adapters → Users
                           ↓
                     Notification DB (status tracking)

Key decisions:
  Why Kafka? → Decoupled, buffered, replayable
  Why Channel Adapters? → Strategy pattern — swap providers (Twilio→AWS SNS)
  Deduplication: Redis SET notification:id:user (prevent double-send on retry)

Delivery guarantees:
  1. Kafka consumer: manual ACK only after DB record created
  2. DB record: PENDING → SENT → DELIVERED (provider webhook)
  3. Failed: retry queue with backoff
  4. Dead letter: alert ops after 3 failures

Code: See M06 RabbitMQ notification consumer pattern
```

### Design a Search System for EHR (Patient Search)

```
Problem: Find patients by name, DOB, MRN, condition across 50M records

Why not PostgreSQL LIKE '%smith%'?
  - Full table scan for LIKE with leading wildcard
  - ILIKE is slow at scale
  - Can't handle typos ("Smyth" won't find "Smith")
  - No relevance ranking

Solution: Elasticsearch sync via CDC (Change Data Capture)

Architecture:
  PostgreSQL → Debezium (CDC) → Kafka → ES Sync Service → Elasticsearch
                                                              ↓
                                              Patient Search Service

Elasticsearch index mapping:
{
  "mrn": { "type": "keyword" },          // exact match
  "firstName": {
    "type": "text",
    "analyzer": "standard",
    "fields": { "keyword": { "type": "keyword" } }  // sort + exact
  },
  "lastName": {
    "type": "text",
    "analyzer": "standard"
  },
  "dateOfBirth": { "type": "date" },
  "conditions": { "type": "keyword" }    // ICD codes
}

Search query:
GET /patients/_search
{
  "query": {
    "bool": {
      "should": [
        { "match": { "lastName": { "query": "smith", "fuzziness": "AUTO" } } },
        { "match": { "mrn": "MRN-001" } }
      ],
      "filter": [
        { "term": { "status": "ACTIVE" } }
      ]
    }
  }
}

CDC consistency lag: ~1-2 seconds (eventual consistency for search — acceptable)
Primary DB still authoritative — Elasticsearch is for search only
```

### Design a Distributed Cache (Beyond Redis @Cacheable)

```
Multi-level caching strategy for EHR:

L1: Application cache (Caffeine, in-process)
    - Fastest: nanoseconds
    - Bounded: 1000 entries per JVM instance
    - Use for: ICD code lookups (rarely change, same in every request)
    - Problem: Multiple instances = stale data on update
    - Solution: Pub/Sub invalidation via Redis

L2: Redis cluster
    - Fast: sub-millisecond
    - Shared across all instances
    - Use for: active patient records, sessions, rate limits

L3: Read replica (PostgreSQL)
    - Milliseconds
    - For cache misses, complex queries, reports

Invalidation strategy:
  On patient update:
  1. Update PostgreSQL (primary)
  2. Publish "patient:invalidated:MRN-001" to Redis Pub/Sub
  3. All EHR service instances subscribe → evict from L1 Caffeine
  4. Next request → L1 miss → L2 miss (evicted) → L3 → populate both

Spring config:
  @Cacheable(value = "patients", cacheManager = "caffeineCacheManager")
  @Cacheable(value = "patients", cacheManager = "redisCacheManager")
  → Use composite cache manager (try Caffeine first, then Redis)
```

---

## PART 6 — Scalability Patterns

### Horizontal vs Vertical Scaling

```
Vertical (Scale Up): Bigger machine
  + Simple, no code changes
  - Expensive, single point of failure, hard limit
  Use for: PostgreSQL primary (easier than sharding)

Horizontal (Scale Out): More machines
  + Unlimited scale (theoretically), fault tolerant
  - Stateless required, data distribution complexity
  Use for: EHR Service, ECR Service (stateless Spring Boot apps)

EHR Service horizontal scaling:
  - Stateless: no in-memory session (JWT, Redis session store)
  - K8s HPA: auto-scale on CPU > 70%
  - Session affinity NOT needed (JWT validates on any instance)
```

### Database Scaling Patterns

```
1. Read Replicas (first step, most common)
   Primary: writes, critical reads
   Replica(s): reports, dashboard, search
   EHR: Route read-only @Transactional(readOnly=true) to replica

2. Connection Pooling (HikariCP)
   Without: every request opens DB connection → DB overwhelmed
   With: reuse pool of 20 connections → handles 250 RPS fine
   EHR: pool size = (num_cores * 2) + 1 for IO-bound workload

3. Partitioning (for very large tables)
   Range partition: appointments by year/month
   Hash partition: patients by MRN hash (even distribution)
   EHR: appointments table → monthly range partitions → old partitions archived

4. Sharding (extreme scale, avoid if possible)
   Horizontal split: patients A-M on shard1, N-Z on shard2
   Problems: cross-shard JOINs, rebalancing, transactions
   EHR: Not needed at 50M patients (PostgreSQL handles 100M+ rows well)

5. CQRS (Command Query Responsibility Segregation)
   Write Model: PostgreSQL (normalized, strongly consistent)
   Read Model: Elasticsearch or Redis (denormalized, optimized for reads)
   EHR: Write to PostgreSQL, project to Elasticsearch for search + analytics
   Trade-off: Eventual consistency between write and read models
```

### Fault Tolerance Patterns

```
1. Circuit Breaker (M06 → Resilience4j)
   Protect EHR from cascade failure when ECR-NOW is slow/down
   CLOSED → OPEN (fast fail) → HALF-OPEN (test recovery)

2. Bulkhead
   Isolate thread pools per dependency
   ECR-NOW calls: pool of 10 threads
   Lab API calls: pool of 5 threads
   → ECR-NOW slow won't consume all threads → Lab API still works

   @Bulkhead(name = "ecr-now", type = Type.THREADPOOL)
   public EcrResponse submitReport(EcrSubmission submission) { ... }

3. Timeout
   Every external call must have timeout — never wait forever
   EHR → ECR-NOW: 5s timeout
   EHR → PostgreSQL: 30s query timeout (HikariCP connectionTimeout)
   Kafka: requestTimeout, deliveryTimeout

4. Retry with Backoff
   Transient failures (network blip) → retry 3x with exponential backoff
   Non-transient failures (validation error) → fail immediately, no retry

5. Fallback
   ECR-NOW down → queue submission to local DB → submit when recovered
   Patient cache miss → read from DB directly (slower but works)
   Search service down → fallback to PostgreSQL LIKE query (slower)

6. Health Checks (Kubernetes)
   Liveness: Is the app alive? (restart if dead)
   Readiness: Can the app handle traffic? (remove from LB if not ready)
   EHR readiness: DB connected + Kafka connected + Redis connected
```

---

## PART 7 — Message Queue Deep Dive

### When to Use Kafka vs RabbitMQ vs SQS

```
Use Kafka when:
✅ Event streaming (time-ordered log, replayable)
✅ Multiple consumers from same events (lab result → ECR + audit + analytics)
✅ High throughput (millions of events/day)
✅ Need replay (re-process all ECR submissions from last month)
✅ Events are facts about the world ("lab result arrived")
→ EHR: lab-results, patient-events, ecr-submissions

Use RabbitMQ when:
✅ Task queues (one producer, one consumer)
✅ Complex routing (topic/fanout/direct exchanges)
✅ Request-reply pattern (synchronous feel over async)
✅ Per-message TTL and priority queues
→ EHR: appointment reminders, email/SMS notifications

Use SQS (AWS) when:
✅ Managed service (no ops overhead)
✅ Standard: at-least-once, reordering OK
✅ FIFO: exactly-once, ordering required
→ EHR on AWS: background jobs, report generation

Kafka guarantees:
  At-least-once: default (duplicate on retry → need idempotent consumers)
  Exactly-once: enable.idempotence=true + transactional producer (expensive)
  EHR choice: at-least-once + idempotency key in consumer
```

### Kafka Partition Strategy

```
Partitioning determines ordering guarantee and parallelism:

Default (round-robin): no ordering guarantee, max parallelism
Keyed (by patient MRN): all events for same patient → same partition → ordered

EHR lab-results topic:
  Key: patientMrn
  Benefit: All lab results for patient arrive in order → correct temporal analysis
  Partitions: 12 (= number of consumer instances × 2 for rebalancing headroom)

Consumer group:
  ECR Service: group "ecr-consumers" (6 instances → 2 partitions each)
  Audit Service: group "audit-consumers" (separate group = independent processing)
  Analytics: group "analytics-consumers" (can lag behind without affecting ECR)

Retention: 7 days (enough for replay of weekly ECR reports)
Compaction: NOT used (want full history, not just latest per key)
```

---

## PART 8 — Security Architecture

```
Defense in Depth — EHR Security Layers:

Layer 1: Network
  - VPC (private network, no public DB access)
  - Security Groups (EHR service can reach PostgreSQL on port 5432 only)
  - WAF (Web Application Firewall) — block SQL injection, XSS at API Gateway
  - DDoS protection (AWS Shield / Cloudflare)

Layer 2: Transport
  - TLS 1.3 everywhere (client → gateway, service → service, service → DB)
  - Certificate rotation every 90 days
  - mTLS between microservices (client presents cert too)

Layer 3: Authentication & Authorization
  - JWT (stateless, short expiry 15min + refresh token 7 days)
  - RBAC: DOCTOR, NURSE, ADMIN, LAB_TECH, PATIENT roles
  - @PreAuthorize("hasRole('DOCTOR') or hasRole('NURSE')")
  - Field-level security: SSN masked for non-admin roles

Layer 4: Application
  - Input validation (@Valid, @NotBlank, @Size) — reject malformed input early
  - SQL injection prevention: JPA parameterized queries (never string concat)
  - CSRF protection for browser clients
  - Sensitive data never logged (SSN, DOB in logs = HIPAA violation)
  - MDC cleared after each request (no data leakage between threads)

Layer 5: Data
  - Encryption at rest: PostgreSQL Transparent Data Encryption (TDE)
  - Sensitive columns: SSN encrypted at application level (AES-256)
  - S3 FHIR bundles: SSE-KMS encryption
  - Key rotation: annual for data keys, quarterly for master keys

Layer 6: Audit
  - Every patient record access → audit log (who, what, when, from where)
  - HIPAA minimum necessary: only access what role permits
  - 6-year audit retention
  - Tamper-evident audit log (Elasticsearch with ILM + write-once S3 archive)

HIPAA compliance checklist:
  ✅ PHI encrypted at rest and in transit
  ✅ Unique user identification (no shared logins)
  ✅ Automatic session logoff (15-min JWT + 30-min inactivity)
  ✅ Audit log of all PHI access
  ✅ Minimum necessary access (RBAC)
  ✅ Breach notification capability
```

---

## PART 9 — Interview Delivery Tips

### Structuring Your Answer

```
When asked "Design an EHR system":

1. CONFIRM SCOPE (don't start drawing)
   "Before I start, let me clarify — are we focusing on the patient registration
   and lab result processing, or the full EHR including billing? And roughly
   how many hospitals are we serving?"

2. DRIVE THE REQUIREMENTS
   "Based on what you described, I'm thinking: 100k clinicians, 50M patients,
   25 writes/sec — that's pretty manageable. The interesting challenges are
   the regulatory constraints (HIPAA), the ECR submission SLA, and making
   sure we handle failures when submitting to external agencies."

3. SKETCH HIGH-LEVEL FIRST
   "Let me start with the big picture, then we can dive into any part."
   [Draw boxes and arrows — no code yet]

4. DEFEND YOUR CHOICES
   "I went with Kafka here because we have multiple consumers —
   ECR service, audit, and analytics all need the same lab result events.
   With RabbitMQ, we'd need to copy the message to 3 queues."

5. ACKNOWLEDGE TRADE-OFFS
   "PostgreSQL is the right choice here for the complex relationships and
   ACID requirements, though if we needed to handle 10x the scale I'd
   revisit whether we need sharding or a different approach."

6. HANDLE FOLLOW-UPS CONFIDENTLY
   "What if ECR-NOW is down for 6 hours?"
   → "Kafka retains messages for 7 days. ECR service would keep retrying
      with exponential backoff. After the circuit opens, it fast-fails and
      queues to a DLT. When ECR-NOW recovers, we replay. No data loss."
```

### Numbers to Know Cold

```
Latency:
  L1 cache hit: 0.5 ns
  L2 cache hit: 7 ns
  RAM access: 100 ns
  SSD read (4KB): 150 µs
  HDD seek: 10 ms
  Redis GET: < 1 ms
  PostgreSQL simple query: 1-5 ms
  PostgreSQL complex JOIN (50M rows): 50-200 ms
  Network within DC: 0.5 ms
  Cross-region (US-EU): 150 ms

Throughput:
  PostgreSQL: 10,000-100,000 TPS (simple queries)
  Redis: 100,000+ ops/sec (single node)
  Kafka: 1M+ messages/sec (single broker)
  HTTP/2 connection: 100+ concurrent streams

Availability:
  99%    = 3.65 days/year downtime
  99.9%  = 8.7 hours/year
  99.99% = 52 minutes/year
  99.999% = 5.2 minutes/year
```

---

## CROSS-TOPIC CONNECTIONS (M08 → Others)

| M08 Topic | Connects To |
|-----------|-------------|
| Read replicas, HikariCP sizing | M05: @Transactional(readOnly=true), connection pool config |
| Kafka partition strategy (patient key) | M06: KafkaTemplate with MRN as key, ConsumerRecord |
| Redis cache strategies | M06: @Cacheable, RedisCacheConfiguration per cache name |
| Circuit breaker (ECR-NOW down) | M06: Resilience4j CLOSED/OPEN/HALF-OPEN, fallback queue |
| JWT stateless + RBAC | M04: SecurityFilterChain, @PreAuthorize, JwtAuthFilter |
| Elasticsearch CDC sync | M05: Spring Data projections, event-driven updates |
| K8s liveness/readiness | M07: Actuator health probes, custom HealthIndicator |
| Idempotency key pattern | M06: Kafka at-least-once, deduplication in consumer |
| CQRS read model | M05: JPQL projections, Spring Data Specification |
| Audit log (MDC, structured logging) | M07: ELK stack, MDC.clear() in finally |
