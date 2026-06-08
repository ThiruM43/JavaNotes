# ☕ Java — Senior Interview Quick Notes
> **Your Goal:** 12 years of experience, zero Java exposure → Interview-ready fast.
> **Rule:** Read once, then close and rebuild from memory. That's how it sticks.

---

## 🗺️ Your 12 Favorite Problems (Topics to Master)

| # | Topic | Confusion Level (update as you go) |
|---|-------|-------------------------------------|
| 1 | OOP in Java | ⬜ Not started |
| 2 | Java Memory & GC | ⬜ Not started |
| 3 | Collections Framework | ⬜ Not started |
| 4 | Generics | ⬜ Not started |
| 5 | Exception Handling | ⬜ Not started |
| 6 | Multithreading & Concurrency | ⬜ Not started |
| 7 | Java 8+ Features (Lambdas, Streams) | ⬜ Not started |
| 8 | Design Patterns | ⬜ Not started |
| 9 | SOLID Principles | ⬜ Not started |
| 10 | String & Immutability | ⬜ Not started |
| 11 | Interfaces vs Abstract Classes | ⬜ Not started |
| 12 | JVM Internals | ⬜ Not started |

> ✏️ Update Confusion Level: 🟥 Confused | 🟨 Shaky | 🟩 Got it

---

## 📓 Notebook of Things I Don't Know
> Add here when something confuses you. Turn confusion into a learning map.

- [ ] ...

---

---

# 1. OOP IN JAVA
> *Think of a class like a cookie cutter. The object is the actual cookie.*

### The 4 Pillars (always asked!)

**Encapsulation** — Hide your data, expose only what's needed.
```java
class BankAccount {
    private double balance;       // hidden
    public double getBalance() { return balance; } // exposed
}
```
> 🧒 Like a TV remote — you press buttons, you don't see the circuits inside.

**Inheritance** — Child class gets parent's stuff automatically.
```java
class Animal { void eat() { System.out.println("eating"); } }
class Dog extends Animal { void bark() { System.out.println("woof"); } }
// Dog can eat() AND bark()
```
> 🧒 Like getting your dad's nose — you didn't ask for it, you just got it.

**Polymorphism** — Same method name, different behavior.
```java
class Animal { void sound() { System.out.println("..."); } }
class Cat extends Animal { void sound() { System.out.println("meow"); } }
class Dog extends Animal { void sound() { System.out.println("woof"); } }

Animal a = new Cat();
a.sound(); // prints "meow" ← decided at RUNTIME
```
> 🧒 Like asking different kids "what's your favorite food?" — same question, different answers.

**Abstraction** — Show WHAT, hide HOW.
```java
abstract class Shape {
    abstract double area(); // what — no body
}
class Circle extends Shape {
    double area() { return Math.PI * r * r; } // how
}
```

### ⚠️ Key Interview Traps
- Java does **NOT** support multiple inheritance via classes (only via interfaces).
- `super` calls parent constructor/method. `this` refers to current object.
- Overriding = same method signature in child. Overloading = same name, different params.

---

# 2. JAVA MEMORY & GC
> *Your code runs on a virtual machine (JVM). JVM manages memory for you.*

### Memory Areas

```
JVM Memory
├── Heap          ← where objects live (new Dog(), new String(), etc.)
│   ├── Young Gen (new objects)
│   └── Old Gen   (long-lived objects)
├── Stack         ← where method calls & local variables live
├── Method Area   ← class metadata, static fields
└── PC Register   ← tracks which line is executing
```

> 🧒 Heap = a big warehouse. Stack = your desk. When you call a method, a "frame" appears on your desk. When method ends, it disappears.

### Garbage Collection (GC)
- Java **automatically** frees memory you no longer use. No `free()` like C.
- GC runs when an object has **no more references** pointing to it.
- You can't force GC: `System.gc()` is a *hint*, not a command.

### ⚠️ Key Interview Traps
- **Stack Overflow** = too many nested method calls (infinite recursion).
- **OutOfMemoryError** = heap is full.
- `new` keyword = creates object in Heap.
- Primitives (`int`, `boolean`) live on the **Stack**. Objects live on the **Heap**.

---

# 3. COLLECTIONS FRAMEWORK
> *Java's built-in toolbox for storing groups of data.*

### The Big Picture
```
Collection (interface)
├── List       → ordered, allows duplicates
│   ├── ArrayList    ← fast read, slow insert/delete in middle
│   └── LinkedList   ← fast insert/delete, slow random access
├── Set        → NO duplicates
│   ├── HashSet      ← no order, fastest
│   ├── LinkedHashSet← insertion order
│   └── TreeSet      ← sorted order
└── Queue      → FIFO (first in, first out)
    └── PriorityQueue← ordered by priority

Map (NOT a Collection, but part of framework)
├── HashMap       ← key-value, no order, fastest
├── LinkedHashMap ← insertion order
└── TreeMap       ← sorted by key
```

