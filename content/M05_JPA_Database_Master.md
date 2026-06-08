# M05 — JPA, HIBERNATE & DATABASE MASTER
### Everything: ORM + Entities + Relationships + Queries + Transactions + SQL + Memory + EHR/ECR Examples

---

## DOMAIN CONTEXT
```
EHR Database Schema:
  patients         → id, mrn, name, dob, email, insurance_id, status
  doctors          → id, name, specialty, license_no, npi_number
  appointments     → id, patient_id(FK), doctor_id(FK), scheduled_at, status, duration_min
  prescriptions    → id, patient_id(FK), doctor_id(FK), medication, dosage, prescribed_date
  lab_results      → id, patient_id(FK), test_name, icd_code, value, unit, result_date, is_positive
  case_reports     → id, patient_id(FK), lab_result_id(FK), condition_code, status, fhir_id
  audit_logs       → id, user_id, action, entity_type, entity_id, timestamp
```

---

## 1. JPA ENTITY MAPPING — EHR DOMAIN

### Patient Entity (Comprehensive)
```java
@Entity
@Table(name = "patients", indexes = {
    @Index(name = "idx_patient_mrn", columnList = "mrn", unique = true),
    @Index(name = "idx_patient_email", columnList = "email"),
    @Index(name = "idx_patient_last_name", columnList = "last_name")
})
@EntityListeners(AuditingEntityListener.class) // Spring Data Auditing
@NoArgsConstructor
@Getter
@Setter
@ToString(exclude = {"appointments", "prescriptions", "labResults"}) // avoid lazy loading in toString
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "patient_seq")
    @SequenceGenerator(name = "patient_seq", sequenceName = "patient_id_seq", allocationSize = 50)
    private Long id;

    @Column(name = "mrn", nullable = false, unique = true, length = 20)
    private String mrn;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "ssn", length = 11) // stored encrypted in real system
    private String ssn;

    @Enumerated(EnumType.STRING) // "ACTIVE" not 0 in DB
    @Column(nullable = false)
    private PatientStatus status = PatientStatus.ACTIVE;

    @Embedded // Address columns added to this table (no join needed)
    private Address address;

    @Column(name = "insurance_id", length = 30)
    private String insuranceId;

    // Optimistic locking — prevents lost updates
    @Version
    private int version;

    // Spring Data Auditing
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    // Relationships
    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL,
               fetch = FetchType.LAZY, orphanRemoval = true)
    @OrderBy("scheduledAt DESC")
    private List<Appointment> appointments = new ArrayList<>();

    @OneToMany(mappedBy = "patient", cascade = CascadeType.PERSIST,
               fetch = FetchType.LAZY)
    private List<Prescription> prescriptions = new ArrayList<>();

    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY)
    private List<LabResult> labResults = new ArrayList<>();

    // Helper methods — maintain bidirectional consistency
    public void addAppointment(Appointment appointment) {
        appointments.add(appointment);
        appointment.setPatient(this);
    }
    public void removeAppointment(Appointment appointment) {
        appointments.remove(appointment);
        appointment.setPatient(null);
    }
}

@Embeddable
public class Address {
    @Column(name = "street_address")
    private String street;
    @Column(name = "city", length = 100)
    private String city;
    @Column(name = "state", length = 2)
    private String state;
    @Column(name = "zip_code", length = 10)
    private String zipCode;
    @Column(name = "country", length = 2)
    private String country;
}
```

### Appointment Entity with All Relationships
```java
@Entity
@Table(name = "appointments", indexes = {
    @Index(name = "idx_apt_patient", columnList = "patient_id"),
    @Index(name = "idx_apt_doctor", columnList = "doctor_id"),
    @Index(name = "idx_apt_scheduled", columnList = "scheduled_at"),
    @Index(name = "idx_apt_status", columnList = "status")
})
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ManyToOne — FK side, OWNER of the relationship
    @ManyToOne(fetch = FetchType.LAZY) // LAZY: don't load Patient unless accessed
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 30;

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "billed_amount", precision = 10, scale = 2)
    private BigDecimal billedAmount;

    // One appointment can trigger one case report
    @OneToOne(mappedBy = "appointment", fetch = FetchType.LAZY,
              cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private CaseReport caseReport;

    @Version
    private int version;

    @CreatedDate @Column(updatable = false) private LocalDateTime createdAt;
    @LastModifiedDate private LocalDateTime updatedAt;
}
```

