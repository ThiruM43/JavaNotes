# M02 — COLLECTIONS & DATA STRUCTURES MASTER
### Everything: Concepts + Terms + Syntax + Memory + EHR/ECR Examples + Algorithms

---

## DOMAIN CONTEXT
```
EHR uses:
  Patient waitlist              → PriorityQueue (urgency-based)
  Patient lookup by MRN         → HashMap O(1)
  Appointment history (ordered) → LinkedList / ArrayList
  Unique disease codes          → HashSet / TreeSet
  Sorted appointment schedule   → TreeMap (by date)
  Lab result processing queue   → ArrayDeque (FIFO)

ECR-NOW uses:
  Reportable conditions lookup  → HashMap<String, Disease>
  Case reports to submit        → BlockingQueue (thread-safe)
  Patient match deduplication   → HashSet<String> (MRN tracking)
  Submission retry tracking     → LinkedHashMap (insertion-ordered)
```

---

## 1. COLLECTION FRAMEWORK — COMPLETE HIERARCHY

```
Iterable<T>
└── Collection<T>
    ├── List<T>                    → ordered, indexed, allows duplicates
    │   ├── ArrayList<T>           ← array-backed, O(1) read, best general use
    │   ├── LinkedList<T>          ← doubly-linked, O(1) add/remove at ends
    │   └── CopyOnWriteArrayList<T>← thread-safe, reads lock-free
    │
    ├── Set<T>                     → no duplicates
    │   ├── HashSet<T>             ← no order, O(1) ops, backed by HashMap
    │   ├── LinkedHashSet<T>       ← insertion order preserved
    │   └── TreeSet<T>             ← sorted, O(log n), backed by TreeMap
    │
    └── Queue<T>                   → FIFO ordering
        ├── PriorityQueue<T>       ← min-heap, always returns smallest
        ├── ArrayDeque<T>          ← fast stack AND queue (prefer over Stack)
        ├── LinkedList<T>          ← also implements Queue
        └── BlockingQueue<T>       ← thread-safe, blocks on full/empty
            ├── ArrayBlockingQueue    ← bounded
            ├── LinkedBlockingQueue   ← optionally bounded
            └── PriorityBlockingQueue ← sorted + thread-safe

Map<K,V>                           → key-value (NOT a Collection)
├── HashMap<K,V>                   ← no order, O(1), null key OK
├── LinkedHashMap<K,V>             ← insertion/access order
├── TreeMap<K,V>                   ← sorted by key, O(log n)
├── Hashtable<K,V>                 ← legacy, synchronized (avoid)
├── ConcurrentHashMap<K,V>         ← thread-safe, no null key/value
└── EnumMap<K extends Enum, V>     ← very fast for enum keys
```

---

## 2. EHR/ECR CODE — ALL MAJOR COLLECTIONS

### ArrayList — Patient Appointment History
```java
@Service
public class AppointmentService {

    // ArrayList — ordered history, allows duplicates, O(1) access by index
    public List<Appointment> getPatientHistory(Long patientId) {
        // Returns sorted list — most recent first
        List<Appointment> appointments = new ArrayList<>(
            appointmentRepo.findByPatientId(patientId)
        );
        appointments.sort(Comparator.comparing(Appointment::getScheduledAt).reversed());
        return appointments;
    }

    // Common ArrayList operations
    public AppointmentStats analyzeHistory(Long patientId) {
        List<Appointment> history = getPatientHistory(patientId);

        int total = history.size();                        // O(1)
        Appointment first = history.get(history.size()-1); // O(1) — last (oldest)
        Appointment latest = history.get(0);               // O(1) — first (newest)

        // Sublist view (no copy) — last 5 appointments
        List<Appointment> recent = history.subList(0, Math.min(5, history.size()));

        // Filter with Stream
        long missedCount = history.stream()
            .filter(a -> a.getStatus() == AppointmentStatus.NO_SHOW)
            .count();

        // indexOf — find specific appointment
        int idx = history.indexOf(targetAppointment);

        return new AppointmentStats(total, missedCount, latest);
    }
}
```

