# M01 — CORE JAVA MASTER
### Everything: Concepts + Terms + Syntax + Memory + EHR/ECR Examples + Workflows

> **Domain**: EHR = Electronic Health Records | ECR-NOW = Electronic Case Reporting
> **Rule**: Read once → close → rebuild from memory

---

## SYSTEM OVERVIEW (How EHR + ECR fits Java)

```
EHR System (Electronic Health Records)
├── Patient → appointments, prescriptions, lab results
├── Doctor → specialties, schedules
├── LabResult → test results (can trigger ECR-NOW)
└── ClinicalNote → diagnosis, SOAP notes

ECR-NOW (Electronic Case Reporting)
├── Watches LabResults + Diagnoses in EHR
├── Detects reportable conditions (COVID, TB, Salmonella...)
├── Auto-generates CaseReport
└── Submits to Public Health Authority (CDC, state)
```

---

## 1. OOP — THE BACKBONE OF EHR DESIGN

### The 4 Pillars with EHR Examples

#### ENCAPSULATION — Protect Patient Data
```java
// Patient.java — hide raw data, control access
public class Patient {
    private Long id;
    private String mrn;                    // Medical Record Number — NEVER public
    private String name;
    private LocalDate dateOfBirth;
    private String ssn;                    // HIPAA protected — private!
    private List<Appointment> appointments = new ArrayList<>();

    // Controlled access
    public String getMrn() { return mrn; }
    public String getName() { return name; }
    public int getAge() {
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }
    // ssn has NO getter — only specific internal methods access it
    public String getMaskedSsn() { return "***-**-" + ssn.substring(7); }

    // Defensive copy — don't expose internal list
    public List<Appointment> getAppointments() {
        return Collections.unmodifiableList(appointments);
    }
    void addAppointment(Appointment apt) { appointments.add(apt); } // package-private
}
```

#### INHERITANCE — Shared Medical Person Behavior
```java
// Base: any person in the system
public abstract class MedicalPerson {
    protected Long id;
    protected String name;
    protected String email;
    protected LocalDateTime createdAt;

    public abstract String getRole();      // Every subclass MUST implement
    public String getDisplayName() { return getRole() + ": " + name; } // shared

    @Override
    public String toString() {
        return getClass().getSimpleName() + "{id=" + id + ", name='" + name + "'}";
    }
}

public class Patient extends MedicalPerson {
    private String mrn;
    private String insuranceId;

    @Override public String getRole() { return "Patient"; }
    public String getMrn() { return mrn; }
}

public class Doctor extends MedicalPerson {
    private String licenseNumber;
    private Specialty specialty;
    private String npiNumber;               // National Provider Identifier

    @Override public String getRole() { return "Doctor"; }
    public boolean canPrescribe() { return specialty != Specialty.RADIOLOGIST; }
}

public class Nurse extends MedicalPerson {
    private String licenseNumber;
    private String unit;

    @Override public String getRole() { return "Nurse"; }
}
```

#### POLYMORPHISM — One Method, Many Behaviors
```java
// Notification interface — different delivery for different people
public interface Notifiable {
    void sendNotification(String message);
    default void sendUrgentAlert(String message) {  // default method
        sendNotification("🚨 URGENT: " + message);
    }
}

// Runtime polymorphism — different behavior based on actual type
public class PatientNotifier implements Notifiable {
    @Override public void sendNotification(String msg) {
        emailService.sendToPatient(msg);  // email to patient
    }
}

public class DoctorNotifier implements Notifiable {
    @Override public void sendNotification(String msg) {
        pagerService.page(msg);           // page the doctor
        emailService.sendToDoctor(msg);   // also email
    }
}

public class PublicHealthNotifier implements Notifiable {
    @Override public void sendNotification(String msg) {
        fhirClient.sendToHealthAuthority(msg); // FHIR message to CDC
    }
}

// Usage — polymorphic call
List<Notifiable> notifiers = List.of(new PatientNotifier(), new DoctorNotifier());
notifiers.forEach(n -> n.sendNotification("Lab result ready"));
// Each calls its OWN implementation — decided at RUNTIME
```