### LabResult Entity (triggers ECR-NOW)
```java
@Entity
@Table(name = "lab_results")
public class LabResult {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ordering_doctor_id")
    private Doctor orderingDoctor;

    @Column(name = "test_name", nullable = false)
    private String testName;

    @Column(name = "icd_code", length = 10)
    private String icdCode;           // e.g., "U07.1" for COVID

    @Column(name = "result_value")
    private Double value;

    @Column(name = "unit", length = 20)
    private String unit;

    @Column(name = "is_positive")
    private boolean positive;

    @Enumerated(EnumType.STRING)
    private LabResultStatus status;   // PENDING, RESULTED, AMENDED, CANCELLED

    @Column(name = "result_date")
    private LocalDateTime resultDate;

    // One lab result → potentially one ECR case report
    @OneToOne(mappedBy = "labResult", fetch = FetchType.LAZY,
              cascade = CascadeType.ALL)
    private CaseReport caseReport;
}
```

---

## 2. JPA RELATIONSHIPS — COMPLETE PATTERNS

### Relationship Decision Guide
```
OneToOne   → Patient ↔ PatientProfile (exactly one each)
ManyToOne  → Appointment → Patient (many appointments, one patient)
OneToMany  → Patient → List<Appointment> (one patient, many appointments)
ManyToMany → Patient ↔ Condition (patient has many conditions, condition affects many patients)

OWNERSHIP RULES:
  The side with @JoinColumn = OWNER (controls FK in DB)
  The side with mappedBy = INVERSE (doesn't control FK)
  Changes to inverse side are IGNORED by Hibernate!
  Always update the OWNER side to persist changes.
```

```java
// ManyToMany — Patient and Condition
@Entity
public class Patient {
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "patient_conditions",          // junction table name
        joinColumns = @JoinColumn(name = "patient_id"),
        inverseJoinColumns = @JoinColumn(name = "condition_id")
    )
    private Set<Condition> conditions = new HashSet<>();

    // Use Set not List for ManyToMany (List causes duplicate rows with Hibernate!)
}

@Entity
public class Condition {
    @ManyToMany(mappedBy = "conditions", fetch = FetchType.LAZY)
    private Set<Patient> patients = new HashSet<>();
    // This side does NOT control the junction table
}

// ManyToMany with extra columns → use @Entity for junction table
@Entity
@Table(name = "patient_conditions")
public class PatientCondition {
    @Id @GeneratedValue
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "condition_id")
    private Condition condition;

    // Extra fields on the relationship
    @Column(name = "diagnosed_date")
    private LocalDate diagnosedDate;

    @Column(name = "severity")
    private String severity;
}
```

---

## 3. SPRING DATA JPA REPOSITORIES

