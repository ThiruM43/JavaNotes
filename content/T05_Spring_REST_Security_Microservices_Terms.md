# T05 — SPRING, REST, SECURITY & MICROSERVICES TERMS
> Format: **TERM** — definition | 🧒 analogy | 💬 how to use it

---

## CATEGORY 13: SPRING FRAMEWORK TERMS

**IOC Container (Inversion of Control Container)** — The Spring engine that creates, wires, and manages beans. You define beans, Spring handles lifecycle and injection.
> 🧒 IOC Container = a butler. You say "I need a PaymentService" — the butler finds it, creates it, hands it to you.
> 💬 *"The IOC container manages all our service beans — we never use `new` for Spring-managed components."*

**Dependency Injection (DI)** — IOC mechanism where the container PUSHES dependencies INTO a bean (vs bean pulling them). Types: constructor, setter, field.
> 💬 *"Constructor DI is preferred — dependencies are explicit, object is immutable, and it's easier to test."*

**Bean** — Any object managed by the Spring IOC container. Created, configured, and destroyed by Spring.
> 💬 *"Every `@Component`, `@Service`, `@Repository`, `@Controller` becomes a Spring bean."*

**Bean Scope** — How many instances of a bean Spring creates. `singleton` (one per context) or `prototype` (new per request) are most common.
> 💬 *"Our services are all singleton-scoped — they're stateless so one instance serves all requests."*

**Singleton Bean** — ONE instance per `ApplicationContext`. Default scope. Shared across all requests. Must be stateless.
> 💬 *"Singleton beans must be thread-safe — multiple threads call them simultaneously."*

**Prototype Bean** — NEW instance created every time it's requested from the container.
> 💬 *"We use prototype scope for the `ReportBuilder` — it holds state and must not be shared."*

**Component Scan** — Spring scans specified packages for classes annotated with `@Component`, `@Service`, etc. and registers them as beans.
> 💬 *"Component scan covers `com.example` — any class there with `@Component` is auto-registered."*

**Configuration** — `@Configuration` class = bean factory. `@Bean` methods define beans manually. Used when you can't annotate a class (third-party libs).
> 💬 *"We use `@Configuration` to define the `ObjectMapper` bean with custom serialization settings."*

**Auto Wiring** — Spring automatically injects the right bean into a dependency by type (or name with `@Qualifier`).
> 💬 *"Autowiring finds the `UserRepository` implementation automatically — no manual wiring needed."*

**Qualifier** — `@Qualifier("beanName")` used when multiple beans of the same type exist. Disambiguates which bean to inject.
> 💬 *"We have `@Qualifier("stripePayment")` and `@Qualifier("paypalPayment")` — injected based on config."*

**Profile** — Groups beans for different environments. `@Profile("prod")` bean only loaded when prod profile is active.
> 💬 *"The `MockEmailService` is `@Profile("dev")` — it never runs in production."*

**Property Source** — `@PropertySource("classpath:custom.properties")` — loads properties from a file into Spring's Environment.
> 💬 *"We use `@PropertySource` for feature flags — easily changed without code changes."*

**Spring Context** — The running `ApplicationContext` — holds all beans, properties, event listeners.
> 💬 *"The Spring context starts on app launch and contains all the wired beans ready to serve requests."*

**Spring Container** — Same as IOC Container / ApplicationContext. The runtime environment managing all beans.

**AOP (Aspect-Oriented Programming)** — Programming paradigm for cross-cutting concerns (logging, transactions, security) without scattering code everywhere.
> 💬 *"`@Transactional` is implemented as AOP — Spring wraps your method in transaction begin/commit logic."*

**Aspect** — A class containing cross-cutting logic. Annotated with `@Aspect`.
> 💬 *"Our `LoggingAspect` logs all service method entry/exit — zero changes to service code."*

**Advice** — The actual code that runs at a join point. Types: `@Before`, `@After`, `@AfterReturning`, `@AfterThrowing`, `@Around`.
> 💬 *"We use `@Around` advice for timing — it controls execution and measures duration."*

**Pointcut** — Expression defining which methods the advice applies to. `execution(* com.example.service.*.*(..))`.
> 💬 *"The pointcut targets all public methods in the service layer — precisely scoped."*

