# M10 — Modern Java (9–21) Master
## Java 9 through Java 21 New Features
## EHR / ECR-NOW Domain | Java Senior Interview Series

> **Why this matters:** Interviewers ask about modern Java constantly. "Are you using records?", "Have you tried virtual threads?", "What's new in Java 17?" — if you can't answer these confidently, you signal you haven't kept up. This file covers every feature that matters for senior interviews.

---

## PART 1 — Java 9: Modules, Factory Methods, and More

### 1.1 Java Platform Module System (JPMS)

```java
// module-info.java — declares what this module exports and requires
module com.ehr.patient {
    requires java.base;                    // Always implicit
    requires spring.context;
    requires spring.data.jpa;
    requires com.ehr.common;               // Another EHR module

    exports com.ehr.patient.api;           // Public API accessible to others
    exports com.ehr.patient.domain;

    // NOT exported (internal implementation):
    // com.ehr.patient.repository (private to this module)
    // com.ehr.patient.mapper (private)

    opens com.ehr.patient.domain to hibernate.core;  // Allow reflection (Hibernate needs it)
    opens com.ehr.patient.api to jackson.databind;   // Jackson needs reflection for DTOs
}

// Interview point: Strong encapsulation — before modules, any class could
// access any public class in any JAR. Modules enforce boundaries at JVM level.
// In practice: most Spring Boot apps still use the classpath (unnamed module)
// JPMS is more relevant for framework/library developers.
```

### 1.2 Collection Factory Methods (Java 9)

```java
// Before Java 9 — verbose
List<String> conditions = new ArrayList<>();
conditions.add("COVID-19");
conditions.add("MEASLES");
List<String> immutable = Collections.unmodifiableList(conditions);

// Java 9+ — concise, immutable, null-safe (throws NPE on null element)
List<String> conditions = List.of("COVID-19", "MEASLES", "TUBERCULOSIS");
Set<String> reportable = Set.of("COVID-19", "EBOLA", "MEASLES");
Map<String, Integer> priorityMap = Map.of(
    "COVID-19", 1,
    "EBOLA", 1,
    "MEASLES", 2
);

// Map.ofEntries for more than 10 entries
Map<String, String> icdDescriptions = Map.ofEntries(
    Map.entry("U07.1", "COVID-19"),
    Map.entry("A98.4", "Ebola"),
    Map.entry("B05",   "Measles")
    // ... more entries
);

// Key facts for interview:
// - Truly immutable (UnsupportedOperationException on mutation)
// - Iteration order: List.of preserves order; Set.of and Map.of do NOT
// - Null elements/keys/values throw NullPointerException
// - Use copyOf() to make mutable collection immutable: List.copyOf(mutableList)
```

### 1.3 Stream Improvements (Java 9)

```java
// takeWhile: take elements while predicate is true, stop at first false
List<LabResult> recentNegatives = labResults.stream()
    .sorted(Comparator.comparing(LabResult::getResultedAt).reversed())
    .takeWhile(r -> !r.isPositive())    // Stop at first positive result
    .collect(toList());

// dropWhile: skip elements while predicate is true, take the rest
List<Appointment> upcomingAfterFirstCancelled = appointments.stream()
    .sorted(Comparator.comparing(Appointment::getScheduledAt))
    .dropWhile(a -> a.getStatus() != CANCELLED)  // Skip until first cancellation
    .collect(toList());

// Stream.iterate with predicate (Java 9) — like a for loop
Stream.iterate(LocalDate.now(), date -> date.isBefore(LocalDate.now().plusDays(30)),
    date -> date.plusDays(1))          // start, hasNext predicate, next function
    .filter(date -> !isHoliday(date))
    .forEach(date -> scheduleEcrCheck(date));

// Stream.ofNullable — safely stream a potentially null value
Stream.ofNullable(patient.getPrimaryDoctor())   // empty stream if null
    .map(Doctor::getEmail)
    .forEach(notificationService::send);

// Optional.or() (Java 9) — provide alternative Optional
Optional<Patient> patient = ehrCache.find(mrn)
    .or(() -> backupCache.find(mrn))            // Try backup if primary misses
    .or(() -> patientRepository.findByMrn(mrn).map(Optional::of).orElse(Optional.empty()));

// Optional.ifPresentOrElse() (Java 9)
patientOpt.ifPresentOrElse(
    p -> log.info("Found patient: {}", p.getMrn()),
    () -> log.warn("Patient not found, creating default record")
);

// Optional.stream() (Java 9) — convert Optional to Stream (0 or 1 elements)
List<Doctor> assignedDoctors = patients.stream()
    .map(Patient::getPrimaryDoctor)       // Stream<Optional<Doctor>>
    .flatMap(Optional::stream)            // Stream<Doctor> (skips empties)
    .distinct()
    .collect(toList());
```

