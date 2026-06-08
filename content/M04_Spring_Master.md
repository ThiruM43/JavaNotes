# M04 — SPRING FRAMEWORK MASTER
### Everything: IoC/DI/AOP + Spring Boot + MVC/REST + Security + Memory + EHR/ECR Examples

---

## DOMAIN CONTEXT
```
EHR Spring Architecture:
  @Controller  PatientController, AppointmentController, LabResultController
  @Service     PatientService, AppointmentService, EcrNowService
  @Repository  PatientRepository, AppointmentRepository
  @Component   EhrRequestFilter, AuditAspect, JwtValidationFilter

ECR-NOW as a separate Spring Boot microservice:
  Receives lab results from EHR (via Kafka events)
  Checks reportable conditions
  Submits to public health via FHIR API
  Returns status back to EHR
```

---

## 1. SPRING IoC & DEPENDENCY INJECTION

### The IoC Container: How Spring Wires EHR

```java
// Without Spring: tightly coupled, hard to test
class OldPatientService {
    private PatientRepository repo = new JpaPatientRepository(); // hardcoded!
    private EmailService email = new SmtpEmailService();          // can't swap for tests
}

// With Spring IoC: loosely coupled, testable
@Service
public class PatientService {
    private final PatientRepository repo;       // interface, not concrete class
    private final EmailService emailService;
    private final AuditService auditService;

    // Constructor injection — RECOMMENDED
    // 1. Explicit: you see all dependencies upfront
    // 2. Immutable: final fields, thread-safe
    // 3. Testable: easy to pass mocks in unit tests
    // 4. No @Autowired needed for single constructor (Spring 4.3+)
    public PatientService(PatientRepository repo,
                           EmailService emailService,
                           AuditService auditService) {
        this.repo = repo;
        this.emailService = emailService;
        this.auditService = auditService;
    }
}

// Configuration: how Spring knows what to create
@Configuration
public class EhrConfig {
    // Manual bean when you can't annotate the class (third-party)
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplateBuilder()
            .setConnectTimeout(Duration.ofSeconds(5))
            .setReadTimeout(Duration.ofSeconds(30))
            .build();
    }

    // Conditional bean — only in prod
    @Bean
    @Profile("prod")
    public EmailService smtpEmailService() { return new SmtpEmailService(); }

    @Bean
    @Profile("dev")
    public EmailService mockEmailService() { return new MockEmailService(); }
}
```

### Multiple Beans of Same Type — @Qualifier
```java
// Two payment processors — Spring needs to know which to inject
@Component("stripeProcessor")
public class StripePaymentProcessor implements PaymentProcessor { ... }

@Component("paypalProcessor")
public class PaypalPaymentProcessor implements PaymentProcessor { ... }

// Inject specific one
@Service
public class BillingService {
    private final PaymentProcessor stripeProcessor;
    private final PaymentProcessor paypalProcessor;

    public BillingService(
        @Qualifier("stripeProcessor") PaymentProcessor stripe,
        @Qualifier("paypalProcessor") PaymentProcessor paypal
    ) {
        this.stripeProcessor = stripe;
        this.paypalProcessor = paypal;
    }

    // Or with @Primary — default when no qualifier specified
    // Add @Primary to StripePaymentProcessor
}

// Modern: Map injection — all implementations
@Service
public class FlexibleBillingService {
    private final Map<String, PaymentProcessor> processors;

    public FlexibleBillingService(Map<String, PaymentProcessor> processors) {
        this.processors = processors; // key = bean name, value = instance
    }

    public void processPayment(String processorType, double amount) {
        PaymentProcessor processor = processors.get(processorType + "Processor");
        processor.charge(amount);
    }
}
```