### HashMap — Patient Lookup by MRN (O(1))
```java
@Service
public class PatientCacheService {

    // HashMap: MRN → Patient (fast lookup)
    private final Map<String, Patient> patientCache = new HashMap<>();

    // LinkedHashMap: tracks access order → LRU cache for recently viewed patients
    private final Map<String, Patient> recentPatients =
        new LinkedHashMap<>(100, 0.75f, true) { // accessOrder=true
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, Patient> eldest) {
                return size() > 100; // keep only 100 most-recently-accessed
            }
        };

    // TreeMap: schedule sorted by date
    private final TreeMap<LocalDate, List<Appointment>> dailySchedule = new TreeMap<>();

    public void loadPatient(Patient patient) {
        patientCache.put(patient.getMrn(), patient);
    }

    public Optional<Patient> findByMrn(String mrn) {
        return Optional.ofNullable(patientCache.get(mrn));  // O(1)
    }

    // Map operations
    public void demonstrate() {
        // putIfAbsent — don't overwrite existing
        patientCache.putIfAbsent("MRN001", newPatient);

        // computeIfAbsent — create if missing (great for nested maps)
        dailySchedule.computeIfAbsent(LocalDate.now(), k -> new ArrayList<>())
                     .add(appointment);

        // merge — update with function
        Map<String, Integer> visitCount = new HashMap<>();
        visitCount.merge("MRN001", 1, Integer::sum); // add 1 or init to 1

        // getOrDefault
        int visits = visitCount.getOrDefault("MRN999", 0);

        // Iterate entries (most efficient)
        patientCache.forEach((mrn, patient) ->
            log.debug("Loaded: {} -> {}", mrn, patient.getName()));

        // TreeMap special methods
        LocalDate today = LocalDate.now();
        Map.Entry<LocalDate, List<Appointment>> nextDay = dailySchedule.higherEntry(today);
        Map.Entry<LocalDate, List<Appointment>> prevDay = dailySchedule.lowerEntry(today);
        SortedMap<LocalDate, List<Appointment>> weekSchedule =
            dailySchedule.subMap(today, today.plusDays(7));
    }
}
```

### PriorityQueue — Patient Triage/Waiting Room
```java
@Service
public class TriageService {

    // PriorityQueue: highest-urgency patient treated first (max-heap by urgency)
    private final PriorityQueue<WaitingPatient> triageQueue =
        new PriorityQueue<>(Comparator.comparingInt(WaitingPatient::getUrgencyScore).reversed());

    // ECR-NOW: process reports by severity
    private final PriorityQueue<CaseReport> reportQueue =
        new PriorityQueue<>(Comparator.comparing(CaseReport::getSeverity).reversed()
            .thenComparing(CaseReport::getCreatedAt));

    public void addPatient(Patient patient, int urgencyScore) {
        triageQueue.offer(new WaitingPatient(patient, urgencyScore));
    }

    public WaitingPatient callNextPatient() {
        return triageQueue.poll(); // removes and returns highest urgency
    }

    public WaitingPatient peekNext() {
        return triageQueue.peek(); // just view, don't remove
    }

    // Kth most urgent patient (classic DSA problem)
    public Patient findKthMostUrgent(List<Patient> patients, int k) {
        // Min-heap of size k: keeps k most urgent
        PriorityQueue<Patient> minHeap =
            new PriorityQueue<>(Comparator.comparingInt(Patient::getUrgencyScore));

        for (Patient p : patients) {
            minHeap.offer(p);
            if (minHeap.size() > k) minHeap.poll(); // evict least urgent
        }
        return minHeap.peek(); // kth most urgent
    }
}
```

