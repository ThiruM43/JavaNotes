# T06 — DESIGN PATTERNS, DEVOPS, PRODUCTION & ADVANCED JVM TERMS
> Format: **TERM** — definition | 🧒 analogy | 💬 how to use it

---

## CATEGORY 18: DESIGN PATTERN TERMS

**Design Pattern** — A reusable solution to a commonly recurring design problem. Not code — a template. 3 categories: Creational, Structural, Behavioral.
> 💬 *"Patterns give us a shared vocabulary — saying 'we used the Observer pattern' immediately explains the design."*

**Singleton** — Ensure only ONE instance of a class exists. Global access point.
> 💬 *"Configuration, connection pools, registries — classic Singleton use cases."*

**Factory** — A method/class that creates objects without exposing the creation logic. Client asks for an object, doesn't know the exact class.
> 💬 *"We use a Factory for `PaymentProcessor` — the client asks for a processor by type (VISA, PAYPAL), factory returns the right one."*

**Abstract Factory** — Factory of factories. Creates families of related objects. Extends Factory pattern.
> 💬 *"Abstract Factory creates UI components — `WindowsFactory` creates Windows buttons/checkboxes; `MacFactory` creates Mac versions."*

**Builder** — Construct complex objects step by step. Separates construction from representation.
> 💬 *"Lombok's `@Builder` generates a Builder — no telescoping constructors with 8 parameters."*

**Prototype** — Clone an existing object instead of creating from scratch. Implement `Cloneable` or copy constructor.
> 💬 *"Prototype is useful when object creation is expensive — clone a pre-configured template."*

**Adapter** — Converts one interface to another. Makes incompatible interfaces work together.
> 🧒 Adapter = electrical plug adapter. Your European plug works in US socket via adapter.
> 💬 *"We wrote an Adapter to make the legacy XML service work with our new JSON-based interface."*

**Decorator** — Dynamically adds behavior to an object without changing its class. Wraps the original.
> 💬 *"Java I/O uses Decorator — `new BufferedReader(new FileReader(path))` adds buffering to a plain reader."*

**Facade** — Provides a simplified interface to a complex subsystem. Hides complexity.
> 💬 *"The `OrderFacade` coordinates User, Inventory, Payment, and Email services — callers see one simple method."*

**Proxy** — Controls access to another object. Types: Virtual (lazy init), Protection (access control), Remote (network call).
> 💬 *"Spring AOP creates a proxy around your bean — that's how `@Transactional` works without touching your code."*

**Observer** — Object (Subject) maintains a list of dependents (Observers) and notifies them of state changes.
> 🧒 Observer = YouTube subscriptions. Publisher posts video → all subscribers get notification.
> 💬 *"Spring's `ApplicationEventPublisher` implements the Observer pattern — publish events, multiple listeners react."*

**Strategy** — Define a family of algorithms, encapsulate each, make them interchangeable at runtime.
> 💬 *"We use Strategy for sorting — `SortStrategy` interface, `QuickSortStrategy`/`MergeSortStrategy` implementations, swapped by config."*

**Template Method** — Define the skeleton of an algorithm in a base class. Subclasses fill in specific steps.
> 💬 *"Spring's `JdbcTemplate` uses Template Method — it handles connection, error handling. You provide the SQL and row mapper."*

**Command Pattern** — Encapsulate a request as an object. Supports undo, queue, logging.
> 💬 *"We use Command pattern for user actions in the editor — each action is a Command object, undo calls `unexecute()`."*

**Chain of Responsibility** — Pass a request through a chain of handlers. Each decides to handle it or pass it on.
> 💬 *"Servlet Filters form a Chain of Responsibility — each filter processes the request, then passes to the next."*

---

## CATEGORY 19: DEVOPS TERMS

**CI/CD (Continuous Integration / Continuous Delivery/Deployment)** — CI: auto-build and test on every commit. CD: auto-deploy to staging/prod.
> 💬 *"Our CI/CD pipeline: code push → Jenkins builds → tests run → Docker image built → deployed to Kubernetes."*