### Bean Scopes in EHR
```java
// Singleton (default) — one instance for entire app
@Service  // = @Component + @Scope("singleton")
public class PatientService { ... }  // MUST be stateless — shared by all threads!

// Prototype — new instance every time requested
@Component
@Scope("prototype")
public class FhirMessageBuilder {
    private final List<Object> entries = new ArrayList<>(); // mutable state OK here
    public void addEntry(Object entry) { entries.add(entry); }
    public FhirBundle build() { return new FhirBundle(entries); }
}

// Request scope — one per HTTP request (web only)
@Component
@RequestScope  // = @Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestAuditContext {
    private String requestId = UUID.randomUUID().toString();
    private String userId;
    private long startTime = System.currentTimeMillis();
    // lives for one HTTP request, then destroyed
}

// Inject prototype into singleton — PROBLEM!
@Service
public class ReportService {
    @Autowired
    private FhirMessageBuilder builder; // WRONG: singleton holds one prototype instance
    // Fix: use ObjectProvider or ApplicationContext.getBean()
    @Autowired
    private ObjectProvider<FhirMessageBuilder> builderProvider;

    public FhirBundle buildReport(List<CaseReport> reports) {
        FhirMessageBuilder builder = builderProvider.getObject(); // new instance each time!
        reports.forEach(r -> builder.addEntry(r.toFhirEntry()));
        return builder.build();
    }
}
```

---

## 2. BEAN LIFECYCLE — EHR INITIALIZATION

```
Spring Container starts
       │
       ▼
1. CLASS LOADING: @Component classes discovered by ComponentScan
       │
       ▼
2. INSTANTIATION: new PatientService(...)  → allocated on Heap (Old Gen after warmup)
       │
       ▼
3. DEPENDENCY INJECTION: repo, emailService, auditService injected
       │
       ▼
4. @PostConstruct: runs initialization code
       │
       ▼
5. BEAN READY: in ApplicationContext, serving requests
       │
       ▼ (app shutting down)
6. @PreDestroy: cleanup code
       │
       ▼
7. BEAN DESTROYED
```

```java
@Service
@Slf4j
public class IcdCodeCacheService {

    private Map<String, IcdCode> codeCache;
    private final IcdCodeRepository icdRepo;

    IcdCodeCacheService(IcdCodeRepository icdRepo) {
        this.icdRepo = icdRepo;
    }

    // Runs after dependency injection — safe to use injected beans
    @PostConstruct
    public void initialize() {
        log.info("Loading ICD code cache...");
        codeCache = icdRepo.findAll().stream()
            .collect(Collectors.toMap(IcdCode::getCode, c -> c));
        log.info("Loaded {} ICD codes", codeCache.size());
        // This cache is now in Old Gen — long-lived singleton
    }

    // Runs before bean is destroyed
    @PreDestroy
    public void cleanup() {
        log.info("Clearing ICD code cache");
        codeCache.clear();
    }

    public Optional<IcdCode> lookup(String code) {
        return Optional.ofNullable(codeCache.get(code));
    }
}
```

---

## 3. AOP — CROSS-CUTTING CONCERNS IN EHR

```
Without AOP:                    With AOP:
─────────────────────────      ─────────────────────────
PatientService.save():          PatientService.save():
  log.info("saving...")         ← AuditAspect runs BEFORE
  checkPermission(user)         ← SecurityAspect runs BEFORE
  validate(patient)
  patient = repo.save(patient)
  log.info("saved: {}", id)     ← AuditAspect runs AFTER
  recordMetric("save")          ← MetricsAspect runs AFTER
  return patient
                                All these are in ASPECTS,
                                not in the service!
```

