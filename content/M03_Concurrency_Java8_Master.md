# M03 — CONCURRENCY & JAVA 8+ MASTER
### Everything: Threads + Streams + Lambdas + CompletableFuture + Memory + EHR/ECR Examples

---

## DOMAIN CONTEXT
```
EHR Concurrency Scenarios:
  Multiple doctors view the same patient chart simultaneously
  Lab results processed in parallel (batch ingestion)
  Appointment reminders sent to thousands of patients
  Shared patient cache accessed by multiple threads

ECR-NOW Concurrency:
  Parallel disease surveillance across multiple hospitals
  Async submission to public health (don't block EHR UI)
  Rate-limited FHIR submissions to state health departments
  Concurrent case report processing
```

---

## 1. THREAD FUNDAMENTALS

### Thread States & Lifecycle
```
NEW ──start()──→ RUNNABLE ──scheduler──→ RUNNING
                     ↑                      │
                     │            sleep/wait/IO/sync
                     │                      ↓
                  notify()          BLOCKED/WAITING/TIMED_WAITING
                                           │
                             method ends / interrupt
                                           ↓
                                      TERMINATED
```

### Three Ways to Create Threads in EHR
```java
// Way 1: Extend Thread — BAD (wastes inheritance)
class LabResultProcessor extends Thread {
    private LabResult result;
    LabResultProcessor(LabResult r) { this.result = r; }
    @Override public void run() { process(result); }
}
new LabResultProcessor(result).start();

// Way 2: Runnable — better (separates task from thread)
Runnable checkEcr = () -> ecrService.checkAndReport(result);
new Thread(checkEcr).start();

// Way 3: ExecutorService — BEST (manages thread lifecycle)
@Configuration
public class ThreadPoolConfig {
    @Bean("labProcessorPool")
    public ExecutorService labProcessorPool() {
        return new ThreadPoolExecutor(
            5,                          // corePoolSize: always alive
            20,                         // maxPoolSize: max under load
            60L, TimeUnit.SECONDS,      // keepAlive for idle threads above core
            new LinkedBlockingQueue<>(500), // task queue capacity
            new ThreadFactory() { /* name threads meaningfully */ },
            new ThreadPoolExecutor.CallerRunsPolicy() // backpressure: caller runs if full
        );
    }
    
    @Bean("ecrSubmissionPool")
    public ExecutorService ecrPool() {
        return Executors.newFixedThreadPool(3); // max 3 concurrent FHIR submissions
    }
}

@Service
public class LabResultService {
    @Autowired @Qualifier("labProcessorPool") ExecutorService pool;

    public void processBatch(List<LabResult> results) {
        List<Future<?>> futures = results.stream()
            .map(r -> pool.submit(() -> processAndCheckEcr(r)))
            .collect(Collectors.toList());

        // Wait for all to complete
        futures.forEach(f -> {
            try { f.get(30, TimeUnit.SECONDS); }
            catch (TimeoutException e) { log.error("Lab processing timed out"); }
            catch (ExecutionException e) { log.error("Lab processing failed", e.getCause()); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
    }
}
```

---

## 2. SYNCHRONIZATION — THREAD-SAFE PATIENT CACHE