---

## PART 2 — Java 10–11: var and String Methods

### 2.1 Local Variable Type Inference — `var` (Java 10)

```java
// var infers the type from the right-hand side — compile-time only
// The bytecode is identical to explicit types — zero runtime overhead

// Good uses — removes redundant type noise
var patientService = new PatientService(repository, ecrService);
var patientList = patientRepository.findAll();
var icdCodeMap = new HashMap<String, IcdCode>();

// Excellent in try-with-resources
try (var connection = dataSource.getConnection();
     var statement = connection.prepareStatement(sql)) {
    var resultSet = statement.executeQuery();
    // ...
}

// Good in for-each
for (var appointment : patient.getAppointments()) {
    processAppointment(appointment);
}

// BAD uses — hurts readability
var x = patientService.getResult();  // What type is x? Reader can't tell
var result = 42;                     // Fine but gains nothing

// Cannot use var:
// - Method parameters
// - Return types
// - Fields
// - Lambda parameters (except implicitly in Java 11+)
// - null initialization: var x = null; (compiler can't infer type)

// Java 11: var in lambda parameters (allows annotations)
patients.stream()
    .filter((@NotNull var p) -> p.getStatus() == ACTIVE)  // @NotNull on lambda param
    .collect(toList());
```

### 2.2 Java 11 String Methods

```java
String mrn = "  MRN-001  ";

mrn.strip();         // Like trim() but Unicode-aware (removes Unicode whitespace too)
mrn.stripLeading();  // Remove leading whitespace only
mrn.stripTrailing(); // Remove trailing whitespace only
mrn.isBlank();       // true if empty or only whitespace (better than isEmpty())
"MRN-001".repeat(3); // "MRN-001MRN-001MRN-001"

// lines() — split by line terminators, returns Stream<String>
String fhirBundle = "{\n  \"resourceType\": \"Bundle\",\n  \"id\": \"ecr-001\"\n}";
fhirBundle.lines()
    .map(String::strip)
    .filter(line -> !line.isEmpty())
    .forEach(System.out::println);
```

---

## PART 3 — Java 14–15: Records, Text Blocks, Pattern Matching

### 3.1 Records (Java 16 stable, preview in 14-15)

```java
// Records: immutable data carriers — replaces POJOs for DTOs
// Compiler generates: constructor, getters, equals, hashCode, toString

// Simple DTO
record PatientDto(String mrn, String firstName, String lastName, LocalDate dateOfBirth) {}

// Usage
PatientDto dto = new PatientDto("MRN-001", "John", "Doe", LocalDate.of(1985, 3, 15));
System.out.println(dto.mrn());          // Accessor (no "get" prefix)
System.out.println(dto.firstName());
System.out.println(dto);               // PatientDto[mrn=MRN-001, firstName=John, ...]

// Compact constructor for validation
record EcrSubmission(String patientMrn, String conditionCode, LocalDate reportDate) {
    // Compact constructor — no parameter list, has access to all fields
    EcrSubmission {
        Objects.requireNonNull(patientMrn, "MRN required");
        if (conditionCode.isBlank()) throw new IllegalArgumentException("Condition code empty");
        // Note: assignment to fields happens automatically after compact constructor
    }
}

// Records CAN:
// - Implement interfaces
// - Have static fields and methods
// - Have additional instance methods
// - Have additional constructors (must delegate to canonical)

record LabResultEvent(String mrn, String conditionCode, boolean positive, Instant timestamp) {
    // Additional factory method
    static LabResultEvent positive(String mrn, String conditionCode) {
        return new LabResultEvent(mrn, conditionCode, true, Instant.now());
    }

    // Instance method
    boolean requiresEcr() {
        return positive && EcrCodeRegistry.isReportable(conditionCode);
    }
}

// Records CANNOT:
// - Extend other classes (implicitly extends Record)
// - Have mutable fields (all fields are final)
// - Declare instance fields outside record components

// With Jackson (Spring Boot):
@JsonIgnoreProperties(ignoreUnknown = true)
record CreatePatientRequest(
    @NotBlank String firstName,
    @NotBlank String lastName,
    @Past @NotNull LocalDate dateOfBirth,
    @Email String email
) {}

// Interview: Records vs Lombok @Value
// Records: JDK-native, no annotation processor, but no builder pattern
// Lombok @Value: still common (builder, @With for copy-with-change)
// Modern preference: Records for DTOs and value objects
```

