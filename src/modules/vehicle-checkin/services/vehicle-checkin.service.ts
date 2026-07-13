import { apiCall } from "@/services/api.client";
import { CarEntry } from "../types/vehicle-checkin.types";

export async function getVehicleCheckIns(): Promise<CarEntry[]> {
  return apiCall("/carin");
}

export async function createVehicleCheckIn(data: Partial<CarEntry>): Promise<CarEntry> {
  return apiCall("/carin", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateVehicleCheckIn(id: string, data: Partial<CarEntry>): Promise<CarEntry> {
  return apiCall(`/carin/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function checkOutVehicle(id: string, data: Partial<CarEntry>): Promise<CarEntry> {
  return apiCall(`/carin/${id}/checkout`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteVehicleCheckIn(id: string): Promise<void> {
  return apiCall(`/carin/${id}`, { method: "DELETE" });
}
