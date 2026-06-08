# THREE LEVEL NOTES — Complete Java Interview Study Guide
## Every Topic: Basic → Intermediate → Advanced
### EHR / ECR-NOW Domain Examples Throughout

> **How to use:**
> - 🟢 **Basic** — Read first. Understand the "what" simply.
> - 🟡 **Intermediate** — Read second. Learn the "how" formally.
> - 🔴 **Advanced** — Read last. Master every term, every reason, every connection.

---

## TOPIC 1: JVM / JDK / JRE

### 🟢 Basic
Java code doesn't run directly on your computer. Instead, you write Java code → a compiler turns it into "bytecode" (a middle language) → the JVM (Java Virtual Machine) reads that bytecode and runs it on your actual computer. This is why Java works on Windows, Mac, and Linux — the JVM handles the translation for each system. JDK is the full toolkit (compiler + JVM). JRE is just the player (JVM + libraries). JDK is for developers; JRE is for running apps.

### 🟡 Intermediate
**JDK (Java Development Kit)** — complete development environment: `javac` compiler, `jdb` debugger, `jmap`, `jstack`, profiling tools, and the JRE. **JRE (Java Runtime Environment)** — JVM plus the standard class libraries (`java.lang`, `java.util`, etc.) needed to execute Java programs. **JVM (Java Virtual Machine)** — abstract computing machine that executes bytecode. It is platform-specific (different JVM for Windows/Linux/Mac) but bytecode is platform-neutral — "write once, run anywhere." The JVM provides: class loading, bytecode verification, memory management (GC), and execution engine (interpreter + JIT).

### 🔴 Advanced
The JVM is a stack-based virtual machine. Execution flows: `.java` source → `javac` → `.class` bytecode → **ClassLoader** (Bootstrap → Extension → Application, parent-delegation model) loads classes into **Metaspace** → **Bytecode Verifier** checks safety → **Execution Engine** runs code.

The Execution Engine has two modes: **Interpreter** (executes bytecode line-by-line, slow, used for first few invocations) and **JIT Compiler** (Just-In-Time: detects "hot" methods via profiling, compiles to native machine code — **C1 compiler** for quick optimization, **C2 compiler** for aggressive optimization: inlining, loop unrolling, escape analysis). This is why Java is slow at startup but reaches near-native speed at steady state.

**JVM Memory Areas:** **Heap** (Eden → Survivor S0/S1 → Old Gen) for all objects; **Stack** (per-thread, method frames, local variables, primitive values, references); **Metaspace** (class metadata, static fields, interned strings — replaced PermGen in Java 8, grows dynamically, bounded by `-XX:MaxMetaspaceSize`); **PC Register** (program counter per thread); **Native Method Stack** (JNI calls).

**Key JVM optimizations:** **Escape Analysis** — if object doesn't escape method scope, allocate on stack (scalar replacement), zero GC pressure. **String Pool** — string literals share heap space. **CDS (Class Data Sharing)** — pre-load commonly used classes for faster startup. In EHR, `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0` ensures JVM respects Kubernetes container memory limits (doesn't read host RAM).

---

## TOPIC 2: OOP — 4 Pillars

### 🟢 Basic
OOP is a way of organizing code using "objects" — things that have data (fields) and behavior (methods). The 4 rules of OOP: **Encapsulation** = hide internal details, show only what's needed (like a medical record — you can see the patient name but not edit the SSN directly). **Inheritance** = child class gets parent's features (Doctor IS-A MedicalPerson). **Polymorphism** = same action, different behavior (send notification to Doctor vs Patient — both are Notifiable but behave differently). **Abstraction** = show only important parts, hide complexity (you call `submitEcr()` without knowing the FHIR details inside).

### 🟡 Intermediate
**Encapsulation:** Bundle data and methods together; restrict direct field access via `private` + getters/setters. Protects invariants — `mrn` field is `private final` in `Patient`, set once in constructor, never changed. **Inheritance:** `extends` for classes (single), `implements` for interfaces (multiple). Models IS-A relationship. `Doctor extends MedicalPerson` — Doctor inherits `name`, `licenseNumber`, adds `specialty`. **Polymorphism:** compile-time (method overloading — resolved by parameter types) and runtime (method overriding — resolved by actual object type at runtime, dynamic dispatch). **Abstraction:** `abstract class` or `interface` defines contract; implementation hidden. `CaseReporter` abstract class defines `submit()` template; concrete subclasses implement `buildPayload()`.

### 🔴 Advanced
**Encapsulation** enforces data integrity and reduces coupling. `Patient.mrn` is `private final` — no setter, set only in constructor, preventing unauthorized mutation (HIPAA compliance). Defensive copy: `getAppointments()` returns `Collections.unmodifiableList(appointments)` — callers can't modify internal list. `maskSsn()` is `private` — SSN logic internal only. **Coupling** (how dependent classes are on each other) and **Cohesion** (how focused a class is on one purpose) are design quality metrics. Low coupling + high cohesion = good OOP.

**Inheritance** creates IS-A relationship. `extends` gives single inheritance in Java (avoids diamond problem). **Composition over inheritance** principle: prefer HAS-A (`Patient HAS-A Address`) over IS-A when behavior can change or multiple types are needed. **Method Resolution Order:** JVM uses dynamic dispatch — at runtime, looks up the actual class's method table (vtable). `@Override` ensures compile-time check that method signature matches parent.

**Polymorphism via interfaces:** `Notifiable` interface implemented by `Doctor`, `Patient`, `PublicHealthDepartment`. `void notifyAll(List<Notifiable> notifiables, Alert alert)` — one method works for all types. **Covariant return types** (override can return subtype). **Contravariance** — method can accept wider type in override.

**Abstraction levels:** `interface` for pure contract (no state, multiple implementation). `abstract class` for partial implementation with template method pattern — `CaseReporter.submit()` calls abstract `buildPayload()` (Template Method pattern). **SOLID principles** flow directly from OOP: **S**ingle Responsibility (one reason to change), **O**pen/Closed (open for extension, closed for modification — add new `CaseReporter` subclass without changing existing code), **L**iskov Substitution (subtype usable wherever parent used), **I**nterface Segregation (many small interfaces > one large), **D**ependency Inversion (depend on abstractions, not concretions — `PatientService` depends on `PatientRepository` interface, not `JpaPatientRepository` directly). In EHR: every Spring `@Service` depends on repository *interfaces*, enabling test mocking without DB.

---

## TOPIC 3: Java Memory Model & Garbage Collection

### 🟢 Basic
Java automatically manages memory — you don't free objects manually like in C. When you create a `new Patient()`, it goes into a special area called the **Heap**. When nothing in your code points to that patient anymore, Java's **Garbage Collector (GC)** detects it and cleans it up. The heap is divided into areas: young objects start in **Eden**, survive to **Survivor** spaces, and long-lived objects move to **Old Generation**. The **Stack** holds temporary variables per method call — it auto-clears when method returns.

### 🟡 Intermediate
**Heap Structure:** Young Generation (Eden + Survivor S0 + S1) for newly created objects. Minor GC runs frequently — moves live objects from Eden to Survivor, promotes to Old Gen after surviving several GCs (tenuring threshold). Old Generation holds long-lived objects (cached patients, Spring singleton beans). **Metaspace** (Java 8+, replaced PermGen) holds class metadata, static fields, interned strings. **GC Roots:** active thread stacks, static fields, JNI references — GC traces from roots to find all reachable objects; unreachable = garbage. **Stop-The-World (STW):** GC pauses all application threads during certain phases. **G1GC** (default Java 9+) divides heap into equal regions, evacuates highest-garbage regions, targets `MaxGCPauseMillis`. **ZGC** (Java 15+ stable): concurrent mark+relocate, sub-10ms pauses, scales to TB heaps.

### 🔴 Advanced
**GC Algorithms in depth:** **Mark-Sweep-Compact** — Mark: traverse from GC roots, mark reachable objects. Sweep: reclaim unmarked. Compact: move live objects together (eliminates fragmentation). STW during all phases — simple but slow. **CMS (Concurrent Mark-Sweep)** — mostly concurrent (marks while app runs), short STW for initial/re-mark. Deprecated Java 9, removed Java 14. **G1GC** — heap divided into equal-sized regions (~2MB default). Young regions (Eden/Survivor) + Old regions + Humongous regions (objects > 50% region size). GC selects "garbage-first" regions (highest % garbage) for evacuation. Young GC (STW): copy Eden + Survivor to new Survivor or promote to Old. Mixed GC: young + some old regions. Full GC (rare, STW): fallback if concurrent can't keep up. **ZGC:** load barriers on every object access (not just GC time) — concurrent relocation, colored pointers (metadata in pointer bits). Pause = only thread-stack scan (~1ms).

**Memory Leak causes in EHR:** static `HashMap<String,Patient>` without eviction bounds → grows with every request → Old Gen fills → Full GC → OOM. `ThreadLocal` not cleared in thread pool (threads reused) → prior request's patient data persists → data leak + memory growth. Hibernate L1 cache in long transaction processing 100k lab results — all entities kept in `PersistenceContext` Map → clear with `em.clear()` every 1000 records. Large `byte[]` from FHIR bundle stored in log MDC — kept alive by logger thread.

**Tuning flags used in production EHR:**
```
-Xms1g -Xmx2g                        # Heap bounds
-XX:+UseG1GC                          # G1 (explicit on Java 8)
-XX:MaxGCPauseMillis=200              # Target pause
-XX:G1HeapRegionSize=8m               # Region size for 2GB heap
-XX:+HeapDumpOnOutOfMemoryError       # Auto-dump on OOM
-XX:+UseContainerSupport              # K8s: read cgroup limits not host RAM
-XX:MaxRAMPercentage=75.0             # 75% of container RAM for heap
```

**JMM (Java Memory Model) and visibility:** Each CPU has its own cache. Without synchronization, Thread B may never see Thread A's write. JMM defines **happens-before** guarantees: `volatile` write happens-before `volatile` read; `synchronized` unlock happens-before next lock; `Thread.start()` happens-before thread's actions. Without happens-before: compiler/CPU free to reorder instructions → race condition. `volatile boolean ecrPaused` — `PatientService` sets it, worker threads read it. Without `volatile`, workers read from CPU cache forever. In EHR this means the ECR submission never pauses even though the flag was set.

---

## TOPIC 4: Collections Framework

### 🟢 Basic
Collections are containers for storing multiple objects. `ArrayList` is like a numbered list — access by position, fast to read. `LinkedList` is like a chain — fast to add/remove at ends but slow to find middle. `HashMap` is like a dictionary — look up by key instantly. `HashSet` stores unique items (no duplicates). `TreeMap`/`TreeSet` keep things sorted. `PriorityQueue` always gives you the most important item first (triage queue). In EHR: ArrayList for appointment lists, HashMap for patient cache, PriorityQueue for ER triage.