```java
// PatientRepository — full example
@Repository
public interface PatientRepository extends JpaRepository<Patient, Long>,
                                            JpaSpecificationExecutor<Patient> {

    // === DERIVED QUERIES (Spring generates SQL from method name) ===
    Optional<Patient> findByMrn(String mrn);
    Optional<Patient> findByEmail(String email);
    List<Patient> findByLastNameIgnoreCase(String lastName);
    List<Patient> findByStatus(PatientStatus status);
    List<Patient> findByStatusAndDateOfBirthBefore(PatientStatus status, LocalDate date);
    boolean existsByMrn(String mrn);
    boolean existsByEmail(String email);
    long countByStatus(PatientStatus status);
    void deleteByStatus(PatientStatus status);
    List<Patient> findTop10ByOrderByCreatedAtDesc();
    List<Patient> findByLastNameContainingIgnoreCase(String partialName);
    List<Patient> findByDateOfBirthBetween(LocalDate from, LocalDate to);

    // === JPQL QUERIES (object-oriented SQL) ===
    @Query("SELECT p FROM Patient p WHERE p.status = :status ORDER BY p.lastName")
    List<Patient> findActivePatients(@Param("status") PatientStatus status);

    @Query("SELECT p FROM Patient p LEFT JOIN FETCH p.appointments a " +
           "WHERE p.id = :id AND a.status = 'SCHEDULED'")
    Optional<Patient> findByIdWithScheduledAppointments(@Param("id") Long id);

    @Query("SELECT p FROM Patient p WHERE LOWER(p.firstName) LIKE LOWER(CONCAT('%', :name, '%')) " +
           "OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Patient> searchByName(@Param("name") String name, Pageable pageable);

    // Count/aggregate
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.patient.id = :patientId " +
           "AND a.status = 'NO_SHOW'")
    long countNoShows(@Param("patientId") Long patientId);

    @Query("SELECT p.status, COUNT(p) FROM Patient p GROUP BY p.status")
    List<Object[]> countByStatusRaw();

    // === NATIVE SQL (use sparingly) ===
    @Query(value = "SELECT * FROM patients WHERE status = 'ACTIVE' " +
                   "AND created_at > NOW() - INTERVAL '30 days'",
           nativeQuery = true)
    List<Patient> findRecentPatients();

    // === MODIFYING QUERIES ===
    @Modifying
    @Transactional
    @Query("UPDATE Patient p SET p.status = :newStatus WHERE p.id IN :ids")
    int bulkUpdateStatus(@Param("ids") List<Long> ids, @Param("newStatus") PatientStatus newStatus);

    @Modifying
    @Transactional
    @Query("DELETE FROM Patient p WHERE p.status = 'INACTIVE' " +
           "AND p.updatedAt < :cutoffDate")
    int purgeInactivePatients(@Param("cutoffDate") LocalDateTime cutoffDate);

    // === PAGINATION ===
    Page<Patient> findByStatus(PatientStatus status, Pageable pageable);
    Slice<Patient> findByLastName(String lastName, Pageable pageable); // no count query

    // === PROJECTIONS — only load needed fields ===
    @Query("SELECT p.id AS id, p.mrn AS mrn, p.firstName AS firstName, " +
           "p.lastName AS lastName FROM Patient p WHERE p.status = 'ACTIVE'")
    List<PatientSummaryProjection> findActivePatientSummaries();
}

// Projection interface — Spring generates implementation
public interface PatientSummaryProjection {
    Long getId();
    String getMrn();
    String getFirstName();
    String getLastName();
    default String getFullName() { return getFirstName() + " " + getLastName(); }
}
```

### Dynamic Queries with Specifications
```java
// Specification — type-safe dynamic queries
public class PatientSpecifications {

    public static Specification<Patient> hasStatus(PatientStatus status) {
        return (root, query, cb) ->
            status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Patient> hasInsurance() {
        return (root, query, cb) -> cb.isNotNull(root.get("insuranceId"));
    }

    public static Specification<Patient> nameContains(String name) {
        return (root, query, cb) -> {
            if (name == null) return null;
            String pattern = "%" + name.toLowerCase() + "%";
            return cb.or(
                cb.like(cb.lower(root.get("firstName")), pattern),
                cb.like(cb.lower(root.get("lastName")), pattern)
            );
        };
    }

    public static Specification<Patient> bornBetween(LocalDate from, LocalDate to) {
        return (root, query, cb) ->
            cb.between(root.get("dateOfBirth"), from, to);
    }
}

// Usage in service
@Service
public class PatientSearchService {
    public Page<Patient> search(PatientSearchCriteria criteria, Pageable pageable) {
        Specification<Patient> spec = Specification
            .where(PatientSpecifications.hasStatus(criteria.getStatus()))
            .and(PatientSpecifications.nameContains(criteria.getName()))
            .and(criteria.isInsuredOnly() ? PatientSpecifications.hasInsurance() : null)
            .and(criteria.getFromDate() != null ?
                PatientSpecifications.bornBetween(criteria.getFromDate(), criteria.getToDate()) : null);

        return patientRepo.findAll(spec, pageable);
    }
}
```

---

## 4. N+1 PROBLEM — THE MOST ASKED JPA QUESTION

