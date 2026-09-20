# InterviewShield — Demo Script

> **Project**: InterviewShield — MUSA CodeX 2026 Round 2
> **Team**: Harrington's Tech
> **Audience**: MUSA CodeX Judges

---

## Pre-Demo Setup

### 5 Minutes Before Demo

1. **Start the system** (if not already running):
   ```bash
   npm run dev
   ```
   Verify: server on `:3001`, client on `:5173`

2. **Open two browser windows** (or use two devices):
   - **Window 1 (Recruiter)**: `http://localhost:5173/login`
   - **Window 2 (Candidate)**: Keep blank for now

3. **Login as recruiter**:
   - Email: `recruiter@demo.interviewshield.dev`
   - Password: `demo123`
   - Verify: Dashboard loads with interview list

4. **Ensure good lighting** for face detection
5. **Have a second person** nearby (for the "multiple faces" demo)
6. **Close unnecessary tabs/apps** to avoid accidental triggers

---

## Demo Flow (~5 Minutes)

### Act 1: The Problem (30 seconds)

> **Talking points** (while showing the recruiter dashboard):
>
> "Remote interviews create a trust problem. Recruiters can't verify who they're actually speaking with. There's no reliable way to know if a candidate is receiving off-screen help, using an interview proxy, or switching between applications during the session.
>
> InterviewShield solves this — not by making automated decisions, but by giving recruiters objective, timestamped evidence for human review."

---

### Act 2: Recruiter Creates Interview (45 seconds)

**Actions in Recruiter window:**

1. Click **"Create Interview"** button
2. Fill in:
   - Title: `Senior Developer Interview`
   - Candidate Name: `Alex Demo`
   - Candidate Email: `alex@example.com`
3. Click **"Create"**
4. **Copy the join link** shown in the confirmation

> **Talking points:**
>
> "The recruiter creates an interview and gets a secure, single-use join link for the candidate. This link expires after 48 hours and can only be used once."

---

### Act 3: Candidate Joins (60 seconds)

**Actions in Candidate window:**

1. **Paste the join link** → System Check page loads
2. Walk through system check:
   - ✅ Camera detected
   - ✅ Microphone detected
   - ✅ Screen share available
   - ✅ Browser compatible
3. Click **"Continue to Consent"**
4. Read the consent text (briefly highlight what's monitored vs. what isn't)
5. Check the consent box → Click **"Begin Interview"**
6. Interview page loads: camera preview visible, status indicators green

> **Talking points:**
>
> "The candidate goes through a system check to ensure their hardware is compatible. Then they see a clear consent form explaining exactly what is monitored and what is NOT stored — we never record continuous video or audio. Monitoring only begins after explicit consent."

---

### Act 4: Normal Behavior (30 seconds)

**Actions in Candidate window:**

1. Sit normally in front of camera
2. Speak naturally for 15-20 seconds

**Point to Recruiter window:**
- Show: Score stays at **100**, status **Normal** (green)
- Show: Timeline is quiet — no anomaly events

> **Talking points:**
>
> "During normal behavior, the integrity score stays at 100. The system is monitoring but detects nothing suspicious. This is important — a normal interview should feel normal."

---

### Act 5: Trigger Anomalies (2 minutes)

This is the core demo. Execute these in sequence, pausing briefly between each to show the impact.

#### 5a. Tab Switch (~20 seconds)

1. **Alt-Tab** away from the interview tab (or click another tab)
2. Wait 2-3 seconds
3. Switch back

**Show Recruiter window:**
- `tab_hidden` event appears in timeline (severity: 🟠 high)
- Score dropped by ~10 points
- Explanation: *"Candidate switched away from interview tab"*

> "Tab switch detected instantly. The score drops, and the recruiter sees exactly when it happened and for how long."

#### 5b. Face Absent (~20 seconds)

1. **Cover the camera** with your hand (or turn away completely)
2. Wait 4-5 seconds
3. Uncover / face the camera again

**Show Recruiter window:**
- `face_absent` event after ~3 seconds (severity: 🟡 medium)
- Evidence snapshot shows the empty/covered frame
- Score dropped by ~5 points

> "When the candidate's face disappears for more than 3 seconds, the system captures a snapshot and logs the event. Brief absences like sneezing are tolerated by the debounce."

#### 5c. Multiple Faces (~20 seconds)

