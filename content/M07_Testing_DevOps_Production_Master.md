# M07 — Testing, DevOps & Production Master
## EHR / ECR-NOW Domain | Java Senior Interview Series

> **Connects to:** M01 (OOP/entities), M02 (Collections/DSA), M03 (Concurrency/Streams), M04 (Spring), M05 (JPA/DB), M06 (Microservices)
> **Memory Story:** Every time you write a test, the JVM spins up a mini universe. Spring context loads beans into heap. Mocks live in stack frames. TestContainers spins up real Docker containers in a child process. When the test ends, GC reclaims it all.

---

## PART 1 — JUnit 5: The Test Framework

### 1.1 Core Annotations

```java
// PatientServiceTest.java
@ExtendWith(MockitoExtension.class)          // JUnit 5 Mockito integration
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private EcrSubmissionService ecrSubmissionService;

    @InjectMocks
    private PatientService patientService;            // Mocks injected here

    @BeforeAll
    static void initAll() {
        // Runs ONCE before all tests in this class
        // Use for expensive setup: static test data, DB connections
        System.out.println("Setting up PatientServiceTest suite");
    }

    @BeforeEach
    void setUp() {
        // Runs before EACH test — reset state, prepare fresh data
        // Mockito resets @Mock fields automatically with MockitoExtension
    }

    @AfterEach
    void tearDown() {
        // Runs after EACH test — cleanup (files, temp state)
    }

    @AfterAll
    static void cleanUp() {
        // Runs ONCE after all tests — close shared resources
    }

    @Test
    @DisplayName("Should register patient and trigger ECR when condition is reportable")
    void shouldRegisterPatientAndTriggerEcr() {
        // GIVEN
        CreatePatientRequest request = buildCreatePatientRequest("John", "Doe", "COVID-19");
        Patient savedPatient = buildPatient(1L, "MRN-001");
        when(patientRepository.save(any(Patient.class))).thenReturn(savedPatient);
        when(ecrSubmissionService.isReportable("COVID-19")).thenReturn(true);

        // WHEN
        PatientResponse response = patientService.registerPatient(request);

        // THEN
        assertNotNull(response);
        assertEquals("MRN-001", response.getMrn());
        verify(ecrSubmissionService).submitCaseReport(eq(savedPatient), eq("COVID-19"));
    }

    @Test
    @DisplayName("Should throw PatientNotFoundException when MRN does not exist")
    void shouldThrowWhenPatientNotFound() {
        // GIVEN
        when(patientRepository.findByMrn("UNKNOWN")).thenReturn(Optional.empty());

        // WHEN + THEN
        PatientNotFoundException ex = assertThrows(
            PatientNotFoundException.class,
            () -> patientService.findByMrn("UNKNOWN")
        );
        assertEquals("Patient not found: UNKNOWN", ex.getMessage());
        // No verify needed — exception proves submission wasn't called
        verifyNoInteractions(ecrSubmissionService);
    }

    @Test
    @DisplayName("Should validate all required fields at once")
    void shouldValidatePatientFields() {
        Patient patient = buildPatient(1L, "MRN-001");

        // assertAll: runs ALL assertions even if one fails
        assertAll("patient fields",
            () -> assertNotNull(patient.getMrn(), "MRN must not be null"),
            () -> assertFalse(patient.getMrn().isEmpty(), "MRN must not be empty"),
            () -> assertNotNull(patient.getDateOfBirth(), "DOB required"),
            () -> assertTrue(patient.getDateOfBirth().isBefore(LocalDate.now()), "DOB in past")
        );
    }

    @Test
    @Timeout(value = 500, unit = TimeUnit.MILLISECONDS)   // Fail if takes > 500ms
    @DisplayName("ECR submission must complete within SLA")
    void ecrSubmissionMeetsSla() {
        // If this hangs (external call not mocked), test fails with TimeoutException
        when(ecrSubmissionService.submitCaseReport(any(), any())).thenReturn(true);
        patientService.triggerEcrForPatient(buildPatient(1L, "MRN-001"), "COVID-19");
    }

    @Test
    @Disabled("ECR-NOW API down in dev — re-enable when fixed")
    void disabledIntegrationTest() { }
}
```

### 1.2 Parameterized Tests — Test Multiple Inputs

```java
@ParameterizedTest
@DisplayName("Should correctly classify reportable conditions")
@ValueSource(strings = {"COVID-19", "EBOLA", "MEASLES", "TUBERCULOSIS"})
void shouldClassifyReportableConditions(String icdCode) {
    assertTrue(icdCodeService.isReportable(icdCode));
}

@ParameterizedTest
@DisplayName("Should reject non-reportable conditions")
@ValueSource(strings = {"COMMON_COLD", "SPRAINED_ANKLE", "VITAMIN_D_DEFICIENCY"})
void shouldRejectNonReportable(String icdCode) {
    assertFalse(icdCodeService.isReportable(icdCode));
}

// CsvSource: test multiple fields
@ParameterizedTest
@CsvSource({
    "COVID-19, CONFIRMED, true",
    "COVID-19, SUSPECTED, true",
    "COVID-19, RULED_OUT, false",
    "FLU,     CONFIRMED, false"
})
void shouldDetermineEcrNeed(String icdCode, String status, boolean expected) {
    assertEquals(expected, ecrService.requiresReporting(icdCode, ReportStatus.valueOf(status)));
}

// MethodSource: complex objects
@ParameterizedTest
@MethodSource("patientRiskScenarios")
void shouldCalculateRiskLevel(Patient patient, RiskLevel expectedRisk) {
    assertEquals(expectedRisk, riskCalculator.calculate(patient));
}

static Stream<Arguments> patientRiskScenarios() {
    return Stream.of(
        Arguments.of(patientWithAge(25, false), RiskLevel.LOW),
        Arguments.of(patientWithAge(70, true),  RiskLevel.HIGH),
        Arguments.of(patientWithAge(55, true),  RiskLevel.MEDIUM)
    );
}
```

### 1.3 JUnit 5 vs JUnit 4 — Key Differences

| Feature | JUnit 4 | JUnit 5 |
|---------|---------|---------|
| Import | `org.junit.*` | `org.junit.jupiter.api.*` |
| Before | `@Before` | `@BeforeEach` |
| Before class | `@BeforeClass` | `@BeforeAll` |
| Ignore | `@Ignore` | `@Disabled` |
| Expected exception | `@Test(expected=...)` | `assertThrows(...)` |
| Test runner | `@RunWith` | `@ExtendWith` |
| Multi-assertions | Not built-in | `assertAll(...)` |
| Parameterized | Separate class | `@ParameterizedTest` |

---

## PART 2 — Mockito: Mocking and Verification

### 2.1 Core Mocking

