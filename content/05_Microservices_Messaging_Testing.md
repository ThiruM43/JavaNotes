# 05 — MICROSERVICES, MESSAGING & TESTING
> 🧒 = Explain like a 12-year-old | ⚠️ = Interview trap | 🔁 = Rebuild from memory

---

## TOPIC TRACKER
| # | Topic | Status |
|---|-------|--------|
| 1 | Microservices Architecture | ⬜ |
| 2 | Spring Cloud — Service Discovery | ⬜ |
| 3 | Spring Cloud — API Gateway | ⬜ |
| 4 | Spring Cloud — Circuit Breaker | ⬜ |
| 5 | Kafka | ⬜ |
| 6 | RabbitMQ | ⬜ |
| 7 | JUnit 5 | ⬜ |
| 8 | Mockito | ⬜ |
| 9 | Spring Boot Testing | ⬜ |
| 10 | Redis & Caching | ⬜ |
| 11 | Maven & Gradle | ⬜ |
| 12 | Logging (SLF4J/Logback) | ⬜ |

---

## 1. MICROSERVICES ARCHITECTURE

> 🧒 Monolith = one huge app doing everything. Microservices = many small apps, each doing one job. Like a restaurant with separate kitchen, cashier, delivery.

### Microservices vs Monolith
| | Monolith | Microservices |
|---|---------|--------------|
| Deploy | One unit | Each service independently |
| Scale | Scale whole app | Scale only bottleneck service |
| Fault isolation | ❌ one bug crashes all | ✅ isolated failures |
| Complexity | Simple to start | Complex to operate |
| Team | Single team | Multiple teams |
| DB | Shared | Each service owns its DB |

### Core Principles
```
1. Single Responsibility — one service = one domain (Users, Orders, Payments)
2. Loose Coupling — services communicate via API/events, not shared DB
3. High Cohesion — related things together
4. Database per Service — no shared DB
5. Design for Failure — any service can fail anytime
```

### Communication Patterns
```
Synchronous:
  REST (HTTP)    — simple, request-response
  gRPC           — faster, binary protocol, strong typing

Asynchronous:
  Kafka          — event streaming, high throughput
  RabbitMQ       — message queue, routing
```

### Common Patterns
| Pattern | Problem Solved |
|---------|---------------|
| API Gateway | Single entry point, routing, auth |
| Service Discovery | Services find each other dynamically |
| Circuit Breaker | Stop calling failing services |
| Saga | Distributed transactions across services |
| CQRS | Separate read/write models |
| Event Sourcing | Store events not state |
| Strangler Fig | Gradually migrate monolith to microservices |

---

## 2. SPRING CLOUD — SERVICE DISCOVERY

> 🧒 Service Discovery = phonebook for microservices. Instead of hardcoding IPs, services register themselves and find each other by name.

### Eureka (Netflix)
```yaml
# eureka-server application.yml
spring:
  application:
    name: eureka-server
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
```

```yaml
# microservice application.yml
spring:
  application:
    name: user-service
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

```java
// Server
@SpringBootApplication
@EnableEurekaServer
class EurekaServerApp { ... }

// Client
@SpringBootApplication
@EnableDiscoveryClient
class UserServiceApp { ... }

// Call another service by name (not IP)
@Bean
@LoadBalanced          // enables client-side load balancing
RestTemplate restTemplate() { return new RestTemplate(); }

// Usage: "http://order-service/..." instead of "http://192.168.1.5:8080/..."
ResponseEntity<Order> order = restTemplate.getForEntity(
    "http://order-service/api/orders/" + id, Order.class);
```

### Modern: Spring Cloud LoadBalancer + WebClient
```java
@Bean
@LoadBalanced
WebClient.Builder webClientBuilder() { return WebClient.builder(); }

// Usage
webClientBuilder.build()
    .get().uri("http://order-service/api/orders/{id}", id)
    .retrieve().bodyToMono(Order.class);
