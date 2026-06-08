# 03 — SPRING FRAMEWORK
> 🧒 = Explain like a 12-year-old | ⚠️ = Interview trap | 🔁 = Rebuild from memory

---

## TOPIC TRACKER
| # | Topic | Status |
|---|-------|--------|
| 1 | Spring Core — IoC & DI | ⬜ |
| 2 | Spring Bean Lifecycle | ⬜ |
| 3 | AOP (Aspect Oriented Programming) | ⬜ |
| 4 | Spring Boot — Auto Configuration | ⬜ |
| 5 | Spring Boot — Starters & Properties | ⬜ |
| 6 | Spring MVC — REST API | ⬜ |
| 7 | Spring MVC — Request Lifecycle | ⬜ |
| 8 | Spring Security | ⬜ |
| 9 | Spring Profiles & Externalized Config | ⬜ |
| 10 | Spring Actuator & Monitoring | ⬜ |

---

## 1. SPRING CORE — IoC & DI

### IoC (Inversion of Control)
> 🧒 Normally YOU create objects. With IoC, Spring creates them FOR you. You just ask.
> Like a restaurant: you don't cook, you just order. Spring is the kitchen.

```java
// Without IoC (you manage dependencies)
class OrderService {
    PaymentService payment = new PaymentService(); // tightly coupled
    EmailService email = new EmailService();
}

// With IoC + DI (Spring manages it)
@Service
class OrderService {
    private final PaymentService payment;
    private final EmailService email;

    @Autowired // Spring injects these
    OrderService(PaymentService payment, EmailService email) {
        this.payment = payment;
        this.email = email;
    }
}
```

### Types of Dependency Injection
```java
// 1. Constructor Injection (RECOMMENDED — immutable, testable)
@Service
class UserService {
    private final UserRepository repo;
    UserService(UserRepository repo) { this.repo = repo; } // no @Autowired needed (single constructor)
}

// 2. Setter Injection (for optional dependencies)
@Service
class UserService {
    private UserRepository repo;
    @Autowired
    void setRepo(UserRepository repo) { this.repo = repo; }
}

// 3. Field Injection (common but discouraged — hard to test)
@Service
class UserService {
    @Autowired
    private UserRepository repo;
}
```

### ApplicationContext vs BeanFactory
| | BeanFactory | ApplicationContext |
|---|-------------|-------------------|
| Bean creation | Lazy (on demand) | Eager (on startup) |
| Events | ❌ | ✅ |
| i18n | ❌ | ✅ |
| AOP | Limited | Full support |
| Use | Lightweight/embedded | Always (production) |

---

## 2. SPRING BEAN LIFECYCLE

```
1. Instantiation       ← new Object()
2. Property Injection  ← @Autowired fields set
3. @PostConstruct      ← your init code runs
4. Ready to use
5. @PreDestroy         ← your cleanup code runs
6. Destroy
```

```java
@Component
class DataService {
    @PostConstruct
    void init() { System.out.println("Bean ready — init DB connection"); }

    @PreDestroy
    void cleanup() { System.out.println("Shutting down — close connection"); }
}
```

### Bean Scopes
| Scope | Instance | Use case |
|-------|----------|---------|
| `singleton` | ONE per ApplicationContext (default) | Stateless services |
| `prototype` | NEW on each request | Stateful objects |
| `request` | NEW per HTTP request (web) | Request-scoped data |
| `session` | NEW per HTTP session (web) | User session data |

```java
@Component
@Scope("prototype")
class ReportBuilder { ... }
```

### ⚠️ Traps
- Default scope is `singleton`. Injecting `prototype` into `singleton` = prototype behaves like singleton. Fix: use `@Lookup` or `ObjectProvider`.
- `@Component` = generic. `@Service` = business layer. `@Repository` = data layer. `@Controller` = web layer. All are `@Component` specializations.
- `@Bean` = manual bean definition inside `@Configuration` class.

---

## 3. AOP (ASPECT ORIENTED PROGRAMMING)

> 🧒 AOP = cut across many methods without touching them. Like logging or security that applies to ALL methods without copy-pasting.

```
@Aspect = the class with cross-cutting logic
Advice = when to run your code (before, after, around)
Pointcut = which methods to intercept
Join Point = actual method execution
```

```java
@Aspect
@Component
class LoggingAspect {

    // Pointcut = all methods in service package
    @Pointcut("execution(* com.example.service.*.*(..))")
    void serviceMethods() {}

    // Before advice
    @Before("serviceMethods()")
    void logBefore(JoinPoint jp) {
        System.out.println("Calling: " + jp.getSignature().getName());
    }

    // Around advice (most powerful — controls execution)
    @Around("serviceMethods()")
    Object logTime(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = pjp.proceed(); // actually calls the method
        long time = System.currentTimeMillis() - start;
        System.out.println("Took: " + time + "ms");
        return result;
    }

    // AfterThrowing — on exception
    @AfterThrowing(pointcut = "serviceMethods()", throwing = "ex")
    void logException(Exception ex) {
        System.out.println("Exception: " + ex.getMessage());
    }
}
```