#### ABSTRACTION — Hide HOW, show WHAT
```java
// Abstract: what every reporter must do — not how
public abstract class CaseReporter {
    // Template Method Pattern — defines the algorithm skeleton
    public final CaseReport report(LabResult labResult) {
        validateResult(labResult);                    // step 1
        CaseReport report = buildReport(labResult);   // step 2 — abstract
        enrichWithPatientData(report);                // step 3
        CaseReport submitted = submitReport(report);  // step 4 — abstract
        notifyDoctor(submitted);                      // step 5
        return submitted;
    }

    protected abstract CaseReport buildReport(LabResult result);
    protected abstract CaseReport submitReport(CaseReport report);

    private void validateResult(LabResult r) {
        if (r == null) throw new IllegalArgumentException("LabResult required");
    }
    private void enrichWithPatientData(CaseReport r) { /* add demographics */ }
    private void notifyDoctor(CaseReport r) { /* notify ordering physician */ }
}

// ECR-NOW implementation — knows HOW to report COVID
public class CovidCaseReporter extends CaseReporter {
    @Override
    protected CaseReport buildReport(LabResult result) {
        return CaseReport.builder()
            .patientId(result.getPatientId())
            .conditionCode("U07.1")        // ICD-10 for COVID-19
            .reportType("INITIAL")
            .build();
    }

    @Override
    protected CaseReport submitReport(CaseReport report) {
        return fhirGateway.submitToStateDepartment(report); // ECR-NOW FHIR submission
    }
}
```

---

### OOP Design: IS-A vs HAS-A in EHR

```
IS-A (Inheritance):
  Patient IS-A MedicalPerson
  Doctor IS-A MedicalPerson
  CovidCaseReporter IS-A CaseReporter

HAS-A (Composition — preferred):
  Patient HAS-A List<Appointment>      (composition — owned)
  Patient HAS-A List<Prescription>     (composition — owned)
  Appointment HAS-A Patient            (aggregation — shared reference)
  Appointment HAS-A Doctor             (aggregation — shared reference)
  CaseReport HAS-A LabResult           (composition)
  ECRService HAS-A FhirClient          (composition)
```

```java
// Composition in ECR-NOW Service
@Service
public class EcrNowService {
    // HAS-A relationships — injected via constructor (DI)
    private final LabResultRepository labResultRepo;
    private final CaseReportRepository caseReportRepo;
    private final FhirSubmissionClient fhirClient;
    private final PublicHealthNotifier notifier;

    // Constructor injection — explicit dependencies
    public EcrNowService(LabResultRepository lr, CaseReportRepository cr,
                          FhirSubmissionClient fc, PublicHealthNotifier n) {
        this.labResultRepo = lr;
        this.caseReportRepo = cr;
        this.fhirClient = fc;
        this.notifier = n;
    }
}
```

---

## 2. JAVA MEMORY MODEL — HOW EHR DATA LIVES IN MEMORY

### Memory Map During a Patient Registration

```
JVM Memory at Runtime
═══════════════════════════════════════════════════════

HEAP (Shared across all threads)
┌─────────────────────────────────────────────────────┐
│ Young Generation                                    │
│  Eden Space:                                        │
│  ┌─────────────────────────────────────────────┐   │
│  │ new Patient("John Doe", "MRN001")  ←creates  │   │
│  │ new Appointment(patient, doctor, time)        │   │
│  │ new ArrayList<>() (appointments list)         │   │
│  └─────────────────────────────────────────────┘   │
│  Survivor S0/S1: objects that survived 1+ GC        │
│                                                     │
│ Old Generation:                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ PatientRepository (singleton bean)           │   │
│  │ EhrApplication context (long-lived)          │   │
│  │ Static caches (ICD code lookup tables)       │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

METASPACE (Outside Heap — class data)
┌─────────────────────────────────────────────────────┐
│ class Patient { ... }      ← class metadata         │
│ class Doctor { ... }                                │
│ static final String SYSTEM = "EHR-v2"               │
│ static Map<String, IcdCode> ICD_CODES = ...         │
└─────────────────────────────────────────────────────┘

STACK (Per-thread — method frames)
┌─────────────────────────────────────────────────────┐
│ Thread: HTTP-request-thread-1                       │
│ ┌─────────────────────────────────────────────┐    │
│ │ PatientController.registerPatient() frame   │    │
│ │   dto (local var) → ref to PatientDto@Heap  │    │
│ │   ┌─────────────────────────────────────┐   │    │
│ │   │ PatientService.save() frame         │   │    │
│ │   │   patient (local var) → Patient@Heap│   │    │
│ │   │   ┌─────────────────────────────┐   │   │    │
│ │   │   │ PatientRepo.save() frame    │   │   │    │
│ │   │   │   sql, params (primitives)  │   │   │    │
│ │   │   └─────────────────────────────┘   │   │    │
│ │   └─────────────────────────────────────┘   │    │
│ └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘

KEY: References (arrows) live on Stack. Objects live on Heap.
```