```java
// Three ways to create mocks
PatientRepository mock1 = Mockito.mock(PatientRepository.class);  // Programmatic
@Mock PatientRepository mock2;                                     // Annotation (needs extension)
@MockBean PatientRepository mock3;                                 // Spring context mock (replaces bean)

// Stubbing — when X is called, return Y
when(patientRepository.findByMrn("MRN-001"))
    .thenReturn(Optional.of(patient));               // Return value

when(patientRepository.findByMrn("MISSING"))
    .thenReturn(Optional.empty());                   // Empty

when(patientRepository.save(any()))
    .thenThrow(new DataIntegrityViolationException("Duplicate MRN"));  // Throw

// Chained returns (first call → A, second call → B)
when(ecrClient.submitReport(any()))
    .thenReturn(EcrResponse.pending())
    .thenReturn(EcrResponse.accepted());             // Returns pending first, then accepted

// Answer — dynamic response
when(patientRepository.save(any(Patient.class)))
    .thenAnswer(invocation -> {
        Patient p = invocation.getArgument(0);
        p.setId(ThreadLocalRandom.current().nextLong(1, 1000));
        return p;
    });

// Void methods
doNothing().when(auditService).logAccess(any());           // Do nothing
doThrow(new AuditException()).when(auditService).logAccess(eq("FORBIDDEN"));
```

### 2.2 Argument Matchers

```java
// Exact value
when(repo.findByMrn(eq("MRN-001"))).thenReturn(Optional.of(p));

// Any of type
when(repo.save(any(Patient.class))).thenReturn(p);

// Null / not null
when(service.enrich(isNull())).thenThrow(new IllegalArgumentException());
when(service.enrich(notNull())).thenReturn(enriched);

// Custom matcher
when(repo.findAll(argThat(spec -> spec != null))).thenReturn(list);

// RULE: If you use ANY matcher, ALL args must use matchers
// BAD:  when(svc.find("MRN-001", any()))  — compile error
// GOOD: when(svc.find(eq("MRN-001"), any()))
```

### 2.3 Verification

```java
// Verify called exactly once (default)
verify(ecrSubmissionService).submitCaseReport(patient, "COVID-19");

// Verify call count
verify(notificationService, times(3)).sendAlert(any());
verify(auditService, never()).logAccess("FORBIDDEN_ENDPOINT");
verify(cacheService, atLeastOnce()).evict(any());
verify(cacheService, atMost(2)).evict(any());

// Verify no other interactions happened
verifyNoMoreInteractions(patientRepository);
verifyNoInteractions(billingService);      // Nothing at all

// Verify order of interactions
InOrder order = inOrder(patientRepository, ecrSubmissionService);
order.verify(patientRepository).save(any());
order.verify(ecrSubmissionService).submitCaseReport(any(), any());
```

### 2.4 ArgumentCaptor — Capture What Was Passed

```java
@Test
void shouldSubmitCorrectEcrPayload() {
    // GIVEN
    Patient patient = buildPatient(1L, "MRN-001");
    patient.setConditions(List.of("COVID-19"));
    when(patientRepository.save(any())).thenReturn(patient);

    // WHEN
    patientService.registerAndReport(buildRequest());

    // THEN — capture the actual EcrSubmission object passed
    ArgumentCaptor<EcrSubmission> captor = ArgumentCaptor.forClass(EcrSubmission.class);
    verify(ecrSubmissionService).submit(captor.capture());

    EcrSubmission captured = captor.getValue();
    assertEquals("MRN-001", captured.getPatientMrn());
    assertEquals("COVID-19", captured.getPrimaryCondition());
    assertNotNull(captured.getSubmissionTimestamp());
    assertTrue(captured.getFhirBundle().contains("\"resourceType\":\"Bundle\""));
}
```

### 2.5 Spy — Partial Mock

```java
// Spy wraps a real object — real methods called unless stubbed
PatientService spy = Mockito.spy(new PatientService(repo, ecrService));

// Override one method, keep others real
doReturn(mockBundle).when(spy).buildFhirBundle(any());

// Now real method runs but uses mocked buildFhirBundle
spy.registerAndReport(request);

// @Spy annotation
@Spy
private PatientEnricher patientEnricher = new PatientEnricher();
// All real methods work; you can stub specific ones
```

---

## PART 3 — Spring Boot Testing

### 3.1 Test Slices — Load Only What You Need

```
@SpringBootTest        → Full context (all beans, DB, security, everything)
@WebMvcTest            → Only web layer (controllers, filters, security — NO service/repo)
@DataJpaTest           → Only JPA layer (entities, repos, in-memory H2 — NO services/web)
@JsonTest              → Only Jackson serialization/deserialization
@RestClientTest        → Only RestTemplate / WebClient
```

### 3.2 @WebMvcTest — Testing Controllers

```java
@WebMvcTest(PatientController.class)
@Import(SecurityConfig.class)    // Add if security needed
class PatientControllerTest {

    @Autowired
    private MockMvc mockMvc;         // HTTP simulation without starting server

    @MockBean
    private PatientService patientService;   // Replace with mock in Spring context

    @MockBean
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(roles = "NURSE")
    void shouldCreatePatientSuccessfully() throws Exception {
        // GIVEN
        CreatePatientRequest request = new CreatePatientRequest("John", "Doe",
            LocalDate.of(1985, 3, 15), "john@example.com");
        PatientResponse response = new PatientResponse(1L, "MRN-001", "John", "Doe");

        when(patientService.registerPatient(any(CreatePatientRequest.class)))
            .thenReturn(response);

        // WHEN + THEN
        mockMvc.perform(
            post("/api/v1/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .header("Authorization", "Bearer test-token")
        )
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.mrn").value("MRN-001"))
        .andExpect(jsonPath("$.firstName").value("John"))
        .andExpect(jsonPath("$.id").isNumber())
        .andDo(print());   // Print request/response to console for debugging
    }

    @Test
    void shouldReturn401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/patients/MRN-001"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "NURSE")
    void shouldReturn400WhenValidationFails() throws Exception {
        // Missing required fields
        String invalidJson = "{\"firstName\": \"\", \"lastName\": null}";

        mockMvc.perform(
            post("/api/v1/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson)
        )
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors").isArray())
        .andExpect(jsonPath("$.errors[?(@.field=='firstName')]").exists());
    }

    @Test
    @WithMockUser(roles = "NURSE")
    void shouldReturn404WhenPatientNotFound() throws Exception {
        when(patientService.findByMrn("UNKNOWN"))
            .thenThrow(new PatientNotFoundException("Patient not found: UNKNOWN"));

        mockMvc.perform(get("/api/v1/patients/UNKNOWN"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Patient not found: UNKNOWN"));
    }

    // jsonPath cheat sheet:
    // $.fieldName                → root-level field
    // $.nested.field             → nested field
    // $.array[0].field           → array element
    // $.array.length()           → array length
    // $.array[?(@.x=='value')]   → filter expression
}
```

### 3.3 @DataJpaTest — Testing Repositories

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)  // Use real DB (not H2)
@Import(AuditConfig.class)                          // If auditing needed
class PatientRepositoryTest {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private TestEntityManager em;   // Hibernate EntityManager for test setup

    private Patient savedPatient;

    @BeforeEach
    void setUp() {
        Patient patient = new Patient();
        patient.setMrn("MRN-TEST-001");
        patient.setFirstName("Jane");
        patient.setLastName("Smith");
        patient.setDateOfBirth(LocalDate.of(1990, 6, 15));
        patient.setStatus(PatientStatus.ACTIVE);
        savedPatient = em.persistAndFlush(patient);  // Save + flush to DB
    }