### 3.2 Text Blocks (Java 15 stable, preview 13-14)

```java
// Text blocks — multiline strings without escape hell
// Leading whitespace determined by indentation of closing """

// SQL query (before: string concatenation mess)
String query = """
    SELECT p.mrn, p.first_name, p.last_name,
           lr.test_code, lr.result_value, lr.positive
    FROM patients p
    JOIN lab_results lr ON lr.patient_id = p.id
    WHERE lr.positive = true
      AND lr.resulted_at > :since
    ORDER BY lr.resulted_at DESC
    """;  // Trailing newline included

// JSON template
String fhirTemplate = """
    {
        "resourceType": "Bundle",
        "id": "%s",
        "type": "message",
        "entry": [
            {
                "resource": {
                    "resourceType": "Patient",
                    "identifier": [{"value": "%s"}]
                }
            }
        ]
    }
    """.formatted(bundleId, patientMrn);

// FHIR/HL7 message template
String hl7Message = """
    MSH|^~\\&|EHR|HOSPITAL|ECR-NOW|PUBLIC-HEALTH|%s||ORU^R01|%s|P|2.5.1
    PID|||%s||%s^%s||%s|%s
    OBR|||%s|%s
    OBX|1|ST|%s||%s
    """.formatted(timestamp, messageId, mrn, lastName, firstName,
                  dob, gender, orderId, testCode, resultCode, resultValue);

// Interview points:
// Text block is still a String — same methods, same performance
// Indentation stripped relative to closing """
// \n included at end of each line
// Use .stripIndent() and .translateEscapes() for manual control
```

### 3.3 Pattern Matching for `instanceof` (Java 16 stable)

```java
// Before Java 16 — verbose and error-prone
Object resource = getFhirResource();
if (resource instanceof Patient) {
    Patient patient = (Patient) resource;  // Redundant cast
    process(patient);
}

// Java 16+ — binding variable declared inline
if (resource instanceof Patient patient) {
    process(patient);  // patient is in scope here, already cast
}

// Combine with conditions (scope)
if (resource instanceof Patient patient && patient.getStatus() == ACTIVE) {
    submitEcr(patient);
}

// In EHR — processing different FHIR resource types
void processFhirResource(Object resource) {
    if (resource instanceof Patient patient) {
        patientService.update(patient);
    } else if (resource instanceof Observation observation) {
        labResultService.process(observation);
    } else if (resource instanceof DiagnosticReport report) {
        ecrService.evaluate(report);
    } else {
        log.warn("Unknown FHIR resource type: {}", resource.getClass().getSimpleName());
    }
}

// Negation
if (!(resource instanceof Patient patient)) {
    throw new IllegalArgumentException("Expected Patient resource");
}
// patient is in scope after the if block (because exception thrown if not Patient)
process(patient);
```

---

## PART 4 — Java 17: Sealed Classes and Switch Expressions

### 4.1 Sealed Classes and Interfaces (Java 17 stable)

