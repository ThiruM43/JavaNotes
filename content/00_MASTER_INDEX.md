# ☕ JAVA SENIOR INTERVIEW — MASTER STUDY GUIDE
> Your path from zero Java → interview-ready. 12 years experience, applied to Java.

---

## 📚 YOUR FILES

| File | Topics | Priority |
|------|--------|----------|
| `01_Core_Java.md` | OOP, Memory, Collections, Generics, Exceptions, Threads, Java 8+, Strings, JVM | 🔴 Must know |
| `02_Data_Structures_Algorithms.md` | Big O, Arrays, LinkedList, Trees, Graphs, Sorting, DP, Patterns | 🔴 Must know |
| `03_Spring_Framework.md` | IoC/DI, AOP, Spring Boot, MVC/REST, Security, Profiles, Actuator | 🔴 Must know |
| `04_JPA_Hibernate_Database.md` | JPA, Hibernate, Entity Mapping, Relations, Transactions, N+1, SQL | 🔴 Must know |
| `05_Microservices_Messaging_Testing.md` | Microservices, Kafka, RabbitMQ, JUnit 5, Mockito, Redis, Maven | 🟡 Important |

---

## 🗺️ STUDY ROADMAP (2-week sprint)

### Week 1 — Foundation
```
Day 1-2:  01 Core Java    — OOP, Collections, Java 8+
Day 3:    01 Core Java    — Threads, Memory, JVM
Day 4-5:  02 DSA          — Big O, Arrays, LinkedList, Trees, Sorting
Day 6:    02 DSA          — HashMap internals, Graphs, DP
Day 7:    Review + Rebuild challenges (close docs, write from memory)
```

### Week 2 — Framework
```
Day 8-9:  03 Spring       — IoC/DI/AOP, Spring Boot, MVC/REST
Day 10:   03 Spring       — Spring Security (JWT)
Day 11:   04 Database     — JPA, Hibernate, Relationships, N+1
Day 12:   04 Database     — Transactions, SQL, Caching
Day 13:   05 Microservices — Architecture, Kafka, Circuit Breaker
Day 14:   05 Testing      — JUnit 5, Mockito, Spring Boot Test + FULL REVIEW
```

---

## 🎯 TOP 50 INTERVIEW QUESTIONS (by category)

### Core Java (always asked)
1. What are the 4 pillars of OOP? Explain with examples.
2. Difference between `==` and `.equals()`?
3. Why is String immutable? What is the String Pool?
4. What is the difference between `ArrayList` and `LinkedList`?
5. How does `HashMap` work internally? What happens on collision?
6. What is the difference between `HashMap` and `ConcurrentHashMap`?
7. Explain Java Memory Model: Heap vs Stack.
8. What is Garbage Collection? How does it work?
9. What is the difference between `Comparable` and `Comparator`?
10. What are checked vs unchecked exceptions?
11. Explain `synchronized`, `volatile`, and `AtomicInteger` differences.
12. What is a deadlock? How do you prevent it?
13. What new features did Java 8 introduce?
14. Explain Stream API: lazy evaluation, intermediate vs terminal ops.
15. What is `Optional`? Why is it better than null?

### Data Structures
16. What is the time complexity of HashMap get/put?
17. When would you use a LinkedList over ArrayList?
18. How does a Binary Search Tree work? What is its search complexity?
19. Explain BFS vs DFS. When to use each?
20. What is a heap? How does PriorityQueue work?
21. Explain the Two Pointers technique with an example.
22. What is Dynamic Programming? Give an example.
23. What is the difference between MergeSort and QuickSort?
24. Reverse a linked list — explain step by step.
25. Find the Kth largest element — describe your approach.

### Spring Boot
26. What is IoC and Dependency Injection? Types of DI?
27. What does `@SpringBootApplication` expand to?
28. How does Spring Boot Auto-Configuration work?
29. What is the difference between `@Component`, `@Service`, `@Repository`?
30. What is AOP? Give real production use cases.
31. What are Bean scopes? What are the side effects of injecting prototype into singleton?
32. Explain the Spring MVC request lifecycle.
33. How does `@Transactional` work? What is propagation?
34. What is the difference between Filter and Interceptor?
35. What is `@ControllerAdvice` and why use it?

### JPA / Hibernate
36. What is the difference between JPA and Hibernate?
37. Explain JPA entity lifecycle states.
38. What is the N+1 problem? How do you solve it?
39. What is `FetchType.LAZY` vs `EAGER`?
40. Explain `@OneToMany` with `mappedBy`. Who owns the relationship?
41. What are cascade types in JPA?
42. What is the difference between L1 and L2 cache in Hibernate?
43. What is optimistic vs pessimistic locking?
44. What does `ddl-auto: validate` do?
45. What is a transaction isolation level? Name the levels.