```java
// === THE N+1 PROBLEM ===
// Loading 100 patients, then accessing each patient's appointments
List<Patient> patients = patientRepo.findAll();          // 1 query: SELECT * FROM patients
for (Patient p : patients) {
    List<Appointment> apts = p.getAppointments();         // N queries: SELECT * FROM appointments WHERE patient_id = ?
    // 100 patients = 101 queries TOTAL (1 + 100) ← N+1 PROBLEM
}

// === SOLUTION 1: JOIN FETCH (JPQL) ===
@Query("SELECT DISTINCT p FROM Patient p " +
       "LEFT JOIN FETCH p.appointments a " +
       "LEFT JOIN FETCH p.prescriptions " +
       "WHERE p.status = 'ACTIVE'")
List<Patient> findActiveWithDetails();
// Result: 1 query with JOIN — all data in one shot

// === SOLUTION 2: EntityGraph ===
@EntityGraph(attributePaths = {"appointments", "appointments.doctor", "prescriptions"})
List<Patient> findByStatus(PatientStatus status);
// Spring Data generates the JOIN FETCH automatically

// Named entity graph on entity
@Entity
@NamedEntityGraph(name = "Patient.withAppointments",
    attributeNodes = @NamedAttributeNode(value = "appointments",
        subgraph = "appointmentDetails"),
    subgraphs = @NamedSubgraph(name = "appointmentDetails",
        attributeNodes = @NamedAttributeNode("doctor"))
)
public class Patient { ... }

@EntityGraph(value = "Patient.withAppointments")
Optional<Patient> findByMrn(String mrn);

// === SOLUTION 3: @BatchSize (lazy + batch load) ===
@Entity
public class Patient {
    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY)
    @BatchSize(size = 25) // load appointments for 25 patients in one query
    private List<Appointment> appointments;
}
// Instead of N queries: ceil(N/25) queries

// === DETECTION: Enable these to see queries ===
// spring.jpa.show-sql=true
// spring.jpa.properties.hibernate.format_sql=true
// logging.level.org.hibernate.type.descriptor.sql=TRACE (shows params)
// logging.level.org.hibernate.stat=DEBUG (enable statistics)
// spring.jpa.properties.hibernate.generate_statistics=true
```

---

## 5. TRANSACTIONS — THE MOST IMPORTANT JPA TOPIC

```java
@Service
public class AppointmentService {

    // === BASIC @Transactional ===
    @Transactional // starts a transaction, commits on return, rolls back on RuntimeException
    public Appointment scheduleAppointment(Long patientId, Long doctorId, LocalDateTime when) {
        Patient patient = patientRepo.findById(patientId)
            .orElseThrow(() -> new PatientNotFoundException(patientId));  // throws → rollback!
        Doctor doctor = doctorRepo.findById(doctorId)
            .orElseThrow(() -> new DoctorNotFoundException(doctorId));

        // Check availability
        if (appointmentRepo.existsConflict(doctorId, when)) {
            throw new AppointmentConflictException(doctorId, when); // throws → rollback!
        }

        Appointment apt = new Appointment(patient, doctor, when);
        Appointment saved = appointmentRepo.save(apt); // INSERT

        // Dirty checking: modifying managed entity auto-generates UPDATE on commit
        patient.setLastVisitDate(when.toLocalDate()); // no explicit save() needed!

        notifyService.sendReminder(patient); // checked exception wrapping
        return saved;
    } // COMMIT here — all or nothing

    // === READ-ONLY OPTIMIZATION ===
    @Transactional(readOnly = true)
    public Page<AppointmentDto> getPatientAppointments(Long patientId, Pageable pageable) {
        // readOnly=true: Hibernate skips dirty checking → faster flush
        // Also: some DBs route read-only tx to replica
        return appointmentRepo.findByPatientId(patientId, pageable)
            .map(mapper::toDto);
    }

    // === ROLLBACK CONTROL ===
    @Transactional(rollbackFor = {CheckedBusinessException.class})
    public void processPayment(Long patientId, BigDecimal amount) throws CheckedBusinessException {
        // By default: only RuntimeException triggers rollback
        // This rolls back on CheckedBusinessException too
    }

    @Transactional(noRollbackFor = {ExpectedBusinessException.class})
    public void processWithExpectedExceptions() {
        // This won't rollback even on ExpectedBusinessException
    }

    // === PROPAGATION ===
    // REQUIRED (default): join existing transaction, or create new
    @Transactional(propagation = Propagation.REQUIRED)
    public void outerMethod() {
        innerMethod(); // joins outer transaction
    }

    // REQUIRES_NEW: always create new transaction, suspend outer
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void auditLog(String action) {
        // Runs in its OWN transaction — commits even if outer rolls back
        // Perfect for audit logs: even failed operations should be audited
        auditRepo.save(new AuditEntry(action));
    }

    // NESTED: savepoint — inner rollback doesn't affect outer
    @Transactional(propagation = Propagation.NESTED)
    public void innerOperation() {
        // If this throws, only this nested part rolls back
        // Outer transaction can catch and continue
    }

    // === THE SELF-INVOCATION TRAP ===
    @Service
    public class LabResultService {
        @Transactional
        public void processResult(LabResult result) {
            saveResult(result);
            triggerEcrCheck(result); // THIS CALL BYPASSES THE PROXY!
        }

        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public void triggerEcrCheck(LabResult result) {
            // PROBLEM: called via this.triggerEcrCheck() → no proxy → no new transaction!
            // The REQUIRES_NEW is completely ignored
        }
    }
    // FIX: inject self or use ApplicationContext
    @Autowired @Lazy private LabResultService self; // self-injection
    self.triggerEcrCheck(result); // goes through proxy → works!
}
```