```java
// Sealed classes: explicitly declare which classes can extend them
// Enables exhaustive pattern matching

// Sealed interface for EHR notification types
sealed interface EhrNotification
    permits AppointmentReminder, LabResultAlert, EcrConfirmation, CriticalAlert {

    String getRecipientId();
    String getMessage();
    NotificationPriority getPriority();
}

// Each permitted class must be: final, sealed, or non-sealed
record AppointmentReminder(
    String recipientId,
    String message,
    LocalDateTime appointmentTime,
    String doctorName
) implements EhrNotification {
    @Override public NotificationPriority getPriority() { return NORMAL; }
}

record LabResultAlert(
    String recipientId,
    String message,
    String labResultId,
    boolean positive
) implements EhrNotification {
    @Override public NotificationPriority getPriority() {
        return positive ? HIGH : NORMAL;
    }
}

record EcrConfirmation(String recipientId, String message, String caseReportId)
    implements EhrNotification {
    @Override public NotificationPriority getPriority() { return LOW; }
}

final class CriticalAlert implements EhrNotification {
    // final = no further subclassing
    private final String recipientId, message, condition;
    @Override public NotificationPriority getPriority() { return CRITICAL; }
    // getters...
}

// Key benefit: switch can be EXHAUSTIVE — compiler error if case missing
String route(EhrNotification notification) {
    return switch (notification) {
        case AppointmentReminder r -> "sms,email";       // SMS + email for reminders
        case LabResultAlert a when a.positive() -> "page,sms,email";  // Page for positives
        case LabResultAlert a -> "email";
        case EcrConfirmation c -> "email";
        case CriticalAlert c -> "page,sms,email,escalate";
        // No default needed — compiler knows all cases covered
    };
}
```

### 4.2 Switch Expressions (Java 14 stable)

```java
// Classic switch statement (Java 1.0) — fall-through, verbose
String channel;
switch (priority) {
    case CRITICAL:
        channel = "page";
        break;  // Miss this → fall-through bug
    case HIGH:
        channel = "sms";
        break;
    default:
        channel = "email";
}

// Switch expression (Java 14) — arrow syntax, no fall-through, returns value
String channel = switch (priority) {
    case CRITICAL -> "page";
    case HIGH -> "sms";
    case NORMAL -> "email";
    case LOW -> "portal";    // No default needed if enum is exhaustive
};

// yield for multi-statement cases
String message = switch (notification.getType()) {
    case APPOINTMENT_REMINDER -> {
        Appointment apt = appointmentService.find(notification.getReferenceId());
        yield "Reminder: appointment with Dr. %s at %s"
            .formatted(apt.getDoctorName(), apt.getScheduledAt());
    }
    case LAB_RESULT -> "Your lab results are available";
    case ECR_CONFIRMATION -> "Case report submitted successfully";
};

// Pattern matching in switch (Java 21 stable, preview 17-20)
double calculateRisk(Object resource) {
    return switch (resource) {
        case Patient p when p.getAge() > 65 -> riskModel.elderlyRisk(p);
        case Patient p -> riskModel.standardRisk(p);
        case LabResult r when r.isPositive() -> 1.0;
        case LabResult r -> 0.1;
        case null -> throw new IllegalArgumentException("Null resource");
        default -> 0.0;
    };
}
```

---

## PART 5 — Java 21: Virtual Threads (Project Loom) ⭐ HOTTEST TOPIC

### 5.1 What Are Virtual Threads?

```
Traditional (Platform) Thread:
  - Mapped 1:1 to OS thread
  - ~1MB stack memory per thread
  - JVM on 4-core machine: typically 200-500 threads practical limit
  - Blocking IO (DB, HTTP): thread blocked, OS context switch = expensive
  - Spring MVC: one thread per request → limited to ~200 concurrent requests

Virtual Thread (Java 21):
  - Lightweight JVM threads (not OS threads)
  - Mounted on carrier (OS) threads when actually running
  - When blocking (IO, sleep): unmounts from carrier thread → carrier free to run other virtual thread
  - Can have MILLIONS of virtual threads (a few KB each)
  - Spring MVC with virtual threads: one virtual thread per request → thousands concurrent requests
  - No code changes needed for most apps (just enable)
```

### 5.2 Virtual Threads in Code