### 🟡 Intermediate
**List:** `ArrayList` (dynamic array, O(1) random access, O(n) insert middle), `LinkedList` (doubly-linked, O(1) head/tail ops, O(n) random access). **Map:** `HashMap` (O(1) avg get/put, unordered), `LinkedHashMap` (insertion-order or access-order, LRU cache), `TreeMap` (sorted, O(log n), range queries via `subMap`/`floorKey`/`ceilingKey`). **Set:** `HashSet` (backed by HashMap, O(1), unordered), `TreeSet` (sorted, O(log n), `headSet`/`tailSet`). **Queue/Deque:** `ArrayDeque` (better than LinkedList for stack/queue), `PriorityQueue` (min-heap, O(log n) offer/poll, O(1) peek), `LinkedBlockingQueue` (bounded, blocking ops for producer-consumer). **Concurrent:** `ConcurrentHashMap` (segment/CAS locking, high throughput), `CopyOnWriteArrayList` (copy-on-write, lock-free reads, expensive writes), `BlockingQueue` implementations.

### 🔴 Advanced
**HashMap internals — the full story:** `put(key, value)` → `key.hashCode()` called → spread with `hash ^ (hash >>> 16)` (XOR with upper 16 bits distributes bucket index more evenly) → `index = hash & (n-1)` where n=capacity (power of 2, bitwise AND is faster than modulo) → check bucket. If empty: new `Node`. If collision (same bucket): traverse linked list, check `equals()` for existing key. **Treeification:** if chain length ≥ `TREEIFY_THRESHOLD` (8) AND table size ≥ 64: convert linked list to Red-Black tree → O(log n) worst case instead of O(n). **Rehash:** when `size > capacity * loadFactor` (0.75 default): new array double size, all entries rehashed. `HashMap` contract: equal objects MUST have equal hashCode. Mutable keys are dangerous — changing `mrn` after insertion makes bucket unreachable.

**PriorityQueue as max-heap for triage:** `new PriorityQueue<>(Comparator.comparingInt(Patient::getUrgencyScore).reversed())` — `poll()` always returns highest urgency. Internally a binary heap: parent ≤ children (min-heap). `offer()` adds at bottom, sifts up O(log n). `poll()` removes root, moves last to root, sifts down O(log n). For K most urgent: poll K times. For streaming updates (urgency changes): O(n) `remove()` then re-add — or use `TreeSet` for O(log n) removal.

**Concurrent collections trade-offs:** `Collections.synchronizedMap()` — single `synchronized` lock on entire map, one thread at a time for any operation. `ConcurrentHashMap` (Java 8) — CAS operations on individual bins for updates, `volatile` reads for gets — multiple threads operate simultaneously on different buckets. `computeIfAbsent` atomic: `patientCache.computeIfAbsent(mrn, k -> db.findByMrn(k))` — only one thread calls DB if concurrent misses for same key. `CopyOnWriteArrayList` for `EcrSubmissionListener` registry — listeners registered once at startup, read on every lab result event, no locking needed for reads.

**Memory layout:** `ArrayList<Patient>` — continuous `Object[]` array in heap, each slot holds reference (8 bytes, 4 bytes with pointer compression). `HashMap<String,Patient>` — `Node[]` array + `Node` objects (key, value, hash, next) per entry. `LinkedList<Appointment>` — scattered `Node` objects (prev, next, data pointers) = poor cache locality vs ArrayList's continuous array — ArrayList iteration is faster due to CPU cache line prefetching.

---

## TOPIC 5: Generics & Type System

### 🟢 Basic
Generics let you write code that works with any type safely. Instead of `List list = new ArrayList()` (can store anything, might cause errors), you write `List<Patient> list = new ArrayList<>()` — now the list only holds Patients and the compiler catches mistakes. It's like a labeled box — `Box<Patient>` only accepts Patient objects, no accidental Doctor inside.

### 🟡 Intermediate
Generics provide compile-time type safety without runtime overhead. `ApiResponse<T>` works for any type T. **Type erasure:** generic type information is erased at compile time — `List<Patient>` becomes `List<Object>` in bytecode. JVM has no knowledge of generic types at runtime. Implications: `instanceof List<Patient>` illegal; unchecked casts needed when mixing generic and raw types. **Bounded wildcards:** `<T extends MedicalPerson>` (upper bound — T is MedicalPerson or subtype), `<? extends MedicalPerson>` (covariant, read-only), `<? super Patient>` (contravariant, write-only). **PECS rule:** Producer Extends, Consumer Super — `List<? extends T>` to read from, `List<? super T>` to write to.

### 🔴 Advanced
**Type erasure details:** Compiler inserts casts where needed. `List<Patient> patients` → bytecode `List patients`, access becomes `(Patient) patients.get(0)`. Bridge methods generated when overriding generic methods to preserve polymorphism. Cannot do: `new T()` (no type info at runtime), `new T[]`, `instanceof T`, static fields of type T.

**Generic methods:** `<T> ApiResponse<T> success(T data)` — T inferred from argument. **Recursive generics:** `<T extends Comparable<T>>` — T must be comparable to itself. **Generic classes vs interfaces:** `BaseRepository<T, ID extends Serializable>` — `PatientRepository extends BaseRepository<Patient, Long>`.

