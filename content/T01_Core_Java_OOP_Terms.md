# T01 — CORE JAVA & OOP TERMS
> Format: **TERM** — definition | 🧒 analogy | 💬 how to use it

---

## CATEGORY 1: CORE JAVA TERMS

**JVM (Java Virtual Machine)** — The engine that runs Java bytecode. Not real hardware — it's a software layer that sits between your code and the OS.
> 🧒 JVM = a universal translator. It speaks "bytecode" and converts it to whatever language the computer understands.
> 💬 *"The JVM handles memory management, garbage collection, and JIT compilation at runtime."*

**JRE (Java Runtime Environment)** — JVM + class libraries. Everything needed to RUN Java programs (but not develop them).
> 💬 *"The production server only needs the JRE installed, not the full JDK."*

**JDK (Java Development Kit)** — JRE + compiler (`javac`) + tools (`javadoc`, `jdb`, etc.). Everything needed to WRITE and run Java.
> 💬 *"Developers install the JDK on their machines. Relationship: JDK ⊃ JRE ⊃ JVM."*

**Bytecode** — The intermediate compiled output of `.java` files (`.class` files). Not machine code — portable across platforms.
> 🧒 Bytecode = a recipe in a universal language. Any kitchen (JVM) on any platform can follow it.
> 💬 *"Java compiles to bytecode, not native machine code, which is why it's platform-independent."*

**Class Loader** — Part of JVM that loads `.class` files into memory at runtime. Three built-in loaders: Bootstrap → Extension → Application.
> 💬 *"The ClassLoader uses parent-delegation: child asks parent first before loading a class itself."*

**Interpreter** — Reads and executes bytecode line by line. Slow but starts immediately.
> 💬 *"The JVM starts with the interpreter, then JIT kicks in for frequently-called methods."*

**JIT Compiler (Just-In-Time)** — Detects "hot" methods (called often) and compiles them to native machine code at runtime. Makes Java fast after warm-up.
> 🧒 JIT = a student who memorizes answers to questions asked repeatedly, so next time they answer instantly.
> 💬 *"JIT compilation is why Java performance improves after the warm-up period in production."*

**Compilation** — Converting human-readable `.java` source to bytecode `.class` using `javac`. Happens at build time.
> 💬 *"Compilation catches type errors, syntax errors, and some logic issues before runtime."*

**Runtime** — The phase when the program is actually executing on the JVM. Errors here = `RuntimeException`.
> 💬 *"NullPointerException is a runtime error — the compiler can't always detect it."*

**Platform Independent** — Java code runs on any OS that has a JVM, without recompiling.
> 💬 *"Java achieves platform independence through bytecode — compile once, run on any JVM."*

**Write Once Run Anywhere (WORA)** — Java's core promise. One compiled `.class` file runs on Windows, Linux, Mac unchanged.
> 💬 *"WORA was Java's key advantage over C/C++ in enterprise development."*

**Package** — A namespace for organizing related classes. Maps to folder structure on disk.
> 💬 *"We follow `com.companyname.modulename.layername` package naming convention."*

**Import** — Makes classes from other packages available in your file without full path. No runtime effect — compiler only.
> 💬 *"Static imports let you use methods like `Arrays.sort` without the class prefix."*

**Access Modifier** — Keyword controlling who can see/use a class, field, or method: `public`, `protected`, default, `private`.
> 💬 *"We enforce encapsulation by using the most restrictive access modifier that still works."*

**Public** — Accessible from anywhere.
**Private** — Accessible only within the same class.
**Protected** — Accessible within same package + subclasses.
**Default Access** — No keyword. Accessible only within the same package (package-private).
> 💬 *"Default access is useful for package-level utilities you don't want to expose externally."*

**Object** — An instance of a class. Has state (fields) and behavior (methods). Lives on the Heap.
> 🧒 Class = cookie cutter. Object = the actual cookie.

**Class** — A blueprint defining fields and methods. No memory allocated until instantiated.

**Instance** — A specific object created from a class. `new Dog()` creates an instance of `Dog`.
> 💬 *"Each HTTP request creates a new instance of the controller method's local variables."*

**Method** — A named block of code inside a class that performs an action. Has a signature (name + params).

**Constructor** — Special method with class name, no return type. Called when object is created with `new`.
> 💬 *"We use constructor injection in Spring — the constructor is called once at bean creation."*

**Variable** — Named memory location holding a value.

**Local Variable** — Declared inside a method. Lives on Stack. Must be initialized before use. No default value.

**Instance Variable** — Declared in class, outside methods. One per object. Lives on Heap. Has default values (`0`, `null`, `false`).

**Static Variable** — Declared with `static`. One shared copy per class (not per object). Loaded in Method Area.
> 💬 *"Static variables are useful for constants and counters shared across all instances."*

**Final Variable** — Value assigned once, never changed. `final int MAX = 100;` is a constant.

**Constant** — A `public static final` variable. Convention: `UPPER_SNAKE_CASE`.
> 💬 *"Constants like `MAX_RETRY_COUNT` are defined as `public static final` in a constants class."*

**Scope** — The region of code where a variable exists and is accessible.
> 💬 *"That variable is out of scope — it was declared inside the try block."*

**Block** — Code enclosed in `{}`. Creates a new scope.

**Expression** — A combination of variables, operators, and method calls that evaluates to a value. e.g., `x + 2`, `list.size()`.