    @Test
    void shouldFindByMrn() {
        Optional<Patient> found = patientRepository.findByMrn("MRN-TEST-001");
        assertTrue(found.isPresent());
        assertEquals("Jane", found.get().getFirstName());
    }

    @Test
    void shouldFindActivePatientsByLastName() {
        List<Patient> patients = patientRepository
            .findByLastNameContainingIgnoreCaseAndStatus("smith", PatientStatus.ACTIVE);
        assertFalse(patients.isEmpty());
        assertTrue(patients.stream().allMatch(p -> p.getStatus() == PatientStatus.ACTIVE));
    }

    @Test
    void shouldPagePatients() {
        // Add more test data
        for (int i = 0; i < 10; i++) {
            Patient p = new Patient();
            p.setMrn("MRN-PAGE-" + i);
            p.setFirstName("Patient" + i);
            p.setLastName("Test");
            em.persistAndFlush(p);
        }

        Page<Patient> page = patientRepository.findAll(PageRequest.of(0, 5));
        assertEquals(5, page.getContent().size());
        assertTrue(page.getTotalElements() >= 11);
    }

    @Test
    void shouldBulkUpdateStatus() {
        int updated = patientRepository.bulkUpdateStatus(
            PatientStatus.INACTIVE, List.of(savedPatient.getId()));
        assertEquals(1, updated);

        em.clear();  // Clear L1 cache to force re-read from DB
        Patient refreshed = em.find(Patient.class, savedPatient.getId());
        assertEquals(PatientStatus.INACTIVE, refreshed.getStatus());
    }
}
```

### 3.4 @SpringBootTest — Full Integration Test

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class PatientRegistrationIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;  // For RANDOM_PORT tests

    @Autowired
    private PatientRepository patientRepository;

    @MockBean
    private EcrSubmissionService ecrSubmissionService;  // Mock external call

    @LocalServerPort
    private int port;

    @Test
    void shouldCompleteFullRegistrationFlow() {
        // GIVEN
        when(ecrSubmissionService.submitCaseReport(any(), any())).thenReturn(true);
        CreatePatientRequest request = buildRequest("COVID-19");
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(generateTestJwt());

        // WHEN
        ResponseEntity<PatientResponse> response = restTemplate.exchange(
            "http://localhost:" + port + "/api/v1/patients",
            HttpMethod.POST,
            new HttpEntity<>(request, headers),
            PatientResponse.class
        );

        // THEN
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        String mrn = response.getBody().getMrn();
        assertTrue(patientRepository.findByMrn(mrn).isPresent());
        verify(ecrSubmissionService).submitCaseReport(any(), eq("COVID-19"));
    }
}
```

---

## PART 4 — TestContainers: Real Dependencies in Tests

### 4.1 Why TestContainers?

> **Problem:** H2 in-memory DB ≠ PostgreSQL behavior (JSON columns, constraints, JSONB functions, window functions all differ).
> **Solution:** Spin up a real Docker container during tests. Container starts → test runs → container stops. Reproducible everywhere.

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>kafka</artifactId>
    <scope>test</scope>
</dependency>
```

### 4.2 PostgreSQL Container

```java
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
class PatientRepositoryContainerTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("ehr_test")
        .withUsername("testuser")
        .withPassword("testpass")
        .withInitScript("schema.sql");  // Run DDL on startup

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // Override Spring's datasource with container's values
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private PatientRepository patientRepository;

    @Test
    void shouldHandleJsonbColumnQuery() {
        // PostgreSQL-specific JSONB query — would fail with H2
        List<Patient> patients = patientRepository
            .findByMetadataContaining("\"insurance\": \"MEDICAID\"");
        assertNotNull(patients);
    }
}
```

### 4.3 Kafka Container

```java
@SpringBootTest
@Testcontainers
class LabResultKafkaIntegrationTest {

    @Container
    static KafkaContainer kafka = new KafkaContainer(
        DockerImageName.parse("confluentinc/cp-kafka:7.4.0"));

    @DynamicPropertySource
    static void kafkaProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Autowired
    private KafkaTemplate<String, LabResultEvent> kafkaTemplate;

    @Autowired
    private LabResultConsumer labResultConsumer;  // The real consumer

    @Test
    void shouldConsumeLabResultAndTriggerEcr() throws Exception {
        // GIVEN
        LabResultEvent event = new LabResultEvent("MRN-001", "COVID-19", true);
        CountDownLatch latch = new CountDownLatch(1);

        // Hook into consumer to know when processed
        doAnswer(inv -> { latch.countDown(); return null; })
            .when(ecrService).submitIfRequired(any());

        // WHEN
        kafkaTemplate.send("lab-results", "MRN-001", event);

        // THEN — wait up to 10 seconds for consumer to process
        assertTrue(latch.await(10, TimeUnit.SECONDS), "Message not consumed in time");
        verify(ecrService).submitIfRequired(argThat(r -> r.isCovid19Positive()));
    }
}
```

### 4.4 Shared Container (Singleton Pattern — Faster Tests)

```java
// AbstractContainerTest.java — base class for all integration tests
public abstract class AbstractContainerTest {

    // static = shared across all subclasses (started once, reused)
    static final PostgreSQLContainer<?> postgres;
    static final KafkaContainer kafka;
    static final GenericContainer<?> redis;

    static {
        postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("ehr_test");
        kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.4.0"));
        redis = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

        // Start all containers in parallel
        Startables.deepStart(postgres, kafka, redis).join();
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }
}

// Usage
class PatientServiceIntegrationTest extends AbstractContainerTest { ... }
class EcrSubmissionIntegrationTest extends AbstractContainerTest { ... }
// Containers started ONCE, shared across both test classes — much faster
```

---

## PART 5 — Docker: Containerizing the EHR Service

### 5.1 Dockerfile — Multi-Stage Build

```dockerfile
# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
# Download deps first (cached layer — only re-downloads if pom.xml changes)
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Runtime image (much smaller — no Maven, no source)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Non-root user for security (HIPAA compliance)
RUN addgroup -S ehrgroup && adduser -S ehruser -G ehrgroup
USER ehruser

# Copy JAR from builder stage
COPY --from=builder /app/target/ehr-service-*.jar app.jar

# JVM tuning for container environment
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+UseG1GC \
               -XX:MaxGCPauseMillis=200 \
               -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### 5.2 docker-compose.yml — Full Local Dev Stack