### Microservices / Misc
46. Microservices vs Monolith — trade-offs?
47. What is an API Gateway? What does it do?
48. What is a Circuit Breaker? Explain the states.
49. Kafka vs RabbitMQ — when to use each?
50. What is `@SpringBootTest` vs `@WebMvcTest` vs `@DataJpaTest`?

---

## 🔑 DESIGN PATTERNS — QUICK REF

| Pattern | Type | Problem Solved | When |
|---------|------|---------------|------|
| Singleton | Creational | One instance | Config, Registry |
| Factory | Creational | Hide creation logic | Plugin systems |
| Builder | Creational | Complex object creation | DTOs, Request builders |
| Prototype | Creational | Clone objects | Expensive objects |
| Adapter | Structural | Incompatible interfaces | Legacy integration |
| Decorator | Structural | Add behavior dynamically | Java I/O, logging |
| Proxy | Structural | Control access | Spring AOP, lazy loading |
| Facade | Structural | Simplify complex API | Subsystem wrapping |
| Observer | Behavioral | Notify on change | Events, pub/sub |
| Strategy | Behavioral | Swap algorithms | Sorting, payment methods |
| Template Method | Behavioral | Define algorithm skeleton | Frameworks |
| Command | Behavioral | Encapsulate requests | Undo/redo |
| Chain of Responsibility | Behavioral | Pass request through chain | Filters, middleware |

---

## 🔑 SOLID — QUICK REF

| Principle | Meaning | Bad Example | Fix |
|-----------|---------|-------------|-----|
| **S** Single Responsibility | 1 class = 1 reason to change | `UserService` does auth + email + DB | Split into 3 services |
| **O** Open/Closed | Open to extend, closed to modify | `if type == "X"` blocks | Use polymorphism |
| **L** Liskov Substitution | Subclass usable where parent expected | Square extends Rectangle (breaks setWidth) | Separate classes |
| **I** Interface Segregation | Don't force unused methods | Fat interface: `Animal.fly()` on Fish | Split interfaces |
| **D** Dependency Inversion | Depend on abstractions | `new MySQLRepo()` hardcoded | Inject `UserRepository` interface |

---

## ⚡ JAVA CODE CHEAT SHEET

```java
// Stream one-liners
list.stream().filter(x -> x > 0).map(x -> x*2).collect(Collectors.toList())
list.stream().sorted(Comparator.comparing(User::getName)).limit(10).collect(toList())
list.stream().collect(Collectors.groupingBy(User::getDept, Collectors.counting()))
list.stream().reduce(0, Integer::sum)
list.stream().mapToInt(User::getAge).average().orElse(0)

// Optional chain
Optional.ofNullable(user).map(User::getAddress).map(Address::getCity).orElse("Unknown")

// Collections utils
Collections.sort(list, Comparator.comparing(User::getName).thenComparing(User::getAge))
Collections.unmodifiableList(list)
Collections.synchronizedList(list)

// String tricks
String.join(", ", list)
list.stream().map(Object::toString).collect(Collectors.joining(", "))
"hello world".chars().filter(c -> c == 'l').count() // count 'l'

// HashMap tricks
map.getOrDefault(key, default)
map.putIfAbsent(key, value)
map.computeIfAbsent(key, k -> new ArrayList<>())
map.merge(key, 1, Integer::sum)

// Useful for interviews
Arrays.sort(arr)
Arrays.sort(arr, Comparator.reverseOrder())
Integer.parseInt("42")
String.valueOf(42)
Math.max(a, b); Math.min(a, b); Math.abs(x)
```

---

## 📝 NOTEBOOK OF THINGS I DON'T KNOW
> Update this as you study. Turn confusion into a roadmap.

- [ ] ...

---

## 🎮 PLAY CHALLENGES (fun ways to test knowledge)

1. **Build from scratch**: Create a simple REST API with User CRUD (no IDE hints). Use only what you remember.
2. **Debug game**: `HashMap<Integer, String> map = new HashMap<>(); map.put(null, "A");` — does this work? Why?
3. **Predict the output**: What does `Stream.of(1,2,3).peek(System.out::println).filter(x -> x > 1).count()` print?
4. **Fix the bug**: A `@Transactional` method calls another `@Transactional` method in the same class — does the inner transaction work?
5. **Design it**: Design a URL shortener (bit.ly). What Java classes, Spring components, DB schema would you use?

---

*Next: Pick one file, read it once, close it, and rebuild the key points from memory. That's where the real learning happens.*
