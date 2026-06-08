# T03 — COLLECTIONS, THREADING & JAVA 8+ TERMS
> Format: **TERM** — definition | 🧒 analogy | 💬 how to use it

---

## CATEGORY 5: COLLECTION FRAMEWORK TERMS

**Collection Framework** — Java's unified architecture of interfaces and classes for storing and manipulating groups of objects. Root: `java.util.Collection` and `java.util.Map`.
> 💬 *"Always use the Collection Framework — never reinvent with arrays unless you have a specific performance reason."*

**List** — Ordered collection. Allows duplicates. Access by index. Implementations: `ArrayList`, `LinkedList`.
> 💬 *"Use `List` when order matters or you need indexed access."*

**Set** — Unordered collection (except `TreeSet`/`LinkedHashSet`). NO duplicates. Backed by hashing or trees.
> 💬 *"We store userId's in a `Set` to ensure uniqueness without manual duplicate checks."*

**Map** — Key-value pairs. Keys must be unique. Values can be duplicates. NOT a `Collection` — it's a separate hierarchy.
> 💬 *"We use `Map<String, User>` to cache users by username for O(1) lookup."*

**Queue** — FIFO (first in, first out) ordering. Methods: `offer()` (add), `poll()` (remove head), `peek()` (view head).
> 💬 *"We process jobs from a `BlockingQueue` — producers add tasks, consumers process them."*

**Deque (Double-Ended Queue)** — Can add/remove from BOTH ends. Acts as both Stack and Queue. `ArrayDeque` is preferred over `Stack` class.
> 💬 *"`ArrayDeque` is faster than `Stack` and `LinkedList` for stack/queue operations — use it."*

**Iterator** — Object to traverse a collection sequentially. Has `hasNext()`, `next()`, `remove()`. Safe way to delete while iterating.
> 💬 *"Use `Iterator.remove()` to delete elements during traversal — direct `list.remove()` during loop throws `ConcurrentModificationException`."*

**Enumeration** — Legacy iterator. Only `hasMoreElements()` + `nextElement()`. Used in old APIs like `Hashtable`, `Vector`. Replace with `Iterator`.
> 💬 *"Enumeration is from Java 1.0 — in modern code, use Iterator or enhanced for-loop."*

**Comparable** — Interface for natural ordering. Implemented BY the class. `compareTo(T other)`. Used by `Collections.sort()` and `TreeSet`/`TreeMap`.
> 💬 *"`Employee` implements `Comparable<Employee>` to sort by salary by default."*

**Comparator** — Separate ordering strategy. Implemented OUTSIDE the class. `compare(T o1, T o2)`. Multiple orderings possible.
> 💬 *"We have 3 Comparators for User: by name, by age, by joinDate — switched at runtime."*

**HashMap** — Key-value store. No order. O(1) average for get/put. Allows one null key. NOT thread-safe.
> 💬 *"HashMap is our go-to for O(1) lookups but we avoid it in multi-threaded code without synchronization."*

**LinkedHashMap** — HashMap + maintains INSERTION ORDER (or access order). Slightly slower than HashMap.
> 💬 *"We use `LinkedHashMap` for building ordered JSON responses where field order matters."*

**TreeMap** — Sorted Map by key (natural order or Comparator). O(log n) ops. No null keys.
> 💬 *"We use `TreeMap` for the rate table — keys are ranges and we need them sorted."*

**Hashtable** — Legacy synchronized HashMap. No null keys/values. Use `ConcurrentHashMap` instead.
> 💬 *"Avoid `Hashtable` in new code — it's legacy. Use `ConcurrentHashMap` for thread safety."*

**ConcurrentHashMap** — Thread-safe HashMap. Segment-level locking (Java 7) / node-level locking (Java 8). No null key/value. High concurrency.
> 💬 *"We use `ConcurrentHashMap` for the shared session cache — multiple threads read/write safely."*

**ArrayList** — Resizable array. O(1) random access. O(n) insert/delete in middle. Initial capacity 10, grows by 50%.
> 💬 *"ArrayList is best when reads dominate and you don't frequently insert in the middle."*

**LinkedList** — Doubly linked list. O(1) insert/delete at head/tail. O(n) random access. Implements both `List` and `Deque`.
> 💬 *"LinkedList is best when you frequently add/remove from the front — e.g., implementing a queue."*

**HashSet** — Backed by HashMap. No duplicates, no order. O(1) add/contains/remove.
> 💬 *"We use HashSet to track processed IDs — O(1) `contains()` is much faster than `List.contains()`."*

**LinkedHashSet** — HashSet that maintains insertion order.
> 💬 *"LinkedHashSet when you need unique elements AND the order they were added."*

**TreeSet** — Sorted Set. Elements ordered naturally or by Comparator. O(log n) ops.
> 💬 *"TreeSet auto-sorts strings alphabetically — no need for manual sort."*