```java
// Create virtual threads
Thread vt = Thread.ofVirtual().start(() -> processLabResult(labResult));

// Virtual thread executor (replaces thread pool for IO-bound work)
try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
    // Each task gets its own virtual thread — no pool size limit
    List<Future<EcrSubmission>> futures = labResults.stream()
        .map(r -> executor.submit(() -> buildEcrSubmission(r)))
        .collect(toList());
    // All submissions happen concurrently, no thread pool exhaustion
}

// Spring Boot 3.2+ — enable virtual threads (one line!)
// application.yml:
// spring.threads.virtual.enabled: true
// That's it — all @Async, HTTP request threads, @Scheduled use virtual threads

// Spring MVC with virtual threads:
@Bean
public TomcatProtocolHandlerCustomizer<?> protocolHandlerVirtualThreadExecutorCustomizer() {
    return protocolHandler -> {
        protocolHandler.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
    };
}

// EHR benefit: loading patient dashboard requires 5 DB calls
// Traditional: one platform thread blocked waiting for each DB call
// Virtual threads: 5 virtual threads, each blocked on DB, but carrier threads free
// → handles 10x more concurrent users with same hardware
```

### 5.3 Virtual Thread Pitfalls

```java
// Pitfall 1: synchronized blocks pin the carrier thread (Java 21)
// Pinning = virtual thread blocks AND pins its carrier thread (defeats the purpose)
// BAD:
synchronized (lock) {
    db.query(sql);  // Blocks here — carrier thread pinned!
}

// GOOD: Use ReentrantLock instead
private final ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    db.query(sql);  // Virtual thread unmounts — carrier free
} finally {
    lock.unlock();
}
// Note: Java 22+ fixes some pinning issues with synchronized

// Pitfall 2: ThreadLocal with large values
// Millions of virtual threads → millions of ThreadLocal copies → memory pressure
// Use ScopedValue (Java 21 preview) instead for virtual threads:
static final ScopedValue<UserContext> USER = ScopedValue.newInstance();

// Bind for duration of request processing:
ScopedValue.where(USER, userContext)
    .run(() -> {
        processRequest();  // USER.get() returns userContext here
        // Sub-tasks inherit this automatically
    });

// Pitfall 3: CPU-bound work
// Virtual threads don't help CPU-bound tasks (no IO to unmount on)
// ForkJoinPool / parallel streams still better for CPU-intensive work

// Pitfall 4: Thread pool of virtual threads — antipattern
// Executors.newFixedThreadPool(200) with virtual threads = misses the point
// Use: Executors.newVirtualThreadPerTaskExecutor() — unlimited concurrent tasks
```

### 5.4 Structured Concurrency (Java 21 Preview)

```java
// Problem: CompletableFuture makes it hard to cancel subtasks and handle errors
// Structured Concurrency: child tasks live within parent's scope
// When parent exits: all children cancelled; errors propagate cleanly

// EHR: Enrich lab result with parallel data fetching
LabResultResponse enrichLabResult(String labId) throws InterruptedException, ExecutionException {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        // Fork subtasks
        StructuredTaskScope.Subtask<Patient> patientTask =
            scope.fork(() -> patientRepository.findByLabId(labId));
        StructuredTaskScope.Subtask<Doctor> doctorTask =
            scope.fork(() -> doctorRepository.findOrderingDoctor(labId));
        StructuredTaskScope.Subtask<FhirBundle> fhirTask =
            scope.fork(() -> fhirService.buildBundle(labId));

        // Wait for all — if any fails, scope.throwIfFailed() throws
        scope.join().throwIfFailed();

        // All succeeded — combine results
        return new LabResultResponse(
            patientTask.get(), doctorTask.get(), fhirTask.get()
        );
    }
    // When scope exits: all subtasks completed or cancelled automatically
    // No dangling threads! Clear lifecycle.
}

// ShutdownOnSuccess: take first successful result, cancel others
// (EHR: try primary FHIR endpoint, backup, return whichever answers first)
try (var scope = new StructuredTaskScope.ShutdownOnSuccess<FhirResponse>()) {
    scope.fork(() -> primaryFhirEndpoint.submit(bundle));
    scope.fork(() -> backupFhirEndpoint.submit(bundle));
    scope.join();
    return scope.result();  // Fastest response
}
```

---

## PART 6 — Java 14–21: Pattern Matching and More

### 6.1 Pattern Matching in Switch (Java 21)

