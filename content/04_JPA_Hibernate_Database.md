# 04 — JPA, HIBERNATE & DATABASE
> 🧒 = Explain like a 12-year-old | ⚠️ = Interview trap | 🔁 = Rebuild from memory

---

## TOPIC TRACKER
| # | Topic | Status |
|---|-------|--------|
| 1 | JDBC Basics | ⬜ |
| 2 | JPA Concepts | ⬜ |
| 3 | Hibernate Core | ⬜ |
| 4 | Entity Mapping | ⬜ |
| 5 | Relationships (OneToMany, etc.) | ⬜ |
| 6 | JPQL & Criteria API | ⬜ |
| 7 | Spring Data JPA | ⬜ |
| 8 | Transaction Management | ⬜ |
| 9 | Caching (L1 & L2) | ⬜ |
| 10 | N+1 Problem & Fetch Strategies | ⬜ |
| 11 | SQL Essentials | ⬜ |
| 12 | Connection Pooling | ⬜ |

---

## 1. JDBC BASICS

> 🧒 JDBC = direct hotline to the database. You write raw SQL, you manage everything.

```java
// Raw JDBC (Spring abstracts this, but know the flow)
try (Connection conn = DriverManager.getConnection(url, user, pass);
     PreparedStatement ps = conn.prepareStatement(
         "SELECT * FROM users WHERE id = ?")) {
    ps.setLong(1, userId);
    ResultSet rs = ps.executeQuery();
    while (rs.next()) {
        System.out.println(rs.getString("name"));
    }
} // auto-closes
```

### JdbcTemplate (Spring way — simpler)
```java
@Repository
class UserRepository {
    @Autowired JdbcTemplate jdbc;

    List<User> findAll() {
        return jdbc.query("SELECT * FROM users",
            (rs, rowNum) -> new User(rs.getLong("id"), rs.getString("name")));
    }

    int save(User u) {
        return jdbc.update("INSERT INTO users(name,email) VALUES(?,?)",
            u.getName(), u.getEmail());
    }
}
```

---

## 2. JPA CONCEPTS

> 🧒 JPA = a rulebook for talking to databases in Java. Hibernate is a company that follows that rulebook.

```
JPA (spec) ← interface/rules
Hibernate  ← most popular JPA implementation
EclipseLink, OpenJPA ← other implementations
```

### Key JPA Concepts
```
EntityManager   — manages entity lifecycle (persist, find, merge, remove)
EntityManagerFactory — creates EntityManagers (one per app, expensive)
PersistenceContext — the "1st level cache" — EntityManager's working memory
JPQL — SQL-like query language but for objects (not tables)
```

### Entity Lifecycle States
```
New/Transient  → Managed → Detached → Removed
     ↑              ↓          ↓
  new Entity()  persist()  detach()/close()
                            merge() ← to re-attach
```

```java
// New → Managed
User user = new User("John");       // Transient
em.persist(user);                   // Managed (tracked)

// Find → Managed
User found = em.find(User.class, 1L); // Managed

// Managed → Detached
em.detach(found);                   // Detached (not tracked)
found.setName("Jane");              // change not tracked!

// Detached → Managed
User merged = em.merge(found);      // re-attach, changes tracked

// Remove
em.remove(found);                   // marks for DELETE on flush
```

---

## 3. HIBERNATE CORE

### Session = EntityManager wrapper
```java
Session session = sessionFactory.openSession();
Transaction tx = session.beginTransaction();

User user = new User("John");
session.save(user);           // INSERT on flush

tx.commit();
session.close();
```

### Hibernate-specific annotations (beyond JPA)
```java
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@org.hibernate.annotations.BatchSize(size = 20)
@org.hibernate.annotations.Where(clause = "deleted = false") // soft delete filter
```

### DDL Generation
```yaml
spring.jpa.hibernate.ddl-auto:
  create       # drop + create on start (dev only)
  create-drop  # create on start, drop on stop
  update       # update schema (risky in prod)
  validate     # validate schema, fail if mismatch
  none         # do nothing (prod)
```
> ⚠️ Use `validate` or `none` in production. Use Flyway/Liquibase for migrations.

---

## 4. ENTITY MAPPING

```java
@Entity
@Table(name = "users")
class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // auto-increment
    private Long id;

    @Column(name = "user_name", nullable = false, length = 100)
    private String name;

    @Column(unique = true)
    private String email;

    @Enumerated(EnumType.STRING) // store as "ACTIVE" not 0
    private Status status;

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @Transient // not persisted to DB
    private String tempField;

    @Embedded // fields of Address added to this table
    private Address address;

    @Version // optimistic locking
    private int version;

    // Audit fields (Spring Data)
    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
    @CreatedBy
    private String createdBy;
}

@Embeddable
class Address {
    private String street;
    private String city;
    private String country;
}
```

