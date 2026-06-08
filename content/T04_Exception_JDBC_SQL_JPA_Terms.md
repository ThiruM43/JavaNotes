# T04 — EXCEPTION, JDBC, SQL & JPA/HIBERNATE TERMS
> Format: **TERM** — definition | 🧒 analogy | 💬 how to use it

---

## CATEGORY 9: EXCEPTION HANDLING TERMS

**Exception** — An event disrupting normal program flow. Represented as an object. All exceptions extend `Throwable`.
> 💬 *"We catch specific exceptions, not `Exception` broadly — it hides bugs."*

**Error** — Serious JVM-level problem. Do NOT catch. `OutOfMemoryError`, `StackOverflowError`, `AssertionError`. Signals JVM is in an unrecoverable state.
> 💬 *"If you're seeing `OutOfMemoryError`, catching it won't help — fix the root cause (memory leak or heap too small)."*

**Checked Exception** — Must be declared in method signature (`throws`) or handled (`try-catch`). Represents recoverable conditions: `IOException`, `SQLException`.
> 💬 *"We convert checked exceptions at the DAO layer to unchecked — service layer shouldn't deal with `SQLException`."*

**Unchecked Exception** — Extends `RuntimeException`. No obligation to declare or catch. Represents programming errors: `NullPointerException`, `IllegalArgumentException`.
> 💬 *"We use unchecked exceptions for business rule violations — no need to pollute method signatures with `throws`."*

**RuntimeException** — Parent of all unchecked exceptions. Occurs during execution, not detected at compile time.
> 💬 *"Our custom business exceptions extend `RuntimeException` — clean API, no forced try-catch on callers."*

**Try-Catch** — Block to handle exceptions. `try` contains risky code. `catch` handles specific exceptions. Multiple catch blocks possible.
> 💬 *"Catch from most specific to most general — `catch (IOException e)` before `catch (Exception e)`."*

**Finally** — Block that ALWAYS runs after try-catch, even on `return` or exception. Use for cleanup.
> 💬 *"We moved connection cleanup to `finally` — but now we use `try-with-resources` which is cleaner."*

**Throw** — Keyword to explicitly raise an exception: `throw new UserNotFoundException(id)`.
> 💬 *"We `throw` a domain exception at the service layer and handle it with `@ControllerAdvice` at the API layer."*

**Throws** — Keyword in method signature declaring it may throw checked exceptions: `void readFile() throws IOException`.
> 💬 *"`throws` is a contract — it tells callers to handle this exception."*

**Custom Exception** — Application-specific exception class. Extend `RuntimeException` for unchecked or `Exception` for checked.
> 💬 *"We have `UserNotFoundException`, `InsufficientFundsException`, `DuplicateEmailException` — maps to HTTP status codes in `@ControllerAdvice`."*

**Exception Propagation** — Uncaught exception bubbles up the call stack until caught or reaches `main()` (terminates thread).
> 💬 *"The exception propagated from DAO → Service → Controller → GlobalExceptionHandler."*

**Stack Trace** — The chain of method calls at the time of exception. Shows exactly where exception occurred and how we got there.
> 💬 *"The stack trace shows the root cause was a `NullPointerException` in `UserService.getProfile()` line 45."*

---

## CATEGORY 10: JDBC TERMS

**JDBC (Java Database Connectivity)** — Java API for connecting to and executing SQL on relational databases. Low-level — Spring's `JdbcTemplate` wraps it.
> 💬 *"JDBC is the foundation. JPA/Hibernate sits on top of it. Knowing JDBC helps debug what Hibernate generates."*

**Driver** — Database-specific implementation of JDBC API. `mysql-connector-java` for MySQL, `postgresql` for Postgres. Loaded by `DriverManager`.
> 💬 *"Add the JDBC driver dependency to pom.xml — Spring Boot auto-configures the `DataSource` from there."*

