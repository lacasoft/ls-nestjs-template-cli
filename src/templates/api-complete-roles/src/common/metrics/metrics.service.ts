import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

/**
 * MetricsService - Prometheus Metrics
 *
 * Provides application metrics for monitoring and observability:
 * - HTTP request counters (by method, path, status)
 * - Response time histograms
 * - Error rate counters
 * - Default system metrics (CPU, memory, etc.)
 */
@Injectable()
export class MetricsService {
  private readonly registry: Registry;

  // HTTP Metrics
  public readonly httpRequestsTotal: Counter<string>;
  public readonly httpRequestDuration: Histogram<string>;
  public readonly httpErrorsTotal: Counter<string>;

  // Authentication Metrics
  public readonly authAttemptsTotal: Counter<string>;
  public readonly authFailuresTotal: Counter<string>;

  constructor() {
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, event loop, etc.)
    collectDefaultMetrics({ register: this.registry });

    // HTTP Request Counter
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    // HTTP Request Duration Histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5], // 1ms to 5s
      registers: [this.registry],
    });

    // HTTP Errors Counter
    this.httpErrorsTotal = new Counter({
      name: 'http_errors_total',
      help: 'Total number of HTTP errors (4xx and 5xx)',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    // Authentication Attempts Counter
    this.authAttemptsTotal = new Counter({
      name: 'auth_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['type'], // login, refresh, register
      registers: [this.registry],
    });

    // Authentication Failures Counter
    this.authFailuresTotal = new Counter({
      name: 'auth_failures_total',
      help: 'Total number of authentication failures',
      labelNames: ['type', 'reason'], // type: login/refresh, reason: invalid_credentials/token_expired/etc
      registers: [this.registry],
    });
  }

  /**
   * Record an HTTP request
   */
  recordHttpRequest(method: string, path: string, statusCode: number, duration: number): void {
    const status = statusCode.toString();

    // Increment request counter
    this.httpRequestsTotal.inc({ method, path, status });

    // Record request duration
    this.httpRequestDuration.observe({ method, path, status }, duration);

    // Increment error counter if 4xx or 5xx
    if (statusCode >= 400) {
      this.httpErrorsTotal.inc({ method, path, status });
    }
  }

  /**
   * Record an authentication attempt
   */
  recordAuthAttempt(type: 'login' | 'refresh' | 'register'): void {
    this.authAttemptsTotal.inc({ type });
  }

  /**
   * Record an authentication failure
   */
  recordAuthFailure(type: 'login' | 'refresh' | 'register', reason: string): void {
    this.authFailuresTotal.inc({ type, reason });
  }

  /**
   * Create a custom counter
   */
  createCounter(name: string, help: string, labelNames?: string[]): Counter {
    return new Counter({
      name,
      help,
      labelNames,
      registers: [this.registry],
    });
  }

  /**
   * Create a custom histogram
   */
  createHistogram(
    name: string,
    help: string,
    buckets?: number[],
    labelNames?: string[],
  ): Histogram {
    return new Histogram({
      name,
      help,
      buckets,
      labelNames,
      registers: [this.registry],
    });
  }

  /**
   * Get all metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get the registry instance
   */
  getRegistry(): Registry {
    return this.registry;
  }
}