**Build Pipeline** — Automated steps transforming source code to deployable artifact. compile → test → package → containerize.
> 💬 *"The build pipeline fails on test failure — no broken code reaches production."*

**Deployment Pipeline** — Automated steps to deploy artifact to environments: dev → staging → prod.
> 💬 *"Deployment pipeline includes smoke tests, rollback on failure, and Slack notifications."*

**Jenkins** — Open-source automation server for CI/CD. Manages build/test/deploy pipelines.
> 💬 *"Jenkins triggers on every GitHub PR — builds the project and reports pass/fail back to GitHub."*

**Docker** — Platform for containerizing applications. Package app + dependencies → portable container.
> 🧒 Docker = a shipping container. Same container runs on developer laptop, staging, and prod.
> 💬 *"We containerize every service with Docker — `docker build`, `docker push` to registry, `docker run` in prod."*

**Kubernetes (K8s)** — Container orchestration platform. Auto-scales, heals, load-balances Docker containers.
> 💬 *"Kubernetes restarts crashed pods automatically. We define desired state in YAML — K8s makes it happen."*

**Container** — Isolated, lightweight process running from a Docker image. Shares host OS kernel. Faster/lighter than VMs.
> 💬 *"Each microservice runs in its own container — isolated dependencies, consistent across environments."*

**Image** — Immutable snapshot/blueprint for creating containers. Built from `Dockerfile`.
> 💬 *"We version Docker images by git commit SHA — easy to roll back to any previous version."*

**Pod** — Smallest Kubernetes unit. Contains one or more tightly coupled containers sharing network and storage.
> 💬 *"Each microservice instance runs in its own Pod. K8s schedules and manages Pod placement."*

**ReplicaSet** — Kubernetes controller ensuring N pod replicas run at all times. Auto-replaces crashed pods.
> 💬 *"ReplicaSet ensures 3 instances of `order-service` always run — if one dies, K8s spins up a replacement."*

**Deployment** — Kubernetes resource managing ReplicaSets. Enables rolling updates and rollbacks.
> 💬 *"We do rolling deployments — new pods start before old ones stop. Zero downtime."*

**Service (K8s)** — Kubernetes resource providing stable IP/DNS for a set of pods. Pods are ephemeral; Service provides persistence.
> 💬 *"The Kubernetes Service acts as an internal load balancer — clients call the Service, not individual pods."*

**Namespace** — Kubernetes logical cluster partition. Isolate environments (dev, staging, prod) in same cluster.
> 💬 *"We have separate Kubernetes namespaces for dev and staging — same cluster, isolated resources."*

**Helm** — Kubernetes package manager. Bundle Kubernetes YAML configs into reusable "charts".
> 💬 *"We use Helm charts to deploy services — one command, all K8s resources configured with environment-specific values."*

---

## CATEGORY 20: PRODUCTION SUPPORT TERMS

**Root Cause Analysis (RCA)** — Post-incident investigation identifying the fundamental cause of a problem. Key deliverable: prevent recurrence.
> 💬 *"The RCA found the root cause was a missing index causing timeouts under load — index was added."*

**Incident** — An unplanned interruption or degradation of service quality in production.
> 💬 *"We had a P1 incident last night — payment service was down for 20 minutes."*

**Severity** — Priority level of an incident. P1 = total outage. P2 = major degradation. P3 = minor issue. P4 = cosmetic.
> 💬 *"This is a P2 — checkout is slow but not fully down. Escalate to on-call team."*

**Hotfix** — Emergency fix deployed directly to production, bypassing normal release process. For critical production bugs.
> 💬 *"We need a hotfix — the payment bug is affecting 30% of transactions. Skip the sprint process."*

**Patch** — A minor software update fixing specific bugs or security vulnerabilities.

**Production Issue** — A bug or performance problem affecting live users in production environment.
> 💬 *"The production issue was a memory leak — heap grew until OOM after 48 hours uptime."*

**Log Analysis** — Examining application/system logs to diagnose issues. Tools: ELK Stack (Elasticsearch, Logstash, Kibana), Splunk.
> 💬 *"Log analysis showed a spike in `500 Internal Server Error` starting at 14:32 — correlates with deployment."*