**DriverManager** — Factory class for creating JDBC `Connection` objects. Legacy approach — use `DataSource` (connection pool) in production.
> 💬 *"Never use `DriverManager.getConnection()` in production — it creates a new connection every call. Use HikariCP."*

**Connection** — A session between Java app and database. Expensive to create — should be pooled and reused.
> 💬 *"Always close `Connection` in finally or try-with-resources — unclosed connections exhaust the pool."*

**Statement** — Executes static SQL. Vulnerable to SQL injection. Only use for SQL with no user input.
> 💬 *"Never use `Statement` with user input — always use `PreparedStatement` to prevent SQL injection."*

**PreparedStatement** — Pre-compiled SQL with `?` placeholders. Prevents SQL injection. Better performance for repeated queries.
> 💬 *"`PreparedStatement` is parameterized — user input never becomes part of the SQL structure."*

**CallableStatement** — Executes stored procedures. `{call procedure_name(?, ?)}`.
> 💬 *"The legacy system uses stored procedures — we call them with `CallableStatement`."*

**ResultSet** — Cursor-based result of a SELECT query. Navigate with `next()`. Read columns by name or index.
> 💬 *"We map `ResultSet` rows to `User` objects using a `RowMapper` in `JdbcTemplate`."*

**Batch Processing** — Sending multiple SQL statements in one round trip. Huge performance improvement for bulk inserts/updates.
> 💬 *"Importing 100K records: single inserts = 30 minutes. Batch size 500 = 2 minutes."*

**Transaction** — A unit of work that must complete entirely (COMMIT) or not at all (ROLLBACK). ACID properties.
> 💬 *"We wrap the order creation and inventory update in a single transaction — both succeed or both fail."*

**Commit** — Permanently save all changes made in the current transaction.
> 💬 *"We only commit after all validations pass — no partial commits."*

**Rollback** — Undo all changes made in the current transaction, returning to previous state.
> 💬 *"On any exception, we rollback — the DB should never be left in a partial state."*

**Savepoint** — A named checkpoint within a transaction. Can rollback to savepoint without rolling back entire transaction.
> 💬 *"We use savepoints for nested operations — inner operation failure rolls back to savepoint, outer continues."*

**Connection Pooling** — Pre-created pool of database connections reused across requests. HikariCP is the default in Spring Boot.
> 💬 *"Without connection pooling, every request opens a new DB connection — adds 100-500ms overhead."*

---

## CATEGORY 11: SQL & DATABASE TERMS

**Primary Key** — Column(s) uniquely identifying each row. NOT NULL + UNIQUE. Usually `id BIGINT AUTO_INCREMENT`.
> 💬 *"We use surrogate primary keys (auto-generated IDs) rather than business keys — more stable."*

**Foreign Key** — Column(s) referencing a Primary Key in another table. Enforces referential integrity.
> 💬 *"The `order_items` table has a foreign key to `orders.id` — can't create an item without a valid order."*

**Composite Key** — Primary key made of multiple columns together. `PRIMARY KEY (order_id, product_id)`.
> 💬 *"The junction table uses a composite key of both foreign keys — ensures unique pairs."*

**Unique Key** — Column(s) where all values are distinct. Can be NULL (unlike primary key). Multiple per table.
> 💬 *"Email has a unique constraint — inserting a duplicate throws a `DataIntegrityViolationException`."*

**Constraint** — Rule enforced by the database: `NOT NULL`, `UNIQUE`, `PRIMARY KEY`, `FOREIGN KEY`, `CHECK`.
> 💬 *"We enforce business rules with DB constraints as a last line of defense — even if app validation fails."*

**Index** — Data structure (usually B-Tree) enabling fast data lookup. Trade-off: faster reads, slower writes.
> 🧒 Index = book's index page. Instead of reading every page, you jump directly to the right one.
> 💬 *"Add an index on `email` — every login does a lookup by email. Without index = full table scan."*