```yaml
version: '3.8'

services:
  # PostgreSQL — EHR database
  postgres:
    image: postgres:15-alpine
    container_name: ehr-postgres
    environment:
      POSTGRES_DB: ehr_db
      POSTGRES_USER: ehr_user
      POSTGRES_PASSWORD: ehr_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
      - ./sql/seed_data.sql:/docker-entrypoint-initdb.d/02_seed.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ehr_user -d ehr_db"]
      interval: 10s
      retries: 5

  # Redis — caching and session store
  redis:
    image: redis:7-alpine
    container_name: ehr-redis
    command: redis-server --requirepass redis_secret --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "redis_secret", "ping"]
      interval: 10s

  # Zookeeper — required by Kafka
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    container_name: ehr-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  # Kafka — event streaming
  kafka:
    image: confluentinc/cp-kafka:7.4.0
    container_name: ehr-kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092,PLAINTEXT_INTERNAL://kafka:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_INTERNAL:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    healthcheck:
      test: kafka-topics.sh --bootstrap-server localhost:9092 --list
      interval: 30s
      start_period: 30s

  # EHR Service — our application
  ehr-service:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ehr-service
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      kafka:
        condition: service_healthy
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: docker
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/ehr_db
      SPRING_DATASOURCE_USERNAME: ehr_user
      SPRING_DATASOURCE_PASSWORD: ehr_pass
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PASSWORD: redis_secret
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:29092
      ECR_NOW_BASE_URL: http://ecr-now-service:8081
      JWT_SECRET: ${JWT_SECRET}  # From .env file
    healthcheck:
      test: wget -qO- http://localhost:8080/actuator/health || exit 1
      interval: 30s
      start_period: 60s

  # ECR-NOW Service — case reporting
  ecr-now-service:
    image: ecr-now:latest
    container_name: ecr-now-service
    ports:
      - "8081:8081"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/ecr_db

volumes:
  postgres_data:

networks:
  default:
    name: ehr-network
```

### 5.3 Key Docker Commands

```bash
# Build image
docker build -t ehr-service:1.0.0 .
docker build -t ehr-service:1.0.0 --build-arg ENV=prod .

# Run container
docker run -d \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e JWT_SECRET=mysecret \
  --name ehr-service \
  ehr-service:1.0.0

# Docker Compose
docker-compose up -d            # Start all services
docker-compose up -d ehr-service  # Start specific service
docker-compose logs -f ehr-service  # Follow logs
docker-compose down             # Stop and remove containers
docker-compose down -v          # Also remove volumes

# Inspect running container
docker exec -it ehr-service sh                  # Shell inside container
docker exec -it ehr-service jmap -heap 1        # JVM heap stats
docker stats ehr-service                         # CPU, memory usage
docker logs ehr-service --tail 100 -f            # Recent logs

# Image management
docker images                    # List images
docker rmi ehr-service:1.0.0    # Remove image
docker system prune -a           # Clean everything unused
```

---

## PART 6 — Kubernetes: Orchestrating the EHR Platform

### 6.1 Core Concepts

```
Pod           → Smallest unit; 1+ containers sharing network/storage
ReplicaSet    → Ensures N pods always running
Deployment    → Manages ReplicaSets; rolling updates, rollbacks
Service       → Stable DNS + load balancing to pods (ClusterIP/NodePort/LoadBalancer)
ConfigMap     → Non-secret configuration (env vars, config files)
Secret        → Sensitive data (base64-encoded, mounted as env or volume)
Ingress       → HTTP/HTTPS routing rules (domain-based, path-based)
HPA           → Horizontal Pod Autoscaler (scale based on CPU/custom metrics)
```

### 6.2 deployment.yaml — EHR Service

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ehr-service
  namespace: ehr-prod
  labels:
    app: ehr-service
    version: "1.0.0"
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ehr-service
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1         # 1 extra pod during update (4 total temporarily)
      maxUnavailable: 0   # Zero downtime — never remove pod before new one ready
  template:
    metadata:
      labels:
        app: ehr-service
        version: "1.0.0"
    spec:
      serviceAccountName: ehr-service-sa
      containers:
        - name: ehr-service
          image: ehr-registry.company.com/ehr-service:1.0.0
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8080
          
          # Environment from ConfigMap and Secrets
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "prod"
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: ehr-secrets
                  key: db-password
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: ehr-secrets
                  key: jwt-secret
          
          # Load all ConfigMap values as env vars
          envFrom:
            - configMapRef:
                name: ehr-config
          
          # Resource limits — CRITICAL for scheduling and stability
          resources:
            requests:
              memory: "512Mi"   # Guaranteed allocation
              cpu: "250m"       # 0.25 CPU core
            limits:
              memory: "1Gi"     # Hard limit — OOMKilled if exceeded
              cpu: "1000m"      # 1 CPU core max
          
          # Liveness probe — restart if app is stuck/deadlocked
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 60   # Wait for JVM startup
            periodSeconds: 30
            failureThreshold: 3       # Restart after 3 failures
          
          # Readiness probe — only send traffic when truly ready
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3       # Remove from service after 3 failures
          
          # Startup probe — for slow-starting JVM apps
          startupProbe:
            httpGet:
              path: /actuator/health
              port: 8080
            failureThreshold: 30      # 30 * 10s = 5 min to start
            periodSeconds: 10
          
          volumeMounts:
            - name: app-config
              mountPath: /app/config
              readOnly: true
      
      volumes:
        - name: app-config
          configMap:
            name: ehr-app-config
      
      # Spread pods across availability zones
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: ehr-service
                topologyKey: topology.kubernetes.io/zone
```

### 6.3 service.yaml, configmap.yaml, hpa.yaml

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ehr-service
  namespace: ehr-prod
spec:
  selector:
    app: ehr-service          # Routes to pods with this label
  type: ClusterIP             # Internal only (use LoadBalancer for external)
  ports:
    - port: 80
      targetPort: 8080

---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ehr-config
  namespace: ehr-prod
data:
  SPRING_DATASOURCE_URL: "jdbc:postgresql://postgres-service:5432/ehr_db"
  SPRING_DATA_REDIS_HOST: "redis-service"
  SPRING_KAFKA_BOOTSTRAP_SERVERS: "kafka-service:9092"
  ECR_NOW_BASE_URL: "http://ecr-now-service:8081"
  LOG_LEVEL_ROOT: "INFO"
  LOG_LEVEL_EHR: "DEBUG"

---
# hpa.yaml — Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ehr-service-hpa
  namespace: ehr-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ehr-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70    # Scale up when avg CPU > 70%
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### 6.4 Key kubectl Commands

```bash
# Deployments
kubectl apply -f deployment.yaml                    # Deploy / update
kubectl rollout status deployment/ehr-service       # Watch rollout
kubectl rollout undo deployment/ehr-service         # Rollback
kubectl set image deployment/ehr-service ehr-service=ehr-service:1.1.0  # Update image

# Pods
kubectl get pods -n ehr-prod                        # List pods
kubectl get pods -n ehr-prod -l app=ehr-service     # Filter by label
kubectl describe pod ehr-service-abc123 -n ehr-prod # Detailed pod info
kubectl logs ehr-service-abc123 -n ehr-prod -f      # Follow logs
kubectl exec -it ehr-service-abc123 -n ehr-prod -- sh  # Shell into pod