### Quick Examples
```java
// List
List<String> list = new ArrayList<>();
list.add("Java");
list.get(0); // "Java"

// Map
Map<String, Integer> map = new HashMap<>();
map.put("age", 30);
map.get("age"); // 30

// Set
Set<Integer> set = new HashSet<>();
set.add(1); set.add(1); // only one 1 stored
```

### ⚠️ Key Interview Traps
- `ArrayList` vs `LinkedList`: ArrayList = array-backed (better for reads). LinkedList = node-based (better for frequent add/remove).
- `HashMap` allows ONE null key. `Hashtable` does NOT (also synchronized/legacy).
- `ConcurrentHashMap` = thread-safe HashMap. Use this in multi-threaded code.
- `Collections.sort()` sorts a List. `TreeSet`/`TreeMap` stay sorted automatically.

---

# 4. GENERICS
> *A way to write code that works with ANY type, while staying type-safe.*

```java
// Without generics — risky, needs casting
List list = new ArrayList();
list.add("hello");
String s = (String) list.get(0); // manual cast, can crash

// With generics — safe
List<String> list = new ArrayList<>();
list.add("hello");
String s = list.get(0); // no cast needed
```

### Writing Your Own Generic Class
```java
class Box<T> {          // T = "Type placeholder"
    T content;
    Box(T content) { this.content = content; }
    T get() { return content; }
}

Box<String> b = new Box<>("Hello");
Box<Integer> n = new Box<>(42);
```

### Wildcards
```java
List<?>           // any type (read-only)
List<? extends Number>  // Number or subclass (upper bound)
List<? super Integer>   // Integer or superclass (lower bound)
```

> 🧒 Generics = a lunchbox label. You say "this is a String box" and Java won't let you put an Integer in it.

---

# 5. EXCEPTION HANDLING
> *What happens when things go wrong — and how you deal with it.*

### The Hierarchy
```
Throwable
├── Error         ← JVM problems, DON'T catch these (OutOfMemoryError, StackOverflowError)
└── Exception
    ├── Checked   ← must handle or declare (IOException, SQLException)
    └── Unchecked (RuntimeException) ← optional to handle (NullPointerException, ArrayIndexOutOfBoundsException)
```

### Syntax
```java
try {
    int result = 10 / 0;      // throws ArithmeticException
} catch (ArithmeticException e) {
    System.out.println("Can't divide by zero");
} catch (Exception e) {
    System.out.println("Something else went wrong");
} finally {
    System.out.println("Always runs"); // cleanup code here
}
```

### Custom Exception
```java
class InsufficientFundsException extends RuntimeException {
    InsufficientFundsException(String msg) { super(msg); }
}
// Throw it
throw new InsufficientFundsException("Balance too low");
```

### ⚠️ Key Interview Traps
- `finally` always runs — even if you `return` inside try/catch.
- Checked exceptions must be declared with `throws` in method signature.
- `try-with-resources` auto-closes resources (files, DB connections):
```java
try (FileReader fr = new FileReader("file.txt")) {
    // fr is automatically closed after this block
}
```

---

# 6. MULTITHREADING & CONCURRENCY
> *Running multiple tasks at the same time.*

### Creating Threads
```java
// Way 1: extend Thread
class MyThread extends Thread {
    public void run() { System.out.println("running"); }
}
new MyThread().start();

// Way 2: implement Runnable (preferred)
Runnable r = () -> System.out.println("running");
new Thread(r).start();

// Way 3: ExecutorService (best for production)
ExecutorService executor = Executors.newFixedThreadPool(5);
executor.submit(() -> System.out.println("task"));
executor.shutdown();
```

### Key Problems in Concurrency
**Race Condition** — Two threads read/write same variable simultaneously → wrong result.

**Solution 1: synchronized**
```java
synchronized void increment() { count++; } // only one thread at a time
```

**Solution 2: Atomic classes**
```java
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet(); // thread-safe, no locks
```

### Important Classes
| Class | Purpose |
|-------|---------|
| `synchronized` | Lock a method/block |
| `volatile` | Force read from main memory (visibility) |
| `ReentrantLock` | More flexible locking |
| `CountDownLatch` | Wait for N threads to finish |
| `Semaphore` | Limit concurrent access to N |
| `ConcurrentHashMap` | Thread-safe Map |

### ⚠️ Key Interview Traps
- `start()` creates new thread. `run()` just calls the method in SAME thread.
- **Deadlock** = Thread A waits for Thread B, Thread B waits for Thread A. Both stuck forever.
- `volatile` ensures visibility but NOT atomicity. `synchronized` gives both.
- `wait()`, `notify()`, `notifyAll()` must be called inside `synchronized` block.