**Join Point** — A specific point in program execution where advice can be applied. In Spring AOP = always a method execution.
> 💬 *"The join point is the actual method call — the advice wraps around it."*

**Proxy** — Spring AOP creates a proxy around the original bean. Advice runs on the proxy. Internal `this.method()` calls bypass the proxy.
> 💬 *"Be careful: calling `this.method()` bypasses the proxy — `@Transactional` won't work for internal calls."*

---

## CATEGORY 14: SPRING BOOT TERMS

**Starter** — Convenient dependency descriptor bundling related libraries. `spring-boot-starter-web` includes Spring MVC, Tomcat, Jackson.
> 💬 *"Starters eliminate dependency version conflicts — Spring Boot manages compatible versions."*

**Auto Configuration** — Spring Boot automatically configures beans based on classpath dependencies and properties. Magic powered by `@ConditionalOn*` annotations.
> 💬 *"Spring Boot auto-configures `DataSource` when it sees HikariCP on the classpath and `spring.datasource.url` in properties."*

**Embedded Server** — Spring Boot ships with an embedded Tomcat/Jetty/Undertow. Run as a JAR, no WAR deployment needed.
> 💬 *"The embedded Tomcat runs on port 8080 by default — change with `server.port` property."*

**Actuator** — Production-ready monitoring endpoints: `/health`, `/metrics`, `/env`, `/beans`, `/threaddump`.
> 💬 *"We expose Actuator's `/health` endpoint to the load balancer — it removes unhealthy instances automatically."*

**Health Check** — `/actuator/health` endpoint reporting if the app and its dependencies (DB, Redis, etc.) are healthy.
> 💬 *"Custom `HealthIndicator` added — now health check validates that the external payment API is reachable."*

**Spring Initializr** — Web tool (start.spring.io) to generate Spring Boot project skeleton with chosen dependencies.
> 💬 *"Start every new microservice at start.spring.io — just add the starters you need."*

**Application Properties** — `application.properties` or `application.yml` — externalized configuration file.
> 💬 *"Database credentials, ports, timeouts — all in application.properties. Never hardcoded."*

**YAML Configuration** — `application.yml` — hierarchical config format. More readable than flat properties for complex config.
> 💬 *"We use YAML for config — nested structure is clearer than `spring.datasource.hikari.maximum-pool-size=20`."*

**CommandLineRunner** — Interface/lambda that runs after Spring context starts. For initialization tasks.
> 💬 *"We use `CommandLineRunner` to load seed data on startup in development."*

**DevTools** — Spring Boot dev dependency enabling hot reload on file change without full restart.
> 💬 *"Spring DevTools auto-restarts on code changes — much faster than killing and restarting the server."*

**Banner** — The ASCII art Spring Boot prints on startup. Can be customized or disabled.
> 💬 *"We disable the Spring Boot banner in production for clean logs."*

---

## CATEGORY 15: REST API TERMS

**REST (Representational State Transfer)** — Architectural style for distributed systems. Stateless, resource-based, uses HTTP verbs.
> 💬 *"Our API is RESTful — resources are URLs, operations are HTTP verbs, responses are JSON."*

**Resource** — The 'noun' in REST. A thing the API exposes. `/users`, `/orders`, `/products`. Identified by URI.
> 💬 *"In REST, everything is a resource. Design around resources, not actions."*

**Endpoint** — A specific URL + HTTP method combination. `GET /api/users/1` is an endpoint.
> 💬 *"Document all endpoints in Swagger/OpenAPI — the frontend team needs the contract."*

**URI (Uniform Resource Identifier)** — String identifying a resource. URL is a type of URI that also includes location.
> 💬 *"Use nouns in URIs, not verbs: `/api/users` not `/api/getUsers`."*

**URL (Uniform Resource Locator)** — URI that specifies how to access a resource (protocol + host + path).

**HTTP (HyperText Transfer Protocol)** — Application protocol for transferring data. Request-response model. Stateless.

**GET** — Retrieve resource. Safe (no side effects) + Idempotent. Never use for data modification.
**POST** — Create resource. NOT idempotent. Returns `201 Created`.
**PUT** — Replace entire resource. Idempotent. Send complete representation.
**PATCH** — Partial update. Not always idempotent. Send only changed fields.
**DELETE** — Remove resource. Idempotent. Returns `204 No Content`.
> 💬 *"PUT replaces completely — if you omit a field, it becomes null. PATCH is partial update — better for partial changes."*

