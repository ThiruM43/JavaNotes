# M06 — MICROSERVICES & INTEGRATION MASTER
### Everything: Architecture + Spring Cloud + Kafka + RabbitMQ + Redis + Memory + EHR/ECR Examples

---

## DOMAIN ARCHITECTURE
```
EHR Microservices Ecosystem:

┌──────────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser/Mobile)                       │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   API GATEWAY (Spring Cloud Gateway)             │
│  /ehr/**  → ehr-service         Rate Limiting: 1000 req/min      │
│  /ecr/**  → ecr-service         JWT Validation (before routing)  │
│  /lab/**  → lab-service         Circuit Breaker per route        │
└──────┬────────────┬──────────────┬──────────────────────────────┘
       │            │              │
       ▼            ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│  EHR     │  │  ECR-NOW │  │  Lab Service │
│ Service  │  │ Service  │  │              │
│ :8081    │  │ :8082    │  │ :8083        │
│  own DB  │  │  own DB  │  │  own DB      │
└────┬─────┘  └────┬─────┘  └──────────────┘
     │             │
     └──────┬──────┘
            │ events via Kafka
            ▼
┌──────────────────────────────────────────────────────────────────┐
│                      KAFKA                                       │
│  Topics: lab-results, case-reports, appointments, notifications  │
└──────────────────────────────────────────────────────────────────┘
            │
┌───────────┴───────────────────────────────────────────────────┐
│  REDIS                                                        │
│  Patient cache, Session store, Rate limiting counters,        │
│  ECR submission state, Distributed locks                      │
└───────────────────────────────────────────────────────────────┘
```

---

## 1. SERVICE DISCOVERY — EUREKA

```java
// Eureka Server (standalone service)
@SpringBootApplication
@EnableEurekaServer
public class EhrDiscoveryServer { ... }

// application.yml for eureka-server
server:
  port: 8761
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
  server:
    enable-self-preservation: false  # dev only

// Each microservice registers itself
@SpringBootApplication
@EnableDiscoveryClient
public class EhrService {
    public static void main(String[] args) {
        SpringApplication.run(EhrService.class, args);
    }
}

// application.yml for ehr-service
spring:
  application:
    name: ehr-service  # service name in registry
eureka:
  client:
    service-url:
      defaultZone: http://eureka-server:8761/eureka/
  instance:
    instance-id: ${spring.application.name}:${server.port}
    prefer-ip-address: true

// Calling ECR-NOW from EHR using service name (not IP)
@Service
public class EcrClientService {
    // LoadBalanced: resolves "ecr-service" → actual IP via Eureka
    @Autowired @LoadBalanced RestTemplate restTemplate;

    public CaseReportStatus checkStatus(String reportId) {
        return restTemplate.getForObject(
            "http://ecr-service/ecr/api/reports/{id}/status",  // service name, not IP
            CaseReportStatus.class,
            reportId
        );
        // Eureka resolves "ecr-service" → 192.168.1.5:8082 (with load balancing)
    }
}

// Modern: OpenFeign (cleaner)
@FeignClient(name = "ecr-service", fallback = EcrClientFallback.class)
public interface EcrClient {
    @GetMapping("/ecr/api/reports/{id}/status")
    CaseReportStatus getStatus(@PathVariable("id") String reportId);

    @PostMapping("/ecr/api/reports")
    CaseReport submitReport(@RequestBody CaseReportRequest request);
}

// Fallback for when ECR-NOW is down
@Component
public class EcrClientFallback implements EcrClient {
    @Override
    public CaseReportStatus getStatus(String reportId) {
        return CaseReportStatus.UNKNOWN; // graceful degradation
    }
    @Override
    public CaseReport submitReport(CaseReportRequest request) {
        log.warn("ECR-NOW unavailable — queueing report {} for later", request.getId());
        pendingQueue.add(request);
        return CaseReport.pending(request.getId());
    }
}
```

---

