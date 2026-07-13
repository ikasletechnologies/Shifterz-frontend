// Public API for job-card module
// External code must ONLY import from this file, never from internal paths
export { JobCardPage } from "./page/JobCardPage";
export { useJobCards } from "./hooks/useJobCards";
export {
  getJobCards,
  createJobCard,
  updateJobCard,
  deleteJobCard,
} from "./services/job-card.service";
export type { JobCard, JobCardFormData, JobCardStats, JobPriority, JobStatus } from "./types/job-card.types";
export { JOB_PRIORITIES, JOB_STATUSES, JOB_SERVICES, PRIORITY_COLORS, STATUS_COLORS } from "./constants/job-card.constants";