1. Have a **second person lean into the camera frame**
2. Wait 2-3 seconds
3. Second person leaves

**Show Recruiter window:**
- `multiple_faces` event (severity: 🟠 high)
- Evidence snapshot clearly shows two faces
- Score dropped by ~15 points
- Risk state may have changed to **Attention** (yellow)

> "This is one of the strongest signals. The system detected a second face, captured a snapshot as evidence, and the score dropped significantly. But notice — we haven't labeled anyone as a cheater. We've flagged a moment for review."

#### 5d. Screen Share Stop (~15 seconds)

1. If screen share is active, **click "Stop sharing"** in the browser prompt
2. Wait a moment

**Show Recruiter window:**
- `screen_share_stopped` event (severity: 🔴 critical)
- Score dropped by ~20 points
- Risk state likely **Suspicious** (orange) or **High Risk** (red)

> "Stopping screen share is the most critical signal. The system immediately flags it."

#### 5e. Score Recovery (~15 seconds)

1. Sit normally, speak calmly for 15-20 seconds
2. Point to the score

> "Notice the score has started to recover slightly. InterviewShield allows recovery during normal behavior, so a single accidental tab switch doesn't permanently ruin the session. The system is fair."

---

### Act 6: Recruiter Reviews (60 seconds)

**Actions in Recruiter window:**

1. Click on the session to open **Session Detail**
2. Show the **Integrity Score** gauge (current value, color-coded)
3. Scroll through the **Event Timeline**:
   - Point out: each event has a type, severity badge, timestamp, and confidence
   - Point out: events with evidence have a viewable snapshot
4. Click on the **multiple_faces** event → show the **evidence snapshot**
5. Show the **explanation text** for a score change

> "The recruiter sees everything in one place: the integrity score, a chronological timeline of events, and evidence snapshots. Every score change has an explanation. There are no black boxes."

6. Click **"Review Session"**
7. Select **"Flag for review"**
8. Add notes: *"Multiple faces detected at 10:20. Recommend follow-up interview."*
9. Submit

> "The recruiter makes the final decision — pass, flag, or inconclusive. The system informed the decision. The human made it."

---

### Act 7: Key Message (30 seconds)

> "InterviewShield is built on three principles:
>
> **One**: AI flags. Humans review. The system never decides if someone is cheating.
>
> **Two**: Flag the moment, not the person. Every event is a timestamped observation, not a character judgment.
>
> **Three**: Transparent and explainable. Every score change has a reason. Recruiters see exactly what happened and when.
>
> This is interview integrity monitoring done right — honest, transparent, and human-centered."

---

## Backup Plans

### If Face Detection Doesn't Work (hardware issue)
- Skip to tab switch and screen share demos — these are browser API-based and always work
- Explain: "Face detection uses MediaPipe, which requires WebGL. The other detectors are API-based and hardware-independent."

### If WebSocket Disconnects
- Show the event buffer concept: "Events are buffered locally and replayed on reconnection — no data loss."
- Reconnect and continue

### If Score Doesn't Update
- Check the server console for errors
- Show the event in the database directly as proof of processing

### If Judges Ask About Deepfake Detection
> "InterviewShield does not claim deepfake detection. We detect behavioral anomalies — face presence, tab switches, screen sharing, audio-visual consistency. These are verifiable signals. We believe honest, explainable detection is more valuable than unvalidated deepfake claims."

### If Judges Ask About Privacy
> "We process all detection locally in the candidate's browser. No video or audio is ever sent to our server. We only transmit structured event data and low-resolution snapshots at event time. Consent is explicit. Retention is bounded."

### If Judges Ask About Accuracy
> "We do not invent accuracy percentages. Our face detection uses Google's MediaPipe, a well-established model. Our risk scoring is deterministic and configurable. We can demonstrate exactly how the score changes for any given event sequence."

---

## Technical Setup Notes

### Minimum Hardware for Demo
- Laptop with webcam (720p+)
- Decent lighting (face detection needs it)
- Stable internet (for WebSocket)
- Chrome or Edge browser (best MediaPipe support)

### Environment
```bash
# Ensure everything is running
npm run dev

# Verify server
curl http://localhost:3001/api/health
# Expected: { "status": "ok" }

# Verify database
npm run db:seed  # Re-seed demo data if needed
```