### The Race Condition Problem
```java
// UNSAFE: race condition on patient visit count
@Service
public class UnsafePatientMetrics {
    private int visitCount = 0; // shared mutable state

    // Thread A and Thread B both call this simultaneously:
    // A reads visitCount = 5
    // B reads visitCount = 5
    // A writes visitCount = 6
    // B writes visitCount = 6  ← LOST UPDATE! Should be 7
    public void recordVisit() {
        visitCount++; // NOT atomic: read → increment → write (3 operations)
    }
}

// FIXED #1: synchronized method
@Service
public class SynchronizedPatientMetrics {
    private int visitCount = 0;

    public synchronized void recordVisit() { visitCount++; } // only one thread at a time
    public synchronized int getCount() { return visitCount; }
    // Problem: all methods lock on 'this' — coarse grained
}

// FIXED #2: AtomicInteger (lock-free, CAS-based, better performance)
@Service
public class AtomicPatientMetrics {
    private final AtomicInteger visitCount = new AtomicInteger(0);
    private final AtomicLong reportCount = new AtomicLong(0);

    public void recordVisit() { visitCount.incrementAndGet(); }     // atomic
    public int getCount() { return visitCount.get(); }
    public void updateIfHigher(int newVal) {
        visitCount.accumulateAndGet(newVal, Math::max);            // atomic complex update
    }
    // compareAndSet — optimistic locking
    public boolean tryReset(int expectedVal) {
        return visitCount.compareAndSet(expectedVal, 0); // only resets if still == expectedVal
    }
}

// FIXED #3: ReentrantLock (most flexible)
@Service
public class PatientRecordService {
    private final Map<Long, PatientRecord> records = new HashMap<>();
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Lock readLock = rwLock.readLock();
    private final Lock writeLock = rwLock.writeLock();

    // Multiple threads can read simultaneously
    public PatientRecord get(Long id) {
        readLock.lock();
        try { return records.get(id); }
        finally { readLock.unlock(); } // ALWAYS unlock in finally
    }

    // Only one thread can write (blocks all reads)
    public void update(Long id, PatientRecord record) {
        writeLock.lock();
        try { records.put(id, record); }
        finally { writeLock.unlock(); }
    }

    // tryLock — avoid blocking
    public boolean tryUpdate(Long id, PatientRecord record) {
        if (writeLock.tryLock(2, TimeUnit.SECONDS)) {
            try { records.put(id, record); return true; }
            finally { writeLock.unlock(); }
        }
        return false; // couldn't get lock in time
    }
}
```

### volatile — ECR Kill Switch
```java
@Service
public class EcrSurveillanceService {
    // volatile: all threads immediately see when shutdown is triggered
    private volatile boolean running = true;
    private volatile boolean pauseSubmissions = false;

    // Surveillance loop — runs in dedicated thread
    public void startSurveillance() {
        while (running) {                           // reads from main memory (volatile)
            List<LabResult> newResults = fetchNewResults();
            newResults.stream()
                .filter(r -> !pauseSubmissions)     // volatile flag check
                .filter(this::isReportable)
                .forEach(this::submitReport);
            Thread.sleep(5000);
        }
        log.info("ECR surveillance stopped");
    }

    // Called from admin thread — volatile ensures visibility
    public void shutdown() { this.running = false; }
    public void pauseSubmissions() { this.pauseSubmissions = true; }
    
    // volatile = visibility only, NOT atomicity
    // i++ on volatile is still NOT thread-safe (3 ops)
    // For atomic ops: use AtomicBoolean
}
```

### Deadlock Prevention in EHR
```java
// DEADLOCK SCENARIO:
// Thread A: locks Patient MRN001, then tries to lock Doctor D001
// Thread B: locks Doctor D001, then tries to lock Patient MRN001
// STUCK FOREVER

// PREVENTION: always acquire locks in same order (canonical ordering)
@Service
public class AppointmentLockService {
    private final Map<Long, ReentrantLock> patientLocks = new ConcurrentHashMap<>();
    private final Map<Long, ReentrantLock> doctorLocks = new ConcurrentHashMap<>();

    public void scheduleAppointment(Long patientId, Long doctorId) {
        // Always lock lower ID first — prevents deadlock
        Long firstId = Math.min(patientId, doctorId);
        Long secondId = Math.max(patientId, doctorId);
        
        ReentrantLock lock1 = getLock(firstId);
        ReentrantLock lock2 = getLock(secondId);
        
        lock1.lock();
        try {
            lock2.lock();
            try {
                // Both locked — safely schedule
                doSchedule(patientId, doctorId);
            } finally { lock2.unlock(); }
        } finally { lock1.unlock(); }
    }
}
```

