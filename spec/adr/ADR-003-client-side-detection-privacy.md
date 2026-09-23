# ADR-003: Client-Side Edge Inference for Privacy & Scalability

> **Status:** Accepted
> **Context:** Media processing and signal extraction placement for InterviewShield.

```yaml
adr_record:
  adr_id: "ADR-003"
  title: "Client-Side Edge Inference for Privacy and Scalability"
  status: "Accepted"
  date: "2026-09-23"
  decision_makers:
    - "Privacy Officer"
    - "Lead Vision Engineer"

  context_and_problem_statement: >
    The system needs to extract face presence, face count, orientation, mouth movement, and audio activity
    from candidate webcam and mic streams. Transmitting continuous raw video and audio to the server introduces
    massive bandwidth costs, heavy server GPU requirements, severe candidate surveillance concerns, and complex
    GDPR biometric data storage liabilities.

  options_considered:
    option_1_server_side_media_streaming:
      description: "Candidate streams WebRTC video/audio to media server (Kurento/Janus/LiveKit); server runs computer vision."
      pros:
        - "Centralized compute and closed-source proprietary vision models"
        - "Guaranteed compute resources independent of candidate machine capabilities"
      cons:
        - "Bandwidth explosion: 2 Mbps video upload per candidate (100 candidates = 200 Mbps continuous)"
        - "Server requires expensive GPU clusters or multi-threaded CPU video decoders"
        - "Severe privacy backlash: candidates' continuous video stored on third-party servers"
        - "Regulatory liability under GDPR/CCPA for biometric video ingestion"

    option_2_client_side_edge_inference:
      description: "Candidate browser runs MediaPipe FaceDetector via WebAssembly/WebGL and Web Audio API locally. Only JSON events and sparse snapshots transmit."
      pros:
        - "Privacy by Design: Raw video and audio streams NEVER leave the candidate's browser memory"
        - "Zero server video bandwidth: each candidate transmits ~1-2 KB/s of JSON events"
        - "Server compute is near zero: merely stores JSON records and executes math functions"
        - "Scales effortlessly from 1 to 10,000 concurrent sessions on commodity server hardware"
        - "Compliance alignment: no continuous biometric surveillance records exist to breach"
      cons:
        - "Inference performance depends on candidate browser WebGL and CPU capabilities"
        - "Adversarial candidate could hypothetically tamper with client-side JavaScript memory"

  decision_outcome:
    chosen_option: "Option 2: Client-Side Edge Inference"
    rationale: >
      Edge inference achieves total privacy preservation, satisfies the Zero Continuous Recording mandate,
      and reduces backend infrastructure costs to near zero. A pre-interview system check guarantees
      browser WebGL compatibility before candidate interview entry.

  consequences:
    positive:
      - "Candidate confidence and trust are maximized"
      - "Zero cloud media storage bills"
      - "Server infrastructure stays lean and easy to deploy"
    negative:
      - "Low-end devices (< 4GB RAM, no GPU) may require throttling frame rate to 1 FPS"

  revisit_triggers:
    - "Client hardware fragmentation causes > 10% system check failure rate across target candidate pool"
```
