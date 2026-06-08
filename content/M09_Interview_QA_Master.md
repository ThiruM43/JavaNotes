# M09 — Interview Q&A Master
## Top 100 Java Senior Interview Questions with Model Answers
## EHR / ECR-NOW Domain | Java Senior Interview Series

> **How to use this file:** Don't memorize — internalize. Read the question, cover the answer, try to say it out loud. A good answer takes 60-90 seconds. Note what each question is *really testing*.

---

## SECTION 1 — Core Java (Q1–Q20)

---

**Q1. What is the difference between JDK, JRE, and JVM?**

> *Testing: Do you understand the Java ecosystem at a conceptual level?*

JVM is the runtime engine that executes bytecode — it's an abstract specification. It manages memory, runs garbage collection, and JIT-compiles hot bytecode to native code. JRE is the JVM plus the standard class libraries (java.lang, java.util, etc.) — everything you need to *run* a Java program. JDK is the JRE plus the development tools: the compiler (javac), debugger (jdb), profiling tools, and javadoc. In production you only need JRE (or JDK 9+ where the distinction is blurred). On your dev machine you need JDK.

---

**Q2. Explain the 4 pillars of OOP with a real example.**

> *Testing: Can you apply theory to actual code, not just define terms?*

In our EHR system: **Encapsulation** — the `Patient` class hides its `ssn` field and `mrn` (final, set once), exposing only what's needed. `getAge()` is derived, SSN is never exposed directly (HIPAA). **Inheritance** — `MedicalPerson` is the base; `Doctor` and `Nurse` extend it, inheriting common fields like `licenseNumber`, `department`. **Polymorphism** — both `Doctor` and `PatientPortal` implement `Notifiable`. When we call `notifiable.notify(alert)`, the runtime dispatches to the right implementation. **Abstraction** — `CaseReporter` is abstract with a template method `submit()` that calls abstract `buildPayload()` — subclasses define *what* to submit, the template controls *how*.

---

**Q3. What is the difference between `==` and `.equals()`?**

> *Testing: String pool knowledge, object identity vs equality.*

`==` compares references — two variables pointing to the same object in memory. `.equals()` compares content — defined by the class. For Strings: `"MRN-001" == "MRN-001"` is `true` for string literals (same pool entry) but `new String("MRN-001") == new String("MRN-001")` is `false` (two heap objects). Always use `.equals()` for logical equality. For domain objects like `Patient`, override both `equals()` and `hashCode()` using the business key (MRN), not the database ID — otherwise two `Patient` objects representing the same patient won't be equal in a `HashSet`.

---

**Q4. Explain `final`, `finally`, and `finalize`.**

> *Testing: Attention to similar-sounding concepts.*

`final` is a modifier: on a variable → can't reassign (reference is fixed, but object can mutate); on a method → can't override; on a class → can't extend (like `String`). In EHR: `final String mrn` ensures MRN never changes after assignment. `finally` is a try-catch block that always runs, even if an exception is thrown or a `return` executes — used for resource cleanup. Always use try-with-resources instead of explicit `finally` for `Closeable` resources. `finalize()` is a deprecated method called by GC before collecting an object — unreliable, don't use it. Use `Cleaner` in Java 9+ or explicit close patterns.

---

**Q5. What is the String Pool? How does it work?**

> *Testing: JVM memory model understanding.*

The String Pool (interned strings) lives in the Heap (moved from PermGen in Java 7). When you write `String s = "MRN-001"`, the JVM checks the pool — if that literal exists, it returns the same reference. Calling `s.intern()` explicitly pools a runtime string. This saves memory when the same string appears many times (ICD codes, department names). The `String` class is `final` and immutable, enabling safe sharing. When building dynamic strings (FHIR URLs, JSON), always use `StringBuilder` — `String +` in a loop creates a new object each iteration, generating garbage that stresses Eden.

---

**Q6. What is the difference between `ArrayList` and `LinkedList`?**

> *Testing: Data structure trade-offs, not just "ArrayList is faster."*

`ArrayList` is backed by a resizable array. Random access (`get(i)`) is O(1) since index math directly finds the element. Add at end is amortized O(1) (doubles capacity when full). Insert/delete in the middle is O(n) — shifts elements. Best for random access and iteration. `LinkedList` is doubly-linked. Add/remove at head or tail is O(1). But `get(i)` is O(n) — must traverse from head. Also uses more memory per element (two pointers per node). In EHR: `ArrayList` for appointment lists (iterate, sort, random access). `LinkedList` as a `Deque` for a processing queue where we always operate on head/tail. In practice, `ArrayDeque` beats `LinkedList` for queue use cases due to cache locality.

---

**Q7. How does `HashMap` work internally?**

> *Testing: Deep knowledge of the most-used data structure.*

`HashMap` uses an array of buckets. When you `put(key, value)`: (1) `key.hashCode()` is computed and spread using XOR with `hash >>> 16` to distribute bits evenly. (2) `index = hash & (capacity - 1)` finds the bucket. (3) If bucket empty, new `Node` placed there. If collision, entries chain as a linked list on that bucket. When the chain grows past 8 entries (TREEIFY_THRESHOLD) and table size ≥ 64, it converts to a Red-Black tree (O(log n) instead of O(n) worst case). Load factor default 0.75 — when 75% full, rehash to double capacity. Equal keys must have equal hash codes (contract). In EHR: using `Patient` as a map key → override both `hashCode()` (use MRN) and `equals()` (compare MRN). Mutable keys are dangerous — if MRN changes after insertion, the bucket index is wrong and you lose the entry.

---

**Q8. What is the difference between `Comparable` and `Comparator`?**

> *Testing: OOP design, natural order vs multiple sort strategies.*

`Comparable` defines the natural order of a class — the class itself implements `compareTo()`. One ordering per class. `Patient implements Comparable<Patient>` would define sorting by MRN (natural key). `Comparator` is a separate object defining an external ordering — multiple comparators, no change to the class. In EHR: `Comparator.comparing(Patient::getLastName).thenComparing(Patient::getFirstName)` for display. `Comparator.comparingInt(Appointment::getUrgencyScore).reversed()` for triage queue. `Comparator` is preferred in modern code — lambdas, composable, doesn't require modifying the domain class.

---

**Q9. Explain checked vs unchecked exceptions. When do you use each?**

> *Testing: Exception design philosophy.*

Checked exceptions extend `Exception` and must be declared (`throws`) or caught — compiler enforces this. They represent recoverable conditions the caller should handle: `FileNotFoundException`, `SQLException`. Unchecked extend `RuntimeException` — no declaration required, represent programming errors or unrecoverable conditions: `NullPointerException`, `IllegalArgumentException`. In modern Spring code, most custom exceptions are unchecked — Spring's `@Transactional` only rolls back on `RuntimeException` by default. In EHR: `PatientNotFoundException extends RuntimeException` (unchecked — caller typically doesn't recover, returns 404). `EcrSubmissionException extends RuntimeException` — spring rolls back transaction automatically. If I needed the caller to explicitly handle retry logic, I might use checked. But in practice, checked exceptions in service layer create noisy code that clutters method signatures.

---

**Q10. What is the difference between `interface` and `abstract class`?**

> *Testing: OOP design decisions.*

Abstract class: single inheritance, can have state (fields), constructors, concrete methods, any access modifier. Interface: multiple "inheritance," only constants and abstract methods (pre-Java 8), now also `default` and `static` methods, `private` methods (Java 9+). No state. When to choose: Use interface when defining a *contract* that unrelated classes implement — `Notifiable` is implemented by `Doctor`, `PatientPortal`, `PublicHealthDepartment`. Use abstract class when sharing implementation across closely related classes — `CaseReporter` has common template method `submit()` that all reporters use, with `buildPayload()` abstract. Key: abstract class models IS-A with shared behavior; interface models CAN-DO capability.

---

**Q11. What are generics and type erasure?**

> *Testing: Type system understanding.*

Generics provide compile-time type safety without runtime overhead. `List<Patient>` ensures you can't accidentally add a `Doctor`. Type erasure: the generic type parameter is removed at compile time — `List<Patient>` becomes `List<Object>` in bytecode. JVM has no knowledge of generic types at runtime. This means: `instanceof List<Patient>` doesn't compile; `getClass()` returns `class java.util.ArrayList` not `ArrayList<Patient>`. Bounded wildcards: `List<? extends MedicalPerson>` (read-only covariant), `List<? super Patient>` (write-only contravariant). In EHR: `ApiResponse<T>` generic wrapper (`ApiResponse<PatientResponse>`, `ApiResponse<List<AppointmentResponse>>`) — clean, type-safe response envelope.

---

**Q12. What are the access modifiers in Java?**

> *Testing: Encapsulation knowledge.*

`public` — accessible everywhere. `protected` — same class, same package, subclasses (even different package). Package-private (default, no keyword) — same package only. `private` — same class only. In EHR: `Patient.mrn` is `private final` — only `Patient` touches it, exposed via `getMrn()`. `Patient.maskSsn()` is `private` helper. Service classes are `public`. `@Configuration` beans in same package use package-private constructors when possible — reduces coupling. A common senior interview trap: `protected` allows subclass access even in different package, which surprises people.

---

**Q13. Explain `static` keyword in Java.**

> *Testing: Memory model and OOP understanding.*

`static` means the member belongs to the *class*, not to any instance. Static fields: one copy shared across all instances (Metaspace). Static methods: called without instance, can't access `this` or instance fields. Static blocks: run once when class is loaded (class initialization). Static nested class: doesn't hold a reference to outer class (unlike inner class). In EHR: `IcdCodeValidator.REPORTABLE_CODES` is a `static final Set<String>` — loaded once, shared. `DateUtils.formatFhirDate()` is a utility static method. Trap: static fields are shared across threads — `static ArrayList` would be a concurrency bug. Use `static final` for truly shared constants, not mutable state.