### HashSet / TreeSet — Disease Code Management
```java
@Service
public class DiseaseCodeService {

    // HashSet: fast duplicate check, no order needed
    private final Set<String> reportableIcdCodes = new HashSet<>(Arrays.asList(
        "U07.1",   // COVID-19
        "A15.0",   // Tuberculosis
        "A02.0",   // Salmonella
        "B01.9"    // Chickenpox
    ));

    // TreeSet: sorted disease list for UI dropdowns
    private final TreeSet<Disease> sortedDiseases =
        new TreeSet<>(Comparator.comparing(Disease::getName));

    public boolean isReportable(String icdCode) {
        return reportableIcdCodes.contains(icdCode); // O(1)
    }

    // Set operations — find overlap between patient conditions and reportable diseases
    public Set<String> findReportableConditions(Set<String> patientIcdCodes) {
        Set<String> intersection = new HashSet<>(patientIcdCodes);
        intersection.retainAll(reportableIcdCodes);  // keeps only common elements
        return intersection;
    }

    // Union — all conditions across multiple patients
    public Set<String> allConditions(List<Patient> patients) {
        Set<String> all = new HashSet<>();
        patients.forEach(p -> all.addAll(p.getIcdCodes()));
        return all; // duplicates automatically removed
    }

    // TreeSet navigation
    public SortedSet<Disease> diseasesStartingWith(String prefix) {
        return sortedDiseases.subSet(
            new Disease(prefix),
            new Disease(prefix + Character.MAX_VALUE)
        );
    }
}
```

### BlockingQueue — ECR-NOW Submission Queue (Thread-Safe)
```java
@Service
public class EcrSubmissionQueue {

    // BlockingQueue: ECR reports queue for async submission
    private final BlockingQueue<CaseReport> submissionQueue =
        new LinkedBlockingQueue<>(1000); // max 1000 pending reports

    // Producer: EHR adds reports to queue
    public void queueReport(CaseReport report) {
        try {
            if (!submissionQueue.offer(report, 5, TimeUnit.SECONDS)) {
                log.error("Queue full! Could not queue report: {}", report.getReportId());
                // Alert ops team — ECR-NOW submission is backed up
                alertService.sendAlert("ECR submission queue full");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ReportQueueException("Interrupted while queuing report", e);
        }
    }

    // Consumer (runs in separate thread pool): processes and submits reports
    @Scheduled(fixedDelay = 1000)
    public void processQueue() {
        CaseReport report;
        while ((report = submissionQueue.poll()) != null) { // non-blocking drain
            try {
                fhirSubmissionService.submit(report);
            } catch (Exception e) {
                log.error("Failed to submit report {}", report.getReportId(), e);
                requeueForRetry(report);
            }
        }
    }
}
```

---

## 3. HASHMAP INTERNALS — DEEP DIVE

```
How HashMap stores Patient by MRN:

patientCache.put("MRN-2024-000001", patient);

Step 1: Compute hash
   hash = "MRN-2024-000001".hashCode()
   hash = 1,283,746,921 (example)

Step 2: Spread hash (improve distribution)
   hash = hash ^ (hash >>> 16)   ← XOR with right-shifted version

Step 3: Find bucket index
   index = hash & (capacity - 1)  ← capacity=16, so index = hash & 15
   index = 9  (example)

Step 4: Store in bucket array
   table[9] → Node{key="MRN-2024-000001", value=patient, hash=..., next=null}

What if two MRNs hash to same index (collision)?
   table[9] → Node{key="MRN-2024-000001", next=→}
              → Node{key="MRN-2024-000042", next=null}
   (linked list in bucket)

Java 8+: if bucket chain > 8 entries → convert to Red-Black Tree
   table[9] → TreeNode{...}  (O(log n) instead of O(n))

Resize: when (size / capacity) > loadFactor (0.75)
   Capacity 16 → resize at 12 entries
   New capacity = 32 (always power of 2)
   ALL entries rehashed into new table (expensive O(n))
```

### Custom Key — Patient Object as Map Key
```java
// For Patient to be a HashMap key, MUST override both:
public class Patient {
    private final String mrn; // immutable key field!

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Patient)) return false;
        Patient other = (Patient) o;
        return Objects.equals(this.mrn, other.mrn); // equality BY MRN
    }

    @Override
    public int hashCode() {
        return Objects.hash(mrn); // SAME field(s) as equals
    }
}

// Rules:
// 1. If equals() → true, hashCode() MUST be same
// 2. If hashCode() same, equals() MAY be false (collision)
// 3. NEVER use mutable fields in hashCode/equals for Map keys
//    (changing the field while in map → can't find it anymore!)
Map<Patient, List<Appointment>> scheduleByPatient = new HashMap<>();
patient.setMrn("DIFFERENT"); // ← catastrophic! now can't find patient in map
```