**Request** — HTTP message from client to server. Has: method, URL, headers, body (for POST/PUT/PATCH).
**Response** — HTTP message from server to client. Has: status code, headers, body.
**Payload** — The body data in request/response. Usually JSON.

**JSON (JavaScript Object Notation)** — Lightweight text format for data exchange. Standard for REST APIs.
> 💬 *"We serialize domain objects to JSON using Jackson — `@JsonIgnore`, `@JsonProperty` for customization."*

**XML (eXtensible Markup Language)** — Alternative data format. Verbose. Still used in legacy/enterprise SOAP systems.
> 💬 *"Our legacy integration still uses XML. We use JAXB for Java-XML binding."*

**Serialization** — Converting a Java object to JSON/XML for network transfer. `User object → {"id":1,"name":"John"}`.
> 💬 *"Jackson handles serialization. We annotate with `@JsonInclude(NON_NULL)` to exclude null fields."*

**Deserialization** — Converting JSON/XML back to a Java object. `{"id":1,"name":"John"} → User object`.
> 💬 *"Deserialization failure (unknown field, wrong type) throws `HttpMessageNotReadableException` — return `400 Bad Request`."*

**Content Negotiation** — Client requests format via `Accept` header. Server responds with `Content-Type` header.
> 💬 *"Content negotiation lets the API return JSON or XML based on `Accept: application/json` or `Accept: application/xml`."*

**Idempotent** — Calling an operation multiple times has the same effect as calling it once. GET, PUT, DELETE are idempotent. POST is NOT.
> 💬 *"Retry logic requires idempotent endpoints — retrying a `PUT` is safe; retrying a `POST` creates duplicates."*

**Stateless API** — Server stores NO client state between requests. Every request contains all needed info. Sessions break statelessness.
> 💬 *"REST should be stateless — that's why we use JWT tokens (state in the token) not server sessions."*

---

## CATEGORY 16: SECURITY TERMS

**Authentication** — WHO are you? Verifying identity. Username/password, JWT, OAuth2.
> 💬 *"Authentication checks if your credentials are valid. After that, authorization checks what you can do."*

**Authorization** — WHAT can you do? Checking if an authenticated user has permission for an action.
> 💬 *"`@PreAuthorize("hasRole('ADMIN')")` is authorization — only admins can call this endpoint."*

**OAuth2** — Industry standard protocol for delegated authorization. "Sign in with Google." Client gets an access token without seeing your password.
> 💬 *"We use OAuth2 with Keycloak as the authorization server. Spring Security validates the access token."*

**JWT (JSON Web Token)** — Self-contained token encoding claims. Three parts: `Header.Payload.Signature`. Stateless — no server lookup needed.
> 🧒 JWT = a sealed envelope with your name on it. Anyone who knows the secret can verify it wasn't tampered with.
> 💬 *"JWT payload contains userId, roles, expiry. We validate the signature on every request."*

**Access Token** — Short-lived token (15min-1hr) granting access to APIs. Sent in `Authorization: Bearer <token>` header.
> 💬 *"Short-lived access tokens limit exposure if compromised — use refresh tokens to get new ones."*

**Refresh Token** — Long-lived token used ONLY to get new access tokens. Stored securely (httpOnly cookie).
> 💬 *"When the access token expires, the client sends the refresh token to `/auth/refresh` for a new pair."*

**Bearer Token** — Token carried in the `Authorization` header: `Authorization: Bearer <jwt>`. Server validates on every request.
> 💬 *"All API calls include the Bearer token in the header — Spring Security filter extracts and validates it."*

**Session** — Server-side storage of user state between requests. Session ID stored in cookie. Traditional (non-REST) approach.
> 💬 *"We use stateless JWT instead of sessions — scales horizontally without session replication."*

**CSRF (Cross-Site Request Forgery)** — Attack where malicious site tricks browser into making authenticated requests to your API.
> 💬 *"CSRF protection is disabled for stateless JWT APIs — CSRF exploits cookie-based sessions which we don't use."*