**Why wildcards matter:** `List<Doctor>` is NOT a `List<MedicalPerson>` (invariance). If it were, you could `add(new Patient())` to a `List<Doctor>` — type-unsafe. `List<? extends MedicalPerson>` is read-only covariant — safe to read as `MedicalPerson`, cannot add (compiler doesn't know the concrete type). `List<? super Patient>` — can add `Patient` or subtypes, read only as `Object`. In EHR: `PatientValidator implements Validator<Patient>` — `Validator<T>` interface with `validate(T obj)` — type-safe validation without casting. `Map<String, PaymentProcessor>` — all processor implementations stored, `paymentProcessors.get("INSURANCE").process(claim)` — Strategy pattern via generics + DI.

---

## TOPIC 6: Exception Handling

### 🟢 Basic
Exceptions are errors that happen while the program is running — like trying to find a patient that doesn't exist. Java forces you to handle some errors (checked) and allows others to crash on their own if not handled (unchecked). `try` — the risky code. `catch` — what to do if error happens. `finally` — always runs (cleanup). `throw` — create an error. `throws` — warn callers this method might error.

### 🟡 Intermediate
**Exception hierarchy:** `Throwable` → `Error` (JVM-level, don't catch: `OutOfMemoryError`, `StackOverflowError`) and `Exception` → `IOException`, `SQLException` (checked) and `RuntimeException` → `NullPointerException`, `IllegalArgumentException`, `ClassCastException` (unchecked). **Checked** exceptions: compiler enforces declaration or handling — represent recoverable conditions. **Unchecked:** `RuntimeException` subclasses — represent programming errors or unrecoverable conditions. Modern Spring practice: custom exceptions extend `RuntimeException` — `@Transactional` rolls back on `RuntimeException` by default. **try-with-resources:** `AutoCloseable` resources closed automatically in reverse declaration order even if exception thrown — `try (var conn = ds.getConnection(); var stmt = conn.prepareStatement(sql))`.

### 🔴 Advanced
**Custom exception hierarchy in EHR:** `EhrBaseException extends RuntimeException` (base, with errorCode + message). `PatientNotFoundException extends EhrBaseException` (404). `DuplicateMrnException extends EhrBaseException` (409). `EcrSubmissionException extends EhrBaseException` (502). `ValidationException extends EhrBaseException` (400). This hierarchy enables: `catch(EhrBaseException e)` in global handler, or specific catches by type.

**`@RestControllerAdvice` + `@ExceptionHandler`:** Spring AOP intercepts unhandled exceptions from any controller. `@ExceptionHandler(PatientNotFoundException.class)` → return `ResponseEntity` with 404 + structured error body. `@ExceptionHandler(MethodArgumentNotValidException.class)` → extract field errors from `BindingResult`, return 400 with list of violations. `@ExceptionHandler(Exception.class)` → catch-all, return 500, log full stack trace.

**Exception chaining:** `throw new EcrSubmissionException("ECR-NOW rejected", cause)` — wraps original exception, preserves stack trace. `e.getCause()` retrieves root cause. Logging: always `log.error("message", e)` — logs full stack trace. `log.error("message: " + e.getMessage())` — loses stack trace.

**`@Transactional` rollback rules:** Default: rollback on `RuntimeException` and `Error`, commit on checked exception. `rollbackFor = Exception.class` — also rollback on checked. `noRollbackFor = OptimisticLockException.class` — don't rollback on specific runtime exception (let caller retry). In EHR: `@Transactional(rollbackFor = Exception.class)` on `EcrService.submitAndPersist()` — if FHIR generation throws a checked `FhirBuildException`, roll back the DB insert too.

**Multi-catch and rethrowing:** `catch (PatientNotFoundException | DuplicateMrnException e)` — same handler for multiple types. `throw e` — rethrow same exception. `throw new EhrBaseException("wrapped", e)` — wrap in domain exception. Never swallow: `catch(Exception e) { }` — hides bugs.

---

## TOPIC 7: Java 8+ — Streams, Lambdas, Optional

### 🟢 Basic
Lambdas are short anonymous functions: `patient -> patient.isActive()` instead of writing a full class. Streams let you process lists like a pipeline: `patients.stream().filter(p -> p.isActive()).map(p -> p.getName()).collect(toList())` — filter actives, get their names, make a list. Optional is a box that may or may not contain a value — prevents NullPointerException by making "no value" explicit: `Optional<Patient>` instead of returning `null`.

### 🟡 Intermediate
**Lambda:** implements a functional interface (one abstract method) — `Predicate<Patient> isActive = p -> p.getStatus() == ACTIVE`. **Method reference:** `Patient::getMrn` = `p -> p.getMrn()`. Types: static (`Integer::parseInt`), instance (`String::toUpperCase`), constructor (`Patient::new`). **Stream pipeline:** source → intermediate ops (lazy) → terminal op (triggers execution). Intermediate: `filter`, `map`, `flatMap`, `sorted`, `distinct`, `limit`, `takeWhile`, `dropWhile`. Terminal: `collect`, `forEach`, `count`, `reduce`, `findFirst`, `anyMatch`. **Lazy evaluation:** `filter` predicate not called until terminal op pulls elements — `findFirst()` stops after first match (doesn't process entire stream). **Optional:** `Optional.of(v)` (throws if null), `Optional.ofNullable(v)` (safe), `Optional.empty()`. Ops: `orElse`, `orElseGet` (lazy), `orElseThrow`, `map`, `flatMap`, `filter`, `ifPresent`, `ifPresentOrElse`, `stream()`.

### 🔴 Advanced
**Functional interfaces from `java.util.function`:** `Predicate<T>` — `test(T) → boolean`, composable: `.and()`, `.or()`, `.negate()`. `Function<T,R>` — `apply(T) → R`, composable: `.andThen(fn)`, `.compose(fn)`. `Consumer<T>` — `accept(T) → void`, chainable: `.andThen(consumer)`. `Supplier<T>` — `get() → T` (lazy, called only when needed). `BiFunction<T,U,R>`. `UnaryOperator<T>` (Function where T=R). `BinaryOperator<T>` (BiFunction where T=U=R).

**Stream internals:** Spliterator decomposes source for iteration (supports parallel split). `ReferencePipeline` chains operations lazily. Each intermediate op wraps previous in a pipeline stage. Terminal op triggers `Sink` chain — data flows through: source pushes to filter sink → map sink → collect sink. Short-circuit ops (`findFirst`, `anyMatch`, `limit`) stop the chain early.

**Collectors deep dive:** `groupingBy(Patient::getDepartment)` → `Map<String, List<Patient>>`. `groupingBy(Patient::getDept, counting())` → `Map<String, Long>`. `partitioningBy(Patient::isHighRisk)` → `Map<Boolean, List<Patient>>` (true/false). `toMap(Patient::getMrn, Function.identity())` — throws on duplicate key; use `(a,b) -> a` merge function to handle. `joining(", ", "[", "]")` for string concatenation.

**Parallel streams:** `patients.parallelStream()` uses `ForkJoinPool.commonPool()`. Safe when: large dataset, CPU-bound per element, no shared mutable state, no ordering requirement. Dangerous when: IO-bound (blocks pool threads), small data (overhead > gain), stateful operations (race conditions), `@Transactional` (transaction bound to one thread — parallel stream forks threads, breaks transaction). In EHR: parallel stream for CPU-bound FHIR bundle generation for 100k lab results. Never for `patients.parallelStream().forEach(repo::save)` — shared DB connection, Hibernate session not thread-safe.

**Optional best practices:** Return type for "might not exist": `patientRepository.findByMrn(mrn)` → `Optional<Patient>`. **Never** as parameter (just use @Nullable or overload). **Never** as field (Hibernate can't serialize Optional). Chain: `findByMrn(mrn).map(Patient::toDto).orElseThrow(() -> new PatientNotFoundException(mrn))`. `Optional.stream()` (Java 9) for `flatMap` into stream: `patients.stream().map(Patient::getPrimaryDoctor).flatMap(Optional::stream)` — stream of non-null doctors. `orElseGet` vs `orElse`: `orElse(buildDefault())` always evaluates `buildDefault()` even when value present; `orElseGet(this::buildDefault)` only called when empty — use `orElseGet` for expensive defaults.

---

## TOPIC 8: Concurrency & Threading

### 🟢 Basic
Threads are like multiple workers doing tasks at the same time. Problem: if two workers try to update the same patient record simultaneously, they can overwrite each other — called a **race condition**. Solution: `synchronized` — only one thread at a time can enter that block (like a bathroom lock). `ExecutorService` is a thread pool — reuse threads instead of creating new ones for every task (creating threads is expensive). `CompletableFuture` lets you start a task in the background and say "when it's done, do this next thing."

### 🟡 Intermediate
**Thread lifecycle:** NEW → RUNNABLE → BLOCKED/WAITING/TIMED_WAITING → TERMINATED. `synchronized` — JVM monitor lock, reentrant, auto-released on exception. `ReentrantLock` — explicit lock/unlock (in finally), `tryLock(timeout)`, fairness, multiple `Condition` objects. `volatile` — visibility guarantee (no CPU cache), no atomicity. `AtomicInteger/Long/Reference` — CAS (Compare-And-Swap) hardware instruction, lock-free, non-blocking. `ThreadLocal<T>` — per-thread variable (MDC, SecurityContextHolder). `ExecutorService` with `ThreadPoolExecutor` — `coreSize`, `maxSize`, `keepAlive`, work queue, `RejectedExecutionHandler`. `CompletableFuture` — composable async: `supplyAsync`, `thenApply`, `thenCompose`, `allOf`, `anyOf`, `exceptionally`, `orTimeout`. Sync utilities: `CountDownLatch` (one-time N-count barrier), `CyclicBarrier` (reusable N-thread rendezvous), `Semaphore` (N permits), `BlockingQueue` (producer-consumer).

### 🔴 Advanced
**Java Memory Model (JMM) — why it matters:** Each CPU thread has its own registers and L1/L2 cache. Writes may stay in cache, invisible to other threads. JMM defines **happens-before**: if A happens-before B, A's writes are visible to B. Rules: `volatile` write happens-before read; `unlock` happens-before `lock`; `Thread.start()` happens-before thread's actions; actions in a thread happen-before `Thread.join()`. Without happens-before: compiler and CPU may reorder instructions freely → stale reads, publish of partially constructed objects.

**CAS (Compare-And-Swap):** Single CPU instruction: `if(current == expected) { current = newValue; return true; } else return false;`. Atomic — no lock. `AtomicInteger.incrementAndGet()` spins (retry loop) until CAS succeeds. Under high contention, spinning degrades to O(n) — use `LongAdder` (striped counters) instead for high-contention counters. `AtomicReference.compareAndSet(expected, updated)` — circuit breaker state machine: transition CLOSED→OPEN atomically, prevents two threads both transitioning simultaneously.

**Thread pool sizing:** IO-bound (waiting on DB, network): `num_cores * 2` threads (while one waits on IO, another runs). CPU-bound (computation): `num_cores` (no point having more threads than cores). `CallerRunsPolicy` — when queue full, caller thread runs the task itself (natural backpressure: slows down the submitter). In EHR: ECR submission pool — core 5, max 20, `ArrayBlockingQueue(100)`, `CallerRunsPolicy`. If queue fills, the HTTP request thread slows — prevents OOM from unbounded queuing.

**Deadlock:** Thread A holds lock1, waits for lock2. Thread B holds lock2, waits for lock1. Prevention: **canonical ordering** — always acquire locks in the same numeric order (`Math.min(id1,id2)` first). `tryLock(timeout)` — fail and retry rather than wait forever. Detection: thread dump shows `DEADLOCK DETECTED` block with cycle. **ThreadLocal leaks:** thread pool reuses threads — `MDC.clear()` MUST be in `finally` block. `SecurityContextHolder.clearContext()` MUST clear after request. Without clearing: next request on same thread sees previous request's user context (security breach + memory leak).

**Virtual Threads (Java 21):** Platform thread maps 1:1 to OS thread (~1MB stack). Virtual thread is JVM-managed — when it blocks on IO, it **unmounts** from carrier (OS) thread; carrier runs other virtual threads. Millions of virtual threads possible. `spring.threads.virtual.enabled=true` — Spring Boot switches all executors to virtual thread-per-task. Critical: `synchronized` + IO in virtual thread **pins** carrier thread (defeats purpose) — use `ReentrantLock`. `ThreadLocal` with large objects × millions of threads → memory explosion — use `ScopedValue` (Java 21 preview) for scoped per-request data.

---

## TOPIC 9: Spring Core — IoC, DI, AOP

### 🟢 Basic
Spring is a framework that builds and manages your objects for you. Instead of `PatientService service = new PatientService(new PatientRepository())` — you just declare what you need and Spring creates and connects everything. This is called **Dependency Injection (DI)** — Spring "injects" the dependencies. **AOP (Aspect-Oriented Programming)** lets you add behavior (like logging or security checks) to many methods at once without touching each method — like a security guard at every door without putting a guard inside every room.

### 🟡 Intermediate
**IoC (Inversion of Control):** you don't control object creation — the **IoC Container** (`ApplicationContext`) does. `@Component`, `@Service`, `@Repository`, `@Controller` mark beans for detection. **DI types:** Constructor injection (preferred — explicit, immutable, testable without Spring), Setter injection, Field injection (`@Autowired` on field — avoid: hides dependencies, can't use `final`). **Bean scope:** `singleton` (default — one instance per context, shared), `prototype` (new instance every request), `request`/`session` (web scopes). `@Qualifier("name")` disambiguates when multiple beans of same type. `@Primary` marks default when multiple candidates. `@Profile` loads bean only in specified environment.

**AOP:** Cross-cutting concerns (logging, security, transactions, caching) separated from business logic. `@Aspect` + `@Component`. Advice types: `@Before` (before method), `@After` (after, always), `@Around` (wrap method — can modify args/return/exception), `@AfterReturning` (after success), `@AfterThrowing` (after exception). Pointcut expression: `execution(* com.ehr.service.*.*(..))`. Spring AOP uses **proxy** — CGLIB for classes, JDK proxy for interfaces. Proxy intercepts calls and runs advice. `@Transactional`, `@Cacheable`, `@Async` all implemented via AOP proxy.

### 🔴 Advanced
**IoC Container lifecycle:** `ApplicationContext` starts → reads component scan + `@Configuration` classes → instantiates beans (constructor injection first) → `@PostConstruct` callbacks → application runs → `@PreDestroy` on shutdown. **BeanFactory** is the base (lazy init), `ApplicationContext` extends it (eager init, events, i18n). `ObjectProvider<T>` — inject provider instead of bean itself — defer creation, handle optional dependencies, inject prototype into singleton cleanly.

**AOP internals:** Spring AOP is **proxy-based** (not full AspectJ bytecode weaving). When `@Transactional PatientService` bean requested: Spring creates a CGLIB subclass proxy. Proxy intercepts `registerPatient()` → `TransactionInterceptor.invoke()` → begins transaction → calls real `registerPatient()` on target object → commits/rolls back. **Self-invocation bypass:** `this.registerAndReport()` inside `PatientService` calls the real object directly, not the proxy → `@Transactional` on `registerAndReport()` is NOT active. Fix: `@Autowired @Lazy private PatientService self; self.registerAndReport()` — goes through proxy. Or restructure into separate beans.

**`@Transactional` AOP advice order:** by default `@Transactional` advice runs at lowest priority — outermost aspect. `@Retryable` advice runs outside `@Transactional` (so each retry gets a fresh transaction). If you reverse the order, retry would happen inside the same transaction — pointless. Control with `@Order`.

**`@Cacheable` AOP:** on cache hit — proxy returns cached value without ever calling target method. On miss — calls target, stores result in cache using SpEL key expression. `@CacheEvict(allEntries=true)` — clears entire cache. `@CachePut` — always calls method AND updates cache (no skip). Multiple caches: `@Cacheable({"patients", "patientsDashboard"})`.

**`Map<String, BeanType>` injection:** `@Autowired Map<String, PaymentProcessor> processors` — Spring injects all `PaymentProcessor` beans keyed by their bean name. `processors.get("insurancePaymentProcessor").process(claim)` — dynamic Strategy dispatch without if-else. Same pattern for `Map<String, CaseReporter>` — route to correct reporter by condition code.

---

## TOPIC 10: Spring Boot & Auto-Configuration

### 🟢 Basic
Spring Boot makes starting a Spring project easy — no XML config files, no manual setup. Add a dependency and Spring Boot automatically sets it up. Add `spring-boot-starter-data-jpa` and Spring Boot auto-creates the database connection, EntityManager, and repositories. You override only what you need. It's like a smart assistant who prepares everything reasonable by default, and you only tell them when you want something different.

### 🟡 Intermediate
**Auto-configuration** works via `@EnableAutoConfiguration` (included in `@SpringBootApplication`). At startup, Spring reads `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` — lists all `@AutoConfiguration` classes. Each uses conditionals: `@ConditionalOnClass(DataSource.class)` (only if DataSource is on classpath), `@ConditionalOnMissingBean(DataSource.class)` (only if you haven't provided your own). So your `@Bean DataSource` beats auto-config. `@SpringBootApplication` = `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`. **Starters:** curated dependency sets — `spring-boot-starter-web` pulls Tomcat + Spring MVC + Jackson. **`application.yml`:** externalized config, profile-specific sections with `---` separator. **`@ConfigurationProperties(prefix="ehr")`:** bind all `ehr.*` properties to typed POJO with `@Validated` (JSR-303 on config). **Actuator:** management endpoints — `/health`, `/metrics`, `/prometheus`, `/loggers` (change log level at runtime), `/heapdump`, `/threaddump`.

### 🔴 Advanced
**Auto-configuration internals:** `AutoConfigurationImportSelector` reads the imports file, filters by conditionals, orders by `@AutoConfigureAfter`/`@AutoConfigureBefore`. Example chain: `spring-boot-starter-data-jpa` → `DataSourceAutoConfiguration` (creates `HikariDataSource` if `HikariCP` on classpath + `@ConditionalOnMissingBean(DataSource.class)`) → `HibernateJpaAutoConfiguration` (creates `EntityManagerFactory` using `DataSource` bean) → `JpaRepositoriesAutoConfiguration` (creates `JpaRepository` proxies for all `@Repository` interfaces). Providing `@Bean HikariDataSource` stops the auto-config.

**`@ConfigurationProperties` binding:** supports relaxed binding — `ecr.api-base-url`, `ECR_API_BASE_URL` (env var), `ecr.apiBaseUrl` all bind to `String apiBaseUrl`. Nested classes bind as YAML nesting. `@Validated` triggers Bean Validation on properties at startup — fail fast before any request. Immutable config with records (Spring Boot 3.x): `@ConfigurationProperties record EhrProps(EcrConfig ecr, SecurityConfig security)`.

**Profile management:** `@Profile("prod")` on `@Configuration` class or `@Bean`. YAML: `spring.config.activate.on-profile: prod`. `@ActiveProfiles("test")` in test classes. `@Profile("!prod")` for non-prod. Multiple: `@Profile({"dev","local"})`. Programmatic: `Environment.acceptsProfiles(Profiles.of("prod"))`.

**Actuator in production EHR:** `/actuator/health` exposes `EcrNowHealthIndicator` (custom `HealthIndicator` checking ECR-NOW reachability), `db` (HikariCP pool + DB ping), `redis`, `kafka`. Kubernetes liveness probe hits `/actuator/health/liveness` (app not deadlocked), readiness probe hits `/actuator/health/readiness` (DB connected, cache warm). `/actuator/loggers` — change `com.ehr.ecr` logger to DEBUG at runtime without restart — critical for production debugging without redeployment. Secure: `management.endpoints.web.exposure.include: health,prometheus` — never expose `env` (leaks secrets) or `heapdump` (contains patient data) publicly.

---

## TOPIC 11: Spring MVC & REST

### 🟢 Basic
Spring MVC handles HTTP requests. When a browser or mobile app sends `GET /api/v1/patients/MRN-001`, Spring looks for a method with `@GetMapping("/api/v1/patients/{mrn}")` and calls it. The method gets the patient, converts it to JSON, and sends it back. `@RestController` marks the class as an HTTP handler. `@RequestBody` means "read the JSON from the request body." `@PathVariable` means "get the value from the URL." `@Valid` means "check the input data before using it."

### 🟡 Intermediate
**DispatcherServlet** is the front controller — single entry point for all HTTP requests. Request flow: HTTP request → `DispatcherServlet` → `HandlerMapping` (find `@RequestMapping` match) → `HandlerInterceptor.preHandle()` → `HandlerAdapter` invokes controller method (applies `@Valid`, resolves `@RequestBody`, `@PathVariable`, `@RequestParam`) → controller returns DTO → `MessageConverter` (Jackson serializes to JSON) → response. **`@RestControllerAdvice`** + `@ExceptionHandler` — global exception handling, return structured error responses. **`@Valid`** + `MethodArgumentNotValidException` — Bean Validation on `@RequestBody` POJOs; `BindingResult` contains field errors. **Content negotiation:** `Accept: application/json` → Jackson, `Accept: application/xml` → JAXB (if on classpath). **Filter vs Interceptor:** Filter (Servlet API, before DispatcherServlet, raw request) vs `HandlerInterceptor` (Spring MVC, knows handler method, pre/post/afterCompletion).

### 🔴 Advanced
**Request processing deep dive in EHR:** Tomcat NIO connector accepts connection → assigns to thread pool (or virtual thread in Spring Boot 3.2+) → `StandardWrapperValve` → Spring `DispatcherServlet.doDispatch()` → `RequestMappingHandlerMapping` matches `PatientController.getPatient(String mrn)` → `JwtAuthenticationFilter` (registered as Spring Security filter, before DispatcherServlet) validates Bearer token → `SecurityContextHolder` stores `Authentication` in `ThreadLocal` → `CorsFilter` adds CORS headers → `DispatcherServlet` continues → `InvocableHandlerMethod.invokeForRequest()` resolves `@PathVariable mrn` from URI template, `@RequestHeader Authorization` → AOP `@PreAuthorize("hasRole('NURSE')")` checks `SecurityContext` → controller method → `PatientService.findByMrn()` → returns `PatientResponse` → `RequestResponseBodyMethodProcessor` uses `MappingJackson2HttpMessageConverter` to serialize → 200 OK.

**HATEOAS / REST maturity:** Level 0: remote procedure calls. Level 1: resources (`/patients/MRN-001`). Level 2: HTTP verbs (GET read, POST create, PUT replace, PATCH partial, DELETE remove). Level 3: hypermedia links (response includes next actions). Most EHR APIs: Level 2. `@PatchMapping` + `JsonMergePatch` for partial updates (only send changed fields — doctor updates only `status` field, not entire patient object).

**Versioning strategy:** URI (`/api/v1/`, `/api/v2/`) — explicit, visible in logs, easy to test. Header (`X-API-Version: 2`) — clean URLs, harder to test in browser. Content type (`Accept: application/vnd.ehr.v2+json`). EHR uses URI versioning — `/api/v1/patients` (current), `/api/v2/patients` (breaking change: different response shape). API Gateway routes both versions to same service; service routes internally by version prefix.

**`@ControllerAdvice` ordering:** Multiple `@RestControllerAdvice` classes — `@Order(1)` for most specific, higher number for broader handlers. Spring picks most specific `@ExceptionHandler` (subclass beats superclass). `ResponseEntityExceptionHandler` from Spring — extend it, override specific handlers (`handleMethodArgumentNotValid` for 400, `handleNoHandlerFoundException` for 404).

---

## TOPIC 12: Spring Security & JWT

### 🟢 Basic
Spring Security is a gatekeeper for your API. Without it, anyone can call any endpoint. With it, you define rules: "only logged-in users can see patient data" and "only doctors can delete records." **JWT (JSON Web Token)** is a digital stamp — when you log in, the server gives you a token (like a wristband at a concert). Every future request includes that token, and the server reads it to know who you are without checking a database every time.

### 🟡 Intermediate
**SecurityFilterChain:** ordered chain of filters, each request passes through all. Key filters: `CorsFilter`, `JwtAuthenticationFilter` (custom — validates JWT, sets `SecurityContext`), `ExceptionTranslationFilter` (converts Spring Security exceptions to 401/403). `SecurityContextHolder` stores `Authentication` (username + roles) in `ThreadLocal` — cleared after request. `UserDetailsService.loadUserByUsername()` loads user from DB on JWT validation. **JWT structure:** `header.payload.signature` — Base64 encoded. Header: algorithm (HS256/RS256). Payload: claims (`sub`, `roles`, `exp`, `iat`, custom: `userId`, `systemId`). Signature: HMAC of header+payload with secret (HS256) or RSA private key (RS256). Stateless: server validates signature without DB lookup → scalable. **`@PreAuthorize("hasRole('DOCTOR')")`** — method-level security via AOP; evaluated against `SecurityContext`. CSRF disabled for stateless APIs (JWT replaces CSRF protection). CORS configured in `SecurityFilterChain` — allowed origins, methods, headers.

### 🔴 Advanced
**JWT validation flow in EHR:** `JwtAuthenticationFilter extends OncePerRequestFilter` → extract `Authorization: Bearer <token>` header → `jwtService.validateToken(token)` → `Jwts.parserBuilder().setSigningKey(secretKey).build().parseClaimsJws(token)` → if expired: `ExpiredJwtException` → 401. If valid: extract `userId`, `roles` from claims → build `UsernamePasswordAuthenticationToken(userId, null, roles)` → `SecurityContextHolder.getContext().setAuthentication(auth)` → chain continues → controller `@PreAuthorize` reads from `SecurityContextHolder`.

**Token generation:** `Jwts.builder().setSubject(userId).claim("roles", roles).claim("systemId", "EHR").setIssuedAt(now).setExpiration(now.plus(15, MINUTES)).signWith(secretKey, HS256).compact()`. Short expiry (15min) + refresh token (7 days, stored in DB) → access token stolen = short window. Refresh token rotation: each refresh issues new refresh token and invalidates old.

**Password encoding:** `BCryptPasswordEncoder` — adaptive hash (cost factor), salt included in hash, slow by design (prevents brute force). `passwordEncoder.matches(rawPassword, storedHash)` for login. Never store plaintext. `encode()` generates new salt each call → same password produces different hash.

**RBAC in EHR:** Roles: `DOCTOR` (read/write patient, submit ECR), `NURSE` (read patient, record vitals), `LAB_TECH` (submit lab results), `ADMIN` (manage users, audit), `PATIENT` (read own records only). `@PreAuthorize("hasRole('DOCTOR') or hasRole('NURSE')")` on `getPatient`. `@PreAuthorize("@patientAccessChecker.canAccess(authentication, #mrn)")` — custom SpEL with bean method for row-level security (patient can only access own records). `@PostAuthorize("returnObject.mrn == authentication.name")` — check after method returns.

**OAuth2/OIDC for hospital SSO:** EHR integrates with hospital's Identity Provider (OKTA, Azure AD) via OAuth2 Authorization Code flow. JWT issued by IdP (RS256 signed). EHR validates with IdP's public key (JWKS endpoint). `spring-boot-starter-oauth2-resource-server` + `spring.security.oauth2.resourceserver.jwt.jwk-set-uri=https://hospital-idp/.well-known/jwks.json`.

---

## TOPIC 13: JPA & Hibernate

### 🟢 Basic
JPA/Hibernate lets you work with database records as Java objects, without writing SQL for basic operations. `@Entity` marks a class as a database table. `@Id` marks the primary key. When you call `patientRepository.save(patient)`, Hibernate converts it to an SQL INSERT. When you call `findById(1L)`, it becomes SELECT. Hibernate tracks changes to objects — if you change `patient.setEmail("new@mail.com")` inside a transaction, Hibernate automatically runs UPDATE at the end. Magic!

### 🟡 Intermediate
**Entity lifecycle:** New (not tracked) → Managed (in PersistenceContext, changes tracked) → Detached (context closed, changes ignored) → Removed (marked for DELETE). **`@OneToMany(mappedBy="patient", cascade=ALL, orphanRemoval=true)`** — `mappedBy` means this side doesn't own the foreign key (avoids duplicate column). `cascade=ALL` propagates save/delete to children. `orphanRemoval=true` deletes child when removed from parent collection. **FetchType:** `LAZY` (collection loaded on access — default for collections), `EAGER` (loaded with parent — default for `@ManyToOne`, `@OneToOne`). **N+1 problem:** 1 query for 100 patients + 100 queries for each patient's appointments = 101 queries. Fix: `JOIN FETCH` in JPQL, `@EntityGraph`, `@BatchSize`. **`@Transactional`:** begins transaction on method entry, commits on success, rolls back on `RuntimeException`. `readOnly=true` — Hibernate skips dirty checking, DB can optimize. `REQUIRES_NEW` — new transaction, suspends existing (for audit logs). **`@Version`** field — optimistic locking: UPDATE WHERE version=5 — throws `OptimisticLockException` if another transaction changed it.

### 🔴 Advanced
**PersistenceContext (L1 Cache):** scoped to one `EntityManager` (one transaction). `findById()` twice → same Java object returned (identity map — first-level cache). Dirty checking: on flush, Hibernate compares current state to snapshot taken at load time → issues UPDATE only for changed fields. `em.clear()` evicts all → re-read from DB on next access (needed in batch processing to prevent OOM). `em.flush()` forces SQL without committing — use before native queries that need to see JPA changes.

**L2 Cache (Second-Level Cache):** shared across `EntityManager` instances. `@Cache(usage=READ_WRITE)` on entity enables L2 caching. Provider: EhCache, Infinispan, Redis. Strategies: `READ_ONLY` (immutable data — `IcdCode`), `READ_WRITE` (frequent reads, occasional writes — `Doctor`), `NONSTRICT_READ_WRITE` (can tolerate brief stale reads). `@QueryHints({@QueryHint(name="org.hibernate.cacheable", value="true")})` on repository method — cache query results. Invalidated automatically on Hibernate-managed updates. Bypassed by `@Modifying` bulk updates and native SQL — must evict manually via `cacheManager.getCache("patients").clear()`.

**`@SequenceGenerator(allocationSize=50)`:** Hibernate pre-allocates 50 IDs per DB call → 1 sequence call per 50 inserts instead of 1 per insert. Massive INSERT throughput improvement. Hibernate 6: `pooled` optimizer default.

**Relationship gotchas:** `@ManyToMany` with `List` → Hibernate issues DELETE ALL + re-INSERT on any collection change. Fix: use `Set`. Bidirectional sync: always maintain both sides — `addAppointment(apt)` sets `apt.setPatient(this)` AND `appointments.add(apt)` — otherwise one side is stale. `orphanRemoval=true` on `@OneToMany` — when `patient.getAppointments().remove(apt)` → DELETE appointment from DB. Cascade: `PERSIST` (save patient → save appointments), `MERGE` (update patient → merge appointments), `REMOVE` (delete patient → delete appointments — be careful with shared references).

**Query optimization:** `@Query("SELECT p FROM Patient p JOIN FETCH p.appointments a WHERE p.status = 'ACTIVE'")` — single SQL JOIN, loads patients + appointments in one query. `@EntityGraph(attributePaths={"appointments", "appointments.doctor"})` on repository method — overrides fetch strategy for that query only. `@BatchSize(size=25)` on collection — when Hibernate does load appointments, it batches: `WHERE patient_id IN (id1...id25)` → N/25 queries instead of N. Detection: `spring.jpa.properties.hibernate.generate_statistics=true` → logs query count, first/second level cache stats.

**HikariCP pool:** min-idle = 5, max-pool = 10 (for 4-core EHR service). `connectionTimeout=30s` — throw if no connection available in 30s (don't hang forever). `maxLifetime=30m` — replace connections (prevents stale connections from DB-side timeout). `validationTimeout=5s` — test connection health before giving to app. Pool exhausted symptom: thread dump shows all HTTP threads `BLOCKED` at `HikariPool.getConnection()` → increase pool or find connection leak (`@Transactional` spanning HTTP call holds connection unnecessarily).

---

## TOPIC 14: SQL & Database

### 🟢 Basic
SQL is the language to talk to a relational database. `SELECT * FROM patients WHERE status = 'ACTIVE'` — get all active patients. `INSERT INTO patients (mrn, name) VALUES ('MRN-001', 'John')` — add patient. `UPDATE patients SET status = 'INACTIVE' WHERE mrn = 'MRN-001'` — change status. `DELETE FROM patients WHERE id = 1` — remove. JOIN connects two tables: `SELECT p.name, a.scheduled_at FROM patients p JOIN appointments a ON p.id = a.patient_id` — get patients with their appointments.

### 🟡 Intermediate
**ACID:** Atomicity (all or nothing), Consistency (valid state before+after), Isolation (concurrent transactions don't interfere), Durability (committed = persisted). **Isolation levels:** READ_UNCOMMITTED (dirty reads), READ_COMMITTED (PostgreSQL default — no dirty reads), REPEATABLE_READ (same row same value in transaction), SERIALIZABLE (highest — no phantoms). **Indexes:** B-tree (default, equality + range), Hash (equality only), GIN (full-text, arrays). Covering index — includes all queried columns, index-only scan. **JOIN types:** INNER (only matches), LEFT (all left + matching right, NULLs for no match), RIGHT, FULL OUTER. **Window functions:** `ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY date DESC)` — rank within group, no grouping. `LAG(value) OVER (...)` — previous row. `SUM() OVER (PARTITION BY ... ROWS UNBOUNDED PRECEDING)` — running total. **GROUP BY vs WINDOW:** GROUP BY collapses rows; window functions don't.

### 🔴 Advanced
**Query execution plan — `EXPLAIN ANALYZE`:** `Seq Scan` (full table scan — no index or not selective enough) vs `Index Scan` (uses index) vs `Index Only Scan` (covering index, no heap read — fastest). `Hash Join` (build hash table on smaller table, probe with larger) vs `Nested Loop` (good for small tables/index scans) vs `Merge Join` (both inputs sorted). In EHR: `EXPLAIN ANALYZE SELECT * FROM lab_results WHERE patient_id = 1 AND positive = true` — should show `Index Scan on idx_lab_results_patient_positive` not `Seq Scan`. If `Seq Scan` on 50M rows → critical performance issue → add composite index.

**Index strategy in EHR:**
```sql
-- Covering index for dashboard query (no heap read)
CREATE INDEX idx_appointments_covering
  ON appointments(patient_id, scheduled_at, status)
  INCLUDE (doctor_id, appointment_type);

-- Partial index (only index active patients — much smaller)
CREATE INDEX idx_patients_active_mrn
  ON patients(mrn) WHERE status = 'ACTIVE';

-- Composite index — column order matters (most selective first)
CREATE INDEX idx_lab_results_patient_date
  ON lab_results(patient_id, resulted_at DESC);
-- Supports: WHERE patient_id = ? ORDER BY resulted_at DESC (index scan, no sort)
-- Does NOT efficiently support: WHERE resulted_at > ? (no patient_id prefix)
```

**Window functions in EHR:**
```sql
-- Latest lab result per patient per test code
SELECT * FROM (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY patient_id, test_code
      ORDER BY resulted_at DESC
    ) AS rn
  FROM lab_results
) WHERE rn = 1;

-- Trend: compare current vs previous result
SELECT patient_id, test_code, result_value,
  LAG(result_value) OVER (
    PARTITION BY patient_id, test_code
    ORDER BY resulted_at
  ) AS previous_value,
  result_value - LAG(result_value) OVER (
    PARTITION BY patient_id, test_code ORDER BY resulted_at
  ) AS change
FROM lab_results;
```

**Partitioning for large tables:** `appointments` table with 500M rows → range partition by year:
```sql
CREATE TABLE appointments_2024 PARTITION OF appointments
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```
Queries with `WHERE scheduled_at > '2024-01-01'` only scan `appointments_2024` — partition pruning. Old partitions can be archived (detach + export to S3).

**ACID in distributed systems (CAP):** PostgreSQL = CA (CP when partitioned). Single-node PostgreSQL: full ACID. Read replicas (streaming replication): eventual consistency — replica may lag seconds behind primary. Route `readOnly=true` transactions to replica, critical reads (medication, allergy) to primary. **Optimistic locking at DB level:** `WHERE version = :expectedVersion` in UPDATE — returns 0 rows if concurrent update changed version → application detects 0 rows → retry.

---

## TOPIC 15: Microservices Architecture

### 🟢 Basic
Microservices means splitting a big application into small, independent services — each doing one thing. EHR System: `ehr-service` (patient records), `ecr-service` (case reporting), `lab-service` (lab results), `notification-service` (alerts). Each runs separately, communicates over HTTP or messages. Like splitting a hospital into departments — each department works independently but coordinates when needed. If one department is slow, others keep working. Easier to update one service without affecting others.

### 🟡 Intermediate
**Service Discovery (Eureka):** services register at startup, query registry to find each other (no hardcoded IPs). Client-side load balancing via Spring Cloud LoadBalancer. **API Gateway (Spring Cloud Gateway):** single entry point — JWT auth, rate limiting, routing, SSL termination. **Feign Client:** declarative HTTP client — interface + annotations, Spring generates implementation. **Circuit Breaker (Resilience4j):** CLOSED (normal) → OPEN (fail fast after failures) → HALF-OPEN (test recovery). Prevents cascade failures. **Kafka** for async event-driven communication between services (lab results → ECR processing). **Distributed tracing:** `traceId` propagated in headers (Micrometer Tracing + Zipkin/Jaeger) — trace request across services. **Saga pattern:** distributed transactions — compensating transactions on failure (Choreography: event-driven; Orchestration: central coordinator). **CQRS:** write model (PostgreSQL) ≠ read model (Elasticsearch/Redis).

### 🔴 Advanced
**Service mesh concerns:** mTLS between services (each service presents certificate to authenticate), centralized traffic management (Istio/Linkerd), retry/circuit breaker at infrastructure level (not just application). In EHR Kubernetes: `Istio` sidecar proxy on each pod handles mTLS — services communicate securely without application-level SSL code.

**Event-driven architecture in EHR:** Lab service publishes `LabResultSubmitted` event to Kafka `lab-results` topic with `patientMrn` as key (ordering guarantee per patient). ECR Service consumes — `@KafkaListener` with `ConsumerRecord` + manual `Acknowledgment`. After successful processing: `ack.acknowledge()` commits offset. On `DuplicateReportException` (already submitted — idempotency): `ack.acknowledge()` still (skip, don't fail). On `FhirBuildException` (transient): don't ack → Kafka redelivers after `session.timeout.ms`. After 3 retries: `@RetryableTopic` routes to DLT. DLT consumer logs to Elasticsearch, triggers PagerDuty alert, queues for manual review.

**Saga — Patient Registration choreography:** EHR publishes `PatientRegistered` → Billing Service creates account, publishes `BillingAccountCreated` → Insurance Service verifies, publishes `InsuranceVerified` → EHR marks registration complete. Failure: Insurance publishes `InsuranceVerificationFailed` → Billing compensates (`BillingAccountCancelled`) → EHR marks registration failed. Each step persists event to its own DB before publishing — **Outbox Pattern**: write event to `outbox` table in same transaction as business data → separate process polls and publishes → guaranteed at-least-once without distributed 2PC.

**API Gateway JWT filter:** `JwtGatewayFilter implements GlobalFilter` — highest precedence. Extracts `Authorization: Bearer` header → validates JWT → extracts `userId`, `roles` → mutates request: `.header("X-User-Id", userId).header("X-User-Roles", roles)` → downstream services trust these headers (internal network, gateway is the only entry point). Downstream services don't re-validate JWT — just read `X-User-Id` header. This also means: never expose downstream services directly — only through gateway.

**Distributed tracing — correlation:** `Micrometer Tracing` auto-instruments: `traceId` + `spanId` added to MDC (every log line), propagated in HTTP headers (`traceparent` W3C standard or `X-B3-TraceId` B3 format), added to Kafka record headers. In ELK: `traceId:abc123` query shows every log line across EHR, ECR, Lab services for that patient registration request — instant cross-service debugging.

---

## TOPIC 16: Kafka & Messaging

### 🟢 Basic
Kafka is a message bus — services publish events and other services consume them. Like a bulletin board: lab service posts "COVID test positive for MRN-001" → ECR service sees the note and reports it to public health → audit service sees the note and logs it. Nobody coordinates directly — they all just watch the bulletin board. This way, even if ECR service is down, the note stays on the board until ECR recovers. Messages are never lost.

### 🟡 Intermediate
**Kafka concepts:** **Topic** — named channel for messages. **Partition** — topics split into N partitions for parallelism. **Offset** — position in partition (never decreases). **Consumer Group** — N consumers sharing topic consumption; each partition assigned to one consumer; parallelism = min(partitions, consumers). **Producer** — publishes to topic with optional key (key determines partition — same key always goes to same partition → ordering guarantee per key). **Broker** — Kafka server storing partitions. **Replication** — each partition replicated to `replication.factor` brokers. **ISR (In-Sync Replicas)** — replicas caught up with leader. `acks=all` — producer waits for all ISR to acknowledge. **Consumer offset commit** — `enable.auto.commit=false` + manual `ack.acknowledge()` — process-then-ack (at-least-once). **DLT (Dead Letter Topic)** — messages that fail after all retries routed here. **Idempotent producer** (`enable.idempotence=true`) — exactly-once producer semantics (deduplication by sequence number).

### 🔴 Advanced
**Kafka producer flow in EHR:** `KafkaTemplate.send("lab-results", patientMrn, labResultEvent)` → serialized to JSON (or Avro) → `ProducerRecord` sent to `NetworkClient` → batched (up to `linger.ms=5` or `batch.size=16384`) → sent to partition leader broker → broker writes to log → replicates to ISR followers → all ISR ack → broker sends `RecordMetadata` (topic, partition, offset) to producer callback. `acks=all` + `enable.idempotence=true` = exactly-once producer. `retries=3` with `retry.backoff.ms=100` — auto-retries on transient broker errors.

**Kafka consumer flow — at-least-once delivery:** `@KafkaListener` → `ConsumerRecord<String, LabResultEvent>` → process (save to DB, call ECR-NOW) → `ack.acknowledge()` → commit offset to `__consumer_offsets` internal topic. If service crashes between process and ack: message redelivered on restart → **idempotent consumer** required. Deduplication: Redis `SET ecr:processed:{messageId} NX EX 86400` — if already processed (key exists), skip. **`@RetryableTopic(attempts=3, backoff=@Backoff(delay=1000, multiplier=2))`:** Spring creates `lab-results-retry-1000`, `lab-results-retry-2000`, `lab-results.DLT` topics automatically. Failed message routed through retry topics with delay → DLT after exhaustion.

**Partition strategy in EHR:** `lab-results` topic: 12 partitions, key = `patientMrn`. All events for same patient → same partition → consumed in order by same ECR consumer instance → no concurrent processing of same patient's events. Consumer group `ecr-consumers` has 6 instances → each handles 2 partitions. Rebalancing: when instance joins/leaves → partition reassignment → brief pause. `partition.assignment.strategy=StickyAssignor` — minimizes partition movements during rebalance.

**Kafka vs RabbitMQ vs SQS:** Kafka = distributed log (replay, multiple consumer groups, time-based retention, high throughput). RabbitMQ = message broker (complex routing, per-message TTL, priority, request-reply). SQS = managed queue (AWS, no ops, at-least-once standard or exactly-once FIFO). EHR uses Kafka for `lab-results` (multiple consumers: ECR + audit + analytics) and RabbitMQ for appointment reminders (complex routing: email vs SMS vs push, TTL — don't send reminder for past appointments).

---

## TOPIC 17: Redis & Caching

### 🟢 Basic
Redis is a super-fast in-memory database — like RAM instead of hard disk. Reads are 100x faster than PostgreSQL. In EHR: when a doctor requests a patient's profile, check Redis first. If there (cache hit) — return instantly. If not (cache miss) — read from PostgreSQL, store in Redis for next time. Redis also does: distributed locks (only one server processes the same ECR report at once), rate limiting (hospital can only call our API 100 times/minute), session storage (user's login session).

### 🟡 Intermediate
**Spring Cache abstraction:** `@Cacheable("patients")` — on cache hit, skip method entirely, return cached value. `@CacheEvict("patients")` — remove from cache on update/delete. `@CachePut("patients")` — always call method AND update cache. `@Caching` — combine multiple cache annotations. `condition` and `unless` SpEL: `@Cacheable(condition="#mrn != null", unless="#result == null")`. `RedisCacheConfiguration` per cache: TTL, key prefix, `Jackson2JsonRedisSerializer`. **Distributed lock:** `SET lockKey uniqueId NX PX 30000` — atomic, expires in 30s. `Redisson RLock` — watchdog extends TTL while lock held, clean unlock. **Rate limiting:** `INCR key; EXPIRE key 60` — count requests in 60s window. Spring Cloud Gateway `RequestRateLimiter` filter uses Redis token bucket. **ZSet (Sorted Set):** leaderboard — `ZADD key score member`, `ZREVRANGEBYSCORE` for top N.

### 🔴 Advanced
**Redis data structures and EHR uses:** `String` — patient cache (JSON), session token, rate limit counter, distributed lock. `Hash` — user session fields (`HSET session:abc userId "123" roles "DOCTOR,NURSE"`). `List` — ECR submission queue (LPUSH + BRPOP for blocking consumer). `Set` — online users, reportable ICD codes (O(1) `SISMEMBER`). `ZSet (Sorted Set)` — priority queue by urgency score, leaderboard of most-accessed patients, time-series with timestamp as score.

**Cache eviction policies in depth:** `allkeys-lru` — evict any key, least recently used first (good for general cache). `volatile-lru` — only evict keys with TTL set, LRU (for mix of permanent + cached data). `allkeys-lfu` — evict least frequently used (good when access pattern is stable — ICD codes). `volatile-ttl` — evict key closest to expiry (aggressive cleanup). `noeviction` — return `OOM command not allowed` error when full — NEVER use this for EHR cache (service fails). Set `maxmemory 256mb` + `maxmemory-policy allkeys-lru` for EHR patient cache.

**Redis persistence modes:** `RDB` (snapshotting) — periodic dump to `.rdb` file, fast restart but data loss between snapshots. `AOF` (Append-Only File) — log every write, replay on restart, near-zero data loss, larger files. `AOF + RDB` — recommended for production: fast restart from RDB + recent writes from AOF. In EHR: Redis cache — patient data reconstructable from DB → RDB only (acceptable loss). Redis session store — `AOF` required (losing sessions = logged-out users). Redis distributed lock — TTL handles recovery naturally.

**Multi-level caching in EHR:** L1 = Caffeine in-process cache (nanoseconds, 1000 entries max, per JVM instance). L2 = Redis cluster (sub-millisecond, shared across all 6 EHR instances). L3 = PostgreSQL read replica. Cache miss path: L1 miss → L2 check → L2 miss → L3 query → populate L2 + L1. Invalidation: on patient update → DB write → Redis `DEL patients::MRN-001` → Redis pub/sub `PUBLISH cache-invalidation "patients::MRN-001"` → all EHR instances subscribe → each clears own Caffeine L1 for that key → next request refills from L2 or L3.

---

## TOPIC 18: Resilience Patterns

### 🟢 Basic
Systems fail. ECR-NOW (the government reporting system) might be slow or down. Without resilience, one slow external call blocks all our users. **Circuit Breaker** is like an electrical breaker: if ECR-NOW fails too much, the breaker "trips" (opens) and we stop trying — return a fallback immediately. After a while, we test again (half-open). If it's back, the breaker closes. **Retry** — if a call fails due to a brief network hiccup, try again automatically. **Timeout** — never wait forever; if ECR-NOW doesn't respond in 10 seconds, give up.

### 🟡 Intermediate
**Resilience4j annotations:** `@CircuitBreaker(name="ecr-now", fallbackMethod="submitFallback")` — intercepts calls, tracks failures, trips breaker. `@Retry(name="ecr-now")` — retries on specified exceptions with configured backoff. `@TimeLimiter(name="ecr-now")` — wraps in future with timeout. `@Bulkhead(name="ecr-now", type=THREADPOOL)` — limits concurrent calls to separate thread pool. **Stack order:** `@RateLimiter → @Bulkhead → @CircuitBreaker → @Retry → @TimeLimiter`. Configured in `application.yml` under `resilience4j.*`. State transitions: **CLOSED** (counting failures in sliding window) → **OPEN** (failureRate > threshold → fast fail, no calls) → **HALF-OPEN** (after waitDuration, permit N test calls) → CLOSED (tests pass) or OPEN (tests fail). **Fallback:** queue to DB when circuit open — process later when ECR-NOW recovers.

### 🔴 Advanced
**Circuit breaker configuration in EHR:**
```yaml
resilience4j.circuitbreaker.instances.ecr-now:
  slidingWindowType: COUNT_BASED
  slidingWindowSize: 10           # Last 10 calls
  failureRateThreshold: 60        # Trip at 60% failure
  waitDurationInOpenState: 30s    # Wait 30s before HALF-OPEN
  permittedNumberOfCallsInHalfOpenState: 3
  slowCallDurationThreshold: 5s   # Slow calls count as failures
  slowCallRateThreshold: 80       # Trip if 80% calls are slow
  recordExceptions:
    - java.net.ConnectException
    - java.net.SocketTimeoutException
  ignoreExceptions:
    - com.ecr.ValidationException  # Don't count validation errors as failures
```

**Bulkhead — preventing cascade failure:** Without bulkhead: 20 slow ECR-NOW calls consume all 20 HTTP threads → no threads left for patient CRUD → entire EHR unresponsive. With bulkhead: ECR-NOW gets its own `ThreadPoolBulkhead` of 10 threads. If all 10 busy → `BulkheadFullException` → fallback immediately. HTTP threads never touched. SEMAPHORE bulkhead: same thread, limits concurrent calls via semaphore (lighter, no thread isolation).

**Retry — only for transient failures:** Exponential backoff: attempt 1 immediate, attempt 2 after 1s, attempt 3 after 4s (multiplier=4). Add jitter (`+/- 20%` random) — prevents thundering herd (all retries hitting recovered service simultaneously). **Never retry:** validation errors (same input will fail again), authentication errors (credentials won't change), business logic errors (`PatientAlreadyExistsException`). **Retry with `@Transactional`:** place `@Retry` OUTSIDE `@Transactional` — each retry gets a fresh transaction. `@Retry` inside `@Transactional` retries within same (already-failed) transaction — pointless.

**Saga compensation in EHR:** ECR submission saga: Step 1: create `CaseReport` record (DB, status=PENDING). Step 2: build FHIR bundle (in-memory). Step 3: submit to ECR-NOW (external). Step 4: update `CaseReport` (status=SUBMITTED). If Step 3 fails after 5 retries → compensate: update `CaseReport` status=FAILED, publish `EcrSubmissionFailed` event → EHR clinician notified → manual resubmission available. If Step 3 times out (unknown if submitted): idempotency key check first → if ECR-NOW received it → mark SUBMITTED. Otherwise retry.

---

## TOPIC 19: Testing

### 🟢 Basic
Testing means writing code that checks your code works correctly. **Unit test** — test one class in isolation (no real database, no real network). Use Mockito to fake (mock) dependencies: `when(patientRepository.findByMrn("MRN-001")).thenReturn(Optional.of(patient))`. **Integration test** — test the full flow with real dependencies. **Spring Boot test slices:** `@WebMvcTest` — only the web layer (no DB). `@DataJpaTest` — only the DB layer (no web). `@SpringBootTest` — everything. TestContainers starts real Docker containers (PostgreSQL, Kafka) for tests.

### 🟡 Intermediate
**JUnit 5:** `@Test`, `@BeforeEach`/`@AfterEach` (before/after each test), `@BeforeAll`/`@AfterAll` (once per class), `@DisplayName`, `@Disabled`, `@Timeout`. `assertThrows(ExceptionType.class, () -> svc.method())` — verify exception thrown. `assertAll("group", () -> assertEquals(...), () -> assertNotNull(...))` — all assertions run even if one fails. `@ParameterizedTest` + `@ValueSource`/`@CsvSource`/`@MethodSource` — run test with multiple inputs. **Mockito:** `@Mock` (unit test mock), `@MockBean` (Spring context mock replaces real bean). `when(mock.method(arg)).thenReturn(value)`. `verify(mock).method(captor.capture())`. `ArgumentCaptor<T>` — capture argument passed to mock, assert on it. `@Spy` — wraps real object, can stub specific methods. **Test slices:** `@WebMvcTest` + `MockMvc` — test controller without starting server. `@DataJpaTest` + `TestEntityManager` — test repository with H2 or TestContainers. `@SpringBootTest(webEnvironment=RANDOM_PORT)` + `TestRestTemplate` — full end-to-end.

### 🔴 Advanced
**Test pyramid in EHR:** 70% unit tests (fast, no Spring context, pure Mockito — `PatientService`, validators, mappers, domain logic). 20% slice tests (`@WebMvcTest` for controllers: auth, validation, error responses; `@DataJpaTest` with TestContainers PostgreSQL for repositories: complex JPQL, pagination, bulk updates). 10% integration tests (`@SpringBootTest` with full TestContainers stack: PostgreSQL + Kafka + Redis — critical flows like patient registration → lab result → ECR submission).

**ArgumentCaptor in depth:** verifying what ECR service received:
```java
ArgumentCaptor<EcrSubmission> captor = ArgumentCaptor.forClass(EcrSubmission.class);
verify(ecrService).submit(captor.capture());
EcrSubmission submission = captor.getValue();
assertEquals("MRN-001", submission.getPatientMrn());
assertNotNull(submission.getFhirBundle());
assertTrue(submission.getFhirBundle().contains("\"resourceType\":\"Bundle\""));
```

**TestContainers singleton pattern** — start containers once for all tests (not per class):
```java
static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");
static { postgres.start(); }  // Static block — started once, shared
```
`@DynamicPropertySource` overrides Spring's `spring.datasource.url` with container's URL. Tests are 10x faster than per-class container startup.

**`@SpringBootTest` + `@MockBean`:** full context loaded, but `EcrNowClient` replaced with mock. Test the real `EcrService` logic (including `@Transactional`, `@Cacheable`) but without calling real ECR-NOW. `@SpyBean EcrService` — real service, but can stub/verify specific methods. `@Sql("/test-data.sql")` — load SQL fixtures before test. `@Transactional` on test method — rolls back after test (no data pollution between tests). But: `@Transactional` on test + `REQUIRES_NEW` in service = separate transaction in service commits before test rolls back → data pollution. Solution: explicit cleanup `@AfterEach` or `@Sql(executionPhase=AFTER_TEST_METHOD, statements="DELETE FROM...")`.

**Contract testing with Pact:** EHR Service (consumer) and ECR Service (provider) define contract: "EHR sends this request, ECR returns this response." Consumer generates pact file. Provider verifies against it. Prevents integration surprises — ECR team changes response schema → Pact tests fail before deployment. Critical in EHR microservices — 6 services, 15+ API contracts to maintain.

---

## TOPIC 20: Docker & Kubernetes

### 🟢 Basic
Docker packages your application and everything it needs (Java, libraries, config) into one box called a **container**. Same container works on your laptop, staging, and production — "works on my machine" problem solved. **Kubernetes (K8s)** manages many containers: starts them, restarts them if they crash, scales them up when busy, scales down when quiet. Like a container orchestrator — if EHR service gets 1000 users, K8s automatically starts more copies.

### 🟡 Intermediate
**Docker:** `Dockerfile` defines the image. Multi-stage build: Stage 1 (builder — `maven:3.9`) compiles code. Stage 2 (runtime — `eclipse-temurin:21-jre-alpine`) copies only the JAR — small final image. `EXPOSE 8080`. `HEALTHCHECK` via `wget /actuator/health`. Non-root user (`adduser ehruser`) for HIPAA security. `docker-compose.yml` orchestrates local dev: EHR service + PostgreSQL + Redis + Kafka + ZooKeeper, `depends_on` with `condition: service_healthy`. **Kubernetes:** **Pod** (1+ containers sharing network). **ReplicaSet** (ensures N pods running). **Deployment** (manages rolling updates, rollbacks). **Service** (stable DNS + load balancing). **ConfigMap** (non-secret config). **Secret** (sensitive data, base64). **Ingress** (HTTP routing rules). **HPA** (Horizontal Pod Autoscaler — scale by CPU/custom metric). Rolling update: `maxSurge=1, maxUnavailable=0` → zero downtime. `kubectl rollout undo` for instant rollback.

### 🔴 Advanced
**Dockerfile multi-stage in depth:** Layer caching — `COPY pom.xml .` + `RUN mvn dependency:go-offline` before `COPY src/` — dependencies cached unless `pom.xml` changes. Only `src/` changes invalidate later layers. Final image: `eclipse-temurin:21-jre-alpine` (~200MB vs JDK ~500MB). Non-root user mandatory for HIPAA: `RUN addgroup -S ehrgroup && adduser -S ehruser -G ehrgroup; USER ehruser`. Container-aware JVM flags: `-XX:+UseContainerSupport` (reads cgroup memory limits from K8s), `-XX:MaxRAMPercentage=75.0` (75% of container limit for heap, leaves room for off-heap: Metaspace, thread stacks, NIO buffers, Netty direct memory).

**Kubernetes Deployment — zero-downtime rolling update:** `strategy.rollingUpdate.maxUnavailable=0` → never remove old pod before new one healthy. `strategy.rollingUpdate.maxSurge=1` → 1 extra pod during update (4 pods total during rollout if replicas=3). `readinessProbe` gates traffic: new pod only added to Service endpoints when readiness probe passes (`/actuator/health/readiness` returns UP). **Startup probe** (`failureThreshold=30, periodSeconds=10` = 5 min) handles slow JVM startup without killing pod via livenessProbe. **Liveness probe** detects deadlock/hung process → restart pod (but NOT during startup — startupProbe takes over first).

**Resource requests vs limits:** `requests.memory=512Mi` — guaranteed allocation (K8s scheduler uses this for placement). `limits.memory=1Gi` — hard cap. Exceeding limit → `OOMKilled` → pod restarts. For JVM: set `limits.memory` > `Xmx` + overhead (Metaspace ~256m + threads ~100m + NIO/Netty ~100m). Recommended: `limits.memory=1.5 × Xmx`. CPU limit throttling: exceeding CPU limit → CPU throttled (not killed) → latency spike. Consider `requests.cpu` without `limits.cpu` in production (burst when available).

**HPA with custom metrics:** `kubectl get hpa` — current/desired replicas. Default CPU-based: scale when avg CPU > 70%. Custom metric: ECR queue depth via Prometheus adapter → `metrics.type=External, metric.name=ecr_queue_depth` → scale out when queue > 1000 unprocessed messages. KEDA (Kubernetes Event-Driven Autoscaler) — scale based on Kafka consumer lag directly.

---

## TOPIC 21: System Design Fundamentals

### 🟢 Basic
System design is planning how to build a large application that works for millions of users. Like designing a hospital — how many rooms, how many nurses, where's the pharmacy. For software: where does data go, how do services communicate, what happens when something breaks. Key questions: How many users? How much data? How fast must it respond? Can we lose data? Must it work 24/7?

### 🟡 Intermediate
**Framework:** Clarify requirements (functional + non-functional) → estimate scale (RPS, storage, bandwidth) → define API → high-level design (boxes + arrows) → deep dive components → identify bottlenecks + fix. **Key decisions:** SQL vs NoSQL, sync vs async (HTTP vs Kafka), consistency vs availability (CAP theorem), caching strategy, horizontal vs vertical scaling. **Numbers:** 1M requests/day ≈ 12 RPS. Redis < 1ms. DB query 1-10ms. Cross-region 150ms. 99.99% = 52 min downtime/year. **Caching strategies:** Cache-aside (app manages: check → miss → DB → cache). Write-through (write cache AND DB). Write-behind (write cache, async DB). **Database scaling:** Read replicas, connection pooling (HikariCP), partitioning (range/hash), sharding (extreme scale). **CAP:** Consistency + Partition = reject requests on partition (CP). Availability + Partition = serve stale data on partition (AP).

### 🔴 Advanced
**Back-of-envelope for EHR:** 100k clinicians × 20 patients/day = 2M interactions/day ÷ 86,400s = ~23 writes/sec. Read:write = 10:1 → 230 reads/sec. PostgreSQL handles 10k+ TPS — no sharding needed. Cache hot patients (5% of 50M = 2.5M) × 10KB = 25GB Redis. ECR submissions: 50k/day ÷ 86,400 = 0.6/sec (Kafka easily handles). Storage: 50M patients × 10KB = 500GB (single PostgreSQL node, partitioned). 10 years + audit logs → 5TB → archival partitions to S3.

**Consistency decisions in EHR:** Patient allergy list → **strong consistency** (CP, PostgreSQL primary read — wrong allergy could kill). Patient appointment count on dashboard → **eventual consistency** (AP, Redis cache stale by seconds — acceptable). ECR submission status → **read-your-writes** (after submitting, user sees pending status immediately — sticky to primary for that user). Audit log → **at-least-once** (Kafka → Elasticsearch, may have brief lag, must not lose).

**Database design decisions:** PostgreSQL (core EHR data — ACID, complex JOINs, FK constraints, HIPAA compliance). Redis (cache, sessions, rate limiting, distributed locks). Elasticsearch (full-text patient search, audit log search). S3 (FHIR bundles, immutable, cheap, durable). Kafka (event log, durable, replayable, decoupling). Never Cassandra for EHR core (complex JOINs impossible, no foreign keys, eventual consistency unsafe for medical records).

**Failure modes and mitigations:** ECR-NOW down → circuit breaker opens → queue to DB → retry when recovered (no data loss). PostgreSQL primary fails → automatic failover to replica (60s downtime) → K8s readiness probe removes from LB during failover. Redis cluster node fails → Redis Cluster with 3 masters + 3 replicas → automatic failover, 1 node can die without downtime. Kafka broker fails → replication factor 3, min ISR 2 → 1 broker can die, no data loss. Region failure → multi-region active-passive with Route53 health checks → failover in ~2 min (RTO).

---

## TOPIC 22: Design Patterns

### 🟢 Basic
Design patterns are proven solutions to common coding problems. Like building recipes — you don't invent from scratch every time. **Singleton** — only one instance exists (Spring beans). **Factory** — create objects without specifying exact class. **Builder** — build complex objects step by step (`Patient.builder().mrn("MRN-001").name("John").build()`). **Observer** — when something happens, notify many listeners (Kafka events). **Strategy** — swap algorithms/behaviors at runtime (different payment processors). **Proxy** — wrap an object to add behavior (Spring AOP adds transaction management to your service).

### 🟡 Intermediate
**Creational:** Singleton (one instance per context — Spring singleton beans), Factory Method (subclass decides object — `CaseReporter.forCondition(code)`), Abstract Factory (family of objects — different DB factories for prod/test), Builder (step-by-step construction — Lombok `@Builder`), Prototype (clone — `patient.clone()` for draft records). **Structural:** Adapter (bridge incompatible — wrap HL7v2 to FHIR), Decorator (add behavior — AOP logging/security), Proxy (control access — `@Transactional` CGLIB proxy), Facade (simplify — `EhrFacade` hides 5 services), Composite (tree — FHIR Bundle containing resources). **Behavioral:** Observer (event notification — Spring `ApplicationEventPublisher`), Strategy (swappable algorithm — `Map<String, PaymentProcessor>`), Template Method (algorithm skeleton — `CaseReporter.submit()` calling abstract `buildPayload()`), Command (encapsulate request — `SubmitEcrCommand`), Chain of Responsibility (request pipeline — Spring Security filter chain), State (state machine — Circuit Breaker CLOSED/OPEN/HALF-OPEN).

### 🔴 Advanced
**Template Method in EHR:** `CaseReporter` abstract class:
- `submit()` — final template: `validatePatient()` → `buildPayload()` (abstract) → `callApi()` → `persistResult()`. `CovidCaseReporter`, `MeaslesCaseReporter` extend and implement `buildPayload()` with condition-specific FHIR structure. Adding new reportable condition = new subclass, no change to `submit()` template. **Open/Closed principle** in action.

**Strategy via DI map:** `@Autowired Map<String, EcrReporter> reporters` → Spring injects `{"covidEcrReporter": CovidEcrReporter, "measlesEcrReporter": MeaslesEcrReporter}`. `reporters.get(conditionCode + "EcrReporter").report(event)` — runtime dispatch without if-else chain. Adding new condition = new `@Service` bean, no change to dispatch code.

**Outbox Pattern (reliability):** Publish event + save DB record atomically. Without: `save(patient)` succeeds, `kafkaTemplate.send()` fails → DB has patient, Kafka has nothing → inconsistency. With Outbox: `@Transactional { save(patient); save(OutboxEvent(PATIENT_REGISTERED, patientId)); }` — both in same transaction. Separate `OutboxPoller` reads unpublished outbox events, publishes to Kafka, marks published. Guaranteed at-least-once event delivery without distributed transaction.

**Repository Pattern (Spring Data JPA):** `PatientRepository extends JpaRepository<Patient, Long>` — data access abstraction. Domain layer depends on `PatientRepository` interface, not Hibernate. In tests: `@Mock PatientRepository` replaces real DB. Spring provides implementation at runtime. **Specification Pattern:** `Specification<Patient>` lambdas composed with `.and()`, `.or()`, `.not()` — dynamic queries without query strings. `PatientSpecifications.hasStatus(ACTIVE).and(hasInsurance("MEDICAID")).and(bornBetween(start, end))` → runtime-built JPQL WHERE clause.

---

## TOPIC 23: Modern Java (9–21)

### 🟢 Basic
Java keeps improving every version. `var` (Java 10) — write `var list = new ArrayList<>()` instead of `ArrayList<Patient> list = new ArrayList<Patient>()` — less typing, same safety. **Records** (Java 16) — easy way to create simple data classes: `record PatientDto(String mrn, String name) {}` — Java auto-creates constructor, getters, equals, hashCode, toString. **Text blocks** (Java 15) — write multiline SQL/JSON without ugly escape characters. **Virtual Threads** (Java 21) — handle millions of requests simultaneously with simple code (no complex async code needed). **Sealed classes** (Java 17) — a type that only certain classes can extend, making code safer and more complete.

### 🟡 Intermediate
**Java 9:** `List.of()`, `Set.of()`, `Map.of()` — immutable collection factories. `Stream.takeWhile()`, `dropWhile()`, `ofNullable()`. `Optional.or()`, `ifPresentOrElse()`, `stream()`. Module system (JPMS). **Java 10:** `var` — local type inference, zero runtime cost. **Java 11:** `String.strip()`, `isBlank()`, `repeat()`. HTTP Client (async, HTTP/2). LTS. **Java 14:** Switch expressions (stable — arrow syntax, returns value, no fall-through). **Java 15:** Text blocks (stable). **Java 16:** Records (stable), `instanceof` pattern matching (`if (obj instanceof Patient p)`). **Java 17:** Sealed classes (stable). LTS. **Java 21:** Virtual threads (stable — `spring.threads.virtual.enabled=true`), Pattern matching switch (stable — `case Patient p when p.active()`), Record patterns, Sequenced Collections (`getFirst()`, `getLast()`). LTS.

### 🔴 Advanced
**Records deep dive:** `record EcrSubmission(String patientMrn, String conditionCode, LocalDate date)` → compiler generates: canonical constructor, `patientMrn()`, `conditionCode()`, `date()` accessors, `equals()` (field-by-field), `hashCode()`, `toString()`. Compact constructor for validation: `EcrSubmission { Objects.requireNonNull(patientMrn); }` — runs before auto-assignment. Records are `final`, implicitly extend `java.lang.Record`. Can implement interfaces, have static methods/fields, additional instance methods. Cannot: extend classes, have mutable fields (all `private final`), add instance fields. With Jackson: add `@JsonIgnoreProperties(ignoreUnknown=true)` on record. Spring Boot 3.x: `@ConfigurationProperties` works with records.

**Sealed classes + pattern matching = exhaustive type handling:**
```java
sealed interface EcrStatus permits Pending, Submitted, Failed, Rejected {}
// switch over EcrStatus: compiler error if case missing — no more missed states
String describe(EcrStatus s) {
  return switch (s) {
    case Pending p -> "Pending since " + p.since();
    case Submitted s2 -> "Reference: " + s2.referenceId();
    case Failed f when f.attempts() >= 3 -> "ESCALATE";
    case Failed f -> "Retry: " + f.reason();
    case Rejected r -> "Rejected: " + r.agencyCode();
  };
}
```
This replaces Visitor pattern — exhaustive handling without double dispatch complexity.

**Virtual Threads — production implications:** Traditional Spring MVC with platform threads: `server.tomcat.threads.max=200` → max 200 concurrent requests. With virtual threads: effectively unlimited concurrent requests (each gets its own virtual thread, unmounts on IO). `spring.threads.virtual.enabled=true` in Spring Boot 3.2 switches Tomcat, `@Async`, `@Scheduled` to virtual threads. Critical pitfall: HikariCP connection pool — even with millions of virtual threads, DB can only handle `maxPoolSize` concurrent connections → DB becomes bottleneck, not thread count. Keep pool at `num_cores * 2`. `ThreadLocal` replacement: `ScopedValue` (Java 21 preview) — bound to execution scope, not thread, naturally garbage collected, safe for millions of virtual threads.

**Java 21 `SequencedCollection`:** `List`, `Deque`, `LinkedHashSet`, `LinkedHashMap` all implement `SequencedCollection`. Uniform API: `getFirst()`, `getLast()`, `addFirst()`, `addLast()`, `removeFirst()`, `removeLast()`, `reversed()`. In EHR: `appointments.getLast()` (most recent), `labResults.reversed()` (chronological → reverse-chronological view without sorting). Works on all ordered collections uniformly — no more `list.get(0)` vs `deque.peekFirst()` inconsistency.