### CountDownLatch and CyclicBarrier — ECR Batch Processing
```java
@Service
public class EcrBatchProcessor {

    // CountDownLatch: wait for all N hospitals to finish sending data
    public Map<String, BatchResult> processFromAllHospitals(List<String> hospitalIds) 
                                                            throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(hospitalIds.size());
        Map<String, BatchResult> results = new ConcurrentHashMap<>();

        for (String hospitalId : hospitalIds) {
            executorService.submit(() -> {
                try {
                    BatchResult result = fetchAndProcess(hospitalId);
                    results.put(hospitalId, result);
                } finally {
                    latch.countDown(); // always count down, even on failure
                }
            });
        }

        boolean completed = latch.await(5, TimeUnit.MINUTES); // wait max 5 min
        if (!completed) log.warn("Timeout: not all hospitals responded");
        return results;
    }

    // CyclicBarrier: parallel phases — all threads must finish phase 1 before phase 2
    public void parallelEcrPhases(List<CaseReport> reports) throws Exception {
        CyclicBarrier barrier = new CyclicBarrier(3, () ->
            log.info("Phase complete — all threads synchronized")
        );

        // 3 threads each process 1/3 of reports in phases
        for (int t = 0; t < 3; t++) {
            final int threadIdx = t;
            pool.submit(() -> {
                validateBatch(getSlice(reports, threadIdx));
                barrier.await();    // wait for all threads to finish validation
                enrichBatch(getSlice(reports, threadIdx));
                barrier.await();    // wait for all threads to finish enrichment
                submitBatch(getSlice(reports, threadIdx));
            });
        }
    }

    // Semaphore: rate-limit FHIR API calls (max 5 concurrent)
    private final Semaphore fhirRateLimiter = new Semaphore(5);

    public void submitWithRateLimit(CaseReport report) {
        fhirRateLimiter.acquire(); // blocks if 5 already active
        try {
            fhirClient.submit(report);
        } finally {
            fhirRateLimiter.release(); // always release
        }
    }
}
```

---

## 3. COMPLETABLEFUTURE — ASYNC ECR-NOW PIPELINE

```java
@Service
public class AsyncEcrService {

    // Simple async — don't block EHR UI while submitting to public health
    public CompletableFuture<CaseReport> submitAsync(CaseReport report) {
        return CompletableFuture
            .supplyAsync(() -> validateReport(report), ecrPool)      // thread pool
            .thenApply(validated -> enrichWithPatientData(validated))
            .thenApply(enriched -> fhirClient.submit(enriched))
            .thenApply(response -> report.toBuilder()
                .status(SUBMITTED)
                .fhirId(response.getId())
                .build())
            .exceptionally(ex -> {
                log.error("ECR submission failed for {}", report.getReportId(), ex);
                return report.toBuilder().status(FAILED).errorMessage(ex.getMessage()).build();
            });
    }

    // Combine multiple async calls — parallel patient + disease data enrichment
    public CompletableFuture<EnrichedReport> enrichReport(String reportId) {
        CompletableFuture<PatientData> patientFuture =
            CompletableFuture.supplyAsync(() -> patientService.getData(reportId), pool);
        CompletableFuture<DiseaseData> diseaseFuture =
            CompletableFuture.supplyAsync(() -> diseaseService.getData(reportId), pool);
        CompletableFuture<LabData> labFuture =
            CompletableFuture.supplyAsync(() -> labService.getData(reportId), pool);

        // Wait for ALL three — runs in parallel!
        return CompletableFuture.allOf(patientFuture, diseaseFuture, labFuture)
            .thenApply(v -> new EnrichedReport(
                patientFuture.join(),   // join() = get() without checked exception
                diseaseFuture.join(),
                labFuture.join()
            ));
    }

    // anyOf — return whichever data source responds first
    public CompletableFuture<PatientData> getPatientDataFast(Long patientId) {
        return CompletableFuture.anyOf(
            CompletableFuture.supplyAsync(() -> primaryDb.getPatient(patientId)),
            CompletableFuture.supplyAsync(() -> cacheService.getPatient(patientId))
        ).thenApply(result -> (PatientData) result);
    }

    // thenCompose — sequential async steps (flat-map for futures)
    public CompletableFuture<Void> submitAndNotify(CaseReport report) {
        return submitAsync(report)                          // first submit
            .thenCompose(submitted ->                       // then (flat-map) notify
                notifyAsync(submitted.getDoctorId(), submitted))
            .thenAccept(v -> log.info("ECR workflow complete for {}", report.getReportId()));
    }

    // Timeout
    public CompletableFuture<CaseReport> submitWithTimeout(CaseReport report) {
        return submitAsync(report)
            .orTimeout(30, TimeUnit.SECONDS)
            .exceptionally(ex -> {
                if (ex instanceof TimeoutException) {
                    requeueForRetry(report);
                    return report.toBuilder().status(PENDING_RETRY).build();
                }
                throw new CompletionException(ex);
            });
    }
}
```