## 2. API GATEWAY — SPRING CLOUD GATEWAY

```yaml
# gateway application.yml
spring:
  cloud:
    gateway:
      default-filters:
        - DedupeResponseHeader=Access-Control-Allow-Origin
        - name: RequestRateLimiter
          args:
            redis-rate-limiter.replenishRate: 100      # 100 req/sec steady
            redis-rate-limiter.burstCapacity: 200      # 200 req/sec burst
            key-resolver: "#{@userKeyResolver}"       # rate limit per user

      routes:
        - id: ehr-service
          uri: lb://ehr-service
          predicates:
            - Path=/ehr/**
          filters:
            - StripPrefix=1
            - name: CircuitBreaker
              args:
                name: ehr-circuit-breaker
                fallbackUri: forward:/fallback/ehr

        - id: ecr-service
          uri: lb://ecr-service
          predicates:
            - Path=/ecr/**
            - Method=GET,POST
          filters:
            - StripPrefix=1
            - AddRequestHeader=X-Source-System, Gateway
            - AddRequestHeader=X-Request-Id, #{T(java.util.UUID).randomUUID()}
```

```java
// Global filter: JWT validation before routing
@Component
public class JwtGatewayFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        // Skip auth for login endpoint
        if (path.contains("/auth/login")) return chain.filter(exchange);

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        try {
            String token = authHeader.substring(7);
            Claims claims = jwtService.validateAndExtract(token);

            // Add user info as headers to downstream services
            ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-User-Id", claims.get("userId").toString())
                .header("X-User-Roles", claims.get("roles").toString())
                .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        } catch (JwtException e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    @Override public int getOrder() { return -100; } // run before other filters
}

// Rate limiter: per user
@Bean
public KeyResolver userKeyResolver() {
    return exchange -> Mono.justOrEmpty(
        exchange.getRequest().getHeaders().getFirst("X-User-Id")
    ).defaultIfEmpty("anonymous");
}
```

---

## 3. CIRCUIT BREAKER — RESILIENCE4J

```java
// application.yml
resilience4j:
  circuitbreaker:
    instances:
      ecr-service:
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        failureRateThreshold: 50        # 50% failures → OPEN
        waitDurationInOpenState: 30s    # wait 30s before trying again
        permittedNumberOfCallsInHalfOpenState: 3
        recordExceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException
          - feign.FeignException.ServiceUnavailable
  retry:
    instances:
      ecr-service:
        maxAttempts: 3
        waitDuration: 2s
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2  # 2s, 4s, 8s
        retryExceptions:
          - java.io.IOException
  timelimiter:
    instances:
      ecr-service:
        timeoutDuration: 10s

// EHR Service calling ECR-NOW with full resilience
@Service
@Slf4j
public class EcrNowIntegrationService {

    @CircuitBreaker(name = "ecr-service", fallbackMethod = "submitFallback")
    @Retry(name = "ecr-service")
    @TimeLimiter(name = "ecr-service")
    public CompletableFuture<CaseReport> submitToCdcAsync(CaseReport report) {
        return CompletableFuture.supplyAsync(() ->
            ecrClient.submitReport(report.toRequest())
        );
    }

    // Fallback — called when circuit is OPEN or all retries exhausted
    public CompletableFuture<CaseReport> submitFallback(CaseReport report, Throwable t) {
        log.error("ECR-NOW unavailable after retries: {}. Report {} queued.",
                  t.getMessage(), report.getReportId());

        // Store in DB for later retry
        pendingReportRepo.save(PendingReport.from(report));

        // Notify ops
        alertService.sendAlert("ECR-NOW circuit breaker open — reports queuing");

        return CompletableFuture.completedFuture(
            report.toBuilder().status(ReportStatus.QUEUED_FOR_RETRY).build()
        );
    }
}

// Circuit Breaker states visualized:
/*
Normal: ECR-NOW healthy
  CLOSED → all calls go through → success rate 98%

ECR-NOW degraded: 60% failures
  CLOSED → failure rate > 50% threshold
  OPEN   → all calls immediately fail (no waiting 10s timeout)
           → fallback called immediately (fast fail)
           → reports queue in DB

After 30 seconds:
  HALF-OPEN → 3 test calls allowed
              → if 2/3 succeed → CLOSED (normal)
              → if 2/3 fail → back to OPEN
*/
```

