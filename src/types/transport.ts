export interface TransportRoute {
  routeId?: string;
  routeName: string;
  pickupStartTime: string;
  dropStartTime: string;
  vehicleName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
}

export interface StudentTransportDetails {
  studentId: string;
  routeName: string;
  pickupStop: string;
  dropStop: string;
  pickupTime: string;
  dropTime: string;
  vehicleName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  feeStatus: string;
}

export interface TransportAssignRequest {
  routeId: string;
  pickupStop: string;
  dropStop: string;
  pickupTime: string;
  dropTime: string;
  feeStatus: string;
}