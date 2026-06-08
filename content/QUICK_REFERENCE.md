# ⚡ QUICK REFERENCE — Pre-Interview Cram Sheet
## Scan this 30 minutes before your interview

---

## 1. JAVA CORE — Must Know

### Access Modifiers
| Modifier | Same Class | Same Package | Subclass | Everywhere |
|----------|-----------|--------------|----------|------------|
| `private` | ✅ | ❌ | ❌ | ❌ |
| (default) | ✅ | ✅ | ❌ | ❌ |
| `protected` | ✅ | ✅ | ✅ | ❌ |
| `public` | ✅ | ✅ | ✅ | ✅ |

### Key Differences (Quick Fire)
- `==` vs `.equals()` → reference vs content
- `String` vs `StringBuilder` → immutable vs mutable; StringBuilder not thread-safe
- `StringBuffer` vs `StringBuilder` → thread-safe (synchronized) vs faster (not)
- `final` field → reference fixed, object can mutate
- `static` → belongs to class, not instance; one copy in Metaspace
- `volatile` → visibility guarantee, NOT atomicity
- `transient` → skip during serialization
- Checked exception → must declare/catch; Unchecked → RuntimeException, optional

### JVM Memory
```
Heap:   Young Gen (Eden + S0 + S1) → Old Gen
        Object allocation starts in Eden
        Minor GC: Eden → Survivor → Old Gen (after threshold)
        Full GC: entire heap — expensive, stop-the-world

Metaspace: Class metadata, static fields, interned strings (Java 8+)
Stack:  Per-thread; method frames, local variables, primitive values
```

### GC Algorithms
| GC | Use When |
|----|----------|
| G1GC | Default Java 9+; balanced throughput + latency |
| ZGC | Sub-10ms pauses; large heaps; latency-sensitive |
| Parallel GC | Batch jobs; max throughput; pauses OK |
| Shenandoah | Ultra-low pause; concurrent compaction |

---

## 2. COLLECTIONS — Big-O Cheat Sheet

| Structure | Get | Add | Remove | Search | Notes |
|-----------|-----|-----|--------|--------|-------|
| ArrayList | O(1) | O(1)* | O(n) | O(n) | *amortized; resize doubles capacity |
| LinkedList | O(n) | O(1) head/tail | O(1) | O(n) | Poor cache locality |
| HashMap | O(1) | O(1) | O(1) | O(1) | Worst O(n); treeify at 8 |
| TreeMap | O(log n) | O(log n) | O(log n) | O(log n) | Sorted; Red-Black tree |
| HashSet | O(1) | O(1) | O(1) | O(1) | Backed by HashMap |
| TreeSet | O(log n) | O(log n) | O(log n) | O(log n) | Sorted |
| PriorityQueue | O(1) peek | O(log n) | O(log n) | O(n) | Min-heap; poll = smallest |
| ArrayDeque | O(1) | O(1) | O(1) | O(n) | Better than LinkedList for queue |

### When to Use Which Map
- `HashMap` → general key-value, no ordering needed
- `LinkedHashMap` → insertion order / LRU cache (`accessOrder=true`)
- `TreeMap` → sorted keys, range queries (`subMap`, `floorKey`, `ceilingKey`)
- `ConcurrentHashMap` → multi-threaded access (segment-level locking)

### HashMap Internals (Say This Confidently)
`hashCode()` → XOR spread → `index = hash & (capacity-1)` → bucket → linked list → tree at 8 entries → rehash at 75% load

---

## 3. STREAM API — Quick Reference

### Intermediate (lazy — not executed until terminal)
```
filter(Predicate)      map(Function)         flatMap(Function)
sorted(Comparator)     distinct()            limit(n) / skip(n)
peek(Consumer)         takeWhile(Predicate)  dropWhile(Predicate)
```

### Terminal (triggers execution, closes stream)
```
collect(Collector)     forEach(Consumer)     count()
reduce(BinaryOp)       findFirst/Any()       anyMatch/allMatch/noneMatch()
min/max(Comparator)    toList() [Java 16]    toArray()
```

### Key Collectors
```java
Collectors.toList()
Collectors.toSet()
Collectors.toMap(keyFn, valueFn)
Collectors.groupingBy(classifier)              // Map<K, List<V>>
Collectors.groupingBy(classifier, counting())  // Map<K, Long>
Collectors.partitioningBy(predicate)           // Map<Boolean, List<V>>
Collectors.joining(", ", "[", "]")             // String concatenation
Collectors.averagingInt(fn)
Collectors.summingInt(fn)
```