---

## 4. KAFKA — EVENT-DRIVEN ECR

### Kafka Architecture for EHR
```
EHR Service (Producer)           Kafka Cluster                 ECR-NOW (Consumer)
────────────────────────────────────────────────────────────────────────────────
                                ┌─────────────────────┐
                                │   Topic: lab-results │
LabResultService                │   Partitions: 3      │         EcrSurveillance
  .save(result)                 │                      │         Consumer Group
     │                          │  P0: MRN-000-099     │──────→  Instance 1
     ├─→ kafka.send(            │  P1: MRN-100-199     │──────→  Instance 2
     │    "lab-results",        │  P2: MRN-200-299     │──────→  Instance 3
     │    mrn,                  │                      │         (each instance
     │    LabResultEvent)       │  Retention: 7 days   │          reads 1 partition)
     │                          └─────────────────────┘
     │
     │                          ┌─────────────────────┐
     │                          │ Topic: case-reports  │
     │                          │                      │         NotificationService
     │                          │                      │──────→  Consumer Group
     │                          └─────────────────────┘         (emails/SMS doctors)
     │
     │                          ┌─────────────────────┐
     │                          │Topic: ecr-submitted  │
ECR-NOW                         │                      │──────→  EHR updates status
  .onSubmitSuccess()  ──────→   │                      │
```

```java
// Kafka Producer in EHR
@Service
@RequiredArgsConstructor
public class LabResultEventPublisher {

    private final KafkaTemplate<String, LabResultEvent> kafkaTemplate;

    public void publishLabResult(LabResult result) {
        LabResultEvent event = LabResultEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .patientMrn(result.getPatient().getMrn())
            .labResultId(result.getId())
            .icdCode(result.getIcdCode())
            .isPositive(result.isPositive())
            .testName(result.getTestName())
            .resultDate(result.getResultDate())
            .timestamp(Instant.now())
            .build();

        // Key = MRN → same patient always goes to same partition → ordering preserved
        CompletableFuture<SendResult<String, LabResultEvent>> future =
            kafkaTemplate.send("lab-results", result.getPatient().getMrn(), event);

        future.thenAccept(sendResult -> {
            RecordMetadata metadata = sendResult.getRecordMetadata();
            log.info("Published lab result event. Topic: {}, Partition: {}, Offset: {}",
                metadata.topic(), metadata.partition(), metadata.offset());
        }).exceptionally(ex -> {
            log.error("Failed to publish lab result event for patient {}",
                result.getPatient().getMrn(), ex);
            // Critical: store in retry table
            failedEventRepo.save(FailedEvent.from(event, ex.getMessage()));
            return null;
        });
    }

    // Transactional publish — atomically write to DB AND publish event
    @Transactional
    public LabResult saveAndPublish(LabResult result) {
        LabResult saved = labResultRepo.save(result);    // DB write
        publishLabResult(saved);                           // Kafka publish
        return saved;
        // If Kafka fails: DB also rolls back (transactional outbox pattern safer though)
    }
}

// Kafka Consumer in ECR-NOW
@Component
@Slf4j
public class LabResultConsumer {

    @KafkaListener(
        topics = "lab-results",
        groupId = "ecr-surveillance",
        containerFactory = "labResultKafkaListenerContainerFactory"
    )
    public void consumeLabResult(
        ConsumerRecord<String, LabResultEvent> record,
        Acknowledgment acknowledgment
    ) {
        String mrn = record.key();
        LabResultEvent event = record.value();
        log.info("Received lab result for MRN={}, ICD={}, Positive={}",
            mrn, event.getIcdCode(), event.isPositive());

        try {
            if (event.isPositive() && diseaseService.isReportable(event.getIcdCode())) {
                CaseReport report = caseReportService.createFromLabResult(event);
                fhirSubmissionService.submit(report);
                log.info("ECR submitted for MRN={}, Report={}", mrn, report.getReportId());
            }
            acknowledgment.acknowledge(); // commit offset — "I processed this"
        } catch (DuplicateReportException e) {
            log.warn("Duplicate report for MRN={}, skipping", mrn);
            acknowledgment.acknowledge(); // still commit — don't reprocess
        } catch (Exception e) {
            log.error("Failed to process lab result for MRN={}", mrn, e);
            // DON'T acknowledge — Kafka will redeliver
            // But if it keeps failing → goes to Dead Letter Topic (DLT)
        }
    }

    // Dead Letter Topic consumer — handle failed messages
    @KafkaListener(topics = "lab-results.DLT", groupId = "ecr-dlt-handler")
    public void handleDlt(ConsumerRecord<String, LabResultEvent> record) {
        log.error("DLT message for MRN={}: {}", record.key(), record.value());
        alertService.sendAlert("ECR processing failure — manual intervention needed");
        dltRepo.save(new DeadLetterEntry(record));
    }
}

// Kafka Configuration
@Configuration
public class KafkaConfig {

    @Bean
    public ProducerFactory<String, LabResultEvent> producerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "kafka:9092");
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        props.put(ProducerConfig.ACKS_CONFIG, "all");       // wait for all replicas
        props.put(ProducerConfig.RETRIES_CONFIG, 3);
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true); // exactly-once
        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public ConsumerFactory<String, LabResultEvent> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "kafka:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "ecr-surveillance");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false); // manual ack
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 50); // batch size
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(),
            new JsonDeserializer<>(LabResultEvent.class));
    }
}
```