---

**Q14. What is `volatile` and when do you use it?**

> *Testing: Java Memory Model, multi-threading.*

`volatile` guarantees visibility — writes to a `volatile` variable are immediately visible to all threads (flush to main memory, not CPU cache). It does NOT provide atomicity — `volatile int count++` is still a race condition (read-modify-write not atomic). Use when: (1) one thread writes, others only read; (2) the flag pattern — `volatile boolean running = true`. In EHR: `volatile boolean pauseSubmissions` in `EcrSurveillanceService` — main thread sets it to pause processing, worker threads read it. Without `volatile`, worker threads might cache the old value in CPU registers and never see the update (happens-before missing).

---

**Q15. What is the difference between `StringBuilder` and `StringBuffer`?**

> *Testing: Threading and performance awareness.*

Both are mutable string builders. `StringBuffer` is thread-safe (synchronized methods) — slower. `StringBuilder` is not thread-safe — faster. In single-threaded code (99% of cases), always use `StringBuilder`. Never use `StringBuffer` unless you truly share it between threads (rare, usually wrong design). In EHR: `StringBuilder` for building FHIR URLs, JSON fragments, report strings in service methods (always single-threaded execution path). `String.join()` and `String.formatted()` (Java 15+) for simple cases.

---

**Q16. What is autoboxing and unboxing? What are the pitfalls?**

> *Testing: Performance awareness.*

Autoboxing: automatic conversion from primitive (`int`) to wrapper (`Integer`). Unboxing: reverse. Java does this transparently. Pitfalls: (1) NullPointerException on unboxing null — `Integer x = null; int y = x;` → NPE. (2) Performance: boxing creates heap objects; tight loops with boxed types waste memory and stress GC. (3) `==` comparison of `Integer` objects: cached for -128 to 127, new object outside that range — `Integer.valueOf(200) == Integer.valueOf(200)` is `false`. In EHR: `Map<String, Integer>` for urgency scores has autoboxing overhead — acceptable. But if processing millions of lab results in a tight loop, use primitive arrays or specialized collections (Trove, Eclipse Collections).

---

**Q17. What is the Java Memory Model (JMM)?**

> *Testing: Deep concurrency understanding.*

JMM defines how threads interact through memory. Each thread has its own CPU cache — writes may not be immediately visible to other threads. The JMM provides *happens-before* guarantees: events that happen before a synchronization point are visible after it. Examples: `synchronized` unlock happens-before next lock; `volatile` write happens-before read; `Thread.start()` happens-before thread's actions; `Thread.join()` means thread's actions happened-before. Without happens-before, the compiler and CPU are free to reorder instructions for optimization. This is why double-checked locking without `volatile` is broken — the write to the reference may be visible before the constructor finishes.

---

**Q18. Explain method overloading vs overriding.**

> *Testing: Polymorphism mechanics.*

Overloading: same method name, different parameter types/count in the same class. Resolved at **compile time** (static dispatch). `PatientService.findPatient(String mrn)` vs `PatientService.findPatient(Long id)`. Overriding: subclass provides different implementation of a parent's method. Resolved at **runtime** (dynamic dispatch). `@Override` annotation enforces this. Rules: same name, same parameter types, return type must be covariant or same, can't narrow access modifier (public → protected is illegal), can't throw new checked exceptions. Key interview trap: `static` methods are not overridden — they're hidden. Calling via parent reference invokes parent's static method regardless of runtime type.

---

**Q19. What happens when you override `equals()`? What must you also override?**

> *Testing: Object contract, HashMap internals.*

`hashCode()` — mandatory. The contract: equal objects MUST have equal hash codes. If you override `equals()` without `hashCode()`, two equal `Patient` objects will go into different HashMap buckets — completely breaking HashMap, HashSet, and any collection relying on hashing. The reverse doesn't need to be true (unequal objects can share hash codes — that's a collision). Also override `toString()` for logging. Use `Objects.equals()` (null-safe) and `Objects.hash()` in implementations. Use business key (MRN) not DB ID — two detached Hibernate entities representing the same patient should be equal.

---

**Q20. What are design patterns? Name the ones you use most.**

> *Testing: Practical design knowledge, not just pattern names.*

Design patterns are reusable solutions to recurring problems. The ones I use daily in EHR: **Singleton** — Spring beans are singletons by default (one `PatientService` per context). **Factory/Factory Method** — `PatientValidator.forCondition(code)` returns the right validator. **Builder** — `Patient.builder().mrn("MRN-001").firstName("John").build()` (Lombok). **Strategy** — different `PaymentProcessor` implementations injected via `Map<String, PaymentProcessor>`. **Observer/Event** — Spring `ApplicationEventPublisher` for patient registration events. **Template Method** — `CaseReporter.submit()` calls abstract `buildPayload()`. **Decorator** — Spring AOP wraps beans (timing, audit, retry). **Proxy** — CGLIB proxies for `@Transactional`, `@Cacheable`. **Chain of Responsibility** — Spring Security filter chain.

---

## SECTION 2 — Collections & Streams (Q21–Q35)

---

**Q21. What is the difference between `HashMap`, `LinkedHashMap`, and `TreeMap`?**

> *Testing: Know when to use which Map.*

`HashMap`: unordered, O(1) get/put. Best for general key-value lookup. `LinkedHashMap`: maintains insertion order (or access order if constructed with `accessOrder=true`). Perfect for LRU cache (access-order + `removeEldestEntry`). O(1) operations. `TreeMap`: sorted by natural key order or Comparator. O(log n) operations. Methods like `floorKey()`, `ceilingKey()`, `subMap()` make range queries elegant. In EHR: `HashMap<String,Patient>` for cache. `LinkedHashMap` for LRU patient session cache. `TreeMap<LocalDateTime,List<Appointment>>` for daily schedule — `subMap(startOfDay, endOfDay)` gives appointments in that range efficiently.

---

**Q22. When would you use `ConcurrentHashMap` over `Collections.synchronizedMap()`?**

> *Testing: Concurrency performance knowledge.*

`Collections.synchronizedMap()` wraps every method with a `synchronized` block on the map object — single lock, only one thread at a time, any operation. `ConcurrentHashMap` uses segment-level locking (Java 7) or CAS operations on individual buckets (Java 8+) — multiple threads can read/write simultaneously to different buckets. Much higher throughput under contention. `ConcurrentHashMap` also provides atomic operations: `putIfAbsent()`, `computeIfAbsent()`, `merge()`. In EHR: `ConcurrentHashMap<String,CircuitBreakerState>` for per-hospital circuit breaker states — multiple threads reading/updating different hospitals simultaneously. `Collections.synchronizedMap()` would bottleneck here.

---

**Q23. Explain the Stream API — intermediate vs terminal operations.**

> *Testing: Functional programming in Java, lazy evaluation.*

Streams are lazy pipelines. Intermediate operations (filter, map, flatMap, sorted, distinct, limit, skip) return a new stream — they're not evaluated until a terminal operation is called. This enables optimization (short-circuit evaluation with `findFirst`). Terminal operations (collect, forEach, count, reduce, findAny, anyMatch, min, max) trigger evaluation and close the stream. In EHR: `patients.stream().filter(p -> p.getAge() > 65).map(PatientMapper::toDto).collect(toList())` — the filter predicate is checked lazily only as terminal operation pulls elements. `parallel()` makes intermediate operations run on ForkJoinPool — useful for CPU-bound operations on large collections, but adds overhead for small collections or IO-bound work.

---

**Q24. What is the difference between `map()` and `flatMap()`?**

> *Testing: Understanding of stream transformations.*

`map()` is a 1-to-1 transformation — each element produces exactly one output element. `flatMap()` is a 1-to-many transformation — each element produces a stream, which are all merged (flattened). Classic example: `patients.stream().map(Patient::getIcdCodes)` gives `Stream<List<String>>`. `patients.stream().flatMap(p -> p.getIcdCodes().stream())` gives `Stream<String>` — all codes from all patients in one stream. In EHR: `labResults.stream().flatMap(r -> r.getRelatedConditions().stream()).distinct().collect(toList())` — all distinct conditions across all lab results.

---

**Q25. Explain `Optional`. When should you NOT use it?**

> *Testing: API design judgment.*

`Optional<T>` is a container that may or may not hold a value — forces callers to handle the empty case explicitly. `Optional.of()` (throws if null), `Optional.ofNullable()` (wraps null as empty), `Optional.empty()`. Operations: `isPresent()`, `get()` (avoid — throws if empty), `orElse()`, `orElseGet()` (lazy — only called if empty), `orElseThrow()`, `map()`, `flatMap()`, `ifPresent()`, `ifPresentOrElse()`. Use for: method return types where absence is meaningful. Don't use as: method parameter (just use null or overload), field type (serialization issues, Hibernate issues), in `List<Optional<T>>` (just filter out nulls). In EHR: `patientRepository.findByMrn(mrn)` returns `Optional<Patient>` → `.orElseThrow(() -> new PatientNotFoundException(mrn))`.

---

**Q26. What is a functional interface? Name the core ones.**

> *Testing: Java 8 features, lambda foundation.*

A functional interface has exactly one abstract method (can have default/static methods). Enables lambda expressions. `@FunctionalInterface` annotation is optional but recommended (compiler enforces single abstract method). Core interfaces: `Predicate<T>` — `test(T)` returns boolean — filter conditions. `Function<T,R>` — `apply(T)` returns R — transformation. `Consumer<T>` — `accept(T)` returns void — side effects. `Supplier<T>` — `get()` returns T — lazy value provider. `BiFunction<T,U,R>`, `UnaryOperator<T>`, `BinaryOperator<T>`. In EHR: `Predicate<Patient>` for patient filter rules, `Function<Patient, PatientResponse>` for mapping, `Supplier<String>` for lazy MRN generation.

