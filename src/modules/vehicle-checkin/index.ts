// Public API for vehicle-checkin module
// External code must ONLY import from this file, never from internal paths
export { VehicleCheckinPage } from "./page/VehicleCheckinPage";
export { useVehicleCheckin } from "./hooks/useVehicleCheckin";
export {
  getVehicleCheckIns,
  createVehicleCheckIn,
  updateVehicleCheckIn,
  checkOutVehicle,
  deleteVehicleCheckIn,
} from "./services/vehicle-checkin.service";
export type { CarEntry } from "./types/vehicle-checkin.types";