### CompletableFuture Methods Map
```
supplyAsync(supplier)      → async with return value
runAsync(runnable)         → async, no return
thenApply(fn)              → transform result (like map) — sync
thenApplyAsync(fn)         → transform result — async
thenAccept(consumer)       → consume result, no return
thenCompose(fn)            → chain futures (flat-map) — avoid nested futures
thenCombine(other, fn)     → combine TWO futures when both done
allOf(futures...)          → wait for ALL futures
anyOf(futures...)          → wait for FIRST future
exceptionally(fn)          → handle exception, provide fallback
handle(fn)                 → handle both result AND exception
whenComplete(fn)           → callback on either result or exception
orTimeout(n, unit)         → Java 9+: fail if takes too long
completeOnTimeout(val, n)  → Java 9+: use default value if timeout
join()                     → like get() but throws unchecked exception
```

---

## 4. JAVA 8+ STREAMS — EHR DATA PROCESSING

### Stream Pipeline: The EHR Report Engine
```java
@Service
public class EhrReportService {

    public MonthlyReport generateMonthlyReport(int year, int month) {
        List<Appointment> allAppointments = appointmentRepo.findAll();

        // ═══ STREAM PIPELINE ═══
        // Source → Intermediate (lazy) → Terminal (triggers execution)

        // 1. Filter by month
        List<Appointment> monthlyApts = allAppointments.stream()
            .filter(a -> a.getScheduledAt().getYear() == year)
            .filter(a -> a.getScheduledAt().getMonthValue() == month)
            .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
            .collect(Collectors.toList());

        // 2. Group by doctor
        Map<Doctor, List<Appointment>> byDoctor = monthlyApts.stream()
            .collect(Collectors.groupingBy(Appointment::getDoctor));

        // 3. Count by status
        Map<AppointmentStatus, Long> statusCount = monthlyApts.stream()
            .collect(Collectors.groupingBy(Appointment::getStatus, Collectors.counting()));

        // 4. Average duration per specialty
        Map<Specialty, Double> avgDurationBySpecialty = monthlyApts.stream()
            .collect(Collectors.groupingBy(
                a -> a.getDoctor().getSpecialty(),
                Collectors.averagingInt(Appointment::getDurationMinutes)
            ));

        // 5. Top 5 busiest doctors
        List<Map.Entry<Doctor, Long>> busiest = monthlyApts.stream()
            .collect(Collectors.groupingBy(Appointment::getDoctor, Collectors.counting()))
            .entrySet().stream()
            .sorted(Map.Entry.<Doctor, Long>comparingByValue().reversed())
            .limit(5)
            .collect(Collectors.toList());

        // 6. Patients with no-show rate > 20%
        List<Patient> noShowRisk = allAppointments.stream()
            .collect(Collectors.groupingBy(Appointment::getPatient))
            .entrySet().stream()
            .filter(e -> {
                long total = e.getValue().size();
                long noShows = e.getValue().stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.NO_SHOW).count();
                return total > 0 && (double) noShows / total > 0.2;
            })
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());

        // 7. Revenue calculation
        double totalRevenue = monthlyApts.stream()
            .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
            .mapToDouble(Appointment::getBilledAmount)
            .sum();

        // 8. All unique ICD codes used this month
        Set<String> usedCodes = monthlyApts.stream()
            .flatMap(a -> a.getDiagnosisCodes().stream()) // flatten List<List<String>>
            .collect(Collectors.toSet());

        // 9. Appointment summary string
        String summary = monthlyApts.stream()
            .map(a -> a.getPatient().getName() + " - " + a.getDoctor().getName())
            .collect(Collectors.joining("\n"));

        return new MonthlyReport(statusCount, byDoctor, avgDurationBySpecialty,
                                  totalRevenue, usedCodes);
    }
}
```

### ECR-NOW Stream Processing
```java
@Service
public class EcrSurveillanceEngine {

    public EcrSurveillanceResult runDailySurveillance(LocalDate date) {
        return labResultRepo.findByDate(date).stream()

            // Filter: only positive results for reportable conditions
            .filter(r -> r.isPositive())
            .filter(r -> diseaseService.isReportable(r.getIcdCode()))

            // Deduplicate: same patient, same condition, within 30 days
            .filter(this::isNotDuplicate)

            // Parallel processing for performance (CPU-bound enrichment)
            .parallel()
            .map(r -> enrichWithPatientDemographics(r))
            .map(r -> mapToFhirCaseReport(r))
            .sequential() // back to sequential for ordered submission

            // Partition: submittable vs needs-review
            .collect(Collectors.partitioningBy(
                cr -> cr.getCompleteness() >= 0.9,  // 90%+ complete → auto-submit
                Collectors.toList()
            ))
            // Returns Map<Boolean, List<CaseReport>>
            // true → auto-submit, false → manual review queue
            ;
    }

    // Custom Collector — build FHIR Bundle from stream of reports
    public FhirBundle collectToBundle(List<CaseReport> reports) {
        return reports.stream()
            .collect(Collector.of(
                FhirBundle::new,                                   // supplier
                FhirBundle::addEntry,                              // accumulator
                (b1, b2) -> { b1.merge(b2); return b1; },        // combiner (parallel)
                FhirBundle::build                                  // finisher
            ));
    }
}
```

