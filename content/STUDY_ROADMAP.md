# STUDY ROADMAP — Java Senior Interview Preparation
## Start Here. End Here. Know Exactly Where You Are Every Day.

---

## YOUR COMPLETE FILE LIBRARY (26 Files)

```
SPINE (read every day)
├── THREE_LEVEL_NOTES.md       ← The core study file (Basic→Intermediate→Advanced)
├── QUICK_REFERENCE.md         ← Pre-interview cram sheet (last 30 min before interview)

TERMS & GLOSSARY (400+ terms)
├── T01_Core_Java_OOP_Terms.md
├── T02_Memory_GC_Terms.md
├── T03_Collections_Threading_Java8_Terms.md
├── T04_Exception_JDBC_SQL_JPA_Terms.md
├── T05_Spring_REST_Security_Microservices_Terms.md
├── T06_Patterns_DevOps_Production_AdvancedJVM_Terms.md

MASTER FILES — Code + Domain + Memory (EHR examples)
├── M01_Core_Java_Master.md
├── M02_Collections_DSA_Master.md
├── M03_Concurrency_Java8_Master.md
├── M04_Spring_Master.md
├── M05_JPA_Database_Master.md
├── M06_Microservices_Integration_Master.md
├── M07_Testing_DevOps_Production_Master.md

ADVANCED FILES
├── M08_System_Design_Master.md
├── M09_Interview_QA_Master.md    ← 100 Q&A with model answers
├── M10_Modern_Java_Master.md

ORIGINAL QUICK NOTES (backup reference)
├── 00_MASTER_INDEX.md
├── 01_Core_Java.md
├── 02_Data_Structures_Algorithms.md
├── 03_Spring_Framework.md
├── 04_JPA_Hibernate_Database.md
├── 05_Microservices_Messaging_Testing.md
├── Java_Senior_Interview_ShortNotes.md

CODING PRACTICE
└── DSA_Coding_Patterns.md
```

---

## HOW THE FILES CONNECT

```
THREE_LEVEL_NOTES  ←────────────────────── THE SPINE
       │                                    Read this first for every topic.
       │                                    Basic → understand it.
       │                                    Intermediate → learn the terms.
       │                                    Advanced → master the full picture.
       │
       ├── T01-T06 Terms ──────────────── VOCABULARY LAYER
       │         │                         After reading THREE_LEVEL_NOTES for a topic,
       │         │                         read the matching T-file to lock in every term.
       │         │
       └── M01-M10 Masters ────────────── CODE + DEPTH LAYER
                 │                         After terms, read the M-file for real code,
                 │                         EHR examples, memory diagrams, connections.
                 │
                 └── M09 Q&A ──────────── INTERVIEW LAYER
                     DSA_Coding_Patterns    Practice saying answers out loud.
                     QUICK_REFERENCE        Rehearse patterns. Scan before interview.
```

---

## THE LEARNING METHOD (Do This Every Day)

```
For each topic, follow this exact sequence:

STEP 1 — THREE_LEVEL_NOTES.md (🟢 Basic)
         Read the Basic level. Close the file. Explain it out loud
         in your own words as if talking to a friend.
         Time: 5-10 minutes

STEP 2 — THREE_LEVEL_NOTES.md (🟡 Intermediate)
         Read Intermediate. Note every term you don't know.
         Time: 10-15 minutes

STEP 3 — T-file (Terms)
         Look up each term you noted. Read its 🧒 analogy.
         Read the 💬 interview phrase out loud.
         Time: 10-15 minutes

STEP 4 — THREE_LEVEL_NOTES.md (🔴 Advanced)
         Read Advanced. This connects everything.
         Time: 15-20 minutes

STEP 5 — M-file (Master)
         Read the code. Trace through the EHR examples.
         Don't memorize — understand what it does and why.
         Time: 20-30 minutes

STEP 6 — M09 Q&A (matching questions)
         Find questions on this topic. Cover the answer.
         Try to answer out loud. Then read the model answer.
         Time: 10 minutes

TOTAL per topic: ~1 hour
```

---

## PLAN A — 2-WEEK INTENSIVE
### (If interview is 2 weeks away)

```
Week 1: Core Java + Spring
Week 2: Microservices + Practice + System Design
```

### WEEK 1

---

#### DAY 1 — Foundation & JVM (Monday)
**Goal:** Understand how Java runs. Why JVM matters. Memory model basics.