### Functional Interfaces
| Interface | Method | Use |
|-----------|--------|-----|
| `Predicate<T>` | `test(T) → boolean` | filter |
| `Function<T,R>` | `apply(T) → R` | map/transform |
| `Consumer<T>` | `accept(T) → void` | forEach/side effects |
| `Supplier<T>` | `get() → T` | lazy value |
| `BiFunction<T,U,R>` | `apply(T,U) → R` | two-arg transform |
| `UnaryOperator<T>` | `apply(T) → T` | transform same type |

---

## 4. CONCURRENCY — Key Points

### Thread States
`NEW → RUNNABLE → BLOCKED/WAITING/TIMED_WAITING → TERMINATED`
- `BLOCKED` = waiting for monitor lock
- `WAITING` = `wait()`, `join()`, `park()`
- `TIMED_WAITING` = `sleep()`, `wait(timeout)`

### Synchronization Toolkit
| Tool | Use Case |
|------|----------|
| `synchronized` | Simple mutual exclusion; JVM-managed |
| `ReentrantLock` | `tryLock(timeout)`, fairness, multiple conditions |
| `ReadWriteLock` | Many readers OR one writer |
| `volatile` | Single writer, many readers; visibility only |
| `AtomicInteger/Long/Ref` | Lock-free counter/CAS operations |
| `CountDownLatch` | Wait for N events (one-time) |
| `CyclicBarrier` | N threads meet at barrier (reusable) |
| `Semaphore` | Limit concurrent access to N |
| `BlockingQueue` | Producer-consumer with backpressure |

### CompletableFuture Key Methods
```java
supplyAsync(supplier)              // Start async computation
thenApply(fn)                      // Transform result
thenAccept(consumer)               // Consume result (void)
thenRun(runnable)                  // Run after (no input/output)
exceptionally(fn)                  // Handle error, return default
thenCompose(fn)                    // Chain dependent async (flatMap)
allOf(cf1, cf2, cf3)              // Wait for all
anyOf(cf1, cf2, cf3)              // Take fastest
orTimeout(5, SECONDS)             // Fail if too slow
```

### Virtual Threads (Java 21) — Key Points
- `Executors.newVirtualThreadPerTaskExecutor()` — one virtual thread per task
- Spring Boot: `spring.threads.virtual.enabled: true`
- Blocks on IO → unmounts from carrier thread (carrier free to run others)
- Pitfall: `synchronized` block + IO = pins carrier thread → use `ReentrantLock`
- Pitfall: `ThreadLocal` with large values × millions of threads → memory pressure

---

## 5. SPRING ANNOTATIONS — Complete Reference

### Core / DI
```
@Component, @Service, @Repository, @Controller, @RestController
@Autowired, @Qualifier("name"), @Primary
@Bean (in @Configuration), @Configuration
@Lazy, @Scope("prototype")
@PostConstruct, @PreDestroy
@Value("${property}"), @ConfigurationProperties(prefix="x")
@Profile("prod"), @Conditional, @ConditionalOnClass, @ConditionalOnMissingBean
```

### Spring MVC / REST
```
@RequestMapping, @GetMapping, @PostMapping, @PutMapping, @DeleteMapping, @PatchMapping
@PathVariable, @RequestParam, @RequestBody, @ResponseBody
@RequestHeader, @CookieValue
@ResponseStatus(HttpStatus.CREATED)
@Valid, @Validated
@RestControllerAdvice, @ExceptionHandler
@CrossOrigin
```

### Spring Security
```
@EnableWebSecurity
@PreAuthorize("hasRole('DOCTOR')")
@PostAuthorize, @Secured, @RolesAllowed
@WithMockUser (test only)
```

### JPA / Transaction
```
@Entity, @Table(name="patients")
@Id, @GeneratedValue(strategy=SEQUENCE)
@Column(name="mrn", unique=true, nullable=false)
@Transient  (not persisted)
@OneToMany(mappedBy="patient", cascade=CascadeType.ALL, orphanRemoval=true)
@ManyToOne(fetch=FetchType.LAZY)
@ManyToMany, @JoinTable, @JoinColumn
@Embedded, @Embeddable
@Version  (optimistic lock)
@CreatedDate, @LastModifiedDate, @CreatedBy (Spring Data Auditing)
@EntityListeners(AuditingEntityListener.class)
@NamedEntityGraph, @EntityGraph
@Transactional(readOnly=true, rollbackFor=Exception.class)
@Transactional(propagation=Propagation.REQUIRES_NEW)
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Patient p WHERE p.mrn = :mrn")
@Modifying, @Param("mrn")
```