**Statement** — A complete instruction ending in `;`. e.g., `int x = 5;`, `return value;`.

**Literal** — A fixed value written directly in code. `42`, `"hello"`, `true`, `3.14`, `'a'`.

---

## CATEGORY 2: OOP TERMS

**Object-Oriented Programming (OOP)** — Programming paradigm modeling code as objects with state and behavior. Core pillars: Encapsulation, Inheritance, Polymorphism, Abstraction.
> 💬 *"Java is purely OOP — everything is inside a class."*

**Encapsulation** — Bundling data (fields) + behavior (methods) together and hiding internal details. Achieved via `private` fields + public getters/setters.
> 🧒 Capsule = medicine pill. Inside is complicated chemistry. You just swallow it.
> 💬 *"Encapsulation lets us change internal implementation without breaking callers — that's why we expose methods, not fields."*

**Inheritance** — A child class (`extends`) inherits fields and methods from parent. Promotes code reuse. Java = single inheritance (one parent).
> 💬 *"We extended `BaseService` to inherit common error handling without duplicating code."*

**Polymorphism** — "Many forms." Same method name behaves differently based on the object type.
- **Runtime polymorphism** = method overriding (decided at runtime).
- **Compile-time polymorphism** = method overloading (decided at compile time).
> 💬 *"Polymorphism lets us write `shape.area()` once and have it work for Circle, Square, Triangle."*

**Abstraction** — Hiding implementation complexity. Expose WHAT, hide HOW. Achieved via abstract classes and interfaces.
> 🧒 Driving a car — you use the steering wheel and pedals. You don't see the engine internals.
> 💬 *"The `PaymentService` interface abstracts whether we're using Stripe, PayPal, or a mock in tests."*

**Interface** — A contract declaring method signatures (and since Java 8: default/static methods). No state (only constants). A class can implement multiple.
> 💬 *"We code to interfaces, not implementations — that's the Dependency Inversion principle."*

**Abstract Class** — A class with `abstract` keyword. Can have abstract methods (no body) + concrete methods. Can't be instantiated. Extend with `extends`.
> 💬 *"We use an abstract class when subclasses share implementation. Interface when they just share a contract."*

**Method Overloading** — Multiple methods with the same name but different parameter signatures in the SAME class. Compile-time polymorphism.
> 💬 *"The `save(User)` and `save(List<User>)` are overloaded — same name, different params."*

**Method Overriding** — Subclass redefines a method from the parent with the same signature. Runtime polymorphism. Use `@Override`.
> 💬 *"We override `toString()` to get meaningful log output instead of the memory address."*

**Dynamic Binding (Late Binding)** — Method call resolved at RUNTIME based on actual object type. Applies to overriding.
> 💬 *"Dynamic binding is why `Animal a = new Dog(); a.sound()` calls Dog's method, not Animal's."*

**Static Binding (Early Binding)** — Method call resolved at COMPILE TIME. Applies to: `static`, `final`, `private` methods and overloading.
> 💬 *"Static methods use static binding — that's why you can't override them, only hide them."*

**IS-A Relationship** — Inheritance relationship. `Dog IS-A Animal`. Modeled with `extends` or `implements`.
> 💬 *"Before inheriting, verify the IS-A relationship makes semantic sense."*

**HAS-A Relationship** — Composition/aggregation. `Car HAS-A Engine`. Modeled by having a field of another type.
> 💬 *"We prefer HAS-A over IS-A for flexible, loosely coupled design."*

**Composition** — Strong HAS-A. Contained object CANNOT exist without the container. `House HAS-A Room` — if House destroyed, Rooms destroyed.
> 💬 *"We use composition here — `OrderItem` can't exist without an `Order`."*

**Aggregation** — Weak HAS-A. Contained object CAN exist independently. `Department HAS-A Employee` — Employee exists if Department dissolved.
> 💬 *"This is aggregation — the `Address` object exists independently of the `User`."*

**Association** — General relationship between objects. Both can exist independently. Bidirectional or unidirectional.
> 💬 *"The relationship between `Teacher` and `Student` is an association — neither owns the other."*

**Coupling** — How dependent one class is on another. Goal: LOW coupling (changes to one don't ripple everywhere).
> 💬 *"Tight coupling to the concrete class makes unit testing hard — we should depend on the interface."*

**Cohesion** — How focused a class is on one responsibility. Goal: HIGH cohesion (class does one thing well).
> 💬 *"This service has low cohesion — it handles authentication, email, and payment. Let's split it."*

**Dependency** — Class A depends on Class B when A uses B. A depends on B's interface — that's better than A depending on B's concrete class.
> 💬 *"We have a circular dependency — ServiceA depends on ServiceB and vice versa. That's a design smell."*

**Dependency Injection (DI)** — Instead of creating dependencies inside a class (`new ServiceB()`), they are provided from outside (injected). Spring does this automatically.
> 🧒 DI = instead of making your own coffee, someone hands you a cup. You just drink it.
> 💬 *"Constructor injection is preferred over field injection — it makes dependencies explicit and the class testable."*

**SOLID Principles** — 5 design principles for clean OOP code:
- **S** = Single Responsibility
- **O** = Open/Closed
- **L** = Liskov Substitution
- **I** = Interface Segregation
- **D** = Dependency Inversion
> 💬 *"This class violates the Single Responsibility Principle — it's doing too many things."*
