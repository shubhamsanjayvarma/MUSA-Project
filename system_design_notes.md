# Production-Grade System Design Reference

> Purpose: a working checklist to consult **while building**, not an interview cram sheet.
> Original handwritten notes are folded in and expanded with the practical "why/when/watch-out" that actually matters when you're shipping something real. Skim the section headers as a pre-build checklist; drill into a section when you hit that decision point.

---

## 0. Requirements & Constraints (do this first, always)

- **Functional requirements**: what the system must *do* — write these as user stories/use cases before touching architecture.
- **Non-functional requirements (NFRs)**: constraints on *how well* it does it — latency, availability, consistency, cost, security posture. Pin numbers, not adjectives ("p99 < 200ms", not "fast").
- **Back-of-the-envelope estimation** *(missing from original notes — critical, do this before designing)*:
  - Expected QPS (peak vs average, read:write ratio)
  - Storage growth (per record size × records/day × retention)
  - Bandwidth (payload size × QPS)
  - This single exercise usually kills half your over-engineering instincts early.
- **Constraints**: team size, budget, deadline, compliance requirements (data residency, GDPR/HIPAA if applicable) — these shape the architecture as much as scale does.

---

## 1. Architecture & Design Patterns

- **Monolith vs Microservices**: default to modular monolith until you have a concrete scaling or team-boundary reason to split. Microservices buy you independent deploys/scaling at the cost of network calls, distributed debugging, and data consistency headaches.
- **Event-Driven Architecture**: decouples producers/consumers via events; good for async workflows, bad if you need strong read-after-write consistency without extra work.
- **Circuit Breaker**: stop hammering a failing downstream service; states = closed → open → half-open. Pair with sane timeouts, not just retries.
- **Event Sourcing**: store state as a sequence of events instead of current-state rows — gives you audit trail + replay for free, but adds complexity in querying current state (needs projections).
- **CQRS**: separate read and write models when read/write patterns diverge heavily. Often paired with Event Sourcing but doesn't require it.
- **SAGA pattern**: manage distributed transactions across services via a sequence of local transactions + compensating actions (choreography vs orchestration). Use when 2PC is off the table (it usually is, at scale).
- **Consistent Hashing**: minimizes re-distribution when nodes are added/removed (caches, sharded DBs, load balancers). Look at virtual nodes to avoid hot-spotting.

---

## 2. Data Layer

### Relational (SQL)
- ACID guarantees — know which isolation level you actually need (Read Committed is the common default; Serializable is expensive).
- Transactions — keep them short; long-running transactions hold locks and kill throughput.
- Indexing — B-Tree (range queries), Hash (equality), covering indexes to avoid table lookups. *Missing: over-indexing slows writes — every index is a write-time cost.*

### NoSQL
- **In-Memory** (Redis as a DB, not just cache)
- **Object Storage** (S3-style, for blobs/files, not queryable data)
- **Wide-column** (Cassandra) — write-heavy, tunable consistency, no joins
- *Missing categories worth adding*: Document stores (MongoDB — flexible schema, good for nested data), Key-Value (DynamoDB — predictable low-latency at scale), Graph DBs (Neo4j — relationship-heavy data)

### Scaling the Data Layer
- **Sharding**: split data horizontally across nodes — pick a shard key carefully (avoid hot shards); resharding later is painful, plan for it.
- **Partitioning**: split within one database (by range, list, or hash) — different from sharding (which is cross-node).
- **Replication**: leader-follower (read scaling, single write bottleneck) vs multi-leader/leaderless (write scaling, conflict resolution needed). Watch replication lag on reads.
- **Connection pooling** *(missing)* — don't let every request open a new DB connection; size the pool against DB max-connections, not app instance count.

### Consistency
- **CAP theorem** *(missing — foundational)*: under a network partition, choose Consistency or Availability, not both. Most real systems are actually PACELC-relevant (trade-off exists even without a partition, between latency and consistency).
- Consistency models: Strong, Eventual, Causal — pick per-use-case, not globally. (e.g., inventory count = strong; social feed = eventual is fine)
- **Distributed transactions/consensus** *(missing)*: 2PC (rarely used at scale), Raft/Paxos (leader election, used inside etcd/Zookeeper/Kafka internals) — you'll rarely implement these yourself, but you need to know what your infra is using underneath.

---

## 3. API Layer