### All Stream Operations Reference
```java
List<LabResult> results = labResultRepo.findAll();

// INTERMEDIATE (lazy — don't execute until terminal called):
results.stream()
    .filter(r -> r.getValue() > 100)              // keep matching
    .map(r -> r.toDto())                           // transform 1:1
    .flatMap(r -> r.getDiagnosisCodes().stream())  // transform 1:many, flatten
    .mapToInt(LabResult::getValue)                 // to primitive IntStream
    .distinct()                                    // remove duplicates
    .sorted()                                      // natural order
    .sorted(Comparator.comparing(LabResult::getDate).reversed())
    .limit(10)                                     // max 10 results
    .skip(5)                                       // skip first 5
    .peek(r -> log.debug("Processing: {}", r))     // side effect without changing stream

// TERMINAL (triggers execution):
    .collect(Collectors.toList())                  // → List
    .collect(Collectors.toSet())                   // → Set
    .collect(Collectors.toMap(r -> r.getId(), r -> r)) // → Map
    .collect(Collectors.joining(", "))             // → String (for String streams)
    .count()                                       // → long
    .findFirst()                                   // → Optional<T>
    .findAny()                                     // → Optional<T> (for parallel)
    .anyMatch(r -> r.isPositive())                 // → boolean
    .allMatch(r -> r.isPositive())                 // → boolean
    .noneMatch(r -> r.isPositive())                // → boolean
    .min(Comparator.comparing(LabResult::getValue)) // → Optional<T>
    .max(Comparator.comparing(LabResult::getValue)) // → Optional<T>
    .reduce(0, (sum, r) -> sum + r.getValue())     // → T (fold)
    .forEach(r -> process(r))                      // void, side effect
    .toArray()                                     // → Object[]
    .sum()                                         // IntStream/LongStream/DoubleStream only
    .average()                                     // → OptionalDouble
```

---

## 5. FUNCTIONAL INTERFACES — EHR EXAMPLES

```java
// Built-in functional interfaces with EHR use cases
public class EhrFunctionalExamples {

    // Predicate<T>: T → boolean
    Predicate<Patient> isAdult = p -> p.getAge() >= 18;
    Predicate<Patient> hasInsurance = p -> p.getInsuranceId() != null;
    Predicate<Patient> isHighRisk = p -> p.getRiskScore() > 7;

    // Compose predicates
    Predicate<Patient> eligibleForStudy = isAdult.and(hasInsurance).and(isHighRisk);
    Predicate<Patient> notHighRisk = isHighRisk.negate();
    Predicate<Patient> adultOrInsured = isAdult.or(hasInsurance);

    // Function<T, R>: T → R
    Function<Patient, PatientDto> toDto = p -> mapper.toDto(p);
    Function<String, Patient> findByMrn = mrn -> patientRepo.findByMrn(mrn).orElseThrow();
    Function<Patient, String> fullName = p -> p.getLastName() + ", " + p.getFirstName();

    // Compose functions
    Function<String, PatientDto> mrnToDto = findByMrn.andThen(toDto); // find then convert
    Function<Patient, String> cleanName = fullName.andThen(String::trim);

    // Consumer<T>: T → void
    Consumer<Patient> auditAccess = p -> auditLog.record("VIEWED", p.getMrn());
    Consumer<Patient> sendReminder = p -> emailService.sendReminder(p);
    Consumer<Patient> logAndNotify = auditAccess.andThen(sendReminder); // chain consumers

    // Supplier<T>: () → T
    Supplier<String> generateMrn = () -> "MRN-" + Year.now() + "-" + nextSequence();
    Supplier<List<Patient>> defaultPatients = ArrayList::new;

    // BiFunction<T, U, R>: (T, U) → R
    BiFunction<Patient, Doctor, Appointment> bookAppointment =
        (patient, doctor) -> new Appointment(patient, doctor, LocalDateTime.now());

    // UnaryOperator<T>: T → T (same type)
    UnaryOperator<Patient> anonymize = p -> p.toBuilder().ssn("***").name("ANONYMIZED").build();

    // BinaryOperator<T>: (T, T) → T
    BinaryOperator<Integer> addScores = Integer::sum;
}
```