```java
// Combines sealed classes + switch expressions + pattern matching
// Most powerful feature for business logic in Java 21

sealed interface EcrStatus permits Pending, Submitted, Failed, Rejected {}
record Pending(LocalDateTime since) implements EcrStatus {}
record Submitted(String referenceId, LocalDateTime at) implements EcrStatus {}
record Failed(String reason, int attempts) implements EcrStatus {}
record Rejected(String reason, String agencyCode) implements EcrStatus {}

// Exhaustive switch — compiler error if case missing
String describe(EcrStatus status) {
    return switch (status) {
        case Pending p when p.since().isBefore(Instant.now().minus(1, HOURS).atZone(UTC).toLocalDateTime())
            -> "OVERDUE: pending for over 1 hour";
        case Pending p -> "Pending since " + p.since();
        case Submitted s -> "Submitted with reference " + s.referenceId();
        case Failed f when f.attempts() >= 3 -> "ESCALATE: failed " + f.attempts() + " times";
        case Failed f -> "Failed: " + f.reason() + " (attempt " + f.attempts() + ")";
        case Rejected r -> "Rejected by " + r.agencyCode() + ": " + r.reason();
        // No default — compiler knows all EcrStatus cases covered (sealed)
    };
}
```

### 6.2 Sequenced Collections (Java 21)

```java
// Java 21 adds SequencedCollection, SequencedSet, SequencedMap
// Uniform API for first/last access across List, Deque, LinkedHashSet, LinkedHashMap

List<Appointment> appointments = patient.getSortedAppointments();
appointments.getFirst();   // First element (throws if empty)
appointments.getLast();    // Last element
appointments.reversed();   // Reverse view

LinkedHashMap<String, Patient> orderedCache = new LinkedHashMap<>();
orderedCache.firstEntry();  // Entry inserted first
orderedCache.lastEntry();   // Entry inserted last
orderedCache.sequencedKeySet();   // Keys in insertion order
orderedCache.sequencedValues();   // Values in insertion order

// EHR use: most recent lab result
SequencedCollection<LabResult> results = getResultsSortedByDate();
LabResult mostRecent = results.getLast();
LabResult oldest = results.getFirst();
```

### 6.3 Record Patterns (Java 21)

```java
// Deconstruct records in pattern matching
record PatientEvent(Patient patient, String eventType, Instant timestamp) {}

void processEvent(Object event) {
    switch (event) {
        // Destructure the record in the pattern
        case PatientEvent(var patient, "LAB_RESULT", var timestamp)
            when patient.hasReportableCondition() -> {
                ecrService.submit(patient, timestamp);
            }
        case PatientEvent(var patient, "APPOINTMENT_CANCELLED", var timestamp) -> {
            notificationService.notifyDoctor(patient, "Appointment cancelled");
        }
        case PatientEvent(var p, var type, var ts) -> {
            auditService.log(p.getMrn(), type, ts);
        }
        default -> log.debug("Unknown event: {}", event);
    }
}
```

---

## PART 7 — String and HTTP Improvements

### 7.1 String Changes Summary

```java
// Java 11
"  MRN-001  ".strip()          // Unicode-aware trim
"".isBlank()                   // true (isEmpty() doesn't catch "  ")
"AB".repeat(3)                 // "ABABAB"

// Java 12
String.indent(4)               // Add 4 spaces to each line
String.transform(s -> s.toUpperCase())  // Apply function to string

// Java 13
String.formatted("Patient: %s", mrn)  // Like String.format but as instance method

// Java 15 — Text blocks (see Part 3)

// Java 21
String template = "Patient MRN: %s, Age: %d".formatted(mrn, age);
// Same as String.format but cleaner

// Character.isEmoji() (Java 21) — for patient portal emoji support 😄
```

### 7.2 HTTP Client (Java 11) — Replacing RestTemplate