---

# 7. JAVA 8+ FEATURES
> *The biggest upgrade Java ever got. Heavily tested in interviews.*

### Lambda Expressions
```java
// Old way
Comparator<String> c = new Comparator<String>() {
    public int compare(String a, String b) { return a.compareTo(b); }
};

// Lambda way
Comparator<String> c = (a, b) -> a.compareTo(b);
```
> 🧒 Lambda = a shortcut. Instead of writing a whole class, you write just the logic.

### Functional Interfaces (1 abstract method)
```java
Predicate<Integer>  test  = n -> n > 0;           // boolean test
Function<String,Integer> f = s -> s.length();      // transform
Consumer<String>    c     = s -> System.out.println(s); // consume, no return
Supplier<String>    s     = () -> "hello";          // produce, no input
```

### Stream API
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// Filter + Map + Collect
List<Integer> result = numbers.stream()
    .filter(n -> n % 2 == 0)    // keep evens: [2, 4]
    .map(n -> n * 10)            // multiply: [20, 40]
    .collect(Collectors.toList()); // back to list

// Reduce
int sum = numbers.stream().reduce(0, Integer::sum); // 15
```
> 🧒 Stream = a pipeline. Data flows through stages. Nothing is executed until a *terminal* operation (collect, reduce, forEach).

### Optional
```java
Optional<String> name = Optional.ofNullable(getName()); // might be null
name.ifPresent(n -> System.out.println(n)); // only runs if not null
String result = name.orElse("Unknown");     // default if null
```
> 🧒 Optional = a gift box. It might have something inside, or it might be empty. Check before unwrapping.

### Default Methods in Interfaces (Java 8+)
```java
interface Greeting {
    default void sayHello() { System.out.println("Hello!"); }
}
```

### ⚠️ Key Interview Traps
- Streams are **lazy** — nothing runs until terminal operation.
- `map` transforms one-to-one. `flatMap` flattens nested structures.
- `parallelStream()` runs on multiple threads — use carefully.
- `Optional.get()` without checking throws `NoSuchElementException`. Use `orElse()`.

---

# 8. DESIGN PATTERNS
> *Proven solutions to common problems. Know these 5 cold.*

### Singleton — Only ONE instance ever
```java
class Config {
    private static Config instance;
    private Config() {}
    public static Config getInstance() {
        if (instance == null) instance = new Config();
        return instance;
    }
}
```
> Thread-safe version: use `enum` or double-checked locking.

### Factory — Let a factory decide which object to create
```java
interface Animal { void speak(); }
class Dog implements Animal { public void speak() { System.out.println("Woof"); } }
class Cat implements Animal { public void speak() { System.out.println("Meow"); } }

class AnimalFactory {
    static Animal create(String type) {
        if (type.equals("dog")) return new Dog();
        return new Cat();
    }
}
```

### Builder — Build complex objects step by step
```java
Person p = new Person.Builder()
    .name("Ahamed")
    .age(30)
    .email("a@b.com")
    .build();
```

### Observer — Notify many when one changes
```java
// Like YouTube subscriptions — when you post, all subscribers get notified
interface Observer { void update(String event); }
class EventSystem {
    List<Observer> observers = new ArrayList<>();
    void subscribe(Observer o) { observers.add(o); }
    void publish(String event) { observers.forEach(o -> o.update(event)); }
}
```

### Strategy — Swap algorithms at runtime
```java
interface SortStrategy { void sort(int[] data); }
class BubbleSort implements SortStrategy { ... }
class QuickSort implements SortStrategy { ... }

class Sorter {
    SortStrategy strategy;
    Sorter(SortStrategy s) { this.strategy = s; }
    void sort(int[] data) { strategy.sort(data); }
}
```

---

# 9. SOLID PRINCIPLES
> *5 rules that separate good code from messy code.*

| Letter | Principle | One-liner |
|--------|-----------|-----------|
| **S** | Single Responsibility | One class, one job |
| **O** | Open/Closed | Open to extend, closed to modify |
| **L** | Liskov Substitution | Subclass must be usable wherever parent is |
| **I** | Interface Segregation | Don't force classes to implement unused methods |
| **D** | Dependency Inversion | Depend on abstractions, not concrete classes |

> 🧒 Think of it like LEGO: S = each piece has one shape, D = connect pieces with standard studs, not glue.

---

# 10. STRING & IMMUTABILITY
> *Strings are weird in Java. Interviewers love this.*

### String is Immutable
```java
String s = "hello";
s.toUpperCase();      // does NOT change s
s = s.toUpperCase();  // NOW s points to new "HELLO" object
```
> 🧒 String = a photo. You can take a new photo (new string), but you can't change the original.

### String Pool
```java
String a = "hello";       // goes into String Pool
String b = "hello";       // reuses same object from pool
String c = new String("hello"); // forces new object in Heap

