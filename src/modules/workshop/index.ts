// Public API for workshop module
// External code must ONLY import from this file, never from internal paths
export { WorkshopPage } from "./page/WorkshopPage";
export { useWorkshop } from "./hooks/useWorkshop";
export {
  getMyJobs,
  startWork,
  pauseWork,
  resumeWork,
  completeWork,
  uploadPhotos,
  recordMaterial,
  sendToQC,
  updateProgress,
} from "./services/workshop.service";
export type {
  WorkshopJob,
  WorkshopStats,
  MaterialRecord,
  ProgressLog,
  WorkshopJobStatus,
} from "./types/workshop.types";
export {
  WORKSHOP_STATUSES,
  WORKSHOP_STATUS_FLOW,
  WORKSHOP_STATUS_COLORS,
} from "./constants/workshop.constants";