### Memory Story: "Registering Patient John Doe"
```
1. HTTP request arrives → new thread from pool
2. JVM creates Stack frame for PatientController.registerPatient()
3. 'dto' local variable on Stack → points to PatientDto object in Heap (Eden)
4. PatientService.save(dto) called → new Stack frame
5. 'patient' local var on Stack → points to new Patient object in Heap (Eden)
6. repo.save(patient) → SQL INSERT → returns persisted patient (with ID)
7. Methods return → Stack frames POPPED (gone instantly)
8. Patient object in Heap stays alive as long as someone holds a reference
9. When nobody references it → GC collects it (Minor GC from Eden)
10. Spring's PatientRepository singleton stays in Old Gen indefinitely
```

### Primitives vs Objects in EHR
```java
public class Appointment {
    // PRIMITIVES — stored directly on stack in method frames, or inline in object on heap
    private long id;                      // 8 bytes, inline in object
    private int durationMinutes;           // 4 bytes, inline in object
    private boolean confirmed;             // 1 byte, inline in object

    // OBJECTS — reference stored in object, actual object elsewhere on heap
    private Patient patient;              // 8-byte reference → Patient object
    private Doctor doctor;                // 8-byte reference → Doctor object
    private LocalDateTime scheduledAt;    // 8-byte reference → LocalDateTime object
    private AppointmentStatus status;     // 8-byte reference → enum constant (Method Area)
}

// Size of Appointment object on heap ≈ 16 bytes header + fields
// The Patient and Doctor themselves live separately on heap — shared references
```

---

## 3. GENERICS — TYPE-SAFE EHR COLLECTIONS

```java
// Generic Result wrapper — used across EHR/ECR APIs
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;
    private List<String> errors;

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, "Success", null);
    }
    public static <T> ApiResponse<T> error(String msg) {
        return new ApiResponse<>(false, null, msg, null);
    }
}

// Usage
ApiResponse<Patient> response = ApiResponse.ok(patient);
ApiResponse<List<CaseReport>> reports = ApiResponse.ok(caseReports);
ApiResponse<Void> deleted = ApiResponse.ok(null);

// Generic Repository base — all repos in EHR extend this
public interface BaseRepository<T, ID> {
    T save(T entity);
    Optional<T> findById(ID id);
    List<T> findAll();
    void deleteById(ID id);
    long count();
}

public interface PatientRepository extends BaseRepository<Patient, Long> {
    Optional<Patient> findByMrn(String mrn);
    List<Patient> findByLastName(String lastName);
}

// Generic Validator — reusable across entities
public interface Validator<T> {
    ValidationResult validate(T entity);
}

public class PatientValidator implements Validator<Patient> {
    @Override
    public ValidationResult validate(Patient patient) {
        List<String> errors = new ArrayList<>();
        if (patient.getName() == null) errors.add("Name required");
        if (patient.getDateOfBirth() == null) errors.add("DOB required");
        if (patient.getDateOfBirth().isAfter(LocalDate.now())) errors.add("DOB in future");
        return new ValidationResult(errors.isEmpty(), errors);
    }
}

// Bounded Wildcards — ECR processes any reportable result
public class EcrProcessor {
    // Upper bound: accepts LabResult or any subclass
    public void processResults(List<? extends LabResult> results) {
        results.forEach(this::checkForReportableCondition);
    }

    // Lower bound: accepts Number or superclass — can add Integer/Long
    public void addToQueue(List<? super LabResult> queue, LabResult result) {
        queue.add(result);
    }
}
```

**Memory**: Generics use **type erasure** — at runtime, `List<Patient>` becomes `List`. Type info only at compile time. No runtime overhead.

---

## 4. EXCEPTION HANDLING — EHR ERROR STRATEGY

### Exception Hierarchy for EHR
```
RuntimeException (unchecked)
├── EhrBaseException
│   ├── PatientNotFoundException       → 404
│   ├── DuplicateMrnException          → 409
│   ├── AppointmentConflictException   → 409
│   └── InsufficientPermissionException → 403
└── EcrBaseException
    ├── ReportSubmissionException       → 502
    ├── InvalidLabResultException       → 400
    └── PublicHealthApiException        → 502
```