```java
// HIPAA Audit Aspect — logs every access to patient data
@Aspect
@Component
@Slf4j
public class HipaaAuditAspect {

    // Pointcut: all public methods in service package that have Patient param or return Patient
    @Pointcut("execution(public * com.ehr.service.*.*(..))")
    void serviceLayer() {}

    @Pointcut("@annotation(com.ehr.annotation.AuditAccess)")
    void annotatedMethods() {}

    // Before: log who accessed what
    @Before("serviceLayer()")
    public void logAccess(JoinPoint jp) {
        UserContext user = EhrRequestContext.getUser();
        log.info("HIPAA-AUDIT: user={} accessing={}.{}",
            user != null ? user.getId() : "SYSTEM",
            jp.getTarget().getClass().getSimpleName(),
            jp.getSignature().getName()
        );
    }

    // Around: timing + exception handling for ALL service calls
    @Around("serviceLayer()")
    public Object timeAndHandle(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        String method = pjp.getSignature().toShortString();
        try {
            Object result = pjp.proceed(); // ACTUALLY CALLS THE METHOD
            long elapsed = System.currentTimeMillis() - start;
            metricsService.record(method, elapsed);
            if (elapsed > 1000) log.warn("SLOW: {} took {}ms", method, elapsed);
            return result;
        } catch (Exception e) {
            log.error("Exception in {}: {}", method, e.getMessage());
            metricsService.recordError(method);
            throw e; // re-throw — don't swallow
        }
    }

    // AfterReturning: audit successful patient data access
    @AfterReturning(
        pointcut = "execution(* com.ehr.service.PatientService.findById(..))",
        returning = "patient"
    )
    public void auditPatientAccess(JoinPoint jp, Patient patient) {
        if (patient != null) {
            auditRepo.save(new AuditEntry(
                EhrRequestContext.getUser().getId(),
                "PATIENT_ACCESSED",
                patient.getMrn(),
                LocalDateTime.now()
            ));
        }
    }

    // AfterThrowing: alert on security exceptions
    @AfterThrowing(
        pointcut = "serviceLayer()",
        throwing = "ex"
    )
    public void alertOnSecurityException(InsufficientPermissionException ex) {
        alertService.sendSecurityAlert(ex.getMessage(), EhrRequestContext.getUser());
    }
}

// ECR Retry Aspect — auto-retry failed FHIR submissions
@Aspect
@Component
public class RetryAspect {

    @Around("@annotation(retryable)")
    public Object retry(ProceedingJoinPoint pjp, Retryable retryable) throws Throwable {
        int maxAttempts = retryable.maxAttempts();
        long delay = retryable.delayMs();
        Throwable lastException = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return pjp.proceed();
            } catch (Exception e) {
                lastException = e;
                log.warn("Attempt {}/{} failed: {}", attempt, maxAttempts, e.getMessage());
                if (attempt < maxAttempts) Thread.sleep(delay * attempt); // exponential backoff
            }
        }
        throw lastException;
    }
}

// Usage annotation
@Service
public class FhirSubmissionService {
    @Retryable(maxAttempts = 3, delayMs = 1000)
    public CaseReport submit(CaseReport report) {
        return fhirClient.post(report); // automatically retried up to 3 times
    }
}
```

### How AOP Proxy Works in Memory
```
Without AOP:
  patientServiceBean → PatientService instance

With AOP:
  patientServiceBean → PatientServiceProxy (generated by CGLIB)
                          ├── intercept() → run @Before advice
                          ├── delegate to → PatientService (real object)
                          └── intercept() → run @After advice

CGLIB: creates a subclass at runtime (for non-interface classes)
JDK Proxy: creates a proxy implementing the interface (requires interface)

THIS IS WHY:
  @Autowired PatientService service → you get the PROXY, not the real bean
  service.save() → goes through aspects
  this.save()    → bypasses proxy (calling directly on real object)
  SOLUTION: @Autowired PatientService self; self.save(); (self-injection)
```

---

## 4. SPRING BOOT — EHR APPLICATION STARTUP