### Spring Boot
```
@SpringBootApplication  (= @Configuration + @EnableAutoConfiguration + @ComponentScan)
@EnableAutoConfiguration
@SpringBootTest(webEnvironment=RANDOM_PORT)
@WebMvcTest(PatientController.class)
@DataJpaTest
@MockBean, @SpyBean
@Testcontainers, @Container
@DynamicPropertySource
@AutoConfigureMockMvc
```

### AOP
```
@Aspect, @Component
@Before("execution(* com.ehr..*(..))")
@After, @Around, @AfterReturning, @AfterThrowing
@Pointcut
```

### Kafka / Redis
```
@KafkaListener(topics="lab-results", groupId="ecr-consumers")
@EnableKafka
@Cacheable(value="patients", key="#mrn")
@CacheEvict(value="patients", key="#mrn")
@CachePut(value="patients", key="#result.mrn")
@EnableCaching
@Scheduled(cron="0 0 * * * *")
@EnableScheduling
```

---

## 6. HTTP STATUS CODES — Must Know

| Code | Meaning | Use In EHR |
|------|---------|------------|
| 200 OK | Success | GET patient |
| 201 Created | Resource created | POST patient |
| 202 Accepted | Async accepted | ECR submission queued |
| 204 No Content | Success, no body | DELETE patient |
| 400 Bad Request | Validation failure | Missing required field |
| 401 Unauthorized | Not authenticated | No/invalid JWT |
| 403 Forbidden | Authenticated but not authorized | NURSE accessing admin |
| 404 Not Found | Resource missing | Patient MRN not found |
| 409 Conflict | State conflict | Duplicate MRN |
| 422 Unprocessable | Semantically invalid | Valid JSON, business rule fails |
| 429 Too Many Requests | Rate limited | Hospital exceeded API quota |
| 500 Internal Server Error | Unexpected server error | Unhandled exception |
| 502 Bad Gateway | Upstream failure | Gateway can't reach ECR service |
| 503 Service Unavailable | Service down/overloaded | Circuit breaker OPEN |
| 504 Gateway Timeout | Upstream timeout | ECR-NOW took > 30s |

### HTTP Idempotency
| Method | Idempotent | Safe (no side effects) |
|--------|-----------|----------------------|
| GET | ✅ | ✅ |
| HEAD | ✅ | ✅ |
| PUT | ✅ | ❌ |
| DELETE | ✅ | ❌ |
| POST | ❌ | ❌ |
| PATCH | ❌ | ❌ |

---

## 7. JPA / TRANSACTION — Critical Details

### Entity Lifecycle
`New → (persist) → Managed → (flush) → DB`
`Managed → (close/detach) → Detached → (merge) → Managed`
`Managed → (remove) → Removed → (flush) → DB DELETE`

### Transaction Propagation
| Propagation | Behavior |
|-------------|----------|
| `REQUIRED` | Join existing or create new (default) |
| `REQUIRES_NEW` | Always create new, suspend existing |
| `MANDATORY` | Must have existing, throw if not |
| `SUPPORTS` | Join if exists, non-transactional if not |
| `NOT_SUPPORTED` | Suspend existing, run non-transactional |
| `NEVER` | Throw if transaction exists |
| `NESTED` | Savepoint within existing |

### Isolation Levels
| Level | Dirty Read | Non-Repeatable | Phantom |
|-------|-----------|----------------|---------|
| READ_UNCOMMITTED | ✅ possible | ✅ possible | ✅ possible |
| READ_COMMITTED | ❌ prevented | ✅ possible | ✅ possible |
| REPEATABLE_READ | ❌ | ❌ prevented | ✅ possible |
| SERIALIZABLE | ❌ | ❌ | ❌ prevented |

PostgreSQL default = READ_COMMITTED. Spring default = READ_COMMITTED.

### N+1 — Solutions
1. `JOIN FETCH` in JPQL: `SELECT p FROM Patient p JOIN FETCH p.appointments`
2. `@EntityGraph(attributePaths = {"appointments"})`
3. `@BatchSize(size = 25)` on collection

### @Transactional — Pitfalls
- Self-invocation bypasses proxy → use `@Autowired @Lazy private Self self`
- Default rollback only on `RuntimeException` → use `rollbackFor = Exception.class` for checked
- `readOnly = true` → Hibernate skips dirty check, DB can optimize reads
- Keep transaction boundary tight → don't hold transaction across HTTP calls