- **API Design** — resource-oriented, consistent naming, pagination from day one (don't bolt it on later).
- **REST** vs **GraphQL** vs **SOAP** vs **gRPC** *(gRPC missing — worth adding for internal service-to-service calls, binary + fast + strongly typed via protobuf)*.
- **API Gateway** — auth, rate limiting, request routing, and protocol translation at the edge, so individual services don't reimplement it.
- **API Versioning** *(missing)* — URI versioning (`/v1/`) vs header-based; have a deprecation policy before you need one.

---

## 4. Communication & Messaging

- **Sync vs Async** — sync (REST/gRPC) is simpler to reason about but couples availability; async (queues/events) decouples but adds eventual consistency and debugging overhead.
- **Kafka** (log-based, high throughput, replay-able, consumer groups) vs **RabbitMQ** (traditional broker, routing flexibility, easier for task queues) vs **Pub/Sub** (fan-out to many consumers).
- **Dead Letter Queue** — always have one; a message that fails processing 3x shouldn't vanish or block the queue.
- **Delivery guarantees** *(missing)* — at-most-once, at-least-once, exactly-once (exactly-once is expensive/rare — usually you get at-least-once + idempotent consumers).
- **Ordering guarantees** *(missing)* — do you need per-key ordering (Kafka partitions) or is global ordering unnecessary?

---

## 5. Caching

- **Redis/Memcached** — Redis has richer data structures + persistence options; Memcached is simpler/purely in-memory.
- **L1/L2 cache** — L1 in-process (fast, not shared across instances), L2 distributed (shared, extra network hop).
- **Eviction**: LRU (recency), LFU (frequency), TTL (time-based) — pick based on access pattern, not habit.
- **Thundering Herd** — many requests miss cache simultaneously and hammer the DB; mitigate with request coalescing, jittered TTLs, or a lock-and-refresh pattern.
- **Cache invalidation strategy** *(missing — "there are only two hard problems in CS")*: write-through (consistent, slower writes), write-back (fast writes, risk of loss), cache-aside (most common, app manages it explicitly).

---

## 6. Security

*(Given your STRIDE background, treat this section as non-negotiable, not optional polish.)*

- **AuthN vs AuthZ** *(missing distinction)* — who you are vs what you're allowed to do. Don't conflate them in code.
- **OAuth → Encryption → JWT** flow as noted — but be explicit: JWTs are for stateless auth, not a session-management substitute; short expiry + refresh tokens, not long-lived tokens.
- **Encryption** — at rest (DB/disk-level, e.g. AES-256) and in transit (TLS everywhere, including internal service calls, not just the edge). *(missing specificity in original notes)*
- **Input validation / injection defense** *(missing)* — SQLi, XSS, command injection; validate at the boundary, never trust client input.
- **Secrets management** *(missing)* — never hardcode; use a vault (AWS Secrets Manager, HashiCorp Vault, etc.), rotate regularly.
- **Rate limiting / DDoS protection** — token bucket, leaky bucket, sliding window algorithms *(specific algorithms missing from original)*; apply at gateway level, not per-service.
- **Threat modeling** *(missing — you already do this)* — run STRIDE per major component before finalizing the design, not after an incident.

---

## 7. Networking & Infra

- **Protocols**: HTTP → TCP/UDP → WebSockets as noted, plus:
  - **DNS** — TTLs matter for failover speed; low TTL = faster failover, more DNS query load.
  - **Long Polling** vs **WebSockets** vs **SSE** *(SSE missing — simpler than WebSockets for server→client-only streams)*.
- **Load Balancer algorithms** *(missing specificity)*: round robin, least connections, weighted, consistent hashing (for sticky/cache-aware routing).
- **Reverse proxy vs forward proxy** *(missing)* — reverse proxy (nginx/Envoy) sits in front of your servers; know the difference before it comes up in a design review.
- **Service Discovery** *(missing)* — how services find each other's current IP/port at runtime (Consul, Eureka, or k8s-native DNS). Needed the moment you're not on a single static host list.
- **CDN** — edge caching for static assets; understand cache-control headers and invalidation/purge behavior, not just "put a CDN in front of it."

---

## 8. Scalability

- **Vertical** (bigger machine — simple, has a ceiling) vs **Horizontal** (more machines — needs statelessness).
- **Auto Scaling** — scale on the right signal (CPU is often a lagging/wrong metric; consider queue depth, request latency, custom metrics).
- **Stateless service design** *(missing but implied)* — session state, file uploads, etc. should live in shared storage (Redis/DB/S3), not on the instance, or horizontal scaling breaks.

---

## 9. Reliability & Resilience

- **SPOF** — identify every single point of failure explicitly (single DB instance, single LB, single region) and decide if it's acceptable for this system's criticality.
- **Redundancy / Failover** — active-active vs active-passive; know your failover time.
- **Idempotency** — retry-safe operations via idempotency keys; critical for payment/order systems especially.
- **Retries with backoff** *(missing)* — exponential backoff + jitter, always with a max-retry cap; naive retries amplify outages (retry storms).
- **Chaos Engineering** *(missing)* — deliberately inject failures (kill a node, add latency) in staging/prod to verify your resilience assumptions actually hold.

---

## 10. Performance

- **Response Time, Throughput, Concurrency** — know which one you're actually optimizing for; they trade off against each other.
- **Percentiles**: P50, P95, P99 as noted — **always look at P99, not average**; averages hide the tail that actually hurts users.
- **SLO / SLA / SLI** — SLI = the metric, SLO = your internal target, SLA = the external contract with consequences. Define all three, not just one.
- **Latency budgeting** *(missing)* — break your end-to-end latency target down per hop (network, DB, cache, compute) so you know where the budget actually goes.

---

## 11. Observability

- **Logging** — structured (JSON) logs, correlation/trace IDs across service boundaries.
- **Metrics** — RED (Rate, Errors, Duration) for services; USE (Utilization, Saturation, Errors) for resources.
- **Alerting** — alert on symptoms (user-facing SLO breach), not just causes (CPU high); avoid alert fatigue.
- **ELK stack** as noted — also consider **Prometheus + Grafana** for metrics *(missing)*, and **distributed tracing** (OpenTelemetry/Jaeger) *(missing — essential once you have more than 2-3 services, to see a request's full path)*.
- **Health checks** — liveness (is it up) vs readiness (is it ready to take traffic) — different checks, different consequences if conflated.

---

## 12. Deployment & Release *(missing entirely from original notes)*

- **CI/CD pipeline** — automated tests → build → deploy, with rollback built in from day one, not added after the first bad deploy.
- **Deployment strategies**: blue-green (instant switch, needs 2x infra), canary (gradual rollout with metrics gating), rolling (default, simplest, brief mixed-version window).
- **Infrastructure as Code** — Terraform/Pulumi/CloudFormation; infra changes should be reviewable, not manual console clicks.
- **Feature flags** — decouple deploy from release; ship dark, turn on when ready.

---

## 13. Storage

- **BLOB, Relational, Object Storage, HDFS** as noted — pick based on access pattern:
  - Object storage (S3): unstructured, cheap, high durability, not for low-latency random access.
  - HDFS: batch/analytics workloads, not transactional systems.
  - BLOB in a relational DB: fine for small files, avoid for large media (bloats backups).

---

## 14. Disaster Recovery

- **RPO** (Recovery Point Objective) — how much data loss is acceptable (drives backup frequency).
- **RTO** (Recovery Time Objective) — how much downtime is acceptable (drives failover automation investment).
- **Backup strategy** *(missing)* — automated, tested restores (an untested backup is a hope, not a plan), geographically separate from primary.
- **Multi-region** *(missing)* — only take this on if RTO/RPO genuinely demand it; it multiplies consistency and cost complexity significantly.

---

## 15. Cost Optimization

- Right-size before you auto-scale (a well-tuned single instance beats an over-provisioned fleet).
- Reserved/spot instances for predictable/interruptible workloads respectively.
- Storage lifecycle policies (hot → warm → cold → archive tiers) instead of keeping everything on expensive storage forever.
- Watch egress/bandwidth costs, not just compute — often the silent budget killer.

---

## 16. Governance & Compliance *(missing — directly relevant to your interests)*

- **Audit logging** — immutable, tamper-evident (hash-chained, as in your Agent Preflight CLI work) for anything security- or compliance-relevant.
- **Data governance** — classification (public/internal/sensitive/restricted), retention policies, right-to-delete handling if applicable (GDPR).
- **Access control** — least privilege by default, RBAC/ABAC, periodic access review — not just at initial design.
- **Compliance mapping** — if the domain touches health (HIPAA), payments (PCI-DSS), or EU users (GDPR), map requirements to design decisions explicitly, don't retrofit.

---

## 17. Pre-Ship Checklist (condensed)

- [ ] NFRs are numbers, not adjectives
- [ ] Every SPOF identified and consciously accepted or mitigated
- [ ] Retries have backoff + jitter + max cap
- [ ] All external-facing writes are idempotent
- [ ] Secrets are in a vault, not in code/env files committed to git
- [ ] TLS on every hop, not just the edge
- [ ] P99 latency measured, not just average
- [ ] Alerts fire on user-facing symptoms
- [ ] Distributed tracing wired across service boundaries
- [ ] Backups exist AND have been test-restored
- [ ] Rollback path exists for every deploy
- [ ] Threat model (STRIDE) done for the design, not just the code

---

*This doc is meant to grow — as you build, add the specific decisions and trade-offs you made per project (e.g., "Clinical Safety Agent: chose strong consistency for discharge records, eventual for activity logs") so it becomes a record of your own architectural reasoning, not just a generic checklist.*