```java
// Entry point
@SpringBootApplication
// = @Configuration (allows @Bean methods)
// + @EnableAutoConfiguration (reads spring.factories, configures based on classpath)
// + @ComponentScan("com.ehr") (scans for @Component, @Service, etc.)
public class EhrApplication {
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(EhrApplication.class);
        app.addListeners(new EhrStartupListener());
        SpringApplication.run(EhrApplication.class, args);
    }
}

// Startup listener
@Component
public class EhrStartupListener implements ApplicationListener<ApplicationReadyEvent> {
    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        log.info("EHR System ready. Version: {}", buildProperties.getVersion());
        healthCheckService.verifyAllDependencies();
    }
}

// CommandLineRunner — run code after context starts
@Component
@Order(1) // run before other runners
public class EhrDataInitializer implements CommandLineRunner {
    @Override
    public void run(String... args) {
        if (environment.matchesProfiles("dev")) {
            seedTestPatients();
            seedTestDoctors();
            log.info("Dev data seeded");
        }
    }
}
```

### Auto-Configuration: How Spring Boot Sets Up DataSource
```
1. spring-boot-starter-data-jpa on classpath
2. SpringBoot sees: HikariCP + Hibernate + Spring Data JPA
3. Reads: spring.datasource.url, username, password from application.yml
4. @ConditionalOnMissingBean(DataSource.class) → no custom DataSource defined
5. AUTO-CREATES:
   - HikariDataSource (connection pool)
   - LocalContainerEntityManagerFactoryBean (Hibernate session factory)
   - JpaTransactionManager
   - All @Repository beans (Spring Data magic)
6. You write ZERO configuration for all of this
```

### application.yml — Complete EHR Config
```yaml
spring:
  application:
    name: ehr-service

  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/ehrdb}
    username: ${DB_USER:ehr_user}
    password: ${DB_PASS:secret}
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      pool-name: EHR-HikariPool

  jpa:
    hibernate:
      ddl-auto: ${DDL_AUTO:validate}
    show-sql: ${SHOW_SQL:false}
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc.batch_size: 25
        order_inserts: true

  cache:
    type: redis
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: 6379

server:
  port: ${PORT:8080}
  servlet:
    context-path: /ehr/api

# Custom EHR config
ehr:
  security:
    jwt-secret: ${JWT_SECRET}
    token-expiry-minutes: 60
    refresh-token-expiry-days: 7
  ecr:
    fhir-endpoint: ${FHIR_URL:https://ecr-now-dev.example.com/fhir}
    submission-enabled: ${ECR_ENABLED:true}
    retry-max-attempts: 3
    retry-delay-ms: 2000
  hipaa:
    audit-enabled: true
    mask-ssn-in-logs: true

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
```

```java
// Bind custom config to a POJO
@ConfigurationProperties(prefix = "ehr")
@Component
@Validated
public class EhrProperties {
    @Valid
    private Security security = new Security();
    @Valid
    private Ecr ecr = new Ecr();

    @Data
    public static class Security {
        @NotBlank String jwtSecret;
        @Min(5) @Max(1440) int tokenExpiryMinutes = 60;
        int refreshTokenExpiryDays = 7;
    }

    @Data
    public static class Ecr {
        @NotBlank String fhirEndpoint;
        boolean submissionEnabled = true;
        @Min(1) int retryMaxAttempts = 3;
        long retryDelayMs = 2000;
    }
}

// Inject
@Service
public class EcrNowService {
    @Autowired EhrProperties ehrProps;

    public boolean isSubmissionEnabled() {
        return ehrProps.getEcr().isSubmissionEnabled();
    }
}
```

---

## 5. SPRING MVC — COMPLETE EHR REST API