**Clustered Index** — Data rows physically stored in index order. One per table. Primary key IS the clustered index in MySQL InnoDB.
> 💬 *"Range queries on primary key are fast because data is physically sorted — that's the clustered index benefit."*

**Non-Clustered Index** — Separate structure pointing to data rows. Multiple per table. Lookup = index scan + row fetch.
> 💬 *"The non-clustered index on `email` stores email → row pointer. Finding by email = 2 lookups."*

**Normalization** — Organizing tables to reduce redundancy. 1NF → 2NF → 3NF (most common target). Split data into related tables.
> 💬 *"We normalized the schema — customer details live in `customers`, not duplicated in every `order`."*

**Denormalization** — Intentionally adding redundancy for performance. Pre-join data. Read-heavy systems.
> 💬 *"We denormalized the reporting table — added `customer_name` to `orders` to avoid joins in dashboards."*

**ACID** — The 4 properties of reliable DB transactions:
- **Atomicity** = all or nothing
- **Consistency** = DB stays valid
- **Isolation** = concurrent transactions don't interfere
- **Durability** = committed data survives crashes
> 💬 *"Relational DBs guarantee ACID. NoSQL often sacrifices some for availability/scalability (BASE model)."*

**CAP Theorem** — Distributed system can guarantee only 2 of 3:
- **C**onsistency (every read gets latest write)
- **A**vailability (every request gets a response)
- **P**artition Tolerance (works despite network splits)
> 💬 *"Kafka sacrifices some consistency for availability and partition tolerance — AP system in CAP terms."*

**Join** — Combines rows from two or more tables based on a condition.
> 💬 *"Avoid joins on non-indexed columns — they cause full table scans and slow queries."*

**Inner Join** — Returns only rows that MATCH in both tables.
> 💬 *"Inner join gives only orders that have a customer match — orphaned orders are excluded."*

**Left Join** — Returns ALL rows from the LEFT table + matching right rows. Non-matching right = NULL.
> 💬 *"Left join users with orders — users without orders still appear, orders column is NULL."*

**Right Join** — Returns ALL rows from the RIGHT table + matching left rows. Mirror of Left Join.

**Full Join** — Returns ALL rows from BOTH tables. Non-matching side = NULL.
> 💬 *"Full join shows all users and all orders, even those without a match on the other side."*

**Cross Join** — Cartesian product — every row from table A with every row from table B. N×M rows. Rarely intentional.

**Subquery** — A query nested inside another query. In `WHERE`, `FROM`, or `SELECT` clause.
> 💬 *"Subquery in WHERE: `WHERE salary > (SELECT AVG(salary) FROM employees)`."*

**Stored Procedure** — Named, pre-compiled SQL block stored in DB. Callable from Java via `CallableStatement`.
> 💬 *"We use stored procedures for the complex batch reconciliation — runs faster in DB than app-side SQL."*

**Trigger** — Automatic DB action on INSERT/UPDATE/DELETE. Use sparingly — hard to debug, hidden behavior.
> 💬 *"The trigger auto-updates `updated_at` on every row change — but it makes debugging tricky."*

**View** — Virtual table defined by a SELECT query. No data stored. Simplifies complex joins.
> 💬 *"We created a view for the reporting query — hides the join complexity from the BI team."*

---

## CATEGORY 12: HIBERNATE/JPA TERMS

**ORM (Object-Relational Mapping)** — Maps Java objects to DB tables. No manual SQL for basic CRUD. Hibernate is Java's most popular ORM.
> 🧒 ORM = a translator between your Java world (objects) and the database world (tables).
> 💬 *"ORM handles the boilerplate SQL. We write JPQL or let Spring Data derive queries from method names."*

**Entity** — A Java class mapped to a DB table. Annotated with `@Entity`. Each instance = one row.
> 💬 *"Our entities are in the `domain` package — they map 1:1 with database tables."*

