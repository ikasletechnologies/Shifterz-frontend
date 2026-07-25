"use client";

import { useState, useCallback, useEffect } from "react";
import { CarEntry } from "../types/vehicle-checkin.types";
import {
  getVehicleCheckIns,
  createVehicleCheckIn,
  updateVehicleCheckIn,
  checkOutVehicle,
  deleteVehicleCheckIn
} from "../services/vehicle-checkin.service";
import { toast } from "react-hot-toast";

export function useVehicleCheckin() {
  const [cars, setCars] = useState<CarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCars = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getVehicleCheckIns();
      setCars(data || []);
    } catch (err) {
      console.error("Failed to fetch vehicle check-ins:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const handleCreateVehicleCheckIn = async (carData: Partial<CarEntry>) => {
    try {
      const newCar = await createVehicleCheckIn(carData);
      setCars((prev) => [...prev, newCar]);
      return newCar;
    } catch (err) {
      console.error("Failed to create vehicle check-in:", err);
      toast.error("Failed to save vehicle check-in. Please try again.");
      return null;
    }
  };

  const handleUpdateVehicleCheckIn = async (id: string, carData: Partial<CarEntry>) => {
    try {
      await updateVehicleCheckIn(id, carData);
      await fetchCars();
      return true;
    } catch (err) {
      console.error("Failed to update vehicle check-in:", err);
      toast.error("Failed to update vehicle check-in. Please try again.");
      return false;
    }
  };

  const handleDeleteVehicleCheckIn = async (car: CarEntry) => {
    try {
      await deleteVehicleCheckIn(car.id);
      setCars((prev) => prev.filter(c => c.id !== car.id));
      toast.success(`Vehicle ${car.entryId || car.id} deleted successfully`);
      return true;
    } catch (err) {
      console.error("Failed to delete vehicle check-in:", err);
      toast.error("Failed to delete vehicle check-in. Please try again.");
      return false;
    }
  };

  const handleVehicleCheckOut = async (selectedCar: CarEntry, outData: any) => {
    try {
      // Optimistic update
      setCars((prev) =>
        prev.map((car) =>
          car.id === selectedCar.id
            ? { ...car, status: "Out", outTime: outData.outTime }
            : car
        )
      );

      await checkOutVehicle(selectedCar.id, {
        status: "Out",
        outTime: outData.outTime,
      });

      return true;
    } catch (err) {
      console.error("Failed to check out vehicle:", err);
      toast.error("Failed to check out vehicle. Please try again.");
      fetchCars(); // Revert optimistic update
      return false;
    }
  };

  return {
    cars,
    isLoading,
    fetchCars,
    handleCreateVehicleCheckIn,
    handleUpdateVehicleCheckIn,
    handleDeleteVehicleCheckIn,
    handleVehicleCheckOut,
  };
}