### AOP Use Cases in Production
- Logging / auditing
- Transaction management (`@Transactional` is AOP!)
- Security checks
- Performance monitoring
- Retry logic

### ⚠️ Traps
- AOP only works on **Spring-managed beans**. Calling `this.method()` inside a bean bypasses AOP proxy.
- `@Around` must call `pjp.proceed()` or method never executes.
- Spring AOP = proxy-based (interface or CGLIB). AspectJ = byte-weaving (more powerful).

---

## 4. SPRING BOOT — AUTO CONFIGURATION

> 🧒 Spring Boot = Spring but smarter. You add a library, Spring Boot guesses what to set up. Like a new phone — turns on wifi automatically.

### How Auto-Configuration Works
```
1. You add dependency (e.g., spring-boot-starter-data-jpa)
2. Spring Boot scans META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
3. Finds DataSourceAutoConfiguration
4. Checks conditions (@ConditionalOnClass, @ConditionalOnMissingBean)
5. If conditions met → creates DataSource, EntityManager, etc. automatically
```

```java
// Conditional annotations
@ConditionalOnClass(DataSource.class)     // only if this class is on classpath
@ConditionalOnMissingBean(DataSource.class) // only if you haven't defined your own
@ConditionalOnProperty("spring.datasource.url") // only if property exists

// See what was auto-configured
// Run with: --debug flag or hit /actuator/conditions
```

### @SpringBootApplication = 3 annotations
```java
@SpringBootApplication
// = @Configuration + @EnableAutoConfiguration + @ComponentScan
public class App {
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
```

---

## 5. SPRING BOOT — STARTERS & PROPERTIES

### Key Starters
| Starter | Gives You |
|---------|-----------|
| `spring-boot-starter-web` | Spring MVC, Tomcat, Jackson |
| `spring-boot-starter-data-jpa` | Hibernate, Spring Data, JDBC |
| `spring-boot-starter-security` | Spring Security |
| `spring-boot-starter-test` | JUnit 5, Mockito, AssertJ |
| `spring-boot-starter-actuator` | Health, metrics, info endpoints |
| `spring-boot-starter-cache` | Caching abstraction |
| `spring-boot-starter-amqp` | RabbitMQ |
| `spring-boot-starter-data-redis` | Redis |

### application.properties / application.yml
```yaml
# Server
server:
  port: 8080
  servlet:
    context-path: /api

# DataSource
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: user
    password: pass
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
  
# Custom properties
app:
  max-retries: 3
  timeout-ms: 5000
```

```java
// Bind custom properties
@ConfigurationProperties(prefix = "app")
@Component
class AppConfig {
    private int maxRetries;
    private int timeoutMs;
    // getters/setters
}

// Or single value
@Value("${app.max-retries:3}") // 3 = default
private int maxRetries;
```

---

## 6. SPRING MVC — REST API

```java
@RestController              // = @Controller + @ResponseBody
@RequestMapping("/api/users")
class UserController {

    @Autowired UserService userService;

    @GetMapping                          // GET /api/users
    ResponseEntity<List<User>> getAll() {
        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/{id}")                 // GET /api/users/1
    ResponseEntity<User> getById(@PathVariable Long id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping                         // POST /api/users
    ResponseEntity<User> create(@RequestBody @Valid UserDto dto) {
        User saved = userService.save(dto);
        URI location = URI.create("/api/users/" + saved.getId());
        return ResponseEntity.created(location).body(saved);
    }

    @PutMapping("/{id}")                 // PUT /api/users/1
    ResponseEntity<User> update(@PathVariable Long id,
                                 @RequestBody @Valid UserDto dto) {
        return ResponseEntity.ok(userService.update(id, dto));
    }

    @DeleteMapping("/{id}")              // DELETE /api/users/1
    ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Query params: GET /api/users?name=John&age=30
    @GetMapping("/search")
    List<User> search(@RequestParam String name,
                       @RequestParam(defaultValue = "0") int age) {
        return userService.search(name, age);
    }
}
```

### Validation
```java
// DTO with validation
class UserDto {
    @NotBlank @Size(min=2, max=50) String name;
    @Email String email;
    @Min(18) @Max(120) int age;
    @NotNull LocalDate birthDate;
}

// Controller: add @Valid before @RequestBody
// Handle errors globally:
@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String,String>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String,String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
          .forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    ResponseEntity<String> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(404).body(ex.getMessage());
    }
}
```

### HTTP Status Codes
```
200 OK            — success
201 Created       — POST succeeded
204 No Content    — DELETE succeeded
400 Bad Request   — invalid input
401 Unauthorized  — not authenticated
403 Forbidden     — no permission
404 Not Found     — resource missing
409 Conflict      — duplicate
500 Internal Error — server bug
```