---

## 6. OPTIONAL — NULL-SAFE EHR OPERATIONS

```java
@Service
public class PatientOptionalService {

    public PatientSummary getPatientSummary(String mrn) {
        return patientRepo.findByMrn(mrn)            // returns Optional<Patient>
            .filter(p -> p.getStatus() == ACTIVE)    // only active patients
            .map(p -> buildSummary(p))               // transform if present
            .orElseThrow(() -> new PatientNotFoundException(mrn));
    }

    public String getPatientCity(Long patientId) {
        return patientRepo.findById(patientId)
            .map(Patient::getAddress)
            .map(Address::getCity)
            .map(String::trim)
            .orElse("Unknown");          // safe chain — no NPE even if any is null
    }

    public void notifyIfPresent(String mrn) {
        patientRepo.findByMrn(mrn)
            .ifPresent(p -> emailService.send(p.getEmail(), "Your appointment reminder"));
        // does nothing if not found — no NPE
    }

    public Patient findOrCreate(String mrn, PatientDto dto) {
        return patientRepo.findByMrn(mrn)
            .orElseGet(() -> {  // lazy — only called if empty
                Patient newPatient = mapper.toEntity(dto);
                return patientRepo.save(newPatient);
            });
    }

    // Java 9+
    public void processIfPresent(Long id) {
        patientRepo.findById(id)
            .ifPresentOrElse(
                p -> process(p),                            // if present
                () -> log.warn("Patient {} not found", id)  // if empty
            );
    }

    // Chaining optionals
    public Optional<InsuranceDetails> getInsurance(Long patientId) {
        return patientRepo.findById(patientId)
            .flatMap(p -> insuranceRepo.findByPatient(p)); // Optional<Optional<T>> → Optional<T>
    }

    // Common MISTAKES with Optional:
    // ❌ optional.get() without isPresent() check — throws NoSuchElementException
    // ❌ if (optional.isPresent()) optional.get() — use map/orElse instead
    // ❌ Optional as method parameter — use overloading instead
    // ❌ Optional in fields/collections — use null instead
    // ✅ Optional as return type from methods that may not find a result
}
```

---

## 7. MEMORY MODEL — HOW CONCURRENCY WORKS IN JVM

```
JVM Memory + Multiple Threads:

┌─────────────────────────────────────────────────────────────┐
│                    MAIN MEMORY (HEAP)                       │
│  patientCache (ConcurrentHashMap)                           │
│  running = true (volatile)                                  │
│  visitCount = 42 (AtomicInteger)                            │
└─────────────────────────────────────────────────────────────┘
         ↑↑                    ↑↑                  ↑↑
    read/write               volatile           atomic CAS
         ↑↑                    ↑↑                  ↑↑
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  Thread 1    │    │  Thread 2    │    │  Thread 3        │
│  CPU Cache:  │    │  CPU Cache:  │    │  CPU Cache:      │
│  patient ref │    │  patient ref │    │  visitCount=42   │
│  (may be     │    │  (may be     │    │  (stale without  │
│   stale!)    │    │   stale!)    │    │   volatile!)     │
└──────────────┘    └──────────────┘    └──────────────────┘

PROBLEM: CPU caches can have stale values!

SOLUTION:
  volatile → forces read from MAIN MEMORY on every access
  synchronized → memory barrier + mutual exclusion
  AtomicXxx → CAS operation (hardware-level atomic)
  ConcurrentHashMap → fine-grained locking per segment

Happens-Before:
  Thread A writes volatile var → Thread B reads same volatile var
  Thread A: running = false  (write)
  Thread B: while(running)   (read) ← GUARANTEED to see false
  
  Without volatile: Thread B's CPU cache may have old value = true!
  Thread B might loop forever even after running set to false.
```

---