**PriorityQueue** — Queue ordered by priority (min-heap by default). `poll()` always returns smallest.
> 💬 *"We use PriorityQueue to always process the highest-priority job next."*

**CopyOnWriteArrayList** — Thread-safe list. Every write = copy the entire backing array. Reads are lock-free. Best for read-heavy, write-rare scenarios.
> 💬 *"We store event listeners in `CopyOnWriteArrayList` — listeners rarely change but are iterated on every event."*

---

## CATEGORY 6: HASHMAP INTERNAL TERMS

**Hashing** — Converting any input to a fixed-size integer (hash code). Good hash = uniform distribution, minimizes collisions.
> 💬 *"Hashing is the core of HashMap performance — O(1) lookup relies on good hash distribution."*

**Hash Function** — Algorithm that converts a key to an integer. Java uses `Object.hashCode()`.
> 💬 *"A poor hash function that always returns the same value degrades HashMap to O(n) linked list."*

**Hash Code** — Integer produced by `hashCode()`. Same object → same hashCode. Equal objects → MUST have same hashCode.
> 💬 *"We override `hashCode()` and `equals()` together — if two objects are equal, they must hash to the same bucket."*

**Bucket** — A slot in HashMap's internal array. Each bucket holds a linked list (or tree) of entries with the same array index.
> 💬 *"HashMap has 16 buckets by default. The hash is mapped to a bucket index using `(n-1) & hash`."*

**Collision** — Two different keys hash to the same bucket index. Handled by chaining (linked list) or tree (when chain grows large).
> 💬 *"If many keys hash to the same bucket, you get collision — HashMap degrades from O(1) to O(n)."*

**Chaining** — Collision resolution: each bucket holds a linked list of entries. O(n) in worst case (all keys same bucket).
> 💬 *"HashMap uses chaining for collision resolution. Since Java 8, long chains become Red-Black Trees."*

**Load Factor** — Ratio of (entries / capacity) at which HashMap resizes. Default: 0.75. At 75% full → resize.
> 💬 *"Load factor 0.75 balances memory and performance. Lower = fewer collisions but more memory."*

**Capacity** — Number of buckets in HashMap's internal array. Default: 16. Always a power of 2.
> 💬 *"If you know the size upfront, initialize with `new HashMap<>(expectedSize * 4/3 + 1)` to avoid resizing."*

**Rehashing** — When HashMap resizes, all existing keys are re-hashed and redistributed into the new, larger array.
> 💬 *"Rehashing is expensive — O(n). Pre-size your HashMap if you know the expected number of entries."*

**Resize** — HashMap doubles its capacity (and rehashes all entries) when load factor is exceeded.
> 💬 *"Avoid frequent resizing in performance-critical code by specifying initial capacity."*

**Treeification** — When a single bucket's linked list exceeds 8 entries, it's converted to a Red-Black Tree. Improves worst-case from O(n) to O(log n).
> 💬 *"Treeification protects against hash collision attacks that could degrade HashMap to O(n)."*

**Red-Black Tree** — Self-balancing binary search tree used in HashMap (Java 8+) when buckets have >8 entries. Also backing structure for `TreeMap` and `TreeSet`.
> 💬 *"Red-Black Tree guarantees O(log n) worst case — that's why TreeMap is always O(log n)."*

**Node / Entry** — A single key-value pair stored in HashMap. `Map.Entry<K,V>` contains key, value, hash, and next pointer.
> 💬 *"Iterating `map.entrySet()` gives you `Map.Entry` objects — more efficient than iterating keys then calling `get()`."*

**Key Equality** — Two keys are considered the same if `equals()` returns true AND they have the same `hashCode()`. Both must be correct.
> 💬 *"Key equality breaks if you override `equals()` but forget `hashCode()` — you'll have duplicate keys in the map."*

---

## CATEGORY 7: MULTITHREADING TERMS

**Thread** — Smallest unit of execution within a process. A JVM process can run many threads concurrently.
> 🧒 Thread = a worker. Process = the factory. Multiple workers in one factory.
> 💬 *"Each HTTP request in Spring is handled by a separate thread from the thread pool."*

**Process** — An independent program with its own memory space. JVM runs as one process. Multiple threads share that process's memory.
> 💬 *"Threads within a process share heap memory. Processes are isolated — communication via IPC or network."*

**Runnable** — Functional interface for a task: `void run()`. No return value, no checked exceptions. Use with `Thread` or `ExecutorService`.
> 💬 *"We prefer `Runnable` for fire-and-forget tasks and `Callable` when we need a result."*

**Callable** — Like `Runnable` but returns a value (`V call() throws Exception`). Submitted to `ExecutorService`. Returns a `Future`.
> 💬 *"We use `Callable` for concurrent DB queries — each returns a `Future<List<Result>>`."*

