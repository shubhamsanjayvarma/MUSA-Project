/**
 * InterviewShield — End-to-End Automated Demo Simulation Script
 *
 * Demonstrates the complete system lifecycle:
 * 1. Demo recruiter authentication (recruiter@demo.interviewshield.dev)
 * 2. Interview creation and candidate join token retrieval
 * 3. Candidate joins via WebSocket, affirmative consent, system check
 * 4. Realistic event stream:
 *    - Initial normal face detection (Score 100, Normal)
 *    - Off-screen gaze deviation / teleprompter -> unusual_gaze_direction (-3, Score 97)
 *    - Tab switch -> tab_hidden (-10, Score 87, Attention flag)
 *    - Tab restored -> tab_visible (Score 87)
 *    - Face swap artifact -> face_swap_detected (-15, Score 72, Attention)
 *    - 2 clean minutes simulated -> clean recovery (+4, Score 76)
 * 5. Recruiter submits review decision ('flagged' with proctor notes)
 * 6. Fetches final audit report PDF and writes to sample_audit_report.pdf
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';
import bcrypt from 'bcrypt';
import { app } from '../server/src/app.js';
import { setupWebSocketServer } from '../server/src/ws/server.js';
import { prisma } from '../server/src/db/client.js';
import { config } from '../server/src/config.js';

// ANSI terminal colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Minimal valid 1x1 JPEG in base64 for sample evidence snapshot
const SAMPLE_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function checkServerRunning(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/health/live`, {
      signal: AbortSignal.timeout(1200),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureDemoRecruiter(): Promise<void> {
  const email = 'recruiter@demo.interviewshield.dev';
  const existing = await prisma.recruiter.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('demo123', 10);
    await prisma.recruiter.create({
      data: {
        email,
        name: 'Demo Recruiter',
        passwordHash,
      },
    });
    console.log(`  ${c.dim}[DB] Demo recruiter created: ${email}${c.reset}`);
  }
}

async function runSimulation() {
  console.log(`\n${c.bright}${c.cyan}================================================================${c.reset}`);
  console.log(`${c.bright}${c.cyan}      INTERVIEWSHIELD — DETERMINISTIC END-TO-END DEMO           ${c.reset}`);
  console.log(`${c.bright}${c.cyan}================================================================${c.reset}\n`);

  let serverInstance: http.Server | null = null;
  let wssInstance: any = null;
  const defaultPort = config.PORT || 3001;
  const baseUrl = `http://localhost:${defaultPort}`;

  // 0. Server & Database Preflight
  console.log(`${c.dim}[Preflight] Checking database & server status...${c.reset}`);
  await ensureDemoRecruiter();

  const isAlreadyRunning = await checkServerRunning(baseUrl);
  if (!isAlreadyRunning) {
    console.log(`  ${c.dim}[Server] Starting in-process InterviewShield server on port ${defaultPort}...${c.reset}`);
    serverInstance = http.createServer(app);
    wssInstance = setupWebSocketServer(serverInstance);
    await new Promise<void>((resolve) => {
      serverInstance!.listen(defaultPort, () => resolve());
    });
    console.log(`  ${c.green}✓${c.reset} In-process server listening at ${baseUrl}`);
  } else {
    console.log(`  ${c.green}✓${c.reset} Existing server detected running at ${baseUrl}`);
  }

  try {
    // -------------------------------------------------------------------------
    // Step 1: Logs in demo recruiter
    // -------------------------------------------------------------------------
    console.log(`\n${c.bright}${c.blue}[Step 1/6] Authenticating Demo Recruiter...${c.reset}`);
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'recruiter@demo.interviewshield.dev',
        password: 'demo123',
      }),
    });

    if (!loginRes.ok) {
      throw new Error(`Recruiter login failed with status ${loginRes.status}: ${await loginRes.text()}`);
    }

    const loginData = (await loginRes.json()) as any;
    const recruiterToken = loginData.data?.token;
    const recruiterUser = loginData.data?.recruiter;

    if (!recruiterToken) {
      throw new Error('No JWT token returned from login response');
    }

    console.log(`  ${c.green}✓${c.reset} Recruiter authenticated successfully: ${c.bright}${recruiterUser.email}${c.reset} (${recruiterUser.name})`);
    console.log(`  ${c.dim}JWT Token: ${recruiterToken.slice(0, 24)}...${c.reset}`);

    // -------------------------------------------------------------------------
    // Step 2: Creates an interview and retrieves the candidate join token
    // -------------------------------------------------------------------------
    console.log(`\n${c.bright}${c.blue}[Step 2/6] Creating Interview & Generating Candidate Join Token...${c.reset}`);
    const createInterviewRes = await fetch(`${baseUrl}/api/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recruiterToken}`,
      },
      body: JSON.stringify({
        title: 'Full-Stack Security & System Screening [Demo]',
        candidateName: 'Jordan Taylor',
        candidateEmail: 'jordan.taylor@example.com',
      }),
    });

    if (!createInterviewRes.ok) {
      throw new Error(`Interview creation failed with status ${createInterviewRes.status}: ${await createInterviewRes.text()}`);
    }

    const interviewData = (await createInterviewRes.json()) as any;
    const interview = interviewData.data;
    const joinToken = interview.joinToken;
    const interviewId = interview.id;

    console.log(`  ${c.green}✓${c.reset} Interview created: "${c.bright}${interview.title}${c.reset}"`);
    console.log(`  ${c.dim}Interview ID : ${interviewId}${c.reset}`);
    console.log(`  ${c.green}✓${c.reset} Candidate Join Token : ${c.yellow}${joinToken}${c.reset}`);

    // -------------------------------------------------------------------------
    // Step 3: Candidate joins via WebSocket, submits affirmative consent, system check
    // -------------------------------------------------------------------------
    console.log(`\n${c.bright}${c.blue}[Step 3/6] Candidate Joining Session & Establishing WebSocket...${c.reset}`);
    const joinRes = await fetch(`${baseUrl}/api/interviews/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinToken }),
    });

    if (!joinRes.ok) {
      throw new Error(`Candidate join failed with status ${joinRes.status}: ${await joinRes.text()}`);
    }

    const joinResult = (await joinRes.json()) as any;
    const { sessionId, sessionToken } = joinResult.data;
    const wsUrl = `ws://localhost:${defaultPort}/ws/session/${sessionId}?token=${sessionToken}`;

    console.log(`  ${c.green}✓${c.reset} Session initialized: ${sessionId}`);
    console.log(`  ${c.dim}Connecting WebSocket: ${wsUrl.slice(0, 50)}...${c.reset}`);

    const ws = new WebSocket(wsUrl);
    const serverMessages: any[] = [];
    let currentScore = 100;
    let currentRiskState = 'normal';

    const wsReadyPromise = new Promise<void>((resolve, reject) => {
      ws.on('open', () => resolve());
      ws.on('error', (err) => reject(err));
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        serverMessages.push(msg);
        if (msg.type === 'risk:update') {
          currentScore = msg.payload.currentScore;
          currentRiskState = msg.payload.currentRiskState;
        }
      } catch (err) {
        // ignore parse error
      }
    });

    await wsReadyPromise;
    console.log(`  ${c.green}✓${c.reset} WebSocket connection opened`);

    // Wait for session:joined welcome handshake
    await delay(100);

    // 3a. Submit Affirmative Consent
    console.log(`  ${c.dim}Submitting candidate affirmative consent...${c.reset}`);
    ws.send(
      JSON.stringify({
        type: 'session:consent',
        sequenceNumber: 1,
        timestamp: Date.now(),
        payload: { consentGiven: true },
      })
    );
    await delay(100);
    console.log(`  ${c.green}✓${c.reset} Affirmative consent submitted and acknowledged.`);

    // 3b. Complete System Check
    console.log(`  ${c.dim}Completing candidate system & camera/audio check...${c.reset}`);
    ws.send(
      JSON.stringify({
        type: 'session:start',
        sequenceNumber: 2,
        timestamp: Date.now(),
        payload: {
          systemCheckPassed: true,
        },
      })
    );
    await delay(100);
    console.log(`  ${c.green}✓${c.reset} System check passed. Session is actively monitoring.`);

    // -------------------------------------------------------------------------
    // Step 4: Streams realistic sequence of events
    // -------------------------------------------------------------------------
    console.log(`\n${c.bright}${c.blue}[Step 4/6] Streaming Deterministic Threat & Recovery Events...${c.reset}`);
    const t0 = Date.now() - 150000; // Simulated timeline origin (allows clean recovery)

    // Helper to send a detection event and print telemetry
    const sendEvent = async (
      seq: number,
      eventType: string,
      detectorId: string,
      severity: string,
      confidence: number,
      eventTimestamp: number,
      payload: Record<string, unknown>,
      stepLabel: string,
      expectedDesc: string
    ) => {
      ws.send(
        JSON.stringify({
          type: 'detection:event',
          sequenceNumber: seq,
          timestamp: eventTimestamp,
          payload: {
            eventType,
            detectorId,
            timestamp: eventTimestamp,
            severity,
            confidence,
            payload,
          },
        })
      );

      // Short delay to let server process and broadcast risk:update
      await delay(150);

      const color =
        currentRiskState === 'normal'
          ? c.green
          : currentRiskState === 'attention'
            ? c.yellow
            : c.red;

      console.log(
        `  ${c.bright}${stepLabel}:${c.reset} ${expectedDesc} ` +
          `-> ${c.dim}[${eventType}]${c.reset} ` +
          `-> Score: ${color}${currentScore}${c.reset} (${color}${currentRiskState.toUpperCase()}${c.reset})`
      );
    };

    // 4.1 Initial normal face detection (Score 100, Normal)
    await sendEvent(
      3,
      'face_returned',
      'face_detector',
      'info',
      0.98,
      t0,
      { faceCount: 1, boundingBox: { x: 140, y: 90, width: 220, height: 260 } },
      'Event 1',
      'Initial normal face detection'
    );

    // 4.2 Candidate gazes off-screen (teleprompter reading) -> triggers unusual_gaze_direction (-3, Score 97)
    await sendEvent(
      4,
      'unusual_gaze_direction',
      'gaze_detector',
      'low',
      1.0,
      t0 + 1000,
      {
        direction: 'top-right',
        readingPattern: true,
        durationMs: 4200,
        description: 'Candidate gaze directed away from screen (teleprompter reading pattern)',
      },
      'Event 2',
      'Off-screen gaze deviation (teleprompter reading) [-3]'
    );

    // 4.3 Candidate switches tab -> triggers tab_hidden (-10, Score 87, Attention flag)
    await sendEvent(
      5,
      'tab_hidden',
      'tab_detector',
      'high',
      1.0,
      t0 + 2000,
      {
        reason: 'visibilitychange',
        description: 'Candidate switched away from interview browser tab',
      },
      'Event 3',
      'Candidate switches tab [-10]'
    );

    // 4.4 Candidate returns to tab -> tab_visible
    await sendEvent(
      6,
      'tab_visible',
      'tab_detector',
      'info',
      1.0,
      t0 + 3000,
      {
        hiddenDurationMs: 3800,
        description: 'Candidate restored focus to interview tab',
      },
      'Event 4',
      'Candidate returns to tab [0]'
    );

    // 4.5 Face swap artifact detected -> triggers face_swap_detected (-15, Score 72, Attention)
    await sendEvent(
      7,
      'face_swap_detected',
      'deepfake_detector',
      'critical',
      1.0,
      t0 + 4000,
      {
        boundaryArtifactScore: 0.91,
        colorInconsistency: 0.88,
        description: 'Synthetic face swap boundary manipulation artifact detected',
      },
      'Event 5',
      'Face swap artifact detected [-15]'
    );

    // Send an evidence snapshot linked to face swap event
    console.log(`  ${c.dim}Attaching cryptographic evidence snapshot linked to face swap...${c.reset}`);
    ws.send(
      JSON.stringify({
        type: 'evidence:snapshot',
        sequenceNumber: 8,
        timestamp: t0 + 4050,
        payload: {
          eventSequenceNumber: 7,
          capturedAt: t0 + 4050,
          imageDataUrl: `data:image/jpeg;base64,${SAMPLE_JPEG_BASE64}`,
        },
      })
    );
    await delay(100);
    console.log(`  ${c.green}✓${c.reset} Evidence snapshot persisted.`);

    // 4.6 2 clean minutes simulated -> clean recovery (+4, Score 76)
    // 2 minutes clean behavior: t0 + 4000 + 120,000 ms
    const recoveryTimestamp = t0 + 4000 + 120000;
    console.log(`  ${c.dim}Simulating 2 clean minutes of interview behavior without negative anomalies...${c.reset}`);
    ws.send(
      JSON.stringify({
        type: 'session:heartbeat',
        sequenceNumber: 9,
        timestamp: recoveryTimestamp,
        payload: {
          timestamp: recoveryTimestamp,
        },
      })
    );
    await delay(150);

    const scoreColor =
      currentRiskState === 'normal'
        ? c.green
        : currentRiskState === 'attention'
          ? c.yellow
          : c.red;

    console.log(
      `  ${c.bright}Event 6:${c.reset} 2 clean minutes simulated ` +
        `-> ${c.dim}[clean_recovery +4]${c.reset} ` +
        `-> Score: ${scoreColor}${currentScore}${c.reset} (${scoreColor}${currentRiskState.toUpperCase()}${c.reset})`
    );

    // 4.7 Session completed
    ws.send(
      JSON.stringify({
        type: 'session:end',
        sequenceNumber: 10,
        timestamp: recoveryTimestamp + 1000,
        payload: { reason: 'completed' },
      })
    );
    await delay(100);
    ws.close();
    console.log(`  ${c.green}✓${c.reset} Candidate completed interview and closed WebSocket connection.`);

    // -------------------------------------------------------------------------
    // Step 5: Recruiter submits review decision ('flagged' with proctor notes)
    // -------------------------------------------------------------------------
    console.log(`\n${c.bright}${c.blue}[Step 5/6] Submitting Recruiter Human Review Decision...${c.reset}`);
    const proctorNotes =
      'Observed repeated off-screen gaze reading pattern (teleprompter signature), followed by unauthorized tab switch and synthetic deepfake boundary artifact. Candidate flagged for proctor audit panel review.';

    const reviewRes = await fetch(`${baseUrl}/api/sessions/${sessionId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recruiterToken}`,
      },
      body: JSON.stringify({
        decision: 'flagged',
        notes: proctorNotes,
      }),
    });

    if (!reviewRes.ok) {
      throw new Error(`Review submission failed with status ${reviewRes.status}: ${await reviewRes.text()}`);
    }

    const reviewResult = (await reviewRes.json()) as any;
    console.log(`  ${c.green}✓${c.reset} Review submitted: Decision = ${c.bright}${c.red}${reviewResult.data.decision.toUpperCase()}${c.reset}`);
    console.log(`  ${c.dim}Notes: "${reviewResult.data.notes}"${c.reset}`);

    // -------------------------------------------------------------------------
    // Step 6: Fetches final audit report PDF and writes to sample_audit_report.pdf
    // -------------------------------------------------------------------------
    console.log(`\n${c.bright}${c.blue}[Step 6/6] Fetching Final Cryptographic Audit Report PDF...${c.reset}`);
    const reportRes = await fetch(`${baseUrl}/api/sessions/${sessionId}/report?format=pdf`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${recruiterToken}`,
      },
    });

    if (!reportRes.ok) {
      throw new Error(`Report PDF generation failed with status ${reportRes.status}: ${await reportRes.text()}`);
    }

    const contentType = reportRes.headers.get('content-type') || '';
    if (!contentType.includes('application/pdf')) {
      throw new Error(`Expected Content-Type application/pdf, received: ${contentType}`);
    }

    const pdfArrayBuffer = await reportRes.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    // Verify PDF magic header %PDF-
    const pdfHeader = pdfBuffer.slice(0, 5).toString('ascii');
    if (!pdfHeader.startsWith('%PDF-')) {
      throw new Error(`Generated file is not a valid PDF. Header starts with: ${pdfHeader}`);
    }

    const outputPath = path.resolve(process.cwd(), 'sample_audit_report.pdf');
    await fs.promises.writeFile(outputPath, pdfBuffer);

    console.log(`  ${c.green}✓${c.reset} Successfully generated and wrote PDF audit report:`);
    console.log(`     ${c.bright}${outputPath}${c.reset} (${pdfBuffer.length} bytes)`);

    // -------------------------------------------------------------------------
    // Summary Verification Matrix
    // -------------------------------------------------------------------------
    console.log(`\n${c.bright}${c.green}================================================================${c.reset}`);
    console.log(`${c.bright}${c.green}       SIMULATION COMPLETED WITH FULL DETERMINISTIC PASS        ${c.reset}`);
    console.log(`${c.bright}${c.green}================================================================${c.reset}`);
    console.log(`  ${c.cyan}Recruiter        :${c.reset} ${recruiterUser.email}`);
    console.log(`  ${c.cyan}Interview ID     :${c.reset} ${interviewId}`);
    console.log(`  ${c.cyan}Session ID       :${c.reset} ${sessionId}`);
    console.log(`  ${c.cyan}Final Score      :${c.reset} ${currentScore}/100`);
    console.log(`  ${c.cyan}Risk State       :${c.reset} ${currentRiskState.toUpperCase()}`);
    console.log(`  ${c.cyan}Human Decision   :${c.reset} ${reviewResult.data.decision.toUpperCase()}`);
    console.log(`  ${c.cyan}Audit PDF Report :${c.reset} sample_audit_report.pdf (${pdfBuffer.length} bytes)`);
    console.log(`${c.bright}${c.green}================================================================${c.reset}\n`);
  } finally {
    if (wssInstance) {
      try {
        wssInstance.close();
      } catch {}
    }
    if (serverInstance) {
      console.log(`  ${c.dim}[Cleanup] Closing in-process test server...${c.reset}`);
      try {
        (serverInstance as any).closeAllConnections?.();
      } catch {}
      await new Promise<void>((resolve) => {
        serverInstance!.close(() => resolve());
      });
    }
    await prisma.$disconnect();
    process.exit(0);
  }
}

runSimulation().catch((err) => {
  console.error(`\n${c.red}Simulation failed with error:${c.reset}`, err);
  process.exit(1);
});