## 8. THREAD-LOCAL — PER-REQUEST CONTEXT IN EHR

```java
// ThreadLocal: each thread has its own copy — no sharing needed
@Component
public class EhrRequestContext {
    // Each HTTP request thread gets its own user context
    private static final ThreadLocal<UserContext> currentUser = new ThreadLocal<>();
    private static final ThreadLocal<String> requestId = ThreadLocal.withInitial(
        () -> UUID.randomUUID().toString()
    );

    public static void setUser(UserContext user) { currentUser.set(user); }
    public static UserContext getUser() { return currentUser.get(); }
    public static String getRequestId() { return requestId.get(); }
    public static void clear() {
        currentUser.remove();   // CRITICAL: clean up or memory leak!
        requestId.remove();
    }
}

// Spring Filter: set context at start of each request
@Component
public class EhrRequestFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
                         throws IOException, ServletException {
        try {
            UserContext ctx = extractFromJwt((HttpServletRequest) req);
            EhrRequestContext.setUser(ctx);
            chain.doFilter(req, res);
        } finally {
            EhrRequestContext.clear(); // ALWAYS clean up ThreadLocal
        }
    }
}

// Service: access without passing context everywhere
@Service
public class AuditService {
    public void log(String action) {
        UserContext user = EhrRequestContext.getUser(); // no method parameter needed
        auditRepo.save(new AuditEntry(user.getId(), action, LocalDateTime.now()));
    }
}
```

---

## 9. WORKFLOW: ASYNC ECR-NOW PIPELINE

```
Doctor saves lab result in EHR
         │
         ▼
LabResultService.save(result)           ← synchronous, returns immediately
         │
         ├─→ DB: INSERT lab_results     ← synchronous
         │
         └─→ CompletableFuture.runAsync(() → ecrNow.check(result))
                      │                 ← ASYNC: doesn't block doctor's UI
                      ▼ (separate thread from ecrPool)
             EcrNowService.check(result)
                      │
                      ├─→ isDiseaseReportable(result.icdCode)?  NO → exit
                      │                                          YES → continue
                      ├─→ CompletableFuture.allOf(
                      │       patientDataFuture,        ─┐
                      │       jurisdictionFuture,        ├── parallel
                      │       previousReportsFuture      ─┘
                      │   ).thenApply(buildCaseReport)
                      │
                      ├─→ fhirClient.submit(report)     ← with retry + circuit breaker
                      │
                      ├─→ caseReportRepo.save(report)
                      │
                      └─→ notifyDoctor(report)           ← async notification

Total user-facing time: milliseconds (just the DB insert)
Background ECR processing: seconds (async, user doesn't wait)
```

---

## 🔗 CONNECTIONS TO OTHER TOPICS

```
M03 Concurrency & Java 8+
│
├─→ M01 Core Java      — Thread is an Object; Runnable is a Functional Interface
├─→ M02 Collections    — ConcurrentHashMap, BlockingQueue, CopyOnWriteArrayList
├─→ M04 Spring         — @Async, @EnableAsync, Spring's async executor beans
├─→ M05 JPA/Database   — @Transactional with threads; connection pool sizing
├─→ M06 Microservices  — CompletableFuture for service-to-service async calls
└─→ M07 Testing        — Testing async with CompletableFuture, thread safety tests

Key Terms: Thread, Runnable, Callable, Future, CompletableFuture,
           synchronized, volatile, AtomicInteger, ReentrantLock,
           CountDownLatch, Semaphore, ThreadLocal, Stream API,
           Lambda, Optional, Predicate, Function, Consumer, Supplier
```

---

## 🔁 REBUILD CHALLENGES

1. What is a race condition? Show the patient visit counter example.
2. When would you use `AtomicInteger` vs `synchronized` vs `ReentrantLock`?
3. Write a CompletableFuture chain: validate → enrich → submit → notify.
4. What does `volatile` guarantee? What does it NOT guarantee?
5. Explain `CountDownLatch` vs `CyclicBarrier` — give EHR examples.
6. Write a Stream pipeline: find all patients with unpaid bills > $1000, sorted by amount.
7. What is `flatMap`? Show an example with lab results and diagnosis codes.
8. Explain `ThreadLocal`. What is the memory leak risk?
9. Draw the JVM memory diagram showing why `volatile` is needed.
10. What is `thenCompose` vs `thenApply` in CompletableFuture?
