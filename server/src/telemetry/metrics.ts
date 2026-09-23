import { Registry, Gauge, Counter, Histogram, collectDefaultMetrics } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

/**
 * Prometheus metrics registry for InterviewShield
 */
export const metricsRegistry = new Registry();

// Collect USE (Utilization, Saturation, Errors) metrics for process and Node.js runtime
collectDefaultMetrics({
  register: metricsRegistry,
});

/**
 * Domain Metric: Active Interview Sessions (Gauge)
 * Tracks the number of concurrently active interview monitoring sessions.
 */
export const activeSessionsGauge = new Gauge({
  name: 'interviewshield_active_sessions_total',
  help: 'Total number of currently active interview sessions',
  registers: [metricsRegistry],
});

/**
 * Domain Metric: Ingested Detection Events (Counter)
 * Multi-dimensional counter tracking detection events ingested by event_type and severity.
 */
export const eventsIngestedCounter = new Counter({
  name: 'interviewshield_events_ingested_total',
  help: 'Total number of detection events ingested',
  labelNames: ['event_type', 'severity'] as const,
  registers: [metricsRegistry],
});

/**
 * Domain Metric: Risk Score Distribution (Histogram)
 * Histogram tracking distribution of calculated candidate integrity risk scores (0-100).
 */
export const riskScoreDistribution = new Histogram({
  name: 'interviewshield_risk_score_distribution',
  help: 'Distribution of integrity risk scores across evaluations (0-100)',
  buckets: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  registers: [metricsRegistry],
});

/**
 * Domain Metric: Event Ingestion Latency (Histogram)
 * Histogram tracking end-to-end event ingestion and processing latency in milliseconds.
 */
export const eventLatencyHistogram = new Histogram({
  name: 'interviewshield_event_latency_ms',
  help: 'Detection event ingestion and processing latency in milliseconds',
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  registers: [metricsRegistry],
});

/**
 * RED Telemetry: HTTP Requests Total (Rate)
 */
export const httpRequestsTotal = new Counter({
  name: 'interviewshield_http_requests_total',
  help: 'Total number of HTTP requests handled',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [metricsRegistry],
});

/**
 * RED Telemetry: HTTP Request Duration in Seconds (Duration)
 */
export const httpRequestDurationSeconds = new Histogram({
  name: 'interviewshield_http_request_duration_seconds',
  help: 'HTTP request execution latency distribution in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

/**
 * RED Telemetry: HTTP Errors Total (Errors)
 */
export const httpErrorsTotal = new Counter({
  name: 'interviewshield_http_errors_total',
  help: 'Total number of HTTP error responses (4xx and 5xx)',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [metricsRegistry],
});

/**
 * Helper to normalize request routes and prevent high-cardinality label explosions
 */
export function normalizeRoute(req: Request): string {
  if (req.route?.path) {
    const baseUrl = req.baseUrl || '';
    return `${baseUrl}${req.route.path}`;
  }
  const rawPath = req.baseUrl ? `${req.baseUrl}${req.path}` : (req.path || '/');
  return rawPath
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/[0-9]+(?=\/|$)/g, '/:numId');
}

/**
 * Express middleware for RED telemetry
 */
export function httpMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationSeconds = Number(end - start) / 1e9;
    const method = req.method;
    const route = normalizeRoute(req);
    const statusCode = res.statusCode.toString();

    httpRequestsTotal.inc({ method, route, status_code: statusCode });
    httpRequestDurationSeconds.observe({ method, route, status_code: statusCode }, durationSeconds);

    if (res.statusCode >= 400) {
      httpErrorsTotal.inc({ method, route, status_code: statusCode });
    }
  });

  next();
}

/**
 * Telemetry helper functions for application instrumentation
 */
export function setActiveSessions(count: number): void {
  activeSessionsGauge.set(count);
}

export function incActiveSessions(delta: number = 1): void {
  activeSessionsGauge.inc(delta);
}

export function decActiveSessions(delta: number = 1): void {
  activeSessionsGauge.dec(delta);
}

export function recordEventIngested(eventType: string, severity: string): void {
  eventsIngestedCounter.inc({ event_type: eventType, severity });
}

export function recordRiskScore(score: number): void {
  riskScoreDistribution.observe(score);
}

export function recordEventLatency(latencyMs: number): void {
  eventLatencyHistogram.observe(latencyMs);
}

/**
 * Reset all registered metrics (useful for isolated tests)
 */
export function resetMetrics(): void {
  activeSessionsGauge.reset();
  eventsIngestedCounter.reset();
  riskScoreDistribution.reset();
  eventLatencyHistogram.reset();
  httpRequestsTotal.reset();
  httpRequestDurationSeconds.reset();
  httpErrorsTotal.reset();
}