**Persistence Context** — Hibernate's "unit of work" — a first-level cache of all managed entities within a transaction. Tracks changes automatically (dirty checking).
> 💬 *"The persistence context detects the changed `user.name` and generates an UPDATE automatically on commit."*

**EntityManager** — JPA interface for CRUD operations. `persist()`, `find()`, `merge()`, `remove()`. Each represents a persistence context.
> 💬 *"EntityManager is not thread-safe — never share it. Spring injects a thread-local proxy safely."*

**Session** — Hibernate's equivalent of `EntityManager`. Wraps persistence context. `save()`, `get()`, `update()`, `delete()`.
> 💬 *"In Spring Data JPA, you rarely touch Session directly — repositories handle it."*

**SessionFactory** — Heavyweight factory for creating Sessions. One per application. Equivalent of JPA's `EntityManagerFactory`.
> 💬 *"SessionFactory holds the connection pool and mapping metadata — it's expensive to create, so create it once."*

**Lazy Loading** — Related entity loaded from DB only when ACCESSED (default for `@OneToMany`, `@ManyToMany`).
> 🧒 Lazy = don't fetch the product details until the customer actually clicks on the product.
> 💬 *"Be careful with lazy loading outside a transaction — `LazyInitializationException` means the session is closed."*

**Eager Loading** — Related entity loaded immediately with the parent (default for `@ManyToOne`, `@OneToOne`).
> 💬 *"We changed `@ManyToOne` to `LAZY` — eager loading was fetching the full customer graph for every order query."*

**Dirty Checking** — Hibernate tracks changes to managed entities. On transaction commit, auto-generates UPDATE SQL for changed fields. No explicit `save()` needed.
> 💬 *"Dirty checking caught us out — we modified an entity expecting no DB update, but Hibernate flushed it."*

**First Level Cache (L1 Cache)** — Persistence context IS the L1 cache. Per-session. Always on. Same entity retrieved twice in a session → second is from cache.
> 💬 *"L1 cache is why calling `findById(1)` twice in the same transaction only hits DB once."*

**Second Level Cache (L2 Cache)** — Optional shared cache across sessions. `@Cache` annotation on entity. Providers: EhCache, Redis.
> 💬 *"We enabled L2 cache for the `Country` entity — it's read-only and never changes, perfect for caching."*

**N+1 Problem** — Loading N entities triggers N additional queries to load their relationships. Classic performance killer.
> 💬 *"We had 1 query for 100 orders + 100 queries for each customer — N+1. Fixed with `JOIN FETCH`."*

**JPQL (Java Persistence Query Language)** — SQL-like query language but uses entity/field names, not table/column names. Portable across databases.
> 💬 *"JPQL: `FROM User u WHERE u.status = 'ACTIVE'` — Hibernate translates to the DB's dialect."*

**Criteria API** — Programmatic, type-safe way to build JPA queries in Java code. Verbose but compile-time safe.
> 💬 *"We use Criteria API for dynamic search filters — query built conditionally based on which params are provided."*

**Cascade** — Propagates operations (PERSIST, MERGE, REMOVE, etc.) from parent to child entities automatically.
> 💬 *"`CascadeType.ALL` on `@OneToMany` items — saving the Order auto-saves all OrderItems."*

**Orphan Removal** — When a child entity is removed from a parent's collection, Hibernate auto-deletes it from DB. `orphanRemoval = true`.
> 💬 *"Setting `orphanRemoval = true` means removing an item from `order.getItems()` deletes it from the DB."*

**Fetch Type** — `LAZY` (load on access) vs `EAGER` (load immediately). Set on relationship annotations.
> 💬 *"Always start with `LAZY` for all relationships and optimize with `JOIN FETCH` where needed."*

**Entity Lifecycle** — States: `New/Transient` (no ID) → `Managed` (tracked by persistence context) → `Detached` (session closed) → `Removed` (marked for delete).
> 💬 *"The entity is detached after the service method returns — changes made in the controller won't be persisted."*