| Time | Activity | File |
|------|----------|------|
| 9:00–9:30 | Read all 26 files list. Understand the map. | STUDY_ROADMAP.md (this file) |
| 9:30–10:30 | Topic 1: JVM (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 1 |
| 10:30–11:00 | JVM + Memory terms | T02_Memory_GC_Terms.md |
| 11:00–12:00 | Topic 3: Memory & GC (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 3 |
| 12:00–13:00 | Break |  |
| 13:00–14:00 | OOP 4 pillars deep code | M01_Core_Java_Master.md (Part 1-3) |
| 14:00–14:30 | OOP terms | T01_Core_Java_OOP_Terms.md (first 25 terms) |
| 14:30–15:30 | Topic 2: OOP (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 2 |
| 15:30–16:30 | Q&A practice: Q1–Q10 | M09_Interview_QA_Master.md |
| 16:30–17:00 | Review: what did I learn today? Write 5 key points from memory | Notebook |

**Day 1 Checkpoint ✅**
- Can you explain JVM, JRE, JDK difference without looking?
- Can you explain 4 OOP pillars with EHR examples?
- Can you draw the JVM memory areas (Heap/Stack/Metaspace/Eden/Old Gen)?

---

#### DAY 2 — Collections & Data Structures (Tuesday)
**Goal:** Know every collection, when to use which, Big-O cold.

| Time | Activity | File |
|------|----------|------|
| 9:00–10:00 | Topic 4: Collections (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 4 |
| 10:00–11:00 | Collections code: ArrayList, HashMap, TreeMap, PriorityQueue | M02_Collections_DSA_Master.md (Part 1-3) |
| 11:00–11:30 | Collections + Threading terms | T03_Collections_Threading_Java8_Terms.md (Collections section) |
| 11:30–12:30 | DSA: Sliding Window, Two Pointers (read + practice) | DSA_Coding_Patterns.md (Pattern 1-2) |
| 12:30–13:30 | Break |  |
| 13:30–14:30 | DSA: Binary Search, BFS, DFS | DSA_Coding_Patterns.md (Pattern 3-5) |
| 14:30–15:30 | Topic 5: Generics | THREE_LEVEL_NOTES → Topic 5 |
| 15:30–16:00 | Generics terms | T01_Core_Java_OOP_Terms.md (remaining terms) |
| 16:00–17:00 | Q&A: Q21–Q35 (Collections & Streams) | M09_Interview_QA_Master.md |

**Day 2 Checkpoint ✅**
- Big-O for every collection without looking?
- HashMap internals: hash → bucket → chain → tree — explain it?
- Can you write a sliding window template from memory?

---

#### DAY 3 — Java 8 & Exception Handling (Wednesday)
**Goal:** Master Streams, Lambdas, Optional. Know exception hierarchy.

| Time | Activity | File |
|------|----------|------|
| 9:00–10:00 | Topic 6: Exception Handling (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 6 |
| 10:00–11:00 | Topic 7: Streams, Lambdas, Optional (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 7 |
| 11:00–12:00 | Java 8 code: Stream pipelines, Collectors, Optional chains | M03_Concurrency_Java8_Master.md (Part 2 — Streams) |
| 12:00–13:00 | Break |  |
| 13:00–13:30 | Java 8 + Lambda terms | T03_Collections_Threading_Java8_Terms.md (Lambda/Stream section) |
| 13:30–14:30 | DSA: DP, Backtracking templates | DSA_Coding_Patterns.md (Pattern 6-7) |
| 14:30–15:30 | Topic 23: Modern Java 9-21 (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 23 |
| 15:30–16:00 | Modern Java: Records, Sealed, Virtual Threads | M10_Modern_Java_Master.md (Parts 3-5) |
| 16:00–17:00 | Q&A: Q25–Q35 | M09_Interview_QA_Master.md |

**Day 3 Checkpoint ✅**
- Write a Stream pipeline: filter active patients, group by doctor, top 3 busiest
- Explain Optional.orElseGet() vs orElse() — why does it matter?
- What is a Record? When would you NOT use one?

---

#### DAY 4 — Concurrency & Threading (Thursday)
**Goal:** Thread lifecycle, sync tools, CompletableFuture, Virtual Threads.

| Time | Activity | File |
|------|----------|------|
| 9:00–10:00 | Topic 8: Concurrency (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 8 |
| 10:00–11:00 | Concurrency code: ThreadPool, AtomicInteger, ReentrantLock | M03_Concurrency_Java8_Master.md (Part 1 — Concurrency) |
| 11:00–11:30 | Threading terms | T03_Collections_Threading_Java8_Terms.md (Threading section) |
| 11:30–12:30 | CompletableFuture full patterns | M03_Concurrency_Java8_Master.md (CompletableFuture section) |
| 12:30–13:30 | Break |  |
| 13:30–14:00 | JMM, volatile, CAS, False Sharing | THREE_LEVEL_NOTES → Topic 8 (Advanced — re-read) |
| 14:00–14:30 | Virtual Threads in depth | M10_Modern_Java_Master.md (Part 5) |
| 14:30–15:30 | DSA: Merge Intervals, Heap, Monotonic Stack | DSA_Coding_Patterns.md (Pattern 8-9-10) |
| 15:30–17:00 | Q&A: Q36–Q48 (Concurrency) | M09_Interview_QA_Master.md |

**Day 4 Checkpoint ✅**
- Thread states — name all 6 and what causes each transition
- Deadlock: what causes it? How do you prevent it?
- When does volatile NOT solve thread safety?

---

#### DAY 5 — Spring Core + Spring Boot (Friday)
**Goal:** IoC, DI, AOP, Auto-configuration, Actuator.

| Time | Activity | File |
|------|----------|------|
| 9:00–10:00 | Topic 9: Spring Core IoC/DI/AOP (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 9 |
| 10:00–11:00 | Spring Core code: @Bean, @Aspect, proxy, self-invocation | M04_Spring_Master.md (Part 1-3) |
| 11:00–11:30 | Spring terms | T05_Spring_REST_Security_Microservices_Terms.md (Spring section) |
| 11:30–12:30 | Topic 10: Spring Boot Auto-config (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 10 |
| 12:30–13:30 | Break |  |
| 13:30–14:30 | Spring Boot: application.yml, @ConfigurationProperties, Actuator | M04_Spring_Master.md (Part 4-5) |
| 14:30–15:30 | Topic 11: Spring MVC & REST (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 11 |
| 15:30–16:30 | Spring MVC: Controller, MockMvc, validation, error handling | M04_Spring_Master.md (Part 6) |
| 16:30–17:00 | Q&A: Q49–Q65 (Spring) | M09_Interview_QA_Master.md |

**Day 5 Checkpoint ✅**
- What is the AOP proxy self-invocation problem? How do you fix it?
- How does @SpringBootApplication auto-configure a DataSource?
- Explain the Spring MVC request lifecycle end-to-end

---

#### DAY 6 — Spring Security + JPA/Hibernate (Saturday)
**Goal:** JWT flow, Security filter chain, Entity lifecycle, N+1 solution.

| Time | Activity | File |
|------|----------|------|
| 9:00–9:30 | REVIEW WEEK 1 — write 3 key points per topic from memory | Notebook |
| 9:30–10:30 | Topic 12: Spring Security & JWT (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 12 |
| 10:30–11:30 | Security code: JwtFilter, SecurityFilterChain, @PreAuthorize | M04_Spring_Master.md (Part 7-8) |
| 11:30–12:30 | Topic 13: JPA & Hibernate (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 13 |
| 12:30–13:30 | Break |  |
| 13:30–14:30 | JPA code: Entities, relationships, N+1 fixes, transactions | M05_JPA_Database_Master.md (Part 1-4) |
| 14:30–15:00 | JPA + SQL terms | T04_Exception_JDBC_SQL_JPA_Terms.md |
| 15:00–16:00 | Topic 14: SQL (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 14 |
| 16:00–17:00 | Q&A: Q66–Q90 (JPA + DB) | M09_Interview_QA_Master.md |

**Day 6 Checkpoint ✅**
- Draw the JWT flow: login → token → validate → SecurityContext
- Entity lifecycle: New → Managed → Detached → Removed — what causes each?
- N+1 problem: explain it and give 3 solutions

---

#### DAY 7 — REST + REVIEW (Sunday — lighter day)
**Goal:** Consolidate Week 1. No new major topics.

| Time | Activity | File |
|------|----------|------|
| 9:00–10:00 | Re-read all Day 1-6 checkpoints. Fill any gaps | THREE_LEVEL_NOTES (skim) |
| 10:00–11:00 | Practice Q&A out loud: Q1–Q50 — cover answers, answer first | M09_Interview_QA_Master.md |
| 11:00–12:00 | Write from memory: Big-O table, HTTP codes, Thread states, Transaction propagation | Notebook |
| 12:00–13:00 | Break |  |
| 13:00–14:00 | DSA practice: write Sliding Window + Binary Search templates cold | DSA_Coding_Patterns.md |
| 14:00–15:00 | Spring Security + JPA terms review | T04 + T05 |
| 15:00–16:00 | QUICK_REFERENCE: read Sections 1-7 | QUICK_REFERENCE.md |

---

### WEEK 2

---

#### DAY 8 — Microservices Architecture (Monday)
**Goal:** Service discovery, API Gateway, Feign, Circuit Breaker, Saga.

| Time | Activity | File |
|------|----------|------|
| 9:00–10:00 | Topic 15: Microservices (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 15 |
| 10:00–11:00 | Microservices code: Eureka, Gateway, Feign, Resilience4j | M06_Microservices_Integration_Master.md (Part 1-3) |
| 11:00–11:30 | Microservices terms | T05_Spring_REST_Security_Microservices_Terms.md (Microservices section) |
| 11:30–12:30 | Topic 18: Resilience Patterns (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 18 |
| 12:30–13:30 | Break |  |
| 13:30–14:30 | Topic 21: System Design Fundamentals (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 21 |
| 14:30–15:30 | System Design framework + EHR design walkthrough | M08_System_Design_Master.md (Part 1-3) |
| 15:30–17:00 | Q&A: Q66–Q80 (Microservices) | M09_Interview_QA_Master.md |

**Day 8 Checkpoint ✅**
- Explain Circuit Breaker states with real numbers (thresholds)
- Choreography vs Orchestration Saga — when to use which?
- How does API Gateway JWT filter work?

---

#### DAY 9 — Kafka + Redis + Messaging (Tuesday)
**Goal:** Kafka internals, consumer patterns, Redis beyond caching.

| Time | Activity | File |
|------|----------|------|
| 9:00–10:00 | Topic 16: Kafka (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 16 |
| 10:00–11:00 | Kafka code: Producer, Consumer, DLT, Retry | M06_Microservices_Integration_Master.md (Kafka section) |
| 11:00–12:00 | Topic 17: Redis (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 17 |
| 12:00–13:00 | Break |  |
| 13:00–14:00 | Redis code: @Cacheable, distributed lock, rate limiting, ZSet | M06_Microservices_Integration_Master.md (Redis section) |
| 14:00–14:30 | Kafka + Redis terms | T05 (Kafka/Redis section) + T06 |
| 14:30–15:30 | System Design: Rate limiter, Search, Message queues | M08_System_Design_Master.md (Part 4-7) |
| 15:30–17:00 | Q&A: Q67–Q80 (Kafka, Redis, Patterns) | M09_Interview_QA_Master.md |

**Day 9 Checkpoint ✅**
- Kafka: why use patient MRN as partition key?
- At-least-once delivery — what is an idempotent consumer?
- Redis eviction policies — which one for EHR patient cache and why?

---

#### DAY 10 — Testing + DevOps (Wednesday)
**Goal:** JUnit 5, Mockito, Spring test slices, Docker, Kubernetes, CI/CD.

| Time | Activity | File |
|------|----------|------|
| 9:00–9:30 | Topic 19: Testing (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 19 |
| 9:30–10:30 | Testing code: @WebMvcTest, @DataJpaTest, ArgumentCaptor, TestContainers | M07_Testing_DevOps_Production_Master.md (Part 1-4) |
| 10:30–11:30 | Topic 20: Docker & Kubernetes (Basic→Advanced) | THREE_LEVEL_NOTES → Topic 20 |
| 11:30–12:30 | Docker: Dockerfile, docker-compose; K8s: deployment, probes, HPA | M07_Testing_DevOps_Production_Master.md (Part 5-6) |
| 12:30–13:30 | Break |  |
| 13:30–14:30 | CI/CD pipeline + Monitoring (Prometheus, Grafana, ELK) | M07_Testing_DevOps_Production_Master.md (Part 7-8) |
| 14:30–15:00 | DevOps + Testing terms | T06_Patterns_DevOps_Production_AdvancedJVM_Terms.md |
| 15:00–16:00 | Q&A: Q91–Q100 | M09_Interview_QA_Master.md |

**Day 10 Checkpoint ✅**
- @WebMvcTest vs @DataJpaTest vs @SpringBootTest — when to use each?
- K8s: difference between liveness and readiness probe?
- Why use TestContainers instead of H2?

---

#### DAY 11 — Advanced JVM + Production (Thursday)
**Goal:** Heap dumps, thread dumps, GC tuning, RCA process.

| Time | Activity | File |
|------|----------|------|
| 9:00–10:00 | Advanced JVM: heap dump, thread dump, escape analysis, CAS | M07_Testing_DevOps_Production_Master.md (Part 9) |
| 10:00–10:30 | Advanced JVM terms | T06 (Advanced JVM section) |
| 10:30–11:30 | Production: RCA process, severity levels, on-call runbook | M07_Testing_DevOps_Production_Master.md (Part 10) |
| 11:30–12:30 | System Design deep dives: Security, Scalability, DB scaling | M08_System_Design_Master.md (Part 5-9) |
| 12:30–13:30 | Break |  |
| 13:30–14:30 | Design Patterns (Topic 22 full) | THREE_LEVEL_NOTES → Topic 22 |
| 14:30–15:00 | Design Patterns terms | T06 (Design Patterns section) |
| 15:00–16:00 | System Design interview delivery tips | M08_System_Design_Master.md (Part 9) |
| 16:00–17:00 | Q&A: Q94–Q100 (JVM + Production) | M09_Interview_QA_Master.md |

**Day 11 Checkpoint ✅**
- You get an OOM in production. Walk me through your debugging steps.
- What causes a Java memory leak? Name 3 EHR-specific examples.
- Explain GC: what's the difference between Minor GC and Full GC?

---

#### DAY 12 — Mock Interview Day (Friday)
**Goal:** Simulate real interview conditions. Find gaps.

| Time | Activity | File |
|------|----------|------|
| 9:00–9:30 | Read QUICK_REFERENCE completely | QUICK_REFERENCE.md |
| 9:30–10:30 | MOCK: Core Java (5 questions, answer out loud, 2 min each) | M09 Q1–Q20 |
| 10:30–11:30 | MOCK: Collections + Concurrency (5 questions) | M09 Q21–Q48 |
| 11:30–12:30 | MOCK: Spring + JPA (5 questions) | M09 Q49–Q90 |
| 12:30–13:30 | Break |  |
| 13:30–14:30 | MOCK: System Design — "Design EHR system" (30 min, talk out loud) | M08_System_Design_Master.md |
| 14:30–15:30 | MOCK: Coding (2 DSA problems, 20 min each) | DSA_Coding_Patterns.md |
| 15:30–16:30 | MOCK: Microservices + Modern Java (5 questions) | M09 Q66–Q80 |
| 16:30–17:00 | Note every question you stumbled on — these are your gaps | Notebook |

---

#### DAY 13 — Gap Filling (Saturday)
**Goal:** Fix everything that was shaky in mock day.

| Time | Activity | File |
|------|----------|------|
| 9:00–9:30 | List your gaps from Day 12 | Notebook |
| 9:30–12:30 | Re-study ONLY the gap topics (3 hours) | THREE_LEVEL_NOTES (Advanced for gap topics) |
| 12:30–13:30 | Break |  |
| 13:30–15:30 | Re-do the gap Q&A out loud | M09 (gap questions) |
| 15:30–16:30 | DSA: practice the 3 patterns you're least confident about | DSA_Coding_Patterns.md |
| 16:30–17:00 | QUICK_REFERENCE: Sections 8-15 | QUICK_REFERENCE.md |

---

#### DAY 14 — INTERVIEW READY (Sunday)
**Goal:** Light review. Build confidence. Rest.

| Time | Activity | File |
|------|----------|------|
| 9:00–10:00 | Read THREE_LEVEL_NOTES: Intermediate level only, all 23 topics (skim) | THREE_LEVEL_NOTES.md |
| 10:00–11:00 | Read QUICK_REFERENCE completely once | QUICK_REFERENCE.md |
| 11:00–12:00 | Say out loud: 5 behavioral STAR stories (see Section 14 of QUICK_REFERENCE) | QUICK_REFERENCE.md |
| 12:00 onward | REST. No heavy studying. You are ready. |  |

---

## PLAN B — 4-WEEK RELAXED
### (If interview is 4+ weeks away — more time to absorb)

```
Week 1: Core Java Foundation
Week 2: Spring Ecosystem
Week 3: Microservices + System Design
Week 4: Review + Practice + Mock Interviews
```

### WEEK 1 — Core Java Foundation
| Day | Focus | Files |
|-----|-------|-------|
| Mon | JVM + OOP | THREE_LEVEL_NOTES Topics 1-2, T01, T02, M01 Part 1-2 |
| Tue | Memory + GC + Generics | THREE_LEVEL_NOTES Topics 3+5, T02, M01 Part 3-4 |
| Wed | Collections deep dive | THREE_LEVEL_NOTES Topic 4, T03 (collections), M02 Part 1-3 |
| Thu | DSA patterns | DSA_Coding_Patterns.md all patterns, M02 Part 4-6 |
| Fri | Java 8: Streams + Lambda | THREE_LEVEL_NOTES Topic 7, T03 (lambda), M03 Part 2 |
| Sat | Exceptions + Modern Java | THREE_LEVEL_NOTES Topics 6+23, M10 Parts 1-5 |
| Sun | Q&A Q1–Q35 + review | M09, Notebook review |

### WEEK 2 — Spring Ecosystem
| Day | Focus | Files |
|-----|-------|-------|
| Mon | Concurrency full | THREE_LEVEL_NOTES Topic 8, T03 (threading), M03 Part 1 |
| Tue | Spring Core: IoC + DI + AOP | THREE_LEVEL_NOTES Topics 9-10, T05, M04 Part 1-3 |
| Wed | Spring Boot + MVC + REST | THREE_LEVEL_NOTES Topics 10-11, M04 Part 4-7 |
| Thu | Spring Security + JWT | THREE_LEVEL_NOTES Topic 12, M04 Part 7-8 |
| Fri | JPA + Hibernate deep | THREE_LEVEL_NOTES Topic 13, T04, M05 Part 1-4 |
| Sat | SQL + Database | THREE_LEVEL_NOTES Topic 14, M05 Part 5-6, T04 (SQL) |
| Sun | Q&A Q36–Q90 + mock | M09 |

### WEEK 3 — Microservices + System Design
| Day | Focus | Files |
|-----|-------|-------|
| Mon | Microservices architecture | THREE_LEVEL_NOTES Topic 15, T05 (microservices), M06 Part 1-2 |
| Tue | Kafka + Messaging | THREE_LEVEL_NOTES Topic 16, M06 Kafka section |
| Wed | Redis + Caching | THREE_LEVEL_NOTES Topic 17, M06 Redis section |
| Thu | Resilience + Testing | THREE_LEVEL_NOTES Topics 18-19, M07 Part 1-4 |
| Fri | Docker + K8s + CI/CD | THREE_LEVEL_NOTES Topic 20, M07 Part 5-7 |
| Sat | Advanced JVM + Production | M07 Parts 8-10, T06 |
| Sun | System Design full | THREE_LEVEL_NOTES Topic 21, M08 all parts |

### WEEK 4 — Review + Practice
| Day | Focus | Files |
|-----|-------|-------|
| Mon | Design Patterns | THREE_LEVEL_NOTES Topic 22, T06 (patterns) |
| Tue | DSA hard practice | DSA_Coding_Patterns.md — write from scratch |
| Wed | Q&A Q1–Q50 mock | M09 |
| Thu | Q&A Q51–Q100 mock | M09 |
| Fri | Full mock interview (system design + coding + Q&A) | All files |
| Sat | Gap filling | Weakest topics only |
| Sun | QUICK_REFERENCE + rest | QUICK_REFERENCE.md |

---

## DAILY HABIT (non-negotiable, every single day)

```
Morning (5 min):
  Read today's topics from QUICK_REFERENCE (skim the relevant section).
  Say out loud: "Today I am learning [topic]. I already know [related topic]."

Evening (10 min):
  Close all files.
  Write from memory: 5 things you learned today.
  If you can't write them → re-read that section tomorrow morning.
```

---

## WHAT TO STUDY WHEN — TOPIC TO FILE MAPPING

| Topic | THREE_LEVEL_NOTES | Terms File | Master File | Q&A (M09) |
|-------|------------------|------------|-------------|-----------|
| JVM / JDK / JRE | Topic 1 | T02 | M01 (JVM section) | Q1 |
| OOP — 4 Pillars | Topic 2 | T01 | M01 (OOP section) | Q2, Q10, Q20 |
| Memory & GC | Topic 3 | T02 | M01 (Memory section) | Q94–Q97 |
| Collections | Topic 4 | T03 | M02 (Part 1-3) | Q6–Q7, Q21–Q27 |
| Generics | Topic 5 | T01 | M01 (Generics) | Q11 |
| Exceptions | Topic 6 | T04 | M01 (Exceptions) | Q9 |
| Java 8 Streams | Topic 7 | T03 | M03 (Part 2) | Q23–Q30 |
| Concurrency | Topic 8 | T03 | M03 (Part 1) | Q36–Q48 |
| Spring Core | Topic 9 | T05 | M04 (Part 1-3) | Q49–Q54 |
| Spring Boot | Topic 10 | T05 | M04 (Part 4) | Q53, Q57 |
| Spring MVC | Topic 11 | T05 | M04 (Part 5-6) | Q55–Q57 |
| Spring Security | Topic 12 | T05 | M04 (Part 7-8) | Q55 |
| JPA/Hibernate | Topic 13 | T04 | M05 | Q65, Q81–Q90 |
| SQL/Database | Topic 14 | T04 | M05 (SQL section) | Q87–Q90 |
| Microservices | Topic 15 | T05 | M06 | Q66–Q80 |
| Kafka | Topic 16 | T05 | M06 (Kafka) | Q67, Q74 |
| Redis | Topic 17 | T05 | M06 (Redis) | Q73 |
| Resilience | Topic 18 | T05 | M06 (Resilience) | Q66, Q76 |
| Testing | Topic 19 | T06 | M07 (Part 1-4) | Q91–Q93 |
| Docker/K8s | Topic 20 | T06 | M07 (Part 5-6) | Q92 |
| System Design | Topic 21 | T06 | M08 | Q (system design) |
| Design Patterns | Topic 22 | T06 | M01, M04 | Q20 |
| Modern Java | Topic 23 | T03 | M10 | Q (modern java) |

---

## 3 RULES FOR EVERY STUDY SESSION

```
RULE 1: Read → Explain out loud → Teach it back to yourself.
         If you can't explain it simply, you don't know it yet.
         Go back to 🟢 Basic level.

RULE 2: Always connect to EHR examples.
         Never memorize in abstract. Ask: "How does this apply to
         PatientService, EcrSubmission, LabResult, AppointmentService?"

RULE 3: Use the QUICK_REFERENCE the night before the interview,
         not the M-files. The M-files are for learning.
         The QUICK_REFERENCE is for refreshing.
```

---

## INTERVIEW DAY CHECKLIST

```
Night before:
  ☐ Read QUICK_REFERENCE.md completely (45 min)
  ☐ Practice 3 STAR behavioral stories out loud
  ☐ Practice "Design an EHR system" out loud (5 min pitch)
  ☐ Sleep at least 7 hours

30 minutes before:
  ☐ QUICK_REFERENCE.md — Sections: 4 (Spring annotations), 5 (HTTP codes),
    7 (JPA transactions), 8 (Microservices), 15 (Last-minute reminders)
  ☐ Say out loud: HashMap internals (30 sec)
  ☐ Say out loud: N+1 and 3 solutions (30 sec)
  ☐ Say out loud: Circuit Breaker states (15 sec)

In the interview:
  ☐ Always clarify before answering system design
  ☐ Think out loud — they want to hear your reasoning
  ☐ Use EHR domain examples — shows real-world experience
  ☐ If you don't know → say "I haven't used that specific tool but
    the concept is similar to X which I know well"
  ☐ Connect your answers: "This is similar to what I described in
    the JPA N+1 question — same root cause..."
```

---

## YOUR PROGRESS TRACKER

Copy this and track daily:

```
WEEK 1
[ ] Day 1  — JVM + OOP + Memory
[ ] Day 2  — Collections + DSA
[ ] Day 3  — Java 8 + Exceptions + Modern Java
[ ] Day 4  — Concurrency + Virtual Threads
[ ] Day 5  — Spring Core + Spring Boot + MVC
[ ] Day 6  — Spring Security + JPA/Hibernate
[ ] Day 7  — REST + Review

WEEK 2
[ ] Day 8  — Microservices + Resilience + System Design
[ ] Day 9  — Kafka + Redis
[ ] Day 10 — Testing + Docker/K8s
[ ] Day 11 — Advanced JVM + Production + Design Patterns
[ ] Day 12 — Mock Interview Day
[ ] Day 13 — Gap Filling
[ ] Day 14 — Light Review + REST ← YOU ARE READY
```