### Isolation Levels with EHR Examples
```java
// READ_UNCOMMITTED — doctors can see each other's unsaved changes
// Dirty Read possible: Dr A sees Dr B's unsaved draft prescription
@Transactional(isolation = Isolation.READ_UNCOMMITTED) // never use in healthcare!

// READ_COMMITTED (PostgreSQL default)
// No dirty reads. Two reads of same row in same tx may differ.
@Transactional(isolation = Isolation.READ_COMMITTED)

// REPEATABLE_READ
// Same row read twice in same tx → same data.
// But phantom rows (new inserts) possible.
@Transactional(isolation = Isolation.REPEATABLE_READ)

// SERIALIZABLE
// Complete isolation. Slowest. Transactions run as if sequential.
@Transactional(isolation = Isolation.SERIALIZABLE)

// OPTIMISTIC LOCKING with @Version
@Entity
public class Appointment {
    @Version
    private int version; // auto-incremented on each UPDATE
}

// Scenario: Two doctors try to update same appointment simultaneously
// Doctor A: reads appointment (version=1)
// Doctor B: reads appointment (version=1)
// Doctor A: updates → version becomes 2
// Doctor B: tries to update (expects version=1) → OptimisticLockException!
// Doctor B must retry with fresh data

try {
    Appointment apt = appointmentRepo.findById(id).orElseThrow();
    apt.setStatus(CONFIRMED); // version=1
    appointmentRepo.save(apt); // UPDATE ... WHERE version=1 → fails if version changed
} catch (ObjectOptimisticLockingFailureException e) {
    throw new ConcurrentUpdateException("Appointment was modified by another user");
}
```

---

## 6. HIBERNATE CACHING MEMORY MODEL

```
CACHING LAYERS IN EHR:

┌─────────────────────────────────────────────────────────────┐
│           APPLICATION LAYER (Spring Cache + Redis)           │
│  @Cacheable("patients") findById(id) → Redis                │
│  Cache: id → PatientDto (JSON in Redis)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ miss
                      ▼
┌─────────────────────────────────────────────────────────────┐
│           HIBERNATE L2 CACHE (EhCache / Redis)              │
│  Scope: SessionFactory (shared across all requests)         │
│  @Cache(usage=READ_WRITE) on Entity                         │
│  Cache: entityClass + id → entity state array               │
│  Example: Patient.class, 123L → ["SMITH", "MRN001", ...]   │
└─────────────────────┬───────────────────────────────────────┘
                      │ miss
                      ▼
┌─────────────────────────────────────────────────────────────┐
│           HIBERNATE L1 CACHE (Persistence Context)          │
│  Scope: ONE transaction / EntityManager                     │
│  Always ON — cannot disable                                 │
│  Cache: entityClass + id → managed entity instance         │
│  Tracks ALL changes → dirty checking on commit              │
│  Example: findById(123) twice → 1 DB hit, 1 cache hit      │
└─────────────────────┬───────────────────────────────────────┘
                      │ miss
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                    │
│  Connection Pool (HikariCP): min=5, max=20 connections      │
│  DB Buffer Pool: frequently-used pages cached in DB memory  │
└─────────────────────────────────────────────────────────────┘
```