# Debugging
kubectl get events -n ehr-prod --sort-by='.lastTimestamp'  # Recent events
kubectl top pods -n ehr-prod                        # CPU/memory usage
kubectl port-forward pod/ehr-service-abc123 8080:8080 -n ehr-prod  # Local access
```

---

## PART 7 — CI/CD Pipeline

### 7.1 Jenkins Pipeline — EHR Service

```groovy
// Jenkinsfile
pipeline {
    agent {
        kubernetes {
            yaml '''
                apiVersion: v1
                kind: Pod
                spec:
                  containers:
                    - name: maven
                      image: maven:3.9-eclipse-temurin-21
                    - name: docker
                      image: docker:24-dind
                      securityContext:
                        privileged: true
                    - name: kubectl
                      image: bitnami/kubectl:latest
            '''
        }
    }

    environment {
        REGISTRY = 'ehr-registry.company.com'
        IMAGE_NAME = 'ehr-service'
        IMAGE_TAG = "${env.GIT_COMMIT[0..7]}"     // Short commit hash
        SONAR_TOKEN = credentials('sonarqube-token')
        KUBE_CREDS = credentials('kubernetes-prod')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test') {
            steps {
                container('maven') {
                    sh 'mvn clean verify -B'  // Runs unit + integration tests
                    // Publishes JUnit XML reports
                    junit 'target/surefire-reports/*.xml'
                    // Code coverage
                    jacoco execPattern: 'target/jacoco.exec',
                           classPattern: 'target/classes',
                           sourcePattern: 'src/main/java'
                }
            }
            post {
                always {
                    publishHTML target: [
                        allowMissing: false,
                        reportDir: 'target/site/jacoco',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ]
                }
            }
        }

        stage('Code Quality') {
            steps {
                container('maven') {
                    sh """
                        mvn sonar:sonar \
                            -Dsonar.projectKey=ehr-service \
                            -Dsonar.host.url=http://sonarqube:9000 \
                            -Dsonar.login=${SONAR_TOKEN}
                    """
                }
            }
        }

        stage('Security Scan') {
            steps {
                container('maven') {
                    // OWASP dependency check for known CVEs
                    sh 'mvn org.owasp:dependency-check-maven:check'
                }
            }
        }

        stage('Package') {
            steps {
                container('maven') {
                    sh 'mvn package -DskipTests -B'
                    archiveArtifacts artifacts: 'target/*.jar'
                }
            }
        }

        stage('Docker Build & Push') {
            when {
                anyOf {
                    branch 'main'
                    branch 'release/*'
                }
            }
            steps {
                container('docker') {
                    sh """
                        docker build -t ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} .
                        docker tag ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} \
                                   ${REGISTRY}/${IMAGE_NAME}:latest
                        docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${REGISTRY}/${IMAGE_NAME}:latest
                    """
                }
            }
        }

        stage('Deploy to Staging') {
            when { branch 'main' }
            steps {
                container('kubectl') {
                    sh """
                        kubectl set image deployment/ehr-service \
                            ehr-service=${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} \
                            -n ehr-staging
                        kubectl rollout status deployment/ehr-service -n ehr-staging --timeout=5m
                    """
                }
            }
        }

        stage('Smoke Tests') {
            when { branch 'main' }
            steps {
                sh 'curl -f http://ehr-staging.internal/actuator/health || exit 1'
                // Run critical path tests against staging
                sh 'mvn test -Psmoke-tests -Dapp.url=http://ehr-staging.internal'
            }
        }

        stage('Deploy to Production') {
            when { branch 'main' }
            input {
                message "Deploy to Production?"   // Manual approval gate
                ok "Deploy"
                submitter "devops-team"
            }
            steps {
                container('kubectl') {
                    sh """
                        kubectl set image deployment/ehr-service \
                            ehr-service=${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} \
                            -n ehr-prod
                        kubectl rollout status deployment/ehr-service -n ehr-prod --timeout=10m
                    """
                }
            }
        }
    }

    post {
        success {
            slackSend channel: '#ehr-deployments',
                      color: 'good',
                      message: "✅ EHR Service ${IMAGE_TAG} deployed to prod"
        }
        failure {
            slackSend channel: '#ehr-alerts',
                      color: 'danger',
                      message: "❌ Pipeline failed for EHR Service ${IMAGE_TAG}"
            // Auto-rollback on prod deployment failure
            script {
                if (env.BRANCH_NAME == 'main') {
                    sh 'kubectl rollout undo deployment/ehr-service -n ehr-prod'
                }
            }
        }
    }
}
```

---

## PART 8 — Monitoring: Prometheus & Grafana

### 8.1 Custom Metrics in Spring Boot (Actuator + Micrometer)

```java
@Component
public class EhrMetricsService {

    private final Counter patientRegistrations;
    private final Counter ecrSubmissions;
    private final Counter ecrFailures;
    private final Timer ecrSubmissionTimer;
    private final AtomicInteger activePatientSessions;

    public EhrMetricsService(MeterRegistry registry) {
        // Counter: monotonically increasing
        this.patientRegistrations = Counter.builder("ehr.patient.registrations")
            .description("Total patients registered")
            .tag("system", "ehr")
            .register(registry);

        this.ecrSubmissions = Counter.builder("ehr.ecr.submissions")
            .description("Total ECR reports submitted")
            .register(registry);

        this.ecrFailures = Counter.builder("ehr.ecr.failures")
            .description("Total ECR submission failures")
            .register(registry);

        // Timer: measures duration + count + percentiles
        this.ecrSubmissionTimer = Timer.builder("ehr.ecr.submission.duration")
            .description("Time to submit ECR report")
            .publishPercentiles(0.5, 0.95, 0.99)  // p50, p95, p99
            .publishPercentileHistogram()
            .register(registry);

        // Gauge: current value (active sessions, queue depth)
        this.activePatientSessions = new AtomicInteger(0);
        Gauge.builder("ehr.patient.sessions.active", activePatientSessions, AtomicInteger::get)
            .description("Active patient sessions")
            .register(registry);

        // Gauge for queue depth
        Gauge.builder("ehr.ecr.queue.depth", ecrQueue, ConcurrentLinkedQueue::size)
            .register(registry);
    }

    public void recordPatientRegistration() {
        patientRegistrations.increment();
    }

    public void recordEcrSubmission(boolean success, Duration duration) {
        if (success) ecrSubmissions.increment();
        else ecrFailures.increment();
        ecrSubmissionTimer.record(duration);
    }

    // Use Timer.Sample for code block timing
    public boolean submitEcrReport(EcrSubmission submission) {
        Timer.Sample sample = Timer.start();
        try {
            boolean result = ecrNowClient.submit(submission);
            sample.stop(ecrSubmissionTimer);
            return result;
        } catch (Exception e) {
            ecrFailures.increment();
            throw e;
        }
    }
}
```

### 8.2 Prometheus Scraping — application.yml

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics,env,loggers
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true   # /actuator/health/liveness and /readiness
  metrics:
    tags:
      application: ehr-service
      environment: prod
    distribution:
      percentiles-histogram:
        http.server.requests: true   # Histogram for HTTP request durations
      percentiles:
        http.server.requests: 0.5, 0.95, 0.99
```

### 8.3 Key Prometheus Queries (PromQL)

```promql
# HTTP request rate (req/sec over last 5 min)
rate(http_server_requests_seconds_count{application="ehr-service"}[5m])

# Error rate percentage
100 * sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
  / sum(rate(http_server_requests_seconds_count[5m]))

# p99 latency for ECR submissions
histogram_quantile(0.99, 
  rate(ehr_ecr_submission_duration_seconds_bucket[5m]))

# JVM heap usage percentage
jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} * 100

# Active threads
jvm_threads_live_threads{application="ehr-service"}

# HikariCP pool utilization
hikaricp_connections_active / hikaricp_connections_max * 100

# ECR failure rate
rate(ehr_ecr_failures_total[5m])

# Alert: circuit breaker open
resilience4j_circuitbreaker_state{state="open"} == 1
```

