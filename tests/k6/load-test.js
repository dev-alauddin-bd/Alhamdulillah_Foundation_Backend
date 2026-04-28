import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp up to 50 users
    { duration: '20s', target: 100 }, // Stay at 100 users
    { duration: '10s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

const BASE_URL = 'http://localhost:5000/api';

export default function () {
  // 1. Test Projects Endpoint
  const projectsRes = http.get(`${BASE_URL}/projects`);
  check(projectsRes, {
    'projects status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // 2. Test Login Endpoint (if you want to test load on auth)
  const loginPayload = JSON.stringify({
    email: 'super1@gmail.com',
    password: '123456',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, params);
  check(loginRes, {
    'login status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}