```java
// L1 Cache demonstration
@Transactional
public void demonstrateL1Cache() {
    Patient p1 = patientRepo.findById(123L).orElseThrow(); // DB hit
    Patient p2 = patientRepo.findById(123L).orElseThrow(); // L1 cache hit — SAME object!
    System.out.println(p1 == p2); // true! Same reference from persistence context

    p1.setEmail("newemail@example.com"); // change tracked by L1 cache (dirty)
    // No explicit save() needed — Hibernate auto-flushes on commit
} // transaction commits → Hibernate detects dirty → generates UPDATE

// L2 Cache setup
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE) // L2 cache
public class Doctor {
    // Doctor data rarely changes — perfect for L2 caching
}

@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_ONLY)  // for immutable data
public class IcdCode {
    // ICD codes never change — most aggressive caching
}

// Query cache — cache JPQL results too
@Query("SELECT d FROM Doctor d WHERE d.specialty = :specialty")
@QueryHints(@QueryHint(name = "org.hibernate.cacheable", value = "true"))
List<Doctor> findBySpecialty(@Param("specialty") Specialty specialty);
```

---

## 7. SQL ESSENTIALS — EHR QUERIES

```sql
-- === INDEXES FOR EHR ===
-- Covering index: query uses only indexed columns (no table lookup!)
CREATE INDEX idx_lab_results_ecr
ON lab_results(icd_code, is_positive, result_date)
INCLUDE (patient_id, test_name);  -- covering index

-- Composite index for appointment queries (order matters!)
CREATE INDEX idx_appointments_doctor_date
ON appointments(doctor_id, scheduled_at, status);
-- Helps: WHERE doctor_id = ? AND scheduled_at > ? AND status = ?
-- Helps: WHERE doctor_id = ? AND scheduled_at > ?
-- Doesn't help: WHERE scheduled_at > ? (doesn't use leading column)

-- === COMPLEX EHR QUERIES ===

-- Find patients with COVID lab results not yet reported to ECR
SELECT p.id, p.mrn, p.first_name, p.last_name, lr.result_date, lr.icd_code
FROM patients p
INNER JOIN lab_results lr ON lr.patient_id = p.id
LEFT JOIN case_reports cr ON cr.lab_result_id = lr.id
WHERE lr.icd_code IN ('U07.1', 'U07.2')  -- COVID codes
  AND lr.is_positive = true
  AND cr.id IS NULL  -- not yet reported
  AND lr.result_date >= NOW() - INTERVAL '7 days'
ORDER BY lr.result_date DESC;

-- Doctor workload last 30 days with completion rate
SELECT
    d.id,
    d.first_name || ' ' || d.last_name AS doctor_name,
    d.specialty,
    COUNT(a.id) AS total_appointments,
    COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) AS completed,
    COUNT(CASE WHEN a.status = 'NO_SHOW' THEN 1 END) AS no_shows,
    ROUND(100.0 * COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) / COUNT(a.id), 2) AS completion_rate,
    COALESCE(SUM(a.billed_amount), 0) AS total_billed
FROM doctors d
LEFT JOIN appointments a ON a.doctor_id = d.id
    AND a.scheduled_at >= NOW() - INTERVAL '30 days'
GROUP BY d.id, d.first_name, d.last_name, d.specialty
ORDER BY total_appointments DESC;

-- Patient visit frequency with running total (window function)
SELECT
    p.mrn,
    p.last_name,
    a.scheduled_at::date AS visit_date,
    COUNT(a.id) OVER (PARTITION BY p.id ORDER BY a.scheduled_at) AS cumulative_visits,
    LAG(a.scheduled_at) OVER (PARTITION BY p.id ORDER BY a.scheduled_at) AS prev_visit,
    a.scheduled_at - LAG(a.scheduled_at) OVER (PARTITION BY p.id ORDER BY a.scheduled_at)
        AS days_since_last_visit
FROM patients p
JOIN appointments a ON a.patient_id = p.id
WHERE a.status = 'COMPLETED'
ORDER BY p.id, a.scheduled_at;

-- Find duplicate patients (same name + DOB but different MRN)
SELECT first_name, last_name, date_of_birth, COUNT(*) as duplicates,
       ARRAY_AGG(mrn) as mrn_list
FROM patients
GROUP BY first_name, last_name, date_of_birth
HAVING COUNT(*) > 1;

-- Recursive CTE: referral chain (who referred whom)
WITH RECURSIVE referral_chain AS (
    SELECT id, name, referring_doctor_id, 0 AS depth
    FROM patients
    WHERE id = :startPatientId

    UNION ALL

    SELECT p.id, p.name, p.referring_doctor_id, rc.depth + 1
    FROM patients p
    INNER JOIN referral_chain rc ON p.id = rc.referring_doctor_id
    WHERE rc.depth < 5  -- limit recursion depth
)
SELECT * FROM referral_chain;
```