### 8.4 ELK Stack — Log Analysis

```java
// Structured logging with EHR context
@Slf4j
public class PatientService {

    public PatientResponse registerPatient(CreatePatientRequest req) {
        MDC.put("operation", "PATIENT_REGISTER");
        MDC.put("requestId", UUID.randomUUID().toString());
        try {
            log.info("Registering patient: lastName={}, hasReportableCondition={}",
                req.getLastName(), ecrService.isReportable(req.getPrimaryCondition()));

            Patient saved = patientRepository.save(mapToEntity(req));
            MDC.put("patientMrn", saved.getMrn());

            log.info("Patient registered successfully: mrn={}", saved.getMrn());
            return mapToResponse(saved);

        } catch (DataIntegrityViolationException e) {
            log.error("Duplicate MRN detected: lastName={}, error={}",
                req.getLastName(), e.getMessage());
            throw new DuplicateMrnException("MRN conflict");
        } finally {
            MDC.clear();   // Always clear MDC — ThreadLocal leak prevention
        }
    }
}
```

```
# Kibana query examples:
# Find all ECR failures in last 1 hour
level: ERROR AND operation: ECR_SUBMIT AND @timestamp: [now-1h TO now]

# Trace a specific patient registration
patientMrn: "MRN-001" AND @timestamp: [now-24h TO now]

# Find slow requests (> 2 seconds)
level: WARN AND message: "Slow request" AND duration: >2000

# Count errors by type
level: ERROR | stats count by errorType
```

---

## PART 9 — Advanced JVM: Production Troubleshooting

### 9.1 Heap Dump Analysis — OutOfMemoryError

```bash
# Enable automatic heap dump on OOM (add to JVM flags)
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/ehr/heapdump.hprof

# Or trigger manually (without killing the process)
jmap -dump:format=b,file=/tmp/heap_$(date +%s).hprof <pid>

# Inside Kubernetes pod
kubectl exec -it ehr-service-abc123 -n ehr-prod -- \
  jmap -dump:format=b,file=/tmp/heap.hprof 1
kubectl cp ehr-service-abc123:/tmp/heap.hprof ./local_heap.hprof -n ehr-prod
```

```
# Eclipse MAT (Memory Analyzer Tool) — what to look for:
1. Leak Suspects Report → Objects retained by mistake
2. Dominator Tree → What holds most memory
3. Histogram → Count of objects by type

# Common EHR memory leaks:
- MDC not cleared → HashMap entries pile up in ThreadLocal → leaked per-request data
- PatientCache not bounded → HashMap grows without eviction
- Hibernate L1 cache → Large bulk load without em.clear() → Persistence Context holds all entities
- Event listeners registered but never deregistered
- Static collections holding entity references

# Eclipse MAT query example:
SELECT * FROM java.util.HashMap$Entry
WHERE key.toString().startsWith("patient:")
# Shows all cached patient entries
```

### 9.2 Thread Dump Analysis — Deadlock / Thread Starvation

```bash
# Take thread dump (non-destructive)
kill -3 <pid>                                    # Output to stdout
jstack <pid> > /tmp/thread_dump_$(date +%s).txt  # Save to file
jcmd <pid> Thread.print > /tmp/thread_dump.txt   # Modern approach

# Inside K8s
kubectl exec -it ehr-service-abc123 -- jstack 1 > thread_dump.txt
```

```
# What to look for in thread dump:

# 1. DEADLOCK — JVM reports this directly
"DEADLOCK DETECTED"
Thread-1 holds lock A, waiting for lock B
Thread-2 holds lock B, waiting for lock A
→ Fix: canonical ordering (always acquire locks in same order)

# 2. BLOCKED threads — waiting for a lock
"http-nio-8080-exec-3" #45 prio=5 os_prio=0 tid=...
   java.lang.Thread.State: BLOCKED (on object monitor)
   at com.ehr.PatientService.updateRecord(PatientService.java:145)
   - waiting to lock <0x00000006c3e2b678> (a com.ehr.PatientRecord)
   - locked by "http-nio-8080-exec-1"
→ Too many threads blocked on same lock → bottleneck

# 3. WAITING threads — waiting for work (normal for pool threads)
"pool-1-thread-5" State: WAITING
   at sun.misc.Unsafe.park(Native Method)
   at java.util.concurrent.locks.LockSupport.park(...)
→ Normal for idle ExecutorService threads

# 4. All threads in RUNNABLE but CPU high → CPU starvation
→ Check for infinite loops, tight retry loops without backoff

# 5. DB threads all BLOCKED → HikariCP pool exhausted
"http-nio-8080-exec-*" State: BLOCKED at com.zaxxer.hikari.pool.HikariPool.getConnection
→ Increase pool size or find connection leak (@Transactional never released)
```

### 9.3 GC Tuning

```bash
# GC logging (add to JVM flags in production)
-Xlog:gc*:file=/var/log/ehr/gc_%t.log:time,level,tags:filecount=5,filesize=50m

# Memory sizing for EHR service (2 CPU, 4GB container)
-Xms1g                           # Initial heap = 1GB (avoid early resizing)
-Xmx2g                           # Max heap = 2GB (leave room for off-heap)
-XX:MetaspaceSize=256m           # Initial metaspace (Spring beans, classes)
-XX:MaxMetaspaceSize=512m        # Cap metaspace

# G1GC tuning (default in Java 9+, best for most services)
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200         # Target max pause (G1 tries to meet this)
-XX:G1HeapRegionSize=8m          # Region size (auto-tuned, but 8m good for 2GB heap)
-XX:G1NewSizePercent=20          # Min young gen %
-XX:G1MaxNewSizePercent=40       # Max young gen %
-XX:ConcGCThreads=2              # Concurrent GC threads (= num_cores / 4)
-XX:ParallelGCThreads=4          # STW GC threads (= num_cores)
-XX:G1ReservePercent=10          # Reserve to avoid evacuation failure

# ZGC (Java 15+ — ultra-low pause, good for large heaps)
-XX:+UseZGC
-XX:SoftMaxHeapSize=1500m        # Soft limit — GC more aggressively before this

# Container support (critical for K8s — JVM must respect container limits)
-XX:+UseContainerSupport         # JVM reads cgroup limits (not host CPU/memory)
-XX:MaxRAMPercentage=75.0        # Use 75% of container memory for heap

# Diagnostic flags
-XX:+PrintGCDetails              # Legacy (Java 8)
-XX:+PrintGCDateStamps
-verbose:gc
```