```java
// Base exceptions
public class EhrBaseException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus httpStatus;

    public EhrBaseException(String message, String errorCode, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = status;
    }
    public EhrBaseException(String message, String errorCode, HttpStatus status, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.httpStatus = status;
    }
    // getters
}

public class PatientNotFoundException extends EhrBaseException {
    public PatientNotFoundException(Long id) {
        super("Patient not found with id: " + id, "PATIENT_NOT_FOUND", HttpStatus.NOT_FOUND);
    }
    public PatientNotFoundException(String mrn) {
        super("Patient not found with MRN: " + mrn, "PATIENT_NOT_FOUND", HttpStatus.NOT_FOUND);
    }
}

public class ReportSubmissionException extends EhrBaseException {
    public ReportSubmissionException(String reportId, Throwable cause) {
        super("Failed to submit ECR report: " + reportId, "ECR_SUBMIT_FAILED",
              HttpStatus.BAD_GATEWAY, cause);
    }
}

// Service layer — exception flow
@Service
public class PatientService {

    public Patient findById(Long id) {
        return patientRepo.findById(id)
            .orElseThrow(() -> new PatientNotFoundException(id)); // thrown, propagates up
    }

    public Patient registerPatient(PatientDto dto) {
        // Guard clauses — fail fast
        if (patientRepo.existsByMrn(dto.getMrn())) {
            throw new DuplicateMrnException(dto.getMrn());
        }

        try {
            Patient patient = mapper.toEntity(dto);
            Patient saved = patientRepo.save(patient);
            auditLog.record("PATIENT_CREATED", saved.getId());
            return saved;
        } catch (DataIntegrityViolationException e) {
            // Convert infrastructure exception to domain exception
            throw new DuplicateMrnException(dto.getMrn(), e);
        }
    }
}

// ECR — try-with-resources for FHIR HTTP connection
@Service
public class FhirSubmissionService {

    public CaseReport submit(CaseReport report) {
        String reportId = report.getReportId();
        try {
            FhirResponse response = fhirClient.post(report);   // may throw IOException
            return report.toBuilder().status(SUBMITTED).fhirId(response.getId()).build();
        } catch (FhirValidationException e) {
            log.error("FHIR validation failed for report {}", reportId, e);
            throw new ReportSubmissionException(reportId, e);
        } catch (HttpTimeoutException e) {
            log.warn("Timeout submitting report {}. Will retry.", reportId, e);
            throw new ReportSubmissionException(reportId, e);
        } finally {
            // Always clean up — log attempt regardless of success/failure
            metricsService.recordSubmissionAttempt(reportId);
        }
    }
}

// Global exception handler — converts to HTTP responses
@RestControllerAdvice
public class EhrGlobalExceptionHandler {

    @ExceptionHandler(PatientNotFoundException.class)
    ResponseEntity<ErrorResponse> handleNotFound(PatientNotFoundException ex) {
        return ResponseEntity.status(ex.getHttpStatus())
            .body(new ErrorResponse(ex.getErrorCode(), ex.getMessage()));
    }

    @ExceptionHandler(EhrBaseException.class)
    ResponseEntity<ErrorResponse> handleEhrException(EhrBaseException ex) {
        log.error("EHR error: {} - {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(ex.getHttpStatus())
            .body(new ErrorResponse(ex.getErrorCode(), ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.internalServerError()
            .body(new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}
```

**Stack Trace Reading**:
```
PatientNotFoundException: Patient not found with id: 99
    at PatientService.findById(PatientService.java:45)      ← WHERE it was thrown
    at AppointmentService.schedule(AppointmentService.java:78) ← WHO called it
    at AppointmentController.create(AppointmentController.java:52) ← entry point
    at sun.reflect.NativeMethodAccessorImpl.invoke0(...)    ← Spring internals (ignore)
```
> Read from TOP — that's where the exception actually occurred.

---

## 5. STRING HANDLING — HIPAA-SAFE PATIENT DATA