### ID Generation Strategies
| Strategy | How | When |
|----------|-----|------|
| `IDENTITY` | DB auto-increment | MySQL, PostgreSQL |
| `SEQUENCE` | DB sequence object | PostgreSQL, Oracle (better performance) |
| `TABLE` | Special table for IDs | Portable but slow |
| `AUTO` | Hibernate decides | Development only |
| `UUID` | `@GeneratedValue` + `@UuidGenerator` | Distributed systems |

---

## 5. RELATIONSHIPS

### @OneToOne
```java
@Entity class User {
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id")
    private UserProfile profile;
}
```

### @OneToMany / @ManyToOne (most common)
```java
@Entity
class Order {
    @Id Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;           // FK side

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    // Helper methods (best practice)
    void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}

@Entity
class Customer {
    @Id Long id;

    @OneToMany(mappedBy = "customer", fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();
}
```

### @ManyToMany
```java
@Entity class Student {
    @ManyToMany
    @JoinTable(
        name = "student_course",
        joinColumns = @JoinColumn(name = "student_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private Set<Course> courses = new HashSet<>();
}
```

### Cascade Types
| CascadeType | Effect |
|-------------|--------|
| `PERSIST` | Save child when parent saved |
| `MERGE` | Update child when parent updated |
| `REMOVE` | Delete child when parent deleted |
| `REFRESH` | Refresh child when parent refreshed |
| `DETACH` | Detach child when parent detached |
| `ALL` | All of the above |

### ⚠️ Relationship Traps
- `mappedBy` = "I'm NOT the owner. FK is on the other side."
- Owner side (with `@JoinColumn`) controls FK. Changes on non-owner side are ignored.
- Always use `FetchType.LAZY` by default. Only `@ManyToOne` and `@OneToOne` default to EAGER.
- `@OneToMany` defaults to LAZY. `@ManyToOne` defaults to EAGER. Override for performance.
- `orphanRemoval = true` = delete child when removed from collection.

---

## 6. JPQL & Criteria API

### JPQL (object-oriented SQL)
```java
// JPQL uses entity names and field names, not table/column names
@Repository
class UserRepository {
    @PersistenceContext EntityManager em;

    List<User> findByName(String name) {
        return em.createQuery(
            "SELECT u FROM User u WHERE u.name = :name ORDER BY u.createdAt DESC",
            User.class)
            .setParameter("name", name)
            .getResultList();
    }

    // Named Query (defined on entity)
    // @NamedQuery(name="User.findActive", query="SELECT u FROM User u WHERE u.status='ACTIVE'")
    List<User> findActive() {
        return em.createNamedQuery("User.findActive", User.class).getResultList();
    }

    // JPQL JOIN
    List<Order> findOrdersWithItems() {
        return em.createQuery(
            "SELECT DISTINCT o FROM Order o JOIN FETCH o.items",
            Order.class).getResultList();
    }
}
```

### Criteria API (type-safe, programmatic)
```java
CriteriaBuilder cb = em.getCriteriaBuilder();
CriteriaQuery<User> cq = cb.createQuery(User.class);
Root<User> root = cq.from(User.class);

cq.select(root)
  .where(cb.equal(root.get("status"), "ACTIVE"),
         cb.greaterThan(root.get("age"), 18))
  .orderBy(cb.asc(root.get("name")));

List<User> result = em.createQuery(cq).getResultList();
```

---

## 7. SPRING DATA JPA

> 🧒 Spring Data JPA = zero boilerplate. Just define a method name and Spring generates the SQL.

```java
// Repository — just extend the interface
@Repository
interface UserRepository extends JpaRepository<User, Long> {

    // Derived queries — Spring generates SQL from method name
    List<User> findByName(String name);
    List<User> findByNameAndStatus(String name, Status status);
    List<User> findByAgeGreaterThan(int age);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByStatus(Status status);
    void deleteByStatus(Status status);
    List<User> findTop5ByOrderByCreatedAtDesc();

    // Custom JPQL
    @Query("SELECT u FROM User u WHERE u.email LIKE %:domain%")
    List<User> findByEmailDomain(@Param("domain") String domain);

    // Native SQL
    @Query(value = "SELECT * FROM users WHERE status = ?1", nativeQuery = true)
    List<User> findActiveNative(String status);

    // Modifying query
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.status = :status WHERE u.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") Status status);

    // Pagination
    Page<User> findByStatus(Status status, Pageable pageable);

    // Sorting
    List<User> findByStatus(Status status, Sort sort);
}
```

```java
// Pagination usage
Pageable pageable = PageRequest.of(0, 10, Sort.by("name").ascending());
Page<User> page = userRepo.findByStatus(Status.ACTIVE, pageable);
page.getContent();       // List<User>
page.getTotalPages();
page.getTotalElements();
page.isLast();
```

