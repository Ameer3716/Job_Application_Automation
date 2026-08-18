import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time', true);

// Configuration options
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 50 },  // Spike to 50 users (load test)
    { duration: '1m', target: 50 },   // Hold at 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests must complete below 500ms
    'errors': ['rate<0.01'],            // Error rate must be less than 1%
  },
};

const BASE_URL = 'http://localhost:3000/api';
const MOCK_TOKEN = 'mock-jwt-token-replace-with-real'; // In a real CI pipeline, inject this via ENV vars

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MOCK_TOKEN}`,
    },
  };

  // 1. Check Health (Unauthenticated)
  const healthRes = http.get(`${BASE_URL}/health`);
  const healthCheck = check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health returns ok': (r) => r.json('status') === 'ok',
  });
  errorRate.add(!healthCheck);
  responseTime.add(healthRes.timings.duration);

  // 2. Fetch Applications (Simulating Dashboard Load)
  const appsRes = http.get(`${BASE_URL}/applications?limit=20`, params);
  const appsCheck = check(appsRes, {
    'applications status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  errorRate.add(!appsCheck);
  responseTime.add(appsRes.timings.duration);

  sleep(1);

  // 3. Check Dashboard Stats (Complex Aggregation)
  const statsRes = http.get(`${BASE_URL}/applications/stats`, params);
  const statsCheck = check(statsRes, {
    'stats status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  errorRate.add(!statsCheck);
  responseTime.add(statsRes.timings.duration);

  sleep(2); // Simulate user think time
}