```

---

## 3. SPRING CLOUD — API GATEWAY

> 🧒 API Gateway = single front door. One entry point for all client requests. Routes, filters, authenticates.

```yaml
# application.yml — Spring Cloud Gateway
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service      # lb:// = load-balanced
          predicates:
            - Path=/api/users/**
          filters:
            - StripPrefix=1
            - AddRequestHeader=X-Source, Gateway

        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
            - Method=GET,POST

      default-filters:
        - name: RequestRateLimiter
          args:
            redis-rate-limiter.replenishRate: 10
            redis-rate-limiter.burstCapacity: 20
```

```java
// Global filter (e.g., auth, logging)
@Component
class AuthFilter implements GlobalFilter {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String token = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (token == null) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
        return chain.filter(exchange);
    }
}
```

---

## 4. CIRCUIT BREAKER (Resilience4j)

> 🧒 Circuit Breaker = electrical fuse. If a service keeps failing, stop calling it. Give it time to recover. Try again later.

```
CLOSED  → calls go through normally
   ↓ (failure rate > threshold)
OPEN    → all calls fail immediately (fast fail, no timeout)
   ↓ (after wait duration)
HALF-OPEN → limited calls go through to test recovery
   ↓ (if succeed)
CLOSED again
```

```java
// pom.xml: spring-boot-starter-aop + resilience4j-spring-boot2
@Service
class OrderService {

    @CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
    @Retry(name = "paymentService")
    @TimeLimiter(name = "paymentService")
    public Mono<String> processPayment(PaymentRequest req) {
        return webClient.post().uri("http://payment-service/pay")
            .bodyValue(req).retrieve().bodyToMono(String.class);
    }

    // Fallback — same signature + Throwable
    public Mono<String> paymentFallback(PaymentRequest req, Throwable t) {
        log.warn("Payment service down, using fallback", t);
        return Mono.just("PENDING"); // queue for later
    }
}
```

```yaml
resilience4j:
  circuitbreaker:
    instances:
      paymentService:
        slidingWindowSize: 10
        failureRateThreshold: 50     # 50% failures → OPEN
        waitDurationInOpenState: 5s
        permittedNumberOfCallsInHalfOpenState: 3
  retry:
    instances:
      paymentService:
        maxAttempts: 3
        waitDuration: 1s
        retryExceptions:
          - java.io.IOException
```

### Other Resilience Patterns
```java
@RateLimiter(name = "api")    // limit calls per time period
@Bulkhead(name = "db")        // limit concurrent calls
```

---

## 5. KAFKA

> 🧒 Kafka = a newspaper printing system. Publishers (producers) print news. Subscribers (consumers) read what they want from their paper pile (topic). No waiting for each other.

### Core Concepts
```
Producer  → sends messages to Topic
Topic     → named channel, split into Partitions
Partition → ordered, immutable log of messages
Offset    → position of message in partition
Consumer  → reads messages, tracks offset
Consumer Group → multiple consumers share partitions (horizontal scale)
Broker    → Kafka server
Zookeeper / KRaft → cluster coordination
```

### Spring Kafka
```java
// Producer
@Service
class OrderProducer {
    @Autowired KafkaTemplate<String, OrderEvent> kafkaTemplate;

    void publishOrder(Order order) {
        OrderEvent event = new OrderEvent(order.getId(), "ORDER_CREATED");
        kafkaTemplate.send("orders", order.getId().toString(), event);
    }
}

// Consumer
@Component
class OrderConsumer {
    @KafkaListener(topics = "orders", groupId = "inventory-service")
    void consumeOrder(OrderEvent event, Acknowledgment ack) {
        log.info("Processing order: {}", event.getOrderId());
        inventoryService.reserveItems(event);
        ack.acknowledge(); // manual commit offset
    }
}
```

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all          # wait for all replicas
      retries: 3
    consumer:
      group-id: my-service
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      enable-auto-commit: false  # manual commit
```

### Kafka vs RabbitMQ
| | Kafka | RabbitMQ |
|---|-------|---------|
| Type | Log/event streaming | Message queue |
| Message retention | Configurable (days) | Until consumed |
| Throughput | Very high (millions/sec) | High (thousands/sec) |
| Ordering | Per partition | Per queue |
| Use case | Event sourcing, analytics, audit | Task queues, RPC |
| Replay | ✅ (read old offsets) | ❌ |

---

## 6. RABBITMQ

> 🧒 RabbitMQ = postal system. You put a letter in a mailbox (queue). The postman (consumer) delivers it. Exchange routes letters to correct mailboxes.

### Core Concepts
```
Producer → Exchange → [Binding] → Queue → Consumer

Exchange types:
  direct  → route by exact routing key
  topic   → route by pattern (*.log, order.#)
  fanout  → broadcast to all queues
  headers → route by message headers
```

```java
// Config
@Configuration
class RabbitConfig {
    @Bean Queue orderQueue() { return new Queue("orders", true); } // durable
    @Bean TopicExchange exchange() { return new TopicExchange("app-exchange"); }
    @Bean Binding binding(Queue q, TopicExchange e) {
        return BindingBuilder.bind(q).to(e).with("order.*");
    }
}

// Producer
@Service
class OrderProducer {
    @Autowired RabbitTemplate rabbitTemplate;

    void sendOrder(Order order) {
        rabbitTemplate.convertAndSend("app-exchange", "order.created", order);
    }
}

// Consumer
@Component
class OrderConsumer {
    @RabbitListener(queues = "orders")
    void receive(Order order) {
        System.out.println("Received: " + order.getId());
    }
}
```

---

## 7. JUNIT 5

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("UserService Tests")
class UserServiceTest {

    @BeforeEach void setUp() { /* runs before each test */ }
    @AfterEach void tearDown() { /* runs after each test */ }
    @BeforeAll static void setUpAll() { /* runs once before all tests */ }
    @AfterAll static void tearDownAll() { /* runs once after all tests */ }

    @Test
    @DisplayName("Should return user by id")
    void testFindById() {
        User user = service.findById(1L);
        assertNotNull(user);
        assertEquals("John", user.getName());
    }

    @Test
    void testException() {
        assertThrows(UserNotFoundException.class, () -> service.findById(999L));
    }

    @Test
    void testMultiple() {
        assertAll(
            () -> assertEquals("John", user.getName()),
            () -> assertEquals(30, user.getAge()),
            () -> assertNotNull(user.getEmail())
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {"Alice", "Bob", "Charlie"})
    void testWithMultipleNames(String name) {
        assertNotNull(service.findByName(name));
    }

    @ParameterizedTest
    @CsvSource({"1,Alice", "2,Bob", "3,Charlie"})
    void testWithCsv(Long id, String name) {
        assertEquals(name, service.findById(id).getName());
    }

    @Disabled("Not implemented yet")
    @Test void skippedTest() { }

    @Test
    @Timeout(5) // fail if takes > 5 seconds
    void testPerformance() { ... }
}
```

---

## 8. MOCKITO

> 🧒 Mockito = stunt double for your dependencies. Test your code without hitting the real DB/API.

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepo;       // fake/mock
    @Mock EmailService emailService;
    @InjectMocks UserService userService; // inject mocks into this

    @Test void testCreateUser() {
        // Arrange — define what mock returns
        UserDto dto = new UserDto("John", "john@example.com");
        User savedUser = new User(1L, "John", "john@example.com");
        when(userRepo.save(any(User.class))).thenReturn(savedUser);
        when(userRepo.existsByEmail("john@example.com")).thenReturn(false);

        // Act
        User result = userService.createUser(dto);

        // Assert
        assertEquals("John", result.getName());

        // Verify — did the method get called?
        verify(userRepo, times(1)).save(any(User.class));
        verify(emailService).sendWelcome(eq("john@example.com"));
        verify(userRepo, never()).delete(any());
    }

    @Test void testThrowsException() {
        when(userRepo.findById(999L)).thenThrow(new UserNotFoundException(999L));
        assertThrows(UserNotFoundException.class, () -> userService.findById(999L));
    }

    @Test void testVoidMethod() {
        doNothing().when(emailService).sendWelcome(anyString());
        doThrow(new RuntimeException()).when(emailService).sendWelcome("bad@email");
    }

    // Capture argument
    @Test void testCapture() {
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        userService.createUser(dto);
        verify(userRepo).save(captor.capture());
        assertEquals("ACTIVE", captor.getValue().getStatus().name());
    }
}
```