### JpaRepository Built-ins
```java
repo.save(entity)            // INSERT or UPDATE
repo.saveAll(list)           // batch save
repo.findById(id)            // Optional<T>
repo.findAll()               // List<T>
repo.findAll(Sort.by("name"))
repo.findAll(pageable)       // Page<T>
repo.deleteById(id)
repo.existsById(id)
repo.count()
```

### Specifications (dynamic queries)
```java
Specification<User> spec = (root, query, cb) ->
    cb.and(
        cb.equal(root.get("status"), "ACTIVE"),
        cb.greaterThan(root.get("age"), 18)
    );

userRepo.findAll(spec); // repo must extend JpaSpecificationExecutor<User>
```

---

## 8. TRANSACTION MANAGEMENT

> 🧒 Transaction = all-or-nothing. Either all DB changes succeed, or none do.

```java
@Service
@Transactional // default: REQUIRED, RUNTIME exceptions rollback
class OrderService {

    @Autowired OrderRepository orderRepo;
    @Autowired InventoryService inventoryService;

    @Transactional // inherits class-level, or can override
    Order placeOrder(OrderRequest req) {
        Order order = orderRepo.save(new Order(req));
        inventoryService.decreaseStock(req.getItemId(), req.getQuantity()); // same TX
        emailService.sendConfirmation(order); // ← runs OUTSIDE TX (see below)
        return order;
    }

    @Transactional(readOnly = true) // optimization for reads
    List<Order> getOrders() { return orderRepo.findAll(); }

    @Transactional(rollbackFor = CheckedException.class)
    void riskyMethod() throws CheckedException { ... }

    @Transactional(noRollbackFor = BusinessException.class)
    void method() { ... }
}
```

### Propagation Levels
| Propagation | Behavior |
|-------------|----------|
| `REQUIRED` (default) | Join existing TX, or create new |
| `REQUIRES_NEW` | Always create new TX, suspend current |
| `SUPPORTS` | Join if TX exists, run without if not |
| `NOT_SUPPORTED` | Run without TX, suspend current |
| `MANDATORY` | Must have TX, throw if not |
| `NEVER` | Must NOT have TX, throw if one exists |
| `NESTED` | Nested TX (savepoint), rollback doesn't affect parent |

### Isolation Levels
| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|-------|-----------|---------------------|--------------|
| READ_UNCOMMITTED | ✅ possible | ✅ | ✅ |
| READ_COMMITTED | ❌ | ✅ | ✅ |
| REPEATABLE_READ | ❌ | ❌ | ✅ |
| SERIALIZABLE | ❌ | ❌ | ❌ |

```java
@Transactional(isolation = Isolation.READ_COMMITTED)
```

### ⚠️ Transaction Traps
- `@Transactional` only works on public methods (proxy-based AOP).
- Calling `this.method()` from inside the same class bypasses the proxy → no transaction!
- Checked exceptions do NOT rollback by default. Add `rollbackFor`.
- `@Transactional(readOnly=true)` tells Hibernate: skip dirty checking → better performance.

---

## 9. CACHING (L1 & L2)

### First Level Cache (L1) — always on
```
Scope: per Session/EntityManager
Life: until session closes
Behavior: find(User,1) → DB. find(User,1) again → cache (no DB call)
```

```java
User u1 = em.find(User.class, 1L); // DB hit
User u2 = em.find(User.class, 1L); // L1 cache hit — same object!
u1 == u2; // true
em.clear(); // clears L1 cache
```

### Second Level Cache (L2) — optional, shared
```
Scope: per SessionFactory (shared across sessions)
Life: configurable (time, max size)
Providers: EhCache, Redis, Caffeine
```

```java
// Enable L2 cache on entity
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
class Product { ... }

// Config
spring.jpa.properties.hibernate.cache.use_second_level_cache=true
spring.jpa.properties.hibernate.cache.region.factory_class=org.hibernate.cache.ehcache.EhCacheRegionFactory
```

### Spring Cache Abstraction
```java
@Service
class UserService {
    @Cacheable("users")                    // cache result, key = id
    User findById(Long id) { ... }

    @CachePut(value = "users", key = "#user.id") // update cache
    User update(User user) { ... }

    @CacheEvict(value = "users", key = "#id")    // remove from cache
    void delete(Long id) { ... }

    @CacheEvict(value = "users", allEntries = true) // clear all
    void clearCache() { ... }
}
```

---

## 10. N+1 PROBLEM & FETCH STRATEGIES

> 🧒 N+1 = you load 1 order, then separately load each customer = 1 + N queries. Terrible for performance.

