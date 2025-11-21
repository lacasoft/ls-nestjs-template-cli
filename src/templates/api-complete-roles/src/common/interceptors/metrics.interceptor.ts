import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics/metrics.service';

/**
 * MetricsInterceptor
 *
 * Automatically records metrics for all HTTP requests:
 * - Request count by method, path, and status
 * - Request duration
 * - Error rates
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const startTime = Date.now();
    const { method, path } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000; // Convert to seconds
          const statusCode = response.statusCode;

          this.metricsService.recordHttpRequest(method, path, statusCode, duration);
        },
        error: (error) => {
          const duration = (Date.now() - startTime) / 1000;
          const statusCode = error.status || 500;

          this.metricsService.recordHttpRequest(method, path, statusCode, duration);
        },
      }),
    );
  }
}