---

## 5. RABBITMQ — APPOINTMENT NOTIFICATIONS

```java
// RabbitMQ: task queue for notifications (different use case than Kafka)
// Kafka: high-throughput event streaming, replay, audit log
// RabbitMQ: message routing, task queues, request-reply

@Configuration
public class RabbitMqConfig {

    // Exchange: routes messages to queues
    @Bean
    public TopicExchange ehrExchange() { return new TopicExchange("ehr.exchange"); }

    // Queues
    @Bean
    public Queue appointmentReminderQueue() {
        return QueueBuilder.durable("appointment.reminders")
            .withArgument("x-dead-letter-exchange", "ehr.dlx")   // failed → DLX
            .withArgument("x-message-ttl", 86400000)              // TTL: 24 hours
            .build();
    }

    @Bean
    public Queue ecrAlertQueue() {
        return QueueBuilder.durable("ecr.alerts").build();
    }

    // Bindings: tie queues to exchange with routing keys
    @Bean
    public Binding reminderBinding(Queue appointmentReminderQueue, TopicExchange exchange) {
        return BindingBuilder.bind(appointmentReminderQueue)
                             .to(exchange)
                             .with("appointment.#"); // matches appointment.*.*
    }

    @Bean
    public Binding ecrAlertBinding(Queue ecrAlertQueue, TopicExchange exchange) {
        return BindingBuilder.bind(ecrAlertQueue)
                             .to(exchange)
                             .with("ecr.alert.*");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}

// Producer: EHR sends appointment reminders
@Service
@RequiredArgsConstructor
public class NotificationPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void sendAppointmentReminder(Appointment appointment) {
        AppointmentReminderMessage msg = AppointmentReminderMessage.builder()
            .appointmentId(appointment.getId())
            .patientEmail(appointment.getPatient().getEmail())
            .patientName(appointment.getPatient().getFullName())
            .doctorName(appointment.getDoctor().getFullName())
            .appointmentTime(appointment.getScheduledAt())
            .build();

        rabbitTemplate.convertAndSend(
            "ehr.exchange",
            "appointment.reminder.email",  // routing key
            msg
        );
        log.debug("Reminder queued for appointment {}", appointment.getId());
    }

    public void sendEcrAlert(String message, String jurisdiction) {
        rabbitTemplate.convertAndSend("ehr.exchange", "ecr.alert.public",
            new EcrAlertMessage(message, jurisdiction, Instant.now()));
    }
}

// Consumer: sends actual emails
@Component
@Slf4j
public class AppointmentReminderConsumer {

    @RabbitListener(queues = "appointment.reminders")
    public void handleReminder(AppointmentReminderMessage message,
                                Channel channel,
                                @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {
        try {
            emailService.sendReminder(
                message.getPatientEmail(),
                message.getPatientName(),
                message.getDoctorName(),
                message.getAppointmentTime()
            );
            channel.basicAck(deliveryTag, false); // success — ack
            log.info("Reminder sent to {}", message.getPatientEmail());
        } catch (EmailException e) {
            log.error("Failed to send reminder", e);
            channel.basicNack(deliveryTag, false, false); // fail — send to DLX
        }
    }
}
```

