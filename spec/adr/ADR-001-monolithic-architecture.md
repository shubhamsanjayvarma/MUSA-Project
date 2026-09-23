# ADR-001: Monolithic Architecture over Microservices

> **Status:** Accepted
> **Context:** Architectural decomposition decision for InterviewShield V1 MVP (MUSA CodeX 2026 Round 2).

```yaml
adr_record:
  adr_id: "ADR-001"
  title: "Monolithic Architecture over Microservices"
  status: "Accepted"
  date: "2026-09-23"
  decision_makers:
    - "System Architect"
    - "Security Engineer"
  
  context_and_problem_statement: >
    InterviewShield requires real-time WebSocket event ingestion, deterministic risk calculation,
    REST API serving, and database transactions for 1-5 concurrent evaluation sessions.
    The architecture must optimize for low operational complexity, zero inter-service network latency,
    and straightforward local deployment by competition evaluators.

  options_considered:
    option_1_microservices:
      description: "Separate services for Auth, Ingestion, Risk Engine, Evidence, and Reporting with Kafka/RabbitMQ."
      pros:
        - "Independent horizontal scalability of ingestion vs reporting"
        - "Isolated failure domains"
      cons:
        - "Massive operational overhead: multiple containers, service discovery, distributed tracing"
        - "Network serialization latency across service hops violates sub-100ms risk update budget"
        - "High setup friction for hackathon judges evaluating on single laptop"
        - "Distributed transactions require complex Saga patterns"

    option_2_modular_monolith:
      description: "Single Node.js/TypeScript process running Express REST API and 'ws' WebSocket server with distinct domain modules."
      pros:
        - "Zero inter-service network serialization latency"
        - "Single port / single process deployment (`docker compose up` or `npm run dev`)"
        - "In-memory function calls between WebSocket handler, Event Processor, and Risk Engine"
        - "Shared TypeScript type definitions without npm private registry or packaging overhead"
        - "ACID transaction guarantees within single PostgreSQL instance"
      cons:
        - "Scaling requires scaling entire process (acceptable for MVP capacity targets)"

  decision_outcome:
    chosen_option: "Option 2: Modular Monolith"
    rationale: >
      A modular monolith satisfies all functional and non-functional requirements with minimal operational friction.
      The risk engine executes as a pure in-memory function directly following database insertion, achieving < 20ms total latency.
    
  consequences:
    positive:
      - "Setup for hackathon judges is one command: npm run dev"
      - "Zero distributed queue failure modes or split-brain partitions"
      - "Refactoring domain boundaries is simple within a single codebase"
    negative:
      - "WebSocket connections and REST requests share the Node.js event loop; event loop lag must be monitored"

  revisit_triggers:
    - "Concurrent sessions exceed 500 active interviews"
    - "Evidence storage throughput saturates single host I/O limits"
```
