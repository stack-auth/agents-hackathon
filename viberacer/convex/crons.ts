import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every minute to ensure monitoring is alive
crons.interval(
  "ensureMonitoring",
  { minutes: 1 },
  internal.stageMonitor.ensureMonitoring
);

// Run every 5 minutes as a deep backup
crons.interval(
  "deepMonitoringCheck", 
  { minutes: 5 },
  internal.stageMonitor.ensureMonitoring
);

export default crons;