```
# Reading GC logs — what matters:
[GC (Allocation Failure) ... Pause Young (Normal) ... 250ms]  ← Young GC pause
[GC (G1 Humongous Allocation)]  ← Object > 50% region size → goes to Old Gen directly → leak risk
[GC (G1 Evacuation Pause)] ... 400ms  ← Evacuation failure → increase heap or reduce object size
Full GC  ← Very bad, long pause → root cause: metaspace exhausted, concurrent GC can't keep up

# EHR patterns causing GC pressure:
- Deserializing large FHIR bundles (many short-lived objects → Eden pressure)
- Not using streaming for large patient lists (1000 patients in memory at once)
- Attaching large byte[] to logs (FHIR XML stored in log message → kept alive)
- Paginating with large page size (pageSize=1000 for exports)
```

### 9.4 Java Memory Model (JMM) — Happens-Before

```java
// The Java Memory Model guarantees visibility only when happens-before exists

// 1. volatile write happens-before volatile read
volatile boolean ecrSubmitted = false;
// Thread A: ecrSubmitted = true;           (write)
// Thread B: if (ecrSubmitted) { ... }      (read sees the write)

// 2. Monitor unlock happens-before lock
synchronized(lock) { data = newValue; }    // Thread A unlocks
synchronized(lock) { use(data); }          // Thread B locks → sees data

// 3. Thread.start() happens-before thread's actions
data = "ready";
new Thread(() -> System.out.println(data)).start();  // Thread sees "ready"

// 4. Thread's actions happen-before Thread.join()
thread.join();  // After this, current thread sees all thread's writes

// WITHOUT happens-before:
// CPU caches can hold stale values
// Compiler can reorder instructions
// → Race condition even if "it works on my machine"

// Double-Checked Locking (DCL) — needs volatile
public class EhrConnectionPool {
    private static volatile EhrConnectionPool instance;  // volatile REQUIRED

    public static EhrConnectionPool getInstance() {
        if (instance == null) {                  // First check (no lock)
            synchronized (EhrConnectionPool.class) {
                if (instance == null) {          // Second check (with lock)
                    instance = new EhrConnectionPool();  // volatile ensures
                }                                         // other threads see fully
            }                                             // constructed object
        }
        return instance;
    }
}
```

### 9.5 CAS (Compare-And-Swap) — Lock-Free Operations

```java
// CAS: hardware-level atomic operation
// "If current value == expected, swap to new value. Otherwise, do nothing."

AtomicInteger patientCount = new AtomicInteger(0);

// Under the hood: CAS loop
public final int incrementAndGet() {
    int current, next;
    do {
        current = get();              // Read current
        next = current + 1;          // Compute new
    } while (!compareAndSet(current, next));  // Try swap — retry if contended
    return next;
}

// EHR example: CAS for optimistic counter update
AtomicLong ecrSubmissionsToday = new AtomicLong(0);

// Thread-safe without lock:
ecrSubmissionsToday.incrementAndGet();          // CAS-based, no blocking
ecrSubmissionsToday.accumulateAndGet(5, Long::sum);  // Add 5 atomically

// Custom CAS for complex state
AtomicReference<CircuitBreakerState> state = 
    new AtomicReference<>(CircuitBreakerState.CLOSED);

// Transition CLOSED → OPEN only if currently CLOSED (no concurrent race)
boolean transitioned = state.compareAndSet(
    CircuitBreakerState.CLOSED,   // expected
    CircuitBreakerState.OPEN      // new value
);
```

### 9.6 Escape Analysis & Stack Allocation

```java
// Escape Analysis: JVM detects if object "escapes" current scope
// If NOT escaped → allocate on STACK (faster, auto-freed, GC-free)

public void processLabResult(String mrn) {
    // This LabResult doesn't escape (not returned, not stored in field)
    // JVM MAY allocate it on stack (scalar replacement) → zero GC overhead
    LabResult temp = new LabResult(mrn, LocalDate.now(), "NEGATIVE");
    boolean reportable = ecrService.isReportable(temp);
    log.info("Reportable: {}", reportable);
    // temp dies here → auto-freed from stack
}

// DOES escape — JVM must heap-allocate:
private List<Patient> cache = new ArrayList<>();
public void cache(Patient p) {
    cache.add(p);  // p escapes to field → heap allocation required
}
```

### 9.7 False Sharing — Cache Line Contention

```java
// CPU cache line = 64 bytes
// If two variables share a cache line, writing to one invalidates the other
// → Thread 1 and Thread 2 both constantly evicting each other's cache line

// BAD: submissions and failures are adjacent in memory → same cache line
class EcrMetrics {
    long submissions = 0;   // Thread 1 writes
    long failures = 0;      // Thread 2 writes → evicts Thread 1's cache line
}

// FIX: Pad to different cache lines
@Contended  // Java 8+ annotation (needs -XX:-RestrictContended)
class EcrMetrics {
    @Contended long submissions;   // Own 64-byte cache line
    @Contended long failures;      // Own 64-byte cache line
}

// Or manual padding:
class EcrMetricsPadded {
    long submissions;
    long p1, p2, p3, p4, p5, p6, p7;  // 7 * 8 = 56 bytes padding
    long failures;
}
```

---

## PART 10 — Production Support: RCA & On-Call

### 10.1 RCA Process (Root Cause Analysis)

```
INCIDENT: ECR-NOW submission failures spike to 40% at 14:32 UTC

TIMELINE:
14:30 → Deployment of ehr-service v1.2.3 to prod (Jenkins pipeline)
14:32 → Alert: ECR failure rate > 20% (PagerDuty)
14:33 → On-call engineer paged
14:35 → Checked Grafana: ecrSubmissionTimer p99 jumped from 200ms to 12s
14:36 → Checked circuit breaker: state = OPEN
14:37 → Checked logs: "Connection refused: ecr-now-service:8081"
14:38 → kubectl get pods -n ecr-prod → ecr-now-service pods all Terminating
14:39 → kubectl get events → OOMKilled: 3 ecr-now pods in last 10min
14:40 → Root cause: v1.2.3 introduced unbounded FHIR bundle caching in ECR service
          → ECR pods hit 1GB limit → OOMKilled → EHR circuit breaker opened

REMEDIATION:
14:41 → kubectl rollout undo deployment/ecr-now-service -n ecr-prod
14:43 → ECR pods stable, memory normal
14:44 → EHR circuit breaker transitioning HALF-OPEN → CLOSED
14:47 → ECR failure rate back to < 0.1%
Total duration: 15 minutes

ROOT CAUSE:
FHIR bundle caching in PatientFhirService.buildBundle() used static Map<String,FhirBundle>
with no eviction. Bundles average 200KB. After 5000 patients processed → 1GB consumed.

CORRECTIVE ACTIONS:
1. Immediate: Add Caffeine cache with maximumSize=100, expireAfterWrite=5min
2. Short-term: Add memory alerts at 70% container usage (before OOMKill)
3. Long-term: Use bounded cache / streaming approach for large FHIR bundles
4. Process: Add memory profiling step to CI pipeline
```

### 10.2 Severity Levels

```
SEV-1 (Critical): Patient data inaccessible, ECR reports not being submitted to CDC
        → Page entire on-call team + manager + VP Engineering
        → 15-minute update cadence
        → All hands on deck, no scope limit to fix

SEV-2 (High): Significant feature broken, elevated error rates (>5%), patient flow impacted
        → Page primary on-call + secondary
        → 30-minute update cadence
        → Fix within 1 hour

SEV-3 (Medium): Non-critical feature broken, degraded performance, increased latency
        → Alert on-call via Slack
        → Update within 2 hours
        → Fix within business day

SEV-4 (Low): Minor issue, cosmetic, single user affected
        → Create Jira ticket
        → Fix in next sprint
```