---

## 8. CONNECTION POOLING MEMORY MODEL

```
HTTP Request arrives
       │
       ▼
HikariCP Connection Pool
┌────────────────────────────────────────────────────────────┐
│  Pool State                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ Conn #1    │  │ Conn #2    │  │ Conn #3    │  ...      │
│  │ IDLE       │  │ IN USE     │  │ IN USE     │           │
│  │ (available)│  │ req#47     │  │ req#48     │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│  min-idle: 5    max-pool: 20     current: 7               │
│  checkout timeout: 30s                                     │
└────────────────────────────────────────────────────────────┘
       │ takes idle connection
       ▼
Transaction begins
  │ connection leased from pool
  │ all DB operations use this connection
  ▼
Transaction commits/rolls back
  │ connection returned to pool (not closed!)
  ▼
Same connection available for next request

SIZING RULE:
  CPU-bound operations: pool_size = num_cores + 1
  IO-bound (DB calls, HTTP calls): pool_size = num_cores * 2 or more
  EHR recommendation: 20 connections for 200 concurrent users
    (most requests are IO-bound waiting for DB)

DANGER: connection leak
  Someone called getConnection() inside a transaction
  but didn't return it → pool exhaustion → HikariCP timeout
```

---

## 🔗 CONNECTIONS TO OTHER TOPICS

```
M05 JPA/Hibernate/Database
│
├─→ M01 Core Java      — Entity classes are POJOs with JPA annotations
├─→ M02 Collections    — @OneToMany uses List/Set; @ManyToMany needs Set
├─→ M03 Concurrency    — @Transactional + ThreadLocal connections; Optimistic locking
├─→ M04 Spring         — Spring Data JPA, @Transactional, DataSource auto-config
├─→ M06 Microservices  — Each microservice owns its DB (no shared DB in microservices)
└─→ M07 Testing        — @DataJpaTest, TestContainers for real DB testing

Key Terms: ORM, Entity, Persistence Context, L1/L2 Cache, N+1, JPQL,
           Specification, @Transactional, Isolation, Optimistic Locking,
           @Version, Connection Pool, HikariCP, JOIN FETCH, EntityGraph
```

---

## 🔁 REBUILD CHALLENGES

1. Write the Patient entity with: proper ID generation, indexes, embedded Address, @Version.
2. Explain the N+1 problem with a concrete EHR example. Give 3 solutions.
3. What is `mappedBy`? Which side of a relationship is the owner?
4. Write a custom JPQL query: find patients with upcoming appointments in next 7 days.
5. Explain the difference between L1 and L2 cache. When does each help?
6. What does `@Transactional(readOnly=true)` do under the hood?
7. Explain propagation: REQUIRED vs REQUIRES_NEW. Give audit logging as example.
8. Why does `this.method()` not work with `@Transactional`? How to fix?
9. Write a Specification for patient search (status + name contains + date range).
10. Draw the caching layers: Application Cache → L2 Cache → L1 Cache → DB.