---

**Q27. What is a `Comparator.comparing()` chain and how does it work?**

> *Testing: Modern Java idioms.*

`Comparator.comparing(keyExtractor)` creates a comparator using a function to extract the sort key. Chain with `.thenComparing()` for tie-breaking. `.reversed()` reverses order. Null-safety with `Comparator.nullsFirst()` / `nullsLast()`. Example in EHR:

```java
Comparator<Patient> sort = Comparator
    .comparing(Patient::getLastName, String.CASE_INSENSITIVE_ORDER)
    .thenComparing(Patient::getFirstName)
    .thenComparing(Patient::getDateOfBirth, Comparator.reverseOrder());
patients.sort(sort);
```

This is composable, readable, and avoids manual `compareTo` implementations. Works with `Collections.sort()`, `List.sort()`, `TreeMap` constructor, `PriorityQueue` constructor.

---

**Q28. Explain `Collectors.groupingBy()` and `partitioningBy()`.**

> *Testing: Stream aggregation patterns.*

`groupingBy(classifier)` groups elements into a `Map<K, List<V>>` by classifier function. `partitioningBy(predicate)` is a special case — always produces `Map<Boolean, List<V>>`. Downstream collectors: `groupingBy(f, counting())`, `groupingBy(f, averagingInt(...))`, `groupingBy(f, mapping(...))`. In EHR:

```java
Map<String, List<Patient>> byDoctor = patients.stream()
    .collect(groupingBy(p -> p.getPrimaryDoctor().getId()));

Map<Boolean, List<LabResult>> byReportable = results.stream()
    .collect(partitioningBy(r -> ecrService.isReportable(r.getConditionCode())));
// True = auto-submit, False = manual review
```

---

**Q29. What is `reduce()` and when do you use it over `collect()`?**

> *Testing: Stream terminal operations.*

`reduce()` combines elements into a single result using a binary operator. `collect()` uses a mutable container (List, Map, StringBuilder). Use `reduce` for: sum, product, string concatenation, finding max/min (though `min()`/`max()` are cleaner). Use `collect` for: building collections, maps, joining strings. `reduce()` is more naturally parallelizable (associative operations). In EHR: `results.stream().mapToDouble(LabResult::getValue).average()` is simpler than reduce for averages. `reduce(BigDecimal.ZERO, BigDecimal::add)` for summing billing amounts without autoboxing overhead.

---

**Q30. When would you use parallel streams? What are the risks?**

> *Testing: Performance judgment, not "always faster."*

Parallel streams split work across `ForkJoinPool.commonPool()` threads. Beneficial when: large dataset (thousands+ elements), CPU-bound operations (heavy computation per element), no shared mutable state, no ordering requirements. Risky when: small data (thread overhead dominates), IO-bound (threads block waiting for DB/network — starve pool), shared mutable state (race conditions), operations require encounter order (`.forEachOrdered()` negates parallelism). In EHR: parallel stream for processing a batch of 100k lab results for a bulk ECR check — CPU-bound classification. But `patients.parallelStream().forEach(repo::save)` — dangerous: shared DB connection pool, ordering issues, potential Hibernate session conflicts.

---

**Q31. What is `CopyOnWriteArrayList` and when do you use it?**

> *Testing: Concurrent collection knowledge.*

`CopyOnWriteArrayList` creates a fresh copy of the underlying array on every write. Reads are lock-free (read the current snapshot). Writes are expensive (copy entire array). Best for: read-heavy scenarios where writes are rare and list is small. In EHR: `CopyOnWriteArrayList<EcrSubmissionListener>` for event listeners — listeners are registered once at startup, then only read during event processing. Would be bad for: `CopyOnWriteArrayList` holding 50,000 patient records with frequent updates — each update copies 50,000 elements.

---

**Q32. What is `BlockingQueue`? How does it support producer-consumer?**

> *Testing: Concurrency patterns.*

`BlockingQueue` blocks producer when full (`put()` blocks until space) and blocks consumer when empty (`take()` blocks until element available). This is natural backpressure. Implementations: `LinkedBlockingQueue` (unbounded or bounded), `ArrayBlockingQueue` (bounded, fair option), `PriorityBlockingQueue` (priority ordering), `DelayQueue` (elements available after delay). In EHR: `LinkedBlockingQueue<EcrSubmission> queue` between ingestion thread (puts submissions) and submission thread pool (takes submissions). When ECR-NOW is slow, queue fills up → ingestion blocks → natural backpressure to lab systems. Bounded queue prevents OOM from unbounded accumulation.

---

**Q33. Explain `PriorityQueue` and how to use it for triage.**

> *Testing: Heap data structure application.*

`PriorityQueue` is a min-heap — `poll()` always returns the smallest element per the Comparator. For max-heap (highest priority first), reverse the comparator. Operations: `offer()`/`add()` O(log n), `poll()` O(log n), `peek()` O(1), `contains()` O(n). Not ordered on iteration — only guaranteed that `poll()` gives min/max. In EHR triage: `PriorityQueue<Patient> triageQueue = new PriorityQueue<>(Comparator.comparingInt(Patient::getUrgencyScore).reversed())` — `poll()` always returns the most urgent patient. For K most critical patients: poll K times. For streaming updates (patient condition worsens), remove old entry (O(n)) and re-add — or use `TreeSet` which supports O(log n) removal.

---

**Q34. What is the difference between `Iterator` and `ListIterator`?**

> *Testing: Collection traversal mechanics.*

`Iterator` is the base — `hasNext()`, `next()`, `remove()`. Forward only. Works on any `Collection`. `ListIterator` extends `Iterator` — adds `hasPrevious()`, `previous()`, `add()`, `set()`, bidirectional. Works only on `List`. In EHR: `Iterator` for safely removing patients matching a condition while iterating (concurrent modification without `ConcurrentModificationException`). Don't use `for-each` loop and `list.remove()` simultaneously — throws `ConcurrentModificationException`. Use `iterator.remove()` or `removeIf()` (Java 8, cleaner).

---

**Q35. Explain `WeakHashMap` and when would you use it.**

> *Testing: Garbage collection interaction knowledge.*

`WeakHashMap` holds weak references to its keys. When no other strong reference to a key exists, it becomes eligible for GC — the entry is automatically removed from the map. Useful for: associating metadata with objects without preventing their collection (canonicalization, metadata caches). In EHR: `WeakHashMap<Patient, PatientMetadata>` where `PatientMetadata` is computed on demand — if the `Patient` object is no longer referenced anywhere else, the metadata is automatically cleaned up. Don't use when: you need the map to keep values alive (use `HashMap`), or for general-purpose caching (use Caffeine with size-based eviction instead — more predictable).

---

## SECTION 3 — Concurrency (Q36–Q48)

---

**Q36. Explain the Thread lifecycle.**

> *Testing: Concurrency fundamentals.*

`NEW` → created but `start()` not called. `RUNNABLE` → either running on CPU or ready to run (JVM calls it runnable even when waiting for CPU scheduling). `BLOCKED` → waiting to acquire a monitor lock (entering `synchronized` block). `WAITING` → indefinitely waiting (`Object.wait()`, `Thread.join()` with no timeout, `LockSupport.park()`). `TIMED_WAITING` → waiting with timeout (`Thread.sleep()`, `Object.wait(long)`, `Thread.join(long)`). `TERMINATED` → finished. BLOCKED and WAITING are both "not running" but BLOCKED specifically means waiting for a lock — visible in thread dumps when diagnosing lock contention.

---

**Q37. What is `ExecutorService`? Why use it instead of raw threads?**

> *Testing: Thread pool management.*

Raw `new Thread()` for every task is expensive — thread creation (JVM allocates ~512KB stack per thread) and destruction overhead. `ExecutorService` manages a pool of reusable threads. `ThreadPoolExecutor` configuration: corePoolSize (always-alive threads), maxPoolSize (burst capacity), keepAliveTime (idle threads above core are terminated), work queue (bounded: backpressure; unbounded: OOM risk). Factory methods: `Executors.newFixedThreadPool(n)`, `newCachedThreadPool()` (max=`Integer.MAX_VALUE` — dangerous). In EHR: dedicated `ExecutorService` for ECR submissions — core 5, max 20, `ArrayBlockingQueue(100)` with `CallerRunsPolicy` (caller thread runs task when queue full → natural backpressure to submitter).

---

**Q38. What is the difference between `synchronized` and `ReentrantLock`?**

> *Testing: Advanced locking.*

`synchronized` is implicit — simpler, JVM-managed, always released on block exit (even on exception). `ReentrantLock` is explicit — must call `unlock()` in `finally`. But `ReentrantLock` adds: `tryLock(timeout)` — non-blocking attempt (avoid deadlock timeout), `lockInterruptibly()` — can be interrupted while waiting, fairness option (threads served in order), `Condition` objects (more flexible than `wait()/notify()`), `ReadWriteLock` variant. In EHR: `ReentrantReadWriteLock` for `PatientRecordService` — many concurrent reads allowed simultaneously, writes exclusive. `tryLock(5, SECONDS)` when two services compete for same patient update — fail gracefully instead of blocking indefinitely.

---

**Q39. What is a deadlock? How do you prevent it?**

> *Testing: Classic concurrency problem.*