**Future** — Represents a pending async result. Methods: `get()` (blocks), `isDone()`, `cancel()`.
> 💬 *"Calling `future.get()` blocks the current thread until the result is ready — watch for deadlocks."*

**CompletableFuture** — Java 8 async programming. Chain operations without blocking. Methods: `thenApply`, `thenAccept`, `thenCompose`, `exceptionally`, `allOf`, `anyOf`.
> 💬 *"We replaced callback hell with `CompletableFuture` chains — much more readable async code."*

**Executor Framework** — Framework for managing thread lifecycle and pools. `ExecutorService` is the main interface.
> 💬 *"Never create raw threads in production code. Use `ExecutorService` for proper resource management."*

**Thread Pool** — Pre-created group of reusable threads. Avoids expensive thread creation overhead.
> 💬 *"The thread pool processes requests from the queue. Pool size: 10 threads, queue: 100 tasks."*

**Fixed Thread Pool** — `Executors.newFixedThreadPool(n)` — exactly N threads. Excess tasks queue up.
> 💬 *"Fixed pool of 10 for CPU-bound tasks (CPU cores + 1 rule)."*

**Cached Thread Pool** — `Executors.newCachedThreadPool()` — creates threads on demand, reuses idle ones. No bound on thread count. Risky under high load.
> 💬 *"Cached thread pool is dangerous under load spikes — it can create thousands of threads. Prefer fixed pool."*

**Fork Join Pool** — Specialized pool for divide-and-conquer tasks. Work-stealing algorithm. Used by `parallelStream()` and `RecursiveTask`.
> 💬 *"Parallel streams use the common Fork Join Pool — be careful with blocking operations inside parallel streams."*

**Concurrency** — Multiple tasks making PROGRESS simultaneously (may not run at exactly the same instant). About managing shared state.
> 💬 *"Concurrency is about structure — even on single core, you can have concurrent threads through context switching."*

**Parallelism** — Multiple tasks running at EXACTLY the same instant on multiple CPU cores.
> 💬 *"Parallelism requires multiple cores. `parallelStream()` achieves parallelism for CPU-bound operations."*

**Context Switching** — CPU saves current thread state and switches to another thread. Expensive. Too many threads = too much context switching overhead.
> 💬 *"We saw high CPU with low throughput — profiling showed excessive context switching from too many threads."*

**Synchronization** — Mechanism to ensure only one thread accesses shared data at a time. `synchronized` keyword or `Lock`.
> 💬 *"Without synchronization, two threads incrementing a counter give wrong results due to race conditions."*

**Race Condition** — Bug where result depends on unpredictable thread scheduling. Two threads read-modify-write shared data, producing wrong output.
> 🧒 Race condition = two people editing the same Google Doc simultaneously — one overwrites the other's change.
> 💬 *"The counter was wrong in load tests — classic race condition. Fixed with `AtomicInteger`."*

**Deadlock** — Thread A holds Lock 1, waits for Lock 2. Thread B holds Lock 2, waits for Lock 1. Both stuck forever.
> 💬 *"We avoid deadlock by always acquiring locks in the same order across all threads."*

**Starvation** — A thread never gets CPU time because higher-priority threads always take the resources.
> 💬 *"Thread starvation can happen when a low-priority thread is always preempted. Use fair locks."*

**Livelock** — Threads keep responding to each other but make no progress. Like two people in a hallway both stepping aside for each other.
> 💬 *"Livelock is harder to detect than deadlock — threads aren't blocked but nothing gets done."*

**Mutual Exclusion** — Only one thread can be in a critical section at a time. The fundamental goal of locks.
> 💬 *"Mutual exclusion prevents race conditions but reduces concurrency — only lock what's necessary."*

**Critical Section** — A code block that accesses shared mutable state and must not run concurrently.
> 💬 *"Keep critical sections as small as possible to minimize lock contention."*

**Thread Safety** — Code behaves correctly when called from multiple threads simultaneously.
> 💬 *"Is `SimpleDateFormat` thread-safe? No — use `DateTimeFormatter` (Java 8) which is thread-safe."*

**Atomic Operation** — An operation that completes entirely or not at all, with no intermediate state visible to other threads. `AtomicInteger.incrementAndGet()` is atomic.
> 💬 *"Simple `count++` is NOT atomic — it's 3 operations: read, increment, write. Use `AtomicInteger`."*

**Volatile** — Keyword guaranteeing a variable is always read from main memory, not thread's local cache. Guarantees visibility NOT atomicity.
> 💬 *"We mark the `running` flag as `volatile` so all threads immediately see when it's set to false."*

**Synchronized** — Keyword for mutual exclusion. On method = lock on `this`. On static method = lock on class object. On block = lock on specified object.
> 💬 *"`synchronized` gives both visibility and atomicity — heavier than `volatile` but complete."*