---

## 6. REDIS — CACHING & SESSION MANAGEMENT

```java
// Redis Configuration
@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))          // default TTL
            .disableCachingNullValues()
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()));

        return RedisCacheManager.builder(factory)
            .cacheDefaults(config)
            .withCacheConfiguration("patients",         // patient cache: 1 hour
                config.entryTtl(Duration.ofHours(1)))
            .withCacheConfiguration("icdCodes",         // ICD codes: 24 hours (rarely change)
                config.entryTtl(Duration.ofHours(24)))
            .build();
    }
}

// Service with Spring Cache Abstraction
@Service
public class PatientCacheService {

    @Cacheable(value = "patients", key = "#id",
               condition = "#id != null",
               unless = "#result == null")
    public PatientDto findById(Long id) {
        // Only called if not in cache
        Patient patient = patientRepo.findById(id).orElseThrow();
        return mapper.toDto(patient);
    }

    @CachePut(value = "patients", key = "#result.id") // update cache on save
    public PatientDto save(CreatePatientRequest request) {
        Patient saved = patientRepo.save(mapper.toEntity(request));
        return mapper.toDto(saved);
    }

    @CacheEvict(value = "patients", key = "#id") // remove from cache on delete
    public void delete(Long id) {
        patientRepo.deleteById(id);
    }

    @CacheEvict(value = "patients", allEntries = true) // clear all (e.g., bulk update)
    @Scheduled(cron = "0 0 * * * *") // every hour
    public void evictAllPatients() {
        log.info("Patient cache cleared");
    }
}

// Direct Redis operations for complex patterns
@Service
@RequiredArgsConstructor
public class EhrRedisService {

    private final RedisTemplate<String, Object> redis;
    private final StringRedisTemplate stringRedis;

    // Distributed lock — prevent duplicate ECR submissions
    public boolean tryAcquireEcrLock(String reportId) {
        Boolean acquired = redis.opsForValue()
            .setIfAbsent("ecr:lock:" + reportId, "LOCKED",
                          Duration.ofMinutes(5));     // auto-expires
        return Boolean.TRUE.equals(acquired);
    }
    public void releaseEcrLock(String reportId) {
        redis.delete("ecr:lock:" + reportId);
    }

    // Session store — active user sessions
    public void storeSession(String sessionId, UserSession session) {
        redis.opsForHash().putAll("session:" + sessionId, toMap(session));
        redis.expire("session:" + sessionId, Duration.ofHours(1));
    }
    public Optional<UserSession> getSession(String sessionId) {
        Map<Object, Object> entries = redis.opsForHash().entries("session:" + sessionId);
        return entries.isEmpty() ? Optional.empty() : Optional.of(fromMap(entries));
    }

    // Rate limiting — track API calls per doctor
    public boolean isRateLimited(String userId, int maxPerMinute) {
        String key = "rate:limit:" + userId + ":" + (System.currentTimeMillis() / 60000);
        Long count = stringRedis.opsForValue().increment(key);
        if (count == 1) stringRedis.expire(key, Duration.ofMinutes(2)); // set TTL on first
        return count > maxPerMinute;
    }

    // Leaderboard — most active doctors this week (Sorted Set)
    public void recordDoctorActivity(Long doctorId) {
        redis.opsForZSet().incrementScore("doctor:activity:week",
            doctorId.toString(), 1.0);
    }
    public Set<ZSetOperations.TypedTuple<Object>> getTopDoctors(int count) {
        return redis.opsForZSet().reverseRangeWithScores("doctor:activity:week", 0, count - 1);
    }

    // ECR pending submission counter (real-time dashboard)
    public void incrementPendingReports() {
        redis.opsForValue().increment("ecr:pending:count");
    }
    public long getPendingReportCount() {
        String val = stringRedis.opsForValue().get("ecr:pending:count");
        return val != null ? Long.parseLong(val) : 0;
    }
}
```