**Monitoring** — Continuous observation of system health. Metrics, alerts, dashboards. Tools: Prometheus, Grafana, Datadog.
> 💬 *"Our monitoring dashboards show CPU, memory, GC time, request rate, and error rate for every service."*

**Alert** — Automated notification triggered when a metric crosses a threshold. e.g., error rate > 1%, p99 latency > 2s.
> 💬 *"The alert fired at 3 AM — heap usage over 90%. On-call engineer was paged."*

**Health Check** — Endpoint/probe verifying service is running correctly. Kubernetes uses liveness/readiness probes.
> 💬 *"Liveness probe restarts the pod if health check fails. Readiness probe removes it from load balancing."*

**Failover** — Automatic switch to a backup system when the primary fails.
> 💬 *"Database failover to the read replica happens automatically in 30 seconds via Route 53 health checks."*

**Disaster Recovery (DR)** — Plan and processes to recover systems after catastrophic failure. RTO (time to recover) + RPO (data loss tolerance).
> 💬 *"Our DR RTO is 4 hours, RPO is 15 minutes — we back up to a different region every 15 minutes."*

**High Availability (HA)** — System design ensuring near-continuous operation. Multiple instances, no single point of failure.
> 💬 *"We run 3 instances across 2 availability zones — HA design survives a full zone outage."*

**Scalability** — Ability to handle increased load. Vertical (bigger machine) vs Horizontal (more machines).
> 💬 *"Horizontal scalability means adding more pods in K8s — stateless services scale easily."*

**Resilience** — System's ability to recover from failures and continue operating. Circuit breakers, retries, fallbacks.
> 💬 *"We built resilience into the payment flow — if payment-service is down, we queue the request and retry."*

**Throughput** — Amount of work processed per unit time. Requests per second, transactions per minute.
> 💬 *"After the optimization, throughput improved from 500 to 2000 requests/sec."*

**Latency** — Time to complete a single operation. p50, p95, p99 percentile latency. p99 = slowest 1% of requests.
> 💬 *"Our p99 latency is 250ms — 99% of requests complete under 250ms. p50 is 20ms."*

**Bottleneck** — The constraint limiting overall system performance. Could be DB, CPU, network, GC.
> 💬 *"Profiling showed the bottleneck is DB connection pool exhaustion — increase pool size or optimize queries."*

---

## CATEGORY 21: ADVANCED JVM TERMS

**Escape Analysis** — JVM optimization detecting if an object "escapes" a method scope. If not → allocate on Stack instead of Heap (no GC needed).
> 💬 *"Escape analysis enables stack allocation of short-lived objects — reduces GC pressure. Enabled by default."*

**JVM Tuning** — Configuring JVM flags for optimal performance: heap size, GC algorithm, thread stack size.
> 💬 *"JVM tuning involved: setting `-Xmx4g`, switching to G1 GC, and tuning `MaxGCPauseMillis=200`."*

**Heap Dump** — Snapshot of JVM heap at a point in time. Contains all live objects and references. Used to diagnose memory leaks.
> 💬 *"We took a heap dump with `jmap -dump:format=b,file=heap.hprof <pid>` and analyzed with Eclipse MAT — found 1M cached objects never evicted."*

**Thread Dump** — Snapshot of all thread states at a point in time. Shows what every thread is doing / waiting on. Key for diagnosing deadlocks and hung apps.
> 💬 *"The thread dump showed 50 threads blocked waiting for a database connection — pool exhaustion."*

**GC Tuning** — Adjusting GC algorithm and parameters to optimize for throughput or latency.
> 💬 *"GC tuning: we set `-XX:MaxGCPauseMillis=100` and `G1HeapRegionSize=16m` based on our heap usage patterns."*

**Safepoint** — A point in JVM execution where the state is known and stable. JVM must reach a safepoint for STW operations (GC, thread dump, deoptimization).
> 💬 *"JVM safepoints explain why `Thread.sleep(1000)` can cause GC to take longer — threads must reach safepoints first."*