---

## 4. DATA STRUCTURES IN EHR — WHEN TO USE WHAT

### Decision Guide
```
Need to:                              Use:
─────────────────────────────────────────────────────────────
Find patient by MRN instantly         HashMap<String, Patient>
Maintain visit order                  LinkedHashMap or ArrayList
Sort patients alphabetically          TreeSet<Patient> / sort()
Remove duplicate ICD codes            HashSet<String>
Process appointments FIFO             ArrayDeque / LinkedList as Queue
Triage: highest urgency first         PriorityQueue (max-heap)
Thread-safe report queue              BlockingQueue
Thread-safe shared patient cache      ConcurrentHashMap
Read-mostly listener list             CopyOnWriteArrayList
Sorted schedule by date               TreeMap<LocalDate, List<Appointment>>
Stack (undo last action)              ArrayDeque.push()/pop()
```

### Complexity Quick Reference
```
Data Structure    | Access  | Search  | Insert  | Delete
──────────────────┼─────────┼─────────┼─────────┼────────
ArrayList         | O(1)    | O(n)    | O(n)*   | O(n)
LinkedList        | O(n)    | O(n)    | O(1)**  | O(1)**
HashMap           | O(1)    | O(1)    | O(1)    | O(1)
TreeMap           | O(log n)| O(log n)| O(log n)| O(log n)
HashSet           | -       | O(1)    | O(1)    | O(1)
TreeSet           | -       | O(log n)| O(log n)| O(log n)
PriorityQueue     | O(n)    | O(n)    | O(log n)| O(log n)
ArrayDeque        | O(1)**  | O(n)    | O(1)    | O(1)

* Amortized — O(1) at end, O(n) in middle
** At head/tail only
```

---

## 5. ALGORITHMS — EHR/ECR IMPLEMENTATIONS

### Binary Search — Find Appointment by Date
```java
public class AppointmentSearchService {

    // Binary search on sorted appointment list — O(log n)
    public Optional<Appointment> findByDate(List<Appointment> sorted, LocalDate target) {
        int left = 0, right = sorted.size() - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2; // avoid overflow
            LocalDate midDate = sorted.get(mid).getScheduledAt().toLocalDate();
            int cmp = midDate.compareTo(target);
            if (cmp == 0) return Optional.of(sorted.get(mid));
            else if (cmp < 0) left = mid + 1;
            else right = mid - 1;
        }
        return Optional.empty();
    }

    // Find first appointment on or after a date (leftmost binary search)
    public int findFirstOnOrAfter(List<Appointment> sorted, LocalDate target) {
        int left = 0, right = sorted.size();
        while (left < right) {
            int mid = (left + right) / 2;
            if (sorted.get(mid).getScheduledAt().toLocalDate().isBefore(target))
                left = mid + 1;
            else
                right = mid;
        }
        return left; // index of first appointment >= target
    }
}
```

### Sliding Window — Lab Result Trend Analysis
```java
public class LabTrendAnalyzer {

    // Sliding window: max glucose in any 7-day window (for diabetes monitoring)
    public double maxGlucoseIn7Days(List<LabResult> sorted) {
        if (sorted.isEmpty()) return 0;
        Deque<LabResult> window = new ArrayDeque<>();
        double maxAvg = 0;

        for (LabResult result : sorted) {
            // Remove results outside 7-day window
            while (!window.isEmpty() &&
                   ChronoUnit.DAYS.between(window.peekFirst().getDate(), result.getDate()) > 7) {
                window.pollFirst();
            }
            window.addLast(result);

            double avg = window.stream().mapToDouble(LabResult::getValue).average().orElse(0);
            maxAvg = Math.max(maxAvg, avg);
        }
        return maxAvg;
    }

    // Two pointers: find pair of lab values summing to target (e.g., electrolyte balance check)
    public Optional<int[]> findComplementaryValues(int[] sortedValues, int target) {
        int left = 0, right = sortedValues.length - 1;
        while (left < right) {
            int sum = sortedValues[left] + sortedValues[right];
            if (sum == target) return Optional.of(new int[]{left, right});
            else if (sum < target) left++;
            else right--;
        }
        return Optional.empty();
    }
}
```