Deadlock: Thread A holds lock 1, waits for lock 2. Thread B holds lock 2, waits for lock 1. Both wait forever. Four Coffman conditions (all must be true): mutual exclusion, hold and wait, no preemption, circular wait. Prevention: **Canonical ordering** — always acquire locks in the same order (by ID, by name). `Math.min(id1, id2)` always locked first. **Lock timeout** — `tryLock(5, SECONDS)` — if can't acquire, release what you hold and retry. **Single lock** — coarse-grained but avoids ordering issues. **Lock-free** — use `AtomicReference`, `ConcurrentHashMap`. Detection: thread dump shows `DEADLOCK DETECTED` section — which threads hold what.

---

**Q40. Explain `CompletableFuture`. How is it different from `Future`?**

> *Testing: Async programming model.*

`Future` is limited — `get()` blocks, no callbacks, can't chain operations, can't combine multiple futures. `CompletableFuture` is fully composable: `supplyAsync()` runs async, `thenApply()` transforms result, `thenAccept()` consumes result, `exceptionally()` handles errors, `allOf()` waits for all, `anyOf()` takes fastest, `thenCompose()` chains dependent async operations. In EHR: enriching a lab result asynchronously — `CompletableFuture.supplyAsync(() -> labRepo.find(id)).thenApply(this::enrichWithPatientData).thenApply(this::buildFhirBundle).exceptionally(e -> FhirBundle.error(e.getMessage()))`. `allOf(fetchPatient, fetchProvider, fetchLab).thenRun(this::buildBundle)` — parallel fetches, combine when all done.

---

**Q41. What is `volatile` and what doesn't it solve?**

> *Testing: JMM subtlety.*

`volatile` guarantees visibility (all writes immediately visible to all threads via main memory, not CPU cache) and prevents reordering around the volatile access. What it doesn't solve: atomicity of compound operations. `volatile long counter; counter++` is still a race — read, increment, write are three operations. Use `AtomicLong` for that. `volatile` is sufficient for: single-writer flag (`volatile boolean paused`), double-checked locking (`volatile Singleton instance`), status fields read by many threads.

---

**Q42. What is `ThreadLocal`? What is the risk?**

> *Testing: Per-thread state management, memory leak awareness.*

`ThreadLocal` provides a per-thread variable — each thread has its own copy, completely independent. `ThreadLocal.withInitial(() -> new ArrayList<>())` — no sharing, no sync needed. In EHR: `ThreadLocal<String>` for current user context in `SecurityContextHolder` (Spring does this internally). `MDC` (Mapped Diagnostic Context) uses `ThreadLocal` to attach request ID to log messages. **Critical risk:** Thread pools reuse threads. If `ThreadLocal` isn't cleared after use, the next request on that thread sees the previous request's data. Always `remove()` in a `finally` block or use `try-with-resources` wrapper. Memory leak: if the thread is long-lived (pool threads are), ThreadLocal value is never GC'd unless explicitly removed.

---

**Q43. Explain `CountDownLatch`, `CyclicBarrier`, and `Semaphore`.**

> *Testing: Synchronization utilities knowledge.*

`CountDownLatch(n)` — one-time gate. N threads call `countDown()`. Other thread(s) call `await()` and block until count reaches zero. Not reusable. In EHR: wait for N hospitals to finish sending data before batch ECR processing. `CyclicBarrier(n)` — reusable rendezvous point. N threads all call `await()` — all block until all N have arrived, then all proceed simultaneously. Resets automatically. In EHR: parallel ECR validation in phases — all threads must complete phase 1 before any starts phase 2. `Semaphore(n)` — controls concurrency level. `acquire()` decrements count (blocks if 0). `release()` increments. In EHR: `Semaphore(5)` for ECR-NOW API calls — maximum 5 concurrent requests to avoid overwhelming their server.

---

**Q44. What is the Fork/Join framework?**

> *Testing: Parallel computation patterns.*

Fork/Join (Java 7) is designed for divide-and-conquer parallelism — recursively split a task, process in parallel, merge results. Uses work-stealing: idle threads steal tasks from busy threads' queues (high CPU utilization). `ForkJoinPool.commonPool()` is the default pool used by parallel streams. `RecursiveTask<V>` for tasks that return results. `RecursiveAction` for void tasks. In EHR: bulk FHIR bundle generation — split 100k lab results into chunks, generate bundles in parallel using ForkJoinPool, merge. In practice, parallel streams use this under the hood and are easier to write.

---

**Q45. What is a race condition? Give an EHR example.**

> *Testing: Concurrency bug pattern recognition.*

Race condition: correctness depends on the timing/interleaving of threads. Two threads read-then-write the same value, each overwriting the other's update. In EHR: Two doctors simultaneously update the same patient record. Doctor A reads version=5, Doctor B reads version=5. Doctor A updates, saves version=6. Doctor B updates from the stale version=5 data, saves version=6 — overwrites Doctor A's change silently. Prevention: Optimistic locking (`@Version`) — Doctor B's save throws `OptimisticLockException` (DB version=6 ≠ expected 5) → retry with fresh data. Pessimistic locking (`SELECT FOR UPDATE`) — Doctor B blocks until Doctor A commits. For counters: `AtomicInteger` instead of plain `int`. For complex state: `synchronized` or `ReentrantLock`.

---

**Q46. What is the difference between `notify()` and `notifyAll()`?**

> *Testing: Monitor semantics.*

`wait()`, `notify()`, `notifyAll()` must be called inside `synchronized` block. `notify()` wakes one arbitrary waiting thread (JVM chooses — unpredictable). `notifyAll()` wakes ALL waiting threads — they all compete for the lock, one wins, others go back to waiting. Use `notifyAll()` by default — safer. `notify()` risks "lost wake-up": if the wrong thread is woken and it can't proceed, the thread that should have been woken stays asleep. In modern code, prefer `ReentrantLock` + `Condition.signal()/signalAll()` or `BlockingQueue` — cleaner and less error-prone.

---

**Q47. How does `AtomicInteger` work internally?**

> *Testing: Lock-free programming knowledge.*

`AtomicInteger` uses CAS (Compare-And-Swap) — a single CPU instruction that atomically reads a value, compares to expected, and writes new value only if equal. If another thread changed the value between read and CAS, it fails and retries (spin loop). No blocking — "optimistic locking at hardware level." Much faster than `synchronized` under moderate contention. In EHR: `AtomicInteger patientCount = new AtomicInteger(0); patientCount.incrementAndGet()` — thread-safe counter without any lock. `compareAndSet(expected, update)` for state machines — transition circuit breaker from CLOSED to OPEN only if still CLOSED.

---

**Q48. What is the Java `ExecutorCompletionService`?**

> *Testing: Async result handling.*

`ExecutorCompletionService` wraps an `ExecutorService` and provides a `take()` method that returns completed futures in completion order (not submission order). When you submit 10 ECR submissions, you don't want to wait for the first one if it's slow — you want to process whichever finishes first. `ExecutorCompletionService.submit(task)` submits; `take()` blocks until any task completes; `poll()` non-blocking check. Alternative: `CompletableFuture.anyOf()` for the first-completes pattern. `allOf()` for all-must-complete. In practice, `CompletableFuture` has replaced `ExecutorCompletionService` for most use cases.

---

## SECTION 4 — Spring Framework (Q49–Q65)

---

**Q49. What is Dependency Injection and why use it?**

> *Testing: Core Spring concept, testability understanding.*

DI means objects don't create their dependencies — they declare them and the container injects them. `PatientService` declares `PatientRepository` as a constructor parameter; Spring creates the repository and passes it in. Benefits: (1) Testability — in tests, inject mocks instead of real implementations. (2) Decoupling — service doesn't know which implementation it gets (can swap prod impl for test impl). (3) Single responsibility — service only does service logic, not object creation. Constructor injection is preferred over field injection: dependencies are explicit, the class is usable without Spring (testable with `new`), and all required deps are final and set at construction.

---

**Q50. What is AOP and how does Spring implement it?**

> *Testing: Cross-cutting concern knowledge.*

AOP (Aspect-Oriented Programming) separates cross-cutting concerns (logging, security, transactions, caching) from business logic. Core vocabulary: **Aspect** — the cross-cutting concern module. **Advice** — what to do (Before, After, Around, AfterReturning, AfterThrowing). **Pointcut** — where to apply it (expression matching method signatures). **Join Point** — execution point where advice applies (method invocation). **Weaving** — linking aspects to target code. Spring AOP uses **proxies** — for interface-based beans, JDK dynamic proxy; for class-based, CGLIB subclass proxy. The proxy intercepts method calls and runs advice. In EHR: `@Around` for timing ECR submissions, `@Before` for HIPAA audit logging patient access, `@Transactional` is implemented as AOP. Critical limitation: self-invocation (calling `this.method()`) bypasses the proxy — the call goes directly to the object, not through Spring's proxy.

---

**Q51. What is the difference between `@Component`, `@Service`, `@Repository`, `@Controller`?**

> *Testing: Spring stereotype annotations.*

All are specializations of `@Component` — all trigger Spring bean creation via component scanning. The difference is semantic + additional behavior: `@Repository` adds automatic exception translation — `SQLException` from Hibernate becomes a Spring `DataAccessException`. `@Service` is purely semantic (marks business logic layer — no extra behavior). `@Controller` (with `@RequestMapping`) enables Spring MVC to map HTTP requests. `@RestController` = `@Controller` + `@ResponseBody` on all methods. Use the right one — it communicates intent and enables layer-specific features.

---

**Q52. Explain `@Transactional`. What are the common pitfalls?**

> *Testing: Transaction management depth.*

