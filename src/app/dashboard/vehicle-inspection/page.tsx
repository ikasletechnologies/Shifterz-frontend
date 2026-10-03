import { Suspense } from "react";
import { VehicleInspectionPage } from "@/modules/vehicle-checkin/page/VehicleInspectionPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VehicleInspectionPage />
    </Suspense>
  );
}