---

## 9. SPRING BOOT TESTING

```java
// Full integration test — loads entire context
@SpringBootTest
@AutoConfigureMockMvc
class UserControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test void testGetUser() throws Exception {
        mockMvc.perform(get("/api/users/1")
                .header("Authorization", "Bearer " + getToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("John"))
            .andExpect(jsonPath("$.email").exists());
    }

    @Test void testCreateUser() throws Exception {
        UserDto dto = new UserDto("Jane", "jane@example.com");
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists());
    }
}

// Slice test — only web layer (faster)
@WebMvcTest(UserController.class)
class UserControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean UserService userService; // mock the service layer
}

// Repository slice test — only JPA layer
@DataJpaTest
class UserRepositoryTest {
    @Autowired UserRepository userRepo;
    @Autowired TestEntityManager em;

    @Test void testFindByEmail() {
        em.persistAndFlush(new User("John","john@test.com"));
        Optional<User> found = userRepo.findByEmail("john@test.com");
        assertTrue(found.isPresent());
    }
}

// TestContainers — real DB in tests
@SpringBootTest
@Testcontainers
class IntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:15");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", postgres::getJdbcUrl);
        r.add("spring.datasource.username", postgres::getUsername);
        r.add("spring.datasource.password", postgres::getPassword);
    }
}
```

---

## 10. REDIS & CACHING