**Biased Locking** — JVM optimization: if only one thread uses a lock, biases the lock to that thread — no actual locking overhead. Disabled in Java 15+.
> 💬 *"Biased locking improved single-threaded performance — but it causes overhead when multiple threads compete. Removed in Java 15."*

**Lock Escalation** — JVM automatically escalates from thin lock → fat lock based on contention. Thin lock = low-cost. Fat lock = full OS mutex.

**Lock Coarsening** — JVM merges multiple consecutive synchronized blocks on same object into one larger block. Reduces lock overhead.

**Lock Elimination** — JVM removes unnecessary locks (detected via escape analysis) when objects don't escape. No-overhead sync on local objects.
> 💬 *"Lock elimination removes synchronization on `StringBuffer` used locally — JIT proves it's thread-safe already."*

**Memory Barrier (Memory Fence)** — CPU instruction preventing reordering of memory operations across the barrier. Used by `volatile`, `synchronized`, and `java.util.concurrent`.
> 💬 *"A memory barrier after a `volatile` write ensures all threads see the latest value immediately."*

**Happens-Before Relationship** — Guarantee in Java Memory Model: if action A happens-before action B, then B sees all effects of A.
> 💬 *"The `volatile` write happens-before the subsequent `volatile` read — guarantees visibility without synchronization."*

**Java Memory Model (JMM)** — Specification defining how threads interact through shared memory. Defines visibility, ordering, and atomicity guarantees.
> 💬 *"Understanding the JMM explains why you need `volatile` or `synchronized` — CPU and JIT can reorder instructions otherwise."*

**False Sharing** — Performance problem where two threads update different variables on the SAME CPU cache line. Causes cache invalidation even though data is unrelated.
> 💬 *"False sharing caused counter performance to drop — added padding to put each counter in its own cache line."*

**CAS (Compare And Swap)** — Hardware-level atomic operation. "If current value == expected, update to new value; otherwise fail." Foundation of lock-free data structures. Used by `AtomicInteger`.
> 💬 *"`AtomicInteger.incrementAndGet()` uses CAS in a loop — no locks, yet thread-safe."*

**Unsafe API** — `sun.misc.Unsafe` — low-level JVM operations: direct memory access, CAS, object creation without constructor. Used internally by JDK. Dangerous.
> 💬 *"We don't use `Unsafe` directly. It's used internally by `AtomicLong`, `ConcurrentHashMap`, and `LockSupport`."*

**Off-Heap Memory** — Memory outside JVM heap, allocated directly. Not GC'd. Used by large caches (Ehcache, MapDB) or NIO buffers.
> 💬 *"We moved the large cache to off-heap memory — eliminates GC pressure from millions of cached objects."*

---

## BONUS: TERMS TO KNOW IN TECH DISCUSSIONS

### Phrases that signal seniority:
```
"We should favor composition over inheritance here."
"This has low cohesion — let's split the responsibility."
"This is a classic N+1 problem — add a JOIN FETCH."
"The circuit breaker will prevent cascade failures."
"We need idempotent endpoints for safe retries."
"p99 latency is more important than average for user experience."
"Let's do an RCA on yesterday's incident."
"The bottleneck is DB connection pool exhaustion."
"We should enable escape analysis and check for false sharing."
"Use ConcurrentHashMap, not synchronized HashMap — much better throughput."
```

### Terms to NOT confuse:
| Don't confuse | Difference |
|--------------|------------|
| Authentication vs Authorization | WHO you are vs WHAT you can do |
| Concurrency vs Parallelism | Progress simultaneously vs exactly at same time |
| Encryption vs Hashing | Reversible vs one-way |
| Heap vs Stack | Objects vs method frames |
| PermGen vs Metaspace | Pre-Java8 vs Java8+ class metadata area |
| Coupling vs Cohesion | Between classes vs within a class |
| Latency vs Throughput | Per-request speed vs overall volume |
| Normalization vs Denormalization | Reduce redundancy vs add redundancy for speed |
| Eager vs Lazy Loading | Load now vs load when needed |
| Serialization vs Deserialization | Object → bytes/JSON vs bytes/JSON → Object |