`@Transactional` wraps the method in a transaction — commit on success, rollback on `RuntimeException` (not checked exception by default). Key attributes: `propagation` (REQUIRED: join existing or create new; REQUIRES_NEW: always new; MANDATORY: must exist), `isolation` (READ_COMMITTED default — prevents dirty reads), `readOnly=true` (optimization hint — Hibernate skips dirty check, DB can optimize), `rollbackFor` (include checked exceptions), `timeout`. Pitfalls: (1) **Self-invocation** — `this.transactionalMethod()` bypasses proxy, no transaction. Fix: inject self or restructure. (2) **Transaction boundary too large** — `@Transactional` on controller holds transaction across view rendering → lock held too long. Keep on service method. (3) **Swallowing exceptions** — catch exception, log, return default → transaction commits despite error. (4) **Lazy loading outside transaction** — `LazyInitializationException` when accessing lazy collection after method returns.

---

**Q53. What is Spring Boot auto-configuration? How does it work?**

> *Testing: Spring Boot internals.*

Auto-configuration scans classpath for specific classes and activates configuration based on what's present. Mechanism: `spring.factories` (Spring Boot 2) or `AutoConfiguration.imports` (Spring Boot 3) lists all `@AutoConfiguration` classes. Each uses `@ConditionalOnClass` (only if X is on classpath), `@ConditionalOnMissingBean` (only if you haven't provided your own), `@ConditionalOnProperty`. Example: if `spring-boot-starter-data-jpa` is on classpath → `DataSourceAutoConfiguration` runs → creates `DataSource` bean → `HibernateJpaAutoConfiguration` runs → creates `EntityManagerFactory`. Override any auto-configured bean by declaring your own (`@Bean` in `@Configuration` → `@ConditionalOnMissingBean` skips auto-config). In EHR: we provide custom `ObjectMapper` bean → auto-config skips default Jackson configuration.

---

**Q54. What is the difference between `@Bean` and `@Component`?**

> *Testing: Bean definition mechanisms.*