### 10.3 On-Call Runbook — EHR Service

```markdown
## Runbook: EHR Service High Error Rate

### Detection
- Alert fires when HTTP 5xx rate > 1% for 5 minutes
- PagerDuty page to on-call engineer

### Initial Assessment (First 5 minutes)
1. Check Grafana EHR Overview dashboard
   - Is this all endpoints or specific ones?
   - What's the error pattern in logs?
2. Check dependent services:
   kubectl get pods -n ehr-prod
   kubectl get pods -n ecr-prod
   kubectl get pods -n postgres-prod

### Common Scenarios

#### Scenario A: DB connection exhaustion
Symptom: Logs show "Unable to acquire JDBC Connection"
Fix: kubectl exec -it ehr-pod -- jstack 1 | grep hikari
     Increase pool size or find connection leak

#### Scenario B: Kafka consumer lag
Symptom: lab-results topic lag > 10000
Check: kubectl exec -it kafka-pod -- kafka-consumer-groups.sh \
         --bootstrap-server localhost:9092 --describe --group ehr-lab-consumers
Fix: Scale up EHR replicas (kubectl scale deployment/ehr-service --replicas=6)

#### Scenario C: Redis unavailable
Symptom: "RedisCommandTimeoutException" in logs
Fix: @Cacheable falls back to DB (no data loss)
     kubectl rollout restart deployment/redis -n ehr-prod

#### Scenario D: ECR-NOW unreachable
Symptom: Circuit breaker OPEN for ecr-now
Fix: ECR submissions queued to DB (saga compensation in place)
     Verify ECR-NOW status: curl http://ecr-now-service:8081/actuator/health

### Escalation
If not resolved in 30 minutes:
- SEV-2 → SEV-1: Page backend team lead
- Start incident bridge call
- Notify HIPAA compliance officer if patient data affected
```

### 10.4 Memory Story: What Happens During a Test Run

```
1. JVM starts for test suite
   → Heap: Empty (no beans yet)
   → Metaspace: JDK core classes loaded

2. @SpringBootTest triggers ApplicationContext loading
   → Heap (Old Gen): All singleton beans allocated
     - PatientService, PatientRepository, JwtService...
   → Metaspace: Spring AOP proxies (CGLIB-generated classes)
   → HikariCP: Connection pool to TestContainers PostgreSQL

3. Each @Test method runs
   → Stack frame created per thread
   → Mock invocations tracked in Mockito's internal HashMap (heap)
   → PatientService.registerPatient() runs:
     - Patient object: Eden space (short-lived)
     - Hibernate L1 cache: PersistenceContext Map (thread-scoped)
     - FHIR bundle: Eden (built, used, discarded)

4. MockMvc.perform() executes
   → DispatcherServlet processes request on separate thread
   → New Stack frame, new ThreadLocals (SecurityContext, MDC, RequestContextHolder)

5. assertThat / verify runs
   → ArgumentCaptor reads from Mockito's invocation list

6. @AfterEach
   → Mockito resets mocks (clears invocation records)
   → Spring @Transactional rolls back test DB changes

7. After all tests
   → ApplicationContext destroyed (@PreDestroy → HikariCP closes connections)
   → Full GC as JVM exits
```

---

## QUICK REFERENCE — Senior Interview Answers

### Testing Strategy Question
> *"How do you approach testing in a Spring Boot microservice?"*

"I think of testing in layers. Unit tests with JUnit 5 and Mockito cover business logic in isolation — the PatientService, validation rules, domain calculations. Then I use Spring's test slices: @WebMvcTest for the controller layer to test request validation, auth, and error responses without starting a full context, and @DataJpaTest for repositories to test complex JPQL and pagination against a real Postgres schema. For integration tests I use TestContainers — real PostgreSQL, Kafka, Redis containers — so we catch container-specific behavior. Finally, @SpringBootTest smoke tests verify the critical happy path end-to-end. The goal is fast feedback: unit tests in milliseconds, slices in seconds, full integration only on CI."

### "Tell me about a production issue you debugged"
> Use the RCA format above. Structure: What happened → How I detected → What I checked → Root cause → Fix → Prevention.

### Memory Leak Question
> "If your JVM heap keeps growing and eventually OOM, what do you do?"

"First, enable -XX:+HeapDumpOnOutOfMemoryError so the next OOM captures a heap dump. Then I take a manual dump with jmap -dump before we hit OOM. I open it in Eclipse MAT and look at the Leak Suspects report — it'll show what's accumulating. Common culprits in EHR services are unbounded caches (HashMap without eviction), MDC not cleared in ThreadLocals, Hibernate L1 cache holding thousands of entities from bulk operations, or static collections holding entity references. Once identified, fix is typically bounded cache (Caffeine), em.clear() in batches, or a @Scheduled eviction job."

### GC Pauses Question
> "Production is having GC pauses. How do you tune?"

"I start with GC logging (-Xlog:gc*) and look for: pause duration, GC type (Young/Mixed/Full), allocation failure frequency. For G1GC I usually adjust -XX:MaxGCPauseMillis (default 200ms — tune lower if needed), check for humongous allocations (objects > 50% region size go straight to Old Gen), and ensure heap is sized to keep occupancy below 70% so concurrent marking runs on time. If Full GC, it's usually Metaspace exhaustion or concurrent GC can't keep up — increase -XX:MaxMetaspaceSize or heap size. ZGC is worth switching to for latency-sensitive services — sub-10ms pauses."

---

## CROSS-TOPIC CONNECTIONS (M07 → Others)

| M07 Topic | Connects To |
|-----------|-------------|
| @WebMvcTest + MockMvc | M04: Spring MVC lifecycle, DispatcherServlet, Filter chain |
| @DataJpaTest + TestEntityManager | M05: JPA entity lifecycle, L1 cache, transactions |
| TestContainers Kafka | M06: Kafka consumer, DLT, manual ack |
| Docker Dockerfile | M04: Spring profiles (docker profile in application.yml) |
| K8s liveness/readiness probes | M04: Spring Actuator, custom HealthIndicator |
| K8s HPA (CPU-based scaling) | M03: ThreadPoolExecutor, CallerRunsPolicy backpressure |
| JVM heap dump → MAT | M01: JVM memory areas, Heap/Metaspace |
| GC tuning (Eden/Old Gen) | M02: HashMap/ArrayList object allocation patterns |
| JMM happens-before, volatile | M03: Concurrency, volatile flags, ThreadLocal |
| CAS / AtomicInteger | M03: Lock-free data structures, compareAndSet |
| False sharing / @Contended | M03: CPU cache, concurrent counters |
| Escape analysis | M01: JVM optimizations, stack vs heap allocation |
| Circuit breaker monitoring | M06: Resilience4j state machine, metrics |
| ThreadLocal MDC / clear | M03: ThreadLocal, ThreadPool thread reuse (leak risk) |
| RCA process | M06: Saga compensation, dead letter topics |