### Redis Memory Model
```
Redis stores data in RAM — that's why it's fast.

Key-Value in Redis memory:

┌─────────────────────────────────────────────────────────────────┐
│ Redis Server (RAM)                                              │
│                                                                 │
│ "patients:123"   → JSON blob (PatientDto as bytes)             │
│ "session:abc123" → Hash {userId: "42", role: "DOCTOR", ...}    │
│ "ecr:lock:R001"  → "LOCKED" (with 5-min TTL)                  │
│ "rate:limit:u1:26751760" → "47" (with 2-min TTL)              │
│ "doctor:activity:week" → ZSet{42: 150.0, 37: 120.0, ...}      │
│                                                                 │
│ Eviction Policy (when memory full):                             │
│   allkeys-lru → evict least recently used (good for caches)    │
│   volatile-lru → evict LRU from keys with TTL only             │
│   allkeys-lfu  → evict least frequently used                   │
└─────────────────────────────────────────────────────────────────┘

Redis Persistence (optional):
  RDB: periodic snapshots → redis.rdb (point-in-time recovery)
  AOF: log every write → appendonly.aof (better durability)
  Both: use RDB for backup + AOF for recovery
```

---

## 7. COMPLETE ECR-NOW EVENT FLOW

```
FULL WORKFLOW: Positive COVID Lab Result → Public Health Report

1. Doctor orders COVID test in EHR
   EHR: POST /lab-orders → LabOrder saved to DB

2. Lab processes test — result is POSITIVE
   Lab Service: POST /lab-results {icdCode: "U07.1", isPositive: true}
   Lab Service: saves to DB
   Lab Service: kafka.send("lab-results", mrn, LabResultEvent)

3. Kafka delivers event to ECR-NOW
   ECR-NOW Consumer: receives LabResultEvent
   ECR-NOW: diseaseService.isReportable("U07.1") → true
   ECR-NOW: checks Redis "ecr:lock:MRN001-U07.1" → not locked (no duplicate)
   ECR-NOW: sets Redis lock "ecr:lock:MRN001-U07.1" TTL=5min

4. ECR-NOW builds FHIR Case Report
   ECR-NOW: fetches patient demographics from EHR (via Feign client)
   ECR-NOW: fetches jurisdiction from RCKMS (condition-specific routing)
   ECR-NOW: builds FHIR R4 Bundle

5. ECR-NOW submits to state health department
   Circuit Breaker: state=CLOSED, call goes through
   FhirClient: POST https://state-health.gov/fhir/...
   Response: 201 Created, FHIR ID returned

6. ECR-NOW confirms back to EHR
   ECR-NOW: kafka.send("case-reports", mrn, CaseReportSubmittedEvent)
   EHR Consumer: receives event, updates lab_result.ecr_status = "SUBMITTED"
   EHR: notifies ordering doctor via RabbitMQ → email sent

7. EHR UI shows
   Doctor opens patient chart → "COVID-19 reported to State Health Dept (case #FHIR-001)"

Total time: ~3 seconds (async processing, UI not blocked)
```

