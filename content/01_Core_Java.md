# 01 — CORE JAVA
> 🧒 = Explain like a 12-year-old | ⚠️ = Interview trap | 🔁 = Rebuild from memory

---

## TOPIC TRACKER
| # | Topic | Status |
|---|-------|--------|
| 1 | OOP — 4 Pillars | ⬜ |
| 2 | Java Memory & GC | ⬜ |
| 3 | Collections Framework | ⬜ |
| 4 | Generics | ⬜ |
| 5 | Exception Handling | ⬜ |
| 6 | Multithreading & Concurrency | ⬜ |
| 7 | Java 8+ (Lambdas, Streams, Optional) | ⬜ |
| 8 | String & Immutability | ⬜ |
| 9 | Interface vs Abstract Class | ⬜ |
| 10 | JVM Internals | ⬜ |
| 11 | Access Modifiers & Keywords | ⬜ |
| 12 | Comparable vs Comparator | ⬜ |

> ⬜ Not started | 🟥 Confused | 🟨 Shaky | 🟩 Got it

---

## 1. OOP — 4 PILLARS

### Encapsulation — hide data, expose methods
```java
class BankAccount {
    private double balance;                       // hidden
    public double getBalance() { return balance; } // exposed
    public void deposit(double amt) { balance += amt; }
}
```
> 🧒 Like a vending machine. You press buttons, you don't reach inside.

### Inheritance — child gets parent's features
```java
class Animal { void eat() { System.out.println("eating"); } }
class Dog extends Animal { void bark() { System.out.println("woof"); } }
// Dog can eat() AND bark()
```
> Java supports SINGLE inheritance only (one parent class). Use interfaces for multiple.

### Polymorphism — same name, different behavior
```java
// Runtime polymorphism (overriding)
class Animal { void sound() { System.out.println("..."); } }
class Dog extends Animal { @Override void sound() { System.out.println("woof"); } }

Animal a = new Dog();
a.sound(); // "woof" — decided at RUNTIME

// Compile-time polymorphism (overloading)
class Math {
    int add(int a, int b) { return a + b; }
    double add(double a, double b) { return a + b; } // same name, different params
}
```

### Abstraction — show WHAT, hide HOW
```java
abstract class Shape {
    abstract double area(); // no body — must implement in subclass
    void print() { System.out.println("Area: " + area()); } // concrete
}
class Circle extends Shape {
    double r;
    double area() { return Math.PI * r * r; }
}
```

### ⚠️ Traps
- Overriding = same method signature in child class (runtime).
- Overloading = same method name, different params (compile time).
- `super.method()` calls parent's version. `this` = current object.
- Constructor is NOT inherited. But parent constructor runs via `super()`.
- `final` class can't be extended. `final` method can't be overridden.

---

## 2. JAVA MEMORY & GC

### Memory Layout
```
JVM Memory
├── Heap            ← all objects (new Dog(), new String())
│   ├── Young Gen   ← new objects
│   │   ├── Eden    ← freshly created
│   │   └── Survivor S0, S1
│   └── Old Gen     ← long-lived objects
├── Stack           ← method frames, local variables, references
├── Method Area     ← class definitions, static fields, constants
├── PC Register     ← current instruction pointer per thread
└── Native Stack    ← JNI native method calls
```

> 🧒 Heap = warehouse. Stack = your desk. Each method call = a sticky note on your desk. Done = peel it off.

### Garbage Collection
- GC runs when no references point to an object.
- Cannot force: `System.gc()` is just a hint.
- **Minor GC** = cleans Young Gen (fast). **Major/Full GC** = cleans Old Gen (slow, stop-the-world).

### GC Algorithms
| Algorithm | When to use |
|-----------|------------|
| Serial GC | Single-threaded, small apps |
| Parallel GC | Multi-core, throughput focus |
| G1 GC | Default since Java 9, balanced |
| ZGC | Low latency, Java 11+ |