```java
// Java 11 built-in HTTP client (async, HTTP/2, no extra dependency)
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(5))
    .followRedirects(HttpClient.Redirect.NORMAL)
    .build();

// Synchronous request to ECR-NOW
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(ecrNowBaseUrl + "/api/fhir/bundle"))
    .header("Content-Type", "application/fhir+json")
    .header("Authorization", "Bearer " + apiKey)
    .POST(HttpRequest.BodyPublishers.ofString(fhirBundleJson))
    .timeout(Duration.ofSeconds(10))
    .build();

HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());

if (response.statusCode() == 200) {
    EcrResponse ecrResponse = objectMapper.readValue(response.body(), EcrResponse.class);
}

// Asynchronous request
CompletableFuture<HttpResponse<String>> future = client.sendAsync(request,
    HttpResponse.BodyHandlers.ofString());

future.thenApply(HttpResponse::body)
    .thenApply(body -> objectMapper.readValue(body, EcrResponse.class))
    .exceptionally(e -> { log.error("ECR submission failed", e); return null; });

// In Spring Boot context: still prefer Spring's WebClient (Reactor integration,
// filter chain, error handling) or RestClient (Java 11+, Spring 6.1) over raw HttpClient
```

---

## PART 8 — Java Version Feature Summary (Interview Quick Reference)

| Version | Key Features | Interview Relevance |
|---------|-------------|---------------------|
| Java 8 | Lambdas, Streams, Optional, Method References, Default Methods, CompletableFuture | **Must know cold** |
| Java 9 | Modules, `List.of()`, `Stream.takeWhile/dropWhile`, `Optional.or()` | **Know factory methods** |
| Java 10 | `var` local variable | **Know it, use it** |
| Java 11 | `String.strip/isBlank`, HTTP Client, `Files.readString()`, LTS | **Know string methods, HTTP client** |
| Java 14 | Switch expressions (stable), Records (preview) | **Know switch expressions** |
| Java 15 | Text blocks (stable), Sealed classes (preview) | **Know text blocks** |
| Java 16 | Records (stable), `instanceof` pattern matching | **Know records well** |
| Java 17 | Sealed classes (stable), LTS | **Know sealed classes, pattern matching** |
| Java 21 | Virtual threads, Pattern matching switch, Records patterns, SequencedCollections, LTS | **HOT — know virtual threads** |

---

## PART 9 — Interview Questions on Modern Java

---

**Q: What are Java Records? When would you use them over a regular class?**

Records are immutable data carriers introduced in Java 16. The compiler generates the canonical constructor, `toString()`, `equals()`, `hashCode()`, and accessors automatically. Use records for: DTOs (request/response objects), value objects (coordinates, money amounts, events), data transfer between layers. Don't use records when: you need mutable state, you need inheritance (records implicitly extend `Record`), or you need a builder pattern (use Lombok for that). In EHR: `record PatientDto(String mrn, String firstName, String lastName)` for API responses, `record LabResultEvent(String mrn, String conditionCode, boolean positive)` for Kafka events.

---

**Q: What are Virtual Threads? How do they change server design?**

Virtual threads (Project Loom, Java 21) are lightweight threads managed by the JVM, not OS. When a virtual thread blocks on IO, it unmounts from the OS carrier thread — that carrier thread is free to run other virtual threads. This means: with 10 OS threads you can have millions of virtual threads, all doing IO concurrently. Traditional server design was: use async/reactive (WebFlux, callbacks) to avoid blocking — complex code. With virtual threads: write simple blocking code, get async performance. Spring Boot 3.2 supports it with `spring.threads.virtual.enabled: true`. In EHR: loading a patient dashboard requires 5 DB queries — virtual threads do all 5 concurrently with simple blocking code, no reactive complexity.

---

**Q: Explain Sealed Classes. What problem do they solve?**

Sealed classes explicitly define all permitted subclasses — the hierarchy is closed and known at compile time. This enables exhaustive pattern matching: the compiler can warn if you miss a case in a switch. Before sealed: `if (obj instanceof A) ... else if (obj instanceof B)` — no compiler help if you add a new subtype. With sealed: `switch (obj) { case A a -> ...; case B b -> ...; }` — compiler error if you forget a case. Use for: closed type hierarchies (FHIR resource types, notification types, ECR status), discriminated unions, state machines. In EHR: `sealed interface EcrStatus permits Pending, Submitted, Failed, Rejected` — exhaustive switch over status ensures every state is handled.

---

**Q: What is `var` in Java? What are its limitations?**

