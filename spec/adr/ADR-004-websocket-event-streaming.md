# ADR-004: Raw WebSocket Protocol with Client Sequence Buffering

> **Status:** Accepted
> **Context:** Transport protocol and network disconnect recovery for telemetry streaming.

```yaml
adr_record:
  adr_id: "ADR-004"
  title: "Raw WebSocket Protocol with Client Sequence Buffering"
  status: "Accepted"
  date: "2026-09-23"
  decision_makers:
    - "Network Systems Engineer"
    - "Frontend Architect"

  context_and_problem_statement: >
    Detection events occur asynchronously at 2 FPS and must be transmitted with sub-second latency to the server.
    Network interruptions (e.g. WiFi drops, latency spikes) must not cause event loss, and reconnections must
    not result in duplicate deductions or risk calculation corruption.

  options_considered:
    option_1_http_rest_polling_or_batching:
      description: "Client batches events every 5-10 seconds and sends via HTTP POST."
      pros:
        - "Standard stateless HTTP"
        - "Simple load balancer handling"
      cons:
        - "High latency: events delayed by batch window (5-10s), destroying real-time recruiter awareness"
        - "High HTTP header overhead for high-frequency small JSON payloads"

    option_2_socket_io_abstraction:
      description: "Use Socket.IO library for transport fallback and room abstractions."
      pros:
        - "Built-in automatic reconnection"
      cons:
        - "Excessive proprietary wire protocol overhead"
        - "Polling fallbacks cause unpredictable state desynchronization"
        - "Heavy client and server bundle sizes"

    option_3_standard_rfc6455_websocket_with_event_buffer:
      description: "Native WebSocket with client-side sequence-numbered FIFO EventBuffer and server deduplication."
      pros:
        - "Zero vendor lock-in; lightweight standard WebSocket protocol"
        - "Full duplex sub-second latency (< 50ms transport delay)"
        - "Deterministic sequence numbers (1, 2, 3...) per session handle deduplication via PostgreSQL unique index"
        - "EventBuffer transparently holds up to 500 events offline and replays unacknowledged messages upon reconnect"
      cons:
        - "Reconnection logic and heartbeat ping/pong must be explicitly implemented"

  decision_outcome:
    chosen_option: "Option 3: Standard RFC 6455 WebSocket with EventBuffer"
    rationale: >
      A lightweight native WebSocket connection provides the lowest latency, minimal CPU overhead,
      and deterministic ordering. The client-side EventBuffer combined with database unique constraints
      `(session_id, sequence_number)` guarantees exactly-once processing semantics without distributed overhead.

  consequences:
    positive:
      - "Instant event arrival at server (< 100ms total latency from detection to database)"
      - "Zero data loss during network hiccups up to ~4 minutes of offline buffering"
      - "Simple, clean protocol easily auditable and mockable in unit tests"
    negative:
      - "Requires dedicated heartbeat timer (every 15s) and connection state machines on both ends"

  revisit_triggers:
    - "Firewall or proxy environments blocking WebSocket traffic exceed 5% of candidate sessions"
```