```java
// N+1 happens here:
List<Order> orders = orderRepo.findAll(); // 1 query
for (Order o : orders) {
    System.out.println(o.getCustomer().getName()); // N queries (1 per order)!
}
```

### Solutions

**1. JOIN FETCH (most common)**
```java
@Query("SELECT o FROM Order o JOIN FETCH o.customer")
List<Order> findAllWithCustomer();
```

**2. EntityGraph**
```java
@EntityGraph(attributePaths = {"customer", "items"})
List<Order> findAll();
// or on entity:
@NamedEntityGraph(name = "Order.detail",
    attributeNodes = @NamedAttributeNode("customer"))
```

**3. @BatchSize (lazy + batch)**
```java
@OneToMany
@BatchSize(size = 25)  // load 25 orders' items in one query
List<OrderItem> items;
```

**4. @Fetch(FetchMode.SUBSELECT)**
```java
@OneToMany
@Fetch(FetchMode.SUBSELECT) // one subselect for all children
List<OrderItem> items;
```

### Detect N+1
- Enable `spring.jpa.show-sql=true` and count queries.
- Use `hibernate.generate_statistics=true`.
- Use Spring Actuator + datasource-proxy.

---

## 11. SQL ESSENTIALS

### Joins
```sql
-- INNER JOIN: matching rows only
SELECT u.name, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN: all left rows + matching right
SELECT u.name, o.total FROM users u LEFT JOIN orders o ON u.id = o.user_id;

-- RIGHT JOIN: all right rows + matching left
-- FULL OUTER JOIN: all rows from both

-- Self Join
SELECT e.name, m.name AS manager
FROM employees e LEFT JOIN employees m ON e.manager_id = m.id;
```

### Window Functions
```sql
SELECT name, salary,
    RANK() OVER (PARTITION BY dept ORDER BY salary DESC) as rank,
    ROW_NUMBER() OVER (ORDER BY salary DESC) as row_num,
    LAG(salary) OVER (ORDER BY salary) as prev_salary,
    SUM(salary) OVER (PARTITION BY dept) as dept_total
FROM employees;
```

### Indexes
```sql
CREATE INDEX idx_user_email ON users(email);         -- B-tree (default)
CREATE UNIQUE INDEX idx_user_email ON users(email);  -- unique
CREATE INDEX idx_composite ON orders(user_id, status); -- composite

-- Use index? Depends:
-- ✅ WHERE email = 'x'       (equality on indexed col)
-- ✅ WHERE user_id = 1       (leading col of composite)
-- ❌ WHERE LOWER(email) = 'x' (function defeats index)
-- ❌ LIKE '%john%'           (leading wildcard defeats index)
```

### ACID Properties
| Property | Meaning |
|----------|---------|
| **A**tomicity | All or nothing |
| **C**onsistency | DB stays valid |
| **I**solation | Transactions don't interfere |
| **D**urability | Committed data survives crash |

### Common Interview SQL
```sql
-- Second highest salary
SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);
-- or:
SELECT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;

-- Duplicate emails
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;

-- Employees earning more than their manager
SELECT e.name FROM employees e JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;
```

---

## 12. CONNECTION POOLING

> 🧒 Opening a DB connection is expensive (like calling someone). Connection pool = a group of pre-made calls waiting to be used.

```yaml
# HikariCP (default in Spring Boot — fastest)
spring:
  datasource:
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      connection-timeout: 30000    # ms to wait for connection
      idle-timeout: 600000         # ms before idle conn removed
      max-lifetime: 1800000        # ms max conn life
      pool-name: MyPool
```

### Why Pooling
- Without pool: every request opens new DB connection (100-500ms overhead).
- With pool: connections reused → ~1ms checkout time.
- Pool too small = bottleneck. Pool too large = DB overwhelmed.

### ⚠️ Traps
- Default max pool size = 10. Set based on DB capacity and app load.
- `connection-timeout` exception = pool exhausted = too many concurrent requests or connection leak.
- Connection leak = code took connection, never returned. Use `try-with-resources` always.

---

## 🔁 REBUILD CHALLENGES

1. Explain the JPA Entity lifecycle states (New → Managed → Detached → Removed).
2. What is the difference between `EAGER` and `LAZY` fetching? Which to prefer?
3. What is the N+1 problem? Give an example and 2 solutions.
4. Explain `@Transactional` propagation: REQUIRED vs REQUIRES_NEW.
5. What are the JPA relationship annotations? Explain `mappedBy`.
6. Write a Spring Data JPA method for: find users by name, sorted by age descending, with pagination.
7. What is the difference between L1 and L2 cache in Hibernate?
8. What does `ddl-auto: validate` do? Why use it in production?
9. What is optimistic locking? When would you use `@Version`?
10. Explain ACID. What isolation level prevents dirty reads?
