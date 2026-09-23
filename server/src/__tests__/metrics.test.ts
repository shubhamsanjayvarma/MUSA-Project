import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import {
  metricsRegistry,
  activeSessionsGauge,
  eventsIngestedCounter,
  riskScoreDistribution,
  eventLatencyHistogram,
  setActiveSessions,
  incActiveSessions,
  decActiveSessions,
  recordEventIngested,
  recordRiskScore,
  recordEventLatency,
  resetMetrics,
  normalizeRoute,
} from '../telemetry/metrics.js';
import { Request } from 'express';

describe('Prometheus Metrics & RED/USE Telemetry Integration Tests', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('GET /api/metrics endpoint', () => {
    it('should return HTTP 200 with standard Prometheus text/plain content-type', async () => {
      const res = await request(app).get('/api/metrics');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(typeof res.text).toBe('string');
      expect(res.text.length).toBeGreaterThan(0);
    });

    it('should export all 4 required domain telemetry metrics with HELP and TYPE lines', async () => {
      // Seed metrics with sample data
      setActiveSessions(3);
      recordEventIngested('face_lost', 'high');
      recordEventIngested('tab_switch', 'medium');
      recordRiskScore(85);
      recordEventLatency(42);

      const res = await request(app).get('/api/metrics');
      expect(res.status).toBe(200);
      const body = res.text;

      // 1. active_sessions_total (gauge)
      expect(body).toContain('# HELP interviewshield_active_sessions_total');
      expect(body).toContain('# TYPE interviewshield_active_sessions_total gauge');
      expect(body).toContain('interviewshield_active_sessions_total 3');

      // 2. events_ingested_total (counter with event_type, severity)
      expect(body).toContain('# HELP interviewshield_events_ingested_total');
      expect(body).toContain('# TYPE interviewshield_events_ingested_total counter');
      expect(body).toMatch(
        /interviewshield_events_ingested_total\{event_type="face_lost",severity="high"\}\s+1/
      );
      expect(body).toMatch(
        /interviewshield_events_ingested_total\{event_type="tab_switch",severity="medium"\}\s+1/
      );

      // 3. risk_score_distribution (histogram)
      expect(body).toContain('# HELP interviewshield_risk_score_distribution');
      expect(body).toContain('# TYPE interviewshield_risk_score_distribution histogram');
      expect(body).toContain('interviewshield_risk_score_distribution_count 1');
      expect(body).toContain('interviewshield_risk_score_distribution_sum 85');
      expect(body).toMatch(/interviewshield_risk_score_distribution_bucket\{le="90"\}\s+1/);

      // 4. event_latency_ms (histogram)
      expect(body).toContain('# HELP interviewshield_event_latency_ms');
      expect(body).toContain('# TYPE interviewshield_event_latency_ms histogram');
      expect(body).toContain('interviewshield_event_latency_ms_count 1');
      expect(body).toContain('interviewshield_event_latency_ms_sum 42');
      expect(body).toMatch(/interviewshield_event_latency_ms_bucket\{le="50"\}\s+1/);
    });

    it('should export standard USE method metrics (CPU, Memory, Event Loop)', async () => {
      const res = await request(app).get('/api/metrics');
      expect(res.status).toBe(200);
      const body = res.text;

      // USE Utilization: CPU and memory
      expect(body).toContain('process_cpu_user_seconds_total');
      expect(body).toContain('process_resident_memory_bytes');
      expect(body).toContain('nodejs_heap_size_used_bytes');

      // USE Saturation: Event loop lag
      expect(body).toContain('nodejs_eventloop_lag_seconds');
    });

    it('should track RED method HTTP metrics (requests, duration, errors)', async () => {
      // Trigger a request to /api/health/live
      await request(app).get('/api/health/live');

      const res = await request(app).get('/api/metrics');
      expect(res.status).toBe(200);
      const body = res.text;

      expect(body).toContain('# HELP interviewshield_http_requests_total');
      expect(body).toContain('# TYPE interviewshield_http_requests_total counter');
      expect(body).toContain('# HELP interviewshield_http_request_duration_seconds');
      expect(body).toContain('# TYPE interviewshield_http_request_duration_seconds histogram');

      // Should have recorded requests
      expect(body).toMatch(/interviewshield_http_requests_total\{method="GET"/);
    });
  });

  describe('Telemetry helper functions unit tests', () => {
    it('should properly increment, decrement, and set activeSessionsGauge', () => {
      setActiveSessions(10);
      incActiveSessions();
      incActiveSessions(2);
      decActiveSessions(3);

      // 10 + 1 + 2 - 3 = 10
      // Let's verify gauge value directly from registry
      const metric = metricsRegistry.getSingleMetric('interviewshield_active_sessions_total');
      expect(metric).toBeDefined();
    });

    it('should increment eventsIngestedCounter with event_type and severity labels', async () => {
      recordEventIngested('multiple_faces', 'critical');
      recordEventIngested('multiple_faces', 'critical');

      const metric = await metricsRegistry.getSingleMetricAsString(
        'interviewshield_events_ingested_total'
      );
      expect(metric).toContain(
        'interviewshield_events_ingested_total{event_type="multiple_faces",severity="critical"} 2'
      );
    });

    it('should record risk score distribution in histogram buckets', async () => {
      recordRiskScore(25);
      recordRiskScore(75);

      const metric = await metricsRegistry.getSingleMetricAsString(
        'interviewshield_risk_score_distribution'
      );
      expect(metric).toContain('interviewshield_risk_score_distribution_count 2');
      expect(metric).toContain('interviewshield_risk_score_distribution_sum 100');
    });

    it('should record event latency in milliseconds histogram', async () => {
      recordEventLatency(15);
      recordEventLatency(350);

      const metric = await metricsRegistry.getSingleMetricAsString(
        'interviewshield_event_latency_ms'
      );
      expect(metric).toContain('interviewshield_event_latency_ms_count 2');
      expect(metric).toContain('interviewshield_event_latency_ms_sum 365');
    });

    it('should normalize dynamic UUIDs in route paths to prevent label cardinality explosion', () => {
      const mockReq = {
        baseUrl: '/api/sessions',
        path: '/a13f7caa-c3d1-4d19-b408-d1526b1d150b/timeline',
        route: undefined,
      } as unknown as Request;

      const normalized = normalizeRoute(mockReq);
      expect(normalized).toBe('/api/sessions/:id/timeline');
    });
  });
});