```java
// Full REST controller with all patterns
@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
@Slf4j
public class PatientController {

    private final PatientService patientService;
    private final PatientMapper mapper;

    // GET all with pagination + filtering
    @GetMapping
    public ResponseEntity<Page<PatientDto>> getAll(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "lastName") String sortBy,
        @RequestParam(defaultValue = "asc") String sortDir
    ) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Patient> patients = patientService.findAll(search, pageable);
        return ResponseEntity.ok(patients.map(mapper::toDto));
    }

    // GET by ID
    @GetMapping("/{id}")
    public ResponseEntity<PatientDto> getById(@PathVariable Long id) {
        Patient patient = patientService.findById(id); // throws 404 if not found
        return ResponseEntity.ok(mapper.toDto(patient));
    }

    // GET by MRN
    @GetMapping("/mrn/{mrn}")
    public ResponseEntity<PatientDto> getByMrn(@PathVariable String mrn) {
        return patientService.findByMrn(mrn)
            .map(mapper::toDto)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // POST — create
    @PostMapping
    public ResponseEntity<PatientDto> create(
        @RequestBody @Valid CreatePatientRequest request
    ) {
        Patient created = patientService.register(request);
        URI location = URI.create("/ehr/api/patients/" + created.getId());
        return ResponseEntity.created(location).body(mapper.toDto(created));
    }

    // PUT — full update
    @PutMapping("/{id}")
    public ResponseEntity<PatientDto> update(
        @PathVariable Long id,
        @RequestBody @Valid UpdatePatientRequest request
    ) {
        Patient updated = patientService.update(id, request);
        return ResponseEntity.ok(mapper.toDto(updated));
    }

    // PATCH — partial update
    @PatchMapping("/{id}")
    public ResponseEntity<PatientDto> partialUpdate(
        @PathVariable Long id,
        @RequestBody @Valid PatchPatientRequest request
    ) {
        Patient updated = patientService.patch(id, request);
        return ResponseEntity.ok(mapper.toDto(updated));
    }

    // DELETE
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        patientService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Nested resource: GET patient's appointments
    @GetMapping("/{id}/appointments")
    public ResponseEntity<List<AppointmentDto>> getAppointments(
        @PathVariable Long id,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,
        @RequestParam(required = false) AppointmentStatus status
    ) {
        List<Appointment> appointments =
            appointmentService.findByPatient(id, fromDate, status);
        return ResponseEntity.ok(mapper.toAppointmentDtos(appointments));
    }

    // POST to nested resource: book appointment
    @PostMapping("/{id}/appointments")
    public ResponseEntity<AppointmentDto> bookAppointment(
        @PathVariable Long id,
        @RequestBody @Valid BookAppointmentRequest request
    ) {
        Appointment apt = appointmentService.book(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mapper.toAppointmentDto(apt));
    }

    // POST action: trigger ECR check for a patient
    @PostMapping("/{id}/ecr-check")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<EcrCheckResult> triggerEcrCheck(@PathVariable Long id) {
        EcrCheckResult result = ecrNowService.checkPatient(id);
        return ResponseEntity.ok(result);
    }
}

// Request/Response DTOs with validation
@Data
@NoArgsConstructor
public class CreatePatientRequest {
    @NotBlank(message = "First name required")
    @Size(min = 1, max = 50)
    private String firstName;

    @NotBlank(message = "Last name required")
    @Size(min = 1, max = 50)
    private String lastName;

    @NotNull(message = "Date of birth required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotBlank @Email(message = "Valid email required")
    private String email;

    @Pattern(regexp = "^\\d{3}-\\d{2}-\\d{4}$", message = "SSN format: XXX-XX-XXXX")
    private String ssn;
}
```

### Spring MVC Request Lifecycle (Detailed)
```
HTTP POST /ehr/api/patients
         │
         ▼
Embedded Tomcat (HTTP connector, port 8080)
         │
         ▼
FilterChain (executes in order):
  1. CorsFilter          → sets CORS headers
  2. JwtAuthFilter       → validates JWT, sets SecurityContext
  3. EhrRequestFilter    → sets ThreadLocal user context
  4. ContentNegotiationFilter
         │
         ▼
DispatcherServlet (main Spring MVC entry point)
         │
         ├─→ HandlerMapping.getHandler()
         │     → finds PatientController.create() as handler
         │     → wraps in HandlerExecutionChain with interceptors
         │
         ├─→ Interceptor.preHandle()
         │     → EhrLoggingInterceptor logs request
         │
         ├─→ HandlerAdapter.handle()
         │     → resolves @RequestBody → Jackson deserializes JSON to CreatePatientRequest
         │     → validates @Valid → BindingResult
         │     → calls PatientController.create(request)
         │           → PatientService.register(request)  [AOP proxy]
         │               → AuditAspect.logAccess()        [before advice]
         │               → real PatientService.register()
         │               → AuditAspect.timeAndHandle()    [around advice]
         │           → returns ResponseEntity
         │
         ├─→ Interceptor.postHandle()
         │
         ├─→ HttpMessageConverter (Jackson)
         │     → serializes PatientDto to JSON
         │
         └─→ Interceptor.afterCompletion()
                   → EhrLoggingInterceptor logs response time

HTTP 201 Created {"id": 123, "mrn": "MRN-2024-000001", ...}
```