`@Component` (and specializations) on a class — Spring detects it via component scanning and creates the bean. The class itself is the bean. `@Bean` is a method in a `@Configuration` class — the method returns the bean instance. More flexible: you can configure third-party classes (can't annotate them), choose implementation at runtime (`@Profile`), pass parameters to constructors. When to use `@Component`: your own class with default construction. When to use `@Bean`: third-party class (ObjectMapper, RestTemplate), needs complex construction logic, multiple instances of same type with different config.

---

**Q55. Explain Spring Security's filter chain.**

> *Testing: Security architecture.*

Spring Security works as a chain of servlet filters. Each request passes through every filter in order. Key filters in EHR: `CorsFilter` (handles preflight, sets CORS headers), `JwtAuthenticationFilter` (extracts Bearer token, validates, sets `SecurityContext`), `ExceptionTranslationFilter` (converts Spring Security exceptions to HTTP responses — 401/403). The `SecurityFilterChain` bean configures which filters run and in what order, plus authorization rules (`.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")`). `SecurityContextHolder` stores the `Authentication` per-thread via `ThreadLocal`. `UserDetailsService.loadUserByUsername()` loads user roles from DB during JWT validation.

---

**Q56. What is the difference between `Filter` and `Interceptor` in Spring?**

> *Testing: Request processing pipeline.*

`Filter` (Servlet API) runs in the servlet container — before `DispatcherServlet`. Sees raw `HttpServletRequest`. Use for: CORS, JWT auth, logging raw requests, compression. Applied to all URLs including static resources. `HandlerInterceptor` (Spring MVC) runs after `DispatcherServlet` routes to a controller — has access to the `HandlerMethod` (knows which controller/method will handle request). `preHandle()` (before controller), `postHandle()` (after controller, before view), `afterCompletion()` (after everything, always). Use for: logging controller execution time, tenant resolution, audit logging specific to controller layer. In EHR: `JwtAuthFilter` is a `Filter` (runs early, before routing), `AuditInterceptor` is a `HandlerInterceptor` (knows patient endpoint was accessed).

---

**Q57. What is `@ConfigurationProperties` and why prefer it over `@Value`?**

> *Testing: Externalized configuration best practices.*

`@Value("${ecr.api.timeout}")` injects a single property. `@ConfigurationProperties(prefix = "ecr")` binds all `ecr.*` properties to a typed POJO with nested structure, validation (`@Validated`), IDE autocomplete (with annotation processor), and relaxed binding (camel-case, kebab-case, env vars all work). In EHR: `EhrProperties` with nested `Security` and `Ecr` inner classes — `ecr.api.baseUrl`, `ecr.retry.maxAttempts` all bind automatically. Much cleaner than scattered `@Value` annotations throughout the codebase. `@Value` is fine for a single simple property injection; use `@ConfigurationProperties` for groups of related settings.

---

**Q58. How does Spring handle circular dependencies?**

> *Testing: Spring internals, DI patterns.*

With constructor injection, Spring detects circular dependency at startup and throws `BeanCurrentlyInCreationException` — correct behavior, the design is circular. With field/setter injection, Spring resolves it by creating bean A as a raw object first, injecting B (which gets a reference to A's incomplete object), then completing A's construction. This can cause subtle issues if B calls A in its constructor. Best fix: redesign to remove the cycle (usually means extracting a third service). If unavoidable: `@Lazy` on one injection point — the dependency is created on first use, not at startup, breaking the construction cycle. In EHR: `LabResultService` → `EcrService` → `LabResultService` (for status updates) — fix: `@Lazy @Autowired private LabResultService self` in EcrService, or extract a shared `EcrStatusService`.

---

**Q59. What is Spring Actuator? What endpoints are important?**

> *Testing: Production readiness knowledge.*

Spring Actuator exposes management endpoints for monitoring and operations. Key endpoints: `/actuator/health` (liveness, readiness, dependent service status), `/actuator/metrics` (Micrometer metrics), `/actuator/prometheus` (Prometheus scrape format), `/actuator/info` (build info, git commit), `/actuator/loggers` (change log level at runtime without restart), `/actuator/threaddump` (thread dump), `/actuator/heapdump` (heap dump), `/actuator/env` (current configuration), `/actuator/circuitbreakers` (Resilience4j state). In EHR: K8s liveness probe hits `/actuator/health/liveness`, readiness probe hits `/actuator/health/readiness`. Secure most endpoints behind `hasRole('ACTUATOR')` — `/actuator/env` exposes secrets if not protected.

---

**Q60. Explain Spring `@Async`. What thread runs the method?**

> *Testing: Async execution model.*

`@Async` on a method means Spring runs it in a separate thread from the caller's. The caller gets back immediately (or a `CompletableFuture`/`Future` if the method returns one). Requires `@EnableAsync` on config and a configured `TaskExecutor` bean — without custom config, Spring uses `SimpleAsyncTaskExecutor` (creates a new thread per invocation — use a proper pool in production). In EHR: `@Async` on `notificationService.sendAppointmentReminder()` — the controller returns 202 Accepted immediately, email sends in background. Critical: `@Async` on the same class's method called via `this.method()` is bypassed (proxy issue again). The method must be called from a different bean.

---

**Q61. What are Spring bean scopes?**

> *Testing: Spring container lifecycle.*

`singleton` (default): one instance per `ApplicationContext` — shared across all requests. Most Spring beans. `prototype`: new instance every time requested from context — for stateful beans. `request`: one per HTTP request (web apps). `session`: one per HTTP session. `application`: one per `ServletContext`. In EHR: `PatientService` is singleton (stateless, thread-safe). `FhirBundleBuilder` is prototype (builds stateful bundle, mustn't be shared). Problem: injecting a prototype into a singleton — the singleton holds a fixed reference, always same instance. Fix: `ObjectProvider<FhirBundleBuilder>` or `@Lookup` method injection.

---

**Q62. What is Spring Cloud Gateway vs Zuul?**

> *Testing: Microservices infrastructure.*

Both are API gateways — single entry point for all microservices. Zuul 1 (Netflix): blocking, thread-per-connection, servlet-based — simpler but limited under high load. Spring Cloud Gateway: non-blocking, reactive (Project Reactor/Netty), designed for high throughput. Features: route predicates, filters (pre/post), rate limiting (Redis), circuit breaker integration, custom global filters (JWT validation). In EHR: `JwtGatewayFilter` validates token once at gateway → downstream services trust `X-User-Id` header. `RequestRateLimiter` filter limits hospitals to 100 req/sec per API key. `CircuitBreaker` filter protects downstream services.

---

**Q63. What is `@Profile` and when do you use it?**

> *Testing: Environment-specific configuration.*

`@Profile("prod")` on a bean or configuration class — only loaded when the `prod` profile is active. `@Profile("!prod")` — loaded when NOT prod. `@Profile({"dev", "local"})` — loaded in dev or local. Set active profile: `spring.profiles.active=prod` in config or `SPRING_PROFILES_ACTIVE=prod` env var. In EHR: `@Bean @Profile("prod") RestTemplate withSSL()` vs `@Bean @Profile("dev") RestTemplate insecure()`. `@Profile("test")` on test data seeder — only loads test fixtures in test profile. Combine with `@ConfigurationProperties` for profile-specific YAML sections (`---` separator in `application.yml`).

---

**Q64. What is Spring Data JPA vs plain Hibernate?**

> *Testing: Abstraction layers understanding.*

Plain Hibernate: JPA implementation. Work directly with `EntityManager`, `Session`, `Criteria`, HQL. Full control. Spring Data JPA: abstraction on top of Hibernate. `JpaRepository` provides CRUD for free. Derived queries from method names (`findByLastNameAndStatus`). `@Query` for custom JPQL. `Specification` for dynamic queries. `Page<T>`, `Slice<T>` for pagination. `Auditing` (`@CreatedDate`, `@LastModifiedDate`). Spring Data handles `EntityManager` lifecycle, transaction binding, exception translation. Use Spring Data JPA for standard CRUD services. Use Hibernate directly when you need fine-grained Hibernate-specific features (batch operations, flush modes, `@Filter`, `@SQLInsert`).

---

**Q65. What is the N+1 problem and how do you solve it?**

> *Testing: The most common JPA interview question.*

N+1: executing 1 query to load N entities, then N more queries to load each entity's lazy association. Load 100 patients (1 query), access `patient.getAppointments()` for each (100 queries) = 101 total. Solutions: (1) `JOIN FETCH` in JPQL — `SELECT p FROM Patient p JOIN FETCH p.appointments WHERE p.status = 'ACTIVE'` — single query with JOIN. (2) `@EntityGraph` on repository method — `@EntityGraph(attributePaths = {"appointments", "appointments.doctor"})`. (3) `@BatchSize(size=25)` on the collection — Hibernate batches the N selects into `IN (id1, id2, ... id25)` — N/25 queries. Detection: `spring.jpa.show-sql=true`, Hibernate stats (`generate_statistics=true`), `p6spy` query logging.

---

## SECTION 5 — Microservices (Q66–Q80)

---

**Q66. What is the Circuit Breaker pattern? Explain the states.**

> *Testing: Resilience pattern knowledge.*

Circuit breaker prevents cascade failure — if ECR-NOW is slow/down, don't let it exhaust all threads and bring down EHR. Three states: **CLOSED** — normal operation, calls pass through, failure rate tracked. When failure rate exceeds threshold (e.g., 60% in last 10 calls) → **OPEN**. **OPEN** — fast fail, don't call ECR-NOW at all, return immediately from fallback. After `waitDuration` (e.g., 30s) → **HALF-OPEN**. **HALF-OPEN** — allow N test calls. If they succeed → back to CLOSED. If they fail → back to OPEN. Implementation: Resilience4j `@CircuitBreaker`. Configured in `application.yml` with `slidingWindowSize`, `failureRateThreshold`, `waitDurationInOpenState`, `permittedNumberOfCallsInHalfOpenState`.

---

**Q67. How does Kafka guarantee message ordering?**

> *Testing: Kafka internals.*

Kafka guarantees ordering within a partition, not across partitions. Messages with the same key always go to the same partition (key hashing). So: partition by patient MRN → all events for patient MRN-001 go to partition 3 → consumer of partition 3 sees them in order. Across different patients (different keys) → may be on different partitions → no ordering guarantee. If you need total ordering across all patients: use 1 partition (kills parallelism). For EHR: per-patient ordering is sufficient. Consumer group: one consumer per partition. If you have 3 consumers and 6 partitions, each consumer handles 2 partitions — all in order within each partition.

---

**Q68. What is the Saga pattern? Choreography vs Orchestration.**

> *Testing: Distributed transaction knowledge.*

Saga: sequence of local transactions, each publishing an event that triggers the next. For rollback: compensating transactions (undo). Two flavors: **Choreography** — no central coordinator; each service listens for events and reacts. EHR: `PatientRegistered` event → Billing Service creates account → `BillingAccountCreated` event → Insurance Service verifies → if failure → Insurance publishes `InsuranceVerificationFailed` → Billing publishes `BillingAccountRemoved` (compensating). Loose coupling, but hard to track overall flow. **Orchestration** — a central saga orchestrator (state machine) sends commands and listens for replies. Easier to trace but creates coupling to orchestrator. In EHR: Orchestration for ECR submission (multi-step: validate → build FHIR → submit → notify) where clear state machine and audit trail matters.

---

**Q69. What is Service Discovery? Explain Eureka.**

> *Testing: Microservices infrastructure.*

In microservices, service instances start/stop dynamically — you can't hardcode IPs. Service Discovery: services register themselves on startup, query registry to find others. **Eureka** (Netflix): server holds registry. Clients (`@EnableDiscoveryClient`) register with `hostname:port` and heartbeat every 30s. Eureka marks unavailable after missed heartbeats. Client-side load balancing (Spring Cloud LoadBalancer) queries Eureka for all instances of `ehr-service` and round-robins. In EHR: ECR Service queries Eureka for EHR Service instances. API Gateway queries for all backend services. Self-preservation mode: if Eureka loses >15% of heartbeats, it stops evicting registrations (assumes network partition, not mass service death).

---

**Q70. What is CQRS? Why use it in EHR?**

> *Testing: Architecture pattern.*

CQRS: Command Query Responsibility Segregation — separate write model from read model. Write side: commands (register patient, update record) → PostgreSQL (normalized, strongly consistent, transactional). Read side: queries (patient dashboard, search, reports) → separate read store (Elasticsearch, Redis, denormalized PostgreSQL view) optimized for reads. Why: write model is normalized (good for integrity), but joining 10 tables for a dashboard is slow. Read model is pre-materialized, no joins, fast. Trade-off: eventual consistency between write and read models. In EHR: patient registration → PostgreSQL (write). Elasticsearch sync via CDC (Debezium + Kafka) → patient search uses Elasticsearch. Dashboard uses pre-computed Redis views updated by domain events.

---

**Q71. What is Feign? How does it work?**

> *Testing: Service-to-service communication.*

Feign is a declarative HTTP client — you define an interface with Spring MVC annotations and Feign generates the implementation. `@FeignClient(name = "ecr-now-service")` + `@PostMapping("/api/fhir/bundle") EcrResponse submit(FhirBundle bundle)` — that's it. No `RestTemplate`, no URL construction, no response parsing. Feign integrates with Eureka (resolves `ecr-now-service` to real URL), Resilience4j (circuit breaker on the client), and Micrometer (metrics per client). `FallbackFactory` provides fallback when the service is unavailable. Under the hood: Feign uses reflection to generate a proxy, interprets annotations to build `Request`, uses a `Client` (OkHttp/HttpClient) to execute.

---

**Q72. What is the difference between REST and gRPC?**

> *Testing: API style trade-offs.*

REST: HTTP/1.1 (or 2), JSON payload, human-readable, browser-compatible, stateless. Standard CRUD verbs. Universal client support. gRPC: HTTP/2, Protocol Buffers (binary — smaller, faster), auto-generated clients in any language, bi-directional streaming, strong typing via `.proto` contracts. Faster and more efficient but not browser-native (needs proxy). Use gRPC for: internal microservice communication with high throughput (EHR → Lab results ingest at 50k/hour), streaming (real-time patient vitals), polyglot environments (Java service calling Python ML service). Use REST for: public APIs, mobile apps, partner integrations (ECR-NOW API — they can use any language), when human readability matters.

---

**Q73. How does Redis handle distributed locking?**

> *Testing: Redis beyond caching.*

Redis SETNX (SET if Not eXists) with TTL is the basis. `SET lockKey uniqueValue NX PX 30000` — atomic: sets the key to a unique value only if it doesn't exist, with 30-second expiry. If set succeeds: lock acquired. If not: lock held by another instance. TTL prevents orphaned locks if holder crashes. Release: check value matches our unique value (Lua script for atomicity), then delete — prevents accidentally releasing another instance's lock. In EHR: distributed lock when scheduling ECR submission to prevent two instances submitting the same report simultaneously. `Redisson` library provides `RLock` — handles all this cleanly, including watchdog (auto-extends TTL if operation takes longer than expected).

---

**Q74. Explain Kafka's consumer group and partition rebalancing.**

> *Testing: Kafka operations knowledge.*

Consumer group: N consumers sharing the work of consuming a topic. Each partition assigned to exactly one consumer. If `lab-results` topic has 6 partitions and group has 3 consumers: each consumer handles 2 partitions. If a consumer crashes → Kafka detects missed heartbeat → **rebalancing** — partitions redistributed among remaining consumers. During rebalancing: all consumers pause consumption (stop-the-world). This causes processing lag. Minimize rebalancing impact: `session.timeout.ms` (how long before consumer considered dead), `heartbeat.interval.ms` (how often consumer sends heartbeat), `max.poll.interval.ms` (max time between `poll()` calls — if exceeded, consumer is kicked out — set higher for slow batch processing). Sticky assignor: tries to keep partition assignments stable during rebalances.

---

**Q75. What is idempotency and why is it critical in microservices?**

> *Testing: Distributed systems reliability.*

Idempotency: calling the same operation multiple times has the same effect as calling it once. Critical because: networks are unreliable. A request may succeed on the server but the response gets lost — client retries → duplicate operation. In EHR: ECR submission. If we retry a timed-out submission, we might send the same report to CDC twice. Solution: idempotency key (unique per submission, e.g., `SHA256(mrn+condition+epiWeek)`). Server checks: "have I processed this key?" If yes, return same response. If no, process and store key. HTTP `PUT` is inherently idempotent (set resource to this state). `POST` is not. `DELETE` should be (deleting already-deleted resource = not found = still deleted). Store idempotency keys in Redis (fast check) + PostgreSQL (persistent, survives Redis restart).

---

**Q76. What is Resilience4j's bulkhead and rate limiter?**

> *Testing: Beyond circuit breaker.*

**Bulkhead** — limits concurrent calls to a service. Thread pool bulkhead: dedicated threads for each external dependency (ECR-NOW gets 10 threads, Lab API gets 5). Semaphore bulkhead: limits concurrent calls without separate thread pool. Prevents one slow dependency from consuming all threads. **Rate Limiter** — limits call rate over a time window (100 calls per minute to CDC API). Different from circuit breaker (which reacts to failures) — rate limiter is proactive throttling. In EHR: `@RateLimiter(name="ecr-now")` with `limitForPeriod: 100`, `limitRefreshPeriod: 1m`. Combine with `@CircuitBreaker` + `@Retry` + `@TimeLimiter` stacked in that order (rate limiter → bulkhead → circuit breaker → retry → timeout).

---

**Q77. How do you handle distributed tracing in microservices?**

> *Testing: Observability knowledge.*

When a request spans EHR → ECR → FHIR Service, you need to trace it across services. **Distributed tracing**: Micrometer Tracing (formerly Spring Cloud Sleuth) adds `traceId` (unique per request) and `spanId` (unique per service hop) to all logs and HTTP headers automatically. Pass `X-B3-TraceId` header between services. Send trace data to **Zipkin** or **Jaeger** for visualization — see the full call chain, latency per service, where failures occurred. In EHR: every ECR submission gets a `traceId`. If submission fails, grep logs across all services for that `traceId` — instant root cause visibility. MDC integration: traceId automatically in every log line → correlate across services in Kibana/ELK.

---

**Q78. What is a Dead Letter Topic/Queue (DLT/DLQ)?**

> *Testing: Error handling in async systems.*

When a Kafka consumer fails to process a message after N retries, where does it go? Without DLT: lose it or block processing forever. DLT: failed messages land in a separate topic (`lab-results.DLT`). Benefits: no data loss, main topic continues processing, failed messages can be inspected and replayed once the bug is fixed. Spring Kafka: `@RetryableTopic(attempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2))` automatically creates retry topics and DLT. In EHR: `lab-results-dlt` consumer logs to Elasticsearch, sends alert to ops team, available for manual replay after fix.

---

**Q79. Explain the API Gateway pattern.**

> *Testing: Microservices infrastructure.*

API Gateway is the single entry point for all clients. Responsibilities: authentication (JWT validation — once here, not in every service), rate limiting (per hospital API key), load balancing (round-robin across service instances), routing (path-based: `/api/v1/patients/**` → ehr-service, `/api/v1/ecr/**` → ecr-service), SSL termination (HTTPS to gateway, HTTP internally), request transformation (strip prefix, add headers like `X-User-Id`), circuit breaking (fail fast if downstream is down), logging/tracing (single point for access logs). Spring Cloud Gateway in EHR: JWT verified, `X-User-Id` header added, requests routed to appropriate service over internal network. Clients never directly access microservices.

---

**Q80. How do you version microservice APIs?**

> *Testing: API evolution strategy.*

Options: URI versioning (`/api/v1/`, `/api/v2/`), Header versioning (`Accept: application/vnd.ehr.v2+json`), Query param (`?version=2`). URI versioning is most common — explicit, easy to test, visible in logs. Strategy: add `v2` endpoint alongside `v1`, deprecate `v1` with warning header, remove after migration period. For non-breaking changes (adding optional fields, adding endpoints): no version bump needed. For breaking changes (removing fields, changing types): new version. In EHR: `/api/v1/patients` and `/api/v2/patients` co-exist during migration. API Gateway routes both, internal services can implement both. Contract testing (Pact) ensures consumer and producer are compatible.

---

## SECTION 6 — JPA, Database & Transactions (Q81–Q90)

---

**Q81. Explain the JPA entity lifecycle.**

> *Testing: Hibernate state management.*

Four states: **New/Transient** — object created with `new`, not associated with any persistence context or DB row. **Managed/Persistent** — associated with active EntityManager; changes tracked automatically (dirty checking on flush). **Detached** — was managed, but EntityManager closed or entity evicted. Changes NOT tracked. Must `merge()` to reattach. **Removed** — marked for deletion; DELETE issued on flush. Transitions: `persist()` (New → Managed), `find()/JPQL` (DB → Managed), `detach()/close()` (Managed → Detached), `merge()` (Detached → Managed copy), `remove()` (Managed → Removed). In EHR: after `@Transactional` method returns, entities become detached. Accessing `patient.getAppointments()` outside transaction → `LazyInitializationException`. Solution: `fetch join` within transaction, or DTO projection.

---

**Q82. What is optimistic vs pessimistic locking in JPA?**

> *Testing: Concurrency at the database level.*

**Optimistic locking**: no DB lock held. Each entity has `@Version` field (integer or timestamp). On update: `WHERE id=? AND version=5`. If version changed (another thread updated first), 0 rows affected → Spring throws `OptimisticLockException`. Client retries with fresh data. Best for: low contention, high read:write ratio — most medical record updates. **Pessimistic locking**: `SELECT ... FOR UPDATE` — DB-level lock held until transaction commits. Blocks other transactions from reading that row (PESSIMISTIC_WRITE). Use for: financial transactions, critical safety updates (allergy changes), scenarios where you cannot tolerate the retry cost. In EHR: optimistic for normal patient record updates, pessimistic for medication administration records (patient safety — can't allow concurrent updates).

---

**Q83. Explain Hibernate's L1 and L2 caches.**

> *Testing: Hibernate caching.*

**L1 (First-Level Cache)**: the persistence context — scope is one `EntityManager` (one transaction). `findById` twice in same transaction returns same object (no second DB call). Always enabled, can't disable. Dirty checking uses L1 to detect changes. **L2 (Second-Level Cache)**: shared across `EntityManager` instances — one `SessionFactory`. Must be explicitly enabled (`@Cache` on entity). Providers: EhCache, Infinispan, Redis. Cache strategies: READ_ONLY (immutable data — ICD codes), READ_WRITE (frequent reads, occasional writes — Doctor profiles), NONSTRICT_READ_WRITE (can tolerate brief stale reads). In EHR: L2 cache for `Doctor` (read frequently, changes rarely), `IcdCode` (read-only reference data). Invalidated automatically when entity updated via Hibernate. Bypassed by native SQL queries and `@Modifying` bulk updates — must evict manually.

---

**Q84. What is the difference between `CascadeType.ALL` and each cascade type?**

> *Testing: JPA relationship management.*

Cascade propagates operations from parent to child: `PERSIST` (save parent → save child), `MERGE` (update parent → merge child), `REMOVE` (delete parent → delete children), `REFRESH` (refresh parent → refresh children), `DETACH` (detach parent → detach children), `ALL` = all of the above. `orphanRemoval = true` — if child is removed from parent collection, delete it from DB (different from REMOVE cascade which deletes on parent deletion). In EHR: `Patient` → `Appointment`: `CascadeType.PERSIST` + `orphanRemoval=true` — save patient saves appointments, removing from list deletes them. Do NOT use `CascadeType.REMOVE` carelessly on `@ManyToMany` — deleting one entity would cascade-delete shared entities.

---

**Q85. What is HikariCP? How do you size the connection pool?**

> *Testing: Production database knowledge.*

HikariCP is a high-performance JDBC connection pool — Spring Boot's default. Creating a DB connection is expensive (TCP handshake, auth, protocol negotiation). HikariCP maintains a pool of ready connections. Configuration: `maximumPoolSize` (max connections), `minimumIdle` (keep alive even when idle), `connectionTimeout` (how long to wait for connection — default 30s), `idleTimeout` (evict idle connections after this), `maxLifetime` (replace connections after this — prevents stale). Sizing rule: for IO-bound (waiting on DB): `num_cores * 2 + 1`. For CPU-bound: `num_cores`. A common mistake: too many connections → PostgreSQL context switching overhead — smaller pool often performs better. In EHR (4-core container): pool size = 9-10.

---

**Q86. What is a covering index? When do you use it?**

> *Testing: Database performance.*

A covering index includes all columns needed to satisfy a query — no table row lookup needed (index-only scan). `CREATE INDEX idx_lab_results_covering ON lab_results(patient_id, test_code, resulted_at, positive)` covers `SELECT resulted_at, positive FROM lab_results WHERE patient_id = ? AND test_code = ?`. DB reads only the index — faster, less I/O. Use when: a query is executed very frequently, the same columns are always queried together. Trade-off: wider index = larger storage, slower writes. In EHR: appointment lookup by patient in a date range — `(patient_id, scheduled_at, status, appointment_type)` covering index for the dashboard query.

---

**Q87. What is the difference between `INNER JOIN`, `LEFT JOIN`, and the impact of NULL handling?**

> *Testing: SQL depth.*

`INNER JOIN` returns only rows with matches in both tables — patients without appointments excluded. `LEFT JOIN` returns all left-table rows + matching right rows (NULL for no match) — all patients, with appointment data if available. `RIGHT JOIN` is LEFT JOIN reversed (rarely used — just swap table order). `FULL OUTER JOIN` — all rows from both, NULLs where no match. In EHR: `LEFT JOIN case_reports ON lab_results.id = case_reports.lab_result_id WHERE case_reports.id IS NULL` finds lab results without a case report — unreported conditions. Important: `WHERE` clause on a LEFT JOIN column filters out NULLs → becomes INNER JOIN. Put such conditions in `ON` clause instead.

---

**Q88. What are window functions? Give an EHR example.**

> *Testing: Advanced SQL.*

Window functions perform calculations across a set of rows related to the current row, without collapsing rows (unlike GROUP BY). `ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY resulted_at DESC)` — rank lab results per patient by date. `LAG(result_value) OVER (PARTITION BY patient_id, test_code ORDER BY resulted_at)` — previous test value (trend analysis). `SUM(cost) OVER (PARTITION BY patient_id ORDER BY appointment_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` — running total cost per patient. In EHR: identify most recent lab result per patient per test code — `WHERE row_num = 1` after the window function. Much more efficient than N+1 subqueries.

---

**Q89. Explain `@Transactional` propagation with a real scenario.**

> *Testing: Transaction propagation understanding.*

`REQUIRED` (default): join existing transaction if present, create new if not. `PatientService.registerPatient()` calls `AuditService.log()` — both participate in same transaction. If audit fails → entire transaction rolls back (maybe not what you want). `REQUIRES_NEW`: always create new, suspend existing. Use for audit logging — audit must commit even if parent transaction rolls back (you want the failed attempt recorded). `NESTED`: savepoint within existing transaction — inner can roll back to savepoint, outer continues. `MANDATORY`: must have existing transaction (throws if not). `NOT_SUPPORTED`: suspend transaction, run without. `NEVER`: must NOT have transaction (throws if one exists). In EHR: `AuditService.logAccess()` with `REQUIRES_NEW` — HIPAA audit record committed independently of whether the operation succeeded.

---

**Q90. What is Flyway/Liquibase? Why use it?**

> *Testing: Database migration practice.*

Database migration tools manage schema changes as versioned scripts applied in order. Without them: `spring.jpa.hibernate.ddl-auto=update` in production is dangerous — Hibernate might drop columns. With Flyway: `V1__create_patients_table.sql`, `V2__add_mrn_index.sql` — Flyway tracks which migrations ran (`flyway_schema_history` table), applies only new ones. Repeatable migrations for views/procedures. Liquibase: similar but XML/YAML/SQL changesets with rollback support. In EHR: all schema changes are Flyway migrations in `src/main/resources/db/migration`. CI/CD runs migrations before deploying new app version. Zero-downtime migrations: add column nullable first (backward compatible), deploy app that writes to it, then add NOT NULL constraint.

---

## SECTION 7 — Testing, JVM & Production (Q91–Q100)

---

**Q91. What is the difference between `@Mock`, `@MockBean`, and `@Spy`?**

> *Testing: Spring test annotations.*

`@Mock` (Mockito): creates a mock outside Spring context — use in plain unit tests with `@ExtendWith(MockitoExtension.class)`. No Spring context loaded — fast. `@MockBean` (Spring Test): creates a Mockito mock AND registers it as a Spring bean — replaces real bean in context. Use in `@SpringBootTest` or `@WebMvcTest` to replace external dependencies. Slower (loads Spring context). `@Spy` (Mockito): wraps a real object — real methods called unless stubbed. Use to partially mock a real implementation. `@SpyBean` = Spring bean version of Spy. Prefer `@Mock` + `@InjectMocks` for pure unit tests. Use `@MockBean` only when you need the Spring context.

---

**Q92. What is TestContainers and why is it better than H2?**

> *Testing: Integration testing philosophy.*

H2 is an in-memory DB useful for speed but diverges from PostgreSQL: no JSONB, different constraint behavior, different function names, different query planner behavior. Tests pass on H2 but fail on real PostgreSQL. TestContainers starts a real Docker container (PostgreSQL, Kafka, Redis) for tests — identical to production environment. `@Container static PostgreSQLContainer<?>` starts once per test class (singleton pattern). `@DynamicPropertySource` overrides Spring properties with container's URL. Tests are slower but trustworthy. In EHR: `@DataJpaTest` with TestContainers PostgreSQL catches window function issues, JSONB queries, and constraint violations that H2 misses.

---

**Q93. What is MockMvc? How do you test validation?**

> *Testing: Web layer testing.*

MockMvc simulates HTTP requests without starting a real server — processes the full Spring MVC pipeline (DispatcherServlet, filters, interceptors, validation, controller, message converters). Use `@WebMvcTest` (loads only web layer) + `MockMvc`. `mockMvc.perform(post("/api/v1/patients").contentType(APPLICATION_JSON).content(json))` returns `ResultActions`. Assert with `.andExpect(status().isCreated())`, `.andExpect(jsonPath("$.mrn").value("MRN-001"))`. For validation testing: send invalid request → expect 400 → check error response contains field names and messages. For auth testing: `@WithMockUser(roles="NURSE")` or `@WithAnonymousUser`.

---

**Q94. What is a heap dump and how do you analyze it?**

> *Testing: Production troubleshooting.*

Heap dump is a snapshot of all objects in JVM heap at a point in time. Take with: `jmap -dump:format=b,file=heap.hprof <pid>`, or `jcmd <pid> GC.heap_dump heap.hprof`, or automatically on OOM with `-XX:+HeapDumpOnOutOfMemoryError`. Analyze with Eclipse MAT: Leak Suspects Report (top retained-memory objects), Dominator Tree (what's keeping the most objects alive), Histogram (count and size by class). Common EHR findings: unbounded `HashMap` in static field (patient cache without eviction), `ThreadLocal` not cleared (one entry per request thread in pool), Hibernate L1 cache holding thousands of entities after bulk load, large `byte[]` from FHIR bundles held in memory.

---

**Q95. How do you find a memory leak in production?**

> *Testing: Production debugging methodology.*

Step 1: Enable `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/log/`. Step 2: Monitor heap usage trend with `jvm_memory_used_bytes` in Grafana — if it grows steadily and never drops after GC, it's a leak. Step 3: When heap usage is high but not OOM yet, `jmap -histo <pid>` for histogram (top objects by count and size). Step 4: Take two heap dumps 30 minutes apart — compare histograms to see what's growing. Step 5: After OOM, analyze heap dump in Eclipse MAT. Typical causes in Spring/Hibernate: static collection accumulating entities, cache without eviction, event listeners registered but never removed, closures holding large object references.

---

**Q96. What GC algorithm does Java use by default? When would you change it?**

> *Testing: JVM internals.*

Java 9+: G1GC default (Garbage First). Divides heap into equal regions, evacuates highest-garbage regions first. Targets pause time (`-XX:MaxGCPauseMillis=200`). Good for most applications — balanced throughput and latency. Switch to **ZGC** (Java 15+ production-ready) for: latency-sensitive services requiring sub-10ms GC pauses, large heaps (>16GB), real-time patient monitoring dashboards. ZGC does most work concurrently (concurrent marking and relocation), pause is mostly just stack scan. Switch to **Shenandoah** (Red Hat) for similar ultra-low-pause goals. Switch back to **Parallel GC** for: batch jobs where throughput matters, pauses are acceptable, no latency requirements — highest raw throughput. In EHR: G1GC for API services (balanced), ZGC consideration for real-time vitals dashboard.

---

**Q97. What is JIT compilation and how does it affect performance?**

> *Testing: JVM optimization knowledge.*

JIT (Just-In-Time) compiler profiles running code, identifies "hot" methods (called frequently), and compiles them to native machine code for that specific CPU. First few thousand executions: interpreted (slow). After threshold: C1 (client) compiler — quick, modest optimization. After more calls: C2 (server) compiler — aggressive optimization (inlining, loop unrolling, escape analysis). This is why Java is slow at startup but fast at steady state. JVM warmup: in EHR, first few requests after startup are slower — `@PostConstruct` pre-warm by running a few dummy requests, or use Class Data Sharing (CDS) to pre-compile commonly loaded classes. GraalVM AOT compilation (Spring Boot 3 native) compiles everything ahead of time — fast startup, smaller memory, but no JIT optimization at runtime.

---

**Q98. Explain escape analysis and its optimization.**

> *Testing: JVM deep optimization.*

Escape analysis: JVM analyzes whether an object's reference ever "escapes" the current scope (returned, stored in field, passed to external method). If an object doesn't escape, JVM can: (1) **Stack allocate** it (scalar replacement) — no heap allocation, no GC pressure, auto-freed when method returns. (2) **Eliminate synchronization** — if object never shared between threads, `synchronized` blocks are no-ops. In EHR: `LabResultDto` created inside a service method, used only there, returned as response — JVM may stack-allocate it. `PatientEnricher` instance created and used only in one method — sync on it is eliminated. Result: less GC pressure, faster execution. Enable with default (on in Java 6+). Visible via GC log — reduced allocation rate.

---

**Q99. How do you perform a code review for a Java PR?**

> *Testing: Engineering practices, seniority signal.*

What I look for: **Correctness** — does it do what it claims? Edge cases (null, empty, concurrent), error paths. **Performance** — N+1 queries (missing `JOIN FETCH`), unbounded collections, missing pagination, String concatenation in loops. **Security** — HIPAA: is PHI logged? Parameterized queries (no string concatenation in SQL)? Input validation? Authentication/authorization on new endpoints? **Concurrency** — shared mutable state, ThreadLocal cleanup, synchronized correctness. **Testability** — are tests present? Do they test behavior, not implementation? **Readability** — meaningful names, appropriate abstraction, no magic numbers. **Transaction boundaries** — `@Transactional` placement, self-invocation traps, rollback behavior. **Dependency management** — are new dependencies justified? CVE-clean? I also look at the PR description — does it explain the *why*, not just the *what*?

---

**Q100. "Tell me about a challenging technical problem you solved."**

> *Testing: Seniority, problem-solving, communication.*

Structure: STAR (Situation, Task, Action, Result). Pick a real one. Example answer using EHR domain:

"In our ECR submission pipeline, we were seeing intermittent duplicate case reports being sent to the CDC — a serious issue given HIPAA implications. The system had retries but the deduplication logic relied solely on a database unique constraint. Under load, the optimistic lock check and the Kafka consumer rebalancing were creating a race: two consumer instances would both pass the uniqueness check within the same millisecond before either committed.

I diagnosed this by correlating Kafka consumer group metrics (seeing rebalances) with the timestamps of duplicate submissions in the audit log. The root cause was that rebalancing caused the same partition to be picked up by two consumers momentarily.

I solved it in two layers: first, a Redis distributed lock (SETNX with TTL) as a fast, atomic gate before any DB write — only one instance could hold the lock per idempotency key. Second, I kept the DB unique constraint as a defense-in-depth fallback. The Lua script in Redis made the check-and-set atomic across the cluster.

Result: zero duplicate ECR submissions in the three months post-deployment. The fix also improved throughput by 15% because we replaced an expensive DB SELECT with a sub-millisecond Redis check in the hot path."