`var` (Java 10) enables local variable type inference — the compiler infers the type from the right-hand side. Zero runtime overhead — identical bytecode to explicit types. Use when the type is obvious from context (avoids redundant declaration). Don't use when the type is unclear (`var result = service.process()` — reader doesn't know the type). Limitations: only for local variables (not fields, not method parameters, not return types), can't initialize with `null` (no type to infer), can't use with array initializer literals (`var arr = {1, 2, 3}` doesn't compile).

---

**Q: What's new in Java 21 that excites you?**

Virtual threads are the headline feature — they fundamentally change how we write concurrent Java. Writing simple blocking IO code and getting near-async performance is a huge productivity win. No more complex reactive pipelines for most services. Structured Concurrency (preview) makes it safe to orchestrate multiple concurrent tasks — proper cancellation and error propagation. Pattern matching in switch with sealed classes is now fully stable — enables elegant, type-safe handling of closed type hierarchies without the ceremony of visitor patterns. Sequenced Collections adds a clean API for ordered collections. Overall, Java 21 is the most exciting LTS in years.

---

## PART 10 — Modern Java Cheat Sheet

### Features Timeline Quick Reference

```
Java 8  (2014): Lambdas, Streams, Optional, Default methods, CompletableFuture
Java 9  (2017): Modules, Collection factory methods, Stream.takeWhile/dropWhile
Java 10 (2018): var
Java 11 (2018): String strip/isBlank/repeat, HttpClient, Optional.isEmpty() — LTS
Java 12 (2019): Switch expression (preview)
Java 13 (2019): Text blocks (preview)
Java 14 (2020): Switch expression (stable), Records (preview), instanceof PM (preview)
Java 15 (2020): Text blocks (stable), Sealed classes (preview)
Java 16 (2021): Records (stable), instanceof PM (stable)
Java 17 (2021): Sealed classes (stable), Pattern matching (preview) — LTS
Java 18 (2022): UTF-8 default, Simple web server
Java 19 (2022): Virtual threads (preview), Structured Concurrency (incubator)
Java 20 (2023): Virtual threads (preview 2), Record patterns (preview 2)
Java 21 (2023): Virtual threads (stable!), Pattern matching switch (stable),
                Record patterns (stable), Sequenced Collections — LTS ✅ CURRENT LTS
```

### Most Common Modern Java in Spring Boot Code

```java
// 1. Records for DTOs
record PatientResponse(Long id, String mrn, String name) {}

// 2. var in local scope
var patients = patientRepository.findActivePatients();

// 3. Text blocks for SQL/JSON/templates
String sql = """
    SELECT mrn, first_name FROM patients
    WHERE status = :status
    """;

// 4. Collection factories
List<String> icdCodes = List.of("U07.1", "A98.4");
Map<String, Integer> config = Map.of("timeout", 30, "retries", 3);

// 5. Stream.ofNullable + Optional.stream
Stream.ofNullable(patient.getPrimaryDoctor())
    .map(Doctor::getEmail)
    .findFirst()
    .ifPresent(notificationService::send);

// 6. Pattern matching instanceof
if (event instanceof LabResultEvent labEvent && labEvent.positive()) {
    ecrService.submit(labEvent);
}

// 7. Switch expression
String priority = switch (condition) {
    case "EBOLA", "SMALLPOX" -> "CRITICAL";
    case "COVID-19", "MEASLES" -> "HIGH";
    default -> "STANDARD";
};

// 8. Virtual threads (Spring Boot 3.2+)
// application.yml: spring.threads.virtual.enabled: true
// Done — no code changes needed!
```

---

## CROSS-TOPIC CONNECTIONS (M10 → Others)

| M10 Feature | Connects To |
|-------------|-------------|
| Records for DTOs | M04: @Valid on record components, Jackson deserialization |
| Virtual threads | M03: Platform threads, ExecutorService, thread pool sizing |
| Sealed classes + pattern matching | M01: OOP polymorphism, visitor pattern alternative |
| `List.of()` immutable collections | M02: Collections, defensive copy in constructors |
| Text blocks for SQL | M05: JPQL @Query, native SQL queries |
| `var` | M03: Stream pipelines readability |
| `CompletableFuture` improvements | M03: thenCompose, allOf, anyOf |
| HTTP Client | M06: RestTemplate/WebClient replacement for ECR-NOW calls |
| Structured Concurrency | M03: CompletableFuture limitations, ForkJoin |
| Switch expressions | M02: DSA — switch on enum/type instead of if-else chains |