---

## 6. SPRING SECURITY — JWT-BASED EHR AUTH

```java
// Security Configuration
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // enables @PreAuthorize
public class EhrSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())          // stateless JWT — no CSRF needed
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s ->
                s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // no sessions!
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/auth/login", "/auth/refresh").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                // Role-based access
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/patients/**").hasRole("ADMIN")
                .requestMatchers("/ecr/**").hasAnyRole("DOCTOR", "NURSE", "ADMIN")
                // Everything else: must be authenticated
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(),
                             UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(e -> e
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                .accessDeniedHandler(new CustomAccessDeniedHandler())
            )
            .build();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtService, userDetailsService);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // strength factor: 12 rounds
    }
}

// JWT Filter — runs on every request
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws Exception {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); // no token → pass through
            return;
        }

        String jwt = authHeader.substring(7); // remove "Bearer "
        String username = jwtService.extractUsername(jwt);

        // Only authenticate if not already authenticated
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails user = userDetailsService.loadUserByUsername(username);

            if (jwtService.isTokenValid(jwt, user)) {
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                        user, null, user.getAuthorities()
                    );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken); // set in ThreadLocal!
            }
        }
        filterChain.doFilter(request, response);
    }
}

// JWT Service
@Service
public class JwtService {
    @Value("${ehr.security.jwt-secret}") private String secretKey;
    @Value("${ehr.security.token-expiry-minutes}") private int expiryMinutes;

    public String generateToken(UserDetails userDetails, Long userId, List<String> roles) {
        return Jwts.builder()
            .setSubject(userDetails.getUsername())
            .claim("userId", userId)
            .claim("roles", roles)
            .claim("system", "EHR")
            .setIssuedAt(new Date())
            .setExpiration(Date.from(Instant.now().plusSeconds(expiryMinutes * 60L)))
            .signWith(getSignKey(), SignatureAlgorithm.HS256)
            .compact();
        // Result: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZWhy....<signature>"
        //          ─────header─────────  ──────────payload──────────  ──signature──
    }

    public boolean isTokenValid(String token, UserDetails user) {
        String username = extractUsername(token);
        return username.equals(user.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }
    // ... helper methods
}

// UserDetailsService — load doctor/nurse from DB
@Service
@RequiredArgsConstructor
public class EhrUserDetailsService implements UserDetailsService {
    private final UserRepository userRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        EhrUser user = userRepo.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getUsername())
            .password(user.getPasswordHash())  // BCrypt hash
            .roles(user.getRoles().toArray(String[]::new))
            .accountExpired(!user.isActive())
            .credentialsExpired(user.isPasswordExpired())
            .build();
    }
}
```

### JWT Flow Diagram
```
LOGIN:
  POST /auth/login {username: "dr.smith", password: "secret"}
        │
        ▼
  AuthService.authenticate()
        │
        ├─→ UserDetailsService.loadUserByUsername("dr.smith")  → DB
        ├─→ BCryptPasswordEncoder.matches(raw, hash)           → true/false
        └─→ JwtService.generateToken(user, id, roles)
              → {"accessToken": "eyJ...", "refreshToken": "eyJ..."}

SUBSEQUENT REQUESTS:
  GET /patients/123
  Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkci5zbWl0aCJ9....
        │
        ▼
  JwtAuthFilter.doFilterInternal()
        ├─→ Extract token from header
        ├─→ JwtService.extractUsername(token) → "dr.smith"
        ├─→ UserDetailsService.loadUserByUsername("dr.smith") → UserDetails
        ├─→ JwtService.isTokenValid(token, userDetails) → true
        └─→ SecurityContextHolder.setAuthentication(token)  ← ThreadLocal!
              → controller method executes with security context set
```

