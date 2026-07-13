export type WorkshopJobStatus =
  | "Assigned"
  | "In Progress"
  | "Paused"
  | "Completed"
  | "Waiting QC"
  | "QC Passed"
  | "QC Failed"
  | "Rework";

export interface WorkshopJob {
  id: string;
  vehicle: string;
  customer: string;
  service: string;
  technician: string;
  technicianId?: string;
  priority: string;
  status: WorkshopJobStatus;
  startDate: string;
  estCompletion: string;
  actualCompletion?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  photos?: string[];
  materials?: MaterialRecord[];
  progressLogs?: ProgressLog[];
}

export interface MaterialRecord {
  id?: string;
  jobId: string;
  name: string;
  quantity: number;
  unit: string;
  addedAt: string;
}

export interface ProgressLog {
  status: string;
  timestamp: string;
  note?: string;
}

export interface WorkshopStats {
  myJobs: number;
  pending: number;
  inProgress: number;
  completedToday: number;
  sentToQC: number;
}
