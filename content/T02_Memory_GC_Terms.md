# T02 — JAVA MEMORY & GARBAGE COLLECTION TERMS
> Format: **TERM** — definition | 🧒 analogy | 💬 how to use it

---

## CATEGORY 3: JAVA MEMORY TERMS

**Heap Memory** — The main memory pool where all OBJECTS live. Shared across all threads. Managed by GC. Configurable with `-Xmx` (max) and `-Xms` (initial).
> 🧒 Heap = a big warehouse. Every time you do `new Something()`, a box is placed in the warehouse.
> 💬 *"We increased the heap size to 4GB with `-Xmx4g` because the service was getting OutOfMemoryError."*

**Stack Memory** — Per-thread memory for method call frames. Holds local variables, method arguments, return addresses. Automatically managed (no GC).
> 🧒 Stack = your desk. Each method call = a sticky note on your desk. When method returns, you peel it off.
> 💬 *"Each thread gets its own stack. Stack variables are thread-safe by nature — no sharing."*

**Metaspace** — Memory area (outside Heap) holding class metadata, method bytecode, static variables. Replaced PermGen in Java 8. Grows dynamically by default.
> 💬 *"After migrating to Java 8, we saw Metaspace filling up from too many dynamically loaded classes — likely a classloader leak."*

**PermGen (Permanent Generation)** — Pre-Java 8 area that stored class metadata. Had a fixed size. `OutOfMemoryError: PermGen space` was common. Replaced by Metaspace.
> 💬 *"In Java 7 and earlier, deploying too many times to a running server caused PermGen leaks."*

**Object Reference** — A variable holding the memory address (pointer) of an object on the Heap. The reference lives on Stack; the object lives on Heap.
> 🧒 Reference = a sticky note with the warehouse address. The actual box is in the warehouse.
> 💬 *"When you pass an object to a method, you're passing the reference, not a copy of the object."*

**Memory Allocation** — The process of reserving memory space. In Java, `new` allocates on Heap. Primitives allocate on Stack.
> 💬 *"Java handles memory allocation automatically — no `malloc` like in C."*

**Memory Leak** — Objects remain referenced (usually accidentally) and can't be GC'd, causing Heap to fill up over time.
> 🧒 Memory leak = buying clothes but never throwing old ones away. Eventually closet is full.
> 💬 *"We found a memory leak — the static `Map` was caching results but never evicting them."*

**OutOfMemoryError** — JVM can't allocate more memory. Types: `Java heap space` (Heap full), `Metaspace` (class metadata full), `GC overhead limit exceeded` (too much time in GC).
> 💬 *"The OOM was triggered by loading a 2GB file into memory. We refactored to stream it."*

**StackOverflowError** — Thread's stack exceeded its limit. Caused by infinite or very deep recursion.
> 💬 *"The StackOverflowError pointed to infinite recursion in our tree traversal — missing the base case."*

**Garbage Collection (GC)** — Automatic process of finding and freeing memory used by objects with no more references. Developer doesn't `free()` memory — JVM does it.
> 🧒 GC = a janitor who periodically walks through the warehouse and removes unclaimed boxes.
> 💬 *"GC pauses caused our latency spikes. We switched to ZGC for sub-millisecond pauses."*

**GC Root** — Starting points for GC's reachability analysis. Objects reachable from GC roots are kept; others are collected. Roots include: active thread stacks, static variables, JNI references.
> 💬 *"To find a memory leak, analyze which GC root is keeping objects alive unexpectedly."*

**Reachable Object** — An object reachable from any GC root via a chain of references. Will NOT be collected.
> 💬 *"Even if you think an object is done, if it's referenced by a static collection it's reachable and won't be GC'd."*

**Unreachable Object** — No reference path from any GC root. Eligible for garbage collection.
> 💬 *"Once the request scope ends, those objects become unreachable and eligible for GC."*

**Young Generation** — Part of Heap for newly created objects. GC here is fast (Minor GC). Split into: Eden + Survivor S0 + Survivor S1.
> 💬 *"Most objects die young — that's the generational hypothesis. Young Gen GC is frequent but fast."*

**Old Generation (Tenured)** — Part of Heap for long-lived objects that survived multiple Young Gen GCs. GC here is slower (Major GC).
> 💬 *"Objects that survive 15 GC cycles are promoted to Old Gen. Old Gen GC is expensive — avoid frequent Full GCs."*

**Eden Space** — Where new objects are FIRST allocated in Young Generation. Most objects die here.
> 💬 *"Eden fills up fast — a Minor GC runs, survivors move to Survivor space, Eden is cleared."*