**CORS (Cross-Origin Resource Sharing)** — Browser security mechanism blocking requests from different origins. Must be explicitly allowed on server.
> 💬 *"The frontend on `localhost:3000` can't call our API on `localhost:8080` without CORS config."*

**Encryption** — Converting data to unreadable ciphertext using a key. Reversible with the right key. AES for symmetric, RSA for asymmetric.
> 💬 *"We encrypt PII data at rest with AES-256 — even if the DB is compromised, data is unreadable."*

**Decryption** — Reversing encryption to recover original data using a key.

**Hashing** — One-way transformation to fixed-size output. NOT reversible. Used for passwords. SHA-256, BCrypt.
> 💬 *"We hash passwords with BCrypt — it's slow by design and includes a salt."*

**Salt** — Random string added to input before hashing. Prevents rainbow table attacks. BCrypt handles salting automatically.
> 💬 *"BCrypt auto-generates and stores the salt — no two identical passwords produce the same hash."*

**SSL (Secure Sockets Layer)** — Predecessor to TLS. Used loosely to mean TLS/HTTPS. Encrypts data in transit.
> 💬 *"Always use HTTPS (TLS) in production — SSL/TLS encrypts data between client and server."*

**TLS (Transport Layer Security)** — Current standard for encrypted communication. TLS 1.3 is the latest. Replaces SSL.
> 💬 *"We terminate TLS at the load balancer — internal service-to-service uses mTLS."*

---

## CATEGORY 17: MICROSERVICES TERMS

**Microservice** — Small, independently deployable service focused on one business capability. Has its own database, deployed separately.
> 💬 *"The `OrderService` handles only orders — it doesn't touch user profiles or payments directly."*

**Monolith** — Single large application with all functionality in one deployable unit. Simple to start, hard to scale/maintain at size.
> 💬 *"We're doing a strangler fig migration — gradually extracting microservices from the monolith."*

**Service Discovery** — Mechanism for services to find each other dynamically without hardcoded IPs. Eureka or Consul.
> 💬 *"Services register with Eureka on startup. Clients query Eureka to find the current IP of `order-service`."*

**API Gateway** — Single entry point for all client requests. Handles routing, auth, rate limiting, SSL termination.
> 💬 *"The API Gateway handles JWT validation for all services — each microservice doesn't need to implement auth."*

**Circuit Breaker** — Stops calling a failing service to prevent cascade failure. States: CLOSED → OPEN → HALF-OPEN.
> 🧒 Circuit breaker = electrical fuse. When overloaded (service failing), it trips open and stops the damage.
> 💬 *"The circuit breaker for `payment-service` is OPEN — we're returning cached fallback data."*

**Load Balancer** — Distributes incoming traffic across multiple service instances. Prevents any one instance from being overwhelmed.
> 💬 *"We have 3 instances of `order-service` behind a load balancer. Spring Cloud uses client-side load balancing."*

**Service Registry** — Central catalog where services register themselves (host, port, health). Eureka is the most common Spring Cloud registry.
> 💬 *"When a service instance starts, it registers with the service registry. Dead instances are deregistered."*

**Distributed System** — Multiple services running on different machines, communicating over a network. CAP theorem applies.
> 💬 *"Distributed systems introduce new failure modes: network partitions, latency, partial failures."*

**Event Driven Architecture** — Services communicate via events (async messages). Loose coupling. Producer doesn't know consumers.
> 💬 *"We publish `OrderCreatedEvent` to Kafka. Inventory, Email, and Analytics services consume it independently."*

**Saga Pattern** — Managing distributed transactions across microservices without a 2-phase commit. Either Choreography (events) or Orchestration (central coordinator).
> 💬 *"We use the Saga pattern for order placement — each step publishes success/failure events, compensating on failure."*

**CQRS (Command Query Responsibility Segregation)** — Separate models for reading (Query) and writing (Command). Read model can be denormalized for performance.
> 💬 *"CQRS lets us scale reads independently — the query model is an optimized read replica."*

**Event Sourcing** — Instead of storing current state, store the sequence of events that led to it. Replay events to rebuild state.
> 💬 *"With Event Sourcing, we can replay the entire order history to debug why an order ended up in an error state."*