### Graph / BFS — Patient Referral Network
```java
public class ReferralNetworkService {

    // BFS: find shortest referral chain from GP to specialist
    // Graph: Doctor → List<Doctor> (can refer to)
    public List<Doctor> shortestReferralPath(Doctor from, Doctor target,
                                              Map<Doctor, List<Doctor>> referralNetwork) {
        if (from.equals(target)) return List.of(from);

        Map<Doctor, Doctor> parent = new HashMap<>();
        Queue<Doctor> queue = new LinkedList<>();
        Set<Doctor> visited = new HashSet<>();

        queue.offer(from);
        visited.add(from);

        while (!queue.isEmpty()) {
            Doctor current = queue.poll();
            for (Doctor next : referralNetwork.getOrDefault(current, List.of())) {
                if (!visited.contains(next)) {
                    parent.put(next, current);
                    if (next.equals(target)) {
                        return reconstructPath(parent, from, target); // found!
                    }
                    visited.add(next);
                    queue.offer(next);
                }
            }
        }
        return Collections.emptyList(); // no path
    }

    private List<Doctor> reconstructPath(Map<Doctor, Doctor> parent, Doctor from, Doctor to) {
        LinkedList<Doctor> path = new LinkedList<>();
        Doctor current = to;
        while (current != null) {
            path.addFirst(current);
            current = parent.get(current);
        }
        return path;
    }
}
```

### Sorting — Patient Records
```java
public class PatientSortService {

    public List<Patient> sortPatients(List<Patient> patients, SortCriteria criteria) {
        Comparator<Patient> comparator = switch (criteria) {
            case NAME -> Comparator.comparing(Patient::getLastName)
                                   .thenComparing(Patient::getFirstName);
            case MRN -> Comparator.comparing(Patient::getMrn);
            case DOB -> Comparator.comparing(Patient::getDateOfBirth);
            case URGENCY -> Comparator.comparingInt(Patient::getUrgencyScore).reversed();
            case LAST_VISIT -> Comparator.comparing(Patient::getLastVisitDate,
                                   Comparator.nullsLast(Comparator.reverseOrder()));
        };

        List<Patient> sorted = new ArrayList<>(patients); // don't modify original
        sorted.sort(comparator);
        return sorted;
    }

    // Natural sort via Comparable on Patient
    // Collections.sort(patients) → uses Patient.compareTo()
}
```

### Dynamic Programming — Appointment Scheduling Optimization
```java
public class ScheduleOptimizer {

    // DP: maximum non-overlapping appointments (like weighted job scheduling)
    // Each appointment has: start, end, priority
    public int maxPrioritySchedule(List<Appointment> appointments) {
        if (appointments.isEmpty()) return 0;

        // Sort by end time
        appointments.sort(Comparator.comparing(Appointment::getEndTime));
        int n = appointments.size();
        int[] dp = new int[n + 1];

        for (int i = 1; i <= n; i++) {
            Appointment apt = appointments.get(i - 1);
            // Include this appointment
            int include = apt.getPriority() + dp[findLastNonOverlapping(appointments, i - 1)];
            // Exclude this appointment
            int exclude = dp[i - 1];
            dp[i] = Math.max(include, exclude);
        }
        return dp[n];
    }

    // Binary search: find last appointment that doesn't conflict
    private int findLastNonOverlapping(List<Appointment> sorted, int idx) {
        int lo = 0, hi = idx - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (!sorted.get(mid).getEndTime().isAfter(sorted.get(idx).getStartTime()))
                lo = mid + 1;
            else
                hi = mid - 1;
        }
        return lo;
    }
}
```

---

## 6. MEMORY MODEL FOR COLLECTIONS