**Survivor Space** — Two spaces (S0, S1) in Young Gen. Objects that survive Eden GC bounce between S0 and S1. After enough bounces → promoted to Old Gen.
> 💬 *"Each GC cycle, live objects from Eden + one Survivor space are copied to the other Survivor space."*

---

## CATEGORY 4: GARBAGE COLLECTION TERMS

**Stop The World (STW)** — All application threads PAUSE while GC runs. The main cause of GC-related latency spikes.
> 🧒 STW = a teacher saying "everyone stop writing, I'm erasing the board."
> 💬 *"Full GC caused a 2-second STW pause, which triggered client timeouts. We need to tune or switch GC algorithms."*

**Minor GC** — Garbage collection in Young Generation. Frequent, fast (milliseconds). Application pauses briefly.
> 💬 *"Minor GC is expected to run every few seconds. If it's running every 100ms, you're allocating too aggressively."*

**Major GC** — Garbage collection in Old Generation. Less frequent but slower. Often causes longer STW pauses.
> 💬 *"We saw Major GC running every 30 minutes — that's acceptable. Every 30 seconds is a problem."*

**Full GC** — Collects ALL generations (Young + Old + Metaspace). Slowest. Should be rare. Triggered by: low memory, `System.gc()` call, fragmentation.
> 💬 *"Full GC every hour in prod is fine. Full GC every 5 minutes means memory pressure — investigate heap usage."*

**Mark Phase** — GC traverses all objects reachable from GC roots and marks them as live.
> 💬 *"During the Mark phase, all reachable objects are flagged. Everything unmarked is garbage."*

**Sweep Phase** — GC reclaims memory of unmarked (dead) objects. Result: memory freed but possibly fragmented.
> 💬 *"Mark-Sweep is simple but leaves fragmentation — blocks of free memory scattered, can't fit large objects."*

**Compact Phase** — GC moves all live objects together to eliminate fragmentation. Expensive but cleans up Sweep fragmentation.
> 💬 *"G1 GC compacts incrementally to avoid long STW pauses from full compaction."*

**CMS GC (Concurrent Mark Sweep)** — Old Gen GC that does most work concurrently with app threads. Lower pause times but leaves fragmentation. Deprecated in Java 9, removed in Java 14.
> 💬 *"We migrated from CMS to G1 for better predictable pause times and no fragmentation issues."*

**G1 GC (Garbage First)** — Default GC since Java 9. Divides Heap into equal-sized regions. Targets predictable pause times. Compacts incrementally. Best all-around choice.
> 💬 *"G1 GC is our default — it gives predictable sub-200ms pauses with good throughput."*

**ZGC** — Low-latency GC (Java 11+). Does almost all work concurrently. Sub-millisecond pauses even on terabyte heaps. Use for latency-critical apps.
> 💬 *"We switched to ZGC for the trading service — we need <1ms GC pauses."*

**Shenandoah GC** — Low-latency GC from RedHat (Java 12+). Similar to ZGC — concurrent compaction. Competes with ZGC for ultra-low latency.
> 💬 *"Shenandoah and ZGC are both good choices for low-latency requirements. We benchmarked both."*

**Throughput** — Amount of work done per unit time. High throughput = less time in GC, more time running app. Parallel GC maximizes throughput.
> 💬 *"For batch jobs, we use Parallel GC — throughput matters more than pause times."*

**Latency** — Time for a single operation to complete. Low latency = fast response. Conflicts with throughput — optimizing one often hurts the other.
> 💬 *"Our SLA requires p99 latency under 100ms. With Serial GC, a Full GC would breach that."*

**Pause Time** — How long the application is stopped during GC. Short pause time = more responsive app. G1/ZGC minimize this.
> 💬 *"Our max acceptable pause time is 200ms. We tuned G1 with `-XX:MaxGCPauseMillis=200`."*

**Memory Fragmentation** — Free memory scattered in small chunks. Can't allocate a large object even if total free space is enough. Solved by Compaction.
> 🧒 Fragmentation = parking lot with spots scattered. A bus can't park even if total empty space is big enough.
> 💬 *"CMS GC was causing memory fragmentation — eventually leading to Full GC for compaction."*

**Concurrent Collection** — GC runs some phases while application threads continue (not fully STW). G1/ZGC/Shenandoah are concurrent collectors.
> 💬 *"Concurrent collection means the app keeps running during most of the GC work — only short STW pauses."*