> 🧒 Redis = super-fast memory notebook. Store frequently needed data there instead of hitting DB every time.

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: secret
  cache:
    type: redis
    redis:
      time-to-live: 600000 # 10 minutes
```

```java
// Spring Cache with Redis
@Cacheable(value = "users", key = "#id")
User findById(Long id) { return userRepo.findById(id).orElseThrow(); }

@CacheEvict(value = "users", key = "#id")
void deleteUser(Long id) { userRepo.deleteById(id); }

// Direct Redis operations
@Autowired StringRedisTemplate redisTemplate;
@Autowired RedisTemplate<String, Object> objectRedisTemplate;

void storeSession(String token, UserSession session) {
    redisTemplate.opsForValue().set("session:" + token,
        serialize(session), Duration.ofMinutes(30));
}

// Pub/Sub
redisTemplate.convertAndSend("notifications", "User logged in");

@Bean
MessageListenerAdapter adapter() {
    return new MessageListenerAdapter(new MessageListener() {
        @Override public void onMessage(Message msg, byte[] pattern) {
            System.out.println("Received: " + new String(msg.getBody()));
        }
    });
}
```

### Redis Data Structures
| Structure | Command | Use Case |
|-----------|---------|---------|
| String | SET/GET | Cache, counters |
| Hash | HSET/HGET | Object storage |
| List | LPUSH/RPOP | Queue, recent items |
| Set | SADD/SMEMBERS | Tags, unique items |
| ZSet (Sorted) | ZADD/ZRANGE | Leaderboards, scores |
| TTL | EXPIRE | Session expiry |

---

## 11. MAVEN & GRADLE

### Maven — pom.xml
```xml
<project>
  <groupId>com.example</groupId>
  <artifactId>my-app</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <packaging>jar</packaging>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
  </parent>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <scope>provided</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>
```

### Maven Lifecycle Phases
```
validate → compile → test → package → verify → install → deploy

mvn clean package        # compile + test + create JAR
mvn clean package -DskipTests  # skip tests
mvn spring-boot:run      # run app
mvn dependency:tree      # show dep tree
mvn versions:display-dependency-updates  # check outdated
```

### Gradle — build.gradle
```groovy
plugins {
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
    id 'java'
}

group = 'com.example'
version = '1.0.0'

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

```
./gradlew clean build    # compile + test + JAR
./gradlew bootRun        # run app
./gradlew dependencies   # show deps
```

---

## 12. LOGGING (SLF4J / LOGBACK)

> 🧒 Never use `System.out.println` in production. Use a logger — it controls WHERE logs go, HOW detailed, and lets you turn off verbose logs.

```java
// Lombok @Slf4j (preferred — adds log field automatically)
@Slf4j
@Service
class UserService {
    void createUser(UserDto dto) {
        log.debug("Creating user: {}", dto.getEmail());   // dev only
        log.info("User created: id={}, email={}", id, dto.getEmail());
        log.warn("User already exists: {}", dto.getEmail());
        log.error("Failed to create user", exception);
    }
}

// Without Lombok
private static final Logger log = LoggerFactory.getLogger(UserService.class);
```

### Log Levels (low to high verbosity)
```
TRACE → DEBUG → INFO → WARN → ERROR
```

### application.yml config
```yaml
logging:
  level:
    root: INFO                         # default
    com.example: DEBUG                 # your code — verbose
    org.hibernate.SQL: DEBUG           # show SQL
    org.hibernate.type: TRACE          # show SQL params
  file:
    name: logs/application.log
  pattern:
    console: "%d{HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

### Structured Logging (production best practice)
```java
// MDC — add context to every log in a thread
MDC.put("userId", userId.toString());
MDC.put("requestId", requestId);
// now all logs in this thread include userId and requestId
log.info("Processing order");  // → includes userId=123, requestId=abc in log

MDC.clear(); // clean up after request
```

---

## 🔁 REBUILD CHALLENGES

1. What is a microservice? When would you NOT use microservices?
2. Explain Circuit Breaker states (CLOSED → OPEN → HALF-OPEN).
3. What is Kafka? Draw: Producer → Topic → Consumer Group.
4. Difference between Kafka and RabbitMQ. When to use each?
5. Write a JUnit 5 test with `@ParameterizedTest`.
6. Explain `@Mock` vs `@MockBean` in Spring testing.
7. What is an API Gateway? What does it do?
8. What is Service Discovery? Why not just hardcode IPs?
9. Name 5 Redis data structures and one use case each.
10. What's the difference between `@SpringBootTest`, `@WebMvcTest`, and `@DataJpaTest`?