a == b      // TRUE (same reference)
a == c      // FALSE (different object)
a.equals(c) // TRUE (same content)
```

### StringBuilder vs StringBuffer
```java
StringBuilder sb = new StringBuilder();
sb.append("Hello").append(" World"); // fast, NOT thread-safe

StringBuffer sfb = new StringBuffer(); // thread-safe, slower
```
> Use `StringBuilder` unless you need thread safety.

### ⚠️ Key Interview Traps
- **Always use `.equals()` to compare strings**, never `==`.
- String concatenation with `+` in a loop = bad performance. Use `StringBuilder`.
- `intern()` puts a string into the pool manually.

---

# 11. INTERFACES VS ABSTRACT CLASSES
> *One of the most-asked conceptual questions.*

| Feature | Interface | Abstract Class |
|---------|-----------|----------------|
| Methods | All abstract (before Java 8); can have `default` | Mix of abstract and concrete |
| Variables | `public static final` only | Any type |
| Constructor | No | Yes |
| Inheritance | Implement multiple | Extend only ONE |
| Purpose | Define a contract (CAN-DO) | Share base behavior (IS-A) |

```java
interface Flyable { void fly(); }           // contract
interface Swimmable { void swim(); }        // contract

abstract class Animal {
    abstract void eat();
    void breathe() { System.out.println("breathing"); } // shared
}

class Duck extends Animal implements Flyable, Swimmable {
    void eat()  { System.out.println("quack munch"); }
    void fly()  { System.out.println("flap flap"); }
    void swim() { System.out.println("splash"); }
}
```

> 🧒 Interface = job description (what you can do). Abstract class = family trait (what you are).

### ⚠️ Key Interview Traps
- From Java 8: interfaces can have `default` and `static` methods.
- From Java 9: interfaces can have `private` methods.
- Use interface when unrelated classes need same capability. Use abstract class for related classes sharing code.

---

# 12. JVM INTERNALS
> *What actually happens when you run Java code.*

### The Java Journey
```
YourCode.java
    ↓ (javac compiler)
YourCode.class  ← bytecode (not machine code!)
    ↓ (JVM)
Machine Code    ← runs on your OS/hardware
```

> 🧒 Java writes in a "universal language" (bytecode). Every computer has a JVM that translates it. That's why Java is "Write Once, Run Anywhere."

### JVM Components
```
JVM
├── Class Loader    ← loads .class files into memory
├── Memory Areas    ← Heap, Stack, Method Area (see Topic 2)
├── Execution Engine
│   ├── Interpreter     ← executes bytecode line by line (slow)
│   └── JIT Compiler    ← compiles hot code to native (fast)
└── GC              ← cleans up unused objects
```

### JVM vs JRE vs JDK
```
JDK = JRE + Development Tools (javac, debugger)
JRE = JVM + Libraries
JVM = Just the engine
```
> Install JDK when developing. JRE is enough to just run.

### ⚠️ Key Interview Traps
- JIT = Just In Time compiler. Makes Java fast after warm-up.
- **Platform independence** = bytecode, not source code, is portable.
- `ClassLoader` hierarchy: Bootstrap → Extension → Application

---

---

# 🔁 REBUILD CHALLENGES (Do These Without Looking!)

After reading each section, close the doc and answer:

1. Draw the 4 pillars of OOP with one-line examples each.
2. What's the difference between Heap and Stack?
3. Which Collection would you use for: sorted unique values? fast key lookup? ordered list with duplicates?
4. Write a Stream pipeline that filters a list of names longer than 4 chars and uppercases them.
5. What's the difference between `synchronized` and `volatile`?
6. Why should you never use `==` to compare strings?
7. Name 3 design patterns and when you'd use each.
8. What's the difference between interface and abstract class — give a real-world example.
9. Explain the JVM in one paragraph as if to a 12-year-old.
10. What is a deadlock? How do you prevent it?

---

# 📌 QUICK REFERENCE CHEAT SHEET

```
Checked Exception    → must declare with throws (IOException)
Unchecked Exception  → don't have to (NullPointerException)
String ==            → reference compare (DON'T use)
String .equals()     → content compare (USE THIS)
ArrayList            → fast get(i), slow insert middle
LinkedList           → fast insert, slow get(i)
HashMap              → no order, null key OK, not thread-safe
ConcurrentHashMap   → thread-safe HashMap
synchronized         → visibility + atomicity
volatile             → visibility only
Lambda               → (params) -> expression
Stream terminal ops  → .collect(), .reduce(), .forEach(), .count()
JDK > JRE > JVM
```

---

*Next Step: Pick one topic you marked 🟥 and go deeper. We'll build a focused drill on it.*