---

## 8. MICROSERVICES — Key Concepts

### Circuit Breaker States (Resilience4j)
```
CLOSED → normal operation, counting failures
  ↓ (failure rate > threshold)
OPEN → fast fail, return fallback immediately
  ↓ (after waitDuration)
HALF-OPEN → allow N test calls
  ↓ success → CLOSED
  ↓ failure → OPEN
```

### Kafka Producer Config
```yaml
acks: all                    # Wait for all ISR replicas
enable.idempotence: true     # Exactly-once producer
retries: 3
linger.ms: 5                 # Batch up to 5ms
batch.size: 16384            # 16KB batch
```

### Kafka Consumer Config
```yaml
enable.auto.commit: false    # Manual ACK
max.poll.records: 50         # Batch size
auto.offset.reset: earliest  # Start from beginning if no offset
session.timeout.ms: 30000    # Heartbeat timeout
```

### Redis Eviction Policies
```
allkeys-lru      → Evict least recently used (any key)
volatile-lru     → Evict LRU (only keys with TTL)
allkeys-lfu      → Evict least frequently used
volatile-ttl     → Evict shortest TTL first
noeviction       → Return error when full (default — change this!)
```

### Design Patterns Quick
| Pattern | Use | Example |
|---------|-----|---------|
| Saga | Distributed transactions | Patient registration across services |
| Circuit Breaker | Prevent cascade failure | ECR-NOW down → fast fail |
| CQRS | Read/write separation | PostgreSQL write, Elasticsearch read |
| Bulkhead | Isolate thread pools | ECR calls ≠ Lab calls |
| Retry + Backoff | Transient failures | 1m, 5m, 25m attempts |
| Idempotency Key | Safe retries | SHA256(mrn+condition+epiWeek) |
| Outbox Pattern | Reliable event publish | Save + publish in same transaction |
| Sidecar | Cross-cutting concerns | Logging, service mesh, proxy |

---

## 9. DESIGN PATTERNS — One-Liners

| Pattern | Category | One-Line Description |
|---------|----------|----------------------|
| Singleton | Creational | One instance, global access (Spring beans) |
| Factory Method | Creational | Subclass decides which object to create |
| Abstract Factory | Creational | Family of related objects |
| Builder | Creational | Step-by-step construction (Lombok @Builder) |
| Prototype | Creational | Clone existing object |
| Adapter | Structural | Incompatible interfaces work together |
| Decorator | Structural | Add behavior without changing class (AOP) |
| Proxy | Structural | Control access (Spring @Transactional, @Cacheable) |
| Facade | Structural | Simple interface over complex subsystem |
| Composite | Structural | Tree structures (FHIR Bundle → resources) |
| Observer | Behavioral | Notify many on event (Spring Events, Kafka) |
| Strategy | Behavioral | Swap algorithm at runtime (PaymentProcessor map) |
| Template Method | Behavioral | Algorithm skeleton, steps overridden (abstract class) |
| Command | Behavioral | Encapsulate request as object |
| Chain of Responsibility | Behavioral | Pass request through handlers (Filter chain) |

---

## 10. SYSTEM DESIGN — Numbers to Know Cold

### Latency
```
L1 cache: 0.5 ns
RAM: 100 ns (0.1 µs)
SSD read: 150 µs
Redis GET: < 1 ms
PostgreSQL simple query: 1-5 ms
Network within DC: 0.5 ms
Cross-region (US-EU): 150 ms
```

### Throughput Rough Estimates
```
PostgreSQL: 10k-100k TPS (simple queries)
Redis: 100k+ ops/sec (single node)
Kafka: 1M+ messages/sec (single broker)
```

### Availability SLAs
```
99%     = 3.65 days/year downtime
99.9%   = 8.7 hours/year
99.99%  = 52 minutes/year
99.999% = 5.2 minutes/year
```

### Storage Estimates
```
1M requests/day = ~12 RPS
1B requests/day = ~12,000 RPS
1KB × 1M records = 1GB
1KB × 1B records = 1TB
```

### CAP Theorem
- Must always tolerate **P**artition in practice
- Real choice: **CP** (consistent, reject on partition) vs **AP** (available, serve stale)
- PostgreSQL = CP, Cassandra = AP (tunable), Redis = CP

---

## 11. MODERN JAVA — Quick Summary