```java
@Service
public class PatientStringUtils {

    // String is immutable — each operation creates a NEW string
    public String formatPatientName(String firstName, String lastName) {
        // Bad: String concat in loop — creates N objects
        // String result = "";
        // for (String part : parts) result += part; // DON'T

        // Good: StringBuilder for dynamic building
        return new StringBuilder()
            .append(lastName.trim().toUpperCase())
            .append(", ")
            .append(firstName.trim())
            .toString();
        // "SMITH, John"
    }

    // String Pool — interview classic
    public void stringPoolDemo() {
        String mrn1 = "MRN001";        // String Pool
        String mrn2 = "MRN001";        // Same Pool object
        String mrn3 = new String("MRN001"); // New Heap object

        System.out.println(mrn1 == mrn2);       // true — same pool ref
        System.out.println(mrn1 == mrn3);       // false — different object
        System.out.println(mrn1.equals(mrn3));  // true — same content
        // RULE: ALWAYS use .equals() for String comparison
    }

    // Mask sensitive data for logging (HIPAA compliance)
    public String maskSsn(String ssn) {
        if (ssn == null || ssn.length() < 4) return "***";
        return "***-**-" + ssn.substring(ssn.length() - 4);
    }

    // Build FHIR search URL with query params
    public String buildFhirUrl(String base, Map<String, String> params) {
        StringBuilder sb = new StringBuilder(base).append("?");
        params.forEach((k, v) ->
            sb.append(k).append("=").append(encode(v)).append("&")
        );
        return sb.deleteCharAt(sb.length() - 1).toString(); // remove trailing &
    }

    // Parse MRN format: "MRN-2024-000123"
    public MrnComponents parseMrn(String mrn) {
        if (!mrn.matches("MRN-\\d{4}-\\d{6}")) {
            throw new InvalidMrnException("Invalid MRN format: " + mrn);
        }
        String[] parts = mrn.split("-");
        return new MrnComponents(parts[1], parts[2]);
    }

    // Commonly tested String methods
    public void keyMethods() {
        String diagnosis = "  Type 2 Diabetes Mellitus  ";
        diagnosis.trim()              // "Type 2 Diabetes Mellitus"
        diagnosis.strip()             // Java 11 — Unicode aware trim
        diagnosis.toLowerCase()       // case-insensitive search
        diagnosis.contains("Diabetes") // true
        diagnosis.startsWith("Type")  // true (after trim)
        diagnosis.replace("Type 2", "T2") // "T2 Diabetes Mellitus"
        diagnosis.split(" ")          // ["Type", "2", "Diabetes", "Mellitus"]
        String.join(", ", "COVID", "TB", "SARS") // "COVID, TB, SARS"
        String.format("Patient %s (MRN: %s)", name, mrn)
        "MRN001".compareTo("MRN002")  // negative (MRN001 < MRN002)
        "covid-19".equalsIgnoreCase("COVID-19") // true
    }
}
```

**Memory**: `String s = "MRN001"` → stored in **String Pool** (Method Area). `new String("MRN001")` → **Heap**. String object has: char[] value, int hash, int offset. Since Java 9 — `byte[]` + encoding flag.

---

## 6. ACCESS MODIFIERS — HIPAA SECURITY IN CODE

```java
public class Patient {
    // private — HIPAA: only this class sees raw SSN
    private String ssn;

    // package-private — only EHR internal package
    String internalNotes;

    // protected — Doctor subclasses can read billing class
    protected String insuranceId;

    // public — safe to expose
    public String getMrn() { return mrn; }

    // Final — MRN never changes after creation
    private final String mrn;

    // Static — shared configuration for all patients
    private static final String MRN_PREFIX = "MRN";
    private static int totalPatients = 0; // shared counter

    // Static method — utility, no instance needed
    public static boolean isValidMrn(String mrn) {
        return mrn != null && mrn.matches("MRN-\\d{4}-\\d{6}");
    }
}
```

---

## 7. IMPORTANT METHODS REFERENCE

```java
// Object class methods — override in domain objects
patient.equals(other)      // compare by mrn, not memory address
patient.hashCode()         // must match equals() — use Objects.hash(mrn)
patient.toString()         // for logging: "Patient{mrn='MRN001', name='John'}"
patient.clone()            // rarely used — prefer copy constructors

// Comparable — natural sort order for patients
public class Patient implements Comparable<Patient> {
    @Override
    public int compareTo(Patient other) {
        return this.mrn.compareTo(other.mrn); // sort by MRN
    }
}

// Key static utility methods
Objects.requireNonNull(patient, "Patient must not be null");
Objects.hash(mrn, dateOfBirth);
Objects.equals(a, b);      // null-safe equals

Collections.sort(patients);
Collections.sort(patients, Comparator.comparing(Patient::getLastName)
    .thenComparing(Patient::getFirstName));
Collections.unmodifiableList(appointments);
Collections.synchronizedList(sharedList);

Arrays.asList("COVID", "TB", "FLU");
Arrays.sort(arr);
Arrays.copyOf(arr, newLength);

// String utility
String.format("Patient %s scheduled for %s", patient.getName(), date);
String.valueOf(patientId);
Integer.parseInt("42");
Long.parseLong("123456789");
```

