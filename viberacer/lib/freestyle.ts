import { FreestyleSandboxes } from "freestyle-sandboxes";

// WARNING: Only use this in development/testing environments
// This disables certificate validation for Node.js
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export const freestyle = new FreestyleSandboxes({
  apiKey: process.env.FREESTYLE_API_KEY,
});