---

## 7. SPRING MVC — REQUEST LIFECYCLE

```
HTTP Request
    ↓
DispatcherServlet (Front Controller)
    ↓
HandlerMapping → finds @Controller method
    ↓
HandlerInterceptor.preHandle()
    ↓
Controller method executes
    ↓
HandlerInterceptor.postHandle()
    ↓
ViewResolver (or HttpMessageConverter for REST)
    ↓
HandlerInterceptor.afterCompletion()
    ↓
HTTP Response
```

### Filters vs Interceptors
| | Filter | Interceptor |
|---|--------|-------------|
| Level | Servlet container | Spring MVC |
| Access to Spring | ❌ | ✅ |
| Use for | Security, logging, CORS | Controller-level logic |
| Interface | `javax.servlet.Filter` | `HandlerInterceptor` |

---

## 8. SPRING SECURITY

```java
@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())        // disable for REST APIs
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### JWT Authentication Flow
```
1. User logs in → POST /auth/login {username, password}
2. Server validates → creates JWT (header.payload.signature)
3. Client stores JWT (localStorage or httpOnly cookie)
4. Client sends JWT in header: Authorization: Bearer <token>
5. Server validates JWT signature on each request
6. If valid → extract user from token → proceed
```

```java
// UserDetailsService — Spring Security loads user from DB
@Service
class CustomUserDetailsService implements UserDetailsService {
    @Autowired UserRepository repo;

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = repo.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException(username));
        return new org.springframework.security.core.userdetails.User(
            user.getUsername(),
            user.getPassword(),
            List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }
}
```

### Security Annotations
```java
@PreAuthorize("hasRole('ADMIN')")
public void deleteUser(Long id) { ... }

@PreAuthorize("hasRole('USER') and #id == authentication.principal.id")
public User getUser(Long id) { ... }

@Secured("ROLE_ADMIN")      // simpler, no SpEL
public void adminMethod() { ... }
```

### ⚠️ Traps
- Passwords must ALWAYS be hashed with BCrypt. Never store plain text.
- `@EnableMethodSecurity` required for `@PreAuthorize` to work.
- CORS must be configured explicitly for REST APIs (disable CSRF for stateless JWT).
- JWT is stateless — no server-side session. Logout = client deletes token.

---

## 9. SPRING PROFILES & CONFIG

```java
// Profile-specific beans
@Component
@Profile("dev")
class MockEmailService implements EmailService { ... }

@Component
@Profile("prod")
class SmtpEmailService implements EmailService { ... }

// Activate profile:
// application.properties: spring.profiles.active=dev
// VM arg: -Dspring.profiles.active=prod
// Env var: SPRING_PROFILES_ACTIVE=prod
```

```
# Profile-specific files
application.properties          (base)
application-dev.properties      (dev overrides)
application-prod.properties     (prod overrides)
application-test.properties     (test overrides)
```

### Config Priority (highest to lowest)
```
1. Command line args (--server.port=9090)
2. Environment variables
3. application-{profile}.properties
4. application.properties
5. @PropertySource files
6. Default values (@Value defaults)
```

---

## 10. SPRING ACTUATOR

```yaml
# Enable all endpoints
management:
  endpoints:
    web:
      exposure:
        include: "*"
  endpoint:
    health:
      show-details: always
```

| Endpoint | What it shows |
|----------|--------------|
| `/actuator/health` | App health + DB/cache/disk |
| `/actuator/info` | Build info, custom info |
| `/actuator/metrics` | JVM, HTTP, cache, DB metrics |
| `/actuator/env` | All properties |
| `/actuator/beans` | All Spring beans |
| `/actuator/mappings` | All @RequestMapping endpoints |
| `/actuator/threaddump` | Thread state dump |
| `/actuator/conditions` | Auto-config report |

```java
// Custom health indicator
@Component
class ExternalApiHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        boolean isUp = callExternalApi();
        return isUp ? Health.up().build()
                    : Health.down().withDetail("reason","API unreachable").build();
    }
}
```

---

## 🔁 REBUILD CHALLENGES

1. Explain IoC and DI with a real-world analogy.
2. What are the 3 types of DI? Which is recommended and why?
3. What does `@SpringBootApplication` expand to?
4. Draw the Spring MVC request lifecycle from HTTP request to response.
5. What is AOP? Give 3 real production use cases.
6. What is the difference between `@Component`, `@Service`, `@Repository`, `@Controller`?
7. Explain JWT authentication flow step by step.
8. What is Bean scope? What happens if a prototype bean is injected into a singleton?
9. How does Spring Boot Auto-Configuration work?
10. What is `@ControllerAdvice`/`@RestControllerAdvice` and why do you use it?