### ⚠️ Traps
- `StackOverflowError` = too deep recursion.
- `OutOfMemoryError: Java heap space` = heap full.
- Primitives (`int`, `boolean`, `double`) = Stack. Objects = Heap.
- References (pointers) = Stack. Actual objects = Heap.
- `static` variables = Method Area (not GC'd unless class unloaded).

---

## 3. COLLECTIONS FRAMEWORK

### Hierarchy
```
Iterable
└── Collection
    ├── List           → ordered, allows duplicates
    │   ├── ArrayList      ← array-backed, fast get(i), O(1)
    │   ├── LinkedList     ← doubly linked, fast add/remove, O(n) get
    │   └── Vector         ← synchronized ArrayList (legacy)
    ├── Set            → no duplicates
    │   ├── HashSet        ← no order, O(1) ops, uses hashCode/equals
    │   ├── LinkedHashSet  ← insertion order
    │   └── TreeSet        ← sorted (natural or Comparator), O(log n)
    └── Queue          → FIFO
        ├── PriorityQueue  ← sorted by priority (min-heap by default)
        ├── ArrayDeque     ← fast stack/queue, prefer over Stack class
        └── LinkedList     ← also implements Queue

Map (separate hierarchy)
├── HashMap            ← no order, null key OK, O(1), not thread-safe
├── LinkedHashMap      ← insertion order
├── TreeMap            ← sorted by key, O(log n)
├── Hashtable          ← legacy, synchronized, no null key
└── ConcurrentHashMap  ← thread-safe, segment-locked, no null key/value
```

### Common Operations
```java
// List
List<String> list = new ArrayList<>(Arrays.asList("b","a","c"));
Collections.sort(list);          // [a, b, c]
list.sort(Comparator.reverseOrder()); // [c, b, a]

// Map
Map<String, Integer> map = new HashMap<>();
map.put("one", 1);
map.getOrDefault("two", 0);      // 0 if missing
map.putIfAbsent("one", 99);      // won't overwrite
map.forEach((k, v) -> System.out.println(k + "=" + v));

// Set
Set<Integer> set = new HashSet<>(Arrays.asList(1,2,3));
set.retainAll(Arrays.asList(2,3,4)); // intersection → [2,3]
```

### HashMap Internals
```
HashMap internally uses an array of "buckets" (LinkedList/TreeNode)
1. key.hashCode() → index in array
2. If collision → LinkedList in that bucket
3. If bucket size > 8 → converts to Red-Black Tree (Java 8+)
Default capacity: 16, load factor: 0.75
When 75% full → resize (double) + rehash
```
> 🧒 HashMap = a filing cabinet. hashCode() tells which drawer. equals() finds exact file.

### ⚠️ Traps
- `HashMap` vs `Hashtable`: HashMap allows null key, not synchronized. Hashtable no null, synchronized (legacy).
- If you override `equals()`, you MUST override `hashCode()` — or HashMap/HashSet breaks.
- `ArrayList` initial capacity = 10, grows by 50% when full.
- `ConcurrentModificationException` if you modify a collection while iterating. Use `Iterator.remove()` or `CopyOnWriteArrayList`.
- `Collections.unmodifiableList()` = read-only view. `List.of()` (Java 9) = truly immutable.

---

## 4. GENERICS

```java
// Generic class
class Pair<A, B> {
    A first; B second;
    Pair(A first, B second) { this.first = first; this.second = second; }
}
Pair<String, Integer> p = new Pair<>("age", 30);

// Generic method
<T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) > 0 ? a : b;
}

// Wildcards
void printList(List<?> list) { ... }           // unknown type, read-only
void sum(List<? extends Number> nums) { ... }  // Number or subclass (read)
void add(List<? super Integer> list) { ... }   // Integer or superclass (write)
```

> **PECS Rule**: Producer = `extends` (read). Consumer = `super` (write).

### ⚠️ Traps
- Generics are **erased at runtime** (type erasure). `List<String>` becomes `List` at bytecode level.
- Can't do `new T()` or `T[]` — type not known at runtime.
- `List<String>` is NOT a subtype of `List<Object>`. Use wildcards.

---

## 5. EXCEPTION HANDLING

### Hierarchy
```
Throwable
├── Error              ← JVM problems, DON'T catch
│   ├── OutOfMemoryError
│   └── StackOverflowError
└── Exception
    ├── Checked        ← must handle or declare throws
    │   ├── IOException
    │   └── SQLException
    └── RuntimeException (Unchecked) ← optional
        ├── NullPointerException
        ├── ArrayIndexOutOfBoundsException
        ├── ClassCastException
        └── IllegalArgumentException
```

```java
try {
    riskyMethod();
} catch (IOException e) {
    log.error("IO failed", e);
} catch (SQLException | IllegalArgumentException e) { // multi-catch
    throw new RuntimeException("DB error", e);        // wrap & rethrow
} finally {
    cleanup(); // always runs
}

// try-with-resources (auto-closes Closeable)
try (Connection conn = getConnection();
     PreparedStatement ps = conn.prepareStatement(sql)) {
    ps.executeQuery();
} // both closed automatically

// Custom exception
class UserNotFoundException extends RuntimeException {
    UserNotFoundException(Long id) {
        super("User not found: " + id);
    }
}
```

### ⚠️ Traps
- `finally` runs even after `return`. Exception in `finally` swallows original exception.
- Checked = declared in method signature with `throws`. Unchecked = not required.
- Never catch `Throwable` or `Error`. Never catch `Exception` silently (empty catch).
- `throw` = throw an exception. `throws` = declare method may throw.

---

## 6. MULTITHREADING & CONCURRENCY

### Creating Threads
```java
// 1. Extend Thread (bad — wastes inheritance)
class MyThread extends Thread { public void run() { ... } }
new MyThread().start();

// 2. Implement Runnable (good)
new Thread(() -> System.out.println("task")).start();

// 3. ExecutorService (best — use this in production)
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<String> future = pool.submit(() -> "result");
String result = future.get(); // blocks until done
pool.shutdown();

// 4. CompletableFuture (Java 8+, best for async chains)
CompletableFuture<String> cf = CompletableFuture
    .supplyAsync(() -> fetchData())
    .thenApply(data -> process(data))
    .exceptionally(ex -> "fallback");
```

### Synchronization
```java
// synchronized method
class Counter {
    private int count = 0;
    public synchronized void increment() { count++; }
}

// synchronized block (better — narrower scope)
synchronized(this) { count++; }

// Lock (more flexible)
ReentrantLock lock = new ReentrantLock();
lock.lock();
try { count++; }
finally { lock.unlock(); } // always unlock in finally!

// Atomic (no locks, CAS-based)
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();
count.compareAndSet(expected, newVal);
```

### volatile
```java
private volatile boolean running = true; // all threads see latest value
```
> `volatile` = visibility only. `synchronized` = visibility + atomicity.

### Key Concurrency Classes
| Class | Purpose |
|-------|---------|
| `CountDownLatch` | Wait for N threads to complete |
| `CyclicBarrier` | N threads wait for each other |
| `Semaphore` | Limit N concurrent accesses |
| `BlockingQueue` | Thread-safe queue with blocking ops |
| `ThreadLocal` | Per-thread variable (no sharing) |
| `ConcurrentHashMap` | Thread-safe Map |
| `CopyOnWriteArrayList` | Thread-safe list (write = copy) |

### Thread States
```
NEW → RUNNABLE → (RUNNING) → BLOCKED/WAITING/TIMED_WAITING → TERMINATED
```

### ⚠️ Traps
- `start()` creates new thread. `run()` = just a method call, same thread.
- **Deadlock**: A waits for B's lock, B waits for A's. Prevention: always lock in same order.
- **Race condition**: Two threads read-modify-write same var. Solution: sync/atomic.
- `wait()`, `notify()`, `notifyAll()` MUST be called inside `synchronized`.
- `sleep()` doesn't release lock. `wait()` releases lock.
- Thread pool sizes: CPU-bound = N+1 threads. IO-bound = 2×N or more.

---

## 7. JAVA 8+ FEATURES

### Lambda & Functional Interfaces
```java
// Functional interface = exactly ONE abstract method
@FunctionalInterface
interface Transformer<T> { T transform(T input); }

// Built-in functional interfaces
Predicate<Integer>  p = n -> n > 0;               // T → boolean
Function<String,Integer> f = String::length;       // T → R
Consumer<String>    c = System.out::println;       // T → void
Supplier<String>    s = () -> "hello";             // () → T
BiFunction<String,Integer,String> b = String::substring;
UnaryOperator<String> u = String::toUpperCase;     // T → T
```

### Stream API
```java
List<String> names = List.of("Alice","Bob","Charlie","Anna");

// Intermediate ops (lazy): filter, map, flatMap, sorted, distinct, limit, skip, peek
// Terminal ops (triggers execution): collect, forEach, reduce, count, findFirst, anyMatch

List<String> result = names.stream()
    .filter(n -> n.startsWith("A"))       // ["Alice","Anna"]
    .map(String::toUpperCase)              // ["ALICE","ANNA"]
    .sorted()                              // ["ALICE","ANNA"]
    .collect(Collectors.toList());

// reduce
int sum = IntStream.rangeClosed(1, 10).reduce(0, Integer::sum); // 55

// groupingBy
Map<Integer, List<String>> byLength = names.stream()
    .collect(Collectors.groupingBy(String::length));

// flatMap — flatten nested lists
List<List<Integer>> nested = List.of(List.of(1,2), List.of(3,4));
List<Integer> flat = nested.stream()
    .flatMap(Collection::stream)
    .collect(Collectors.toList()); // [1,2,3,4]

// parallelStream
long count = names.parallelStream().filter(n -> n.length() > 3).count();
```

### Optional
```java
Optional<String> opt = Optional.ofNullable(getName()); // null-safe

opt.isPresent()              // check
opt.get()                    // ⚠️ throws if empty — avoid
opt.orElse("default")        // value or default
opt.orElseGet(() -> compute()) // lazy default
opt.orElseThrow(()-> new RuntimeException("missing"))
opt.ifPresent(System.out::println)
opt.map(String::toUpperCase) // transform if present
opt.filter(s -> s.length() > 3)
```

### Method References
```java
ClassName::staticMethod        // String::valueOf
instance::instanceMethod       // myObj::getName
ClassName::instanceMethod      // String::toUpperCase (on each element)
ClassName::new                 // ArrayList::new (constructor ref)
```

### Java 9-17+ Quick Hits
```java
// Java 9
List.of("a","b","c")           // immutable list
Map.of("k1",1,"k2",2)          // immutable map
Optional.ifPresentOrElse(...)   // both branches

// Java 10
var list = new ArrayList<String>(); // type inference (local only)

// Java 14
record Point(int x, int y) {}       // immutable data class (auto getter/equals/hashCode)
Point p = new Point(1,2); p.x();   // getter

// Java 16
// Pattern matching instanceof
if (obj instanceof String s) { System.out.println(s.length()); }

// Java 17
// Sealed classes
sealed interface Shape permits Circle, Rectangle {}
```

### ⚠️ Traps
- Streams are lazy — nothing runs without terminal op.
- `parallelStream()` is NOT always faster — overhead for small lists.
- `Optional` is for return types, not method params or fields.
- `map` = 1-to-1. `flatMap` = 1-to-many (then flatten).
- `Collectors.toUnmodifiableList()` (Java 10) vs `Collectors.toList()` (modifiable).

---

## 8. STRING & IMMUTABILITY

```java
// String is immutable — every operation creates new String
String s = "hello";
s.toUpperCase();       // returns new String, s unchanged
s = s.toUpperCase();   // now s points to "HELLO"

// String Pool
String a = "hello";         // pooled
String b = "hello";         // same pool object
String c = new String("hello"); // new heap object
a == b        // true (same ref)
a == c        // false (diff object)
a.equals(c)   // true (same content) ← ALWAYS USE equals()

// StringBuilder (mutable, not thread-safe)
StringBuilder sb = new StringBuilder();
sb.append("Hello").append(" ").append("World");
String result = sb.toString();

// StringBuffer (mutable, thread-safe but slower)
StringBuffer sfb = new StringBuffer("hello");

// String methods (commonly tested)
"hello".charAt(1)           // 'e'
"hello".substring(1,3)      // "el"
"hello".indexOf("ll")       // 2
"hello".replace("l","r")    // "herro"
"  hi  ".trim()             // "hi"
"  hi  ".strip()            // "hi" (Java 11, Unicode-aware)
String.join("-","a","b","c") // "a-b-c"
"a,b,c".split(",")          // ["a","b","c"]
String.format("Hello %s, you are %d", name, age)
```

### ⚠️ Traps
- `+` in a loop = bad. Creates N intermediate Strings. Use `StringBuilder`.
- `String.intern()` = put in pool (use carefully).
- `null + "hello"` = `"nullhello"` (doesn't throw!).
- `"".equals(str)` is safer than `str.equals("")` (avoids NPE).

---

## 9. INTERFACE VS ABSTRACT CLASS

| Feature | Interface | Abstract Class |
|---------|-----------|----------------|
| Methods | abstract + default + static (Java 8+) + private (Java 9+) | any mix |
| Variables | `public static final` only | any |
| Constructor | ❌ | ✅ |
| Multiple inheritance | ✅ implement many | ❌ extend one |
| Use when | unrelated classes share capability | related classes share code |

```java
// Interface = CAN-DO contract
interface Flyable { void fly(); }
interface Swimmable { void swim(); }

// Abstract = IS-A base
abstract class Animal {
    String name;
    Animal(String name) { this.name = name; }
    abstract void sound();
    void breathe() { System.out.println("breathing"); } // shared
}

// Duck IS-A Animal, CAN fly AND swim
class Duck extends Animal implements Flyable, Swimmable {
    Duck() { super("Duck"); }
    void sound() { System.out.println("quack"); }
    public void fly() { System.out.println("flap"); }
    public void swim() { System.out.println("splash"); }
}
```

### ⚠️ Traps
- Java 8 `default` methods in interfaces allow multiple inheritance of behavior. Conflict → override in class.
- Abstract class can have state (instance variables). Interface variables are constants.
- If a class implements two interfaces with same `default` method → must override or compile error.

---

## 10. JVM INTERNALS

### Java Execution Flow
```
Source (.java)
   ↓ javac
Bytecode (.class)
   ↓ ClassLoader
Method Area (runtime)
   ↓ Execution Engine
  ├── Interpreter (line-by-line, slow)
  └── JIT Compiler (compiles hot code to native, fast)
      → Native Machine Code
```

### ClassLoader Hierarchy (Parent Delegation)
```
Bootstrap ClassLoader  ← loads rt.jar (java.lang.*, etc.)
   └── Extension ClassLoader ← loads ext/*.jar
          └── Application ClassLoader ← loads your classpath
```
> If child can't find class → asks parent. Parent goes first (security).

### JIT (Just-In-Time) Compiler
- Monitors "hot" methods (called often).
- Compiles them to native code → stored in code cache.
- Why Java gets faster over time (warm-up period).

### JVM Flags (Interview knowledge)
```
-Xms512m     ← initial heap size
-Xmx2g       ← max heap size
-Xss256k     ← stack size per thread
-verbose:gc  ← print GC logs
```

### ⚠️ Traps
- JVM ≠ JRE ≠ JDK. JDK > JRE > JVM.
- Java is "platform independent" because bytecode (not source) is portable. JVM is platform-specific.
- `Class.forName("com.example.Dog")` = dynamic class loading.

---

## 11. ACCESS MODIFIERS & KEY KEYWORDS

| Modifier | Class | Package | Subclass | World |
|----------|-------|---------|----------|-------|
| `public` | ✅ | ✅ | ✅ | ✅ |
| `protected` | ✅ | ✅ | ✅ | ❌ |
| (default) | ✅ | ✅ | ❌ | ❌ |
| `private` | ✅ | ❌ | ❌ | ❌ |

### Key Keywords
```java
static    // belongs to class, not instance. Loaded once.
final     // variable = constant. method = can't override. class = can't extend.
abstract  // class can't instantiate. method has no body.
this      // current object reference / call another constructor
super     // parent class reference / call parent constructor
instanceof // check type: if (obj instanceof String s)
transient // skip field during serialization
synchronized // mutual exclusion
volatile  // force read from main memory
```

---

## 12. COMPARABLE VS COMPARATOR

```java
// Comparable — natural ordering, inside the class
class Student implements Comparable<Student> {
    String name; int age;
    @Override public int compareTo(Student other) {
        return Integer.compare(this.age, other.age); // sort by age
    }
}
Collections.sort(students); // uses compareTo

// Comparator — external ordering, flexible
Comparator<Student> byName = Comparator.comparing(s -> s.name);
Comparator<Student> byAgeDesc = Comparator.comparingInt(Student::getAge).reversed();
students.sort(byName.thenComparing(byAgeDesc)); // chain
```

> 🧒 Comparable = student knows how to sort themselves. Comparator = teacher makes the sorting rule.

---

## 🔁 REBUILD CHALLENGES

1. Draw the 4 OOP pillars with a one-sentence real-world analogy each.
2. What's in Heap vs Stack? Where do primitives/objects/references go?
3. Difference between `HashMap`, `LinkedHashMap`, `TreeMap`, `ConcurrentHashMap`.
4. Write a Stream: filter names > 4 chars, uppercase, sort, collect to list.
5. What's the difference between `synchronized` and `volatile`?
6. Why is String immutable? What is the String Pool?
7. When do you use interface vs abstract class? Give a real example.
8. What is type erasure in Generics?
9. What happens step-by-step when you call `map.put("key", value)`?
10. Explain `CompletableFuture` in 3 sentences.