---

## 7. SPRING ACTUATOR — EHR HEALTH MONITORING

```java
// Custom health indicator for EHR dependencies
@Component
public class EcrNowHealthIndicator implements HealthIndicator {

    private final EcrNowClient ecrClient;

    @Override
    public Health health() {
        try {
            EcrStatus status = ecrClient.ping(); // call ECR-NOW /health
            if (status.isUp()) {
                return Health.up()
                    .withDetail("ecrVersion", status.getVersion())
                    .withDetail("lastSync", status.getLastSyncTime())
                    .build();
            }
            return Health.down().withDetail("reason", "ECR-NOW returned unhealthy").build();
        } catch (Exception e) {
            return Health.down(e).withDetail("reason", "Cannot reach ECR-NOW").build();
        }
    }
}

// Custom metrics (exposed at /actuator/metrics)
@Component
public class EhrMetrics {
    private final MeterRegistry registry;

    public EhrMetrics(MeterRegistry registry) {
        this.registry = registry;
        // Gauge — current value
        Gauge.builder("ehr.active.patients", patientService, PatientService::countActive)
             .description("Number of active patients")
             .register(registry);
    }

    // Counter — cumulative count
    public void incrementEcrSubmissions(boolean success) {
        Counter.builder("ecr.submissions")
            .tag("success", String.valueOf(success))
            .register(registry)
            .increment();
    }

    // Timer — measure latency
    public Timer.Sample startTimer() {
        return Timer.start(registry);
    }
    public void stopTimer(Timer.Sample sample, String operation) {
        sample.stop(Timer.builder("ehr.operation.duration")
            .tag("operation", operation)
            .register(registry));
    }
}
```

---

## 🔗 CONNECTIONS TO OTHER TOPICS

```
M04 Spring Framework
│
├─→ M01 Core Java      — @Component, @Service = annotated POJOs; OOP principles in DI
├─→ M02 Collections    — Spring returns List<T>, Page<T>, Map<K,V> everywhere
├─→ M03 Concurrency    — @Async, ExecutorService beans, ThreadLocal in SecurityContext
├─→ M05 JPA/Database   — @Repository, @Transactional, Spring Data JPA
├─→ M06 Microservices  — @FeignClient, Spring Cloud Gateway, @KafkaListener
└─→ M07 Testing        — @SpringBootTest, @WebMvcTest, @MockBean

Key Terms: IoC, DI, Bean, Scope, @Autowired, @Qualifier, AOP, Aspect,
           Advice, Pointcut, Proxy, @SpringBootApplication, Auto-Configuration,
           JWT, @PreAuthorize, SecurityContext, ThreadLocal, Actuator
```

---

## 🔁 REBUILD CHALLENGES

1. Explain IoC with a real-world analogy. Why is constructor injection preferred?
2. Draw the Spring Bean lifecycle with PostConstruct and PreDestroy.
3. What is AOP? Write the HipaaAuditAspect `@Around` advice from memory.
4. Why does `this.method()` inside a Spring bean bypass AOP? How to fix?
5. Draw the JWT authentication flow from login to a protected API call.
6. What does `@SpringBootApplication` do? What are its 3 component annotations?
7. What is the difference between `@Component`, `@Service`, `@Repository`, `@Controller`?
8. Explain the Spring MVC request lifecycle for `POST /patients`.
9. Write a `SecurityFilterChain` bean: public login, authenticated everything else.
10. What is `@ConditionalOnMissingBean`? Give an Auto-Configuration example.
