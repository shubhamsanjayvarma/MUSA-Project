import PDFDocument from 'pdfkit';
import { prisma } from '../db/client.js';
import { AuthUser } from '../api/middleware/auth.js';

export interface PillarStatus {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  violations: { eventType: string; label: string; count: number }[];
}

export interface SessionReportData {
  session: {
    id: string;
    interviewId: string;
    interviewTitle: string;
    candidateName: string;
    candidateEmail: string;
    startedAt: string;
    endedAt: string | null;
    duration: string;
    finalScore: number;
    peakScore: number;
    riskState: string;
    totalEvents: number;
  };
  pillars: {
    identity: PillarStatus;
    gaze: PillarStatus;
    audio: PillarStatus;
    environment: PillarStatus;
  };
  keyIncidents: {
    id: string;
    timestamp: string;
    eventType: string;
    severity: string;
    scoreBefore: number;
    scoreAfter: number;
    deduction: number;
  }[];
  evidenceCount: number;
  review: {
    decision: string;
    notes: string;
    reviewedAt: string;
  } | null;
  generatedAt: string;
}

export class ReportService {
  async getReportData(sessionId: string, requester: AuthUser): Promise<SessionReportData | null> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        interview: true,
        events: {
          orderBy: { serverTimestamp: 'asc' },
        },
        evidenceItems: true,
        review: true,
      },
    });

    if (!session) return null;

    // Check authorization
    if (requester.role === 'recruiter' && session.interview.recruiterId !== requester.id) {
      return null;
    }
    if (requester.role === 'candidate' && session.id !== requester.id) {
      return null;
    }

    // Format duration
    const end = session.endedAt || new Date();
    const durationMs = Math.max(0, end.getTime() - session.startedAt.getTime());
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    const duration = `${hours}:${minutes}:${seconds}`;

    // Count event types
    const counts: Record<string, number> = {};
    for (const ev of session.events) {
      counts[ev.eventType] = (counts[ev.eventType] || 0) + 1;
    }

    // 4 Pillars definition
    const identityPillar: PillarStatus = {
      name: 'Identity & Deepfake Defense',
      status:
        (counts['face_swap_detected'] || 0) > 0 || (counts['multiple_faces'] || 0) >= 2
          ? 'fail'
          : (counts['face_absent'] || 0) > 2 || (counts['multiple_faces'] || 0) > 0
            ? 'warning'
            : 'pass',
      violations: [
        { eventType: 'face_absent', label: 'Face Absence', count: counts['face_absent'] || 0 },
        { eventType: 'multiple_faces', label: 'Multiple Faces in Frame', count: counts['multiple_faces'] || 0 },
        { eventType: 'face_swap_detected', label: 'Face Swap / Manipulation', count: counts['face_swap_detected'] || 0 },
      ],
    };

    const gazePillar: PillarStatus = {
      name: 'Visual & Gaze Tracking',
      status:
        (counts['unusual_gaze_direction'] || 0) > 3 || (counts['face_orientation_off'] || 0) > 4
          ? 'warning'
          : 'pass',
      violations: [
        { eventType: 'face_orientation_off', label: 'Orientation Deviation', count: counts['face_orientation_off'] || 0 },
        { eventType: 'unusual_gaze_direction', label: 'Off-Screen / Teleprompter Gaze', count: counts['unusual_gaze_direction'] || 0 },
      ],
    };

    const audioPillar: PillarStatus = {
      name: 'Audio-Visual Sync & Voice Integrity',
      status:
        (counts['voice_cloning_detected'] || 0) > 0
          ? 'fail'
          : (counts['av_mismatch'] || 0) > 1 || (counts['audio_silence_extended'] || 0) > 1
            ? 'warning'
            : 'pass',
      violations: [
        { eventType: 'av_mismatch', label: 'Lip-Sync / Audio Mismatch', count: counts['av_mismatch'] || 0 },
        { eventType: 'voice_cloning_detected', label: 'Synthetic Voice Cloning', count: counts['voice_cloning_detected'] || 0 },
        { eventType: 'audio_silence_extended', label: 'Extended Silence', count: counts['audio_silence_extended'] || 0 },
      ],
    };

    const environmentPillar: PillarStatus = {
      name: 'Screen & Environment Compartmentalization',
      status:
        (counts['screen_share_stopped'] || 0) > 0
          ? 'fail'
          : (counts['tab_hidden'] || 0) > 1
            ? 'warning'
            : 'pass',
      violations: [
        { eventType: 'tab_hidden', label: 'Tab Switches', count: counts['tab_hidden'] || 0 },
        { eventType: 'screen_share_stopped', label: 'Screen Share Revocation', count: counts['screen_share_stopped'] || 0 },
      ],
    };

    // Filter top non-zero penalty incidents
    const keyIncidents = session.events
      .filter((ev) => ev.severity !== 'info' && ev.scoreBefore !== ev.scoreAfter)
      .slice(0, 15)
      .map((ev) => ({
        id: ev.id,
        timestamp: ev.serverTimestamp.toLocaleTimeString(),
        eventType: ev.eventType,
        severity: ev.severity,
        scoreBefore: ev.scoreBefore ?? 0,
        scoreAfter: ev.scoreAfter ?? 0,
        deduction: (ev.scoreAfter ?? 0) - (ev.scoreBefore ?? 0),
      }));

    return {
      session: {
        id: session.id,
        interviewId: session.interviewId,
        interviewTitle: session.interview.title,
        candidateName: session.interview.candidateName,
        candidateEmail: session.interview.candidateEmail,
        startedAt: session.startedAt.toISOString(),
        endedAt: session.endedAt ? session.endedAt.toISOString() : null,
        duration,
        finalScore: session.currentIntegrityScore,
        peakScore: session.peakIntegrityScore,
        riskState: session.currentRiskState,
        totalEvents: session.events.length,
      },
      pillars: {
        identity: identityPillar,
        gaze: gazePillar,
        audio: audioPillar,
        environment: environmentPillar,
      },
      keyIncidents,
      evidenceCount: session.evidenceItems.length,
      review: session.review
        ? {
            decision: session.review.decision,
            notes: session.review.notes ?? '',
            reviewedAt: session.review.reviewedAt.toISOString(),
          }
        : null,
      generatedAt: new Date().toISOString(),
    };
  }

  async generatePdf(report: SessionReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `InterviewShield Report - ${report.session.candidateName}`,
            Author: 'InterviewShield AI Proctoring System',
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // Primary Header
        doc.rect(40, 40, 515, 60).fill('#0f172a');
        doc.fillColor('#ffffff').fontSize(20).text('INTERVIEWSHIELD', 55, 52, { bold: true } as any);
        doc.fontSize(10).fillColor('#94a3b8').text('Candidate Integrity & Multimodal Proctoring Audit Report', 55, 76);

        // Candidate & Session Information Box
        let y = 115;
        doc.rect(40, y, 515, 75).strokeColor('#e2e8f0').lineWidth(1).stroke();
        doc.fillColor('#1e293b').fontSize(10).text(`Candidate: ${report.session.candidateName}`, 55, y + 12);
        doc.fillColor('#64748b').text(`Email: ${report.session.candidateEmail}`, 55, y + 26);
        doc.text(`Interview: ${report.session.interviewTitle}`, 55, y + 40);
        doc.text(`Session ID: ${report.session.id}`, 55, y + 54);

        doc.fillColor('#1e293b').text(`Duration: ${report.session.duration}`, 320, y + 12);
        doc.fillColor('#64748b').text(`Started: ${new Date(report.session.startedAt).toLocaleString()}`, 320, y + 26);
        doc.text(`Evidence Snapshots: ${report.evidenceCount}`, 320, y + 40);
        doc.text(`Total Events Logged: ${report.session.totalEvents}`, 320, y + 54);

        // Score & Verdict Section
        y = 205;
        const score = report.session.finalScore;
        const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
        const riskLabel = report.session.riskState.toUpperCase().replace('_', ' ');

        doc.rect(40, y, 515, 50).fillAndStroke('#f8fafc', '#e2e8f0');
        doc.fillColor('#0f172a').fontSize(12).text('Final Integrity Score:', 55, y + 18);
        doc.fillColor(scoreColor).fontSize(22).text(`${score}/100`, 185, y + 12, { bold: true } as any);
        doc.fillColor('#0f172a').fontSize(12).text(`Status: `, 280, y + 18);
        doc.fillColor(scoreColor).fontSize(14).text(riskLabel, 330, y + 17, { bold: true } as any);

        // 4-Pillar Evaluation Matrix
        y = 270;
        doc.fillColor('#0f172a').fontSize(14).text('4-Pillar Multimodal Integrity Matrix', 40, y);
        y += 20;

        const pillars = [
          report.pillars.identity,
          report.pillars.gaze,
          report.pillars.audio,
          report.pillars.environment,
        ];

        pillars.forEach((p, idx) => {
          const colX = 40 + (idx % 2) * 265;
          const rowY = y + Math.floor(idx / 2) * 95;
          const statusBg = p.status === 'pass' ? '#ecfdf5' : p.status === 'warning' ? '#fffbeb' : '#fef2f2';
          const statusText = p.status === 'pass' ? '#059669' : p.status === 'warning' ? '#d97706' : '#dc2626';

          doc.rect(colX, rowY, 250, 85).fillAndStroke(statusBg, '#e2e8f0');
          doc.fillColor('#0f172a').fontSize(10).text(p.name, colX + 10, rowY + 10, { bold: true } as any);
          doc.fillColor(statusText).fontSize(9).text(`[ ${p.status.toUpperCase()} ]`, colX + 190, rowY + 10);

          let vY = rowY + 28;
          p.violations.forEach((v) => {
            doc.fillColor('#475569').fontSize(8).text(`• ${v.label}: ${v.count} incident(s)`, colX + 12, vY);
            vY += 14;
          });
        });

        // Key Incidents Table
        y = 485;
        doc.fillColor('#0f172a').fontSize(14).text('Significant Incident Log', 40, y);
        y += 20;

        // Table Header
        doc.rect(40, y, 515, 20).fill('#e2e8f0');
        doc.fillColor('#334155').fontSize(9);
        doc.text('Time', 50, y + 6);
        doc.text('Threat Event', 120, y + 6);
        doc.text('Severity', 270, y + 6);
        doc.text('Score Delta', 380, y + 6);
        doc.text('Score After', 465, y + 6);
        y += 20;

        if (report.keyIncidents.length === 0) {
          doc.fillColor('#64748b').fontSize(9).text('Zero negative risk anomalies recorded during session.', 50, y + 8);
          y += 25;
        } else {
          report.keyIncidents.slice(0, 7).forEach((inc) => {
            doc.rect(40, y, 515, 18).strokeColor('#f1f5f9').stroke();
            doc.fillColor('#475569').fontSize(8);
            doc.text(inc.timestamp, 50, y + 5);
            doc.text(inc.eventType, 120, y + 5);
            doc.text(inc.severity.toUpperCase(), 270, y + 5);
            doc.fillColor('#ef4444').text(`${inc.deduction}`, 380, y + 5);
            doc.fillColor('#1e293b').text(`${inc.scoreAfter}`, 465, y + 5);
            y += 18;
          });
        }

        // Recruiter Verdict Box
        y = Math.max(y + 15, 660);
        doc.rect(40, y, 515, 60).fillAndStroke('#f8fafc', '#cbd5e1');
        doc.fillColor('#0f172a').fontSize(11).text('Recruiter Review Decision:', 55, y + 10, { bold: true } as any);
        if (report.review) {
          doc.fillColor('#2563eb').fontSize(11).text(report.review.decision.toUpperCase(), 215, y + 10, { bold: true } as any);
          doc.fillColor('#475569').fontSize(9).text(`Notes: ${report.review.notes || 'None provided'}`, 55, y + 28);
          doc.fillColor('#94a3b8').fontSize(8).text(`Reviewed on: ${new Date(report.review.reviewedAt).toLocaleString()}`, 55, y + 44);
        } else {
          doc.fillColor('#64748b').fontSize(10).text('PENDING RECRUITER VERDICT', 215, y + 10);
          doc.fontSize(8).text('This session has not yet received a finalized human proctor verdict.', 55, y + 32);
        }

        // Footer
        doc.fillColor('#94a3b8').fontSize(8).text(
          `Generated automatically by InterviewShield Engine at ${new Date(report.generatedAt).toUTCString()} • Cryptographically Verified Audit Log`,
          40,
          780,
          { align: 'center', width: 515 }
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const reportService = new ReportService();