```
ArrayList<Patient> patients = new ArrayList<>();

HEAP LAYOUT:
┌────────────────────────────────────────────────┐
│ ArrayList object                               │
│   Object[] elementData (reference) ──────────┐│
│   int size = 3                                ││
└────────────────────────────────────────────────┘
                                                ▼
┌────────────────────────────────────────────────┐
│ Object[] elementData (length=10, default cap)  │
│  [0] ──→ Patient{mrn="MRN001"} (on Heap)       │
│  [1] ──→ Patient{mrn="MRN002"} (on Heap)       │
│  [2] ──→ Patient{mrn="MRN003"} (on Heap)       │
│  [3..9] null                                   │
└────────────────────────────────────────────────┘

HashMap<String, Patient>:
┌────────────────────────────────────────────────┐
│ HashMap object                                 │
│   Node[] table (reference) ──────────────────┐│
│   int size = 3                                ││
│   float loadFactor = 0.75                     ││
└────────────────────────────────────────────────┘
                                                ▼
┌────────────────────────────────────────────────┐
│ Node[] table (length=16)                       │
│  [0] null                                      │
│  [5] Node{key="MRN001", val=Patient, next=null}│
│  [9] Node{key="MRN002", val=Patient, next=null}│
│  [9]  └─ Node{key="MRN003", val=Patient, next=null} (collision chain!)
│  ... null                                      │
└────────────────────────────────────────────────┘

IMPORTANT: Collections store REFERENCES, not object copies.
When you add patient to list, only the reference (8 bytes) is stored.
Patient objects live on Heap independently.
```

---

## 7. COMPARABLE VS COMPARATOR IN EHR

```java
// Comparable: Patient knows its own natural order (by MRN)
public class Patient implements Comparable<Patient> {
    @Override
    public int compareTo(Patient other) {
        return this.mrn.compareTo(other.mrn);
    }
}
Collections.sort(patients); // uses compareTo

// Comparator: external, flexible, multiple orderings
// Method 1: anonymous class (old way)
Comparator<Patient> byAge = new Comparator<Patient>() {
    @Override public int compare(Patient a, Patient b) {
        return Integer.compare(a.getAge(), b.getAge());
    }
};

// Method 2: lambda (Java 8+)
Comparator<Patient> byAge = (a, b) -> Integer.compare(a.getAge(), b.getAge());

// Method 3: method reference (cleanest)
Comparator<Patient> byAge = Comparator.comparingInt(Patient::getAge);

// Method 4: chaining
Comparator<Patient> complex = Comparator
    .comparing(Patient::getLastName)
    .thenComparing(Patient::getFirstName)
    .thenComparingInt(Patient::getAge)
    .reversed();

// Method 5: null-safe
Comparator<Patient> nullSafe = Comparator.comparing(
    Patient::getLastVisit, Comparator.nullsLast(Comparator.naturalOrder())
);
```

---

## 🔗 CONNECTIONS TO OTHER TOPICS

```
M02 Collections & DSA
│
├─→ M01 Core Java      — Generics make collections type-safe; equals/hashCode for HashMap
├─→ M03 Concurrency    — ConcurrentHashMap, BlockingQueue for thread-safe collections
├─→ M04 Spring         — Collections used in @Service layers; Spring Data returns List/Page
├─→ M05 JPA/Database   — Entity relationships mapped as Collections (@OneToMany List)
├─→ M06 Microservices  — Queues (BlockingQueue, Kafka) for async event processing
└─→ M07 Testing        — Test sorting, filtering, HashMap behavior with JUnit

Key Terms: HashMap, HashSet, PriorityQueue, TreeMap, BlockingQueue,
           Big O, Binary Search, Sliding Window, Two Pointers, Dynamic Programming
```

---

## 🔁 REBUILD CHALLENGES

1. Draw the HashMap internal structure when you store 3 patients by MRN.
2. What happens when two MRNs hash to the same bucket?
3. Write a PriorityQueue that processes highest-urgency patients first.
4. When would you use TreeMap instead of HashMap? Give an EHR example.
5. Implement binary search on a sorted appointment list from memory.
6. What is the difference between `Comparable` and `Comparator`? Show both for Patient.
7. Write a sliding window algorithm for 7-day lab result averaging.
8. What does `computeIfAbsent` do? Show the schedule map example.
9. Why does HashMap need `equals()` AND `hashCode()`? What breaks if you only override one?
10. Draw the memory layout of `ArrayList<Patient>` with 3 patients.
