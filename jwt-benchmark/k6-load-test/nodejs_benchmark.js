import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics'; // Optional: For custom trend metrics
import execution from 'k6/execution'; // Access execution context like VU ID

// --- Configuration ---

// Target URL: Default is localhost:3000. Override using environment variable:
// k6 run -e TARGET_URL=http://your-docker-ip:3000 fastjwt_benchmark.js
const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const JWT_IMPL = 'jose';
const API_ENDPOINT = `/auth/${JWT_IMPL}`;

// Optional: Define a custom trend metric for request duration specifically for this endpoint
const fastJwtReqDuration = new Trend('fastjwt_req_duration');

// --- k6 Options ---
export const options = {
  // Define the load profile using stages
  stages: [
    // Stage 1: Ramp-up slowly to find initial baseline/breaking point
    { duration: '2m', target: 25 },  
    // Stage 2: Increase load further
    { duration: '2m', target: 25 },  
    // Stage 2: Ramp down
    { duration: '1m', target: 0 },
  ],

  // Define thresholds for success criteria
  thresholds: {
    'http_req_failed': ['rate<0.01'],    // Fail test if error rate is higher than 1%
    'http_req_duration': ['p(95)<500'],  // 95% of requests must complete below 500ms (Adjust based on observed performance)
    'checks': ['rate>0.99'],             // More than 99% of checks must pass
    // Optional threshold on our custom metric:
    'fastjwt_req_duration': ['p(95)<500'], // 95% of these specific requests should be below 500ms
  },
};

// --- Main VU Logic ---
export default function () {
  // Generate a unique-ish User ID for this specific request iteration
  // Combining VU ID and iteration number ensures uniqueness across the test run
  const uniqueUserId = `testuser-${execution.vu.idInTest}-${execution.scenario.iterationInTest}`;

  // Define headers for the request
  const params = {
    headers: {
      'Content-Type': 'application/json', // Good practice, though no body is sent
      'x-user-id': uniqueUserId,
    },
    // Add tags to results for easier filtering
    tags: {
      endpoint: 'fastjwt_auth',
    },
  };

  // Construct the full URL
  const url = `${TARGET_URL}${API_ENDPOINT}`;

  // Send the POST request (body is null as none is required by the endpoint)
  const res = http.post(url, "{}", params);

  // Add the duration of this specific request to our custom trend metric
  fastJwtReqDuration.add(res.timings.duration);

  // Check the response status and content
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response body contains token': (r) => {
      try {
        // Safely check if response is valid JSON and has a 'token' string property
        const body = r.json(); // Attempt to parse JSON
        return typeof body === 'object' && body !== null && typeof body.token === 'string' && body.token.length > 10;
      } catch (e) {
        // Log error if JSON parsing fails or body is not as expected
        console.error(`[VU: ${execution.vu.idInTest} Iter: ${execution.scenario.iterationInTest}] Failed to parse response or validate token: ${e}. Response body: ${r.body}`);
        return false; // Check fails if parsing or validation fails
      }
    },
  });

  // Add a short sleep between iterations for each VU to simulate think time
  // Adjust or remove based on how aggressively you want to hit the endpoint
  //sleep(1); // Each VU waits 1 second before making the next request
}

// --- Optional: Teardown Function (runs once after test finishes) ---
export function teardown(data) {
  console.log(`\nFinished k6 test run for ${API_ENDPOINT} at ${TARGET_URL}`);
  // You can add custom summaries or export data here
  // Example: Log the 95th percentile duration for fastjwt requests
  // Note: Requires accessing metrics from 'data', which isn't directly available in teardown.
  // Aggregated metrics are printed automatically by k6.
}