| Feature | Java Version | One-Liner |
|---------|-------------|-----------|
| Lambdas, Streams | 8 | Must know |
| `var` | 10 | Local type inference, zero runtime cost |
| `String.strip/isBlank` | 11 | Unicode-aware trim |
| Switch expression | 14 | Returns value, arrow syntax, no fall-through |
| Records | 16 | Immutable data carriers, auto-generates all |
| Text blocks | 15 | Multiline strings, no escape mess |
| `instanceof` pattern | 16 | `if (obj instanceof Patient p)` |
| Sealed classes | 17 | Closed hierarchy, exhaustive switch |
| Virtual threads | 21 | Millions of threads, block freely on IO |
| Pattern matching switch | 21 | `case Patient p when p.active()` |
| Sequenced Collections | 21 | `getFirst()`, `getLast()`, `reversed()` |

---

## 12. JVM FLAGS — Most Used

```bash
# Memory
-Xms512m -Xmx2g                          # Initial and max heap
-XX:MaxMetaspaceSize=512m                 # Cap Metaspace
-XX:+UseContainerSupport                  # Respect container limits (K8s)
-XX:MaxRAMPercentage=75.0                 # 75% of container RAM for heap

# GC
-XX:+UseG1GC                             # G1 (default Java 9+)
-XX:MaxGCPauseMillis=200                  # Target pause time
-XX:+UseZGC                              # Ultra-low pause (Java 15+)

# Diagnostics
-XX:+HeapDumpOnOutOfMemoryError           # Dump on OOM
-XX:HeapDumpPath=/var/log/heap.hprof      # Where to dump
-Xlog:gc*:file=/var/log/gc.log            # GC logging

# Performance
-XX:+UseStringDeduplication               # Deduplicate strings (saves memory)
```

---

## 13. SQL — Quick Reference

### JOIN Types
```sql
INNER JOIN  → only matching rows in both tables
LEFT JOIN   → all left rows + matching right (NULL if no match)
RIGHT JOIN  → all right rows + matching left
FULL OUTER  → all rows from both (NULL where no match)
CROSS JOIN  → cartesian product (every combo)
```

### Window Functions
```sql
ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY resulted_at DESC)
RANK() OVER (...)          -- ties get same rank, gaps after
DENSE_RANK() OVER (...)    -- ties get same rank, no gaps
LAG(col, 1) OVER (...)     -- previous row value
LEAD(col, 1) OVER (...)    -- next row value
SUM(col) OVER (PARTITION BY patient_id ORDER BY date ROWS UNBOUNDED PRECEDING)
```

### Index Tips
- Index columns used in `WHERE`, `JOIN ON`, `ORDER BY`
- Covering index: include all SELECT columns → index-only scan
- `EXPLAIN ANALYZE` to check if index is used
- B-tree index: equality + range. Hash: equality only. GIN: full-text, arrays

---

## 14. BEHAVIORAL INTERVIEW — STAR Framework

**S**ituation → **T**ask → **A**ction → **R**esult

### Quick Stories to Have Ready
1. **Performance problem you solved** → N+1 query found, JOIN FETCH fixed, X% improvement
2. **Production incident** → OOMKilled pods, heap dump analysis, unbounded cache found, fixed with eviction
3. **Technical disagreement** → Pushed back on synchronous ECR calls, proposed Kafka, outcome
4. **Mentored someone** → Code review, explained @Transactional pitfall, they avoided bug
5. **Tight deadline** → Prioritized critical path, communicated trade-offs, shipped on time
6. **Complex system design** → Designed idempotency for ECR submission, prevented duplicates
7. **Refactoring legacy code** → Added tests first, refactored safely, improved maintainability
8. **Cross-team collaboration** → Worked with lab system team on Kafka event schema contract

---

## 15. LAST-MINUTE REMINDERS

```
✅ Always ask clarifying questions before answering system design
✅ Think out loud — interviewers want to hear your reasoning
✅ Know your Big-O for every collection operation
✅ Proxy = @Transactional, @Cacheable, @Async bypass on this.method()
✅ HashMap: override both equals() AND hashCode() always
✅ @Transactional default: rolls back only on RuntimeException
✅ N+1 = most common JPA interview follow-up
✅ Virtual threads: don't use synchronized + IO together
✅ Circuit breaker: CLOSED → OPEN → HALF-OPEN → CLOSED
✅ Kafka ordering: guaranteed within partition only
✅ CAP: distributed system always tolerates partition, choose CP or AP
✅ CQRS: write model ≠ read model; eventual consistency trade-off
```