**Lock** — More flexible alternative to `synchronized`. `ReentrantLock` supports tryLock, fairness, interruptible lock waits.
> 💬 *"We use `ReentrantLock` with `tryLock(timeout)` to avoid infinite blocking."*

**ReentrantLock** — Explicit lock that the same thread can re-acquire without deadlocking (reentrant). Supports fairness (FIFO ordering).
> 💬 *"ReentrantLock with `fairness=true` prevents starvation but reduces throughput."*

**Semaphore** — Controls access to a limited resource pool. Initialized with N permits. `acquire()` takes one, `release()` returns one.
> 💬 *"We use a `Semaphore(5)` to limit concurrent calls to the external API to 5 at a time."*

**CountDownLatch** — One-time barrier. Main thread calls `await()`. Worker threads call `countDown()`. When count reaches 0, main continues.
> 💬 *"CountDownLatch waits for all N services to finish initialization before starting the server."*

**CyclicBarrier** — N threads all wait at a barrier point. When all arrive, they all continue together. Can be reused (cyclic).
> 💬 *"CyclicBarrier synchronizes parallel computations — all threads must complete phase 1 before any starts phase 2."*

---

## CATEGORY 8: JAVA 8+ TERMS

**Lambda Expression** — Anonymous function: `(params) -> expression`. Enables functional-style programming.
> 🧒 Lambda = a shortcut. Instead of writing a whole class for one method, you write just the logic.
> 💬 *"We replaced anonymous inner classes with lambdas — reduced boilerplate by 60%."*

**Functional Interface** — Interface with exactly ONE abstract method. Can be used as a lambda target. `@FunctionalInterface` annotation (optional but recommended).
> 💬 *"Any single-abstract-method interface is a functional interface — that's why we can use lambdas for `Runnable`."*

**Stream API** — Functional pipeline for processing collections. Lazy (nothing runs until terminal op). Supports filter, map, reduce, collect.
> 💬 *"We replaced loops with Stream API — the intent is clearer: filter active users, map to DTOs, collect to list."*

**Method Reference** — Shorthand for lambdas calling a single method. 4 types: static, instance, class-instance, constructor.
> 💬 *"`String::toUpperCase` is a method reference — cleaner than `s -> s.toUpperCase()`."*

**Optional** — Container that may or may not hold a non-null value. Eliminates `null` checks and NullPointerExceptions.
> 💬 *"We return `Optional<User>` from repository — callers must handle the empty case explicitly."*

**Predicate** — `T → boolean`. Tests a condition. `filter()` takes a Predicate.
> 💬 *"We compose predicates: `isActive.and(isVerified).and(isAdult)` — readable business logic."*

**Function** — `T → R`. Transforms input to output. `map()` takes a Function.
> 💬 *"`Function<User, UserDto>` converts domain objects to DTOs in the stream pipeline."*

**Consumer** — `T → void`. Consumes input, produces nothing. `forEach()` takes a Consumer.
> 💬 *"Use `Consumer` for side effects like logging each element: `list.forEach(log::info)`."*

**Supplier** — `() → T`. Produces a value, no input. Used in `Optional.orElseGet()`.
> 💬 *"`orElseGet(() -> computeDefault())` is lazy — the supplier only runs if Optional is empty."*

**Default Method** — Interface method with implementation (`default` keyword). Enables adding new methods to interfaces without breaking existing implementations.
> 💬 *"Java 8 added `default` methods to `Collection` — like `forEach()` — without breaking every implementing class."*

**Static Method in Interface** — Utility methods on the interface itself. Called as `Interface.method()`, not on instances.
> 💬 *"`Comparator.comparing()` is a static interface method — cleaner than factory classes."*

**Parallel Stream** — Stream processed concurrently using Fork Join Pool. `list.parallelStream()`. Faster for CPU-bound, large collections. Be careful with shared state and ordering.
> 💬 *"We use parallel streams for the CSV batch processing — 4x speedup on 8-core machine. Avoid for IO-bound tasks."*

**Collectors** — Terminal operations that collect Stream elements into a result: `toList()`, `toSet()`, `toMap()`, `groupingBy()`, `joining()`, `counting()`.
> 💬 *"`Collectors.groupingBy(User::getDept, Collectors.counting())` — headcount per department in one line."*

**Spliterator** — Iterator for Streams that supports splitting for parallel processing. `tryAdvance()` + `trySplit()`. Rarely used directly.
> 💬 *"Custom Spliterators let you parallelize non-standard data sources in Stream pipelines."*

**CompletableFuture** *(also in threading)* — Async computation chain. `supplyAsync → thenApply → thenAccept → exceptionally`. Non-blocking alternative to `Future.get()`.
> 💬 *"We chain CompletableFutures for the 3 independent API calls — they run in parallel, then we join results."*