---

## 8. WORKFLOW: PATIENT REGISTRATION IN EHR

```
HTTP POST /api/patients
     │
     ▼
PatientController.registerPatient(@RequestBody @Valid PatientDto dto)
     │  ← Stack frame created, dto reference on stack, PatientDto object on Heap
     │
     ▼
PatientValidator.validate(dto)     ← throws InvalidPatientException if invalid
     │
     ▼
PatientService.registerPatient(dto)
     │  ← Stack frame, local Patient patient = new Patient() → Heap (Eden)
     │
     ├─→ patientRepo.existsByMrn(dto.getMrn())   → SELECT query
     │      └─ if exists: throw DuplicateMrnException  → propagates to @ControllerAdvice
     │
     ├─→ Patient entity = mapper.toEntity(dto)    → new Patient object in Heap
     │
     ├─→ patientRepo.save(entity)                 → INSERT SQL
     │      └─ returns managed entity with generated ID
     │
     ├─→ auditService.record(PATIENT_CREATED)     → async (fire-and-forget)
     │
     └─→ return patient  → Stack frame POPPED, patient ref returned
          │
          ▼
PatientController returns ResponseEntity.created(location).body(patient)
     │  ← HTTP 201 response with Location header
     ▼
HTTP Response to client
```

---

## 9. JVM EXECUTION — WHAT HAPPENS WHEN EHR STARTS

```
1. java -jar ehr-service.jar

2. JVM starts → Bootstrap ClassLoader loads rt.jar
3. App ClassLoader loads ehr-service.jar
4. Spring's ClassPathScanningCandidateComponentProvider scans @Component classes
5. IOC Container starts instantiating beans (in dependency order):
   - PatientRepository (no deps) → created first
   - PatientService (needs PatientRepository) → created second
   - PatientController (needs PatientService) → created third
6. @PostConstruct methods run (e.g., load ICD code cache)
7. Embedded Tomcat starts on port 8080
8. JVM is now in steady state — waiting for requests

Memory after startup:
  Old Gen: all Spring singleton beans (long-lived)
  Metaspace: all loaded class metadata
  Eden: empty (ready for request objects)
  Stack: main thread waiting
```

---

## 🔗 CONNECTIONS TO OTHER TOPICS

```
M01 Core Java
│
├─→ M02 Collections    — Patient lists, appointment maps, priority queues for scheduling
├─→ M03 Concurrency    — Thread-safe patient access, async ECR submission
├─→ M04 Spring         — @Component, @Service for EHR beans; DI for PatientService
├─→ M05 JPA/Hibernate  — @Entity Patient, @OneToMany appointments
├─→ M06 Microservices  — EHR and ECR-NOW as separate services communicating via events
└─→ M07 Testing        — Unit testing PatientService with Mockito

Terms connected here:
  T01 (OOP, encapsulation, polymorphism)
  T02 (Heap, Stack, Eden, Old Gen, GC)
  T03 (Collections used in Patient/Appointment entities)
```

---

## 🔁 REBUILD CHALLENGES

1. Draw the EHR Patient class with proper encapsulation — which fields are private? Why?
2. Explain polymorphism using the `Notifiable` interface — what happens at runtime?
3. Draw JVM memory at the moment `patientService.registerPatient(dto)` is executing.
4. What is the String Pool? Show code: when are two Strings `==` vs need `.equals()`?
5. Write a generic `ApiResponse<T>` class from memory.
6. Create the EHR exception hierarchy — which extend RuntimeException? Why?
7. Explain what happens to memory when the registerPatient() method returns.
8. What is type erasure? How does it affect `List<Patient>` at runtime?
9. Why is `StringBuilder` used instead of `+` for building FHIR URLs?
10. What is the difference between `static` and `instance` variables? Give EHR examples.