---

## 8. SAGA PATTERN — DISTRIBUTED TRANSACTION

```java
// Scenario: New patient registration across EHR + Billing + Insurance services
// Can't use DB transaction (different services/DBs)
// Use SAGA: series of local transactions with compensating transactions on failure

// CHOREOGRAPHY-BASED SAGA (event-driven, no central coordinator)
@Service
public class PatientRegistrationSaga {

    // Step 1: EHR creates patient
    @KafkaListener(topics = "patient-registration-requested")
    public void createPatient(PatientRegistrationRequestEvent event) {
        try {
            Patient patient = patientService.create(event.toPatientDto());
            kafka.send("patient-created", patient.getMrn(),
                new PatientCreatedEvent(patient.getId(), event.getSagaId()));
        } catch (Exception e) {
            kafka.send("patient-registration-failed",
                new PatientRegistrationFailedEvent(event.getSagaId(), e.getMessage()));
        }
    }
}

@Service // Billing Service
public class BillingRegistrationSaga {

    // Step 2: Billing creates account AFTER patient created
    @KafkaListener(topics = "patient-created")
    public void createBillingAccount(PatientCreatedEvent event) {
        try {
            BillingAccount account = billingService.create(event.getPatientId());
            kafka.send("billing-account-created",
                new BillingAccountCreatedEvent(event.getSagaId(), account.getId()));
        } catch (Exception e) {
            // COMPENSATING TRANSACTION: undo patient creation
            kafka.send("compensate-patient-creation",
                new CompensatePatientEvent(event.getSagaId(), event.getPatientId()));
        }
    }

    // Compensation: called when downstream step fails
    @KafkaListener(topics = "compensate-billing-account")
    public void compensateBillingAccount(CompensateBillingEvent event) {
        billingService.delete(event.getBillingAccountId());
        log.warn("Saga {}: billing account {} rolled back", event.getSagaId(), event.getBillingAccountId());
    }
}
```

---

## 🔗 CONNECTIONS TO OTHER TOPICS

```
M06 Microservices & Integration
│
├─→ M01 Core Java      — DTOs, Events are Java classes; Exceptions cross service boundaries
├─→ M02 Collections    — BlockingQueue, ConcurrentHashMap used in consumers
├─→ M03 Concurrency    — @KafkaListener runs in thread pool; CompletableFuture for async
├─→ M04 Spring         — @FeignClient, @KafkaListener are Spring annotations
├─→ M05 JPA/Database   — Each service has its own DB (no shared schema)
└─→ M07 Testing        — @EmbeddedKafka for Kafka tests; Redis embedded for cache tests

Key Terms: Service Discovery, API Gateway, Circuit Breaker, Load Balancer,
           Kafka, Consumer Group, Offset, Partition, Dead Letter Topic,
           RabbitMQ, Exchange, Queue, Binding, Redis, Distributed Lock,
           Saga Pattern, CQRS, Event Sourcing
```

---

## 🔁 REBUILD CHALLENGES

1. Draw the EHR microservices architecture with all components.
2. Explain Circuit Breaker states: CLOSED → OPEN → HALF-OPEN. What triggers each?
3. Why is Kafka key=MRN important? What does it guarantee?
4. Write a `@KafkaListener` for lab results with manual acknowledgment and error handling.
5. What is a Dead Letter Topic? When does a message go there?
6. Explain the difference between Kafka and RabbitMQ. When to use each?
7. Write a Redis distributed lock for preventing duplicate ECR submissions.
8. What is the Saga pattern? Explain choreography vs orchestration.
9. Draw the complete flow from positive lab result to public health submission.
10. What is the Strangler Fig pattern? How would you use it to migrate EHR monolith?
